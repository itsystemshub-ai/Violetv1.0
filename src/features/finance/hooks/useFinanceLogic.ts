import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { 
  FinancialAccount, 
  Invoice, 
  FinancialTransaction 
} from "@/lib/index";
import { supabase } from "@/lib/supabase";
import { SyncService } from "@/core/sync/SyncService";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { localDb } from "@/core/database/localDb";
import { finanzasService } from "@/services/microservices/finanzas/FinanzasService";
import { generatePDFReport } from "@/infrastructure/pdf/pdf-utils";
import { LibroGeneratorService } from "@/modules/finance/services/libro-generator.service";
import { IGTFService } from "@/modules/finance/services/igtf.service";
import { WithholdingService } from "@/modules/finance/services/withholding.service";
import { AccountingService } from "@/modules/finance/services/accounting.service";
import { 
  ReconciliationService, 
  ReconciliationMatch 
} from "@/modules/finance/services/reconciliation.service";

export const useFinanceLogic = () => {
  const { user } = useAuth();
  const { tenant, exchangeRate } = useSystemConfig();

  // Core data states
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [igtfRecords, setIgtfRecords] = useState<any[]>([]);
  
  // Settings & Toggles
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedSupplier, setSelectedSupplier] = useState<string>("none");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Modals visibility
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Summary and analytics states
  const [igtfSummary, setIgtfSummary] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [ageingData, setAgeingData] = useState({
    total: 0,
    current: 0,
    pastDue30: 0,
    pastDue60: 0,
    pastDue90: 0,
  });

  // Payment management
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pago_movil");

  // Form states
  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "activo" as const,
    currency: "USD",
    bankDetails: {
      accountNumber: "",
      bankName: "",
      currency: "USD" as "USD" | "VES",
      isCashAccount: false,
    },
  });
  const [newTransaction, setNewTransaction] = useState({
    account_id: "",
    description: "",
    type: "debe" as "debe" | "haber",
    amount: 0,
  });

  // Reconciliation states
  const [reconciliationMatches, setReconciliationMatches] = useState<ReconciliationMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  
  // Ledger states
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<FinancialTransaction[]>([]);

  const isMaster = user?.isSuperAdmin;
  const canManageFinance =
    isMaster ||
    user?.department === "Finanzas" ||
    user?.department === "Administración / IT" ||
    user?.role === "admin";

  const fetchData = useCallback(async () => {
    if (!tenant.id || tenant.id === "none") return;

    try {
      // 1. Load from localDb
      const [localAccs, invData, igtfData] = await Promise.all([
        localDb.financial_accounts.where("tenant_id").equals(tenant.id).toArray(),
        localDb.invoices.where("tenant_id").equals(tenant.id).toArray(),
        localDb.igtf_records.where("tenant_id").equals(tenant.id).toArray(),
      ]);

      setAccounts(localAccs);
      setInvoices(invData);
      setIgtfRecords(igtfData);

      // 2. Fiscal calculations
      const summary = await AccountingService.getFinancialSummary(tenant.id, exchangeRate);
      setFinancialSummary(summary);

      const igtfSums = IGTFService.generarResumenIGTF(igtfData);
      setIgtfSummary(igtfSums);

      // 3. Ageing calculation
      const now = new Date();
      const ageing = {
        total: 0,
        current: 0,
        pastDue30: 0,
        pastDue60: 0,
        pastDue90: 0,
      };

      invData.forEach((inv) => {
        if (inv.type === "venta" && inv.status === "pendiente") {
          ageing.total += inv.total;
          const dueDate = new Date(inv.date);
          const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays <= 30) ageing.current += inv.total;
          else if (diffDays <= 60) ageing.pastDue30 += inv.total;
          else if (diffDays <= 90) ageing.pastDue60 += inv.total;
          else ageing.pastDue90 += inv.total;
        }
      });
      setAgeingData(ageing);
    } catch (error) {
      console.error("Error fetching finance data:", error);
    }
  }, [tenant.id, exchangeRate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProcessPayment = async () => {
    if (!selectedInvoiceForPayment || !tenant.id) return;

    const { subtotal, igtf, generaIGTF } = IGTFService.procesarPago(
      selectedInvoiceForPayment.total,
      paymentMethod,
    );

    try {
      await AccountingService.postPaymentWithIGTF({
        tenantId: tenant.id,
        invoiceId: selectedInvoiceForPayment.id,
        montoBase: subtotal,
        montoIGTF: igtf,
        metodoPago: paymentMethod,
        tasaCambio: exchangeRate,
      });

      if (generaIGTF) {
        await localDb.igtf_records.add({
          id: crypto.randomUUID(),
          tenant_id: tenant.id,
          invoice_id: selectedInvoiceForPayment.id,
          monto_base: subtotal,
          tasa_igtf: IGTFService.TASA_IGTF,
          monto_igtf: igtf,
          metodo_pago: paymentMethod,
          created_at: new Date().toISOString(),
        });
      }

      await localDb.invoices.update(selectedInvoiceForPayment.id, {
        status: "pagada",
        updated_at: new Date().toISOString(),
      });

      toast.success("Pago procesado correctamente.");
      setIsPaymentDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Error al procesar el pago.");
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.code || !newAccount.name || !tenant.id) {
      toast.error("Complete todos los campos de la cuenta.");
      return;
    }

    try {
      const tempId = crypto.randomUUID();
      await finanzasService.createTransaction(
        {
          account_id: tempId,
          description: "Apertura de Cuenta",
          type: newAccount.type === "activo" || newAccount.type === "egreso" ? "debe" : "haber",
          amount: 0,
        } as any,
        tenant.id,
      );

      const dbPayload = {
        id: tempId,
        tenant_id: tenant.id,
        code: newAccount.code,
        name: newAccount.name,
        type: newAccount.type,
        balance: 0,
        currency: newAccount.currency,
        bankDetails: newAccount.bankDetails.accountNumber ? newAccount.bankDetails : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await SyncService.mutate("financial_accounts", "INSERT", dbPayload, tempId);
      if (error) throw error;

      const newAccObj = { ...dbPayload, tenant_id: tenant.id };
      setAccounts((prev) => [...prev, newAccObj].sort((a, b) => a.code.localeCompare(b.code)));
      await localDb.financial_accounts.put(newAccObj);

      toast.success("Cuenta contable creada.");
      setIsAccountDialogOpen(false);
      // Reset form
      setNewAccount({
        code: "",
        name: "",
        type: "activo",
        currency: "USD",
        bankDetails: { accountNumber: "", bankName: "", currency: "USD", isCashAccount: false },
      });
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error al crear la cuenta.");
    }
  };

  const handleCreateTransaction = async () => {
    if (!newTransaction.account_id || !newTransaction.description || newTransaction.amount <= 0 || !tenant.id) {
      toast.error("Complete los datos del asiento.");
      return;
    }

    try {
      const tempId = crypto.randomUUID();
      const dbPayload = {
        id: tempId,
        tenant_id: tenant.id,
        account_id: newTransaction.account_id,
        description: newTransaction.description,
        type: newTransaction.type,
        amount: newTransaction.amount,
        created_at: new Date().toISOString(),
      };

      const { error: txError } = await SyncService.mutate("financial_transactions", "INSERT", dbPayload, tempId);
      if (txError) throw txError;

      const account = accounts.find((a) => a.id === newTransaction.account_id);
      if (account) {
        let newBalance = account.balance;
        if (newTransaction.type === "debe") {
          newBalance += newTransaction.amount;
        } else {
          newBalance -= newTransaction.amount;
        }

        const { error: balError } = await SyncService.mutate(
          "financial_accounts",
          "UPDATE",
          { balance: newBalance, updated_at: new Date().toISOString() },
          account.id,
        );
        if (balError) throw balError;

        setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a)));
        await localDb.financial_accounts.update(account.id, { balance: newBalance });
      }

      toast.success("Asiento contable registrado correctamente.");
      setIsTransactionDialogOpen(false);
      setNewTransaction({ account_id: "", description: "", type: "debe", amount: 0 });
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Error al registrar el movimiento.");
    }
  };

  const handleExportLibroVentas = () => {
    const monthInvoices = invoices.filter((inv) => inv.date.startsWith(selectedMonth));
    const libroData = LibroGeneratorService.generateLibroVentas(monthInvoices);
    LibroGeneratorService.exportToCSV(libroData, `libro_ventas_${selectedMonth}.csv`);
    toast.success("Libro de Ventas exportado exitosamente.");
  };

  const handleExportLibroCompras = () => {
    const monthInvoices = invoices.filter((inv) => inv.date.startsWith(selectedMonth) && inv.type === "compra");
    const libroData = LibroGeneratorService.generateLibroVentas(monthInvoices);
    LibroGeneratorService.exportToCSV(libroData, `libro_compras_${selectedMonth}.csv`);
    toast.success("Libro de Compras exportado exitosamente.");
  };

  const handleExportARC = () => {
    if (selectedSupplier === "none") {
      toast.error("Seleccione un proveedor para el reporte ARC.");
      return;
    }

    const arcData = LibroGeneratorService.generateARC(invoices, selectedSupplier, parseInt(selectedYear));
    generatePDFReport({
      title: "COMPROBANTE DE RETENCIÓN ACUMULADO (ARC)",
      subtitle: `Proveedor: ${arcData.supplier}\nAño Fiscal: ${arcData.year}`,
      filename: `arc_${arcData.supplier}_${arcData.year}.pdf`,
      columns: [
        { header: "Fecha", dataKey: "date" },
        { header: "Factura", dataKey: "invoice" },
        { header: "Base", dataKey: "base" },
        { header: "IVA Ret.", dataKey: "ivaWithheld" },
        { header: "ISLR Ret.", dataKey: "islrWithheld" },
      ],
      data: arcData.details.map((d) => ({
        date: d.date,
        invoice: d.invoice,
        base: d.base.toString(),
        ivaWithheld: d.ivaWithheld.toString(),
        islrWithheld: d.islrWithheld.toString(),
      })),
    });
    toast.success(`Reporte ARC de ${selectedSupplier} generado.`);
  };

  const handleExportReport = () => {
    generatePDFReport({
      title: "BALANCE GENERAL - RESUMEN",
      subtitle: `Empresa: ${tenant.name}\nFecha: ${new Date().toLocaleDateString()}`,
      filename: `finanzas_${new Date().toISOString().split("T")[0]}.pdf`,
      columns: [
        { header: "Código", dataKey: "code" },
        { header: "Cuenta", dataKey: "name" },
        { header: "Tipo", dataKey: "type" },
        { header: "Saldo", dataKey: "balance" },
      ],
      data: accounts.map((acc) => ({
        code: acc.code,
        name: acc.name,
        type: acc.type.toUpperCase(),
        balance: acc.balance.toString(),
      })),
    });
    toast.success("Reporte financiero generado con éxito.");
  };

  const handleReconcileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant.id) return;

    setIsMatching(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const bankLines = await ReconciliationService.parseCSV(content);

        const { data: systemTxs } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("tenant_id", tenant.id);

        const matches = ReconciliationService.matchTransactions(bankLines, systemTxs || []);
        setReconciliationMatches(matches);
        setIsMatching(false);
        toast.success(`${matches.length} transacciones procesadas.`);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Reconciliation error:", error);
      toast.error("Error al procesar el archivo bancario.");
      setIsMatching(false);
    }
  };

  const handleSelectLedgerAccount = async (accountId: string) => {
    setSelectedLedgerAccount(accountId);
    try {
      const localTxs = await localDb.financial_transactions
        .where("account_id")
        .equals(accountId)
        .reverse()
        .toArray();

      if (localTxs.length > 0) {
        setLedgerTransactions(localTxs);
      }

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          setLedgerTransactions(data);
          await localDb.financial_transactions.bulkPut(data);
        }
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast.error("Error al cargar movimientos.");
    }
  };

  // Calculated metrics
  const totalAssets = accounts.filter((a) => a.type === "activo").reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === "pasivo").reduce((acc, a) => acc + a.balance, 0);
  const totalRevenue = accounts.filter((a) => a.type === "ingreso").reduce((acc, a) => acc + a.balance, 0);
  const totalExpenses = accounts.filter((a) => a.type === "egreso").reduce((acc, a) => acc + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  const pendingReceivables = ageingData.total;
  const cashFlow = totalRevenue - totalExpenses;

  return {
    // Basic data
    user,
    tenant,
    accounts,
    invoices,
    igtfRecords,
    exchangeRate, // Solo lectura desde useSystemConfig
    selectedMonth,
    setSelectedMonth,
    selectedSupplier,
    setSelectedSupplier,
    selectedYear,
    setSelectedYear,

    // Permissions
    canManageFinance,

    // Summaries
    igtfSummary,
    financialSummary,
    ageingData,

    // Dialog control
    isAccountDialogOpen,
    setIsAccountDialogOpen,
    isTransactionDialogOpen,
    setIsTransactionDialogOpen,
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,

    // Forms and selection
    selectedInvoiceForPayment,
    setSelectedInvoiceForPayment,
    paymentMethod,
    setPaymentMethod,
    newAccount,
    setNewAccount,
    newTransaction,
    setNewTransaction,

    // Reconciliation
    reconciliationMatches,
    isMatching,
    handleReconcileFile,

    // Ledger
    selectedLedgerAccount,
    ledgerTransactions,
    handleSelectLedgerAccount,

    // KPIs grouped for easy access
    kpis: {
      totalAssets,
      totalLiabilities,
      totalRevenue,
      totalExpenses,
      netIncome,
      pendingReceivables,
      cashFlow,
    },

    // Individual metrics (for backward compatibility)
    totalAssets,
    totalLiabilities,
    totalRevenue,
    totalExpenses,
    netIncome,

    // Handlers
    handleProcessPayment,
    handleCreateAccount,
    handleCreateTransaction,
    handleExportLibroVentas,
    handleExportLibroCompras,
    handleExportARC,
    handleExportReport,
    fetchData,
  };
};
