# Módulo 07: INTEGRACIONES - Inteligencia Artificial Gratuita

## Descripción

Este módulo integra herramientas de inteligencia artificial gratuitas para potenciar las funcionalidades del ERP ZENITH. Incluye análisis de sentimiento, chatbots, predicción de ventas, clasificación automática y más.

## 🤖 Herramientas de IA Gratuitas Integradas

### Tabla de Herramientas Disponibles

| Herramienta | Tipo | Gratis | URL | Uso en ERP |
|-------------|------|--------|-----|------------|
| **Google Gemini** | Texto/Chat | ✅ 60 req/min | gemini.google.com | Chatbot ERP, predicciones |
| **Hugging Face** | ML Models | ✅ 30k req/mes | huggingface.co | Sentimiento, clasificación |
| **Ollama** | LLM Local | ✅ 100% gratis | ollama.ai | Modelos locales (Llama 3) |
| **Groq** | Inferencia | ✅ 30 req/min | groq.com | Inferencia rápida |
| **Cohere** | NLP | ✅ 100 req/min | cohere.ai | Embeddings, búsqueda |
| **AssemblyAI** | Audio→Texto | ✅ 3 hrs/mes | assemblyai.com | Transcripción de reuniones |
| **DeepL** | Traducción | ✅ 500k chars/mes | deepl.com | Traducción de documentos |

---

## 📊 Modelo de Datos (Prisma)

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE IA
// ─────────────────────────────────────────────────────────────────────────────

model AIConfig {
  id          String   @id @default(cuid())
  provider    AIProvider @unique // GEMINI, HUGGINGFACE, OLLAMA, GROQ, COHERE
  apiKey      String?  // Encriptada
  apiUrl      String?
  isActive    Boolean  @default(false)
  dailyLimit  Int      @default(100) // Límite diario de requests
  usageToday  Int      @default(0)
  lastReset   DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([provider])
}

// ─────────────────────────────────────────────────────────────────────────────
// LOG DE USO DE IA
// ─────────────────────────────────────────────────────────────────────────────

model AIUsageLog {
  id          String   @id @default(cuid())
  provider    AIProvider
  model       String?  // ej. gemini-pro, bert-base
  action      String   // SENTIMENT_ANALYSIS, CHAT, FORECAST, etc.
  input       String   // Prompt o entrada
  output      String?  // Respuesta de la IA
  tokens      Int?     // Tokens usados
  latency     Int?     // Milisegundos
  cost        Float?   // Costo (si aplica)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  module      String?  // Módulo que usó la IA (crm, ventas, etc.)
  entityId    String?  // ID de la entidad relacionada
  success     Boolean  @default(true)
  errorMessage String?
  createdAt   DateTime @default(now())

  @@index([provider])
  @@index([userId])
  @@index([module])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT ERP (Conversaciones)
// ─────────────────────────────────────────────────────────────────────────────

model ChatbotConversation {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  messages    ChatbotMessage[]
  context     Json?    // Contexto de la conversación
  module      String?  // Módulo desde donde se inició
  status      String   @default("ACTIVE") // ACTIVE, CLOSED
  startedAt   DateTime @default(now())
  closedAt    DateTime?

  @@index([userId])
  @@index([status])
}

model ChatbotMessage {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    ChatbotConversation @relation(fields: [conversationId], references: [id])
  role            String   // USER, ASSISTANT, SYSTEM
  content         String
  timestamp       DateTime @default(now())
  latency         Int?     // Milisegundos de respuesta

  @@index([conversationId])
  @@index([timestamp])
}

// ─────────────────────────────────────────────────────────────────────────────
// PREDICCIONES Y FORECASTS
// ─────────────────────────────────────────────────────────────────────────────

model AIPrediction {
  id          String   @id @default(cuid())
  type        PredictionType // VENTAS, INVENTARIO, COBROS, etc.
  entityId    String?  // productId, customerId, etc.
  entityType  String?
  inputData   Json     // Datos históricos usados
  prediction  Json     // Predicción generada
  confidence  Float?   // % de confianza (0-100)
  model       String?  // Modelo usado
  validFrom   DateTime
  validUntil  DateTime
  accuracy    Float?   // Precisión real (se actualiza después)
  createdAt   DateTime @default(now())

  @@index([type])
  @@index([entityId])
  @@index([validUntil])
}

enum AIProvider {
  GEMINI
  HUGGINGFACE
  OLLAMA
  GROQ
  COHERE
  ASSEMBLYAI
  DEEPL
}

enum PredictionType {
  VENTAS
  INVENTARIO
  COBROS
  DEMANDA
  TENDENCIA
}
```

---

## 📡 Endpoints de la API

### Controller de IA

```typescript
// apps/backend/src/modules/ia/ia.controller.ts

import { Controller, Get, Post, Body, Query, User } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { IAService } from './ia.service';

@Controller('ia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IAController {
  constructor(private iaService: IAService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CHATBOT ERP
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('chat')
  @RequirePermissions('ia:chat')
  async chat(@Body() dto: ChatDto, @User() user: any) {
    return this.iaService.chat(dto.message, user.id, dto.conversationId);
  }

  @Get('chat/conversations')
  @RequirePermissions('ia:chat')
  async getConversations(@User() user: any) {
    return this.iaService.getConversations(user.id);
  }

  @Delete('chat/conversations/:id')
  @RequirePermissions('ia:chat')
  async deleteConversation(@Param('id') id: string) {
    return this.iaService.deleteConversation(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS DE SENTIMIENTO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('sentiment')
  @RequirePermissions('ia:sentiment')
  async analyzeSentiment(@Body() dto: SentimentDto) {
    return this.iaService.analyzeSentiment(dto.text);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PREDICCIÓN DE VENTAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('forecast/ventas')
  @RequirePermissions('ia:forecast')
  async forecastVentas(
    @Body() dto: ForecastVentasDto,
    @User() user: any,
  ) {
    return this.iaService.forecastVentas(dto.productId, dto.months, user.id);
  }

  @Get('forecast/ventas')
  @RequirePermissions('ia:forecast')
  async getForecastVentas(@Query('productId') productId?: string) {
    return this.iaService.getForecastVentas(productId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CLASIFICACIÓN AUTOMÁTICA
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('classify/expense')
  @RequirePermissions('ia:classify')
  async classifyExpense(@Body() dto: ClassifyDto) {
    return this.iaService.classifyExpense(dto.description);
  }

  @Post('classify/product')
  @RequirePermissions('ia:classify')
  async classifyProduct(@Body() dto: ClassifyDto) {
    return this.iaService.classifyProduct(dto.description);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DETECCIÓN DE ANOMALÍAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('anomalies/detect')
  @RequirePermissions('ia:anomalies')
  async detectAnomalies(
    @Body() dto: DetectAnomaliesDto,
    @User() user: any,
  ) {
    return this.iaService.detectAnomalies(dto.module, dto.data, user.id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RESUMEN DE TEXTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('summarize')
  @RequirePermissions('ia:summarize')
  async summarize(@Body() dto: SummarizeDto) {
    return this.iaService.summarize(dto.text, dto.maxLength);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRANSCRIPCIÓN DE AUDIO
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('transcribe')
  @RequirePermissions('ia:transcribe')
  async transcribe(@Body() dto: TranscribeDto) {
    return this.iaService.transcribe(dto.audioUrl);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRADUCCIÓN
  // ───────────────────────────────────────────────────────────────────────────
  
  @Post('translate')
  @RequirePermissions('ia:translate')
  async translate(@Body() dto: TranslateDto) {
    return this.iaService.translate(dto.text, dto.sourceLang, dto.targetLang);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // USO Y ESTADÍSTICAS
  // ───────────────────────────────────────────────────────────────────────────
  
  @Get('usage')
  @RequirePermissions('ia:read')
  async getUsage(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.iaService.getUsage(new Date(from), new Date(to));
  }

  @Get('usage/stats')
  @RequirePermissions('ia:read')
  async getUsageStats() {
    return this.iaService.getUsageStats();
  }
}
```

---

## 🧩 Servicio de IA

### Integración con Múltiples Proveedores

```typescript
// apps/backend/src/modules/ia/ia.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider } from '@prisma/client';

@Injectable()
export class IAService {
  private geminiApiKey: string;
  private hfApiKey: string;
  private groqApiKey: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.geminiApiKey = this.config.get('GEMINI_API_KEY');
    this.hfApiKey = this.config.get('HF_TOKEN');
    this.groqApiKey = this.config.get('GROQ_API_KEY');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CHATBOT ERP (Con Gemini)
  // ───────────────────────────────────────────────────────────────────────────
  
  async chat(message: string, userId: string, conversationId?: string) {
    // 1. Verificar límite de uso
    await this.checkLimit(AIProvider.GEMINI, userId);

    // 2. Obtener o crear conversación
    let conversation = conversationId
      ? await this.prisma.chatbotConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { timestamp: 'desc' }, take: 10 } },
        })
      : null;

    if (!conversation) {
      conversation = await this.prisma.chatbotConversation.create({
        data: {
          userId,
          messages: { create: [] },
          context: {},
          status: 'ACTIVE',
        },
      });
    }

    // 3. Guardar mensaje del usuario
    await this.prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // 4. Obtener contexto del ERP
    const erpContext = await this.getERPContext(userId);

    // 5. Construir prompt
    const prompt = this.buildChatPrompt(message, erpContext, conversation.messages);

    // 6. Llamar a Gemini
    const startTime = Date.now();
    const response = await this.callGemini(prompt);
    const latency = Date.now() - startTime;

    // 7. Guardar respuesta
    await this.prisma.chatbotMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response,
        latency,
      },
    });

    // 8. Registrar uso
    await this.logUsage({
      provider: AIProvider.GEMINI,
      model: 'gemini-pro',
      action: 'CHAT',
      input: message,
      output: response,
      latency,
      userId,
      module: 'chatbot',
      success: true,
    });

    return {
      conversationId: conversation.id,
      message: response,
      latency,
    };
  }

  private async getERPContext(userId: string) {
    // Obtener datos relevantes del ERP para el contexto
    const [ventasHoy, stockBajo, tareasPendientes] = await Promise.all([
      this.prisma.sale.count({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.product.count({
        where: { stock: { lte: this.prisma.product.fields.minStock } },
      }),
      this.prisma.task.count({
        where: { assignedTo: userId, status: 'PENDING' },
      }),
    ]);

    return {
      fecha: new Date().toLocaleDateString('es-VE'),
      ventasHoy,
      stockBajo,
      tareasPendientes,
    };
  }

  private buildChatPrompt(message: string, context: any, recentMessages: any[]): string {
    return `
Eres el asistente inteligente del ERP ZENITH para Venezuela.

Contexto actual del sistema:
- Fecha: ${context.fecha}
- Ventas hoy: ${context.ventasHoy}
- Productos con stock bajo: ${context.stockBajo}
- Tareas pendientes del usuario: ${context.tareasPendientes}

Historial reciente:
${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Pregunta del usuario: ${message}

Responde en español, de forma concisa y profesional. Si la pregunta requiere datos del ERP, usa el contexto proporcionado.
`;
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Error al llamar a Gemini');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANÁLISIS DE SENTIMIENTO (Con Hugging Face)
  // ───────────────────────────────────────────────────────────────────────────
  
  async analyzeSentiment(text: string) {
    await this.checkLimit(AIProvider.HUGGINGFACE);

    const startTime = Date.now();
    
    // Usar modelo de sentimiento de Hugging Face
    const response = await fetch(
      'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const latency = Date.now() - startTime;
    const result = await response.json();

    // Procesar resultado
    const scores = result[0]?.map((r: any) => ({
      label: r.label.replace('LABEL_', ''),
      score: r.score,
    }));

    const positive = scores?.find((s: any) => s.label === '2')?.score || 0;
    const neutral = scores?.find((s: any) => s.label === '1')?.score || 0;
    const negative = scores?.find((s: any) => s.label === '0')?.score || 0;

    const sentiment = positive - negative; // -1 a 1
    const label = sentiment > 0.3 ? 'POSITIVO' : sentiment < -0.3 ? 'NEGATIVO' : 'NEUTRO';

    await this.logUsage({
      provider: AIProvider.HUGGINGFACE,
      model: 'roberta-base-sentiment',
      action: 'SENTIMENT_ANALYSIS',
      input: text,
      output: JSON.stringify({ sentiment, label }),
      latency,
      module: 'crm',
      success: true,
    });

    return { sentiment, label, scores, latency };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PREDICCIÓN DE VENTAS (Con Gemini)
  // ───────────────────────────────────────────────────────────────────────────
  
  async forecastVentas(productId: string, months: number, userId: string) {
    await this.checkLimit(AIProvider.GEMINI, userId);

    // 1. Obtener historial de ventas (últimos 12 meses)
    const historicalData = await this.getSalesHistory(productId, 12);

    // 2. Construir prompt para predicción
    const prompt = `
Eres un experto en predicción de ventas para ERPs venezolanos.

Historial de ventas mensuales (últimos 12 meses):
${JSON.stringify(historicalData)}

Considera:
- Estacionalidad venezolana (aguinaldos, vacaciones, etc.)
- Tendencia de los datos
- Inflación y contexto económico

Predice las ventas para los próximos ${months} meses.

Responde SOLO con JSON:
{
  "predictions": [
    { "month": "2024-02", "quantity": 100, "revenue": 5000, "confidence": "HIGH" }
  ],
  "trend": "CRECIENTE|DECRECIENTE|ESTABLE",
  "notes": "Observaciones importantes"
}
`;

    const startTime = Date.now();
    const response = await this.callGemini(prompt);
    const latency = Date.now() - startTime;

    // 3. Parsear respuesta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!prediction) {
      throw new BadRequestException('No se pudo generar la predicción');
    }

    // 4. Guardar predicción
    await this.prisma.aIPrediction.create({
      data: {
        type: 'VENTAS',
        entityId: productId,
        entityType: 'PRODUCT',
        inputData: historicalData,
        prediction,
        confidence: this.parseConfidence(prediction),
        model: 'gemini-pro',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.logUsage({
      provider: AIProvider.GEMINI,
      model: 'gemini-pro',
      action: 'SALES_FORECAST',
      input: JSON.stringify(historicalData),
      output: JSON.stringify(prediction),
      latency,
      userId,
      module: 'ventas',
      entityId: productId,
      success: true,
    });

    return { productId, prediction, latency };
  }

  private async getSalesHistory(productId: string, months: number) {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const sales = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        productId,
        sale: {
          status: 'INVOICED',
          date: { gte: monthsAgo },
        },
      },
      _sum: { quantity: true, subtotal: true },
    });

    // Agrupar por mes
    const byMonth = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', s.date) as month,
        SUM(si.quantity) as quantity,
        SUM(si.subtotal) as revenue
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s.id
      WHERE si."productId" = ${productId}
        AND s.date >= ${monthsAgo}
        AND s.status = 'INVOICED'
      GROUP BY month
      ORDER BY month
    `;

    return byMonth;
  }

  private parseConfidence(prediction: any): number {
    const highCount = prediction.predictions.filter((p: any) => p.confidence === 'HIGH').length;
    return (highCount / prediction.predictions.length) * 100;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CLASIFICACIÓN DE GASTOS (Zero-Shot con Hugging Face)
  // ───────────────────────────────────────────────────────────────────────────
  
  async classifyExpense(description: string) {
    await this.checkLimit(AIProvider.HUGGINGFACE);

    const categories = [
      'servicios',
      'materiales',
      'nomina',
      'alquiler',
      'transporte',
      'publicidad',
      'impuestos',
      'mantenimiento',
      'oficina',
      'otros',
    ];

    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: description,
          parameters: { candidate_labels: categories },
        }),
      }
    );

    const result = await response.json();
    const topCategory = result.labels?.[0] || 'otros';
    const confidence = result.scores?.[0] || 0;

    return { category: topCategory, confidence, allCategories: result };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DETECCIÓN DE ANOMALÍAS
  // ───────────────────────────────────────────────────────────────────────────
  
  async detectAnomalies(module: string, data: any, userId: string) {
    await this.checkLimit(AIProvider.GEMINI, userId);

    const prompt = `
Analiza estos datos de ${module} y detecta anomalías, patrones inusuales o posibles fraudes.

Datos:
${JSON.stringify(data)}

Identifica:
- Valores atípicos
- Patrones sospechosos
- Cambios bruscos
- Posibles errores

Responde con JSON:
{
  "anomalies": [
    {
      "description": "Descripción de la anomalía",
      "severity": "HIGH|MEDIUM|LOW",
      "type": "VALOR_ATIPICO|PATRON_SOSPECHOSO|CAMBIO_BRUSCO",
      "recommendation": "Acción recomendada"
    }
  ],
  "summary": "Resumen general"
}
`;

    const response = await this.callGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { anomalies: [] };

    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RESUMEN DE TEXTOS
  // ───────────────────────────────────────────────────────────────────────────
  
  async summarize(text: string, maxLength: number = 500) {
    await this.checkLimit(AIProvider.GEMINI);

    const prompt = `
Resume el siguiente texto en máximo ${maxLength} caracteres, manteniendo las ideas principales:

${text.substring(0, 3000)}

Responde solo con el resumen, sin introducciones.
`;

    const summary = await this.callGemini(prompt);
    return { summary, originalLength: text.length, summaryLength: summary.length };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GESTIÓN DE LÍMITES
  // ───────────────────────────────────────────────────────────────────────────
  
  private async checkLimit(provider: AIProvider, userId?: string) {
    const config = await this.prisma.aIConfig.findUnique({
      where: { provider },
    });

    if (!config || !config.isActive) {
      throw new BadRequestException(`El proveedor ${provider} no está configurado`);
    }

    // Resetear si es otro día
    const today = new Date().toDateString();
    const lastReset = config.lastReset.toDateString();
    
    if (today !== lastReset) {
      await this.prisma.aIConfig.update({
        where: { provider },
        data: { usageToday: 0, lastReset: new Date() },
      });
    }

    // Verificar límite
    if (config.usageToday >= config.dailyLimit) {
      throw new BadRequestException(
        `Límite diario alcanzado para ${provider}. Intente mañana.`
      );
    }

    // Incrementar uso
    await this.prisma.aIConfig.update({
      where: { provider },
      data: { usageToday: { increment: 1 } },
    });
  }

  private async logUsage(data: {
    provider: AIProvider;
    model?: string;
    action: string;
    input: string;
    output?: string;
    latency?: number;
    userId?: string;
    module?: string;
    entityId?: string;
    success: boolean;
    errorMessage?: string;
  }) {
    await this.prisma.aIUsageLog.create({
      data,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS DE USO
  // ───────────────────────────────────────────────────────────────────────────
  
  async getUsage(from: Date, to: Date) {
    const logs = await this.prisma.aIUsageLog.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      include: { user: true },
    });

    const byProvider = logs.reduce((acc, log) => {
      acc[log.provider] = (acc[log.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAction = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgLatency = logs.reduce((sum, log) => sum + (log.latency || 0), 0) / logs.length;
    const successRate = (logs.filter(l => l.success).length / logs.length) * 100;

    return {
      totalRequests: logs.length,
      byProvider,
      byAction,
      avgLatency: Math.round(avgLatency),
      successRate: successRate.toFixed(2),
      logs,
    };
  }

  async getUsageStats() {
    const configs = await this.prisma.aIConfig.findMany();
    
    return configs.map(c => ({
      provider: c.provider,
      isActive: c.isActive,
      dailyLimit: c.dailyLimit,
      usageToday: c.usageToday,
      remainingToday: c.dailyLimit - c.usageToday,
      lastReset: c.lastReset,
    }));
  }
}
```

---

## ⚙️ Configuración de Proveedores

### Variables de Entorno

```bash
# .env

# Google Gemini
GEMINI_API_KEY="xxx"

# Hugging Face
HF_TOKEN="hf_xxx"

# Groq (inferencia rápida)
GROQ_API_KEY="gsk_xxx"

# Cohere (embeddings)
COHERE_API_KEY="xxx"

# AssemblyAI (transcripción)
ASSEMBLYAI_API_KEY="xxx"

# DeepL (traducción)
DEEPL_API_KEY="xxx"
```

### Configuración Inicial en BD

```typescript
// Seed de configuración de IA
await prisma.aIConfig.createMany({
  data: [
    {
      provider: 'GEMINI',
      apiKey: encrypt(process.env.GEMINI_API_KEY),
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
      isActive: true,
      dailyLimit: 1000,
    },
    {
      provider: 'HUGGINGFACE',
      apiKey: encrypt(process.env.HF_TOKEN),
      apiUrl: 'https://api-inference.huggingface.co',
      isActive: true,
      dailyLimit: 500,
    },
    {
      provider: 'GROQ',
      apiKey: encrypt(process.env.GROQ_API_KEY),
      apiUrl: 'https://api.groq.com/openai/v1',
      isActive: false,
      dailyLimit: 100,
    },
  ],
});
```

---

## 📊 Casos de Uso por Módulo

### CRM
- **Análisis de sentimiento** en interacciones con clientes
- **Lead scoring** automático basado en actividad
- **Chatbot** para responder preguntas de vendedores

### Ventas
- **Predicción de ventas** por producto
- **Detección de anomalías** en descuentos
- **Resumen automático** de cotizaciones

### Inventario
- **Predicción de demanda** para reposición
- **Detección de merma** inusual
- **Clasificación automática** de productos

### Contabilidad
- **Clasificación automática** de gastos
- **Detección de anomalías** en asientos
- **Resumen de informes** financieros

### RRHH
- **Análisis de sentimiento** en encuestas
- **Transcripción** de entrevistas
- **Chatbot** para preguntas de empleados

---

## 📁 Archivos del Módulo

```
07-integraciones/
├── ia.md (este archivo)
├── n8n-workflows.md
├── api-externas.md
└── webhooks.md
```

**Anterior**: `05-configuracion/sistema.md` | **Siguiente**: `07-integraciones/n8n-workflows.md`
