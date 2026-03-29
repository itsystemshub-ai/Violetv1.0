import { localDb } from '../src/lib/localDb';
import { hashPassword } from '../src/lib/security/passwordHash';

/**
 * Script para migrar contraseñas en texto plano a hashes bcrypt.
 * EJECUTAR UNA SOLA VEZ.
 */
async function migratePasswords() {
  console.log('🔒 Iniciando migración de contraseñas...');

  try {
    // Obtener todos los usuarios
    const users = await localDb.users.toArray();
    console.log(`📊 Encontrados ${users.length} usuarios`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Verificar si ya está hasheada (bcrypt hashes empiezan con $2)
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`🔄 Migrando usuario: ${user.username}`);
        
        const hashedPassword = await hashPassword(user.password);
        
        await localDb.users.update(user.id!, {
          password: hashedPassword,
          updatedAt: new Date(),
        });
        
        migrated++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Migración completada:`);
    console.log(`   - Migrados: ${migrated}`);
    console.log(`   - Omitidos: ${skipped}`);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

// Ejecutar migración
migratePasswords()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falló:', error);
    process.exit(1);
  });
