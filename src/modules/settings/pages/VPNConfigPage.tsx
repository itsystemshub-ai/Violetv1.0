/**
 * VPNConfigPage - Configuración de VPN
 * Características:
 * - Gestión de conexiones VPN
 * - Configuración de servidores
 * - Estado de conexión
 * - Logs de conexión
 */

import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Power,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Lock,
  Key,
  Server,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toast } from 'sonner';

interface VPNConfig {
  id: string;
  name: string;
  server: string;
  port: number;
  protocol: 'OpenVPN' | 'WireGuard' | 'IPSec';
  username: string;
  password: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string;
}

export const VPNConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<VPNConfig[]>([
    {
      id: '1',
      name: 'Oficina Principal',
      server: '192.168.1.100',
      port: 1194,
      protocol: 'OpenVPN',
      username: 'admin',
      password: '••••••••',
      status: 'disconnected',
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<VPNConfig | null>(null);
  const [formData, setFormData] = useState<Partial<VPNConfig>>({
    name: '',
    server: '',
    port: 1194,
    protocol: 'OpenVPN',
    username: '',
    password: '',
  });

  // Conectar/Desconectar VPN
  const toggleConnection = async (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (!config) return;

    if (config.status === 'connected') {
      // Desconectar
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: 'disconnected' } : c
        )
      );
      toast.success(`Desconectado de ${config.name}`);
    } else {
      // Conectar
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: 'connecting' } : c
        )
      );

      // Simular conexión
      setTimeout(() => {
        setConfigs((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  status: 'connected',
                  lastConnected: new Date().toISOString(),
                }
              : c
          )
        );
        toast.success(`Conectado a ${config.name}`);
      }, 2000);
    }
  };

  // Agregar/Editar configuración
  const handleSave = () => {
    if (!formData.name || !formData.server || !formData.username) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (editingConfig) {
      // Editar
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === editingConfig.id
            ? { ...c, ...formData, status: 'disconnected' }
            : c
        )
      );
      toast.success('Configuración actualizada');
    } else {
      // Agregar
      const newConfig: VPNConfig = {
        id: Date.now().toString(),
        ...formData as VPNConfig,
        status: 'disconnected',
      };
      setConfigs((prev) => [...prev, newConfig]);
      toast.success('Configuración agregada');
    }

    setIsDialogOpen(false);
    setEditingConfig(null);
    setFormData({
      name: '',
      server: '',
      port: 1194,
      protocol: 'OpenVPN',
      username: '',
      password: '',
    });
  };

  // Eliminar configuración
  const handleDelete = (id: string) => {
    const config = configs.find((c) => c.id === id);
    if (config?.status === 'connected') {
      toast.error('No puedes eliminar una conexión activa');
      return;
    }

    setConfigs((prev) => prev.filter((c) => c.id !== id));
    toast.success('Configuración eliminada');
  };

  // Abrir diálogo para editar
  const handleEdit = (config: VPNConfig) => {
    setEditingConfig(config);
    setFormData(config);
    setIsDialogOpen(true);
  };

  // Icono de estado
  const getStatusIcon = (status: VPNConfig['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case 'connecting':
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // Badge de estado
  const getStatusBadge = (status: VPNConfig['status']) => {
    const variants = {
      connected: 'default',
      disconnected: 'secondary',
      connecting: 'outline',
      error: 'destructive',
    } as const;

    const labels = {
      connected: 'Conectado',
      disconnected: 'Desconectado',
      connecting: 'Conectando...',
      error: 'Error',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Configuración VPN
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus conexiones VPN seguras
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Conexión
        </Button>
      </div>

      {/* Lista de configuraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.status)}
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                </div>
                {getStatusBadge(config.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Server className="h-4 w-4" />
                  <span>{config.server}:{config.port}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{config.protocol}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Key className="h-4 w-4" />
                  <span>{config.username}</span>
                </div>
                {config.lastConnected && (
                  <div className="text-xs text-muted-foreground">
                    Última conexión:{' '}
                    {new Date(config.lastConnected).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <Button
                  className="flex-1"
                  variant={config.status === 'connected' ? 'destructive' : 'default'}
                  onClick={() => toggleConnection(config.id)}
                  disabled={config.status === 'connecting'}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {config.status === 'connected' ? 'Desconectar' : 'Conectar'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(config)}
                  disabled={config.status === 'connected'}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(config.id)}
                  disabled={config.status === 'connected'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de configuración */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Editar' : 'Nueva'} Conexión VPN
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Oficina Principal"
              />
            </div>

            <div>
              <Label htmlFor="server">Servidor</Label>
              <Input
                id="server"
                value={formData.server}
                onChange={(e) =>
                  setFormData({ ...formData, server: e.target.value })
                }
                placeholder="192.168.1.100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="port">Puerto</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData({ ...formData, port: parseInt(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label htmlFor="protocol">Protocolo</Label>
                <Select
                  value={formData.protocol}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, protocol: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenVPN">OpenVPN</SelectItem>
                    <SelectItem value="WireGuard">WireGuard</SelectItem>
                    <SelectItem value="IPSec">IPSec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingConfig ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
