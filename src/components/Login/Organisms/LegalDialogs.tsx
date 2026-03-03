import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LegalDialogsProps {
  type: "terms" | "privacy" | "help" | null;
  onClose: () => void;
}

export const LegalDialogs: React.FC<LegalDialogsProps> = ({
  type,
  onClose,
}) => {
  return (
    <Dialog open={type !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "terms" && "Términos de Servicio"}
            {type === "privacy" && "Política de Privacidad"}
            {type === "help" && "Centro de Ayuda"}
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert text-sm space-y-3">
          {type === "terms" && (
            <>
              <p>
                <strong>1. Uso del Software:</strong> Violet ERP es un software
                de gestión empresarial proporcionado bajo licencia comercial. Su
                uso está limitado a la organización que adquirió la licencia.
              </p>
              <p>
                <strong>2. Datos:</strong> Toda la información almacenada en la
                base de datos local es propiedad exclusiva de la empresa
                licenciataria. Violet ERP no accede a sus datos sin autorización
                expresa.
              </p>
              <p>
                <strong>3. Responsabilidad:</strong> El software se proporciona
                "tal cual". Los respaldos y la integridad de los datos son
                responsabilidad del administrador del sistema.
              </p>
              <p>
                <strong>4. Actualizaciones:</strong> Las actualizaciones de
                seguridad son distribuidas periódicamente. Se recomienda
                mantener el sistema actualizado.
              </p>
            </>
          )}
          {type === "privacy" && (
            <>
              <p>
                <strong>Privacidad de Datos:</strong> Violet ERP opera bajo un
                modelo Offline-First. Sus datos se almacenan exclusivamente en
                la computadora local (Servidor Maestro) y no se transmiten a
                servidores externos a menos que el administrador habilite la
                sincronización con la nube.
              </p>
              <p>
                <strong>Sincronización:</strong> Si la función de sincronización
                con Supabase está activada, los datos se cifran en tránsito
                mediante TLS 1.3. Puede deshabilitarla en cualquier momento
                desde Configuración → Seguridad.
              </p>
              <p>
                <strong>Credenciales:</strong> Las contraseñas del sistema se
                almacenan mediante hash seguro y nunca se transmiten en texto
                plano.
              </p>
            </>
          )}
          {type === "help" && (
            <>
              <p>
                <strong>Acceso al Sistema:</strong> Utilice las credenciales
                proporcionadas por su administrador de sistemas. Si olvidó su
                contraseña, use la opción "Olvidé mi contraseña".
              </p>
              <p>
                <strong>Configuración de Red:</strong> Si este equipo es un nodo
                cliente, configure la IP del servidor maestro usando el enlace
                "Configurar Red LAN" en la parte inferior de esta pantalla.
              </p>
              <p>
                <strong>Módulos Disponibles:</strong> Inventario, Ventas,
                Compras, Finanzas, Recursos Humanos, y Configuración avanzada
                del sistema.
              </p>
              <p>
                <strong>Soporte Técnico:</strong> Para asistencia técnica,
                contacte al departamento de Administración / IT de su
                organización.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
