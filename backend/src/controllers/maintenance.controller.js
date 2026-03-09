const { getSocketIo } = require('../server');

/**
 * Controlador para funciones de mantenimiento y sistema
 */
class MaintenanceController {
  /**
   * Notifica a todos los usuarios de un mantenimiento próximo
   */
  static async notifyMaintenance(req, res, next) {
    try {
      const { message, duration = 30 } = req.body;
      
      const io = getSocketIo();
      if (!io) {
        return res.status(500).json({ 
          success: false, 
          error: 'Servidor de sockets no disponible' 
        });
      }

      // Emitir evento a todos los clientes conectados
      io.emit('system:maintenance', {
        message: message || `El sistema entrará en mantenimiento en breve por aproximadamente ${duration} minutos.`,
        duration,
        timestamp: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        message: 'Notificación de mantenimiento enviada exitosamente' 
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MaintenanceController;
