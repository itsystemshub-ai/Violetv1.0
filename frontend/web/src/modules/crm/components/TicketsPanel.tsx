/**
 * TicketsPanel - Sistema de tickets y soporte al cliente
 */

import { useState, useEffect, useCallback } from "react";
import { localDb } from "@/core/database/localDb";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Ticket as TicketIcon,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Plus,
} from "lucide-react";

interface Ticket {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Closed";
  user: string;
  date: string;
  category: string;
}

export default function TicketsPanel() {
  const { tenant } = useSystemConfig();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!tenant.id || tenant.id === "none") return;
    setLoading(true);
    try {
      const data = await localDb.sys_config.get(`${tenant.id}_crm_tickets`);
      if (data && data.value_json) {
        setTickets(data.value_json as Ticket[]);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("[TicketsPanel] Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const saveTickets = async (newTickets: Ticket[]) => {
    if (!tenant.id) return;
    try {
      await localDb.sys_config.put({
        id: `${tenant.id}_crm_tickets`,
        tenant_id: tenant.id,
        module: "crm",
        key: "tickets",
        value_json: newTickets,
        updated_at: new Date().toISOString(),
      });
      setTickets(newTickets);
    } catch (error) {
      console.error("[TicketsPanel] Error saving tickets:", error);
      toast.error("Error al guardar tickets.");
    }
  };

  const handleAddTicket = async () => {
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      title: "Nuevo Ticket de Soporte",
      priority: "Medium",
      status: "Open",
      user: "Cliente",
      date: "Hoy",
      category: "Soporte",
    };
    await saveTickets([newTicket, ...tickets]);
    toast.success("Ticket creado.");
  };

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "In Progress",
  ).length;
  const closedCount = tickets.filter((t) => t.status === "Closed").length;

  if (loading)
    return <div className="p-10 text-center">Cargando Tickets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-bold">Resumen de Soporte</h3>
        <Button onClick={handleAddTicket} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Tickets Abiertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Resueltos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      ticket.status === "Open"
                        ? "bg-red-100 text-red-600"
                        : ticket.status === "Closed"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <TicketIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{ticket.title}</h4>
                      <Badge
                        variant={
                          ticket.priority === "High"
                            ? "destructive"
                            : ticket.priority === "Medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {ticket.user}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ticket.date}
                      </span>
                      <span>•</span>
                      <span className="uppercase font-semibold tracking-wider text-[9px]">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      ticket.status === "Open"
                        ? "text-red-600 border-red-200 bg-red-50"
                        : ticket.status === "Closed"
                          ? "text-green-600 border-green-200 bg-green-50"
                          : "text-blue-600 border-blue-200 bg-blue-50"
                    }
                  >
                    {ticket.status}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <div className="p-10 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            No hay tickets registrados.
          </div>
        )}
      </div>
    </div>
  );
}
