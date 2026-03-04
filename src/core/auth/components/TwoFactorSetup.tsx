/**
 * Componente para configurar 2FA
 */

import { useState } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Shield, Copy, Check, AlertTriangle } from 'lucide-react';
import { enable2FA, verifyTOTP } from '@/core/security/security/twoFactor';

interface TwoFactorSetupProps {
  username: string;
  onComplete: (secret: string, backupCodes: string[]) => void;
  onCancel: () => void;
}

export const TwoFactorSetup = ({ username, onComplete, onCancel }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [config, setConfig] = useState<{
    secret: string;
    qrCodeURL: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleGenerate = () => {
    const newConfig = enable2FA(username);
    setConfig(newConfig);
    setStep('verify');
  };

  const handleVerify = () => {
    if (!config) return;

    const isValid = verifyTOTP(config.secret, verificationCode);

    if (isValid) {
      onComplete(config.secret, config.backupCodes);
    } else {
      setError('Código inválido. Por favor, intenta de nuevo.');
      setVerificationCode('');
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  if (step === 'generate') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar Autenticación de Dos Factores
          </CardTitle>
          <CardDescription>
            Agrega una capa extra de seguridad a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Necesitarás una aplicación de autenticación como Google Authenticator,
              Microsoft Authenticator, o Authy.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} className="flex-1">
              Generar Código QR
            </Button>
            <Button onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Escanea el Código QR</CardTitle>
        <CardDescription>
          Usa tu aplicación de autenticación para escanear este código
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Placeholder */}
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-500">
              Código QR (requiere librería QR)
            </div>
            <div className="text-xs text-gray-400 break-all max-w-xs">
              {config.qrCodeURL}
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-2">
          <p className="text-sm font-medium">O ingresa este código manualmente:</p>
          <div className="flex gap-2">
            <Input
              value={config.secret}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(config.secret, 'secret')}
            >
              {copiedSecret ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Backup Codes */}
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-medium">Códigos de respaldo:</p>
            <div className="grid grid-cols-2 gap-1 font-mono text-xs">
              {config.backupCodes.map((code, i) => (
                <div key={i}>{code}</div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => copyToClipboard(config.backupCodes.join('\n'), 'backup')}
            >
              {copiedBackup ? (
                <>
                  <Check className="h-3 w-3 mr-1" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" /> Copiar Códigos
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>

        {/* Verification */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Ingresa el código de 6 dígitos:</p>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => {
              setError('');
              setVerificationCode(e.target.value.replace(/\D/g, ''));
            }}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={verificationCode.length !== 6}
            className="flex-1"
          >
            Verificar y Activar
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
