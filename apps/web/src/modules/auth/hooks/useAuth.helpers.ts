/**
 * Funciones helper para useAuth
 * Separa la lógica de autenticación en funciones más pequeñas y testeables
 */

import { User, ALL_PERMISSIONS } from '@/lib';
import { sanitizeString } from '@/core/security/security/sanitization';
import { generateSecureToken } from '@/core/security/security/encryption';
import { loginRateLimiter } from '@/core/security/security/rateLimiter';

/**
 * Credenciales de super admin desde variables de entorno
 */
export const DEMO_SUPER_ADMIN = {
  username: import.meta.env.VITE_SUPER_ADMIN_USER || 'superadmin',
  password: import.meta.env.VITE_SUPER_ADMIN_PASS || 'Violet@2026!',
} as const;

/**
 * Base de datos mock de usuarios (solo para demo/desarrollo)
 * En producción, estos usuarios deben estar en una base de datos real con contraseñas hasheadas
 * 
 * NOTA: Estos usuarios están aquí solo para propósitos de demostración.
 * Para habilitar/deshabilitar usuarios mock, usar la variable VITE_ENABLE_MOCK_USERS
 */
const MOCK_USERS_ENABLED = import.meta.env.VITE_ENABLE_MOCK_USERS !== 'false';

export const MOCK_DB_USERS = MOCK_USERS_ENABLED ? [
  { username: 'ventas_gerente', pass: 'Violet@2026!', role: 'gerente', dept: 'Ventas' },
  { username: 'almacen_op', pass: 'Violet@2026!', role: 'almacen', dept: 'Almacén' },
  { username: 'finanzas_cont', pass: 'Violet@2026!', role: 'contador', dept: 'Finanzas' },
  { username: 'rrhh_gestor', pass: 'Violet@2026!', role: 'recursos_humanos', dept: 'Recursos Humanos' },
  { username: 'it_admin', pass: 'Violet@2026!', role: 'admin', dept: 'Administración / IT' },
  { username: 'cliente_cauplas', pass: 'cliente2026', role: 'cliente', dept: 'Clientes Externos' },
  { username: 'cauplas', pass: 'venezuela2026', role: 'admin', dept: 'Administración / IT' },
] as const : [];

/**
 * Resultado de validación de credenciales
 */
export interface CredentialValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Resultado de rate limiting
 */
export interface RateLimitResult {
  allowed: boolean;
  error?: string;
}

/**
 * Resultado de autenticación
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

/**
 * Valida las credenciales básicas
 */
export const validateCredentials = (
  username: string,
  password: string
): CredentialValidationResult => {
  const sanitizedUsername = sanitizeString(username);
  const sanitizedPassword = sanitizeString(password);

  if (!sanitizedUsername || !sanitizedPassword) {
    return { isValid: false, error: 'Credenciales inválidas' };
  }

  return { isValid: true };
};

/**
 * Verifica el rate limiting
 */
export const checkRateLimit = (username: string): RateLimitResult => {
  const rateLimitResult = loginRateLimiter.attempt(username);
  
  if (!rateLimitResult.allowed) {
    return {
      allowed: false,
      error: `Demasiados intentos fallidos. Bloqueado por ${rateLimitResult.blockedFor} segundos.`,
    };
  }

  return { allowed: true };
};

/**
 * Autentica como super admin
 */
export const authenticateSuperAdmin = (
  username: string,
  password: string
): AuthResult | null => {
  if (
    username.toLowerCase() === DEMO_SUPER_ADMIN.username.toLowerCase() &&
    password === DEMO_SUPER_ADMIN.password
  ) {
    const superAdminUser: User = {
      id: 'usr_superadmin_violet_001',
      username: DEMO_SUPER_ADMIN.username,
      name: 'Super Administrador',
      role: 'super_admin',
      tenantId: 'neutral',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin`,
      is2FAEnabled: false,
      permissions: [...ALL_PERMISSIONS],
      isSuperAdmin: true,
    };

    const superToken = generateSecureToken();

    return {
      success: true,
      user: superAdminUser,
      token: superToken,
    };
  }

  return null;
};

/**
 * Autentica usuario mock
 */
export const authenticateMockUser = (
  username: string,
  password: string,
  tenantId?: string
): AuthResult | null => {
  const foundMock = MOCK_DB_USERS.find(
    (u) => u.username === username && u.pass === password
  );

  // Legacy admin support
  const isLegacyAdmin = username === 'admin' && password === 'admin';

  if (foundMock || isLegacyAdmin) {
    const isAdminRole = foundMock?.role === 'admin' || isLegacyAdmin;
    const role = foundMock?.role || 'admin';
    const dept = foundMock?.dept || 'Administración / IT';

    const mockUser: User = {
      id: `usr_${crypto.randomUUID()}`,
      username: username,
      name: username.charAt(0).toUpperCase() + username.slice(1).replace('_', ' '),
      role: role as any,
      department: dept,
      tenantId: tenantId || (isAdminRole ? 'neutral' : '00000000-0000-0000-0000-000000000000'),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      is2FAEnabled: false,
      permissions:
        role === 'gerente' || role === 'admin'
          ? [...ALL_PERMISSIONS]
          : ['view:dashboard', 'inventory:read'],
      isSuperAdmin: isAdminRole,
    };

    const mockToken = generateSecureToken();

    return {
      success: true,
      user: mockUser,
      token: mockToken,
    };
  }

  return null;
};

/**
 * Simula delay de red
 */
export const simulateNetworkDelay = async (ms: number = 1000): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
