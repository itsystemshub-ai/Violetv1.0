import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  User as UserIcon,
  Lock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  ChevronLeft,
  Wifi,
  ServerCrash,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export type LoginStep =
  | "tenant"
  | "credentials"
  | "mfa"
  | "forgot-password"
  | "network-setup";

interface LoginFormProps {
  step: LoginStep;
  setStep: (step: LoginStep) => void;
  isLoading: boolean;
  formData: any;
  setFormData: (data: any) => void;
  onNextStep: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onVerifyMFA: (e: React.FormEvent) => void;
  onSaveNetwork: (e: React.FormEvent) => void;
  onPasswordReset: (email: string) => Promise<void>;
  onLegalClick: (type: "terms" | "privacy" | "help") => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  step,
  setStep,
  isLoading,
  formData,
  setFormData,
  onNextStep,
  onSubmit,
  onVerifyMFA,
  onSaveNetwork,
  onPasswordReset,
  onLegalClick,
}) => {
  const handleBack = () => {
    if (
      step === "tenant" ||
      step === "mfa" ||
      step === "forgot-password" ||
      step === "network-setup"
    ) {
      setStep("credentials");
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showPassword) {
      timeoutRef.current = setTimeout(() => {
        setShowPassword(false);
      }, 15000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showPassword]);

  return (
    <div className="w-full max-w-md relative z-10">
      <AnimatePresence mode="wait">
        {step === "tenant" && (
          <motion.div
            key="tenant-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-3xl font-bold">
                  Acceso al Sistema
                </CardTitle>
                <CardDescription>
                  Ingresa el identificador de tu empresa para comenzar
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenantId">Empresa / Tenant ID</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="tenantId"
                        placeholder="ej. mi-empresa-2026"
                        className="pl-10 h-12"
                        value={formData.tenantId}
                        onChange={(e) =>
                          setFormData({ ...formData, tenantId: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={onNextStep}
                    className="w-full h-12 text-base font-semibold"
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="px-0 justify-center">
                <p className="text-sm text-muted-foreground">
                  No tienes una cuenta?{" "}
                  <span className="text-primary font-medium cursor-pointer">
                    Contacta a ventas
                  </span>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {step === "credentials" && (
          <motion.div
            key="credentials-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-3xl font-bold">
                  Bienvenido de nuevo
                </CardTitle>
                <CardDescription>
                  Ingresa tus credenciales de acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="nombre de usuario"
                        className="pl-10 h-12"
                        required
                        autoComplete="username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Contraseña</Label>
                      <span
                        className="text-xs text-primary hover:underline cursor-pointer"
                        onClick={() => setStep("forgot-password")}
                      >
                        Olvidé mi contraseña
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="pl-10 pr-10 h-12"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "mfa" && (
          <motion.div
            key="mfa-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0 text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">
                  Verificación 2FA
                </CardTitle>
                <CardDescription>
                  Hemos enviado un código a tu dispositivo vinculado. <br />
                  Por favor, ingrésalo para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <form onSubmit={onVerifyMFA} className="space-y-6">
                  <div className="flex justify-center gap-3">
                    <Input
                      className="w-full h-14 text-center text-2xl font-bold tracking-[0.5em]"
                      maxLength={6}
                      placeholder="000000"
                      value={formData.mfaCode}
                      onChange={(e) =>
                        setFormData({ ...formData, mfaCode: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading || formData.mfaCode.length < 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      "Verificar y Entrar"
                    )}
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      ¿No recibiste el código?{" "}
                      <span className="text-primary font-medium cursor-pointer">
                        Reenviar
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={handleBack}
                    >
                      Usar otro método de acceso
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "forgot-password" && (
          <motion.div
            key="forgot-password-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <div
                  className="flex items-center gap-2 text-primary mb-2 cursor-pointer group"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Volver
                  </span>
                </div>
                <CardTitle className="text-3xl font-bold">
                  Recuperar acceso
                </CardTitle>
                <CardDescription>
                  Ingresa tu correo para recibir un enlace de recuperación.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (recoveryEmail) {
                      await onPasswordReset(recoveryEmail);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Correo Electrónico</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="recovery-email"
                        type="email"
                        placeholder="tu@correo.com"
                        className="pl-10 h-12"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading || !recoveryEmail}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      "Enviar solicitud de cambio"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "network-setup" && (
          <motion.div
            key="network-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <div
                  className="flex items-center gap-2 text-primary mb-2 cursor-pointer group"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Volver
                  </span>
                </div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <Wifi className="w-8 h-8 text-primary" /> Red Local
                </CardTitle>
                <CardDescription>
                  Si este equipo es un Nodo, ingresa la dirección IP de la
                  computadora Maestra para conectarte a la base de datos
                  central.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pt-4">
                <form onSubmit={onSaveNetwork} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="masterIp">
                      Dirección IP del Maestro (ej. 192.168.1.50)
                    </Label>
                    <div className="relative">
                      <ServerCrash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="masterIp"
                        type="text"
                        placeholder="localhost"
                        className="pl-10 h-12"
                        required
                        value={formData.masterIp}
                        onChange={(e) =>
                          setFormData({ ...formData, masterIp: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={isLoading}
                  >
                    Guardar Configuración y Conectar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Links (Responsive) */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground sm:text-sm">
        <span
          className="hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
          onClick={() => setStep("network-setup")}
        >
          <Wifi className="w-3 h-3 sm:w-4 sm:h-4" /> Configurar Red
        </span>
        <span
          className="hover:text-primary cursor-pointer transition-colors"
          onClick={() => onLegalClick("help")}
        >
          Centro de ayuda
        </span>
        <span
          className="hover:text-primary cursor-pointer transition-colors"
          onClick={() => onLegalClick("terms")}
        >
          Términos
        </span>
        <span
          className="hover:text-primary cursor-pointer transition-colors"
          onClick={() => onLegalClick("privacy")}
        >
          Privacidad
        </span>
      </div>
    </div>
  );
};
