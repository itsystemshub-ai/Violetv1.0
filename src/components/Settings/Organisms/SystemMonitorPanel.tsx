import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Zap,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface SystemStatus {
  app: {
    status: "online" | "offline";
    port: number;
    uptime: string;
  };
  proxy: {
    status: "online" | "offline";
    port: number;
    endpoint: string;
  };
  database: {
    status: "online" | "offline";
    records: number;
  };
  network: {
    status: "online" | "offline";
    latency: number;
  };
}

const SystemMonitorPanel: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    app: { status: "online", port: 8080, uptime: "0h 0m" },
    proxy: { status: "offline", port: 3001, endpoint: "/api/groq/chat" },
    database: { status: "online", records: 0 },
    network: { status: "online", latency: 0 },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const checkSystemStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Check proxy health
      const proxyStatus = await fetch("http://localhost:3001/health", {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => res.ok ? "online" : "offline")
        .catch(() => "offline");

      // Check network
      const networkStart = Date.now();
      const networkStatus = await fetch("http://localhost:8080", {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      })
        .then((res) => {
          const latency = Date.now() - networkStart;
          return { status: res.ok ? "online" : "offline", latency };
        })
        .catch(() => ({ status: "offline" as const, latency: 0 }));

      // Get database info from localStorage
      const dbKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("violet-") || key.includes("tenant") || key.includes("user")
      );

      // Calculate uptime (simplified)
      const startTime = sessionStorage.getItem("app-start-time");
      let uptime = "0h 0m";
      if (startTime) {
        const diff = Date.now() - parseInt(startTime);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        uptime = `${hours}h ${minutes}m`;
      } else {
        sessionStorage.setItem("app-start-time", Date.now().toString());
      }

      setSystemStatus({
        app: {
          status: "online",
          port: 8080,
          uptime,
        },
        proxy: {
          status: proxyStatus as "online" | "offline",
          port: 3001,
          endpoint: "/api/groq/chat",
        },
        database: {
          status: "online",
          records: dbKeys.length,
        },
        network: {
          status: networkStatus.status,
          latency: networkStatus.latency,
        },
      });

      setLastUpdate(new Date());
      toast.success("Estado del sistema actualizado");
    } catch (error) {
      console.error("Error checking system status:", error);
      toast.error("Error al verificar el estado del sistema");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: "online" | "offline") => {
    return status === "online" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: "online" | "offline") => {
    return status === "online" ? (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        En Línea
      </Badge>
    ) : (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
        Fuera de Línea
      </Badge>
    );
  };

  const getNetworkQuality = (latency: number) => {
    if (latency === 0) return { label: "Desconocido", color: "text-gray-500", progress: 0 };
    if (latency < 50) return { label: "Excelente", color: "text-emerald-500", progress: 100 };
    if (latency < 100) return { label: "Bueno", color: "text-green-500", progress: 75 };
    if (latency < 200) return { label: "Regular", color: "text-yellow-500", progress: 50 };
    return { label: "Lento", color: "text-red-500", progress: 25 };
  };

  const networkQuality = getNetworkQuality(systemStatus.network.latency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Monitoreo del Sistema
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Estado en tiempo real de los servicios de Violet ERP
          </p>
        </div>
        <Button
          onClick={checkSystemStatus}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Last Update */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        Última actualización: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Application Status */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Aplicación Principal
              </CardTitle>
              {getStatusIcon(systemStatus.app.status)}
            </div>
            <CardDescription>Servidor Vite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(systemStatus.app.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puerto</span>
              <span className="text-sm font-mono">{systemStatus.app.port}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tiempo activo</span>
              <span className="text-sm font-mono">{systemStatus.app.uptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">URL</span>
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                localhost:8080
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Proxy Status */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Servidor Proxy IA
              </CardTitle>
              {getStatusIcon(systemStatus.proxy.status)}
            </div>
            <CardDescription>Groq API Proxy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(systemStatus.proxy.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puerto</span>
              <span className="text-sm font-mono">{systemStatus.proxy.port}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Endpoint</span>
              <span className="text-xs font-mono">{systemStatus.proxy.endpoint}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Health Check</span>
              <a
                href="http://localhost:3001/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Verificar
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Base de Datos
              </CardTitle>
              {getStatusIcon(systemStatus.database.status)}
            </div>
            <CardDescription>LocalStorage & IndexedDB</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(systemStatus.database.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registros</span>
              <span className="text-sm font-mono">{systemStatus.database.records}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <span className="text-sm">Local</span>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {systemStatus.network.status === "online" ? (
                  <Wifi className="w-4 h-4 text-primary" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                Red
              </CardTitle>
              {getStatusIcon(systemStatus.network.status)}
            </div>
            <CardDescription>Conectividad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(systemStatus.network.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latencia</span>
              <span className="text-sm font-mono">{systemStatus.network.latency}ms</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calidad</span>
                <span className={`text-sm font-medium ${networkQuality.color}`}>
                  {networkQuality.label}
                </span>
              </div>
              <Progress value={networkQuality.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {systemStatus.proxy.status === "offline" && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              Advertencia: Proxy de IA Desconectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              El servidor proxy de IA no está respondiendo. El chat de IA no funcionará hasta que se inicie el proxy.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Para solucionar:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Cierra la aplicación actual</li>
                <li>Ejecuta: <code className="bg-muted px-1 py-0.5 rounded">INICIO_RAPIDO.bat</code></li>
                <li>O ejecuta: <code className="bg-muted px-1 py-0.5 rounded">npm run dev:full</code></li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Plataforma</span>
            <span className="text-sm font-medium">{navigator.platform}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Navegador</span>
            <span className="text-sm font-medium">
              {navigator.userAgent.includes("Chrome") ? "Chrome" : 
               navigator.userAgent.includes("Firefox") ? "Firefox" : 
               navigator.userAgent.includes("Safari") ? "Safari" : "Otro"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Idioma</span>
            <span className="text-sm font-medium">{navigator.language}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Online</span>
            <span className="text-sm font-medium">{navigator.onLine ? "Sí" : "No"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitorPanel;
