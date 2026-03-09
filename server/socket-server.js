/**
 * Socket.IO Server - Servidor local para sincronización en red
 * Características:
 * - Sincronización en tiempo real
 * - Broadcast de cambios
 * - Gestión de salas por empresa
 * - Heartbeat para detectar desconexiones
 * - Logs de actividad
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Socket.IO con CORS
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Estado del servidor
const serverState = {
  connectedClients: 0,
  rooms: new Map(),
  startTime: new Date(),
  totalConnections: 0,
  totalMessages: 0
};

// Middleware de autenticación
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const tenantId = socket.handshake.auth.tenantId;

  if (!tenantId) {
    return next(new Error('Tenant ID requerido'));
  }

  socket.tenantId = tenantId;
  socket.userId = socket.handshake.auth.userId || 'anonymous';
  next();
});

// Conexión de cliente
io.on('connection', (socket) => {
  serverState.connectedClients++;
  serverState.totalConnections++;

  console.log(`[${new Date().toISOString()}] Cliente conectado:`, {
    id: socket.id,
    tenantId: socket.tenantId,
    userId: socket.userId
  });

  // Unirse a sala de tenant
  const room = `tenant:${socket.tenantId}`;
  socket.join(room);

  // Actualizar estado de sala
  if (!serverState.rooms.has(room)) {
    serverState.rooms.set(room, {
      clients: new Set(),
      createdAt: new Date()
    });
  }
  serverState.rooms.get(room).clients.add(socket.id);

  // Notificar a otros clientes
  socket.to(room).emit('user:connected', {
    userId: socket.userId,
    timestamp: new Date().toISOString()
  });

  // Enviar estado del servidor
  socket.emit('server:state', {
    connectedClients: serverState.connectedClients,
    roomClients: serverState.rooms.get(room).clients.size,
    serverUptime: Date.now() - serverState.startTime.getTime()
  });

  // ==================== EVENTOS DE SINCRONIZACIÓN ====================

  // Sincronizar producto
  socket.on('product:update', (data) => {
    serverState.totalMessages++;
    console.log(`[${new Date().toISOString()}] Producto actualizado:`, data.productId);
    
    socket.to(room).emit('product:updated', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Sincronizar inventario
  socket.on('inventory:update', (data) => {
    serverState.totalMessages++;
    console.log(`[${new Date().toISOString()}] Inventario actualizado`);
    
    socket.to(room).emit('inventory:updated', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Sincronizar venta
  socket.on('sale:create', (data) => {
    serverState.totalMessages++;
    console.log(`[${new Date().toISOString()}] Venta creada:`, data.saleId);
    
    socket.to(room).emit('sale:created', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Sincronizar orden
  socket.on('order:update', (data) => {
    serverState.totalMessages++;
    console.log(`[${new Date().toISOString()}] Orden actualizada:`, data.orderId);
    
    socket.to(room).emit('order:updated', {
      ...data,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Notificación general
  socket.on('notification:send', (data) => {
    serverState.totalMessages++;
    console.log(`[${new Date().toISOString()}] Notificación enviada`);
    
    if (data.broadcast) {
      // Enviar a todos en la sala
      io.to(room).emit('notification:received', {
        ...data,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    } else if (data.targetUserId) {
      // Enviar a usuario específico
      const targetSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === data.targetUserId && s.tenantId === socket.tenantId);
      
      if (targetSocket) {
        targetSocket.emit('notification:received', {
          ...data,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      serverUptime: Date.now() - serverState.startTime.getTime()
    });
  });

  // Solicitar estado del servidor
  socket.on('server:getState', () => {
    socket.emit('server:state', {
      connectedClients: serverState.connectedClients,
      totalConnections: serverState.totalConnections,
      totalMessages: serverState.totalMessages,
      roomClients: serverState.rooms.get(room).clients.size,
      serverUptime: Date.now() - serverState.startTime.getTime(),
      rooms: Array.from(serverState.rooms.keys())
    });
  });

  // ==================== DESCONEXIÓN ====================

  socket.on('disconnect', (reason) => {
    serverState.connectedClients--;
    
    console.log(`[${new Date().toISOString()}] Cliente desconectado:`, {
      id: socket.id,
      userId: socket.userId,
      reason
    });

    // Actualizar estado de sala
    const roomState = serverState.rooms.get(room);
    if (roomState) {
      roomState.clients.delete(socket.id);
      
      // Eliminar sala si está vacía
      if (roomState.clients.size === 0) {
        serverState.rooms.delete(room);
      }
    }

    // Notificar a otros clientes
    socket.to(room).emit('user:disconnected', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Manejo de errores
  socket.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error en socket ${socket.id}:`, error);
  });
});

// ==================== API REST ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Date.now() - serverState.startTime.getTime(),
    connectedClients: serverState.connectedClients,
    totalConnections: serverState.totalConnections,
    totalMessages: serverState.totalMessages,
    rooms: serverState.rooms.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/stats', (req, res) => {
  const rooms = Array.from(serverState.rooms.entries()).map(([name, state]) => ({
    name,
    clients: state.clients.size,
    createdAt: state.createdAt
  }));

  res.json({
    server: {
      startTime: serverState.startTime,
      uptime: Date.now() - serverState.startTime.getTime(),
      connectedClients: serverState.connectedClients,
      totalConnections: serverState.totalConnections,
      totalMessages: serverState.totalMessages
    },
    rooms
  });
});

// ==================== INICIO DEL SERVIDOR ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Socket.IO Server - Violet ERP                        ║
║                                                            ║
║   Puerto: ${PORT}                                              ║
║   Inicio: ${serverState.startTime.toLocaleString()}                ║
║                                                            ║
║   Endpoints:                                               ║
║   • http://localhost:${PORT}/health                            ║
║   • http://localhost:${PORT}/stats                             ║
║                                                            ║
║   Socket.IO:                                               ║
║   • ws://localhost:${PORT}                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[SIGINT] Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT EXCEPTION]', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
