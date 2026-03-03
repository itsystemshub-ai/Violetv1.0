import React, { useRef } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SettingsCard from "../Atoms/SettingsCard";

interface BrandingPanelProps {
  tenant: any;
  updateTenantById?: (id: string, updates: any) => Promise<void>;
  isMaster?: boolean;
}

const BrandingPanel: React.FC<BrandingPanelProps> = ({
  tenant,
  updateTenantById,
  isMaster,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryColor, setPrimaryColor] = React.useState(tenant.primaryColor || '#7c3aed');
  const [logoUrl, setLogoUrl] = React.useState(tenant.logoUrl || '');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar a máximo 200x200 para logos
          let width = img.width;
          let height = img.height;
          const maxSize = 200;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Comprimir a 70% de calidad
          const compressedDataUrl = canvas.toDataURL('image/png', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB');
      return;
    }

    try {
      const compressedLogo = await compressImage(file);
      setLogoUrl(compressedLogo);
      console.log('Logo comprimido:', compressedLogo.length, 'caracteres');
    } catch (error) {
      console.error('Error al procesar el logo:', error);
      alert('Error al procesar la imagen');
    }

    // Limpiar el input
    e.target.value = '';
  };

  const handleSaveBranding = async () => {
    if (!updateTenantById) return;

    try {
      await updateTenantById(tenant.id, {
        primaryColor: primaryColor,
        logoUrl: logoUrl,
      });
      alert('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SettingsCard
        title="Identidad Visual"
        description="Personaliza el color principal y el logo de tu empresa. Estos elementos definen la apariencia de tu marca en todo el sistema."
      >
        <div className="space-y-2">
          <Label htmlFor="primary-color">Color Primario (Violet Dynamic)</Label>
          <div className="flex gap-3">
            <Input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Este color se aplicará dinámicamente a botones y estados activos.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label>Logotipo de la Empresa</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border rounded-lg">
              <AvatarImage src={logoUrl || tenant.logoUrl} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                {(tenant.name || "??").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" onClick={handleLogoClick}>
                Cambiar Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                Formatos: SVG, PNG, JPG. Máx 2MB.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSaveBranding} className="w-full">
          <Save className="w-4 h-4 mr-2" /> Guardar Cambios Visuales
        </Button>
      </SettingsCard>

      <Card className="border-border/50 bg-muted/30">
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>Cómo se ve tu marca en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-full p-4 bg-background rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-muted rounded" />
              <div className="h-2 w-2/3 bg-muted rounded" />
            </div>
            <Button className="w-full">Botón de Acción</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground italic">
            "El sistema Violet ERP adapta automáticamente el contraste para
            garantizar la legibilidad."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingPanel;
