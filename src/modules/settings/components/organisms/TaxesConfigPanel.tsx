import React from "react";
import { Percent } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import SettingsCard from "../atoms/SettingsCard";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";

interface TaxesConfigPanelProps {
  // Add props if needed, but currently uses hook
}

const TaxesConfigPanel: React.FC<TaxesConfigPanelProps> = () => {
  const { taxes, updateConfig } = useSystemConfig();

  // Valores por defecto para taxes si no hay config
  const DEFAULT_TAXES = {
    iva_general: 16,
    iva_reducido: 8,
    iva_lujo: 31,
    igtf_divisas: 3,
    rif_mask: "J-00000000-0",
    utValue: 90.0,
  };

  const taxesConfig = taxes || DEFAULT_TAXES;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <SettingsCard
          title="Configuración Fiscal (SENIAT)"
          description="IMPUESTOS Y TASAS: Configura los porcentajes de IVA, IGTF y el valor de la Unidad Tributaria."
          icon={<Percent className="w-5 h-5" />}
          className="max-w-2xl w-full"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                IVA General (%)
              </Label>
              <Input
                type="number"
                value={taxesConfig.iva_general}
                onChange={(e) =>
                  updateConfig("global", "venezuela_taxes", {
                    ...taxesConfig,
                    iva_general: parseFloat(e.target.value),
                  })
                }
                className="rounded-xl bg-muted/30 border-border/50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                IGTF Divisas (%)
              </Label>
              <Input
                type="number"
                value={taxesConfig.igtf_divisas}
                onChange={(e) =>
                  updateConfig("global", "venezuela_taxes", {
                    ...taxesConfig,
                    igtf_divisas: parseFloat(e.target.value),
                  })
                }
                className="rounded-xl bg-muted/30 border-border/50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                IVA Reducido (%)
              </Label>
              <Input
                type="number"
                value={taxesConfig.iva_reducido}
                onChange={(e) =>
                  updateConfig("global", "venezuela_taxes", {
                    ...taxesConfig,
                    iva_reducido: parseFloat(e.target.value),
                  })
                }
                className="rounded-xl bg-muted/30 border-border/50 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Unidad Tributaria
              </Label>
              <Input
                type="number"
                value={taxesConfig.utValue}
                onChange={(e) =>
                  updateConfig("global", "venezuela_taxes", {
                    ...taxesConfig,
                    utValue: parseFloat(e.target.value),
                  })
                }
                className="rounded-xl bg-muted/30 border-border/50 font-mono"
              />
            </div>
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Percent className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
              * Estos valores afectan el cálculo de facturas, libros de
              compra/venta y retenciones en todos los módulos comerciales del
              sistema.
            </p>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

export default TaxesConfigPanel;
