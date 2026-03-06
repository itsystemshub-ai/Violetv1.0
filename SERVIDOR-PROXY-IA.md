# 🤖 Servidor Proxy de IA - Guía de Uso

## ✅ Estado Actual

El servidor proxy de IA está **CORRIENDO** en:
- **Puerto:** 3001
- **Endpoint:** http://localhost:3001/api/groq/chat
- **Health Check:** http://localhost:3001/health

---

## 🚀 Cómo Iniciar el Servidor

### Opción 1: Inicio Automático (Recomendado)

El servidor se inicia automáticamente cuando ejecutas:

```bash
npm run dev:full
```

Este comando inicia:
1. Servidor de desarrollo de Vite (puerto 5173)
2. Servidor proxy de IA (puerto 3001)

### Opción 2: Inicio Manual

Si solo necesitas el servidor proxy:

```bash
cd server
npm start
```

### Opción 3: Con Script de PowerShell (Windows)

```powershell
.\scripts\start-proxy-server.ps1
```

### Opción 4: Con Script de Node.js

```bash
node scripts/start-proxy-server.cjs
```

---

## 🔍 Verificar Estado del Servidor

### Desde el Navegador:
Abre: http://localhost:3001/health

Deberías ver:
```json
{
  "status": "ok",
  "message": "Groq Proxy Server is running",
  "uptime": "5m 30s",
  "memory": {
    "rss": "56MB",
    "heapUsed": "8MB",
    "heapTotal": "9MB"
  },
  "timestamp": "2026-03-06T00:14:55.691Z"
}
```

### Desde PowerShell:
```powershell
curl http://localhost:3001/health
```

### Desde la Aplicación:
1. Ve a **Configuración** → **IA**
2. Busca **"Servidor Proxy IA"**
3. Debe mostrar **"En Línea"** (verde)
4. Click en **"Verificar"** para probar la conexión

---

## 🛠️ Solución de Problemas

### Problema: "Fuera de Línea" en la aplicación

**Causa:** El servidor no está corriendo.

**Solución:**
```bash
cd server
npm start
```

### Problema: "Puerto 3001 ya en uso"

**Causa:** Otra aplicación está usando el puerto 3001.

**Solución 1 - Detener el proceso:**
```powershell
# Encontrar el proceso
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Detener el proceso (reemplaza PID con el número del proceso)
Stop-Process -Id PID -Force
```

**Solución 2 - Cambiar el puerto:**
1. Edita `server/groq-proxy.cjs`
2. Cambia `const PORT = 3001;` a otro puerto (ej: 3002)
3. Actualiza la configuración en la aplicación

### Problema: "Error al conectar con Groq API"

**Causa:** API Key inválida o no configurada.

**Solución:**
1. Ve a **Configuración** → **IA**
2. Ingresa tu API Key de Groq
3. Guarda los cambios
4. Prueba de nuevo

### Problema: El servidor se detiene solo

**Causa:** Error en el servidor o falta de memoria.

**Solución:**
1. Revisa los logs del servidor
2. Reinicia el servidor:
   ```bash
   cd server
   npm start
   ```

---

## 📊 Características del Servidor

### ✅ Rate Limiting
- **General:** 100 requests por 15 minutos por IP
- **IA Endpoint:** 30 requests por 15 minutos por IP
- Protege contra abuso y sobrecarga

### ✅ CORS Habilitado
- Permite peticiones desde cualquier origen
- Necesario para desarrollo local

### ✅ Logging Detallado
- Timestamps en todos los logs
- Información de memoria y uptime
- Errores detallados para debugging

### ✅ Health Check
- Endpoint `/health` para monitoreo
- Información de estado del servidor
- Métricas de memoria y uptime

---

## 🔐 Seguridad

### API Keys
- Las API keys **NO** se almacenan en el servidor
- Se envían en cada petición desde el cliente
- El servidor solo actúa como proxy

### Rate Limiting
- Protección contra ataques DDoS
- Límites por IP
- Respuestas HTTP 429 cuando se excede el límite

### Validación de Entrada
- Validación de estructura de mensajes
- Validación de rangos (temperature, max_tokens)
- Sanitización de datos

---

## 📝 Endpoints Disponibles

### POST /api/groq/chat
Proxy para la API de Groq.

**Request:**
```json
{
  "apiKey": "gsk_...",
  "messages": [
    { "role": "system", "content": "Eres un asistente útil" },
    { "role": "user", "content": "Hola" }
  ],
  "temperature": 0.2,
  "max_tokens": 1024
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "¡Hola! ¿En qué puedo ayudarte?"
      }
    }
  ]
}
```

### GET /health
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Groq Proxy Server is running",
  "uptime": "5m 30s",
  "memory": {
    "rss": "56MB",
    "heapUsed": "8MB",
    "heapTotal": "9MB"
  },
  "timestamp": "2026-03-06T00:14:55.691Z"
}
```

---

## 🔄 Reiniciar el Servidor

### Desde PowerShell:
```powershell
# Detener
Stop-Process -Name node -Force

# Iniciar
cd server
npm start
```

### Desde la aplicación:
1. Ve a **Configuración** → **Sistema & Seguridad** → **Monitoreo**
2. Busca **"Servidor Proxy IA"**
3. Click en **"Reiniciar"** (si está disponible)

---

## 📦 Dependencias

El servidor requiere:
- Node.js 18 o superior
- npm o yarn
- Dependencias instaladas:
  ```bash
  cd server
  npm install
  ```

---

## 🎯 Uso en Producción

Para producción, considera:

1. **Variables de entorno:**
   ```bash
   PORT=3001
   NODE_ENV=production
   ```

2. **Process Manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start server/groq-proxy.cjs --name violet-proxy
   pm2 save
   pm2 startup
   ```

3. **Reverse Proxy (Nginx):**
   ```nginx
   location /api/groq/ {
     proxy_pass http://localhost:3001/api/groq/;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_cache_bypass $http_upgrade;
   }
   ```

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que el servidor esté corriendo
2. Revisa los logs del servidor
3. Verifica la configuración de la API Key
4. Prueba el health check endpoint

---

**Última actualización:** 2026-03-06
**Puerto:** 3001
**Estado:** ✅ Operativo
