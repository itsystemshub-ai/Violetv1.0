/**
 * Mensajes de error amigables para el usuario
 * Convierte errores técnicos en mensajes comprensibles
 */

export interface UserMessage {
  title: string;
  description: string;
  action?: string;
}

/**
 * Mapeo de errores técnicos a mensajes amigables
 */
const ERROR_MESSAGES: Record<string, UserMessage> = {
  // Errores de red
  'Network Error': {
    title: 'Sin conexión',
    description: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
    action: 'Reintentar',
  },
  'Failed to fetch': {
    title: 'Error de conexión',
    description: 'No se pudo obtener los datos. Intenta nuevamente.',
    action: 'Reintentar',
  },
  'ECONNREFUSED': {
    title: 'Servidor no disponible',
    description: 'El servidor no está respondiendo. Intenta más tarde.',
  },

  // Errores de autenticación
  'Invalid credentials': {
    title: 'Credenciales incorrectas',
    description: 'El usuario o contraseña son incorrectos.',
  },
  'Unauthorized': {
    title: 'Acceso no autorizado',
    description: 'No tienes permisos para realizar esta acción.',
  },
  'Token expired': {
    title: 'Sesión expirada',
    description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    action: 'Iniciar sesión',
  },
  'Session expired': {
    title: 'Sesión expirada',
    description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    action: 'Iniciar sesión',
  },

  // Errores de validación
  'Validation error': {
    title: 'Datos inválidos',
    description: 'Algunos campos contienen información incorrecta.',
  },
  'Required field': {
    title: 'Campo requerido',
    description: 'Por favor, completa todos los campos obligatorios.',
  },
  'Invalid format': {
    title: 'Formato inválido',
    description: 'El formato de los datos no es correcto.',
  },

  // Errores de base de datos
  'Database error': {
    title: 'Error en la base de datos',
    description: 'Ocurrió un problema al guardar los datos. Intenta nuevamente.',
  },
  'Duplicate entry': {
    title: 'Registro duplicado',
    description: 'Ya existe un registro con estos datos.',
  },
  'Foreign key constraint': {
    title: 'No se puede eliminar',
    description: 'Este registro está siendo usado por otros datos.',
  },

  // Errores de negocio
  'Insufficient stock': {
    title: 'Stock insuficiente',
    description: 'No hay suficiente inventario para completar esta operación.',
  },
  'Invalid tenant': {
    title: 'Empresa no válida',
    description: 'No hay una empresa activa seleccionada.',
    action: 'Seleccionar empresa',
  },
  'No tenant selected': {
    title: 'Sin empresa seleccionada',
    description: 'Debes seleccionar una empresa para continuar.',
    action: 'Seleccionar empresa',
  },

  // Errores de archivo
  'File too large': {
    title: 'Archivo muy grande',
    description: 'El archivo excede el tamaño máximo permitido.',
  },
  'Invalid file type': {
    title: 'Tipo de archivo inválido',
    description: 'El formato del archivo no es compatible.',
  },
  'Upload failed': {
    title: 'Error al subir archivo',
    description: 'No se pudo subir el archivo. Intenta nuevamente.',
  },

  // Errores de sincronización
  'Sync failed': {
    title: 'Error de sincronización',
    description: 'No se pudieron sincronizar los datos con el servidor.',
  },
  'Conflict detected': {
    title: 'Conflicto de datos',
    description: 'Los datos han sido modificados por otro usuario.',
  },
};

/**
 * Convierte un error técnico en un mensaje amigable
 */
export const getUserMessage = (error: Error | string): UserMessage => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Buscar coincidencia exacta
  if (ERROR_MESSAGES[errorMessage]) {
    return ERROR_MESSAGES[errorMessage];
  }

  // Buscar coincidencia parcial
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  // Mensaje genérico
  return {
    title: 'Error inesperado',
    description: 'Ocurrió un error. Por favor, intenta nuevamente.',
  };
};

/**
 * Mensajes de éxito para operaciones comunes
 */
export const SUCCESS_MESSAGES = {
  // CRUD
  created: (entity: string) => `${entity} creado exitosamente`,
  updated: (entity: string) => `${entity} actualizado exitosamente`,
  deleted: (entity: string) => `${entity} eliminado exitosamente`,
  
  // Operaciones masivas
  bulkCreated: (count: number, entity: string) => 
    `${count} ${entity} creados exitosamente`,
  bulkUpdated: (count: number, entity: string) => 
    `${count} ${entity} actualizados exitosamente`,
  bulkDeleted: (count: number, entity: string) => 
    `${count} ${entity} eliminados exitosamente`,
  
  // Importación/Exportación
  imported: (count: number, entity: string) => 
    `${count} ${entity} importados exitosamente`,
  exported: (format: string) => `Exportado como ${format} exitosamente`,
  
  // Sincronización
  synced: 'Datos sincronizados exitosamente',
  syncStarted: 'Sincronización iniciada',
  
  // Autenticación
  loggedIn: 'Sesión iniciada exitosamente',
  loggedOut: 'Sesión cerrada exitosamente',
  
  // Configuración
  settingsSaved: 'Configuración guardada exitosamente',
  settingsReset: 'Configuración restablecida',
};

/**
 * Mensajes de confirmación para acciones destructivas
 */
export const CONFIRMATION_MESSAGES = {
  delete: (entity: string) => ({
    title: `¿Eliminar ${entity}?`,
    description: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
  }),
  
  bulkDelete: (count: number, entity: string) => ({
    title: `¿Eliminar ${count} ${entity}?`,
    description: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar todos',
    cancelText: 'Cancelar',
  }),
  
  logout: {
    title: '¿Cerrar sesión?',
    description: 'Los cambios no sincronizados se perderán.',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
  },
  
  reset: {
    title: '¿Restablecer configuración?',
    description: 'Se perderán todas las configuraciones personalizadas.',
    confirmText: 'Restablecer',
    cancelText: 'Cancelar',
  },
  
  clearData: {
    title: '¿Limpiar todos los datos?',
    description: 'Esta acción eliminará todos los datos locales y no se puede deshacer.',
    confirmText: 'Limpiar datos',
    cancelText: 'Cancelar',
  },
};

/**
 * Mensajes de validación específicos
 */
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} es requerido`,
  minLength: (field: string, min: number) => 
    `${field} debe tener al menos ${min} caracteres`,
  maxLength: (field: string, max: number) => 
    `${field} no puede exceder ${max} caracteres`,
  email: 'Correo electrónico inválido',
  phone: 'Número de teléfono inválido',
  rif: 'RIF inválido (formato: J-12345678-9)',
  cedula: 'Cédula inválida (formato: V-12345678)',
  positive: (field: string) => `${field} debe ser mayor a 0`,
  min: (field: string, min: number) => `${field} debe ser mayor o igual a ${min}`,
  max: (field: string, max: number) => `${field} debe ser menor o igual a ${max}`,
  date: 'Fecha inválida',
  futureDate: 'La fecha no puede ser futura',
  pastDate: 'La fecha no puede ser pasada',
};
