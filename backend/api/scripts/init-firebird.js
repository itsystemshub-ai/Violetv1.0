/**
 * Violet ERP - Script de Inicialización de Firebird MEJORADO
 * Conecta, crea schema y datos por defecto
 */

import firebird from 'node-firebird';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  host: process.env.FIREBIRD_HOST || 'localhost',
  port: parseInt(process.env.FIREBIRD_PORT || '3050', 10),
  database: process.env.FIREBIRD_DATABASE || 'localhost:C:/VioletERP/database/valery3.fdb',
  user: process.env.FIREBIRD_USER || 'SYSDBA',
  password: process.env.FIREBIRD_PASSWORD || 'masterkey',
  lowercase_keys: true,
  role: 'RDB$ADMIN',
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeDatabase() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      VIOLET ERP - INICIALIZANDO FIREBIRD                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Conectando a: ${options.host}:${options.port}`);
  console.log(`💾 Base de datos: ${options.database}`);
  console.log('');

  try {
    // Leer schema SQL
    const schemaPath = path.join(__dirname, '../../../database/firebird/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró schema.sql en: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✓ Schema SQL cargado');

    // Conectar a Firebird
    console.log('Conectando a Firebird...');
    
    let db;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        db = await new Promise((resolve, reject) => {
          firebird.attach(options, (err, connection) => {
            if (err) reject(err);
            else resolve(connection);
          });
        });
        console.log('✓ Conectado a Firebird');
        break;
      } catch (err) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⚠ Intento ${attempts}/${maxAttempts} fallido. Reintentando en 2s...`);
          await sleep(2000);
        } else {
          throw new Error(`No se pudo conectar a Firebird después de ${maxAttempts} intentos: ${err.message}`);
        }
      }
    }

    // Ejecutar schema
    console.log('Ejecutando schema...');
    
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('SET TERM'));

    let executed = 0;
    let errors = 0;
    let warnings = 0;

    for (const statement of statements) {
      try {
        await new Promise((resolve, reject) => {
          db.query(statement, (err) => {
            if (err) {
              if (err.message.includes('already exists') || 
                  err.message.includes('Successful') ||
                  err.message.includes('no data found')) {
                warnings++;
                resolve();
              } else {
                errors++;
                console.log(`  ⚠ ${err.message.substring(0, 60)}...`);
                resolve();
              }
              return;
            }
            executed++;
            resolve();
          });
        });
        
        if (executed % 10 === 0) {
          process.stdout.write(`\r  Progreso: ${executed} statements ejecutados`);
        }
      } catch (err) {
        errors++;
      }
    }

    console.log('\r✓ Schema ejecutado correctamente                        ');
    console.log(`  Statements: ${executed}`);
    console.log(`  Advertencias: ${warnings}`);
    console.log(`  Errores ignorados: ${errors}`);
    console.log('');

    // Insertar datos por defecto
    console.log('Insertando datos por defecto...');
    
    // Hashear password admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const defaultData = [
      // Roles
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('super_admin', 'Super Administrador', 'Acceso total al sistema', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('admin', 'Administrador', 'Administración general', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('manager', 'Gerente', 'Gestión de operaciones', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('user', 'Usuario', 'Usuario estándar', 'S')`,
      `INSERT INTO ROLES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) 
       VALUES ('viewer', 'Visualizador', 'Solo lectura', 'S')`,
      
      // Permisos básicos
      `INSERT INTO PERMISOS (PERFIL_CODIGO, PROCESO_CODIGO, INSERTAR, MODIFICAR, ELIMINAR, CONSULTAR, PROCESAR)
       VALUES ('super_admin', 'USUARIOS', 'S', 'S', 'S', 'S', 'S')`,
      `INSERT INTO PERMISOS (PERFIL_CODIGO, PROCESO_CODIGO, INSERTAR, MODIFICAR, ELIMINAR, CONSULTAR, PROCESAR)
       VALUES ('super_admin', 'PRODUCTOS', 'S', 'S', 'S', 'S', 'S')`,
      `INSERT INTO PERMISOS (PERFIL_CODIGO, PROCESO_CODIGO, INSERTAR, MODIFICAR, ELIMINAR, CONSULTAR, PROCESAR)
       VALUES ('super_admin', 'VENTAS', 'S', 'S', 'S', 'S', 'S')`,
      `INSERT INTO PERMISOS (PERFIL_CODIGO, PROCESO_CODIGO, INSERTAR, MODIFICAR, ELIMINAR, CONSULTAR, PROCESAR)
       VALUES ('admin', 'USUARIOS', 'S', 'S', 'N', 'S', 'S')`,
      `INSERT INTO PERMISOS (PERFIL_CODIGO, PROCESO_CODIGO, INSERTAR, MODIFICAR, ELIMINAR, CONSULTAR, PROCESAR)
       VALUES ('admin', 'PRODUCTOS', 'S', 'S', 'N', 'S', 'S')`,
      
      // Usuario admin por defecto
      `INSERT INTO USUARIOS (CODIGO, NOMBRE, CLAVE, CORREO_E, BLOQUEADO, CAMBIAR_CLAVE) 
       VALUES ('ADMIN', 'Administrador del Sistema', '${hashedPassword}', 'admin@violet-erp.com', 'N', 'N')`,
       
      // Configuración del sistema
      `INSERT INTO SISTEMA_CONFIG (CLAVE, VALOR, DESCRIPCION)
       VALUES ('EMPRESA_NOMBRE', 'Violet ERP', 'Nombre de la empresa')`,
      `INSERT INTO SISTEMA_CONFIG (CLAVE, VALOR, DESCRIPCION)
       VALUES ('MONEDA_LOCAL', 'DOP', 'Moneda local')`,
      `INSERT INTO SISTEMA_CONFIG (CLAVE, VALOR, DESCRIPCION)
       VALUES ('IMPUESTO_TASA', '18', 'Tasa de impuesto (%)')`,
    ];

    let inserted = 0;
    
    for (const sql of defaultData) {
      try {
        await new Promise((resolve, reject) => {
          db.query(sql, (err) => {
            if (err && !err.message.includes('already exists')) {
              console.log(`  ⚠ ${err.message.substring(0, 50)}...`);
            } else {
              inserted++;
            }
            resolve();
          });
        });
      } catch (err) {
        // Ignorar
      }
    }

    console.log('✓ Datos por defecto insertados');
    console.log(`  Registros: ${inserted}`);
    console.log('');

    // Cerrar conexión
    db.detach();

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          INICIALIZACIÓN COMPLETADA                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('💜 Credenciales por defecto:');
    console.log('   Email:    admin@violet-erp.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🚀 ¡El sistema está listo para usar!');
    console.log('');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:3000');
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
    console.error('📋 Verifica:');
    console.error('   1. Firebird está instalado y ejecutándose');
    console.error('   2. La ruta de la base de datos es correcta en .env');
    console.error('   3. Las credenciales SYSDBA son correctas');
    console.error('   4. El archivo database/firebird/schema.sql existe');
    console.error('');
    console.error('💡 Ejecuta: .\\configure-firebird.ps1 para configurar automáticamente');
    console.error('');
    
    process.exit(1);
  }
}

initializeDatabase();
