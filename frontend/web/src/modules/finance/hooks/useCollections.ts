import { useState, useMemo, useCallback } from "react";
import { useFinanceLogic } from "./useFinanceLogic";
import { formatCurrency } from "@/lib/index";
import { parseISO } from "date-fns";
import { useCRMStore } from "@/modules/crm/hooks/useCRMStore";
import { toast } from "sonner";

export interface ARInvoice {
  id: string;
  number: string;
  customerName: string;
  date: string;
  total: number;
  status: string;
  daysOverdue: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export const useCollections = () => {
  const { invoices, exchangeRate } = useFinanceLogic();
  const { sendMessage } = useCRMStore();
  const [isAutoReminderEnabled, setIsAutoReminderEnabled] = useState(false);

  const pendingInvoices = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((inv) => inv.type === "venta" && inv.status === "pendiente")
      .map((inv) => {
        const dueDate = parseISO(inv.date);
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        
        let riskLevel: "low" | "medium" | "high" | "critical" = "low";
        if (diffDays > 90) riskLevel = "critical";
        else if (diffDays > 60) riskLevel = "high";
        else if (diffDays > 30) riskLevel = "medium";

        return {
          ...inv,
          daysOverdue: diffDays,
          riskLevel,
        } as ARInvoice;
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [invoices]);

  const collectionsStats = useMemo(() => {
    const totalPending = pendingInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const criticalAmount = pendingInvoices
      .filter((inv) => inv.riskLevel === "critical" || inv.riskLevel === "high")
      .reduce((acc, inv) => acc + inv.total, 0);
    
    return {
      totalPending,
      criticalAmount,
      count: pendingInvoices.length,
      averageOverdue: pendingInvoices.length > 0 
        ? Math.round(pendingInvoices.reduce((acc, inv) => acc + inv.daysOverdue, 0) / pendingInvoices.length)
        : 0
    };
  }, [pendingInvoices]);

  const sendOverdueReminder = useCallback((invoice: ARInvoice) => {
    const message = `⚠️ *RECORDATORIO DE COBRO* ⚠️\n\nEstimado cliente, le recordamos que la factura *#${invoice.number}* presenta un retraso de *${invoice.daysOverdue} días*.\n\nMonto pendiente: *${formatCurrency(invoice.total, "USD")}*\n\nPor favor, ignore este mensaje si ya realizó su pago.`;
    
    // In a real app, we'd lookup the customer's active chat ID
    sendMessage("1", message); 
    
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    
    toast.success(`Recordatorio enviado para factura #${invoice.number}`);
  }, [sendMessage]);

  const runAutomaticReminders = useCallback(() => {
    if (!isAutoReminderEnabled) return;
    
    const criticalInvoices = pendingInvoices.filter(i => i.riskLevel === "critical");
    if (criticalInvoices.length === 0) {
      toast.info("No hay facturas críticas para recordar hoy.");
      return;
    }

    toast.info(`Iniciando envío de ${criticalInvoices.length} recordatorios críticos...`);
    // Logic to batch send via API...
  }, [isAutoReminderEnabled, pendingInvoices]);

  return {
    pendingInvoices,
    collectionsStats,
    isAutoReminderEnabled,
    setIsAutoReminderEnabled,
    sendOverdueReminder,
    runAutomaticReminders,
    exchangeRate
  };
};
