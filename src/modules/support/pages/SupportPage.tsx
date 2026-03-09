/**
 * SupportPage - Soporte Técnico del Sistema
 * Incluye: Diagnóstico del sistema, envío de tickets, FAQ, contacto
 */

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Send,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  HardDrive,
  Cpu,
  Globe,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Bug,
  Lightbulb,
  Wrench,
  Shield,
  Info,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { toast } from "sonner";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { localDb } from "@/core/database/localDb";

// FAQ Data
const faqItems = [
  {
    question: "¿Cómo puedo generar una factura?",
    answer:
      'Ve a Ventas → Facturas → haz clic en "Nueva Factura". Completa los datos del cliente, agrega los productos y haz clic en "Guardar". Puedes imprimir o exportar la factura en PDF.',
  },
  {
    question: "¿Cómo agrego un nuevo producto al inventario?",
    answer:
      'Ve a Inventario → Productos → haz clic en "Nuevo Producto". Completa el nombre, código, categoría, precio y stock inicial. El producto estará disponible inmediatamente para ventas.',
  },
  {
    question: "¿Cómo configuro la tasa de cambio BCV?",
    answer:
      'Ve a Configuración → Sistema. En la sección de tasa de cambio, puedes sincronizar automáticamente con el BCV haciendo clic en "Sincronizar BCV" o ingresar la tasa manualmente.',
  },
  {
    question: "¿Cómo agrego usuarios al sistema?",
    answer:
      'Ve a Configuración → Usuarios → "Agregar Usuario". Ingresa nombre, correo, contraseña y asigna un rol. También puedes generar usuarios predeterminados con el botón correspondiente.',
  },
  {
    question: "¿Por qué la app no se conecta al servidor?",
    answer:
      'Verifica que el servidor esté encendido y conectado a la misma red WiFi. En la barra inferior puedes ver el estado de conexión. Si dice "Local" u "Offline", la sincronización en red no está activa.',
  },
  {
    question: "¿Cómo hago un respaldo de la base de datos?",
    answer:
      'Ve a Configuración → Seguridad → sección "Respaldos". Haz clic en "Crear Respaldo" para generar una copia de seguridad. Se guardará automáticamente en la carpeta de respaldos del sistema.',
  },
  {
    question: "¿Cómo puedo ver los reportes de ventas?",
    answer:
      "Ve a Reportes → Reportes de Ventas. Puedes filtrar por fecha, vendedor, cliente y tipo de documento. Los reportes se pueden exportar en PDF y Excel.",
  },
  {
    question: "¿Cómo funciona el módulo de IA?",
    answer:
      "Ve a Inteligencia Artificial desde el menú lateral. El asistente IA puede ayudarte con análisis de ventas, predicciones de inventario, automatización de procesos y más. Escribe tu consulta en lenguaje natural.",
  },
];

// Ticket types
const ticketTypes = [
  { value: "error", label: "Error / Bug", icon: "🐛", color: "text-red-500" },
  {
    value: "consulta",
    label: "Consulta General",
    icon: "❓",
    color: "text-blue-500",
  },
  {
    value: "mejora",
    label: "Solicitud de Mejora",
    icon: "💡",
    color: "text-amber-500",
  },
  {
    value: "instalacion",
    label: "Instalación / Config",
    icon: "🔧",
    color: "text-emerald-500",
  },
  {
    value: "seguridad",
    label: "Seguridad",
    icon: "🔒",
    color: "text-violet-500",
  },
];

interface SystemInfo {
  platform: string;
  arch: string;
  userAgent: string;
  language: string;
  memory: string;
  cores: number;
  screenRes: string;
  colorDepth: number;
  online: boolean;
  timestamp: string;
  appVersion: string;
}

function getSystemInfo(): SystemInfo {
  const nav = navigator as any;
  return {
    platform: nav.platform || "Desconocido",
    arch: nav.userAgentData?.platform || nav.platform || "Desconocido",
    userAgent: nav.userAgent?.substring(0, 80) + "...",
    language: nav.language || "es",
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : "No disponible",
    cores: nav.hardwareConcurrency || 0,
    screenRes: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    online: nav.onLine,
    timestamp: new Date().toLocaleString("es-VE"),
    appVersion: "3.0.0",
  };
}

export default function SupportPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [ticketType, setTicketType] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSent, setTicketSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedTickets, setSavedTickets] = useState<any[]>([]);

  useEffect(() => {
    setSystemInfo(getSystemInfo());
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const ticketsData = await localDb.sys_config.get(
        "violet_support_tickets",
      );
      if (ticketsData && ticketsData.value_json) {
        setSavedTickets(ticketsData.value_json as any[]);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const refreshSystemInfo = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSystemInfo(getSystemInfo());
      setIsRefreshing(false);
      toast.success("Diagnóstico actualizado");
    }, 800);
  };

  const handleSubmitTicket = () => {
    if (!ticketType || !ticketSubject || !ticketDescription) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    // Save ticket locally
    const ticket = {
      id: `TKT-${Date.now().toString(36).toUpperCase()}`,
      type: ticketType,
      subject: ticketSubject,
      description: ticketDescription,
      email: ticketEmail,
      systemInfo,
      createdAt: new Date().toISOString(),
      status: "abierto",
    };

    // Store in localDb
    const updateTickets = async () => {
      try {
        const newTickets = [...savedTickets, ticket];
        setSavedTickets(newTickets);
        await localDb.sys_config.set("violet_support_tickets", "", newTickets);
        toast.success(`Ticket ${ticket.id} creado exitosamente`, {
          description: "Nuestro equipo lo revisará pronto.",
        });
      } catch (error) {
        console.error("Error saving ticket:", error);
        toast.error("Error al guardar el ticket de soporte");
      }
    };

    updateTickets();

    setTicketSent(true);
    setTicketType("");
    setTicketSubject("");
    setTicketDescription("");
    setTicketEmail("");

    setTimeout(() => setTicketSent(false), 5000);
  };

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="min-h-full relative pb-12 animate-in fade-in duration-700 overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
        <div className="fixed top-0 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

        <div className="space-y-8 relative z-0 p-4 sm:p-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Headphones className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Soporte Técnico
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Centro de ayuda, diagnóstico y tickets de soporte
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Ticket Form + Recent Tickets */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Form */}
              <Card className="backdrop-blur-xl bg-card/80 border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                    Crear Ticket de Soporte
                  </CardTitle>
                  <CardDescription>
                    Describe tu problema o consulta y te ayudaremos lo más
                    pronto posible
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticketSent ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in zoom-in duration-500">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ¡Ticket Enviado!
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md">
                        Tu ticket ha sido registrado exitosamente. Nuestro
                        equipo técnico lo revisará pronto.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold">
                            Tipo de Solicitud *
                          </Label>
                          <Select
                            value={ticketType}
                            onValueChange={setTicketType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {ticketTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  <span className="flex items-center gap-2">
                                    <span>{t.icon}</span> {t.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">
                            Correo de Contacto
                          </Label>
                          <Input
                            type="email"
                            placeholder="tu@correo.com"
                            value={ticketEmail}
                            onChange={(e) => setTicketEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Asunto *</Label>
                        <Input
                          placeholder="Describe brevemente el problema..."
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">
                          Descripción Detallada *
                        </Label>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Describe con detalle lo que sucede, pasos para reproducir, mensajes de error, etc..."
                          value={ticketDescription}
                          onChange={(e) => setTicketDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Info className="h-4 w-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          La información de diagnóstico del sistema se adjuntará
                          automáticamente al ticket.
                        </p>
                      </div>
                      <Button
                        onClick={handleSubmitTicket}
                        className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                        size="lg"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Ticket
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Recent Tickets */}
              {savedTickets.length > 0 && (
                <Card className="backdrop-blur-xl bg-card/80 border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5 text-violet-500" />
                      Tickets Recientes ({savedTickets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {savedTickets
                        .slice(-5)
                        .reverse()
                        .map((ticket: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {ticketTypes.find(
                                  (t) => t.value === ticket.type,
                                )?.icon || "📋"}
                              </span>
                              <div>
                                <p className="font-semibold text-sm">
                                  {ticket.subject}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {ticket.id} •{" "}
                                  {new Date(
                                    ticket.createdAt,
                                  ).toLocaleDateString("es-VE")}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-emerald-500 border-emerald-500/30"
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* FAQ */}
              <Card className="backdrop-blur-xl bg-card/80 border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Preguntas Frecuentes
                  </CardTitle>
                  <CardDescription>
                    Respuestas a las consultas más comunes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {faqItems.map((faq, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg overflow-hidden transition-all"
                      >
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                          onClick={() =>
                            setExpandedFaq(expandedFaq === idx ? null : idx)
                          }
                        >
                          <span className="font-medium text-sm">
                            {faq.question}
                          </span>
                          {expandedFaq === idx ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {expandedFaq === idx && (
                          <div className="px-3 pb-3 text-sm text-muted-foreground animate-in slide-in-from-top-2 duration-300">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - System Diagnostics + Contact */}
            <div className="space-y-6">
              {/* System Diagnostics */}
              <Card className="backdrop-blur-xl bg-card/80 border shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Monitor className="h-5 w-5 text-blue-500" />
                      Diagnóstico del Sistema
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={refreshSystemInfo}
                      className="h-8 w-8"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemInfo && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-medium">
                            Plataforma
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.platform}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-xs font-medium">
                            Núcleos CPU
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.cores}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium">Memoria</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.memory}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-medium">
                            Resolución
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.screenRes}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-xs font-medium">Idioma</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.language}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          {systemInfo.online ? (
                            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <span className="text-xs font-medium">Conexión</span>
                        </div>
                        <Badge
                          variant={
                            systemInfo.online ? "default" : "destructive"
                          }
                          className="text-[10px] h-5"
                        >
                          {systemInfo.online ? "En línea" : "Sin conexión"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-rose-400" />
                          <span className="text-xs font-medium">
                            Fecha/Hora
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {systemInfo.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-xs font-bold">Violet ERP</span>
                        </div>
                        <Badge className="bg-violet-500/20 text-violet-600 dark:text-violet-300 text-[10px] h-5">
                          v{systemInfo.appVersion}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="backdrop-blur-xl bg-card/80 border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-5 w-5 text-emerald-500" />
                    Contacto Directo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="tel:+584126802831"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Teléfono</p>
                      <p className="text-xs text-muted-foreground">
                        +58 412 680 2831
                      </p>
                    </div>
                  </a>
                  <a
                    href="https://wa.me/584126802831"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">
                        +58 412 680 2831
                      </p>
                    </div>
                  </a>
                  <a
                    href="mailto:IT.SYSTEMS.HUB@GMAIL.COM"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Correo Electrónico
                      </p>
                      <p className="text-xs text-muted-foreground">
                        IT.SYSTEMS.HUB@GMAIL.COM
                      </p>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="backdrop-blur-xl bg-card/80 border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-5 w-5 text-amber-500" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      // Solo borrar datos de caché UI, MANTENER tokens y llaves
                      const keysToRemove = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        // No borrar llaves de encriptación, tokens ni estado de auth
                        if (
                          key &&
                          !key.includes("encryption") &&
                          !key.includes("auth") &&
                          !key.includes("token")
                        ) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach((k) => localStorage.removeItem(k));
                      toast.success(
                        "Caché limpiado exitosamente (datos críticos conservados)",
                      );
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Limpiar Caché Local
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (systemInfo) {
                        const report = `DIAGNÓSTICO VIOLET ERP\n${"=".repeat(40)}\nFecha: ${systemInfo.timestamp}\nPlataforma: ${systemInfo.platform}\nCPU Cores: ${systemInfo.cores}\nMemoria: ${systemInfo.memory}\nResolución: ${systemInfo.screenRes}\nConexión: ${systemInfo.online ? "En línea" : "Sin conexión"}\nVersión: ${systemInfo.appVersion}\nIdioma: ${systemInfo.language}`;
                        const blob = new Blob([report], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `diagnostico-violet-${new Date().toISOString().slice(0, 10)}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Diagnóstico exportado");
                      }
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Exportar Diagnóstico
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => (window.location.hash = "/settings")}
                  >
                    <Wrench className="h-4 w-4" />
                    Ir a Configuración
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ValeryLayout>
  );
}
