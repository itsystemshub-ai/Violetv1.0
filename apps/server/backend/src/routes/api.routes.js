const express = require('express');
const SqlController = require('../controllers/sql.controller');

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

// SQL
router.post('/sql', SqlController.execute);
router.post('/mutate', SqlController.mutate);

module.exports = router;
