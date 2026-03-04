import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

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
            {type === "terms" && "T├®rminos de Servicio"}
            {type === "privacy" && "Pol├¡tica de Privacidad"}
            {type === "help" && "Centro de Ayuda"}
          </DialogTitle>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert text-sm space-y-3">
          {type === "terms" && (
            <>
              <p>
                <strong>1. Uso del Software:</strong> Violet ERP es un software
                de gesti├│n empresarial proporcionado bajo licencia comercial. Su
                uso est├í limitado a la organizaci├│n que adquiri├│ la licencia.
              </p>
              <p>
                <strong>2. Datos:</strong> Toda la informaci├│n almacenada en la
                base de datos local es propiedad exclusiva de la empresa
                licenciataria. Violet ERP no accede a sus datos sin autorizaci├│n
                expresa.
              </p>
              <p>
                <strong>3. Responsabilidad:</strong> El software se proporciona
                "tal cual". Los respaldos y la integridad de los datos son
                responsabilidad del administrador del sistema.
              </p>
              <p>
                <strong>4. Actualizaciones:</strong> Las actualizaciones de
                seguridad son distribuidas peri├│dicamente. Se recomienda
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
                sincronizaci├│n con la nube.
              </p>
              <p>
                <strong>Sincronizaci├│n:</strong> Si la funci├│n de sincronizaci├│n
                con Supabase est├í activada, los datos se cifran en tr├ínsito
                mediante TLS 1.3. Puede deshabilitarla en cualquier momento
                desde Configuraci├│n ÔåÆ Seguridad.
              </p>
              <p>
                <strong>Credenciales:</strong> Las contrase├▒as del sistema se
                almacenan mediante hash seguro y nunca se transmiten en texto
                plano.
              </p>
            </>
          )}
          {type === "help" && (
            <>
              <p>
                <strong>Acceso al Sistema:</strong> Utilice las credenciales
                proporcionadas por su administrador de sistemas. Si olvid├│ su
                contrase├▒a, use la opci├│n "Olvid├® mi contrase├▒a".
              </p>
              <p>
                <strong>Configuraci├│n de Red:</strong> Si este equipo es un nodo
                cliente, configure la IP del servidor maestro usando el enlace
                "Configurar Red LAN" en la parte inferior de esta pantalla.
              </p>
              <p>
                <strong>M├│dulos Disponibles:</strong> Inventario, Ventas,
                Compras, Finanzas, Recursos Humanos, y Configuraci├│n avanzada
                del sistema.
              </p>
              <p>
                <strong>Soporte T├®cnico:</strong> Para asistencia t├®cnica,
                contacte al departamento de Administraci├│n / IT de su
                organizaci├│n.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
