import { firebirdPool } from './src/database/firebird-pool.js';

console.log('=== TEST DATABASE ===');
console.log('Inicializando pool...');

try {
  await firebirdPool.initialize();
  console.log('Pool inicializado:', firebirdPool.initialized);
  console.log('Método get:', typeof firebirdPool.get);
  console.log('Método query:', typeof firebirdPool.executeQuery);

  const user = firebirdPool.get('SELECT * FROM usuarios LIMIT 1', []);
  console.log('Usuario encontrado:', user ? user.codigo : 'Ninguno');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
