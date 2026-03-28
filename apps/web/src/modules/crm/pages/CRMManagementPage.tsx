/**
 * CRMManagementPage - Menú principal de CRM
 */

import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  Ticket,
  TrendingUp,
  MessageSquare,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CRMManagementPage() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "pipeline",
      name: "Pipeline",
      icon: TrendingUp,
      path: "/crm/pipeline",
      description: "Gestión visual del pipeline de ventas",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "customers",
      name: "Clientes",
      icon: Users,
      path: "/crm/customers",
      description: "Base de datos de clientes",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "tickets",
      name: "Tickets",
      icon: Ticket,
      path: "/crm/tickets",
      description: "Sistema de soporte",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "communications",
      name: "Comunicaciones",
      icon: MessageSquare,
      path: "/crm/communications",
      description: "Historial de interacciones",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "analytics",
      name: "Análisis",
      icon: TrendingUp,
      path: "/crm/analytics",
      description: "Reportes y métricas",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "automation",
      name: "Automatización",
      icon: Zap,
      path: "/crm/automation",
      description: "Workflows automáticos",
      color: "from-yellow-500 to-amber-500",
    },
  ];

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Gestión Completa de CRM
          </h1>
          <p className="text-muted-foreground mt-1">
            Acceso rápido a todos los módulos del CRM
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="hover:shadow-xl transition-all cursor-pointer group border-2"
                onClick={() => navigate(module.path)}
              >
                <CardHeader>
                  <div
                    className={`w-16 h-16 rounded-2xl bg-linear-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="w-full justify-between group-hover:bg-primary/10"
                  >
                    Abrir módulo
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ValeryLayout>
  );
}
