#!/usr/bin/env node

/**
 * Generate secure JWT secrets for production
 * Run: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generando secrets seguros para JWT...\n');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Copia estas variables de entorno en Netlify:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`VITE_JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Secrets generados exitosamente!');
console.log('⚠️  IMPORTANTE: Guarda estos valores de forma segura');
console.log('⚠️  NO los compartas públicamente ni los subas a Git');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
