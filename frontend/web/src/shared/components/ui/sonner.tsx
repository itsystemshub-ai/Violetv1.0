/**
 * Violet ERP - Toaster Component
 * Notificaciones con Sonner
 */
import { Toaster as Sonner } from "sonner";

// next-themes no es requerido para funcionalidad básica
const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster theme-default"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "success-toast",
          error: "error-toast",
          warning: "warning-toast",
          info: "info-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
