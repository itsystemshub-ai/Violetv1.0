import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib';
import {
  validateCredentials,
  checkRateLimit,
  authenticateSuperAdmin,
  authenticateMockUser,
  simulateNetworkDelay,
  type AuthResult,
} from './useAuth.helpers';
import { loginRateLimiter } from '@/core/security/security/rateLimiter';
import { sanitizeString } from '@/core/security/security/sanitization';
import { localDb } from '@/core/database/localDb';

/**
 * Interfaz que define el estado global de autenticación.
 * Utiliza Zustand para asegurar que el estado del usuario sea consistente en toda la aplicación.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
  updateUser: (updates: Partial<User>) => void;
  requestPasswordReset: (usernameOrEmail: string) => Promise<{ success: boolean; message: string }>;
}

/**
 * NOTA DE SEGURIDAD:
 * En producción, las credenciales deben venir de variables de entorno
 * y la autenticación debe hacerse contra un backend seguro.
 * 
 * Para desarrollo/demo, se mantienen credenciales mock en useAuth.helpers.ts
 */

/**
 * Store persistente de Zustand para manejar la sesión del usuario.
 * Se guarda en localStorage bajo la clave 'violet-auth-context'.
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null as User | null,
      isAuthenticated: false,
      sessionToken: null as string | null,
      setSession: (user, token) => set({ user, sessionToken: token, isAuthenticated: true }),
      clearSession: () => set({ user: null, sessionToken: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      requestPasswordReset: async (_usernameOrEmail) => {
        // Implementation will be in the useAuth hook to access localDb and notify
        return { success: true, message: "Solicitud registrada" };
      }
    }),
    {
      name: 'violet-auth-context',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
    }
  )
);

/**
 * Hook personalizado para gestionar la autenticación de usuarios en Violet ERP.
 * 
 * Proporciona funcionalidades completas de autenticación incluyendo:
 * - Login con validación y rate limiting
 * - Logout y limpieza de sesión
 * - Gestión de estado de usuario
 * - Verificación de roles
 * 
 * @returns {Object} Objeto con funciones y estado de autenticación
 * @returns {User | null} user - Usuario autenticado actual
 * @returns {boolean} isAuthenticated - Estado de autenticación
 * @returns {string | null} sessionToken - Token de sesión actual
 * @returns {Function} login - Función para iniciar sesión
 * @returns {Function} logout - Función para cerrar sesión
 * @returns {Function} updateUser - Función para actualizar datos del usuario
 * @returns {Function} hasRole - Función para verificar rol del usuario
 * @returns {number} systemYear - Año del sistema (2026)
 * 
 * @example
 * ```typescript
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * // Iniciar sesión
 * const result = await login('usuario', 'contraseña', 'tenant-id');
 * if (result.success) {
 *   console.log('Login exitoso');
 * }
 * 
 * // Verificar rol
 * if (hasRole('admin')) {
 *   console.log('Usuario es administrador');
 * } // Cerrar sesión
 * logout();
 * ```
 * 
 * @security
 * - Implementa rate limiting (5 intentos, 15 min bloqueo)
 * - Sanitiza todas las entradas
 * - Genera tokens seguros criptográficamente
 * - En producción debe conectarse con backend real (Laravel Sanctum)
 */
export const useAuth = () => {
  const { user, isAuthenticated, sessionToken, setSession, clearSession, updateUser } = useAuthStore();

  /**
   * Inicia sesión de usuario con validación y seguridad mejorada.
   * 
   * Proceso de autenticación:
   * 1. Valida credenciales básicas (longitud, formato)
   * 2. Verifica rate limiting (máx 5 intentos)
   * 3. Simula delay de red (anti brute-force)
   * 4. Intenta autenticación como super admin
   * 5. Intenta autenticación como usuario mock
   * 6. Retorna resultado con usuario y token
   * 
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña del usuario
   * @param {string} [tenantId] - ID del tenant (empresa) opcional
   * @returns {Promise<AuthResult>} Resultado de la autenticación
   * 
   * @example
   * ```typescript
   * const result = await login('admin', 'password123', 'tenant-1');
   * if (result.success) {
   *   console.log('Usuario:', result.user);
   *   console.log('Token:', result.token);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   * 
   * @throws {Error} Si hay error de conexión con el servidor
   * 
   * @security
   * - Sanitiza entradas para prevenir inyección
   * - Implementa rate limiting
   * - Genera tokens seguros con crypto
   * - IMPORTANTE: En producción conectar con backend real
   */
  const login = async (
    username: string,
    password: string,
    tenantId?: string
  ): Promise<AuthResult> => {
    try {
      // PASO 1: Validar credenciales básicas
      const sanitizedUsername = sanitizeString(username);
      const sanitizedPassword = sanitizeString(password);
      
      const validation = validateCredentials(sanitizedUsername, sanitizedPassword);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // PASO 2: Verificar rate limiting
      const rateLimit = checkRateLimit(sanitizedUsername);
      if (!rateLimit.allowed) {
        return { success: false, error: rateLimit.error };
      }

      // PASO 3: Simular delay de red
      await simulateNetworkDelay(1000);

      // PASO 4: Intentar autenticación como super admin
      const superAdminAuth = authenticateSuperAdmin(sanitizedUsername, sanitizedPassword);
      if (superAdminAuth) {
        setSession(superAdminAuth.user!, superAdminAuth.token!);
        loginRateLimiter.reset(sanitizedUsername);
        return superAdminAuth;
      }

      // PASO 5: Intentar autenticación como usuario mock
      const mockUserAuth = authenticateMockUser(sanitizedUsername, sanitizedPassword, tenantId);
      if (mockUserAuth) {
        setSession(mockUserAuth.user!, mockUserAuth.token!);
        loginRateLimiter.reset(sanitizedUsername);
        return mockUserAuth;
      }

      // PASO 6: Login fallido
      return { success: false, error: 'Credenciales inválidas' };
    } catch (error) {
      console.error('Login Error:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  /**
   * Cierra la sesión del usuario y limpia todos los datos de autenticación.
   * 
   * Limpia:
   * - Usuario del estado global
   * - Token de sesión
   * - Estado de autenticación
   * - Datos persistentes en localStorage
   * 
   * @example
   * ```typescript
   * logout();
   * // Usuario será redirigido al login
   * ```
   * 
   * @note En producción debe llamar a API para invalidar token en servidor
   */
  const logout = () => {
    // En producción: await api.post('/logout');
    clearSession();
    // La redirección se maneja usualmente en el componente que consume el hook o vía un observer
  };

  /**
   * Verifica si el usuario actual tiene un rol específico.
   * 
   * @param {string} role - Rol a verificar (ej: 'admin', 'gerente', 'almacen')
   * @returns {boolean} true si el usuario tiene el rol, false en caso contrario
   * 
   * @example
   * ```typescript
   * if (hasRole('admin')) {
   *   // Mostrar opciones de administrador
   * }
   * 
   * if (hasRole('almacen')) {
   *   // Permitir gestión de inventario
   * }
   * ```
   */
  const hasRole = (role: string) => {
    return user?.role === role;
  };

  /**
   * Registra una solicitud de cambio de contraseña que requiere aprobación
   */
  const requestPasswordReset = async (
    usernameOrEmail: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const sanitizedInput = sanitizeString(usernameOrEmail);
      
      // Buscar usuario en DB local
      const userToReset = await localDb.profiles
        .where('username').equals(sanitizedInput)
        .or('email').equals(sanitizedInput)
        .first();

      // Guardar solicitud en la nueva tabla
      await localDb.password_reset_requests.add({
        id: crypto.randomUUID(),
        user_id: userToReset?.id || null,
        username: sanitizedInput,
        status: 'pending',
        tenant_id: userToReset?.tenant_id || 'unassigned',
        created_at: new Date().toISOString()
      });

      // Notificar al sistema (In-App)
      await localDb.notifications.add({
        id: crypto.randomUUID(),
        type: 'warning',
        title: 'Solicitud de Contraseña',
        message: `El usuario ${sanitizedInput} ha solicitado un cambio de contraseña y espera aprobación.`,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Enviar correo a soporte si hay internet
      if (navigator.onLine) {
        const { notifications: notificationService } = await import('@/services/core/notifications/NotificationService');
        await notificationService.dispatch({
          channel: 'EMAIL',
          recipient: 'it.systems.hub@gmail.com',
          subject: 'Nueva Solicitud de Cambio de Contraseña - Violet ERP',
          body: `Se ha recibido una nueva solicitud de cambio de contraseña para el usuario: ${sanitizedInput}. Por favor, revise el panel de administración para aprobar o rechazar esta solicitud.`,
          priority: 'NORMAL'
        });
      }

      return { 
        success: true, 
        message: 'Tu solicitud ha sido enviada al administrador para su aprobación.' 
      };
    } catch (error) {
      console.error('Password Reset Request Error:', error);
      return { success: false, message: 'No se pudo procesar la solicitud en este momento.' };
    }
  };

  return {
    user,
    isAuthenticated,
    sessionToken,
    login,
    logout,
    updateUser,
    hasRole,
    requestPasswordReset,
    // Metadata del sistema para el año actual
    systemYear: 2026,
  };
};
