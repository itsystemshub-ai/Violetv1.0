# Socket.IO Server - Violet ERP

Servidor Socket.IO para sincronización en tiempo real en red local.

## Características

- ✅ Sincronización en tiempo real entre múltiples clientes
- ✅ Broadcast de cambios por empresa (tenant)
- ✅ Heartbeat para detectar desconexiones
- ✅ Reconexión automática
- ✅ Logs de actividad
- ✅ API REST para estadísticas

## Instalación

```bash
cd server
npm install
```

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

El servidor se iniciará en `http://localhost:3001`

## Endpoints

### Health Check

```
GET http://localhost:3001/health
```

Respuesta:
```json
{
  "status": "ok",
  "uptime": 123456,
  "connectedClients": 5,
  "totalConnections": 42,
  "totalMessages": 1234,
  "rooms": 3,
  "timestamp": "2026-03-09T..."
}
```

### Estadísticas

```
GET http://localhost:3001/stats
```

Respuesta:
```json
{
  "server": {
    "startTime": "2026-03-09T...",
    "uptime": 123456,
    "connectedClients": 5,
    "totalConnections": 42,
    "totalMessages": 1234
  },
  "rooms": [
    {
      "name": "tenant:123",
      "clients": 3,
      "createdAt": "2026-03-09T..."
    }
  ]
}
```

## Eventos Socket.IO

### Cliente → Servidor

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `product:update` | Actualizar producto | `{ productId, changes }` |
| `inventory:update` | Actualizar inventario | `{ changes }` |
| `sale:create` | Crear venta | `{ saleId, sale }` |
| `order:update` | Actualizar orden | `{ orderId, changes }` |
| `notification:send` | Enviar notificación | `{ title, message, type, broadcast?, targetUserId? }` |
| `ping` | Heartbeat | - |
| `server:getState` | Obtener estado | - |

### Servidor → Cliente

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `product:updated` | Producto actualizado | `{ productId, changes, userId, timestamp }` |
| `inventory:updated` | Inventario actualizado | `{ changes, userId, timestamp }` |
| `sale:created` | Venta creada | `{ saleId, sale, userId, timestamp }` |
| `order:updated` | Orden actualizada | `{ orderId, changes, userId, timestamp }` |
| `notification:received` | Notificación recibida | `{ title, message, type, userId, timestamp }` |
| `user:connected` | Usuario conectado | `{ userId, timestamp }` |
| `user:disconnected` | Usuario desconectado | `{ userId, timestamp }` |
| `server:state` | Estado del servidor | `{ connectedClients, roomClients, serverUptime }` |
| `pong` | Respuesta heartbeat | `{ timestamp, serverUptime }` |

## Uso desde el Frontend

```typescript
import { socketService } from '@/services/SocketService';

// Conectar
await socketService.connect({
  url: 'http://localhost:3001',
  tenantId: 'empresa-123',
  userId: 'usuario-456',
  token: 'optional-token'
});

// Sincronizar cambios
socketService.syncProductUpdate('prod-123', {
  PRECIO: 100,
  STOCK: 50
});

// Escuchar cambios
socketService.on('product:updated', (data) => {
  console.log('Producto actualizado:', data);
  // Actualizar UI
});

// Enviar notificación
socketService.sendNotification({
  title: 'Nueva venta',
  message: 'Se ha registrado una nueva venta',
  type: 'success',
  broadcast: true
});

// Desconectar
socketService.disconnect();
```

## Uso con React Hook

```typescript
import { useSocket } from '@/services/SocketService';

function MyComponent() {
  const { isConnected, serverState, connect, on } = useSocket();

  useEffect(() => {
    // Conectar al montar
    connect({
      url: 'http://localhost:3001',
      tenantId: 'empresa-123',
      userId: 'usuario-456'
    });

    // Escuchar eventos
    const unsubscribe = on('product:updated', (data) => {
      console.log('Producto actualizado:', data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <p>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      {serverState && (
        <p>Clientes conectados: {serverState.connectedClients}</p>
      )}
    </div>
  );
}
```

## Configuración

### Variables de Entorno

```bash
PORT=3001  # Puerto del servidor (default: 3001)
```

### CORS

Por defecto, el servidor acepta conexiones desde:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Para agregar más orígenes, edita `socket-server.js`:

```javascript
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://tu-dominio.com'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

## Seguridad

### Autenticación

El servidor requiere `tenantId` en el handshake:

```javascript
io.use((socket, next) => {
  const tenantId = socket.handshake.auth.tenantId;
  if (!tenantId) {
    return next(new Error('Tenant ID requerido'));
  }
  next();
});
```

### Salas por Empresa

Cada empresa (tenant) tiene su propia sala:
- Los clientes solo reciben eventos de su empresa
- No hay cross-contamination entre empresas
- Aislamiento completo de datos

## Logs

El servidor registra:
- Conexiones y desconexiones
- Eventos enviados
- Errores

Ejemplo:
```
[2026-03-09T10:30:00.000Z] Cliente conectado: { id: 'abc123', tenantId: 'empresa-123', userId: 'usuario-456' }
[2026-03-09T10:30:15.000Z] Producto actualizado: prod-123
[2026-03-09T10:35:00.000Z] Cliente desconectado: { id: 'abc123', userId: 'usuario-456', reason: 'transport close' }
```

## Troubleshooting

### No se puede conectar

1. Verificar que el servidor esté corriendo:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verificar CORS en la consola del navegador

3. Verificar que el puerto 3001 no esté en uso:
   ```bash
   netstat -ano | findstr :3001
   ```

### Desconexiones frecuentes

1. Aumentar `pingTimeout` y `pingInterval` en el servidor
2. Verificar estabilidad de la red
3. Revisar logs del servidor

### Eventos no se reciben

1. Verificar que el cliente esté en la sala correcta (mismo tenantId)
2. Verificar que el evento esté registrado en el servidor
3. Usar `server:getState` para verificar estado

## Producción

### Recomendaciones

1. **Usar PM2** para gestión de procesos:
   ```bash
   npm install -g pm2
   pm2 start socket-server.js --name violet-socket
   pm2 save
   pm2 startup
   ```

2. **Configurar firewall** para permitir puerto 3001

3. **Usar HTTPS** en producción con certificado SSL

4. **Monitorear** con herramientas como PM2 Monitor

5. **Logs** persistentes con PM2:
   ```bash
   pm2 logs violet-socket
   ```

## Licencia

MIT
