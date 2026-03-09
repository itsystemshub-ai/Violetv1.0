import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { AlertTriangle, Clock, User, Database } from 'lucide-react';
import { cn } from "@/core/shared/utils/utils";

export interface ConflictData<T = Record<string, unknown>> {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: string;
  remoteTimestamp: string;
  localUser?: string;
  remoteUser?: string;
}

export interface ConflictResolutionDialogProps<T = Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictData<T>[];
  localVersion: T;
  remoteVersion: T;
  onResolve: (resolved: T) => void;
  entityName?: string;
}

type ResolutionStrategy = 'local' | 'remote' | 'manual';

export function ConflictResolutionDialog<T extends Record<string, unknown>>({
  open,
  onOpenChange,
  conflicts,
  localVersion,
  remoteVersion,
  onResolve,
  entityName = 'registro',
}: ConflictResolutionDialogProps<T>) {
  const [strategy, setStrategy] = useState<ResolutionStrategy>('local');
  const [manualResolutions, setManualResolutions] = useState<
    Record<string, 'local' | 'remote'>
  >({});

  const handleResolve = () => {
    let resolved: T;

    if (strategy === 'local') {
      resolved = { ...localVersion };
    } else if (strategy === 'remote') {
      resolved = { ...remoteVersion };
    } else {
      // Manual resolution - merge based on field selections
      resolved = { ...localVersion };
      conflicts.forEach((conflict) => {
        const choice = manualResolutions[conflict.field] || 'local';
        if (choice === 'remote') {
          resolved[conflict.field as keyof T] = remoteVersion[
            conflict.field as keyof T
          ];
        }
      });
    }

    onResolve(resolved);
    onOpenChange(false);
  };

  const handleFieldChoice = (field: string, choice: 'local' | 'remote') => {
    setManualResolutions((prev) => ({
      ...prev,
      [field]: choice,
    }));
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Conflicto de Sincronización Detectado
          </DialogTitle>
          <DialogDescription>
            Se encontraron {conflicts.length} conflicto(s) en este {entityName}.
            Elige cómo resolver los cambios.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este {entityName} fue modificado tanto localmente como en el
            servidor. Debes elegir qué versión mantener.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="strategy">Estrategia Rápida</TabsTrigger>
            <TabsTrigger value="manual">Resolución Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="space-y-4">
            <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as ResolutionStrategy)}>
              <div className="space-y-3">
                <div
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    strategy === 'local'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => setStrategy('local')}
                >
                  <RadioGroupItem value="local" id="local" />
                  <div className="flex-1">
                    <Label htmlFor="local" className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="h-4 w-4" />
                        <span className="font-semibold">
                          Mantener Versión Local
                        </span>
                        <Badge variant="outline">Recomendado</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Usa los cambios que hiciste en este dispositivo.
                        Descarta los cambios del servidor.
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Última modificación:{' '}
                        {formatDate(
                          conflicts[0]?.localTimestamp || new Date().toISOString()
                        )}
                      </div>
                    </Label>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    strategy === 'remote'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => setStrategy('remote')}
                >
                  <RadioGroupItem value="remote" id="remote" />
                  <div className="flex-1">
                    <Label htmlFor="remote" className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4" />
                        <span className="font-semibold">
                          Mantener Versión del Servidor
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Usa los cambios del servidor. Descarta tus cambios
                        locales.
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Última modificación:{' '}
                        {formatDate(
                          conflicts[0]?.remoteTimestamp || new Date().toISOString()
                        )}
                      </div>
                    </Label>
                  </div>
                </div>

                <div
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                    strategy === 'manual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                  onClick={() => setStrategy('manual')}
                >
                  <RadioGroupItem value="manual" id="manual" />
                  <div className="flex-1">
                    <Label htmlFor="manual" className="cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">
                          Resolución Manual (Campo por Campo)
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Elige qué valor mantener para cada campo en conflicto.
                      </p>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona qué versión mantener para cada campo:
            </p>

            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.field}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold capitalize">
                      {conflict.field.replace(/_/g, ' ')}
                    </h4>
                    <Badge variant="outline">Conflicto</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        manualResolutions[conflict.field] === 'local' ||
                          !manualResolutions[conflict.field]
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() => handleFieldChoice(conflict.field, 'local')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm font-medium">Local</span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {formatValue(conflict.localValue)}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(conflict.localTimestamp)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'p-3 rounded-lg border-2 cursor-pointer transition-all',
                        manualResolutions[conflict.field] === 'remote'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      onClick={() =>
                        handleFieldChoice(conflict.field, 'remote')
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Servidor</span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {formatValue(conflict.remoteValue)}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(conflict.remoteTimestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleResolve}>
            Resolver Conflicto
            {strategy === 'manual' && ` (${conflicts.length} campos)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Example usage:
 * 
 * const conflicts: ConflictData[] = [
 *   {
 *     field: 'price',
 *     localValue: 100,
 *     remoteValue: 120,
 *     localTimestamp: '2026-03-01T10:00:00Z',
 *     remoteTimestamp: '2026-03-01T10:05:00Z',
 *   },
 *   {
 *     field: 'stock',
 *     localValue: 50,
 *     remoteValue: 45,
 *     localTimestamp: '2026-03-01T10:00:00Z',
 *     remoteTimestamp: '2026-03-01T10:05:00Z',
 *   },
 * ];
 * 
 * <ConflictResolutionDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   conflicts={conflicts}
 *   localVersion={localProduct}
 *   remoteVersion={remoteProduct}
 *   onResolve={(resolved) => {
 *     // Save resolved version
 *     updateProduct(resolved);
 *   }}
 *   entityName="producto"
 * />
 */
