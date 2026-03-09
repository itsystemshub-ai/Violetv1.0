/**
 * TicketsPanel - Sistema de tickets y soporte al cliente
 */

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
  Ticket,
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";

const TICKETS = [
  {
    id: "1",
    title: "Error en sincronización de stock",
    priority: "High",
    status: "Open",
    user: "Ana García",
    date: "Hace 2 horas",
    category: "Technical",
  },
  {
    id: "2",
    title: "Solicitud de nueva funcionalidad",
    priority: "Medium",
    status: "In Progress",
    user: "Roberto Lee",
    date: "Ayer",
    category: "Feature",
  },
  {
    id: "3",
    title: "Problema con acceso de usuario",
    priority: "Low",
    status: "Closed",
    user: "Mario Casas",
    date: "Hace 3 días",
    category: "Access",
  },
];

export default function TicketsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Tickets Abiertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Resueltos Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {TICKETS.map((ticket) => (
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
                    <Ticket className="w-5 h-5" />
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
      </div>
    </div>
  );
}
