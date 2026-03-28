/**
 * Constantes centralizadas de Violet ERP.
 * 
 * Este módulo contiene todos los valores constantes usados en la aplicación:
 * - Configuración de la aplicación
 * - Límites y restricciones
 * - Configuración de seguridad
 * - Monedas e impuestos
 * - Estados y tipos
 * - Mensajes predefinidos
 * - Expresiones regulares
 * 
 * @module constants
 * @category Configuration
 * 
 * @example
 * ```typescript
 * import { 
 *   APP_CONFIG, 
 *   PAGINATION, 
 *   VENEZUELA_TAXES,
 *   ERROR_MESSAGES 
 * } from '@/lib/constants';
 * 
 * // Usar configuración
 * console.log(APP_CONFIG.NAME); // 'Violet ERP'
 * 
 * // Usar límites de paginación
 * const pageSize = PAGINATION.DEFAULT_PAGE_SIZE; // 50
 * 
 * // Calcular IVA
 * const iva = subtotal * (VENEZUELA_TAXES.IVA_GENERAL / 100);
 * 
 * // Mostrar mensaje de error
 * toast.error(ERROR_MESSAGES.REQUIRED_FIELD);
 * ```
 * 
 * @note
 * - Todos los objetos son readonly (as const)
 * - No modificar valores en runtime
 * - Para valores dinámicos usar configuración del sistema
 */

/**
 * Configuración general de la aplicación.
 * Información básica del sistema.
 * 
 * @constant
 * @readonly
 */
export const APP_CONFIG = {
  NAME: 'Violet ERP',
  VERSION: '0.0.1',
  YEAR: 2026,
  COMPANY: 'Violet Systems',
  SUPPORT_EMAIL: 'support@violet-erp.com',
  SUPPORT_PHONE: '+58 414 1234567',
} as const;

/**
 * Límites de paginación para tablas y listas.
 * Optimiza rendimiento al limitar cantidad de datos cargados.
 * 
 * @constant
 * @readonly
 * 
 * @example
 * ```typescript
 * const { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } = PAGINATION;
 * 
 * // Usar en query
 * const products = await db.products
 *   .limit(DEFAULT_PAGE_SIZE)
 *   .toArray();
 * 
 * // Selector de tamaño de página
 * <select>
 *   {PAGE_SIZE_OPTIONS.map(size => (
 *     <option value={size}>{size} items</option>
 *   ))}
 * </select>
 * ```
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MIN_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 1000,
  PAGE_SIZE_OPTIONS: [25, 50, 100, 200, 500],
} as const;

/**
 * Límites de archivos
 */
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

/**
 * Configuración de seguridad de la aplicación.
 * Define límites y restricciones de seguridad.
 * 
 * @constant
 * @readonly
 * 
 * @example
 * ```typescript
 * const { PASSWORD_MIN_LENGTH, MAX_LOGIN_ATTEMPTS } = SECURITY;
 * 
 * // Validar longitud de contraseña
 * if (password.length < PASSWORD_MIN_LENGTH) {
 *   throw new ValidationError('Contraseña muy corta');
 * }
 * 
 * // Rate limiting
 * if (attempts >= MAX_LOGIN_ATTEMPTS) {
 *   throw new AuthenticationError('Demasiados intentos');
 * }
 * ```
 */
export const SECURITY = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas
} as const;

/**
 * Configuración de búsqueda
 */
export const SEARCH = {
  DEBOUNCE_DELAY: 300, // ms
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 200,
  MAX_RESULTS: 100,
} as const;

/**
 * Monedas soportadas
 */
export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  VES: { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezolano' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
} as const;

/**
 * Impuestos de Venezuela según normativa vigente.
 * Valores actualizados a 2026.
 * 
 * @constant
 * @readonly
 * 
 * @example
 * ```typescript
 * const { IVA_GENERAL, IGTF_DIVISAS } = VENEZUELA_TAXES;
 * 
 * // Calcular IVA
 * const iva = subtotal * (IVA_GENERAL / 100); // 16%
 * 
 * // Calcular IGTF (impuesto a transacciones en divisas)
 * const igtf = totalUSD * (IGTF_DIVISAS / 100); // 3%
 * 
 * // Calcular multa en UT
 * const multaUSD = UT_VALUE * 50; // 50 UT
 * ```
 * 
 * @see {@link https://www.seniat.gob.ve|SENIAT}
 */
export const VENEZUELA_TAXES = {
  IVA_GENERAL: 16,
  IVA_REDUCIDO: 8,
  IVA_LUJO: 31,
  IGTF_DIVISAS: 3,
  UT_VALUE: 90.00, // Valor de la Unidad Tributaria
} as const;

/**
 * Estados de factura
 */
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
} as const;

/**
 * Tipos de factura
 */
export const INVOICE_TYPES = {
  SALE: 'venta',
  PURCHASE: 'compra',
} as const;

/**
 * Métodos de pago
 */
export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  TRANSFER: 'transferencia',
  DEBIT_CARD: 'tarjeta_debito',
  CREDIT_CARD: 'tarjeta_credito',
  CHECK: 'cheque',
  MOBILE_PAYMENT: 'pago_movil',
  ZELLE: 'zelle',
  PAYPAL: 'paypal',
  CREDIT: 'credito',
} as const;

/**
 * Estados de producto
 */
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
} as const;

/**
 * Unidades de medida
 */
export const UNITS = {
  UNIT: 'unidad',
  KG: 'kg',
  LITER: 'litro',
  METER: 'metro',
  BOX: 'caja',
  PACKAGE: 'paquete',
} as const;

/**
 * Estados de empleado
 */
export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
} as const;

/**
 * Tipos de contrato
 */
export const CONTRACT_TYPES = {
  INDEFINITE: 'indefinido',
  TEMPORARY: 'temporal',
  PROJECT: 'por_proyecto',
  INTERNSHIP: 'pasantia',
} as const;

/**
 * Roles de usuario disponibles en el sistema.
 * Define niveles de acceso y permisos.
 * 
 * @constant
 * @readonly
 * 
 * @example
 * ```typescript
 * const { SUPER_ADMIN, ADMIN, WAREHOUSE } = USER_ROLES;
 * 
 * // Verificar rol
 * if (user.role === SUPER_ADMIN) {
 *   // Acceso total al sistema
 * }
 * 
 * if (user.role === WAREHOUSE) {
 *   // Solo acceso a inventario
 * }
 * ```
 */
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'gerente',
  WAREHOUSE: 'almacen',
  ACCOUNTANT: 'contador',
  HR: 'recursos_humanos',
  CLIENT: 'cliente',
} as const;

/**
 * Departamentos
 */
export const DEPARTMENTS = [
  'Ventas',
  'Almacén',
  'Finanzas',
  'Recursos Humanos',
  'Administración / IT',
  'Compras',
  'Producción',
  'Logística',
  'Marketing',
  'Servicio al Cliente',
] as const;

/**
 * Categorías de productos (ejemplo)
 */
export const PRODUCT_CATEGORIES = [
  'Mangueras',
  'Acoples',
  'Válvulas',
  'Filtros',
  'Accesorios',
  'Herramientas',
  'Lubricantes',
  'Repuestos',
  'Equipos',
  'Otros',
] as const;

/**
 * Formatos de fecha
 */
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD de MMMM de YYYY',
  WITH_TIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_RIF: 'RIF inválido',
  INVALID_CEDULA: 'Cédula inválida',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción',
  NOT_FOUND: 'Recurso no encontrado',
  SERVER_ERROR: 'Error del servidor. Intenta nuevamente',
} as const;

/**
 * Mensajes de éxito comunes
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  SAVED: 'Guardado exitosamente',
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
} as const;

/**
 * Colores del tema
 */
export const THEME_COLORS = {
  PRIMARY: '#7c3aed',
  SECONDARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
} as const;

/**
 * Configuración de notificaciones
 */
export const NOTIFICATIONS = {
  DURATION: 5000, // ms
  MAX_VISIBLE: 3,
  POSITION: 'top-right',
} as const;

/**
 * Configuración de caché
 */
export const CACHE = {
  PRODUCTS_TTL: 5 * 60 * 1000, // 5 minutos
  INVOICES_TTL: 2 * 60 * 1000, // 2 minutos
  USERS_TTL: 10 * 60 * 1000, // 10 minutos
  SETTINGS_TTL: 30 * 60 * 1000, // 30 minutos
} as const;

/**
 * Configuración de sincronización
 */
export const SYNC = {
  INTERVAL: 30 * 1000, // 30 segundos
  RETRY_DELAY: 5 * 1000, // 5 segundos
  MAX_RETRIES: 3,
  BATCH_SIZE: 100,
} as const;

/**
 * Expresiones regulares comunes para validación.
 * Patrones reutilizables para diferentes tipos de datos.
 * 
 * @constant
 * @readonly
 * 
 * @example
 * ```typescript
 * const { EMAIL, PHONE, RIF } = REGEX;
 * 
 * // Validar email
 * if (EMAIL.test(email)) {
 *   console.log('Email válido');
 * }
 * 
 * // Validar RIF
 * if (RIF.test(rif)) {
 *   console.log('RIF válido');
 * }
 * 
 * // Validar UUID
 * if (UUID.test(id)) {
 *   console.log('UUID válido');
 * }
 * ```
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+58|0)?[\d\-\s()]{10,15}$/,
  RIF: /^[JGVEPCD]-\d{8}-\d$/,
  CEDULA: /^[VE]-\d{7,8}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

/**
 * URLs de API (ejemplo)
 */
export const API_URLS = {
  BASE: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  AUTH: '/api/auth',
  PRODUCTS: '/api/products',
  INVOICES: '/api/invoices',
  USERS: '/api/users',
  EMPLOYEES: '/api/employees',
  SETTINGS: '/api/settings',
} as const;

/**
 * Claves de localStorage
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'violet-auth-token',
  USER_DATA: 'violet-user-data',
  THEME: 'violet-theme',
  LANGUAGE: 'violet-language',
  SETTINGS: 'violet-settings',
} as const;

/**
 * Configuración de validación
 */
export const VALIDATION = {
  MAX_STRING_LENGTH: 1000,
  MAX_TEXT_LENGTH: 5000,
  MAX_ARRAY_LENGTH: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999999,
  MIN_STOCK: 0,
  MAX_STOCK: 999999999,
} as const;
