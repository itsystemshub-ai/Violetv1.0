/**
 * SSLCertificatesPage - Gestión de certificados SSL
 * Características:
 * - Lista de certificados
 * - Importar certificados
 * - Verificar validez
 * - Renovación automática
 * - Alertas de expiración
 */

import React, { useState } from 'react';
import {
  Lock,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  FileKey,
  Shield,
  RefreshCw,
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
import { Progress } from '@/shared/components/ui/progress';
import { toast } from 'sonner';

interface SSLCertificate {
  id: string;
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expiring' | 'expired';
  autoRenew: boolean;
  type: 'self-signed' | 'ca-signed' | 'lets-encrypt';
}

export const SSLCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<SSLCertificate[]>([
    {
      id: '1',
      domain: 'violet-erp.local',
      issuer: 'Self-Signed',
      validFrom: '2024-01-01',
      validTo: '2025-01-01',
      status: 'valid',
      autoRenew: false,
      type: 'self-signed',
    },
    {
      id: '2',
      domain: '*.violet-erp.com',
      issuer: "Let's Encrypt",
      validFrom: '2024-06-01',
      validTo: '2024-09-01',
      status: 'expiring',
      autoRenew: true,
      type: 'lets-encrypt',
    },
  ]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Calcular días hasta expiración
  const getDaysUntilExpiry = (validTo: string) => {
    const now = new Date();
    const expiry = new Date(validTo);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Obtener badge de estado
  const getStatusBadge = (cert: SSLCertificate) => {
    const days = getDaysUntilExpiry(cert.validTo);

    if (days < 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (days < 30) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">
        Expira en {days} días
      </Badge>;
    } else {
      return <Badge variant="default">Válido</Badge>;
    }
  };

  // Icono de estado
  const getStatusIcon = (cert: SSLCertificate) => {
    const days = getDaysUntilExpiry(cert.validTo);

    if (days < 0) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (days < 30) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  // Importar certificado
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportProgress(0);
    setIsImportDialogOpen(true);

    // Simular importación
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setImportProgress(i);
    }

    const newCert: SSLCertificate = {
      id: Date.now().toString(),
      domain: 'nuevo-dominio.com',
      issuer: 'CA Authority',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'valid',
      autoRenew: false,
      type: 'ca-signed',
    };

    setCertificates((prev) => [...prev, newCert]);
    toast.success('Certificado importado correctamente');
    setIsImportDialogOpen(false);
  };

  // Renovar certificado
  const handleRenew = async (id: string) => {
    const cert = certificates.find((c) => c.id === id);
    if (!cert) return;

    toast.info(`Renovando certificado para ${cert.domain}...`);

    // Simular renovación
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              validFrom: new Date().toISOString().split('T')[0],
              validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              status: 'valid',
            }
          : c
      )
    );

    toast.success(`Certificado renovado para ${cert.domain}`);
  };

  // Eliminar certificado
  const handleDelete = (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
    toast.success('Certificado eliminado');
  };

  // Toggle auto-renovación
  const toggleAutoRenew = (id: string) => {
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, autoRenew: !c.autoRenew } : c
      )
    );
  };

  // Exportar certificado
  const handleExport = (cert: SSLCertificate) => {
    const data = JSON.stringify(cert, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cert.domain}-certificate.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Certificado exportado');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            Certificados SSL
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los certificados SSL de tu sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pem,.crt,.cer,.key"
            onChange={handleImport}
            className="hidden"
            id="cert-upload"
          />
          <Button asChild>
            <label htmlFor="cert-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Importar Certificado
            </label>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Válidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {certificates.filter((c) => getDaysUntilExpiry(c.validTo) > 30).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Por Expirar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {
                certificates.filter(
                  (c) =>
                    getDaysUntilExpiry(c.validTo) <= 30 &&
                    getDaysUntilExpiry(c.validTo) > 0
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {certificates.filter((c) => getDaysUntilExpiry(c.validTo) < 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de certificados */}
      <div className="space-y-4">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Icono */}
                  <div className="p-3 rounded-lg bg-primary/10">
                    {getStatusIcon(cert)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{cert.domain}</h3>
                      {getStatusBadge(cert)}
                      {cert.autoRenew && (
                        <Badge variant="outline" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Auto-renovación
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Emisor</div>
                        <div className="font-medium">{cert.issuer}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Tipo</div>
                        <div className="font-medium capitalize">
                          {cert.type.replace('-', ' ')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Válido desde</div>
                        <div className="font-medium">
                          {new Date(cert.validFrom).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Válido hasta</div>
                        <div className="font-medium">
                          {new Date(cert.validTo).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso de validez */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Tiempo de validez</span>
                        <span>
                          {getDaysUntilExpiry(cert.validTo)} días restantes
                        </span>
                      </div>
                      <Progress
                        value={
                          (getDaysUntilExpiry(cert.validTo) /
                            ((new Date(cert.validTo).getTime() -
                              new Date(cert.validFrom).getTime()) /
                              (1000 * 60 * 60 * 24))) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRenew(cert.id)}
                    title="Renovar"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleExport(cert)}
                    title="Exportar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cert.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de importación */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importando Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={importProgress} />
            <p className="text-sm text-muted-foreground text-center">
              {importProgress}% completado
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
