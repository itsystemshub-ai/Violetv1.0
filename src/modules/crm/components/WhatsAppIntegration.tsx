import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { MessageSquare, ExternalLink, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppIntegrationProps {
  initialPhoneNumber?: string;
  initialMessage?: string;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({
  initialPhoneNumber = "",
  initialMessage = "",
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [message, setMessage] = useState(initialMessage);

  const formatPhoneNumber = (number: string) => {
    // Remove all non-numeric characters
    const cleaned = number.replace(/\D/g, "");
    // Ensure it has a country code, default to +58 (Venezuela) if not present and starts with 0
    if (cleaned.startsWith("0")) {
      return `58${cleaned.substring(1)}`;
    }
    return cleaned;
  };

  const handleOpenWhatsApp = (web: boolean) => {
    if (!phoneNumber) {
      toast.error("Por favor ingresa un número de teléfono válido");
      return;
    }

    const formattedNumber = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);

    let url = "";
    if (web) {
      url = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;
    } else {
      url = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abriendo WhatsApp...");
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-card-title text-foreground">
              Integración WhatsApp
            </CardTitle>
            <CardDescription className="text-subtitle">
              Inicia conversaciones directas con clientes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-subtitle font-medium text-foreground">
            Número de Teléfono
          </label>
          <div className="flex gap-2">
            <div className="flex items-center justify-center px-3 border rounded-md bg-muted/50 text-muted-foreground text-body">
              <Smartphone className="w-4 h-4" />
            </div>
            <Input
              placeholder="Ej: 04121234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-subtitle font-medium text-foreground">
            Mensaje Predefinido (Opcional)
          </label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-body ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Hola, te escribo desde Violet ERP..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleOpenWhatsApp(true)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp Web
          </Button>
          <Button
            variant="outline"
            className="w-full border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30"
            onClick={() => handleOpenWhatsApp(false)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            App Nativa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppIntegration;
