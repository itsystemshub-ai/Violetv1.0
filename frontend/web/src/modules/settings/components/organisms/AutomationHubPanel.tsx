import React, { useEffect, useState } from "react";
import { localDb } from "@/core/database/localDb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RefreshCw, Send, Trash2, Cpu, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AutomationHubPanel() {
  const [queue, setQueue] = useState<any[]>([]);
  const [webhookUrl, setWebhookUrl] = useState(
    import.meta.env.VITE_N8N_WEBHOOK_URL || "",
  );
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const items = await localDb
        .table("automation_queue")
        .orderBy("timestamp")
        .reverse()
        .limit(10)
        .toArray();
      setQueue(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const clearQueue = async () => {
    await localDb.table("automation_queue").clear();
    toast.success("Cola de automatización limpiada");
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      <Card className="border-violet-500/20 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Configuración de n8n</CardTitle>
              <CardDescription>
                Endpoint principal para la orquestación enterprise
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="webhookUrl">n8n Webhook Base URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhookUrl"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.tu-empresa.com/webhook"
                className="bg-white/50 dark:bg-slate-950/50"
              />
              <Button
                onClick={() => toast.success("Configuración guardada (Local)")}
              >
                Guardar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-500/20 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Cola de Eventos Local</CardTitle>
                <CardDescription>
                  Eventos pendientes de sincronización (Self-Healing)
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchQueue}
                disabled={loading}
              >
                <RefreshCw
                  className={
                    loading ? "animate-spin mr-2 h-4 w-4" : "mr-2 h-4 w-4"
                  }
                />
                Actualizar
              </Button>
              <Button variant="destructive" size="sm" onClick={clearQueue}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>WebHook</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay eventos pendientes en la cola.
                  </TableCell>
                </TableRow>
              ) : (
                queue.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === "sent"
                            ? "default"
                            : event.status === "pending"
                              ? "outline"
                              : "destructive"
                        }
                        className="uppercase text-[9px]"
                      >
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {event.webhookUrl}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
