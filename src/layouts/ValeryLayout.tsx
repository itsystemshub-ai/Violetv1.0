/**
 * ValeryLayout - Layout principal estilo Valery Profesional
 * Incluye: Barra de menú superior, panel lateral, área de trabajo, barra de estado
 */

import React, { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Settings,
  HelpCircle,
  User,
  Building2,
  Calendar,
  Wifi,
  WifiOff,
  Database,
  Cloud,
  CloudOff,
  Search,
  LogOut,
  Clock,
  Headphones,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { NotificationCenter } from "@/shared/components/layout/Layout/molecules/NotificationCenter";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useTenant } from "@/shared/hooks/useTenant";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { cn } from "@/core/shared/utils/utils";
import { useCurrencyStore } from "@/shared/hooks/useCurrencyStore";
import { useUIStore } from "@/shared/hooks/useUIStore";
import { useEffect, memo } from "react";
import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/shared/components/common/ErrorBoundary";
import ValerySidebar from "@/components/navigation/ValerySidebar";

// Sub-componente optimizado para la hora para evitar re-renders del layout completo
const StatusBarClock = memo(() => {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("es-VE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 30000); // Actualizar cada 30s es suficiente para HH:mm
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/5"
      title="Hora actual"
    >
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono font-semibold text-foreground tabular-nums">
        {time}
      </span>
    </div>
  );
});

StatusBarClock.displayName = "StatusBarClock";

// Sub-componente optimizado para la fecha
const StatusBarDate = memo(() => {
  const currentDate = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
      title="Fecha actual"
    >
      <Calendar className="h-3.5 w-3.5 text-primary" />
      <span className="capitalize font-medium text-foreground">
        {currentDate}
      </span>
    </div>
  );
});

StatusBarDate.displayName = "StatusBarDate";

export const ValeryLayout: React.FC = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const uiStore = useUIStore();

  // Aplicar zoom global persistente
  useEffect(() => {
    document.documentElement.style.zoom = String(uiStore.zoomLevel);
  }, [uiStore.zoomLevel]);
  const appName = import.meta.env.VITE_APP_NAME || "Violet ERP";
  const appInitial = appName.charAt(0);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const currencyStore = useCurrencyStore();
  const { user, logout } = useAuth();
  const { tenant, allTenants, switchTenant } = useTenant();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Barra de Menú Superior Unificada - Estilo Valery */}
      <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        {/* Logo y Menú */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <a
            href="/#/"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{appInitial}</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold">{appName}</h1>
              <p className="text-[10px] text-muted-foreground">
                Profesional 5.0
              </p>
            </div>
          </a>

          {/* Menú Principal */}
          <nav className="hidden md:flex items-center gap-1">
            {/* ARCHIVO */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Archivo
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                  Navegación Rápida
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/sales")}
                >
                  <span className="mr-2">🛒</span> Nueva Venta
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+N
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/sales/invoices")}
                >
                  <span className="mr-2">📄</span> Nueva Factura
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/sales/quotes")}
                >
                  <span className="mr-2">📋</span> Nueva Cotización
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/purchases")}
                >
                  <span className="mr-2">📦</span> Nueva Compra
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/inventory/products")}
                >
                  <span className="mr-2">📂</span> Abrir Inventario
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/sales/clients")}
                >
                  <span className="mr-2">👥</span> Abrir Clientes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <span className="mr-2">🖨️</span> Imprimir Página
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+P
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const data = JSON.stringify(
                      { export: appName, date: new Date().toISOString() },
                      null,
                      2,
                    );
                    const blob = new Blob([data], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `violet-export-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <span className="mr-2">💾</span> Exportar Datos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                  <span className="ml-auto text-xs text-muted-foreground">
                    Alt+F4
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EDICIÓN */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Edición
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => document.execCommand("copy")}>
                  <span className="mr-2">📋</span> Copiar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+C
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.execCommand("paste")}>
                  <span className="mr-2">📌</span> Pegar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+V
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.execCommand("cut")}>
                  <span className="mr-2">✂️</span> Cortar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+X
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => document.execCommand("selectAll")}
                >
                  <span className="mr-2">🔘</span> Seleccionar Todo
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+A
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const searchInput = document.querySelector(
                      'input[placeholder="Buscar..."]',
                    ) as HTMLInputElement;
                    if (searchInput) searchInput.focus();
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+K
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* VER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <span className="mr-2">{sidebarOpen ? "◀️" : "▶️"}</span>
                  {sidebarOpen
                    ? "Ocultar Panel Lateral"
                    : "Mostrar Panel Lateral"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                >
                  <span className="mr-2">🖥️</span>
                  {document.fullscreenElement
                    ? "Salir Pantalla Completa"
                    : "Pantalla Completa"}
                  <span className="ml-auto text-xs text-muted-foreground">
                    F11
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => uiStore.zoomIn()}>
                  <span className="mr-2">🔍</span> Acercar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl++
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => uiStore.zoomOut()}>
                  <span className="mr-2">🔎</span> Alejar
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+-
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => uiStore.resetZoom()}>
                  <span className="mr-2">↩️</span> Tamaño Original
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ctrl+0
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                  Módulos
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => (window.location.hash = "/")}>
                  <span className="mr-2">📊</span> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/finance")}
                >
                  <span className="mr-2">💰</span> Finanzas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/inventory")}
                >
                  <span className="mr-2">📦</span> Inventario
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/hr")}
                >
                  <span className="mr-2">👥</span> RRHH
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/crm")}
                >
                  <span className="mr-2">🤝</span> CRM
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* HERRAMIENTAS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Herramientas
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/settings/users")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Gestión de Usuarios
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/ai")}
                >
                  <span className="mr-2">🤖</span> Asistente IA
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/pos")}
                >
                  <span className="mr-2">💳</span> Punto de Venta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const calc = window.open(
                      "",
                      "calculator",
                      "width=320,height=480,menubar=no,toolbar=no",
                    );
                    if (calc) {
                      calc.document.title = "Calculadora Violet";
                      calc.document.body.innerHTML =
                        '<div style="font-family:system-ui;padding:20px;text-align:center"><h2>Calculadora</h2><input id="display" style="width:100%;font-size:24px;padding:10px;text-align:right;margin-bottom:10px" readonly/><div id="btns"></div></div>';
                      const btns = calc.document.getElementById("btns");
                      const display = calc.document.getElementById(
                        "display",
                      ) as HTMLInputElement;
                      let expr = "";
                      [
                        "7",
                        "8",
                        "9",
                        "/",
                        "4",
                        "5",
                        "6",
                        "*",
                        "1",
                        "2",
                        "3",
                        "-",
                        "0",
                        ".",
                        "=",
                        "+",
                        "C",
                      ].forEach((b) => {
                        const btn = calc.document.createElement("button");
                        btn.textContent = b;
                        btn.style.cssText =
                          "width:60px;height:50px;margin:3px;font-size:18px;border-radius:8px;border:1px solid #ccc;cursor:pointer;background:#f5f5f5";
                        btn.onclick = () => {
                          if (b === "C") {
                            expr = "";
                            display.value = "";
                          } else if (b === "=") {
                            try {
                              display.value = String(eval(expr));
                              expr = display.value;
                            } catch {
                              display.value = "Error";
                              expr = "";
                            }
                          } else {
                            expr += b;
                            display.value = expr;
                          }
                        };
                        btns?.appendChild(btn);
                      });
                    }
                  }}
                >
                  <span className="mr-2">🧮</span> Calculadora
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/reports/sales")}
                >
                  <span className="mr-2">📈</span> Reportes de Ventas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/reports/inventory")}
                >
                  <span className="mr-2">📊</span> Reportes de Inventario
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/reports/financial")}
                >
                  <span className="mr-2">📉</span> Reportes Financieros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AYUDA */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Ayuda
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem
                  onClick={() => {
                    const helpWindow = window.open(
                      "",
                      "help",
                      "width=600,height=500,menubar=no,toolbar=no",
                    );
                    if (helpWindow) {
                      helpWindow.document.title =
                        "Atajos de Teclado — Violet ERP";
                      helpWindow.document.body.innerHTML = `
                      <div style="font-family:system-ui;padding:30px;max-width:560px;margin:0 auto">
                        <h1 style="color:#7c3aed;margin-bottom:20px">⌨️ Atajos de Teclado</h1>
                        <table style="width:100%;border-collapse:collapse">
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Ctrl+N</b></td><td>Nueva Venta</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Ctrl+P</b></td><td>Imprimir Página</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Ctrl+K</b></td><td>Buscar</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>F11</b></td><td>Pantalla Completa</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Ctrl++/-</b></td><td>Zoom In / Out</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Ctrl+0</b></td><td>Restablecer Zoom</td></tr>
                          <tr style="border-bottom:1px solid #eee"><td style="padding:8px"><b>Alt+F4</b></td><td>Cerrar Aplicación</td></tr>
                        </table>
                      </div>`;
                    }
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Atajos de Teclado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/ai")}
                >
                  <span className="mr-2">🤖</span> Asistente IA
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => (window.location.hash = "/support")}
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  Soporte Técnico
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const aboutWindow = window.open(
                      "",
                      "about",
                      "width=450,height=400,menubar=no,toolbar=no",
                    );
                    if (aboutWindow) {
                      aboutWindow.document.title = "Acerca de " + appName;
                      aboutWindow.document.body.innerHTML = `
                      <div style="font-family:system-ui;padding:40px;text-align:center">
                        <div style="width:80px;height:80px;border-radius:20px;background:linear-gradient(135deg,#8b5cf6,#6366f1);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:white;font-size:36px;font-weight:bold">${appInitial}</div>
                        <h1 style="margin:0;color:#7c3aed">${appName}</h1>
                        <p style="color:#64748b;margin-top:5px">Profesional 5.0</p>
                        <hr style="margin:20px 0;border-color:#eee"/>
                        <p style="color:#475569;font-size:14px">Sistema de Planificación de Recursos Empresariales de última generación.</p>
                        <p style="color:#94a3b8;font-size:12px;margin-top:15px">Versión 3.0.0</p>
                        <p style="color:#94a3b8;font-size:11px">© 2024-2026 Violet Systems</p>
                        <p style="color:#94a3b8;font-size:11px;margin-top:5px">Todos los derechos reservados</p>
                      </div>`;
                    }
                  }}
                >
                  <span className="mr-2">💜</span> Acerca de {appName}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Usuario y Estado */}
        <div className="flex items-center gap-3">
          {/* Currency Toggle */}
          <button
            onClick={currencyStore.toggleCurrency}
            className={cn(
              "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-300 hover:scale-105",
              currencyStore.currency === "USD"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500"
                : "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:border-violet-500",
            )}
            title={`Cambiar a ${currencyStore.currency === "USD" ? "Bolívares" : "Dólares"} | Tasa: ${currencyStore.exchangeRate} Bs/$`}
          >
            <span
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black transition-all duration-300",
                currencyStore.currency === "USD"
                  ? "bg-emerald-500"
                  : "bg-violet-500",
              )}
            >
              {currencyStore.currency === "USD" ? "$" : "Bs"}
            </span>
            <span className="hidden lg:inline">
              {currencyStore.currency === "USD" ? "USD" : "VES"}
            </span>
          </button>

          {/* Búsqueda */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64 h-9 bg-muted/30 border-dashed"
                onFocus={() => setSearchOpen(true)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-5 h-5 text-muted-foreground" />
          </Button>

          {/* Estado Cloud */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
            {cloudEnabled ? (
              <>
                <Cloud className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium">Sincronizado</span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Local
                </span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notificaciones */}
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
          />

          {/* Usuario Mejorado */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 p-1 hover:bg-accent rounded-full"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name?.substring(0, 2).toUpperCase() ||
                      user?.username?.substring(0, 2).toUpperCase() ||
                      "SA"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl shadow-xl"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">
                    {user?.name || "Super Admin"}
                  </p>
                  <p className="text-[10px] leading-none text-muted-foreground">
                    @{user?.username || "superadmin"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {allTenants && allTenants.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[9px] uppercase text-muted-foreground tracking-widest font-black">
                    Empresa Actual
                  </DropdownMenuLabel>
                  <div className="max-h-[200px] overflow-y-auto">
                    {allTenants.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => switchTenant(t.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span
                          className={
                            t.id === tenant?.id ? "font-bold text-primary" : ""
                          }
                        >
                          {t.name}
                        </span>
                        {t.id === tenant?.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Lateral - Estilo Valery */}
        <aside
          className={cn(
            "w-56 border-r bg-card/30 backdrop-blur-sm overflow-y-auto transition-all duration-300",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
            "absolute lg:relative z-40 h-full",
          )}
        >
          <ValerySidebar />
        </aside>

        {/* Área de Trabajo */}
        <main className="flex-1 overflow-auto bg-background">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Barra de Estado Inferior - Estilo Valery Mejorado */}
      <footer className="h-9 border-t bg-linear-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-md flex items-center justify-between px-4 text-xs shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          {/* Usuario */}
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
            title="Usuario actual"
          >
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">
              {user?.username || "Usuario"}
            </span>
          </div>

          {/* Empresa */}
          <div
            className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
            title="Empresa activa"
          >
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              {tenant?.name || "Sin empresa"}
            </span>
          </div>

          {/* Separador */}
          <div className="hidden md:block h-4 w-px bg-border" />

          {/* Conexión */}
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-md"
            title={cloudEnabled ? "Conectado a la nube" : "Modo local"}
          >
            {cloudEnabled ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Cloud
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Local
                </span>
              </>
            )}
          </div>

          {/* Modo */}
          <div
            className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 text-primary"
            title="Modo de operación"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="font-medium text-xs">
              {cloudEnabled ? "Sincronizado" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Fecha */}
          <StatusBarDate />

          {/* Separador */}
          <div className="hidden md:block h-4 w-px bg-border" />

          {/* Hora */}
          <StatusBarClock />

          {/* Versión */}
          <div
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Versión del sistema"
          >
            <span className="text-[10px] font-medium">v3.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default ValeryLayout;
