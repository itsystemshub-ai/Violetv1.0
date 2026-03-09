/**
 * selfHealingService.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Violet ERP — Motor de Autoreparación IA
 *
 * Flujo:
 *  1. Un módulo captura un error de ejecución
 *  2. Se envía el contexto del error a Groq (primario, ultra-rápido)
 *  3. Si Groq falla, fallback a Gemini (mayor contexto)
 *  4. La IA devuelve un "parche": dato corregido, valor por defecto, o bypass
 *  5. El ERP aplica el parche y continúa operando
 *  6. Todo queda registrado en el self-healing log para auditoría
 *
 * APIs usadas:
 *  - Groq  (Llama 3-8b)  → capa gratuita 14,400 req/día
 *  - Gemini Flash 2.0    → capa gratuita 1,500 req/día, contexto largo
 *  - Hugging Face        → fallback offline-compatible
 */

// ── Tipos ──────────────────────────────────────────────────────────────────

export type AISeverity = "CRITICAL" | "REPARABLE" | "WARNING";

export interface HealingRequest {
  /** Nombre del módulo donde ocurrió el error */
  module: "sales" | "inventory" | "finance" | "hr" | "settings" | "sync";
  /** Tipo de operación que falló */
  operation: string;
  /** El Error capturado (serializable) */
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  /** El payload/datos que causaron el fallo */
  payload?: unknown;
  /** Contexto adicional en texto libre */
  context?: string;
}

export interface HealingResponse {
  /** Severidad evaluada por la IA */
  severity: AISeverity;
  /** El parche aplicado (datos corregidos, valor por defecto, etc.) */
  patch?: unknown;
  /** Explicación legible del diagnóstico */
  diagnosis: string;
  /** Si la IA logró reparar el error */
  healed: boolean;
  /** Qué API resolvió el problema */
  provider: "groq" | "gemini" | "huggingface" | "none";
  /** Timestamp ISO del evento */
  timestamp: string;
}

// ── Log de Autoreparación (persiste en memoria de sesión) ──────────────────

const healingLog: (HealingRequest & HealingResponse)[] = [];

export const getHealingLog = () => [...healingLog];

// ── Sistema Prompt para la IA ──────────────────────────────────────────────

const SYSTEM_PROMPT = `
Eres el Motor de Autoreparación IA de Violet ERP, un sistema de gestión empresarial (TypeScript + React + Web + Dexie).

Tu única función es analizar errores de ejecución y devolver EXCLUSIVAMENTE un JSON con este formato exacto:
{
  "severity": "REPARABLE" | "CRITICAL" | "WARNING",
  "healed": true | false,
  "diagnosis": "Explicación breve en español (máx 100 chars)",
  "patch": <el dato corregido, null si no aplica>
}

REGLAS:
- "CRITICAL" si el error compromete integridad de datos o seguridad (nunca parchear).
- "REPARABLE" si es un dato mal formado, nulo inesperado, o fallo de red temporal.
- "WARNING" si es un error no bloqueante que puede ignorarse con seguridad.
- En "patch" devuelve el valor corregido/reparado listo para usar, o null.
- NUNCA respondas con texto fuera del JSON. Solo JSON válido.
`.trim();

// ── Utilidades ─────────────────────────────────────────────────────────────

const isOnline = (): boolean => {
  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    return navigator.onLine;
  }
  return true;
};

const buildPrompt = (req: HealingRequest): string =>
  `
MÓDULO: ${req.module}
OPERACIÓN: ${req.operation}
ERROR: ${req.error.name} — ${req.error.message}
PAYLOAD: ${JSON.stringify(req.payload ?? null, null, 2)}
CONTEXTO: ${req.context ?? "Sin contexto adicional"}
`.trim();

const parseAIResponse = (text: string): Partial<HealingResponse> | null => {
  try {
    // Extraer bloque JSON aunque la IA meta texto extra
    const match = text.match(/\{[\s\S]*"severity"[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

// ── Provider: Groq (Primario) ──────────────────────────────────────────────

const tryGroq = async (prompt: string): Promise<Partial<HealingResponse> | null> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.1, // Determinista para reparaciones
        max_tokens: 512,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(5000), // 5s máximo
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return parseAIResponse(text);
  } catch {
    return null; // Timeout o fallo → siguiente provider
  }
};

// ── Provider: Gemini Flash (Fallback) ────────────────────────────────────

const tryGemini = async (prompt: string): Promise<Partial<HealingResponse> | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 512,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseAIResponse(text);
  } catch {
    return null;
  }
};

// ── Provider: Hugging Face (Último recurso) ───────────────────────────────

const tryHuggingFace = async (prompt: string): Promise<Partial<HealingResponse> | null> => {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${SYSTEM_PROMPT}\n\nUSER:\n${prompt}\n\nRESPONSE (JSON only):`,
          parameters: { max_new_tokens: 512, temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );

    const data = await res.json();
    const text = Array.isArray(data)
      ? data[0]?.generated_text ?? ""
      : data?.generated_text ?? "";
    return parseAIResponse(text);
  } catch {
    return null;
  }
};

// ── Motor Principal de Autoreparación ─────────────────────────────────────

/**
 * Intenta autoreparar un error de ejecución usando IA en cascada.
 * Groq → Gemini → HuggingFace
 *
 * @example
 * const { healed, patch, severity } = await selfHeal({
 *   module: "sales",
 *   operation: "processInvoice",
 *   error: { name: e.name, message: e.message },
 *   payload: invoiceData,
 * });
 * if (healed && severity !== "CRITICAL") applyPatch(patch);
 */
export const selfHeal = async (req: HealingRequest): Promise<HealingResponse> => {
  const timestamp = new Date().toISOString();

  // Sin Internet → no podemos consultar IA
  if (!isOnline()) {
    const response: HealingResponse = {
      severity: "REPARABLE",
      healed: false,
      diagnosis: "Sin conexión — reparación IA no disponible",
      provider: "none",
      timestamp,
    };
    healingLog.unshift({ ...req, ...response });
    return response;
  }

  const prompt = buildPrompt(req);

  // Cascada de providers
  let aiResult: Partial<HealingResponse> | null = null;
  let provider: HealingResponse["provider"] = "none";

  aiResult = await tryGroq(prompt);
  if (aiResult) provider = "groq";

  if (!aiResult) {
    aiResult = await tryGemini(prompt);
    if (aiResult) provider = "gemini";
  }

  if (!aiResult) {
    aiResult = await tryHuggingFace(prompt);
    if (aiResult) provider = "huggingface";
  }

  const response: HealingResponse = {
    severity: aiResult?.severity ?? "REPARABLE",
    patch: aiResult?.patch ?? null,
    diagnosis: aiResult?.diagnosis ?? "IA no disponible — requiere revisión manual",
    healed: !!(aiResult?.healed && aiResult?.patch !== undefined),
    provider,
    timestamp,
  };

  // No aplicar parches a errores críticos
  if (response.severity === "CRITICAL") {
    response.healed = false;
    response.patch = undefined;
  }

  // Persistir en log de sesión
  healingLog.unshift({ ...req, ...response });
  if (healingLog.length > 100) healingLog.pop(); // Máximo 100 entradas

  console.info(
    `[SelfHeal] ${response.healed ? "✅ REPARADO" : "⚠️ NO REPARADO"} ` +
    `[${response.severity}] ${req.module}::${req.operation} via ${provider}`
  );

  return response;
};
