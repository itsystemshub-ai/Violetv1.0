-- ============================================================================
-- VIOLET ERP - SCRIPT PRINCIPAL DE CREACIÓN DE BASE DE DATOS
-- Ejecutar en orden después de instalar Firebird 2.5.2
-- ============================================================================
-- Uso: isql -user SYSDBA -password masterkey -i crear_base_de_datos.sql
-- ============================================================================

SET NAMES UTF8;

-- ============================================================================
-- PASO 1: CREAR LA BASE DE DATOS
-- ============================================================================

CREATE DATABASE 'localhost:C:\VIOLET_ERP\VIOLET3.FDB'
USER 'SYSDBA' PASSWORD 'masterkey'
PAGE_SIZE 16384
DEFAULT CHARACTER SET UTF8
COLLATION UNICODE_CI_AI;

-- ============================================================================
-- PASO 2: CREAR ALIAS (OPCIONAL)
-- ============================================================================

-- Agregar al archivo aliases.conf manualmente:
-- violet = C:\VIOLET_ERP\VIOLET3.FDB

-- ============================================================================
-- PASO 3: CREAR USUARIO DE LA APLICACIÓN
-- ============================================================================

-- Nota: Ejecutar esto como SYSDBA después de crear la BD
-- CREATE USER VIOLET_USER PASSWORD 'Violet@2026!'
--   FIRST_NAME 'Violet'
--   LAST_NAME 'ERP'
--   USING PLUGIN Srp;

-- GRANT CONNECT TO VIOLET_USER;

-- ============================================================================
-- PASO 4: EJECUTAR SCHEMAS EN ORDEN
-- ============================================================================

-- Los siguientes scripts deben ejecutarse en orden:

-- 1. Tablas básicas
INPUT 'packages/database/firebird/01_schema_basicas.sql';

-- 2. Ventas y Compras
INPUT 'packages/database/firebird/02_schema_ventas_compras.sql';

-- 3. Banco, Caja y Nómina
INPUT 'packages/database/firebird/03_schema_banco_caja_nomina.sql';

-- 4. Contabilidad
INPUT 'packages/database/firebird/04_schema_contabilidad.sql';

-- 5. Stored Procedures
INPUT 'packages/database/firebird/05_stored_procedures.sql';

-- ============================================================================
-- PASO 5: VERIFICAR CREACIÓN
-- ============================================================================

-- Contar tablas creadas
SELECT COUNT(*) AS TOTAL_TABLAS
FROM RDB$RELATIONS
WHERE RDB$VIEW_BLR IS NULL
  AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0);

-- Contar stored procedures
SELECT COUNT(*) AS TOTAL_PROCEDURES
FROM RDB$PROCEDURES
WHERE (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0);

-- Contar índices de usuario
SELECT COUNT(*) AS TOTAL_INDICES
FROM RDB$INDICES
WHERE RDB$INDEX_TYPE = 0
  AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0);

-- ============================================================================
-- PASO 6: CONFIGURAR PERMISOS
-- ============================================================================

-- Grant de permisos para el usuario de la aplicación
-- GRANT ALL ON CLIENTES TO VIOLET_USER;
-- GRANT ALL ON PROVEEDORES TO VIOLET_USER;
-- GRANT ALL ON PRODUCTOS TO VIOLET_USER;
-- GRANT ALL ON VENTAS TO VIOLET_USER;
-- GRANT ALL ON COMPRAS TO VIOLET_USER;
-- ... (repetir para todas las tablas)

-- ============================================================================
-- FIN DE LA CREACIÓN DE BASE DE DATOS
-- ============================================================================

-- Mensaje de confirmación
SELECT 'Base de datos VIOLET3.FDB creada exitosamente!' AS MENSAJE
FROM RDB$DATABASE;
