/**
 * PipelinePanel - Gestión visual del pipeline de ventas con drag & drop
 */

import { useState, useEffect, useCallback } from "react";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, DollarSign, Calendar, User, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  probability: number;
  stage: string;
  expectedCloseDate: string;
  assignedTo: string;
  lastActivity: string;
  tags: string[];
  phone?: string;
  email?: string;
}

const PIPELINE_STAGES = [
  { id: "lead", name: "Lead", color: "bg-gray-500", probability: 10 },
  {
    id: "qualified",
    name: "Calificado",
    color: "bg-blue-500",
    probability: 25,
  },
  {
    id: "proposal",
    name: "Propuesta",
    color: "bg-purple-500",
    probability: 50,
  },
  {
    id: "negotiation",
    name: "Negociación",
    color: "bg-amber-500",
    probability: 75,
  },
  { id: "closed_won", name: "Ganado", color: "bg-green-500", probability: 100 },
  { id: "closed_lost", name: "Perdido", color: "bg-red-500", probability: 0 },
];

export default function PipelinePanel() {
  const { tenant } = useSystemConfig();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    if (!tenant.id || tenant.id === "none") return;
    setLoading(true);
    try {
      // Usaremos localDb.sys_config para guardar el pipeline si no hay tabla específica,
      // pero v15 tiene crm_chats. Podríamos usar una tabla genérica o sys_config.
      // Basado en localDb.ts v15, no hay 'crm_deals'. Crearemos una lógica de persistencia en sys_config o localDb.tenants metadata.
      // MEJOR: Usar una tabla dedicada si existe o sys_config para el estado del pipeline.
      const data = await localDb.sys_config.get(`${tenant.id}_crm_pipeline`);
      if (data && data.value_json) {
        setDeals(data.value_json as Deal[]);
      } else {
        setDeals([]);
      }
    } catch (error) {
      console.error("[PipelinePanel] Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const saveDeals = async (newDeals: Deal[]) => {
    if (!tenant.id) return;
    try {
      await localDb.sys_config.put({
        id: `${tenant.id}_crm_pipeline`,
        tenant_id: tenant.id,
        module: "crm",
        key: "pipeline",
        value_json: newDeals,
        updated_at: new Date().toISOString(),
      });
      setDeals(newDeals);
    } catch (error) {
      console.error("[PipelinePanel] Error saving deals:", error);
      toast.error("Error al guardar cambios en el pipeline.");
    }
  };

  const handleUpdateStage = async (dealId: string, newStage: string) => {
    const newDeals = deals.map((d) =>
      d.id === dealId ? { ...d, stage: newStage } : d,
    );
    await saveDeals(newDeals);
  };

  const handleAddDeal = async () => {
    const newDeal: Deal = {
      id: crypto.randomUUID(),
      title: "Nueva Oportunidad",
      company: "Cliente Nuevo",
      contact: "Contacto",
      value: 0,
      probability: 10,
      stage: "lead",
      expectedCloseDate: new Date().toISOString().split("T")[0],
      assignedTo: "Sin asignar",
      lastActivity: "Creado ahora",
      tags: [],
    };
    await saveDeals([newDeal, ...deals]);
    toast.success("Nueva oportunidad añadida.");
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + deal.value, 0);
  };

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  if (loading)
    return <div className="p-10 text-center">Cargando Pipeline...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
          <Card className="px-4 py-2">
            <div className="text-subtitle text-muted-foreground">
              Valor Total
            </div>
            <div className="text-numeric text-xl">
              ${totalPipelineValue.toLocaleString()}
            </div>
          </Card>
        </div>
        <Button onClick={handleAddDeal}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Oportunidad
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.id);
          const stageValue = getTotalValueByStage(stage.id);

          return (
            <div
              key={stage.id}
              className="min-w-[300px] w-[300px] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="text-card-title text-sm">{stage.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {stageDeals.length}
                  </Badge>
                </div>
                <span className="text-numeric text-xs text-muted-foreground">
                  ${stageValue.toLocaleString()}
                </span>
              </div>

              <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2 space-y-3 border border-dashed border-border/50">
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-3">
                      <div>
                        <h4 className="text-subtitle leading-tight">
                          {deal.title}
                        </h4>
                        <p className="text-body text-xs text-muted-foreground mt-1">
                          {deal.company}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-numeric text-xs">
                          <DollarSign className="w-3 h-3 text-green-600" />$
                          {deal.value.toLocaleString()}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-numeric text-[10px]"
                        >
                          {deal.probability}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-dashed">
                        <div className="flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          {deal.contact}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {deal.expectedCloseDate}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageDeals.length === 0 && (
                  <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                    Arrastra aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
