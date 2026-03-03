const express = require('express');
const cors = require('cors');
const https = require('https');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3001;

// Utilidad de logging con timestamps
const log = {
  info: (msg, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${msg}`, Object.keys(data).length > 0 ? data : '');
  },
  error: (msg, data = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${msg}`, Object.keys(data).length > 0 ? data : '');
  },
  warn: (msg, data = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${msg}`, Object.keys(data).length > 0 ? data : '');
  }
};

// Rate limiter: 100 requests por 15 minutos por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de requests
  message: {
    error: {
      message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter más estricto para el endpoint de IA: 30 requests por 15 minutos
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    error: {
      message: 'Límite de consultas de IA alcanzado. Por favor espera 15 minutos.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Habilitar CORS para todas las peticiones
app.use(cors());
app.use(express.json());

// Aplicar rate limiter general a todas las rutas
app.use(limiter);

// Función helper para hacer peticiones HTTPS
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error('Error al parsear respuesta JSON'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Endpoint proxy para Groq API (con rate limiting específico)
app.post('/api/groq/chat', aiLimiter, async (req, res) => {
  try {
    const { apiKey, messages, temperature = 0.2, max_tokens = 1024 } = req.body;

    // Validación de entrada
    if (!apiKey) {
      return res.status(400).json({ 
        error: { message: 'API Key es requerida' } 
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: { message: 'Messages debe ser un array no vacío' } 
      });
    }

    // Validar estructura de mensajes
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ 
          error: { message: 'Cada mensaje debe tener role y content' } 
        });
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ 
          error: { message: 'Role debe ser system, user o assistant' } 
        });
      }
    }

    // Validar rangos
    if (temperature < 0 || temperature > 2) {
      return res.status(400).json({ 
        error: { message: 'Temperature debe estar entre 0 y 2' } 
      });
    }

    if (max_tokens < 1 || max_tokens > 8000) {
      return res.status(400).json({ 
        error: { message: 'max_tokens debe estar entre 1 y 8000' } 
      });
    }

    console.log('[Groq Proxy] Petición recibida:', {
      messagesCount: messages?.length,
      hasApiKey: !!apiKey,
      temperature,
      max_tokens,
    });

    log.info('Petición de IA recibida', {
      messagesCount: messages.length,
      temperature,
      max_tokens,
      firstMessageRole: messages[0]?.role,
    });

    const requestBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens,
    });

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const response = await httpsRequest(
      'https://api.groq.com/openai/v1/chat/completions',
      options,
      requestBody
    );

    if (response.status !== 200) {
      log.error('Error de API de Groq', { 
        status: response.status,
        error: response.data?.error?.message || 'Unknown error'
      });
      return res.status(response.status).json(response.data);
    }

    log.info('Respuesta exitosa de Groq', {
      hasContent: !!response.data?.choices?.[0]?.message?.content,
      contentLength: response.data?.choices?.[0]?.message?.content?.length || 0,
    });
    res.json(response.data);

  } catch (error) {
    log.error('Error en proxy de Groq', { 
      message: error.message,
      stack: error.stack?.split('\n')[0] // Solo primera línea del stack
    });
    res.status(500).json({ 
      error: { 
        message: error.message || 'Error interno del servidor proxy' 
      } 
    });
  }
});

// Health check mejorado
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'ok', 
    message: 'Groq Proxy Server is running',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  log.info(`Groq Proxy Server iniciado`, {
    port: PORT,
    endpoint: `http://localhost:${PORT}/api/groq/chat`,
    healthCheck: `http://localhost:${PORT}/health`,
  });
  console.log(`🚀 Groq Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/groq/chat`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});

