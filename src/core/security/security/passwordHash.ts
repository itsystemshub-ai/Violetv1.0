import bcrypt from 'bcrypt';

/**
 * Número de rondas de salt para bcrypt.
 * Más rondas = más seguro pero más lento.
 * 10-12 es el estándar recomendado.
 */
const SALT_ROUNDS = 12;

/**
 * Hashea una contraseña usando bcrypt.
 * 
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 * 
 * @example
 * ```typescript
 * const hash = await hashPassword('myPassword123');
 * // Guardar hash en base de datos
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica una contraseña contra su hash.
 * 
 * @param password - Contraseña en texto plano
 * @param hash - Hash almacenado
 * @returns true si la contraseña coincide
 * 
 * @example
 * ```typescript
 * const isValid = await verifyPassword('myPassword123', storedHash);
 * if (isValid) {
 *   // Contraseña correcta
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Verifica si un hash necesita ser rehashed.
 * Útil cuando se cambia SALT_ROUNDS.
 * 
 * @param hash - Hash a verificar
 * @returns true si necesita rehashing
 */
export function needsRehash(hash: string): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < SALT_ROUNDS;
  } catch (error) {
    return true;
  }
}
