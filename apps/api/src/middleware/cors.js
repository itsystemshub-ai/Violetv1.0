const cors = require('cors');
const { cors: corsConfig } = require('../config/server');

/**
 * Middleware de CORS
 */
module.exports = cors(corsConfig);
