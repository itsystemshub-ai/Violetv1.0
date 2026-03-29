/**
 * Helpers para notificaciones
 * Centraliza la lógica de notificaciones toast y del sistema
 */

import { toast } from 'sonner';
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";

/**
 * Tipos de notificación
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Opciones de notificación
 */
export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Muestra una notificación de éxito
 */
export const notifySuccess = (
  message: string,
  options?: NotificationOptions
): void => {
  if (options?.description) {
    toast.success(options.title || message, {
      description: options.description,
      duration: options.duration,
      action: options.action,
    });
  } else {
    toast.success(message, {
      duration: options?.duration,
      action: options?.action,
    });
  }
};

/**
 * Muestra una notificación de error
 */
export const notifyError = (
  message: string,
  options?: NotificationOptions
): void => {
  if (options?.description) {
    toast.error(options.title || message, {
      description: options.description,
      duration: options?.duration,
      action: options?.action,
    });
  } else {
    toast.error(message, {
      duration: options?.duration,
      action: options?.action,
    });
  }
};

/**
 * Muestra una notificación de advertencia
 */
export const notifyWarning = (
  message: string,
  options?: NotificationOptions
): void => {
  if (options?.description) {
    toast.warning(options.title || message, {
      description: options.description,
      duration: options?.duration,
      action: options?.action,
    });
  } else {
    toast.warning(message, {
      duration: options?.duration,
      action: options?.action,
    });
  }
};

/**
 * Muestra una notificación informativa
 */
export const notifyInfo = (
  message: string,
  options?: NotificationOptions
): void => {
  if (options?.description) {
    toast.info(options.title || message, {
      description: options.description,
      duration: options?.duration,
      action: options?.action,
    });
  } else {
    toast.info(message, {
      duration: options?.duration,
      action: options?.action,
    });
  }
};

/**
 * Muestra una notificación de carga
 */
export const notifyLoading = (
  message: string,
  options?: Omit<NotificationOptions, 'action'>
): string | number => {
  return toast.loading(message, {
    description: options?.description,
    duration: options?.duration || Infinity,
  });
};

/**
 * Actualiza una notificación existente
 */
export const updateNotification = (
  id: string | number,
  type: NotificationType,
  message: string,
  options?: NotificationOptions
): void => {
  const toastFn = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  }[type];

  toastFn(message, {
    id,
    description: options?.description,
    duration: options?.duration,
    action: options?.action,
  });
};

/**
 * Cierra una notificación
 */
export const dismissNotification = (id: string | number): void => {
  toast.dismiss(id);
};

/**
 * Cierra todas las notificaciones
 */
export const dismissAllNotifications = (): void => {
  toast.dismiss();
};

/**
 * Notificación del sistema (persiste en el store)
 */
export const notifySystem = (
  module: string,
  type: NotificationType,
  title: string,
  message: string
): void => {
  useNotificationStore.getState().addNotification({
    module,
    type,
    title,
    message,
  });
};

/**
 * Notificación de operación CRUD exitosa
 */
export const notifyCrudSuccess = (
  entity: string,
  operation: 'create' | 'update' | 'delete',
  name?: string
): void => {
  const messages = {
    create: `${entity} creado exitosamente`,
    update: `${entity} actualizado exitosamente`,
    delete: `${entity} eliminado exitosamente`,
  };

  const message = name
    ? `${entity} "${name}" ${operation === 'create' ? 'creado' : operation === 'update' ? 'actualizado' : 'eliminado'} exitosamente`
    : messages[operation];

  notifySuccess(message);
};

/**
 * Notificación de operación CRUD fallida
 */
export const notifyCrudError = (
  entity: string,
  operation: 'create' | 'update' | 'delete',
  error?: string
): void => {
  const messages = {
    create: `Error al crear ${entity}`,
    update: `Error al actualizar ${entity}`,
    delete: `Error al eliminar ${entity}`,
  };

  notifyError(messages[operation], {
    description: error,
  });
};

/**
 * Notificación de validación fallida
 */
export const notifyValidationError = (
  field: string,
  message: string
): void => {
  notifyError('Error de validación', {
    description: `${field}: ${message}`,
  });
};

/**
 * Notificación de operación en progreso
 */
export const notifyProgress = (
  message: string,
  current: number,
  total: number
): string | number => {
  return notifyLoading(message, {
    description: `${current} de ${total} completados`,
  });
};

/**
 * Notificación de importación masiva
 */
export const notifyBulkImport = (
  entity: string,
  count: number,
  success: boolean
): void => {
  if (success) {
    notifySuccess(`${count} ${entity} importados exitosamente`);
    notifySystem('Importación', 'success', 'Importación Masiva', `Se han importado ${count} ${entity} correctamente.`);
  } else {
    notifyError(`Error al importar ${entity}`);
  }
};

/**
 * Notificación de exportación
 */
export const notifyExport = (
  format: string,
  filename: string
): void => {
  notifySuccess(`Exportado como ${format}`, {
    description: `Archivo: ${filename}`,
  });
};

/**
 * Notificación de sincronización
 */
export const notifySync = (
  status: 'start' | 'success' | 'error',
  message?: string
): void => {
  switch (status) {
    case 'start':
      notifyInfo('Sincronizando datos...', {
        description: message,
      });
      break;
    case 'success':
      notifySuccess('Sincronización completada', {
        description: message,
      });
      break;
    case 'error':
      notifyError('Error en sincronización', {
        description: message,
      });
      break;
  }
};

/**
 * Notificación de permisos insuficientes
 */
export const notifyPermissionDenied = (action?: string): void => {
  notifyError('Acceso denegado', {
    description: action
      ? `No tienes permisos para ${action}`
      : 'No tienes permisos para realizar esta acción',
  });
};

/**
 * Notificación de sesión expirada
 */
export const notifySessionExpired = (): void => {
  notifyWarning('Sesión expirada', {
    description: 'Por favor, inicia sesión nuevamente',
  });
};

/**
 * Notificación de conexión perdida
 */
export const notifyConnectionLost = (): void => {
  notifyWarning('Conexión perdida', {
    description: 'Trabajando en modo offline',
  });
};

/**
 * Notificación de conexión restaurada
 */
export const notifyConnectionRestored = (): void => {
  notifySuccess('Conexión restaurada', {
    description: 'Sincronizando cambios...',
  });
};
