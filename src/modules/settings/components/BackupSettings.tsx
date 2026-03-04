import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Database,
  Download,
  Upload,
  Clock,
  FileJson,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { backupService, BackupConfig } from "@/services/backup/BackupService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const BackupSettings = () => {
  const [config, setConfig] = useState<BackupConfig>(backupService.getConfig());
  const [history, setHistory] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setHistory(backupService.getBackupHistory());
  };

  const handleConfigChange = (key: keyof BackupConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    backupService.updateConfig(newConfig);
    toast.success("Configuración actualizada");
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    await backupService.createBackup(true);
    loadHistory();
    setIsCreating(false);
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await backupService.restoreBackup(file);
    if (success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("es-VE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuración de Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Configuración de Backup Automático
          </CardTitle>
          <CardDescription>
            Configura copias de seguridad automáticas de toda la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del backup */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {config.enabled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-semibold">
                  {config.enabled ? "Backup Automático Activo" : "Backup Automático Desactivado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.enabled
                    ? `Frecuencia: ${config.frequency === "minute" ? "Cada minuto" : config.frequency === "hourly" ? "Cada hora" : "Diario"}`
                    : "Activa el backup para proteger tus datos"}
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleConfigChange("enabled", checked)}
            />
          </div>

          {/* Frecuencia */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Frecuencia de Backup
            </Label>
            <Select
              value={config.frequency}
              onValueChange={(value) => handleConfigChange("frequency", value)}
              disabled={!config.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minute">Cada minuto (desarrollo)</SelectItem>
                <SelectItem value="hourly">Cada hora</SelectItem>
                <SelectItem value="daily">Diario (recomendado)</SelectItem>
                <SelectItem value="manual">Solo manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportación</Label>
            <Select
              value={config.format}
              onValueChange={(value) => handleConfigChange("format", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Todos los formatos (JSON + Excel + SQL)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    JSON (universal)
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value="sql">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    SQL (MySQL/PostgreSQL)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Descarga Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Descargar archivo al crear backup
                </p>
              </div>
              <Switch
                checked={config.autoDownload}
                onCheckedChange={(checked) => handleConfigChange("autoDownload", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Incluir Imágenes</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir fotos de productos (aumenta tamaño)
                </p>
              </div>
              <Switch
                checked={config.includeImages}
                onCheckedChange={(checked) => handleConfigChange("includeImages", checked)}
              />
            </div>
          </div>

          {/* Acciones manuales */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isCreating ? "Creando..." : "Crear Backup Ahora"}
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <label>
                <Upload className="w-4 h-4 mr-2" />
                Restaurar Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Backups</CardTitle>
          <CardDescription>
            Últimos {config.maxBackups} backups creados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No hay backups en el historial</p>
              <p className="text-sm">Crea tu primer backup para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((backup, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(backup.timestamp)} • {formatBytes(backup.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Object.values(backup.recordCount).reduce((a: number, b: number) => a + b, 0)} registros
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Información sobre Backups
              </p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Los backups se descargan automáticamente a tu carpeta de Descargas</li>
                <li>• Formato JSON: Compatible con cualquier sistema, incluye todos los datos</li>
                <li>• Formato Excel: Fácil de visualizar y editar en Excel/LibreOffice</li>
                <li>• Formato SQL: Importable directamente en MySQL/PostgreSQL</li>
                <li>• Guarda los backups en un lugar seguro (nube, disco externo)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
