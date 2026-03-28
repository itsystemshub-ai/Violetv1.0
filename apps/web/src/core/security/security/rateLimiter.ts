/**
 * Rate Limiter para prevenir ataques de fuerza bruta
 * Limita el número de intentos de login y otras operaciones sensibles
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutos
    blockDurationMs: number = 30 * 60 * 1000 // 30 minutos
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Verifica si una clave está bloqueada
   */
  isBlocked(key: string): boolean {
    const entry = this.attempts.get(key);
    if (!entry) return false;

    // Verificar si está bloqueado
    if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
      return true;
    }

    // Si el bloqueo expiró, limpiar
    if (entry.blockedUntil && Date.now() >= entry.blockedUntil) {
      this.attempts.delete(key);
      return false;
    }

    return false;
  }

  /**
   * Obtiene el tiempo restante de bloqueo en segundos
   */
  getBlockedTimeRemaining(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry || !entry.blockedUntil) return 0;

    const remaining = Math.ceil((entry.blockedUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Registra un intento
   */
  attempt(key: string): { allowed: boolean; remaining: number; blockedFor?: number } {
    // Verificar si está bloqueado
    if (this.isBlocked(key)) {
      return {
        allowed: false,
        remaining: 0,
        blockedFor: this.getBlockedTimeRemaining(key),
      };
    }

    const now = Date.now();
    const entry = this.attempts.get(key);

    // Si no hay entrada o la ventana expiró, crear nueva
    if (!entry || now - entry.firstAttempt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
      });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
      };
    }

    // Incrementar contador
    entry.count++;

    // Si excede el límite, bloquear
    if (entry.count > this.maxAttempts) {
      entry.blockedUntil = now + this.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        blockedFor: this.getBlockedTimeRemaining(key),
      };
    }

    return {
      allowed: true,
      remaining: this.maxAttempts - entry.count,
    };
  }

  /**
   * Resetea los intentos de una clave (usado después de login exitoso)
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      // Eliminar si la ventana expiró y no está bloqueado
      if (now - entry.firstAttempt > this.windowMs && !entry.blockedUntil) {
        this.attempts.delete(key);
      }
      // Eliminar si el bloqueo expiró
      if (entry.blockedUntil && now >= entry.blockedUntil) {
        this.attempts.delete(key);
      }
    }
  }
}

// Instancia global para login attempts
export const loginRateLimiter = new RateLimiter(
  5,                    // 5 intentos
  15 * 60 * 1000,      // en 15 minutos
  30 * 60 * 1000       // bloqueo de 30 minutos
);

// Instancia para operaciones sensibles (cambio de contraseña, etc.)
export const sensitiveOperationLimiter = new RateLimiter(
  3,                    // 3 intentos
  10 * 60 * 1000,      // en 10 minutos
  60 * 60 * 1000       // bloqueo de 1 hora
);

// Cleanup automático cada 5 minutos
setInterval(() => {
  loginRateLimiter.cleanup();
  sensitiveOperationLimiter.cleanup();
}, 5 * 60 * 1000);

export { RateLimiter };
