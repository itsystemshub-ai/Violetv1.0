import React, { useState, type FormEvent, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { NetworkService } from "@/services/LocalNetworkService";
import { ROUTE_PATHS } from "@/lib";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Components
import { LoginBackground } from "@/components/Login/Atoms/LoginBackground";
import { BrandingSection } from "@/components/Login/Molecules/BrandingSection";
import {
  LoginForm,
  type LoginStep,
} from "@/components/Login/Organisms/LoginForm";

// Lazy-loaded components
const LegalDialogs = lazy(() =>
  import("@/components/Login/Organisms/LegalDialogs").then((m) => ({
    default: m.LegalDialogs,
  })),
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [legalDialog, setLegalDialog] = useState<
    "terms" | "privacy" | "help" | null
  >(null);

  const [formData, setFormData] = useState({
    tenantId:
      useSystemConfig.getState().activeTenantId ||
      "3e4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
    username: "",
    password: "",
    mfaCode: "",
    masterIp: localStorage.getItem("master_ip") || "localhost",
  });

  const from = (location.state as any)?.from?.pathname ?? ROUTE_PATHS.DASHBOARD;

  const executeLogin = async () => {
    setIsLoading(true);
    try {
      const result = await login(
        formData.username,
        formData.password,
        formData.tenantId,
      );
      if (result.success) {
        if (formData.username.includes("mfa")) {
          setStep("mfa");
          return;
        }
        toast.success("Sesion iniciada correctamente");
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || "Credenciales incorrectas");
        if (result.error?.includes("tenant")) setStep("tenant");
      }
    } catch (_error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === "tenant" && !formData.tenantId) {
      toast.error("Por favor, ingresa el identificador de tu empresa");
      return;
    }
    if (step === "tenant") executeLogin();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeLogin();
  };

  const handleVerifyMFA = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Identidad verificada");
      navigate(from, { replace: true });
    }, 1500);
  };

  const handleSaveNetwork = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem("master_ip", formData.masterIp);
    NetworkService.connect(formData.masterIp);
    toast.success(`Conexión de red actualizada a ${formData.masterIp}`);
    setStep("credentials");
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#f5f5dc] relative">
      <LoginBackground />
      <BrandingSection />

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <LoginForm
          step={step}
          setStep={setStep}
          isLoading={isLoading}
          formData={formData}
          setFormData={setFormData}
          onNextStep={handleNextStep}
          onSubmit={handleSubmit}
          onVerifyMFA={handleVerifyMFA}
          onSaveNetwork={handleSaveNetwork}
          onLegalClick={(type) => setLegalDialog(type)}
        />

        <Suspense
          fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}
        >
          <LegalDialogs
            type={legalDialog}
            onClose={() => setLegalDialog(null)}
          />
        </Suspense>
      </div>
    </div>
  );
}
