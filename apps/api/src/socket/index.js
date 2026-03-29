/**
 * Violet ERP - Configuración de Socket.IO
 * 
 * Maneja eventos en tiempo real para:
 * - Notificaciones
 * - Actualizaciones de inventario
 * - Órdenes de venta
 * - Mensajes del sistema
 */

export function setupSocket(io) {
  // Middleware de autenticación para WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verificar token JWT (implementar verificación real)
    socket.userId = token.userId;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Unirse a salas específicas
    socket.on('join', (rooms) => {
      if (Array.isArray(rooms)) {
        rooms.forEach((room) => socket.join(room));
      } else {
        socket.join(rooms);
      }
      console.log(`Socket ${socket.id} joined rooms:`, rooms);
    });

    // Dejar salas
    socket.on('leave', (rooms) => {
      if (Array.isArray(rooms)) {
        rooms.forEach((room) => socket.leave(room));
      } else {
        socket.leave(rooms);
      }
    });

    // Suscribirse a notificaciones personales
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${socket.userId}`);
    });

    // Suscribirse a actualizaciones de inventario
    socket.on('subscribe:inventory', () => {
      socket.join('inventory:updates');
    });

    // Suscribirse a órdenes de venta
    socket.on('subscribe:sales', () => {
      socket.join('sales:updates');
    });

    // Enviar notificación
    socket.on('send:notification', (data) => {
      io.to(data.room).emit('receive:notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Actualización de inventario en tiempo real
    socket.on('inventory:update', (data) => {
      io.to('inventory:updates').emit('inventory:changed', {
        productId: data.productId,
        previousStock: data.previousStock,
        newStock: data.newStock,
        type: data.type,
        timestamp: new Date().toISOString(),
      });
    });

    // Nueva venta
    socket.on('sale:created', (data) => {
      io.to('sales:updates').emit('sale:new', {
        saleId: data.saleId,
        customer: data.customer,
        total: data.total,
        timestamp: new Date().toISOString(),
      });
    });

    // Actualización de estado de venta
    socket.on('sale:updated', (data) => {
      io.to(`sale:${data.saleId}`).emit('sale:status_changed', {
        saleId: data.saleId,
        status: data.status,
        timestamp: new Date().toISOString(),
      });
    });

    // Typing indicators (para chat/collaboración)
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('user:typing', {
        userId: socket.userId,
        field: data.field,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('user:stop_typing', {
        userId: socket.userId,
        field: data.field,
      });
    });

    // Request realtime data
    socket.on('request:data', (data) => {
      // Emitir datos actualizados al cliente
      socket.emit('data:update', {
        type: data.type,
        data: {}, // Datos reales
        timestamp: new Date().toISOString(),
      });
    });

    // Broadcast a todos los administradores
    socket.on('broadcast:admin', (data) => {
      io.to('role:admin').emit('admin:broadcast', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Manejar errores
    socket.on('error', (error) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });

  // Funciones para emitir eventos desde el servidor
  io.emitNotification = (userId, notification) => {
    io.to(`notifications:${userId}`).emit('receive:notification', notification);
  };

  io.emitInventoryUpdate = (update) => {
    io.to('inventory:updates').emit('inventory:changed', update);
  };

  io.emitSaleUpdate = (saleId, update) => {
    io.to(`sale:${saleId}`).emit('sale:status_changed', update);
  };

  io.broadcastToRole = (role, data) => {
    io.to(`role:${role}`).emit('role:broadcast', data);
  };

  console.log('Socket.IO configured successfully');
}

export default setupSocket;
