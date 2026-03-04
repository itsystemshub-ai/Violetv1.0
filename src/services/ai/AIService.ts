/**
 * AIService - Servicio de IA integrado en el sistema
 * 
 * Arquitectura: Service Pattern
 * Skills aplicadas:
 * - architecture-patterns: Service Layer Pattern
 * - typescript-advanced-types: Type-safe API
 * - systematic-debugging: Error handling robusto
 * 
 * Funcionalidades:
 * - Chat con IA
 * - Análisis de datos
 * - Sugerencias inteligentes
 * - Automatización de tareas
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  enabled: true,
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
Eres un asistente de IA integrado en Violet ERP con las siguientes capacidades:

${enabledCapabilities.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Contexto de la conversación: ${conversation.context || 'General'}

Usa las skills instaladas para proporcionar respuestas precisas y útiles.
          `.trim();

          // Simulate AI response (replace with actual API call)
          const response = await simulateAIResponse(content, systemContext, conversation.messages);

          // Add AI response
          addMessage(conversationId, {
            role: 'assistant',
            content: response,
          });

          set({ isProcessing: false });
        } catch (error) {
          console.error('[AIService] Error sending message:', error);
          set({
            isProcessing: false,
            error: error instanceof Error ? error.message : 'Error al procesar mensaje',
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
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
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
 * Simulate AI response (replace with actual API call)
 */
async function simulateAIResponse(
  userMessage: string,
  systemContext: string,
  conversationHistory: AIMessage[]
): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simple response logic based on keywords
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('código') || lowerMessage.includes('code')) {
    return `Puedo ayudarte con la revisión de código usando las skills instaladas:

- **code-review-excellence**: Analizo tu código y sugiero mejoras
- **vercel-react-best-practices**: Optimizo componentes React
- **typescript-advanced-types**: Mejoro el tipado TypeScript

¿Qué código necesitas revisar?`;
  }

  if (lowerMessage.includes('test') || lowerMessage.includes('prueba')) {
    return `Puedo ayudarte con testing usando:

- **test-driven-development**: Metodología TDD
- **webapp-testing**: Tests end-to-end con Playwright
- **systematic-debugging**: Debugging sistemático

¿Qué tipo de tests necesitas?`;
  }

  if (lowerMessage.includes('diseño') || lowerMessage.includes('ui') || lowerMessage.includes('ux')) {
    return `Puedo mejorar el diseño usando:

- **web-design-guidelines**: Principios de diseño profesional
- **tailwind-design-system**: Sistema de diseño con Tailwind
- **shadcn-ui**: Componentes shadcn/ui

¿Qué componente quieres mejorar?`;
  }

  if (lowerMessage.includes('base de datos') || lowerMessage.includes('query') || lowerMessage.includes('sql')) {
    return `Puedo optimizar tu base de datos usando:

- **supabase-postgres-best-practices**: 40+ guías de optimización
- Análisis de queries
- Sugerencias de índices
- Optimización de performance

¿Qué query necesitas optimizar?`;
  }

  if (lowerMessage.includes('arquitectura') || lowerMessage.includes('patrón')) {
    return `Puedo analizar la arquitectura usando:

- **architecture-patterns**: Patrones de arquitectura
- **vercel-composition-patterns**: Patrones de composición
- Clean Architecture
- SOLID principles

¿Qué aspecto de la arquitectura quieres revisar?`;
  }

  // Default response
  return `Hola! Soy el asistente de IA de Violet ERP con 21 skills instaladas.

Puedo ayudarte con:
- 📝 Revisión de código
- 🏗️ Análisis de arquitectura
- 🎨 Sugerencias de UI/UX
- 🧪 Generación de tests
- 💾 Optimización de base de datos
- ⚛️ Optimización de React
- 📘 Ayuda con TypeScript
- 🐛 Debugging sistemático

¿En qué puedo ayudarte?`;
}

/**
 * AI Service singleton
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
   * Analyze code with AI
   */
  async analyzeCode(code: string, language: string): Promise<string> {
    const store = useAIStore.getState();
    const conversationId = store.createConversation('Análisis de Código', `Language: ${language}`);
    await store.sendMessage(conversationId, `Analiza este código ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``);
    
    const conversation = store.conversations.find((c) => c.id === conversationId);
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    
    return lastMessage?.content || 'No se pudo analizar el código';
  }

  /**
   * Get UI/UX suggestions
   */
  async getUIUXSuggestions(componentName: string, description: string): Promise<string> {
    const store = useAIStore.getState();
    const conversationId = store.createConversation('Sugerencias UI/UX', `Component: ${componentName}`);
    await store.sendMessage(conversationId, `Dame sugerencias de UI/UX para: ${componentName}\n\nDescripción: ${description}`);
    
    const conversation = store.conversations.find((c) => c.id === conversationId);
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    
    return lastMessage?.content || 'No se pudieron generar sugerencias';
  }

  /**
   * Optimize database query
   */
  async optimizeQuery(query: string): Promise<string> {
    const store = useAIStore.getState();
    const conversationId = store.createConversation('Optimización de Query', 'Database: PostgreSQL');
    await store.sendMessage(conversationId, `Optimiza esta query SQL:\n\n\`\`\`sql\n${query}\n\`\`\``);
    
    const conversation = store.conversations.find((c) => c.id === conversationId);
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    
    return lastMessage?.content || 'No se pudo optimizar la query';
  }

  /**
   * Generate tests
   */
  async generateTests(code: string, language: string): Promise<string> {
    const store = useAIStore.getState();
    const conversationId = store.createConversation('Generación de Tests', `Language: ${language}`);
    await store.sendMessage(conversationId, `Genera tests para este código ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``);
    
    const conversation = store.conversations.find((c) => c.id === conversationId);
    const lastMessage = conversation?.messages[conversation.messages.length - 1];
    
    return lastMessage?.content || 'No se pudieron generar tests';
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
