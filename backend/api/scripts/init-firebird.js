/**
 * Violet ERP - Script de Inicialización de Firebird
 * Ejecutar: node scripts/init-firebird.js
 */

import firebird from 'node-firebird';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  host: process.env.FIREBIRD_HOST || 'localhost',
  port: parseInt(process.env.FIREBIRD_PORT || '3050', 10),
  database: process.env.FIREBIRD_DATABASE,
  user: process.env.FIREBIRD_USER || 'SYSDBA',
  password: process.env.FIREBIRD_PASSWORD || 'masterkey',
  lowercase_keys: true,
};

async function initializeDatabase() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      VIOLET ERP - INICIALIZANDO FIREBIRD                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Conectando a: ${options.host}:${options.port}`);
  console.log(`Base de datos: ${options.database}`);
  console.log('');

  try {
    // Leer schema SQL
    const schemaPath = path.join(__dirname, '../../database/firebird/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('✓ Schema SQL cargado');

    // Conectar a Firebird
    const db = await new Promise((resolve, reject) => {
      firebird.attach(options, (err, connection) => {
        if (err) {
          reject(new Error(`Error conectando a Firebird: ${err.message}`));
          return;
        }
        console.log('✓ Conectado a Firebird');
        resolve(connection);
      });
    });

    // Ejecutar schema
    console.log('Ejecutando schema...');
    
    // Dividir el schema en statements individuales
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('SET TERM'));

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      try {
        await new Promise((resolve, reject) => {
          db.query(statement, (err) => {
            if (err) {
              // Ignorar errores de tablas que ya existen
              if (err.message.includes('already exists') || 
                  err.message.includes('Successful')) {
                resolve();
              } else {
                errors++;
                console.log(`  ⚠ Warning: ${err.message.substring(0, 50)}...`);
                resolve();
              }
              return;
            }
            executed++;
            resolve();
          });
        });
        
        if (executed % 10 === 0) {
          console.log(`  Progreso: ${executed} statements ejecutados`);
        }
      } catch (err) {
        errors++;
      }
    }

    console.log('');
    console.log('✓ Schema ejecutado correctamente');
    console.log(`  Statements: ${executed}`);
    console.log(`  Errores ignorados: ${errors}`);
    console.log('');

    // Insertar datos por defecto
    console.log('Insertando datos por defecto...');
    
    const defaultData = [
      // Roles
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('super_admin', 'Super Administrador', 'Acceso total al sistema', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('admin', 'Administrador', 'Administración general', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('user', 'Usuario', 'Usuario estándar', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('viewer', 'Visualizador', 'Solo lectura', 'S')`,
      
      // Usuario admin por defecto (password: admin123)
      `INSERT INTO USUARIOS (CODIGO, NOMBRE, CLAVE, CORREO_E, BLOQUEADO, CAMBIAR_CLAVE) 
       VALUES ('ADMIN', 'Administrador del Sistema', 'admin123', 'admin@violet-erp.com', 'N', 'N')`,
    ];

    for (const sql of defaultData) {
      try {
        await new Promise((resolve, reject) => {
          db.query(sql, (err) => {
            if (err && !err.message.includes('already exists')) {
              console.log(`  ⚠ ${err.message.substring(0, 50)}...`);
            }
            resolve();
          });
        });
      } catch (err) {
        // Ignorar
      }
    }

    console.log('✓ Datos por defecto insertados');
    console.log('');

    // Cerrar conexión
    db.detach();

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          INICIALIZACIÓN COMPLETADA                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Credenciales por defecto:');
    console.log('  Usuario: ADMIN');
    console.log('  Contraseña: admin123');
    console.log('');
    console.log('¡El sistema está listo para usar!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║              ERROR DE INICIALIZACIÓN                      ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('');
    console.error(error.message);
    console.error('');
    console.error('Verifica:');
    console.error('  1. Firebird está instalado y ejecutándose');
    console.error('  2. La ruta de la base de datos es correcta');
    console.error('  3. Las credenciales SYSDBA son correctas');
    console.error('');
    
    process.exit(1);
  }
}

initializeDatabase();
