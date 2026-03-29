/**
 * Violet ERP - Socket.IO Setup
 */

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Join room
    socket.on('join', (room) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Leave room
    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Chat message
    socket.on('message', (data) => {
      io.to(data.room).emit('message', {
        userId: socket.id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });

    // Notification
    socket.on('notification', (data) => {
      io.to(data.userId).emit('notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
    });
  });

  console.log('   ✅ Socket.IO initialized');
}

export default setupSocket;
