const express = require('express');
const GroqController = require('../controllers/groq.controller');

const router = express.Router();

/**
 * Rutas de Groq API
 */

// Chat
router.post('/chat', GroqController.chat);

// Health check
router.get('/health', GroqController.health);

module.exports = router;
