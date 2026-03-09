import { motion } from "framer-motion";
import { Landmark, Plus, ArrowRightLeft, TrendingUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/lib/index";

interface FinanceHeaderProps {
  logic: any;
}

export const FinanceHeader = ({ logic }: FinanceHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <Landmark className="w-8 h-8 text-primary" />
          Finanzas y Gestión Fiscal
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          Gestión contable dual (USD/Bs) • SENIAT • IGTF
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-secondary/30 p-2 rounded-xl border">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border shadow-sm">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-600 tabular-nums">
            {logic.exchangeRate.toFixed(4)}
          </span>
          <span className="text-xs text-muted-foreground pr-2">Bs/USD</span>
        </div>

        <Dialog
          open={logic.isAccountDialogOpen}
          onOpenChange={logic.setIsAccountDialogOpen}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Cuenta Contable</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Código (Plan de Cuentas)</Label>
                <Input
                  placeholder="Ej: 1.1.01.01"
                  value={logic.newAccount.code}
                  onChange={(e) =>
                    logic.setNewAccount({
                      ...logic.newAccount,
                      code: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Nombre de la Cuenta</Label>
                <Input
                  placeholder="Ej: Banco Mercantil Principal"
                  value={logic.newAccount.name}
                  onChange={(e) =>
                    logic.setNewAccount({
                      ...logic.newAccount,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={logic.newAccount.type}
                    onValueChange={(val: any) =>
                      logic.setNewAccount({ ...logic.newAccount, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="pasivo">Pasivo</SelectItem>
                      <SelectItem value="patrimonio">Patrimonio</SelectItem>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Moneda</Label>
                  <Select
                    value={logic.newAccount.currency}
                    onValueChange={(val) =>
                      logic.setNewAccount({
                        ...logic.newAccount,
                        currency: val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="VES">Bolívar (Bs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={logic.handleCreateAccount}
                className="w-full mt-4"
              >
                Guardar Cuenta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={logic.isTransactionDialogOpen}
          onOpenChange={logic.setIsTransactionDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm bg-background"
            >
              <ArrowRightLeft className="w-4 h-4" /> Asiento Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Asiento Contable</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Cuenta</Label>
                <Select
                  onValueChange={(val) =>
                    logic.setNewTransaction({
                      ...logic.newTransaction,
                      account_id: val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {logic.accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Descripción</Label>
                <Input
                  value={logic.newTransaction.description}
                  onChange={(e) =>
                    logic.setNewTransaction({
                      ...logic.newTransaction,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={logic.newTransaction.type}
                    onValueChange={(val: any) =>
                      logic.setNewTransaction({
                        ...logic.newTransaction,
                        type: val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debe">Debe (+)</SelectItem>
                      <SelectItem value="haber">Haber (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Monto (USD)</Label>
                  <Input
                    type="number"
                    value={logic.newTransaction.amount}
                    onChange={(e) =>
                      logic.setNewTransaction({
                        ...logic.newTransaction,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Equivalente en Bolívares:
                </p>
                <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                  {formatCurrency(
                    logic.newTransaction.amount * logic.exchangeRate,
                    "VES",
                  )}
                </p>
              </div>
              <Button
                onClick={logic.handleCreateTransaction}
                className="w-full"
              >
                Registrar Transacción
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};
