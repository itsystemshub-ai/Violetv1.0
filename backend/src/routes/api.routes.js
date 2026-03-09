const express = require('express');
const SqlController = require('../controllers/sql.controller');
const MaintenanceController = require('../controllers/maintenance.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Rutas de API
 */

// Ping
router.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Master Server is running' 
  });
});

// SQL (Protegidas)
router.use(authenticate);

router.post('/sql', SqlController.execute);
router.post('/mutate', SqlController.mutate);

// Mantenimiento (Protegidas)
router.post('/maintenance/notify', MaintenanceController.notifyMaintenance);

module.exports = router;
