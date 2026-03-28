import React from "react";
import { Fingerprint, ShieldCheck, Lock, ShieldAlert } from "lucide-react";
import { IMAGES } from "@/assets/images";

export const BrandingSection: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={IMAGES.AI_TECH_8}
          alt="Violet ERP AI Background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-primary/40 to-background/90 z-10" />
      </div>

      <div className="relative z-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <Fingerprint className="text-primary w-8 h-8" />
          </div>
          <span className="text-2xl font-bold tracking-tighter">
            VIOLET ERP
          </span>
        </div>
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          El sistema nervioso <br />
          <span className="text-white/80">de tu empresa inteligente.</span>
        </h1>
        <p className="text-xl text-white/70 max-w-md">
          Gestion SaaS Multiempresa con automatizacion de IA de vanguardia para
          el mercado global 2026.
        </p>
      </div>

      <div className="relative z-20 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs">
            SaaS Multi-tenant
          </div>
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs">
            Groq AI Integration
          </div>
        </div>
        <p className="text-sm text-white/50">
          2026 Violet ERP Technologies. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-6 mt-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">
              SSL Secured
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Lock className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">
              AES-256
            </span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldAlert className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">
              SOC2 Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
