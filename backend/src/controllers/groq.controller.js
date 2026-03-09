const https = require('https');

/**
 * Controlador para el proxy de Groq API
 */
class GroqController {
  /**
   * Realiza una petición HTTPS
   */
  static httpsRequest(url, options, body) {
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

  /**
   * Procesa una petición de chat
   */
  static async chat(req, res, next) {
    try {
      const { apiKey, messages, temperature = 0.2, max_tokens = 1024 } = req.body;

      if (!apiKey) {
        return res.status(400).json({ 
          error: { message: 'API Key es requerida' } 
        });
      }

      console.log('[Groq Proxy] Petición recibida:', {
        messagesCount: messages?.length,
        hasApiKey: !!apiKey,
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

      const response = await this.httpsRequest(
        'https://api.groq.com/openai/v1/chat/completions',
        options,
        requestBody
      );

      if (response.status !== 200) {
        console.error('[Groq Proxy] Error de API:', response.data);
        return res.status(response.status).json(response.data);
      }

      console.log('[Groq Proxy] Respuesta exitosa');
      res.json(response.data);

    } catch (error) {
      console.error('[Groq Proxy] Error:', error);
      next(error);
    }
  }

  /**
   * Health check
   */
  static health(req, res) {
    res.json({ 
      status: 'ok', 
      message: 'Groq Proxy Server is running' 
    });
  }
}

module.exports = GroqController;
