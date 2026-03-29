import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { TrendingUp, Wallet, Package, ShoppingCart, Info } from "lucide-react";
import { ChartDataPoint, formatCurrency } from "@/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { IMAGES } from "@/assets/images";

interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  description?: string;
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency = "USD",
}: TooltipProps<number, string> & { currency?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-xs font-semibold"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value || 0, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({
  data,
  title,
  description,
  className,
}: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name="Ingresos"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExpenseChart({
  data,
  title,
  description,
  className,
}: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-destructive" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                name="Gastos"
                fill="var(--chart-5)"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
              {data[0]?.secondary !== undefined && (
                <Bar
                  dataKey="secondary"
                  name="Presupuesto"
                  fill="var(--muted)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function InventoryChart({
  data,
  title,
  description,
  className,
}: ChartProps) {
  const COLORS = [
    "#7c3aed",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#0ea5e9",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#a3e635",
    "#fb923c",
    "#f43f5e",
  ];
  const totalUnits = Array.isArray(data)
    ? data.reduce((sum, d) => sum + (d.value || 0), 0)
    : 0;
  // Sort descending and take top 15
  const sorted = Array.isArray(data)
    ? [...data].sort((a, b) => (b.value || 0) - (a.value || 0))
    : [];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const pct =
        totalUnits > 0
          ? ((payload[0].value / totalUnits) * 100).toFixed(1)
          : "0";
      return (
        <div className="bg-card border border-border p-2 rounded-lg shadow-xl text-xs">
          <p className="font-black text-primary uppercase">{payload[0].name}</p>
          <p className="font-bold">
            {payload[0].value.toLocaleString()} uds.{" "}
            <span className="text-muted-foreground">({pct}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="grid gap-0.5">
          <CardTitle className="text-base font-black italic tracking-tighter">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Package className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          {/* Donut Chart */}
          <div className="w-full md:w-[180px] h-[180px] shrink-0 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {sorted.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact 2-column legend */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 content-start overflow-auto max-h-[200px] pr-1">
            {sorted.slice(0, 20).map((entry, index) => {
              const pct =
                totalUnits > 0
                  ? ((entry.value / totalUnits) * 100).toFixed(1)
                  : "0";
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 min-w-0 group"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span
                    className="text-[9px] font-bold text-muted-foreground uppercase truncate leading-none flex-1"
                    title={entry.name}
                  >
                    {entry.name}
                  </span>
                  <span className="text-[9px] font-black text-foreground/60 shrink-0">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total bar */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-bold uppercase tracking-wider">
            Total en Stock
          </span>
          <span className="font-black text-primary text-sm">
            {totalUnits.toLocaleString()} uds.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesChart({
  data,
  title,
  description,
  className,
}: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
          {(data || []).length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 rounded-lg">
              <img
                src={IMAGES.ANALYTICS_CHARTS_3}
                alt="Sin datos"
                className="w-32 h-32 object-cover rounded-full mb-4 opacity-40"
              />
              <p className="text-sm text-muted-foreground">
                No hay ventas registradas este periodo
              </p>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Ventas Reales"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "var(--primary)",
                  strokeWidth: 2,
                  stroke: "var(--background)",
                }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              {data[0]?.secondary !== undefined && (
                <Line
                  type="monotone"
                  dataKey="secondary"
                  name="Proyectado"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/50 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold mb-1">
              Análisis de IA Violet ERP
            </h4>
            <p className="text-xs text-muted-foreground">
              Se observa una tendencia de crecimiento del 12% respecto al mes
              anterior. Las proyecciones sugieren un aumento en la demanda de
              suministros de oficina para el próximo trimestre.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export function GenericBarChart({
  data,
  title,
  description,
  className,
}: ChartProps) {
  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="grid gap-1">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip currency="uds" />} />
              <Bar
                dataKey="value"
                name="Unidades"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                barSize={32}
              >
                {(Array.isArray(data) ? data : []).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
