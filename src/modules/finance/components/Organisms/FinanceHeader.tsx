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
      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-[2.5rem] border-none shadow-xl ring-1 ring-border/5 overflow-hidden"
    >
      <div className="relative z-10">
        <h1 className="text-4xl font-black tracking-tighter italic uppercase bg-linear-to-br from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Landmark className="w-10 h-10 text-primary" />
          </div>
          Finanzas y Gestión Fiscal
        </h1>
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-2 ml-16 flex items-center gap-2">
          Gestión contable dual (USD/Bs){" "}
          <span className="w-1 h-1 bg-primary/20 rounded-full" /> SENIAT{" "}
          <span className="w-1 h-1 bg-primary/20 rounded-full" /> IGTF
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 relative z-10">
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/10 rounded-[1.2rem] border border-border/40 shadow-inner group transition-all hover:bg-muted/15">
          <div className="bg-emerald-500/10 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/50 leading-none mb-0.5">
              Tasa BCV del día
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-emerald-600 tabular-nums">
                {logic.exchangeRate.toFixed(4)}
              </span>
              <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-tighter">
                Bs/USD
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog
            open={logic.isAccountDialogOpen}
            onOpenChange={logic.setIsAccountDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-11 px-5 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-4xl p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary mb-2">
                  Crear Cuenta Contable
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                    Código (Plan de Cuentas)
                  </Label>
                  <Input
                    className="rounded-xl border-border/50 bg-muted/5 h-12"
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
                  <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                    Nombre de la Cuenta
                  </Label>
                  <Input
                    className="rounded-xl border-border/50 bg-muted/5 h-12"
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
                    <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                      Tipo de Cuenta
                    </Label>
                    <Select
                      value={logic.newAccount.type}
                      onValueChange={(val: any) =>
                        logic.setNewAccount({ ...logic.newAccount, type: val })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-border/50 bg-muted/5 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                        <SelectItem
                          value="activo"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Activo
                        </SelectItem>
                        <SelectItem
                          value="pasivo"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Pasivo
                        </SelectItem>
                        <SelectItem
                          value="patrimonio"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Patrimonio
                        </SelectItem>
                        <SelectItem
                          value="ingreso"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Ingreso
                        </SelectItem>
                        <SelectItem
                          value="egreso"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Egreso
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                      Moneda Base
                    </Label>
                    <Select
                      value={logic.newAccount.currency}
                      onValueChange={(val) =>
                        logic.setNewAccount({
                          ...logic.newAccount,
                          currency: val as "USD" | "VES",
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-border/50 bg-muted/5 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                        <SelectItem
                          value="USD"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Dólar (USD)
                        </SelectItem>
                        <SelectItem
                          value="VES"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Bolívar (Bs)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={logic.handleCreateAccount}
                  className="w-full mt-4 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
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
                className="h-11 px-5 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest border-border/50 bg-background hover:bg-muted/10 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4" /> Asiento Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-4xl p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary mb-2">
                  Registrar Asiento Contable
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                    Cuenta de Destino
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      logic.setNewTransaction({
                        ...logic.newTransaction,
                        account_id: val,
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl border-border/50 bg-muted/5 h-12">
                      <SelectValue placeholder="Seleccionar cuenta..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                      {logic.accounts.map((acc: any) => (
                        <SelectItem
                          key={acc.id}
                          value={acc.id}
                          className="rounded-lg text-xs font-bold uppercase py-2"
                        >
                          <span className="text-primary/60 font-black mr-2">
                            {acc.code}
                          </span>{" "}
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                    Descripción del Movimiento
                  </Label>
                  <Input
                    className="rounded-xl border-border/50 bg-muted/5 h-12"
                    value={logic.newTransaction.description}
                    placeholder="Ej: Pago de nómina, Apertura, etc."
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
                    <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                      Tipo de Registro
                    </Label>
                    <Select
                      value={logic.newTransaction.type}
                      onValueChange={(val: any) =>
                        logic.setNewTransaction({
                          ...logic.newTransaction,
                          type: val,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-border/50 bg-muted/5 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                        <SelectItem
                          value="debe"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Debe (+)
                        </SelectItem>
                        <SelectItem
                          value="haber"
                          className="rounded-lg text-xs font-bold uppercase"
                        >
                          Haber (-)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[9px] font-black uppercase ml-1 opacity-70">
                      Monto (USD)
                    </Label>
                    <Input
                      className="rounded-xl border-border/50 bg-muted/5 h-12 font-black tabular-nums"
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
                <div className="p-4 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10 transition-all flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black uppercase text-emerald-600/60 leading-none mb-1">
                      Equivalente en Bolívares
                    </p>
                    <p className="text-xl font-black italic tabular-nums text-emerald-600">
                      {formatCurrency(
                        logic.newTransaction.amount * logic.exchangeRate,
                        "VES",
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <Button
                  onClick={logic.handleCreateTransaction}
                  className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Registrar Transacción
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.div>
  );
};
