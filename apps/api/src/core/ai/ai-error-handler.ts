/**
 * aiErrorHandler.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Violet ERP — Interceptor Inteligente de Errores
 *
 * Reemplaza los bloques try-catch tradicionales con un wrapper que:
 * 1. Ejecuta la operación normalmente
 * 2. Si falla, consulta selfHealingService antes de propagar el error
 * 3. Aplica el parche si la IA lo resuelve y la severidad lo permite
 * 4. Solo lanza el error original si es CRITICAL o la IA no pudo repararlo
 *
 * Uso:
 *   const result = await withAIHealing(
 *     { module: "sales", operation: "processInvoice", payload: invoiceData },
 *     () => processInvoice(invoiceData)
 *   );
 */

import { selfHeal, HealingRequest, getHealingLog } from "./selfHealingService";
import { toast } from "sonner";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface HealingContext {
  module: HealingRequest["module"];
  operation: string;
  payload?: unknown;
  context?: string;
  /** Si true, muestra un toast al usuario cuando la IA repara el error */
  notifyUser?: boolean;
  /** Valor de fallback si la IA no puede reparar (para errores no críticos) */
  fallback?: unknown;
}

// ── Wrapper principal ──────────────────────────────────────────────────────

/**
 * Ejecuta una función asíncrona con autoreparación IA si falla.
 *
 * @param ctx         Contexto del módulo/operación para diagnóstico IA
 * @param fn          La función a ejecutar (puede lanzar errores)
 * @param patchMerger Cómo aplicar el patch de la IA al resultado (opcional)
 * @returns           El resultado de fn, o el patch de la IA si fue reparado
 */
export async function withAIHealing<T>(
  ctx: HealingContext,
  fn: () => Promise<T>,
  patchMerger?: (patch: unknown) => T
): Promise<T> {
  try {
    return await fn();
  } catch (originalError: unknown) {
    const err = originalError instanceof Error
      ? originalError
      : new Error(String(originalError));

    // ── Consulta de autoreparación ─────────────────────────────────────
    const healingResult = await selfHeal({
      module: ctx.module,
      operation: ctx.operation,
      error: { name: err.name, message: err.message, stack: err.stack },
      payload: ctx.payload,
      context: ctx.context,
    });

    // ── Error CRITICAL → detener siempre ─────────────────────────────
    if (healingResult.severity === "CRITICAL") {
      toast.error(
        `❌ Error crítico en ${ctx.module}::${ctx.operation}. Requiere revisión manual.`
      );
      throw err; // Propaga el error original — no se puede parchear
    }

    // ── Error REPARABLE y con patch ────────────────────────────────────
    if (healingResult.healed && healingResult.patch !== undefined) {
      if (ctx.notifyUser !== false) {
        toast.warning(
          `🔧 Violet IA reparó un error en ${ctx.operation} automáticamente.`,
          { description: healingResult.diagnosis, duration: 5000 }
        );
      }
      // Usar el merger personalizado o devolver el patch directamente
      return patchMerger
        ? patchMerger(healingResult.patch)
        : (healingResult.patch as T);
    }

    // ── WARNING / No reparable → usar fallback si existe ──────────────
    if (ctx.fallback !== undefined) {
      if (ctx.notifyUser !== false) {
        toast.warning(
          `⚠️ ${ctx.operation} usó un valor de respaldo.`,
          { description: healingResult.diagnosis, duration: 4000 }
        );
      }
      return ctx.fallback as T;
    }

    // ── Sin reparación posible → propagar ─────────────────────────────
    throw err;
  }
}

// ── Helper síncrono (para operaciones no-async) ────────────────────────────

/**
 * Versión síncrona que lanza la operación y, si falla, usa el fallback.
 * La consulta IA se hace en background sin bloquear.
 */
export function withSyncGuard<T>(
  ctx: HealingContext,
  fn: () => T
): T {
  try {
    return fn();
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    // Diagnóstico en background (no bloquea)
    selfHeal({
      module: ctx.module,
      operation: ctx.operation,
      error: { name: error.name, message: error.message },
      payload: ctx.payload,
      context: ctx.context,
    }).then((result) => {
      if (result.severity === "CRITICAL") {
        toast.error(`❌ Error crítico detectado en ${ctx.operation}`);
      }
    });

    if (ctx.fallback !== undefined) return ctx.fallback as T;
    throw error;
  }
}

// ── Re-exportar log para UI ────────────────────────────────────────────────
export { getHealingLog };
