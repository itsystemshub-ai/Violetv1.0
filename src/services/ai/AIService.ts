/**
 * AIService - Servicio de IA integrado unificado
 * 
 * Integración: Groq API (Llama 3 / Mixtral) + Skills instaladas
 * 
 * Arquitectura: Service Pattern
 * Skills aplicadas:
 * - architecture-patterns: Service Layer Pattern
 * - typescript-advanced-types: Type-safe API
 * - systematic-debugging: Error handling robusto
 * - code-review-excellence: Análisis de código
 * - supabase-postgres-best-practices: Optimización de queries
 * 
 * Funcionalidades:
 * - Chat con IA (Groq)
 * - Análisis de datos
 * - Sugerencias inteligentes basadas en skills
 * - Automatización de tareas
 * - Revisión de código
 * - Optimización de queries
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/lib/encryption';

// Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  context?: string;
}

export interface AIConfig {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  proxyUrl?: string;
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'automation' | 'suggestion' | 'chat';
  enabled: boolean;
}

// AI Store
interface AIStore {
  // State
  conversations: AIConversation[];
  activeConversationId: string | null;
  config: AIConfig;
  capabilities: AICapability[];
  isProcessing: boolean;
  error: string | null;

  // Actions
  createConversation: (title: string, context?: string) => string;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  updateConfig: (config: Partial<AIConfig>) => void;
  toggleCapability: (capabilityId: string) => void;
  clearError: () => void;
  getDecryptedApiKey: () => string;
}

// Default capabilities based on installed skills
const DEFAULT_CAPABILITIES: AICapability[] = [
  {
    id: 'code-review',
    name: 'Revisión de Código',
    description: 'Analiza código y sugiere mejoras usando code-review-excellence',
    category: 'analysis',
    enabled: true,
  },
  {
    id: 'architecture-analysis',
    name: 'Análisis de Arquitectura',
    description: 'Evalúa patrones arquitectónicos usando architecture-patterns',
    category: 'analysis',
    enabled: true,
  },
  {
    id: 'ui-suggestions',
    name: 'Sugerencias de UI/UX',
    description: 'Mejora diseño usando web-design-guidelines y tailwind-design-system',
    category: 'suggestion',
    enabled: true,
  },
  {
    id: 'test-generation',
    name: 'Generación de Tests',
    description: 'Crea tests usando test-driven-development y webapp-testing',
    category: 'automation',
    enabled: true,
  },
  {
    id: 'db-optimization',
    name: 'Optimización de BD',
    description: 'Optimiza queries usando supabase-postgres-best-practices',
    category: 'suggestion',
    enabled: true,
  },
  {
    id: 'react-optimization',
    name: 'Optimización React',
    description: 'Mejora componentes usando vercel-react-best-practices',
    category: 'suggestion',
    enabled: true,
  },
  {
    id: 'typescript-help',
    name: 'Ayuda TypeScript',
    description: 'Asistencia con tipos usando typescript-advanced-types',
    category: 'suggestion',
    enabled: true,
  },
  {
    id: 'debugging-assistant',
    name: 'Asistente de Debugging',
    description: 'Ayuda a resolver bugs usando systematic-debugging',
    category: 'analysis',
    enabled: true,
  },
];

// Default config
const DEFAULT_CONFIG: AIConfig = {
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  maxTokens: 2000,
  enabled: true,
  proxyUrl: import.meta.env.VITE_GROQ_PROXY_URL || 'http://localhost:3001/api/groq/chat',
};

// Create AI Store
export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      activeConversationId: null,
      config: DEFAULT_CONFIG,
      capabilities: DEFAULT_CAPABILITIES,
      isProcessing: false,
      error: null,

      // Create new conversation
      createConversation: (title: string, context?: string) => {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const conversation: AIConversation = {
          id,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          context,
        };

        set((state) => ({
          conversations: [...state.conversations, conversation],
          activeConversationId: id,
        }));

        return id;
      },

      // Add message to conversation
      addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullMessage: AIMessage = {
          ...message,
          id: messageId,
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, fullMessage],
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      // Send message and get AI response
      sendMessage: async (conversationId: string, content: string) => {
        const { config, capabilities, addMessage } = get();

        if (!config.enabled) {
          set({ error: 'IA está deshabilitada. Actívala en configuración.' });
          return;
        }

        // Verificar API key
        const apiKey = config.apiKey ? decrypt(config.apiKey) : import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
          set({ error: 'API Key de Groq no configurada. Por favor, ve a Configuración > IA y guarda tu API key.' });
          return;
        }

        // Verificar conexión
        if (!navigator.onLine) {
          set({ error: 'No tienes conexión a internet. La IA requiere internet para funcionar.' });
          return;
        }

        try {
          set({ isProcessing: true, error: null });

          // Add user message
          addMessage(conversationId, {
            role: 'user',
            content,
          });

          // Get conversation context
          const conversation = get().conversations.find((c) => c.id === conversationId);
          if (!conversation) {
            throw new Error('Conversación no encontrada');
          }

          // Build context with enabled capabilities
          const enabledCapabilities = capabilities.filter((c) => c.enabled);
          const systemContext = `
Eres Violet AI, el asistente inteligente integrado en Violet ERP.

Tienes acceso a las siguientes capacidades basadas en 21 skills instaladas:

${enabledCapabilities.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Contexto de la conversación: ${conversation.context || 'General'}

Instrucciones:
- Responde siempre en español
- Sé profesional pero amigable
- Proporciona respuestas precisas basadas en las skills
- Si no estás seguro, indícalo claramente
- Sugiere mejores prácticas cuando sea relevante
          `.trim();

          // Prepare messages for Groq
          const messages = [
            { role: 'system', content: systemContext },
            ...conversation.messages.slice(-10).map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            }))
          ];

          // Call Groq API through proxy
          const response = await fetch(config.proxyUrl || DEFAULT_CONFIG.proxyUrl!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiKey,
              messages,
              temperature: config.temperature,
              max_tokens: config.maxTokens,
              model: config.model,
            }),
          });

          if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
              const errData = await response.json();
              errorMessage = errData.error?.message || errorMessage;
              
              if (response.status === 429) {
                throw new Error(`⏱️ Límite de consultas alcanzado. ${errorMessage}`);
              }
            } catch {
              // Error parsing error response
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Add AI response
          addMessage(conversationId, {
            role: 'assistant',
            content: aiResponse,
          });

          set({ isProcessing: false });
        } catch (error) {
          console.error('[AIService] Error sending message:', error);
          
          let errorMessage = 'Error al procesar mensaje';
          
          if (error instanceof TypeError && error.message.includes('fetch')) {
            errorMessage = '⚠️ El servidor proxy no está corriendo.\n\n' +
                          'Para iniciar el sistema completo:\n' +
                          '1. Cierra la aplicación\n' +
                          '2. Ejecuta: npm run dev:full\n\n' +
                          'El proxy debe estar en el puerto 3001.';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          set({
            isProcessing: false,
            error: errorMessage,
          });
        }
      },

      // Delete conversation
      deleteConversation: (conversationId: string) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== conversationId),
          activeConversationId:
            state.activeConversationId === conversationId ? null : state.activeConversationId,
        }));
      },

      // Set active conversation
      setActiveConversation: (conversationId: string | null) => {
        set({ activeConversationId: conversationId });
      },

      // Update config
      updateConfig: (newConfig: Partial<AIConfig>) => {
        set((state) => {
          const updatedConfig = { ...state.config };
          
          // Si se actualiza la API key, cifrarla
          if (newConfig.apiKey !== undefined) {
            updatedConfig.apiKey = newConfig.apiKey ? encrypt(newConfig.apiKey) : '';
          }
          
          // Actualizar otros campos
          if (newConfig.model !== undefined) updatedConfig.model = newConfig.model;
          if (newConfig.temperature !== undefined) updatedConfig.temperature = newConfig.temperature;
          if (newConfig.maxTokens !== undefined) updatedConfig.maxTokens = newConfig.maxTokens;
          if (newConfig.enabled !== undefined) updatedConfig.enabled = newConfig.enabled;
          if (newConfig.proxyUrl !== undefined) updatedConfig.proxyUrl = newConfig.proxyUrl;
          
          return { config: updatedConfig };
        });
      },

      // Toggle capability
      toggleCapability: (capabilityId: string) => {
        set((state) => ({
          capabilities: state.capabilities.map((c) =>
            c.id === capabilityId ? { ...c, enabled: !c.enabled } : c
          ),
        }));
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Get decrypted API key for display
      getDecryptedApiKey: () => {
        const { config } = get();
        return config.apiKey ? decrypt(config.apiKey) : '';
      },
    }),
    {
      name: 'violet-ai-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        config: state.config,
        capabilities: state.capabilities,
      }),
    }
  )
);

/**
 * AI Service singleton with Groq integration
 */
export class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Query Groq API
   */
  private async queryGroq(messages: { role: string; content: string }[], temperature = 0.2): Promise<string | null> {
    const store = useAIStore.getState();
    const { config } = store;
    
    const apiKey = config.apiKey ? decrypt(config.apiKey) : import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('API Key de Groq no configurada');
    }

    if (!navigator.onLine) {
      throw new Error('No tienes conexión a internet');
    }

    try {
      const response = await fetch(config.proxyUrl || DEFAULT_CONFIG.proxyUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          messages,
          temperature,
          max_tokens: config.maxTokens,
          model: config.model,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIService] Error querying Groq:', error);
      throw error;
    }
  }

  /**
   * Analyze code with AI using code-review-excellence skill
   */
  async analyzeCode(code: string, language: string): Promise<string> {
    const systemPrompt = `
Eres un experto en revisión de código con acceso a la skill "code-review-excellence".

Analiza el siguiente código ${language} y proporciona:
1. Problemas de calidad y bugs potenciales
2. Mejoras de rendimiento
3. Mejores prácticas no aplicadas
4. Sugerencias de refactoring

Código a analizar:
\`\`\`${language}
${code}
\`\`\`

Responde en español de forma estructurada y profesional.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analiza este código y dame un reporte detallado.' },
    ]);

    return response || 'No se pudo analizar el código';
  }

  /**
   * Get UI/UX suggestions using web-design-guidelines and tailwind-design-system skills
   */
  async getUIUXSuggestions(componentName: string, description: string): Promise<string> {
    const systemPrompt = `
Eres un experto en UI/UX con acceso a las skills:
- web-design-guidelines: Principios de diseño profesional
- tailwind-design-system: Sistema de diseño con Tailwind
- shadcn-ui: Componentes shadcn/ui

Proporciona sugerencias para mejorar el componente "${componentName}".

Descripción: ${description}

Incluye:
1. Mejoras de accesibilidad (WCAG AA)
2. Optimizaciones de diseño
3. Mejores prácticas de Tailwind
4. Sugerencias de componentes shadcn/ui

Responde en español con ejemplos de código cuando sea relevante.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Dame sugerencias detalladas de UI/UX.' },
    ]);

    return response || 'No se pudieron generar sugerencias';
  }

  /**
   * Optimize database query using supabase-postgres-best-practices skill
   */
  async optimizeQuery(query: string): Promise<string> {
    const systemPrompt = `
Eres un experto en optimización de PostgreSQL con acceso a la skill "supabase-postgres-best-practices".

Analiza y optimiza la siguiente query SQL:

\`\`\`sql
${query}
\`\`\`

Proporciona:
1. Análisis de performance
2. Query optimizada
3. Índices recomendados
4. Explicación de las mejoras

Responde en español con ejemplos de código SQL.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Optimiza esta query y explica las mejoras.' },
    ], 0.1);

    return response || 'No se pudo optimizar la query';
  }

  /**
   * Generate tests using test-driven-development and webapp-testing skills
   */
  async generateTests(code: string, language: string): Promise<string> {
    const systemPrompt = `
Eres un experto en testing con acceso a las skills:
- test-driven-development: Metodología TDD
- webapp-testing: Tests end-to-end con Playwright

Genera tests para el siguiente código ${language}:

\`\`\`${language}
${code}
\`\`\`

Incluye:
1. Tests unitarios
2. Tests de integración (si aplica)
3. Edge cases y boundary values
4. Mocks necesarios

Responde en español con código de tests completo y ejecutable.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Genera tests completos para este código.' },
    ]);

    return response || 'No se pudieron generar tests';
  }

  /**
   * Analyze architecture using architecture-patterns skill
   */
  async analyzeArchitecture(description: string): Promise<string> {
    const systemPrompt = `
Eres un arquitecto de software experto con acceso a la skill "architecture-patterns".

Analiza la siguiente arquitectura o patrón:

${description}

Proporciona:
1. Evaluación del patrón actual
2. Patrones alternativos recomendados
3. Trade-offs y consideraciones
4. Mejores prácticas

Responde en español de forma estructurada.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analiza esta arquitectura y dame recomendaciones.' },
    ]);

    return response || 'No se pudo analizar la arquitectura';
  }

  /**
   * Debug assistance using systematic-debugging skill
   */
  async debugAssistance(error: string, context: string): Promise<string> {
    const systemPrompt = `
Eres un experto en debugging con acceso a la skill "systematic-debugging".

Error reportado:
${error}

Contexto:
${context}

Proporciona:
1. Análisis del error
2. Posibles causas raíz
3. Pasos para reproducir
4. Soluciones propuestas
5. Prevención futura

Responde en español de forma sistemática y estructurada.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Ayúdame a resolver este bug de forma sistemática.' },
    ]);

    return response || 'No se pudo analizar el error';
  }

  /**
   * TypeScript help using typescript-advanced-types skill
   */
  async typescriptHelp(code: string, question: string): Promise<string> {
    const systemPrompt = `
Eres un experto en TypeScript con acceso a la skill "typescript-advanced-types".

Código TypeScript:
\`\`\`typescript
${code}
\`\`\`

Pregunta: ${question}

Proporciona:
1. Explicación detallada
2. Tipos mejorados si aplica
3. Mejores prácticas de TypeScript
4. Ejemplos de código

Responde en español con ejemplos de código TypeScript.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Ayúdame con este código TypeScript.' },
    ]);

    return response || 'No se pudo proporcionar ayuda';
  }

  /**
   * React optimization using vercel-react-best-practices skill
   */
  async optimizeReact(code: string): Promise<string> {
    const systemPrompt = `
Eres un experto en React con acceso a la skill "vercel-react-best-practices".

Componente React:
\`\`\`tsx
${code}
\`\`\`

Proporciona:
1. Análisis de performance
2. Optimizaciones recomendadas
3. Mejores prácticas de React
4. Código optimizado

Responde en español con código React mejorado.
    `.trim();

    const response = await this.queryGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Optimiza este componente React.' },
    ]);

    return response || 'No se pudo optimizar el componente';
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
