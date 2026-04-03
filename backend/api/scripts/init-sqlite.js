/**
 * Violet ERP - Inicializar SQLite
 * Crea la base de datos y datos por defecto
 */

import { sqliteDB } from '../src/database/sqlite.js';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║      VIOLET ERP - INICIALIZANDO SQLITE                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

async function init() {
  try {
    await sqliteDB.initialize();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          INICIALIZACIÓN COMPLETADA                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('💜 Credenciales por defecto:');
    console.log('   Email:    admin@violet-erp.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🚀 Para iniciar el sistema:');
    console.log('   npm run dev');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║              ERROR DE INICIALIZACIÓN                      ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(`❌ ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

init();
