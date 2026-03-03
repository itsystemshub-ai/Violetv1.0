# Ejemplos de Implementación - Arquitectura Modular
## Violet ERP

---

## 📦 Ejemplo Completo: Módulo Finance

### Estructura del Módulo

```
src/modules/finance/
├── components/
│   ├── FinanceDashboard.tsx
│   ├── LedgerManager.tsx
│   └── atoms/
│       └── AccountCard.tsx
├── hooks/
│   ├── useFinance.ts
│   └── useLedger.ts
├── services/
│   ├── accounting.service.ts
│   └── ledger.service.ts
├── pages/
│   └── FinancePage.tsx
├── types/
│   └── finance.types.ts
└── index.ts
```

---

## 🎯 1. Tipos e Interfaces

```typescript
// src/modules/finance/types/finance.types.ts

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: 'VES' | 'USD';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  entries: TransactionEntry[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: Date;
}

export interface TransactionEntry {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface LedgerReport {
  accountId: string;
  accountName: string;
  openingBalance: number;
  transactions: Transaction[];
  closingBalance: number;
  period: {
    from: Date;
    to: Date;
  };
}

// Interfaces de servicios (Dependency Inversion)
export interface IAccountingService {
  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account>;
  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
  updateAccount(id: string, data: Partial<Account>): Promise<Account>;
  deleteAccount(id: string): Promise<void>;
}

export interface ILedgerService {
  getTransactions(accountId: string, from: Date, to: Date): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  generateReport(accountId: string, from: Date, to: Date): Promise<LedgerReport>;
}
```

---

## 🔧 2. Servicios

```typescript
// src/modules/finance/services/accounting.service.ts

import { IAccountingService, Account } from '../types/finance.types';
import { localDb } from '@core/database/localDb';
import { syncEngine } from '@core/sync/SyncEngine';
import { AppError } from '@core/shared/error-handler';
import { z } from 'zod';

const AccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  balance: z.number(),
  currency: z.enum(['VES', 'USD']),
  parentId: z.string().uuid().optional()
});

export class AccountingService implements IAccountingService {
  async getAccounts(): Promise<Account[]> {
    try {
      // 1. Intentar obtener de local primero (Local-First)
      const accounts = await localDb.accounts.toArray();
      
      // 2. Sincronizar en background
      syncEngine.syncInBackground('accounts');
      
      return accounts;
    } catch (error) {
      throw new AppError(
        'FETCH_ACCOUNTS_ERROR',
        'Error al obtener cuentas',
        500
      );
    }
  }

  async getAccount(id: string): Promise<Account> {
    const account = await localDb.accounts.get(id);
    
    if (!account) {
      throw new AppError(
        'ACCOUNT_NOT_FOUND',
        `Cuenta ${id} no encontrada`,
        404
      );
    }
    
    return account;
  }

  async createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    // 1. Validar datos
    const validatedData = AccountSchema.parse(data);
    
    // 2. Crear cuenta
    const account: Account = {
      id: crypto.randomUUID(),
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 3. Guardar en local (Local-First)
    await localDb.accounts.add(account);
    
    // 4. Marcar para sincronización
    await syncEngine.enqueue({
      operation: 'CREATE',
      entity: 'account',
      data: account
    });
    
    return account;
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    // 1. Verificar que existe
    const existing = await this.getAccount(id);
    
    // 2. Actualizar
    const updated: Account = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    
    // 3. Guardar en local
    await localDb.accounts.put(updated);
    
    // 4. Marcar para sincronización
    await syncEngine.enqueue({
      operation: 'UPDATE',
      entity: 'account',
      data: updated
    });
    
    return updated;
  }

  async deleteAccount(id: string): Promise<void> {
    // 1. Verificar que existe
    await this.getAccount(id);
    
    // 2. Verificar que no tiene transacciones
    const hasTransactions = await localDb.transactions
      .where('entries')
      .anyOf([id])
      .count();
    
    if (hasTransactions > 0) {
      throw new AppError(
        'ACCOUNT_HAS_TRANSACTIONS',
        'No se puede eliminar una cuenta con transacciones',
        400
      );
    }
    
    // 3. Eliminar de local
    await localDb.accounts.delete(id);
    
    // 4. Marcar para sincronización
    await syncEngine.enqueue({
      operation: 'DELETE',
      entity: 'account',
      data: { id }
    });
  }
}

// Exportar instancia singleton
export const accountingService = new AccountingService();
```

```typescript
// src/modules/finance/services/ledger.service.ts

import { ILedgerService, Transaction, LedgerReport } from '../types/finance.types';
import { localDb } from '@core/database/localDb';
import { accountingService } from './accounting.service';

export class LedgerService implements ILedgerService {
  async getTransactions(accountId: string, from: Date, to: Date): Promise<Transaction[]> {
    return await localDb.transactions
      .where('date')
      .between(from, to)
      .filter(tx => 
        tx.entries.some(entry => entry.accountId === accountId)
      )
      .toArray();
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    // 1. Validar que la transacción está balanceada
    const totalDebit = data.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + e.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(
        'UNBALANCED_TRANSACTION',
        'La transacción no está balanceada',
        400
      );
    }
    
    // 2. Crear transacción
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date()
    };
    
    // 3. Guardar en local
    await localDb.transactions.add(transaction);
    
    // 4. Actualizar balances de cuentas
    for (const entry of transaction.entries) {
      const account = await accountingService.getAccount(entry.accountId);
      const newBalance = account.balance + entry.debit - entry.credit;
      await accountingService.updateAccount(entry.accountId, { balance: newBalance });
    }
    
    return transaction;
  }

  async generateReport(accountId: string, from: Date, to: Date): Promise<LedgerReport> {
    // 1. Obtener cuenta
    const account = await accountingService.getAccount(accountId);
    
    // 2. Obtener transacciones
    const transactions = await this.getTransactions(accountId, from, to);
    
    // 3. Calcular balance inicial
    const previousTransactions = await localDb.transactions
      .where('date')
      .below(from)
      .filter(tx => 
        tx.entries.some(entry => entry.accountId === accountId)
      )
      .toArray();
    
    const openingBalance = previousTransactions.reduce((balance, tx) => {
      const entry = tx.entries.find(e => e.accountId === accountId)!;
      return balance + entry.debit - entry.credit;
    }, 0);
    
    // 4. Calcular balance final
    const closingBalance = transactions.reduce((balance, tx) => {
      const entry = tx.entries.find(e => e.accountId === accountId)!;
      return balance + entry.debit - entry.credit;
    }, openingBalance);
    
    return {
      accountId,
      accountName: account.name,
      openingBalance,
      transactions,
      closingBalance,
      period: { from, to }
    };
  }
}

export const ledgerService = new LedgerService();
```

---


## 🎣 3. Hooks Personalizados

```typescript
// src/modules/finance/hooks/useFinance.ts

import { useState, useEffect } from 'react';
import { Account } from '../types/finance.types';
import { accountingService } from '../services/accounting.service';
import { useToast } from '@shared/components/ui/use-toast';

export function useFinance() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cuentas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAccount = await accountingService.createAccount(data);
      setAccounts(prev => [...prev, newAccount]);
      toast({
        title: 'Éxito',
        description: 'Cuenta creada correctamente'
      });
      return newAccount;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la cuenta',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    try {
      const updated = await accountingService.updateAccount(id, data);
      setAccounts(prev => prev.map(acc => acc.id === id ? updated : acc));
      toast({
        title: 'Éxito',
        description: 'Cuenta actualizada correctamente'
      });
      return updated;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la cuenta',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await accountingService.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      toast({
        title: 'Éxito',
        description: 'Cuenta eliminada correctamente'
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount
  };
}
```

```typescript
// src/modules/finance/hooks/useLedger.ts

import { useState } from 'react';
import { Transaction, LedgerReport } from '../types/finance.types';
import { ledgerService } from '../services/ledger.service';
import { useToast } from '@shared/components/ui/use-toast';

export function useLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState<LedgerReport | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadTransactions = async (accountId: string, from: Date, to: Date) => {
    try {
      setLoading(true);
      const data = await ledgerService.getTransactions(accountId, from, to);
      setTransactions(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las transacciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction = await ledgerService.createTransaction(data);
      setTransactions(prev => [...prev, newTransaction]);
      toast({
        title: 'Éxito',
        description: 'Transacción creada correctamente'
      });
      return newTransaction;
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const generateReport = async (accountId: string, from: Date, to: Date) => {
    try {
      setLoading(true);
      const data = await ledgerService.generateReport(accountId, from, to);
      setReport(data);
      return data;
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        variant: 'destructive'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    report,
    loading,
    loadTransactions,
    createTransaction,
    generateReport
  };
}
```

---

## 🎨 4. Componentes

```typescript
// src/modules/finance/components/atoms/AccountCard.tsx

import { Account } from '../../types/finance.types';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getTypeColor = (type: Account['type']) => {
    const colors = {
      asset: 'bg-green-500',
      liability: 'bg-red-500',
      equity: 'bg-blue-500',
      revenue: 'bg-purple-500',
      expense: 'bg-orange-500'
    };
    return colors[type];
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{account.name}</CardTitle>
          <Badge className={getTypeColor(account.type)}>
            {account.type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{account.code}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {formatCurrency(account.balance, account.currency)}
        </p>
      </CardContent>
    </Card>
  );
}
```

```typescript
// src/modules/finance/components/LedgerManager.tsx

import { useState } from 'react';
import { useLedger } from '../hooks/useLedger';
import { useFinance } from '../hooks/useFinance';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';

export function LedgerManager() {
  const { accounts } = useFinance();
  const { transactions, report, loading, loadTransactions, generateReport } = useLedger();
  
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const handleGenerateReport = async () => {
    if (!selectedAccount) return;
    await generateReport(selectedAccount, dateFrom, dateTo);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Seleccionar cuenta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.code} - {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Calendar
          mode="single"
          selected={dateFrom}
          onSelect={(date) => date && setDateFrom(date)}
        />

        <Calendar
          mode="single"
          selected={dateTo}
          onSelect={(date) => date && setDateTo(date)}
        />

        <Button onClick={handleGenerateReport} disabled={loading || !selectedAccount}>
          Generar Reporte
        </Button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded">
              <p className="text-sm text-muted-foreground">Balance Inicial</p>
              <p className="text-2xl font-bold">{report.openingBalance.toFixed(2)}</p>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm text-muted-foreground">Transacciones</p>
              <p className="text-2xl font-bold">{report.transactions.length}</p>
            </div>
            <div className="p-4 border rounded">
              <p className="text-sm text-muted-foreground">Balance Final</p>
              <p className="text-2xl font-bold">{report.closingBalance.toFixed(2)}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Débito</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.transactions.map((tx, index) => {
                const entry = tx.entries.find(e => e.accountId === selectedAccount)!;
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="text-right">{entry.debit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{entry.credit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">
                      {/* Calcular balance acumulado */}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

```typescript
// src/modules/finance/components/FinanceDashboard.tsx

import { useFinance } from '../hooks/useFinance';
import { AccountCard } from './atoms/AccountCard';
import { LedgerManager } from './LedgerManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Skeleton } from '@shared/components/ui/skeleton';

export function FinanceDashboard() {
  const { accounts, loading } = useFinance();

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Finanzas</h1>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Cuentas</TabsTrigger>
          <TabsTrigger value="ledger">Libro Mayor</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid grid-cols-3 gap-4">
            {accounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <LedgerManager />
        </TabsContent>

        <TabsContent value="reports">
          {/* Componente de reportes */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 📄 5. Páginas

```typescript
// src/modules/finance/pages/FinancePage.tsx

import { FinanceDashboard } from '../components/FinanceDashboard';
import { ErrorBoundary } from '@shared/components/feedback/ErrorBoundary';
import { ModuleAIAssistant } from '@core/ai/components/ModuleAIAssistant';

export function FinancePage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <FinanceDashboard />
        
        {/* Asistente de IA específico del módulo */}
        <ModuleAIAssistant 
          module="finance"
          context={{
            availableActions: [
              'crear cuenta',
              'registrar transacción',
              'generar reporte',
              'calcular IGTF'
            ]
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
```

---

## 📦 6. Barrel Export

```typescript
// src/modules/finance/index.ts

// Components
export { FinanceDashboard } from './components/FinanceDashboard';
export { LedgerManager } from './components/LedgerManager';
export { AccountCard } from './components/atoms/AccountCard';

// Hooks
export { useFinance } from './hooks/useFinance';
export { useLedger } from './hooks/useLedger';

// Services
export { accountingService } from './services/accounting.service';
export { ledgerService } from './services/ledger.service';

// Types
export type { Account, Transaction, LedgerReport } from './types/finance.types';

// Pages
export { FinancePage } from './pages/FinancePage';
```

---

## 🔌 7. Integración en App.tsx

```typescript
// src/app/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@shared/components/layout/Layout';
import { ProtectedRoute } from '@core/auth/components/ProtectedRoute';

// Lazy loading de módulos
import { lazy, Suspense } from 'react';
import { Skeleton } from '@shared/components/ui/skeleton';

const FinancePage = lazy(() => import('@modules/finance').then(m => ({ default: m.FinancePage })));
const InventoryPage = lazy(() => import('@modules/inventory').then(m => ({ default: m.InventoryPage })));
const SalesPage = lazy(() => import('@modules/sales').then(m => ({ default: m.SalesPage })));
const HRPage = lazy(() => import('@modules/hr').then(m => ({ default: m.HRPage })));

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            path="finance"
            element={
              <ProtectedRoute requiredPermission="finance.view">
                <Suspense fallback={<Skeleton className="h-screen" />}>
                  <FinancePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="inventory"
            element={
              <ProtectedRoute requiredPermission="inventory.view">
                <Suspense fallback={<Skeleton className="h-screen" />}>
                  <InventoryPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="sales"
            element={
              <ProtectedRoute requiredPermission="sales.view">
                <Suspense fallback={<Skeleton className="h-screen" />}>
                  <SalesPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="hr"
            element={
              <ProtectedRoute requiredPermission="hr.view">
                <Suspense fallback={<Skeleton className="h-screen" />}>
                  <HRPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---


## 🧪 8. Tests

```typescript
// src/modules/finance/services/__tests__/accounting.service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountingService } from '../accounting.service';
import { localDb } from '@core/database/localDb';
import { syncEngine } from '@core/sync/SyncEngine';

// Mock dependencies
vi.mock('@core/database/localDb');
vi.mock('@core/sync/SyncEngine');

describe('AccountingService', () => {
  let service: AccountingService;

  beforeEach(() => {
    service = new AccountingService();
    vi.clearAllMocks();
  });

  describe('getAccounts', () => {
    it('should return accounts from local database', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name: 'Caja', type: 'asset', balance: 1000, currency: 'VES' },
        { id: '2', code: '2000', name: 'Proveedores', type: 'liability', balance: 500, currency: 'VES' }
      ];

      vi.mocked(localDb.accounts.toArray).mockResolvedValue(mockAccounts);

      const result = await service.getAccounts();

      expect(result).toEqual(mockAccounts);
      expect(localDb.accounts.toArray).toHaveBeenCalledOnce();
      expect(syncEngine.syncInBackground).toHaveBeenCalledWith('accounts');
    });

    it('should throw error when database fails', async () => {
      vi.mocked(localDb.accounts.toArray).mockRejectedValue(new Error('DB Error'));

      await expect(service.getAccounts()).rejects.toThrow('Error al obtener cuentas');
    });
  });

  describe('createAccount', () => {
    it('should create account and enqueue for sync', async () => {
      const newAccount = {
        code: '1000',
        name: 'Caja',
        type: 'asset' as const,
        balance: 0,
        currency: 'VES' as const
      };

      vi.mocked(localDb.accounts.add).mockResolvedValue('1');
      vi.mocked(syncEngine.enqueue).mockResolvedValue(undefined);

      const result = await service.createAccount(newAccount);

      expect(result).toMatchObject(newAccount);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(localDb.accounts.add).toHaveBeenCalledWith(expect.objectContaining(newAccount));
      expect(syncEngine.enqueue).toHaveBeenCalledWith({
        operation: 'CREATE',
        entity: 'account',
        data: expect.objectContaining(newAccount)
      });
    });

    it('should validate account data', async () => {
      const invalidAccount = {
        code: '',
        name: 'Test',
        type: 'invalid' as any,
        balance: 0,
        currency: 'VES' as const
      };

      await expect(service.createAccount(invalidAccount)).rejects.toThrow();
    });
  });

  describe('deleteAccount', () => {
    it('should not delete account with transactions', async () => {
      vi.mocked(localDb.accounts.get).mockResolvedValue({
        id: '1',
        code: '1000',
        name: 'Caja',
        type: 'asset',
        balance: 1000,
        currency: 'VES',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      vi.mocked(localDb.transactions.where).mockReturnValue({
        anyOf: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue(5)
        })
      } as any);

      await expect(service.deleteAccount('1')).rejects.toThrow(
        'No se puede eliminar una cuenta con transacciones'
      );
    });
  });
});
```

```typescript
// src/modules/finance/hooks/__tests__/useFinance.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFinance } from '../useFinance';
import { accountingService } from '../../services/accounting.service';

vi.mock('../../services/accounting.service');

describe('useFinance', () => {
  it('should load accounts on mount', async () => {
    const mockAccounts = [
      { id: '1', code: '1000', name: 'Caja', type: 'asset', balance: 1000, currency: 'VES' }
    ];

    vi.mocked(accountingService.getAccounts).mockResolvedValue(mockAccounts);

    const { result } = renderHook(() => useFinance());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.accounts).toEqual(mockAccounts);
    expect(result.current.error).toBeNull();
  });

  it('should create account', async () => {
    const newAccount = {
      code: '1000',
      name: 'Caja',
      type: 'asset' as const,
      balance: 0,
      currency: 'VES' as const
    };

    const createdAccount = { id: '1', ...newAccount, createdAt: new Date(), updatedAt: new Date() };

    vi.mocked(accountingService.getAccounts).mockResolvedValue([]);
    vi.mocked(accountingService.createAccount).mockResolvedValue(createdAccount);

    const { result } = renderHook(() => useFinance());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createAccount(newAccount);
    });

    expect(result.current.accounts).toContainEqual(createdAccount);
  });
});
```

---

## 🔄 9. Ejemplo de Sincronización (Core)

```typescript
// src/core/sync/SyncEngine.ts

import { localDb } from '@core/database/localDb';
import { apiService } from '@core/api/api.service';
import { ConflictResolver } from './conflict-resolution';

interface SyncOperation {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: Date;
  synced: boolean;
}

export class SyncEngine {
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private conflictResolver = new ConflictResolver();

  async enqueue(op: Omit<SyncOperation, 'id' | 'timestamp' | 'synced'>) {
    const operation: SyncOperation = {
      id: crypto.randomUUID(),
      ...op,
      timestamp: new Date(),
      synced: false
    };

    // Guardar en cola de sincronización
    await localDb.syncQueue.add(operation);
    this.syncQueue.push(operation);

    // Intentar sincronizar inmediatamente si hay conexión
    if (navigator.onLine && !this.isSyncing) {
      this.syncInBackground();
    }
  }

  async syncInBackground(entity?: string) {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      // Obtener operaciones pendientes
      let pendingOps = await localDb.syncQueue
        .where('synced')
        .equals(0)
        .toArray();

      if (entity) {
        pendingOps = pendingOps.filter(op => op.entity === entity);
      }

      // Sincronizar en orden
      for (const op of pendingOps) {
        try {
          await this.syncOperation(op);
          
          // Marcar como sincronizado
          await localDb.syncQueue.update(op.id, { synced: true });
          
          // Remover de la cola en memoria
          this.syncQueue = this.syncQueue.filter(o => o.id !== op.id);
        } catch (error) {
          console.error(`Error syncing operation ${op.id}:`, error);
          
          // Si es un conflicto, intentar resolverlo
          if (error.code === 'CONFLICT') {
            await this.handleConflict(op, error.remoteData);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncOperation(op: SyncOperation) {
    switch (op.operation) {
      case 'CREATE':
        return await apiService.post(`/${op.entity}`, op.data);
      case 'UPDATE':
        return await apiService.put(`/${op.entity}/${op.data.id}`, op.data);
      case 'DELETE':
        return await apiService.delete(`/${op.entity}/${op.data.id}`);
    }
  }

  private async handleConflict(localOp: SyncOperation, remoteData: any) {
    const resolution = await this.conflictResolver.resolve(localOp.data, remoteData);
    
    // Actualizar datos locales con la resolución
    const table = localDb[op.entity as keyof typeof localDb];
    await table.put(resolution);
    
    // Marcar operación como sincronizada
    await localDb.syncQueue.update(localOp.id, { synced: true });
  }

  // Sincronización pull: obtener cambios del servidor
  async pullChanges(entity: string, since?: Date) {
    if (!navigator.onLine) return;

    try {
      const response = await apiService.get(`/${entity}/changes`, {
        params: { since: since?.toISOString() }
      });

      const changes = response.data;

      // Aplicar cambios localmente
      for (const change of changes) {
        const table = localDb[entity as keyof typeof localDb];
        
        switch (change.operation) {
          case 'CREATE':
          case 'UPDATE':
            await table.put(change.data);
            break;
          case 'DELETE':
            await table.delete(change.data.id);
            break;
        }
      }

      // Actualizar timestamp de última sincronización
      await localDb.syncMetadata.put({
        entity,
        lastSync: new Date()
      });
    } catch (error) {
      console.error(`Error pulling changes for ${entity}:`, error);
    }
  }
}

export const syncEngine = new SyncEngine();
```

```typescript
// src/core/sync/conflict-resolution.ts

import { Dialog } from '@shared/components/ui/dialog';

export class ConflictResolver {
  async resolve(localData: any, remoteData: any): Promise<any> {
    // Estrategia 1: Last Write Wins
    if (localData.updatedAt > remoteData.updatedAt) {
      return localData;
    }

    // Estrategia 2: Merge automático si no hay conflictos reales
    if (!this.hasRealConflict(localData, remoteData)) {
      return this.merge(localData, remoteData);
    }

    // Estrategia 3: Mostrar diálogo al usuario
    return await this.showConflictDialog(localData, remoteData);
  }

  private hasRealConflict(local: any, remote: any): boolean {
    // Comparar campos importantes
    const importantFields = ['amount', 'status', 'customerId'];
    
    for (const field of importantFields) {
      if (local[field] !== remote[field]) {
        return true;
      }
    }
    
    return false;
  }

  private merge(local: any, remote: any): any {
    // Merge simple: tomar campos más recientes
    return {
      ...remote,
      ...local,
      updatedAt: new Date()
    };
  }

  private async showConflictDialog(local: any, remote: any): Promise<any> {
    return new Promise((resolve) => {
      // Mostrar diálogo de resolución de conflictos
      // El usuario elige qué versión mantener
      // Por ahora, retornar la versión remota
      resolve(remote);
    });
  }
}
```

---

## 🗄️ 10. Base de Datos Local (Dexie)

```typescript
// src/core/database/localDb.ts

import Dexie, { Table } from 'dexie';
import { Account, Transaction } from '@modules/finance/types/finance.types';
import { Product } from '@modules/inventory/types/inventory.types';
import { Invoice } from '@modules/sales/types/sales.types';

export class VioletDatabase extends Dexie {
  // Finance
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;

  // Inventory
  products!: Table<Product, string>;

  // Sales
  invoices!: Table<Invoice, string>;

  // Sync
  syncQueue!: Table<any, string>;
  syncMetadata!: Table<any, string>;

  constructor() {
    super('VioletERP');

    this.version(1).stores({
      // Finance
      accounts: 'id, code, type, parentId',
      transactions: 'id, date, status, createdBy',

      // Inventory
      products: 'id, sku, barcode, category',

      // Sales
      invoices: 'id, invoiceNumber, customerId, date, status',

      // Sync
      syncQueue: 'id, entity, synced, timestamp',
      syncMetadata: 'entity, lastSync'
    });
  }
}

export const localDb = new VioletDatabase();
```

---

## 🔐 11. Autenticación y Permisos (Core)

```typescript
// src/core/auth/services/auth.service.ts

import { jwtService } from '@core/security/jwt';
import { apiService } from '@core/api/api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export class AuthService {
  private currentUser: User | null = null;

  async login(email: string, password: string): Promise<User> {
    const response = await apiService.post('/auth/login', { email, password });
    
    const { token, user } = response.data;
    
    // Guardar token
    localStorage.setItem('token', token);
    
    // Decodificar y guardar usuario
    this.currentUser = user;
    
    return user;
  }

  async logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtService.decode(token);
      this.currentUser = decoded.user;
      return this.currentUser;
    } catch {
      return null;
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.permissions.includes(permission) || user.permissions.includes('*');
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role === role || user.role === 'admin';
  }
}

export const authService = new AuthService();
```

```typescript
// src/core/auth/components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

## 🎨 12. Configuración de Vite

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core chunks
          'core-auth': ['./src/core/auth'],
          'core-sync': ['./src/core/sync'],
          'core-database': ['./src/core/database'],
          
          // Module chunks
          'module-finance': ['./src/modules/finance'],
          'module-inventory': ['./src/modules/inventory'],
          'module-sales': ['./src/modules/sales'],
          'module-hr': ['./src/modules/hr'],
          
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'vendor-db': ['dexie']
        }
      }
    }
  }
});
```

---

## 📝 13. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@config/*": ["src/config/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

**Estos ejemplos muestran la implementación completa de un módulo siguiendo la arquitectura propuesta. Puedes replicar este patrón para los demás módulos (Inventory, Sales, HR, etc.).**
