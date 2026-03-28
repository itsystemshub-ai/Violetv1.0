-- ============================================================================
-- VIOLET ERP - MIGRACIÓN DE DATOS DESDE VALERYPROFESIONAL
-- Basado en scripts originales de ValeryProfesional
-- ============================================================================
-- Uso: isql -user SYSDBA -password masterkey -i migrar_desde_valerypro.sql
-- ============================================================================

SET NAMES UTF8;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- Este script asume que ya existe una base de datos ValeryProfesional
-- en formato Firebird (.FDB o .GDB) desde la cual migrar los datos.
-- 
-- Pasos previos:
-- 1. Tener backup de ValeryProfesional (.fbk)
-- 2. Restaurar backup en una base de datos temporal
-- 3. Ejecutar este script para migrar datos a Violet ERP
-- ============================================================================

-- ============================================================================
-- 1. CONEXIÓN A BASE DE DATOS ORIGINAL (VALERYPRO)
-- ============================================================================

-- Conectar a la base de datos original para extracción
-- CONNECT 'localhost:C:\ValeryProfesional\datos\valery3.fdb'
-- USER 'SYSDBA' PASSWORD 'masterkey';

-- ============================================================================
-- 2. MIGRACIÓN DE CLIENTES
-- ============================================================================

-- Migrar clientes desde ValeryProfesional
INSERT INTO CLIENTES (
    CODIGO, NOMBRE, REFERENCIA, CONTACTO, RIF, NIT,
    DIRECCION, CIUDAD, ESTADO, PAIS, CODIGO_POSTAL,
    TELEFONOS, FAX, CORREO_ELECTRONICO,
    LIMITE_CREDITO, DIAS_CREDITO,
    DENOMINACION_FISCAL, ESTATUS,
    GRUPO_CLIENTES_CODIGO, MUNICIPIO,
    CONTRIBUYENTE_ESPECIAL, TIPO_VENTA, TIPO_CLIENTE,
    CREATED_AT, UPDATED_AT
)
SELECT 
    COALESCE(CODIGO, 'CLI-' || GEN_ID(GEN_CLIENTES, 1)),
    NOMBRE,
    REFERENCIA,
    CONTACTO,
    RIF,
    NIT,
    DIRECCION,
    CIUDAD,
    ESTADO,
    'Venezuela',
    CODIGO_POSTAL,
    TELEFONOS,
    FAX,
    CORREO_ELECTRONICO,
    COALESCE(LIMITE_CREDITO, 0),
    COALESCE(DIAS_CREDITO, 0),
    COALESCE(DENOMINACION_FISCAL, 'CO'),
    COALESCE(ESTATUS, 'A'),
    GRUPO_CLIENTES_CODIGO,
    MUNICIPIO,
    COALESCE(CONTRIBUYENTE_ESPECIAL, 'F'),
    TIPO_VENTA,
    TIPO_CLIENTE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_CLIENTES
WHERE ESTATUS <> 'X';  -- Excluir eliminados

-- Actualizar secuencia
SELECT SET_GENERATOR('GEN_CLIENTES', (
    SELECT MAX(CAST(SUBSTRING(CODIGO FROM 5) AS INTEGER))
    FROM CLIENTES
    WHERE CODIGO STARTING WITH 'CLI-'
)) FROM RDB$DATABASE;

-- ============================================================================
-- 3. MIGRACIÓN DE PROVEEDORES
-- ============================================================================

INSERT INTO PROVEEDORES (
    CODIGO, NOMBRE, REFERENCIA, CONTACTO, RIF, NIT,
    DIRECCION, CIUDAD, ESTADO, PAIS,
    TELEFONOS, FAX, CORREO_ELECTRONICO,
    LIMITE_CREDITO, DIAS_CREDITO,
    DENOMINACION_FISCAL, ESTATUS,
    CONTRIBUYENTE_ESPECIAL,
    CREATED_AT, UPDATED_AT
)
SELECT 
    COALESCE(CODIGO, 'PRO-' || GEN_ID(GEN_PROVEEDORES, 1)),
    NOMBRE,
    REFERENCIA,
    CONTACTO,
    RIF,
    NIT,
    DIRECCION,
    CIUDAD,
    ESTADO,
    'Venezuela',
    TELEFONOS,
    FAX,
    CORREO_ELECTRONICO,
    COALESCE(LIMITE_CREDITO, 0),
    COALESCE(DIAS_CREDITO, 0),
    COALESCE(DENOMINACION_FISCAL, 'CO'),
    COALESCE(ESTATUS, 'A'),
    COALESCE(CONTRIBUYENTE_ESPECIAL, 'F'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_PROVEEDORES
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 4. MIGRACIÓN DE PRODUCTOS
-- ============================================================================

INSERT INTO PRODUCTOS (
    CODIGO, NOMBRE, DESCRIPCION, CODIGO_BARRA, REFERENCIA,
    GRUPO_CODIGO, MARCA_CODIGO, UNIDAD_CODIGO, LINEA_CODIGO,
    PRECIO_COSTO, PRECIO_VENTA,
    ALICUOTA_IVA, EXISTENCIA, STOCK_MINIMO,
    ESTATUS, TIPO,
    CREATED_AT, UPDATED_AT
)
SELECT 
    COALESCE(CODIGO, 'PROD-' || GEN_ID(GEN_PRODUCTOS, 1)),
    NOMBRE,
    DESCRIPCION,
    CODIGO_BARRA,
    REFERENCIA,
    GRUPO_CODIGO,
    MARCA_CODIGO,
    COALESCE(UNIDAD_CODIGO, 'UND'),
    LINEA_CODIGO,
    COALESCE(PRECIO_COSTO, 0),
    COALESCE(PRECIO_VENTA, 0),
    COALESCE(ALICUOTA_IVA, 16),
    COALESCE(EXISTENCIA, 0),
    COALESCE(STOCK_MINIMO, 0),
    COALESCE(ESTATUS, 'A'),
    COALESCE(TIPO, 'P'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_PRODUCTOS
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 5. MIGRACIÓN DE EMPLEADOS
-- ============================================================================

INSERT INTO EMPLEADOS (
    CODIGO, NOMBRE, APELLIDO, CEDULA, RIF,
    FECHA_NACIMIENTO, DIRECCION, TELEFONO, CELULAR,
    CORREO_ELECTRONICO,
    DEPARTAMENTO_CODIGO, CARGO_CODIGO,
    SUELDO_BASE, FECHA_INGRESO,
    ESTATUS, TIPO_PERSONAL,
    DIAS_VACACIONES, CARGAS_FAMILIARES,
    CREATED_AT, UPDATED_AT
)
SELECT 
    COALESCE(CODIGO, 'EMP-' || GEN_ID(GEN_EMPLEADOS, 1)),
    NOMBRE,
    APELLIDO,
    CEDULA,
    RIF,
    FECHA_NACIMIENTO,
    DIRECCION,
    TELEFONO,
    CELULAR,
    CORREO_ELECTRONICO,
    DEPARTAMENTO_CODIGO,
    CARGO_CODIGO,
    COALESCE(SUELDO_BASE, 0),
    FECHA_INGRESO,
    COALESCE(ESTATUS, 'A'),
    COALESCE(TIPO_PERSONAL, 'O'),
    COALESCE(DIAS_VACACIONES, 15),
    COALESCE(CARGAS_FAMILIARES, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_EMPLEADOS
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 6. MIGRACIÓN DE CUENTAS POR COBRAR (CXC)
-- ============================================================================

INSERT INTO CXC (
    CLIENTE_CODIGO, DOCUMENTO, TIPO_DOCUMENTO,
    FECHA, FECHA_VENCIMIENTO,
    TOTAL_OPERACION, TOTAL_BASE_IMPONIBLE, TOTAL_IMPUESTO,
    SALDO, ESTATUS,
    CREATED_AT, UPDATED_AT
)
SELECT 
    CLIENTE_CODIGO,
    DOCUMENTO,
    TIPO_DOCUMENTO,
    FECHA,
    FECHA_VENCIMIENTO,
    COALESCE(TOTAL_OPERACION, 0),
    COALESCE(TOTAL_BASE_IMPONIBLE, 0),
    COALESCE(TOTAL_IMPUESTO, 0),
    COALESCE(SALDO, 0),
    COALESCE(ESTATUS, 'P'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_CXC
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 7. MIGRACIÓN DE CUENTAS POR PAGAR (CXP)
-- ============================================================================

INSERT INTO CXP (
    PROVEEDOR_CODIGO, DOCUMENTO, TIPO_DOCUMENTO,
    FECHA, FECHA_VENCIMIENTO,
    TOTAL_OPERACION, TOTAL_BASE_IMPONIBLE, TOTAL_IMPUESTO,
    SALDO, ESTATUS,
    CREATED_AT, UPDATED_AT
)
SELECT 
    PROVEEDOR_CODIGO,
    DOCUMENTO,
    TIPO_DOCUMENTO,
    FECHA,
    FECHA_VENCIMIENTO,
    COALESCE(TOTAL_OPERACION, 0),
    COALESCE(TOTAL_BASE_IMPONIBLE, 0),
    COALESCE(TOTAL_IMPUESTO, 0),
    COALESCE(SALDO, 0),
    COALESCE(ESTATUS, 'P'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM VALERY_CXP
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 8. MIGRACIÓN DE PLAN DE CUENTAS
-- ============================================================================

INSERT INTO PLAN_CUENTAS (
    CUENTA_CODIGO, CUENTA_NOMBRE, CUENTA_NOMBRE_CORTO,
    CUENTA_TIPO, CUENTA_NATURALEZA, CUENTA_PADRE_CODIGO,
    NIVEL, SALDO_INICIAL,
    ES_MOVIMIENTO, ES_DETALLE, ESTATUS
)
SELECT 
    CUENTA_CODIGO,
    CUENTA_NOMBRE,
    SUBSTRING(CUENTA_NOMBRE FROM 1 FOR 50),
    CUENTA_TIPO,
    CUENTA_NATURALEZA,
    CUENTA_PADRE_CODIGO,
    NIVEL,
    COALESCE(SALDO_INICIAL, 0),
    COALESCE(ES_MOVIMIENTO, 'S'),
    COALESCE(ES_DETALLE, 'S'),
    COALESCE(ESTATUS, 'A')
FROM VALERY_PLAN_CUENTAS
WHERE ESTATUS <> 'X';

-- ============================================================================
-- 9. ACTUALIZAR SALDOS INICIALES
-- ============================================================================

-- Actualizar saldos de clientes
EXECUTE PROCEDURE ACTUALIZAR_SALDO_CLIENTE_ALL;

-- Actualizar saldos de proveedores
EXECUTE PROCEDURE ACTUALIZAR_SALDO_PROVEEDOR_ALL;

-- ============================================================================
-- 10. VERIFICAR MIGRACIÓN
-- ============================================================================

-- Contar registros migrados
SELECT 
    'CLIENTES' AS TABLA, COUNT(*) AS CANTIDAD FROM CLIENTES
UNION ALL
SELECT 'PROVEEDORES', COUNT(*) FROM PROVEEDORES
UNION ALL
SELECT 'PRODUCTOS', COUNT(*) FROM PRODUCTOS
UNION ALL
SELECT 'EMPLEADOS', COUNT(*) FROM EMPLEADOS
UNION ALL
SELECT 'CXC', COUNT(*) FROM CXC
UNION ALL
SELECT 'CXP', COUNT(*) FROM CXP
UNION ALL
SELECT 'PLAN_CUENTAS', COUNT(*) FROM PLAN_CUENTAS;

-- ============================================================================
-- 11. GENERAR REPORTE DE ERRORES
-- ============================================================================

-- Crear tabla de errores de migración
CREATE TABLE MIGRACION_ERRORES (
    CORRELATIVO INTEGER PRIMARY KEY,
    TABLA_ORIGEN VARCHAR(50),
    REGISTRO_ID VARCHAR(50),
    DESCRIPCION_ERROR VARCHAR(255),
    FECHA_ERROR TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

SELECT 'Migración completada. Verificar tabla MIGRACION_ERRORES si hay problemas.' 
AS MENSAJE
FROM RDB$DATABASE;
