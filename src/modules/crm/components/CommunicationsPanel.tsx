/**
 * CommunicationsPanel - Historial de interacciones con clientes + WhatsApp Live
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Mail, Phone, MessageSquare, History, MessageCircle } from "lucide-react";
import { WhatsAppChat } from "./WhatsAppChat";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/core/shared/utils/utils";

const INTERACTIONS = [
  {
    id: "1",
    type: "Email",
    subject: "Seguimiento de Propuesta",
    user: "Juan Pérez",
    date: "2024-03-01 10:30",
    status: "Leído",
  },
  {
    id: "2",
    type: "Llamada",
    subject: "Consulta de Precios",
    user: "María García",
    date: "2024-03-01 09:15",
    status: "Completada",
  },
  {
    id: "3",
    type: "WhatsApp",
    subject: "Confirmación de Reunión",
    user: "Carlos Ruiz",
    date: "2024-02-29 16:45",
    status: "Enviado",
  },
];

export default function CommunicationsPanel() {
  const [view, setView] = useState<"whatsapp" | "history">("whatsapp");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit border shadow-inner">
        <Button 
          variant={view === "whatsapp" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setView("whatsapp")}
          className={cn(
            "rounded-xl gap-2 font-bold px-4 transition-all",
            view === "whatsapp" && "bg-primary shadow-lg shadow-primary/25"
          )}
        >
          <MessageCircle size={16} />
          WhatsApp Live
        </Button>
        <Button 
          variant={view === "history" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setView("history")}
          className={cn(
            "rounded-xl gap-2 font-bold px-4 transition-all",
            view === "history" && "bg-primary shadow-lg shadow-primary/25"
          )}
        >
          <History size={16} />
          Historial Logs
        </Button>
      </div>

      {view === "whatsapp" ? (
        <WhatsAppChat />
      ) : (
        <Card className="border shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-card/80">
          <CardHeader className="border-b bg-muted/30 p-6">
            <CardTitle className="text-xl font-black flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                 <History className="text-primary" size={20} />
               </div>
               Historial de Comunicaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {INTERACTIONS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-sm",
                      item.type === "Email" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                      item.type === "Llamada" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                      "bg-violet-500/10 text-violet-600 border border-violet-500/20"
                    )}>
                      {item.type === "Email" ? (
                        <Mail className="w-5 h-5" />
                      ) : item.type === "Llamada" ? (
                        <Phone className="w-5 h-5" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base group-hover:text-primary transition-colors">{item.subject}</h4>
                      <p className="text-sm text-muted-foreground font-medium">
                        {item.user} • <span className="opacity-70">{item.date}</span>
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]",
                      item.status === "Leído" ? "bg-blue-500/10 text-blue-700" :
                      item.status === "Completada" ? "bg-emerald-500/10 text-emerald-700" :
                      "bg-violet-500/10 text-violet-700"
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
