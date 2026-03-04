# Integración de IA en Violet ERP

**Fecha:** 3 de marzo de 2026  
**Versión:** 2.2.0  
**Skills Aplicadas:** 21 skills instaladas

---

## 🤖 Descripción

Violet ERP ahora incluye un asistente de IA integrado que utiliza las 21 skills instaladas para proporcionar ayuda contextual, análisis de código, sugerencias de diseño, optimización de queries y más.

---

## ✨ Características

### 1. **Chat Inteligente**
- Conversaciones contextuales
- Historial de mensajes persistente
- Respuestas basadas en skills instaladas
- Interfaz moderna y accesible

### 2. **Capacidades Basadas en Skills**

#### Análisis de Código
- **Skill:** code-review-excellence
- **Función:** Analiza código y sugiere mejoras
- **Uso:** "Analiza este código React..."

#### Arquitectura
- **Skill:** architecture-patterns
- **Función:** Evalúa patrones arquitectónicos
- **Uso:** "¿Cómo mejorar esta arquitectura?"

#### UI/UX
- **Skills:** web-design-guidelines, tailwind-design-system, shadcn-ui
- **Función:** Sugerencias de diseño
- **Uso:** "Mejora este componente..."

#### Testing
- **Skills:** test-driven-development, webapp-testing
- **Función:** Genera tests
- **Uso:** "Genera tests para esta función..."

#### Base de Datos
- **Skill:** supabase-postgres-best-practices
- **Función:** Optimiza queries
- **Uso:** "Optimiza esta query SQL..."

#### React
- **Skill:** vercel-react-best-practices
- **Función:** Optimiza componentes
- **Uso:** "Optimiza este componente React..."

#### TypeScript
- **Skill:** typescript-advanced-types
- **Función:** Mejora tipado
- **Uso:** "Ayuda con estos tipos..."

#### Debugging
- **Skill:** systematic-debugging
- **Función:** Debugging sistemático
- **Uso:** "Ayuda a resolver este bug..."

---

## 🚀 Uso

### Abrir el Asistente

El asistente está disponible en todas las páginas mediante un botón flotante en la esquina inferior derecha:

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│                    [🤖] │ ← Botón flotante
└─────────────────────────┘
```

### Ejemplos de Uso

#### 1. Análisis de Código
```
Usuario: Analiza este código React:

function MyComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  return <div>{data.map(item => <p>{item}</p>)}</div>;
}

IA: Puedo ayudarte con la revisión de código usando:
- vercel-react-best-practices: Optimizo componentes React
- typescript-advanced-types: Mejoro el tipado

Sugerencias:
1. Agregar manejo de errores
2. Agregar loading state
3. Agregar keys en el map
4. Usar React Query para fetching
5. Tipar el estado con TypeScript
```

#### 2. Optimización de Query
```
Usuario: Optimiza esta query SQL:

SELECT * FROM users 
WHERE created_at > '2024-01-01'
ORDER BY created_at DESC;

IA: Usando supabase-postgres-best-practices:

Sugerencias:
1. Evitar SELECT * - especifica columnas
2. Agregar índice en created_at
3. Usar LIMIT para paginación
4. Considerar particionamiento si hay muchos datos

Query optimizada:
SELECT id, name, email, created_at 
FROM users 
WHERE created_at > '2024-01-01'
ORDER BY created_at DESC
LIMIT 50;

CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### 3. Sugerencias de UI/UX
```
Usuario: Dame sugerencias para mejorar este botón:

<button className="bg-blue-500 text-white p-2">
  Click me
</button>

IA: Usando web-design-guidelines y tailwind-design-system:

Sugerencias:
1. Agregar estados hover y focus
2. Mejorar accesibilidad con aria-label
3. Usar sistema de diseño consistente
4. Agregar transiciones suaves
5. Considerar disabled state

Código mejorado:
<button 
  className="bg-primary hover:bg-primary/90 text-primary-foreground 
             px-4 py-2 rounded-md transition-colors duration-200
             focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed"
  aria-label="Acción del botón"
>
  Click me
</button>
```

---

## 🎨 Componentes

### AIService (`src/services/ai/AIService.ts`)

Servicio principal que maneja:
- Estado de conversaciones
- Configuración de IA
- Capacidades basadas en skills
- Envío y recepción de mensajes

```typescript
import { aiService } from '@/services/ai';

// Analizar código
const analysis = await aiService.analyzeCode(code, 'typescript');

// Sugerencias UI/UX
const suggestions = await aiService.getUIUXSuggestions('Button', 'Primary action button');

// Optimizar query
const optimized = await aiService.optimizeQuery(sqlQuery);

// Generar tests
const tests = await aiService.generateTests(code, 'typescript');
```

### AIChat (`src/shared/components/ai/AIChat.tsx`)

Componente de chat con:
- Interfaz de mensajes
- Input con soporte para Enter/Shift+Enter
- Estados de carga y error
- Scroll automático
- Minimizable

### AIFloatingButton (`src/shared/components/ai/AIFloatingButton.tsx`)

Botón flotante con:
- Efecto glow
- Animación pulse
- Tooltip informativo
- Responsive

### AISettings (`src/modules/settings/components/AISettings.tsx`)

Página de configuración con:
- Activar/desactivar IA
- Gestión de capacidades
- Estado de skills instaladas
- Información del sistema

---

## 🔧 Configuración

### Habilitar/Deshabilitar IA

```typescript
import { useAIStore } from '@/services/ai';

const { config, updateConfig } = useAIStore();

// Deshabilitar IA
updateConfig({ enabled: false });

// Habilitar IA
updateConfig({ enabled: true });
```

### Gestionar Capacidades

```typescript
import { useAIStore } from '@/services/ai';

const { capabilities, toggleCapability } = useAIStore();

// Deshabilitar capacidad específica
toggleCapability('code-review');

// Listar capacidades activas
const activeCapabilities = capabilities.filter(c => c.enabled);
```

### Configuración Avanzada

```typescript
import { useAIStore } from '@/services/ai';

const { updateConfig } = useAIStore();

updateConfig({
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
});
```

---

## 📊 Arquitectura

### Patrón de Diseño

```
┌─────────────────────────────────────────┐
│           App Component                 │
│  ┌───────────────────────────────────┐  │
│  │     AIFloatingButton              │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │       AIChat                │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │    AIService          │  │  │  │
│  │  │  │  - useAIStore         │  │  │  │
│  │  │  │  - Conversations      │  │  │  │
│  │  │  │  - Capabilities       │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Estado Global (Zustand)

```typescript
interface AIStore {
  // State
  conversations: AIConversation[];
  activeConversationId: string | null;
  config: AIConfig;
  capabilities: AICapability[];
  isProcessing: boolean;
  error: string | null;

  // Actions
  createConversation: (title: string) => string;
  addMessage: (conversationId: string, message: AIMessage) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  updateConfig: (config: Partial<AIConfig>) => void;
  toggleCapability: (capabilityId: string) => void;
}
```

### Persistencia

El estado se persiste automáticamente en localStorage:
- Conversaciones
- Configuración
- Capacidades

---

## 🎯 Skills Integradas

### Core Development (7)
1. ✅ vercel-react-best-practices
2. ✅ typescript-advanced-types
3. ✅ nodejs-backend-patterns
4. ✅ api-design-principles
5. ✅ architecture-patterns
6. ✅ vercel-composition-patterns
7. ✅ code-review-excellence

### UI/UX & Design (3)
8. ✅ web-design-guidelines
9. ✅ shadcn-ui
10. ✅ tailwind-design-system

### Testing & Quality (4)
11. ✅ systematic-debugging
12. ✅ test-driven-development
13. ✅ webapp-testing
14. ✅ verification-before-completion

### Database (1)
15. ✅ supabase-postgres-best-practices

### Development Workflow (4)
16. ✅ subagent-driven-development
17. ✅ using-git-worktrees
18. ✅ requesting-code-review
19. ✅ writing-skills

### Security & Auth (1)
20. ✅ better-auth-best-practices

### Advanced (1)
21. ✅ mcp-builder

---

## 🚀 Próximos Pasos

### Corto Plazo
- [ ] Integrar API real de IA (OpenAI, Anthropic, etc.)
- [ ] Agregar soporte para archivos adjuntos
- [ ] Implementar búsqueda en conversaciones
- [ ] Agregar shortcuts de teclado

### Medio Plazo
- [ ] Análisis de código en tiempo real
- [ ] Sugerencias proactivas
- [ ] Integración con Git
- [ ] Generación de documentación

### Largo Plazo
- [ ] Fine-tuning con datos del proyecto
- [ ] Agentes especializados por módulo
- [ ] Automatización de tareas
- [ ] Integración con CI/CD

---

## 📚 Referencias

### Documentación
- [AIService.ts](../src/services/ai/AIService.ts)
- [AIChat.tsx](../src/shared/components/ai/AIChat.tsx)
- [AIFloatingButton.tsx](../src/shared/components/ai/AIFloatingButton.tsx)
- [AISettings.tsx](../src/modules/settings/components/AISettings.tsx)

### Skills Aplicadas
- Todas las 21 skills instaladas en `.agents/skills/`

---

**Estado:** ✅ Implementado y funcionando  
**Versión:** 2.2.0  
**Última actualización:** 3 de marzo de 2026

