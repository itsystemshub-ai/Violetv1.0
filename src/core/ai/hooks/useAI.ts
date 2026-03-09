import { useState, useCallback } from "react";
import { Invoice } from "@/lib/index";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Store para configuración de IA
 */
interface AIConfigStore {
  apiKey: string;
  enabled: boolean;
  setApiKey: (key: string) => void;
  setEnabled: (enabled: boolean) => void;
}

const useAIConfigStore = create<AIConfigStore>()(
  persist(
    (set) => ({
      apiKey: "",
      enabled: true,
      setApiKey: (apiKey) => {
        // Cifrar la API key antes de guardarla
        const encryptedKey = apiKey ? encrypt(apiKey) : "";
        set({ apiKey: encryptedKey });
      },
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: "violet-ai-config",
    }
  )
);

/**
 * Hook de integración con Violet ERP AI
 * Utiliza la API de Groq (Llama 3 / Mixtral) para procesamiento de lenguaje natural
 * y lógica de extracción de datos (OCR) y análisis de negocio.
 */
export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiKey, enabled, setApiKey, setEnabled } = useAIConfigStore();

  // Nota: Usando proxy local para evitar problemas de CORS
  const GROQ_PROXY_URL = import.meta.env.VITE_GROQ_PROXY_URL || "http://localhost:3001/api/groq/chat";
  // Descifrar la API key al usarla
  const API_KEY = apiKey ? decrypt(apiKey) : (import.meta.env.VITE_GROQ_API_KEY || "");

  const updateAIConfig = useCallback((config: { apiKey?: string; enabled?: boolean }) => {
    if (config.apiKey !== undefined) setApiKey(config.apiKey);
    if (config.enabled !== undefined) setEnabled(config.enabled);
  }, [setApiKey, setEnabled]);

  // Devolver la API key descifrada para mostrar en la UI
  const aiConfig = { 
    apiKey: apiKey ? decrypt(apiKey) : "", 
    enabled 
  };

  const queryGroq = useCallback(async (messages: { role: string; content: string }[], temperature = 0.2, retries = 3) => {
    setIsLoading(true);
    setError(null);

    if (!API_KEY) {
      setIsLoading(false);
      setError("API Key de Groq no configurada. Por favor, ve a Configuración > IA y guarda tu API key.");
      return null;
    }

    if (!navigator.onLine) {
      setIsLoading(false);
      setError("No tienes conexión a internet. La IA de Violet requiere internet para procesar consultas complejas. Las funciones básicas del ERP siguen disponibles offline.");
      return null;
    }

    let lastError: Error | null = null;

    // Retry logic con backoff exponencial
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`[Violet AI] Intento ${attempt + 1}/${retries} - Enviando petición al proxy...`, {
          proxyUrl: GROQ_PROXY_URL,
          messagesCount: messages.length,
          hasApiKey: !!API_KEY,
        });

        const response = await fetch(GROQ_PROXY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: API_KEY,
            messages,
            temperature,
            max_tokens: 1024,
          }),
        });

        console.log('[Violet AI] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          attempt: attempt + 1,
        });

        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`;
          try {
            const errData = await response.json();
            errorMessage = errData.error?.message || errorMessage;
            console.error('[Violet AI] Error de API:', errData);
            
            // Si es rate limit (429), no reintentar
            if (response.status === 429) {
              throw new Error(`⏱️ Límite de consultas alcanzado. ${errorMessage}`);
            }
          } catch {
            console.error('[Violet AI] No se pudo parsear el error');
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('[Violet AI] Respuesta exitosa:', {
          hasContent: !!data.choices?.[0]?.message?.content,
          contentLength: data.choices?.[0]?.message?.content?.length,
          attempt: attempt + 1,
        });
        
        setIsLoading(false);
        return data.choices[0].message.content;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[Violet AI] Error en intento ${attempt + 1}:`, lastError);
        
        // Si es el último intento, lanzar el error
        if (attempt === retries - 1) {
          break;
        }
        
        // Backoff exponencial: esperar 1s, 2s, 4s...
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[Violet AI] Reintentando en ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.error('[Violet AI] Todos los intentos fallaron:', lastError);
    
    let message = "Error desconocido en el motor de IA";
    
    if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
      message = "⚠️ El servidor proxy no está corriendo.\n\n" +
                "Para iniciar el sistema completo:\n" +
                "1. Cierra la aplicación\n" +
                "2. Ejecuta: VIOLET_ERP.bat > Opción 1\n" +
                "3. O ejecuta: npm run dev:full\n\n" +
                "El proxy debe estar en el puerto 3001.";
    } else if (lastError instanceof Error) {
      message = lastError.message;
    }
    
    setError(message);
    setIsLoading(false);
    return null;
  }, [API_KEY, GROQ_PROXY_URL]);

  /**
   * Analista de Datos: Traduce lenguaje natural a explicaciones de negocio.
   */
  const analyzeNaturalLanguage = useCallback(async (query: string, dataContext?: string) => {
    const systemPrompt = `
      Eres el Analista de Datos de Violet ERP AI.
      Tu objetivo es ayudar al usuario a entender sus métricas de ERP.
      Contexto del Sistema: ${dataContext || "Métricas generales de ventas, inventario y finanzas."}
      Responde de forma ejecutiva, profesional y siempre en español.
      Si la pregunta es sobre ventas, destaca tendencias. Si es sobre gastos, sugiere ahorros.
    `;

    return await queryGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ]);
  }, [queryGroq]);

  /**
   * Procesamiento de Facturas (Simulación de OCR + Estructuración IA).
   * En un flujo real, se usaría Tesseract.js primero para extraer texto y luego este método para estructurar.
   */
  const processInvoiceOCR = useCallback(async (extractedText: string): Promise<Partial<Invoice> | null> => {
    const systemPrompt = `
      Actúa como un extractor de datos contables de alta precisión.
      Recibirás un texto extraído por OCR de una factura física.
      Debes devolver exclusivamente un objeto JSON (sin texto adicional) con esta estructura:
      {
        "number": "string",
        "customerName": "string",
        "total": number,
        "taxTotal": number,
        "date": "YYYY-MM-DD"
      }
      Texto extraído: ${extractedText}
    `;

    const result = await queryGroq([
      { role: "system", content: "Eres un parser de JSON financiero. Solo respondes con JSON válido." },
      { role: "user", content: systemPrompt },
    ], 0.1);

    if (result) {
      try {
        // Limpiar posibles bloques de código markdown
        const cleanJson = result.replace(/|/g, "").trim();
        return JSON.parse(cleanJson);
      } catch {
        setError("Error al formatear los datos de la factura extraída.");
        return null;
      }
    }
    return null;
  }, [queryGroq]);

  /**
   * Categorización Automática de Movimientos.
   */
  const categorizeTransaction = useCallback(async (description: string) => {
    const systemPrompt = `
      Categoriza el siguiente gasto/ingreso para un plan de cuentas estándar.
      Devuelve solo el nombre de la categoría (ej: 'Servicios Públicos', 'Venta de Mercancía', 'Mantenimiento').
    `;

    return await queryGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: description },
    ]);
  }, [queryGroq]);

  /**
   * Chat General de Asistencia Violet ERP AI.
   */
  const askViolet = useCallback(async (prompt: string, context?: string) => {
    const systemInstruction = `Eres Violet ERP AI, el asistente inteligente integrado en el ERP. Ayudas a los usuarios con dudas sobre el uso del sistema, contabilidad y gestión empresarial. Eres amable, eficiente y hablas español.
    ${context ? `Aquí tienes información actual del ERP sobre la cual puedes basar tu respuesta si el usuario pregunta algo relacionado: ${context}` : ""}`;
    
    return await queryGroq([
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ]);
  }, [queryGroq]);

  /**
   * Extracción de Pedido desde Lenguaje Natural (WhatsApp/Email).
   */
  const extractOrderFromText = useCallback(async (text: string) => {
    const systemPrompt = `
      Actúa como un receptor de pedidos de alta velocidad.
      Recibirás un mensaje de WhatsApp o correo de un cliente solicitando productos.
      Extrae los productos, cantidades y el nombre del cliente.
      Debes devolver exclusivamente un objeto JSON (sin texto adicional) con esta estructura:
      {
        "customerName": "string",
        "items": [
          { "productName": "string", "quantity": number, "price": number }
        ],
        "total": number,
        "notes": "string"
      }
      Si no hay precio especificado en el texto, usa 0.
      Mensaje: ${text}
    `;

    const result = await queryGroq([
      { role: "system", content: "Eres un parser de pedidos comerciales. Solo respondes con JSON válido." },
      { role: "user", content: systemPrompt },
    ], 0.1);

    if (result) {
      try {
        const cleanJson = result.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(cleanJson);
      } catch {
        setError("Error al procesar el texto del pedido.");
        return null;
      }
    }
    return null;
  }, [queryGroq]);

  return {
    isLoading,
    error,
    askViolet,
    analyzeNaturalLanguage,
    processInvoiceOCR,
    categorizeTransaction,
    extractOrderFromText,
    /**
     * Analista de Seguridad IA: Escanea logs en busca de anomalías.
     */
    analyzeSecurityLogs: useCallback(async (logs: unknown[]) => {
      const logsString = JSON.stringify(logs.slice(0, 15)); // Analizar últimos 15 logs
      const systemPrompt = `
        Eres el Experto en Ciberseguridad de Violet ERP AI.
        Analiza los siguientes logs de auditoría técnica en busca de:
        1. Patrones de acceso sospechosos.
        2. Eliminaciones de datos a gran escala.
        3. Cambios críticos de configuración fuera de horario.
        
        Responde con un diagnóstico rápido de integridad y sugerencias de endurecimiento (hardening) si es necesario.
        Responde siempre en español y mantén un tono profesional.
        Logs para analizar: ${logsString}
      `;

      return await queryGroq([
        { role: "system", content: systemPrompt },
        { role: "user", content: "Realiza una auditoría de seguridad preventiva basada en estos logs." },
      ]);
    }, [queryGroq]),
    // Configuración de IA
    aiConfig,
    updateAIConfig,
  };
};
