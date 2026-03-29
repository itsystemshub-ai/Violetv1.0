/**
 * groqService.ts
 * Asistente IA usando Groq (Llama 3) — ultra rápido.
 * Gratis: 14,400 requests/día.
 * Requiere: VITE_GROQ_API_KEY en .env
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `
Eres el asistente IA de Cauplas ERP, un sistema de gestión empresarial venezolano.
Tienes conocimiento sobre:
- Inventario de mangueras y productos hidráulicos (Torflex, Indomax, OEM)
- Ventas en el mercado venezolano (BsS, USD, IVA 16%, IGTF 3%)
- Gestión de clientes y vendedores
- Finanzas venezolanas (tasa BCV, tasas de cambio)
- Módulos: Inventario, Ventas, Compras, RRHH, Finanzas, Configuración

Responde siempre en español. Sé conciso, preciso y útil.
`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const askGroqAI = async (
  prompt: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return "⚠️ API de IA no configurada. Agrega VITE_GROQ_API_KEY a tu archivo .env";
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "Sin respuesta del modelo.";
  } catch (err) {
    console.error("[groqService] Error:", err);
    return "Error al conectar con el asistente IA.";
  }
};
