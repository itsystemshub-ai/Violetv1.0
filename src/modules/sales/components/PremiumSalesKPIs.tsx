import { StandardKPICard } from "@/shared/components/common/StandardKPICard";
import {
  DollarSign,
  FileText,
  TrendingUp,
  Target,
  Users,
  ShoppingCart,
} from "lucide-react";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { motion } from "framer-motion";

export const PremiumSalesKPIs = ({ data }: { data: any }) => {
  const { formatMoney } = useCurrencyStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <motion.div variants={item}>
        <StandardKPICard
          label="Volumen de Ventas"
          value={formatMoney(data?.totalSales || 0)}
          change={12.5}
          trend="up"
          icon={DollarSign}
          accentColor="emerald-400"
          glowColor="emerald-500/50"
        />
      </motion.div>
      <motion.div variants={item}>
        <StandardKPICard
          label="Facturas por Cobrar"
          value={data?.pendingInvoices || 0}
          change={-5}
          trend="down"
          icon={FileText}
          accentColor="rose-400"
          glowColor="rose-500/50"
        />
      </motion.div>
      <motion.div variants={item}>
        <StandardKPICard
          label="Ticket Promedio"
          value={formatMoney(data?.averageTicket || 0)}
          change={2.1}
          trend="up"
          icon={TrendingUp}
          accentColor="blue-400"
          glowColor="blue-500/50"
        />
      </motion.div>
      <motion.div variants={item}>
        <StandardKPICard
          label="Tasa de Conversión"
          value={`${(data?.conversionRate || 0).toFixed(1)}%`}
          change={4.2}
          trend="up"
          icon={Target}
          accentColor="violet-400"
          glowColor="violet-500/50"
        />
      </motion.div>
    </motion.div>
  );
};
