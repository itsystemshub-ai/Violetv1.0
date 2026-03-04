/**
 * Componente para verificar código 2FA durante login
 */

import { useState } from 'react';
import { Button } from "@/shared/components/ui/button';
import { Input } from "@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';

interface TwoFactorVerifyProps {
  onVerify: (code: string) => void;
  onUseBackupCode: (code: string) => void;
  onBack: () => void;
  error?: string;
}

export const TwoFactorVerify = ({
  onVerify,
  onUseBackupCode,
  onBack,
  error,
}: TwoFactorVerifyProps) => {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useBackup) {
      onUseBackupCode(code);
    } else {
      onVerify(code);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificación de Dos Factores
        </CardTitle>
        <CardDescription>
          {useBackup
            ? 'Ingresa uno de tus códigos de respaldo'
            : 'Ingresa el código de 6 dígitos de tu aplicación de autenticación'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              inputMode={useBackup ? 'text' : 'numeric'}
              pattern={useBackup ? '[A-Z0-9]*' : '[0-9]*'}
              maxLength={useBackup ? 8 : 6}
              value={code}
              onChange={(e) => {
                const value = useBackup
                  ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  : e.target.value.replace(/\D/g, '');
                setCode(value);
              }}
              placeholder={useBackup ? 'XXXXXXXX' : '000000'}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={useBackup ? code.length !== 8 : code.length !== 6}
          >
            Verificar
          </Button>

          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setUseBackup(!useBackup);
                setCode('');
              }}
            >
              {useBackup
                ? 'Usar código de autenticación'
                : 'Usar código de respaldo'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
