import React, { useEffect } from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { getContrastColor } from "@/lib/index";

interface TenantBrandingProps {
  /**
   * Contenido de la aplicación que recibirá el estilo dinámico del tenant.
   */
  children: React.ReactNode;
}

/**
 * Componente TenantBranding
 *
 * Implementa el sistema de "Identidad Dinámica" o Marca Blanca del ERP Violet ERP.
 * Este componente actúa como un proveedor de estilo que inyecta los colores y la
 * identidad visual de la empresa (Tenant) activa en el DOM y en las variables CSS.
 *
 * @copyright 2026 Violet ERP
 */
export function TenantBranding({ children }: TenantBrandingProps) {
  const { tenant } = useSystemConfig();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const root = document.documentElement;

      // Aplicación de colores dinámicos (Efecto Camaleón)
      if (tenant?.primaryColor) {
        // Sincronizamos los tokens principales del Design System con la preferencia del Tenant
        root.style.setProperty("--primary", tenant.primaryColor);
        root.style.setProperty("--ring", tenant.primaryColor);

        // Calculamos el color de contraste para el foreground (texto sobre primario)
        const contrastColor = getContrastColor(tenant.primaryColor);
        root.style.setProperty(
          "--primary-foreground",
          contrastColor === "#ffffff"
            ? "oklch(0.98 0.01 255)"
            : "oklch(0.15 0.02 220)",
        );

        // Actualizamos el branding del navegador
        document.title = `${tenant.name} | Violet ERP`;

        // Actualización dinámica del Favicon si existe logo personalizado
        const favicon = document.querySelector(
          "link[rel~='icon']",
        ) as HTMLLinkElement;
        if (favicon && tenant.logoUrl) {
          favicon.href = tenant.logoUrl;
        }
      } else {
        // Valores por defecto si no hay tenant
        document.title = 'Violet ERP';
      }
    } catch (error) {
      console.error('[TenantBranding] Error al aplicar branding:', error);
    }
  }, [tenant]);

  return (
    <>
      {/* 
        Inyección de estilos globales dinámicos que no se pueden manejar 
        únicamente mediante variables CSS de Tailwind v4 en tiempo de ejecución.
      */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --tenant-brand: ${tenant?.primaryColor || '#7c3aed'};
        }
        
        /* Personalización de la selección de texto */
        ::selection {
          background-color: color-mix(in srgb, ${tenant?.primaryColor || '#7c3aed'}, transparent 75%);
          color: ${tenant?.primaryColor || '#7c3aed'};
        }

        /* Scrollbars adaptados a la marca del tenant */
        ::-webkit-scrollbar-thumb {
          background-color: color-mix(in srgb, ${tenant?.primaryColor || '#7c3aed'}, transparent 60%);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        ::-webkit-scrollbar-thumb:hover {
          background-color: ${tenant?.primaryColor || '#7c3aed'};
        }

        /* Efectos de foco y anillos personalizados */
        .focus-visible\\:ring-${tenant?.id || 'default'} {
          --tw-ring-color: ${tenant?.primaryColor || '#7c3aed'};
        }

        /* Clases de utilidad dinámicas inyectadas */
        .tenant-bg-primary {
          background-color: ${tenant?.primaryColor || '#7c3aed'};
        }
        .tenant-text-primary {
          color: ${tenant?.primaryColor || '#7c3aed'};
        }
        .tenant-border-primary {
          border-color: ${tenant?.primaryColor || '#7c3aed'};
        }
      `,
        }}
      />

      <div
        className="violet-tenant-container contents"
        data-tenant-id={tenant?.id || 'none'}
        data-tenant-slug={tenant?.slug || 'none'}
      >
        {children}
      </div>
    </>
  );
}
