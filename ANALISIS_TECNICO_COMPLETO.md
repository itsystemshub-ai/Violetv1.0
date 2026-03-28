# 🟣 VALERYPRO / VIOLET - Análisis Técnico Completo del Sistema ERP

## Documentación Técnica para Construir un ERP Idéntico

**Versión del Documento:** 1.0.0  
**Fecha:** 27 de Marzo de 2026  
**Sistema Analizado:** ValeryPro 7.1.77 / Violet 1.0.0  
**Base de Datos:** Firebird 2.5.2  

---

# 📋 ÍNDICE GENERAL

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulos del ERP](#3-módulos-del-erp)
4. [Base de Datos - Esquema Completo](#4-base-de-datos---esquema-completo)
5. [Funcionalidades Detalladas por Módulo](#5-funcionalidades-detalladas-por-módulo)
6. [Sistema Fiscal Venezolano](#6-sistema-fiscal-venezolano)
7. [Reportes del Sistema](#7-reportes-del-sistema)
8. [Flujos de Trabajo](#8-flujos-de-trabajo)
9. [Reglas de Negocio](#9-reglas-de-negocio)
10. [APIs e Integraciones](#10-apis-e-integraciones)
11. [Guía de Implementación](#11-guía-de-implementación)

---

# 1. RESUMEN EJECUTIVO

## 1.1 Descripción del Sistema

ValeryPro/Violet es un **ERP (Enterprise Resource Planning)** completo diseñado específicamente para el mercado venezolano, con las siguientes características:

- **Tipo:** Sistema Administrativo-Contable
- **Mercado:** Venezuela (adaptado a normativa fiscal venezolana)
- **Base de Datos:** Firebird SQL 2.5.2
- **Arquitectura:** Cliente-Servidor
- **Módulos:** 13 módulos principales
- **Reportes:** 89 plantillas de reportes
- **Usuarios:** Multi-usuario con perfiles y permisos

## 1.2 Módulos Principales

| # | Módulo | Descripción | Prioridad |
|---|--------|-------------|-----------|
| 1 | **Clientes (CXC)** | Gestión de clientes y cuentas por cobrar | 🔴 ALTA |
| 2 | **Proveedores (CXP)** | Gestión de proveedores y cuentas por pagar | 🔴 ALTA |
| 3 | **Productos** | Catálogo de productos y servicios | 🔴 ALTA |
| 4 | **Ventas** | Facturación y gestión de ventas | 🔴 ALTA |
| 5 | **Compras** | Gestión de compras a proveedores | 🔴 ALTA |
| 6 | **Inventario** | Control de existencias y almacenes | 🔴 ALTA |
| 7 | **Banco** | Conciliación y movimientos bancarios | 🟡 MEDIA |
| 8 | **Caja** | Ingresos, egresos y cierre de caja | 🟡 MEDIA |
| 9 | **Nómina** | Gestión de empleados y pagos | 🟡 MEDIA |
| 10 | **Contabilidad** | Plan de cuentas y asientos | 🟡 MEDIA |
| 11 | **Reportes** | Generación de reportes gerenciales | 🟢 BAJA |
| 12 | **Usuarios** | Gestión de usuarios y permisos | 🟢 BAJA |
| 13 | **Configuración** | Parámetros del sistema | 🟢 BAJA |

## 1.3 Estadísticas del Sistema

```
📊 ARCHIVOS TOTALES: 1,200+
├── 📁 Scripts SQL: 462 (25 migración + 437 actualizaciones)
├── 📑 Plantillas Reportes: 89 (.RTM)
├── 📄 Plantillas Excel: 13 (.XLSX)
├── 🔧 DLLs del Sistema: 16
├── 🖨️ Drivers Fiscales: 9
└── ⚙️ UDFs Firebird: 5
```

---

# 2. ARQUITECTURA DEL SISTEMA

## 2.1 Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Windows    │ │  Windows    │ │  Windows    │       │
│  │  Forms/Delphi│ │  Forms/Delphi│ │  Forms/Delphi│       │
│  │  (ValeryPro)│ │  (ValeryPro)│ │  (ValeryPro)│       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE NEGOCIO                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Reglas de Negocio                              │    │
│  │  • Validaciones                                 │    │
│  │  • Cálculos (IVA, Retenciones, IGTF)            │    │
│  │  • Flujos de Trabajo                            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Firebird SQL 2.5.2                             │    │
│  │  • Tablas (100+)                                │    │
│  │  • Triggers (200+)                              │    │
│  │  • Stored Procedures (50+)                      │    │
│  │  • UDFs Personalizadas                          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 2.2 Componentes del Sistema

### 2.2.1 Ejecutables Principales

| Archivo | Función | Descripción |
|---------|---------|-------------|
| `VioletPro.exe` | Principal | Ejecutable principal del sistema |
| `VioletProVDK.exe` | Con VDK | Versión con Virtual Data Kernel |
| `Violet2Violet3.exe` | Migrador | Migración de versión 2 a 3 |
| `unins000.exe` | Desinstalador | Elimina el sistema |

### 2.2.2 Librerías DLL

| DLL | Función | Uso |
|-----|---------|-----|
| `libeay32.DLL` | OpenSSL | Criptografía y SSL |
| `ssleay32.DLL` | OpenSSL | Protocolo SSL/TLS |
| `zlib1.DLL` | ZLIB | Compresión de datos |
| `XCDZIP32.DLL` | ZIP | Compresión ZIP |
| `XCDUNZ32.DLL` | UNZIP | Descompresión ZIP |
| `OnlineDll.DLL` | Online | Funcionalidades en línea |
| `Respaldo.DLL` | Backup | Sistema de respaldos |

### 2.2.3 Drivers Fiscales

| Driver | Fabricante | Modelos Soportados |
|--------|------------|-------------------|
| `BemaFI32.dll` | Bematech | MP-20 FI, MP-40 FI, MP-2000 FI, MP-6000 FI |
| `rigazsaNetsoft.dll` | Rigazsa | Impresoras con IGTF |
| `tfhkaif.dll` | Varios | Varios modelos |
| `winfis32.dll` | Varios | Varios modelos |

---

# 3. MÓDULOS DEL ERP

## 3.1 Módulo de Clientes (CXC)

### 3.1.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         GESTIÓN DE CLIENTES (CXC)        │
├─────────────────────────────────────────┤
│ ✓ Registro de clientes                  │
│ ✓ Clasificación (Ordinario/Especial/Formal) │
│ ✓ Límites de crédito                    │
│ ✓ Control de saldo                      │
│ ✓ Historial de compras                  │
│ ✓ Retenciones de IVA                    │
│ ✓ Retenciones municipales               │
│ ✓ Grupos de clientes                    │
│ ✓ Listas de precios por cliente         │
│ ✓ Zonas de venta                        │
│ ✓ Vendedores asignados                  │
│ ✓ Comisiones                            │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.1.2 Tablas Principales

```sql
-- Tabla: CLIENTES
CREATE TABLE CLIENTES (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    REFERENCIA VARCHAR(20),
    CONTACTO VARCHAR(50),
    VENDEDOR_CODIGO VARCHAR(15),
    ZONA_VENTA_CODIGO VARCHAR(15),
    LISTA_PRECIOS_CODIGO VARCHAR(15),
    CUENTA_CONTABLE VARCHAR(22),
    RIF VARCHAR(20) NOT NULL,
    NIT VARCHAR(20),
    DIRECCION VARCHAR(160),
    CIUDAD VARCHAR(40),
    ESTADO VARCHAR(40),
    PAIS VARCHAR(40),
    CODIGO_POSTAL VARCHAR(10),
    TELEFONOS VARCHAR(40),
    FAX VARCHAR(40),
    CORREO_ELECTRONICO VARCHAR(60),
    LIMITE_CREDITO DECIMAL(18,2) DEFAULT 0,
    DIAS_CREDITO SMALLINT DEFAULT 0,
    CREDITO_DISPONIBLE DECIMAL(18,2),
    TOTAL_DEBITOS DECIMAL(18,2),
    TOTAL_CREDITOS DECIMAL(18,2),
    TOTAL_ANTICIPOS DECIMAL(18,2),
    TOTAL_SALDO DECIMAL(18,2),
    DENOMINACION_FISCAL VARCHAR(2),
    PRECIO_VENTA CHAR(1),
    RETENCION DECIMAL(5,2) DEFAULT 0,
    DESCUENTO DECIMAL(5,2) DEFAULT 0,
    EDITAR_DATOS_FISCALES CHAR(1) DEFAULT 'F',
    ACEPTAR_CHEQUE CHAR(1) DEFAULT 'F',
    REQUIERE_CLAVE CHAR(1) DEFAULT 'F',
    NOTAS VARCHAR(120),
    MAXIMO_MONTO_VENTA DECIMAL(18,2),
    MAXIMO_CREDITO DECIMAL(18,2),
    ULTIMA_VENTA_CONTADO TIMESTAMP,
    MONTO_ULTIMA_VENTA_CONTADO DECIMAL(18,2),
    ULTIMA_VENTA_CREDITO TIMESTAMP,
    MONTO_ULTIMA_VENTA_CREDITO DECIMAL(18,2),
    ULTIMO_PAGO TIMESTAMP,
    MONTO_ULTIMO_PAGO DECIMAL(18,2),
    ESTATUS CHAR(1) DEFAULT 'A',
    FECHA_INICIO DATE,
    GRUPO_CLIENTES_CODIGO VARCHAR(15),
    MUNICIPIO VARCHAR(40),
    CONTRIBUYENTE_ESPECIAL CHAR(1) DEFAULT 'F',
    TIPO_VENTA CHAR(2),
    TIPO_CLIENTE CHAR(2),
    DV VARCHAR(2)  -- Dígito verificador (Panamá)
);

-- Tabla: GRUPO_CLIENTES
CREATE TABLE GRUPO_CLIENTES (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL
);

-- Tabla: ZONAS_VENTAS
CREATE TABLE ZONAS_VENTAS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    REFERENCIA VARCHAR(20)
);

-- Tabla: CXC (Cuentas por Cobrar)
CREATE TABLE CXC (
    CORRELATIVO INTEGER PRIMARY KEY,
    CLIENTE_CODIGO VARCHAR(15) NOT NULL,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_DOCUMENTO CHAR(3),
    FECHA DATE NOT NULL,
    FECHA_VENCIMIENTO DATE,
    TOTAL_OPERACION DECIMAL(18,2),
    TOTAL_BASE_IMPONIBLE DECIMAL(18,2),
    TOTAL_IMPUESTO DECIMAL(18,2),
    SALDO DECIMAL(18,2),
    ESTATUS CHAR(1) DEFAULT 'P'
);

-- Tabla: CXC_DESGLOSE_IMPUESTO
CREATE TABLE CXC_DESGLOSE_IMPUESTO (
    CORRELATIVO INTEGER,
    ALICUOTA DECIMAL(5,2),
    BASE_IMPONIBLE DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2)
);
```

### 3.1.3 Reglas de Negocio

1. **Validación de RIF:**
   - Formato: V-XXXXXXXX-X, J-XXXXXXXX-X, G-XXXXXXXX-X
   - Debe ser único en el sistema

2. **Límite de Crédito:**
   - Se calcula: `Crédito Disponible = Límite Crédito - Saldo Actual`
   - Bloqueo automático si excede el límite

3. **Tipo de Contribuyente:**
   - **ORDINARIO:** Sin retenciones especiales
   - **ESPECIAL:** Agente de retención (IVA, ISLR)
   - **FORMAL:** Contribuyente formal simplificado

4. **Denominación Fiscal:**
   - **CO:** Común
   - **GB:** Gran Contribuyente
   - **NO:** No contribuyente

---

## 3.2 Módulo de Proveedores (CXP)

### 3.2.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│       GESTIÓN DE PROVEEDORES (CXP)       │
├─────────────────────────────────────────┤
│ ✓ Registro de proveedores               │
│ ✓ Clasificación fiscal                  │
│ ✓ Límites de crédito                    │
│ ✓ Control de saldo                      │
│ ✓ Historial de compras                  │
│ ✓ Retenciones de IVA                    │
│ ✓ Retenciones de ISLR                   │
│ ✓ Retenciones municipales               │
│ ✓ Tiempos de pago                       │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.2.2 Tablas Principales

```sql
-- Tabla: PROVEEDORES
CREATE TABLE PROVEEDORES (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    REFERENCIA VARCHAR(20),
    CONTACTO VARCHAR(50),
    LISTA_PRECIOS_CODIGO VARCHAR(15),
    CUENTA_CONTABLE VARCHAR(22),
    RIF VARCHAR(20) NOT NULL,
    NIT VARCHAR(20),
    DIRECCION VARCHAR(160),
    CIUDAD VARCHAR(40),
    ESTADO VARCHAR(40),
    PAIS VARCHAR(40),
    TELEFONOS VARCHAR(40),
    FAX VARCHAR(40),
    CORREO_ELECTRONICO VARCHAR(60),
    LIMITE_CREDITO DECIMAL(18,2),
    DIAS_CREDITO SMALLINT,
    CREDITO_DISPONIBLE DECIMAL(18,2),
    TOTAL_DEBITOS DECIMAL(18,2),
    TOTAL_CREDITOS DECIMAL(18,2),
    TOTAL_SALDO DECIMAL(18,2),
    DENOMINACION_FISCAL VARCHAR(2),
    RETENCION_IVA DECIMAL(5,2),
    RETENCION_ISLR DECIMAL(5,2),
    ESTATUS CHAR(1) DEFAULT 'A',
    CONTRIBUYENTE_ESPECIAL CHAR(1) DEFAULT 'F'
);

-- Tabla: CXP (Cuentas por Pagar)
CREATE TABLE CXP (
    CORRELATIVO INTEGER PRIMARY KEY,
    PROVEEDOR_CODIGO VARCHAR(15) NOT NULL,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_DOCUMENTO CHAR(3),
    FECHA DATE NOT NULL,
    FECHA_VENCIMIENTO DATE,
    TOTAL_OPERACION DECIMAL(18,2),
    TOTAL_BASE_IMPONIBLE DECIMAL(18,2),
    TOTAL_IMPUESTO DECIMAL(18,2),
    SALDO DECIMAL(18,2),
    ESTATUS CHAR(1) DEFAULT 'P'
);
```

---

## 3.3 Módulo de Productos

### 3.3.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         GESTIÓN DE PRODUCTOS             │
├─────────────────────────────────────────┤
│ ✓ Catálogo de productos                 │
│ ✓ Códigos de barra (EAN8, EAN13)        │
│ ✓ Múltiples precios (7 listas)          │
│ ✓ Control de inventario                 │
│ ✓ Stock mínimo/máximo                   │
│ ✓ Productos compuestos                  │
│ ✓ Servicios                             │
│ ✓ Unidades de medida                    │
│ ✓ Depósitos/Almacenes                   │
│ ✓ Costos (último, promedio)             │
│ ✓ Alicuota de IVA                       │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.3.2 Tablas Principales

```sql
-- Tabla: PRODUCTOS
CREATE TABLE PRODUCTOS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    DESCRIPCION VARCHAR(255),
    CODIGO_BARRA VARCHAR(50),
    REFERENCIA VARCHAR(20),
    GRUPO_CODIGO VARCHAR(15),
    MARCA_CODIGO VARCHAR(15),
    UNIDAD_CODIGO VARCHAR(15),
    LINEA_CODIGO VARCHAR(15),
    DEPOSITO_CODIGO VARCHAR(15),
    CUENTA_CONTABLE VARCHAR(22),
    PRECIO_COSTO DECIMAL(18,4),
    PRECIO_VENTA DECIMAL(18,4),
    PRECIO_MAYOR DECIMAL(18,4),
    PRECIO_OFERTA DECIMAL(18,4),
    PRECIO_MINIMO DECIMAL(18,4),
    PRECIO_MAXIMO DECIMAL(18,4),
    ALICUOTA_IVA DECIMAL(5,2) DEFAULT 16,
    EXISTENCIA DECIMAL(18,4) DEFAULT 0,
    STOCK_MINIMO DECIMAL(18,4) DEFAULT 0,
    STOCK_MAXIMO DECIMAL(18,4),
    ESTATUS CHAR(1) DEFAULT 'A',
    TIPO CHAR(1) DEFAULT 'P',  -- P=Producto, S=Servicio, C=Compuesto
    REQUIERE_SERIAL CHAR(1) DEFAULT 'F',
    CONTROLA_LOTE CHAR(1) DEFAULT 'F',
    FECHA_VENCIMIENTO DATE,
    PESO DECIMAL(18,4),
    VOLUMEN DECIMAL(18,4),
    LARGO DECIMAL(18,4),
    ANCHO DECIMAL(18,4),
    ALTO DECIMAL(18,4)
);

-- Tabla: PRODUCTOS_COMPOSICION
CREATE TABLE PRODUCTOS_COMPOSICION (
    PRODUCTO_PADRE_CODIGO VARCHAR(15),
    PRODUCTO_HIJO_CODIGO VARCHAR(15),
    CANTIDAD DECIMAL(18,4) NOT NULL,
    UNIDAD_CODIGO VARCHAR(15),
    PRIMARY KEY (PRODUCTO_PADRE_CODIGO, PRODUCTO_HIJO_CODIGO)
);

-- Tabla: UNIDADES
CREATE TABLE UNIDADES (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    ABREVIATURA VARCHAR(10)
);

-- Tabla: DEPOSITOS
CREATE TABLE DEPOSITOS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    DIRECCION VARCHAR(255),
    TELEFONO VARCHAR(40),
    ESTATUS CHAR(1) DEFAULT 'A'
);

-- Tabla: EXISTENCIAS
CREATE TABLE EXISTENCIAS (
    PRODUCTO_CODIGO VARCHAR(15),
    DEPOSITO_CODIGO VARCHAR(15),
    CANTIDAD DECIMAL(18,4) DEFAULT 0,
    COSTO_PROMEDIO DECIMAL(18,4),
    ULTIMA_COMPRA DATE,
    ULTIMA_VENTA DATE,
    PRIMARY KEY (PRODUCTO_CODIGO, DEPOSITO_CODIGO)
);
```

---

## 3.4 Módulo de Ventas

### 3.4.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│           GESTIÓN DE VENTAS              │
├─────────────────────────────────────────┤
│ ✓ Facturación (Fiscal y No Fiscal)      │
│ ✓ Múltiples tipos de documento          │
│ ✓ Cálculo automático de impuestos       │
│ ✓ Retenciones de IVA                    │
│ ✓ IGTF (3%)                             │
│ ✓ Múltiples formas de pago              │
│ ✓ Control de crédito                    │
│ ✓ Serialización de productos            │
│ ✓ Lotes y vencimientos                  │
│ ✓ Notas de crédito/débito               │
│ ✓ Devoluciones                          │
│ ✓ Pedidos y presupuestos                │
│ ✓ Órdenes de despacho                   │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.4.2 Tipos de Documentos de Venta

| Código | Tipo | Descripción | Afecta Inventario |
|--------|------|-------------|-------------------|
| `FAC` | Factura | Factura fiscal | ✅ Sí |
| `FCR` | Factura Crédito | Factura a crédito | ✅ Sí |
| `NCR` | Nota Crédito | Devolución/Saldo a favor | ✅ Sí |
| `NDB` | Nota Débito | Cargo adicional | ✅ Sí |
| `PED` | Pedido | Pedido de cliente | ❌ No |
| `ODD` | Orden Despacho | Orden de entrega | ❌ No |
| `PRS` | Presupuesto | Cotización | ❌ No |
| `NET` | Nota Entrega | Entrega parcial | ✅ Sí |
| `FPV` | Factura PV | Factura punto de venta | ✅ Sí |

### 3.4.3 Tablas Principales

```sql
-- Tabla: VENTAS (Encabezado)
CREATE TABLE VENTAS (
    CORRELATIVO INTEGER PRIMARY KEY,
    CORRELATIVO_CODIGO SMALLINT,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_DOCUMENTO CHAR(3) NOT NULL,
    CLIENTE_CODIGO VARCHAR(15) NOT NULL,
    CLIENTE_NOMBRE VARCHAR(160),
    CLIENTE_RIF VARCHAR(20),
    CLIENTE_NIT VARCHAR(20),
    CLIENTE_CONTACTO VARCHAR(50),
    CLIENTE_DIRECCION VARCHAR(160),
    CLIENTE_TELEFONOS VARCHAR(40),
    CLIENTE_FAX VARCHAR(40),
    CLIENTE_CORREO_E VARCHAR(60),
    CLIENTE_ZONA VARCHAR(15),
    CLIENTE_TIPO_PRECIO CHAR(1),
    DENOMINACION_FISCAL VARCHAR(2),
    MONEDA_CODIGO VARCHAR(15),
    FACTOR_CAMBIO DECIMAL(18,6) DEFAULT 1,
    FECHA_EMISION DATE NOT NULL,
    HORA_EMISION TIME,
    DIAS_VENCIMIENTO SMALLINT DEFAULT 0,
    FECHA_VENCIMIENTO DATE,
    DEPOSITO_CODIGO VARCHAR(15),
    VENDEDOR_CODIGO VARCHAR(15),
    ORDEN_DE_COMPRA VARCHAR(10),
    FECHA_ORDEN_COMPRA DATE,
    RETENCION DECIMAL(18,2) DEFAULT 0,
    CONTADO DECIMAL(18,2) DEFAULT 0,
    CREDITO DECIMAL(18,2) DEFAULT 0,
    ANTICIPO DECIMAL(18,2) DEFAULT 0,
    TOTAL_CANCELADO DECIMAL(18,2),
    VUELTO DECIMAL(18,2) DEFAULT 0,
    TOTAL_BRUTO_LINEAS DECIMAL(18,2),
    TOTAL_DESCUENTO_LINEAS DECIMAL(18,2),
    TOTAL_NETO_LINEAS DECIMAL(18,2),
    TOTAL_IMPUESTO_LINEAS DECIMAL(18,2),
    TOTAL_LINEAS DECIMAL(18,2),
    DESCUENTO_1 DECIMAL(18,2) DEFAULT 0,
    PORC_DESCUENTO_1 DECIMAL(5,2) DEFAULT 0,
    DESCUENTO_2 DECIMAL(18,2) DEFAULT 0,
    PORC_DESCUENTO_2 DECIMAL(5,2) DEFAULT 0,
    FLETE DECIMAL(18,2) DEFAULT 0,
    PORC_FLETE DECIMAL(5,2) DEFAULT 0,
    TOTAL_NETO DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2),
    PORC_IMPUESTO DECIMAL(5,2) DEFAULT 16,
    TOTAL_IMPUESTO_MUNICIPAL DECIMAL(18,2) DEFAULT 0,
    TOTAL_IMPUESTO_ADICIONAL DECIMAL(18,2) DEFAULT 0,
    TOTAL_OPERACION DECIMAL(18,2),
    TOTAL_BASE_IMPONIBLE_LINEAS DECIMAL(18,2),
    TOTAL_IMPUESTO_FISCAL_LINEAS DECIMAL(18,2),
    TOTAL_EXENTO_LINEAS DECIMAL(18,2),
    TOTAL_BASE_IMPONIBLE DECIMAL(18,2),
    TOTAL_IMPUESTO_FISCAL DECIMAL(18,2),
    TOTAL_EXENTO DECIMAL(18,2),
    TOTAL_COSTO DECIMAL(18,2),
    ESTACION VARCHAR(30),
    USUARIO_CODIGO VARCHAR(15),
    TEMPORAL CHAR(1) DEFAULT 'F',
    ASIGNAR_COSTO DECIMAL(18,2),
    PORC_RETENCION DECIMAL(5,2),
    CORRELATIVO_CXC INTEGER,
    MOTIVO_CODIGO VARCHAR(15),
    TOTAL_COSTO_PROMEDIO DECIMAL(18,2),
    IMPUESTO_IVA_CODIGO VARCHAR(15),
    TOTAL_RETENCION_IVA DECIMAL(18,2) DEFAULT 0,
    PORC_RETENCION_IVA DECIMAL(5,2) DEFAULT 75,
    DOCUMENTO_RETENCION_IVA VARCHAR(20),
    CONTROL_INTERNO CHAR(2),
    DOCUMENTO_NCR VARCHAR(10),
    NUMERO_CONTROL VARCHAR(10),
    FECHA_RECEPCION_RTP DATE,
    FECHA_HORA_IMPRESION TIMESTAMP,
    FECHA_Y_HORA TIMESTAMP,
    TOTAL_IMPUESTO_AL_LICOR DECIMAL(18,2) DEFAULT 0,
    FECHA_HORA_REGISTRO TIMESTAMP,
    TOTAL_COSTO_IMP DECIMAL(18,2),
    TOTAL_COSTO_PROMEDIO_IMP DECIMAL(18,2),
    TOTAL_CANTIDAD_ITEMS DECIMAL(18,4),
    TOTAL_ITEMS INTEGER,
    TIPO_TRANSACCION VARCHAR(15),
    ESTATUS CHAR(1) DEFAULT 'R',  -- R=Registrada, A=Anulada
    IMPACTA_INVENTARIO CHAR(1) DEFAULT 'S',
    IMPACTA_CONTABILIDAD CHAR(1) DEFAULT 'S'
);

-- Tabla: VENTAS_DESGLOSE (Detalle)
CREATE TABLE VENTAS_DESGLOSE (
    CORRELATIVO INTEGER,
    CODIGO INTEGER,
    TIPO_REGISTRO CHAR(1) DEFAULT 'P',
    PRODUCTO_CODIGO VARCHAR(15),
    PRODUCTO_NOMBRE VARCHAR(160),
    PRODUCTO_DESCRIPCION VARCHAR(255),
    PRODUCTO_REFERENCIA VARCHAR(20),
    CANTIDAD DECIMAL(18,4) NOT NULL,
    UNIDAD_CODIGO VARCHAR(15),
    PRECIO DECIMAL(18,6) NOT NULL,
    PORC_DESCUENTO DECIMAL(5,2) DEFAULT 0,
    DESCUENTO DECIMAL(18,2) DEFAULT 0,
    BRUTO DECIMAL(18,2),
    NETO DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2),
    TOTAL DECIMAL(18,2),
    COSTO DECIMAL(18,4),
    COSTO_PROMEDIO DECIMAL(18,4),
    ALICUOTA_IVA DECIMAL(5,2) DEFAULT 16,
    IMPUESTO_IVA_CODIGO VARCHAR(15),
    EXENTO CHAR(1) DEFAULT 'F',
    IMPUESTO_MUNICIPAL DECIMAL(18,2) DEFAULT 0,
    IMPUESTO_ADICIONAL DECIMAL(18,2) DEFAULT 0,
    SERIAL VARCHAR(50),
    LOTE VARCHAR(50),
    FECHA_VENCIMIENTO DATE,
    DEPOSITO_CODIGO VARCHAR(15),
    ORDEN INTEGER,
    PRIMARY KEY (CORRELATIVO, CODIGO)
);

-- Tabla: VENTAS_DESGLOSE_IMPUESTO
CREATE TABLE VENTAS_DESGLOSE_IMPUESTO (
    CORRELATIVO INTEGER,
    CODIGO INTEGER,
    ALICUOTA DECIMAL(5,2),
    BASE_IMPONIBLE DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2),
    EXENTO CHAR(1),
    PRIMARY KEY (CORRELATIVO, CODIGO, ALICUOTA)
);
```

### 3.4.4 Cálculos de Impuestos

#### IVA (Impuesto al Valor Agregado)

```
Base Imponible = Total Neto Líneas - Descuentos
Impuesto IVA = Base Imponible × (Alícuota / 100)
Total Operación = Base Imponible + Impuesto IVA
```

#### Retención de IVA

```
Para Contribuyentes Especiales:
Retención IVA = Impuesto IVA × (Porcentaje Retención / 100)
Porcentaje Retención = 75% (ordinario), 100% (especial)
```

#### IGTF (Impuesto a las Grandes Transacciones Financieras)

```
Para pagos en divisas:
IGTF = Total Operación × 3%
```

---

## 3.5 Módulo de Compras

### 3.5.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│          GESTIÓN DE COMPRAS              │
├─────────────────────────────────────────┤
│ ✓ Órdenes de compra                     │
│ ✓ Recepción de mercancía                │
│ ✓ Facturas de compra                    │
│ ✓ Cálculo de impuestos                  │
│ ✓ Retenciones de IVA                    │
│ ✓ Retenciones de ISLR                   │
│ ✓ Control de costos                     │
│ ✓ Actualización de inventario           │
│ ✓ Notas de crédito/débito               │
│ ✓ Devoluciones a proveedores            │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.5.2 Tablas Principales

```sql
-- Tabla: COMPRAS (Encabezado)
CREATE TABLE COMPRAS (
    CORRELATIVO INTEGER PRIMARY KEY,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_DOCUMENTO CHAR(3) NOT NULL,
    PROVEEDOR_CODIGO VARCHAR(15) NOT NULL,
    PROVEEDOR_NOMBRE VARCHAR(160),
    PROVEEDOR_RIF VARCHAR(20),
    FECHA_DOCUMENTO DATE NOT NULL,
    FECHA_REGISTRO DATE NOT NULL,
    FECHA_VENCIMIENTO DATE,
    DEPOSITO_CODIGO VARCHAR(15),
    MONEDA_CODIGO VARCHAR(15),
    FACTOR_CAMBIO DECIMAL(18,6) DEFAULT 1,
    TOTAL_BRUTO_LINEAS DECIMAL(18,2),
    TOTAL_DESCUENTO_LINEAS DECIMAL(18,2),
    TOTAL_NETO_LINEAS DECIMAL(18,2),
    TOTAL_IMPUESTO_LINEAS DECIMAL(18,2),
    TOTAL_LINEAS DECIMAL(18,2),
    TOTAL_NETO DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2),
    TOTAL_OPERACION DECIMAL(18,2),
    TOTAL_BASE_IMPONIBLE DECIMAL(18,2),
    TOTAL_IMPUESTO_FISCAL DECIMAL(18,2),
    TOTAL_EXENTO DECIMAL(18,2),
    TOTAL_COSTO DECIMAL(18,2),
    TOTAL_RETENCION_IVA DECIMAL(18,2) DEFAULT 0,
    TOTAL_RETENCION_ISLR DECIMAL(18,2) DEFAULT 0,
    ESTATUS CHAR(1) DEFAULT 'R',
    USUARIO_CODIGO VARCHAR(15),
    ESTACION VARCHAR(30)
);

-- Tabla: COMPRAS_DESGLOSE (Detalle)
CREATE TABLE COMPRAS_DESGLOSE (
    CORRELATIVO INTEGER,
    CODIGO INTEGER,
    PRODUCTO_CODIGO VARCHAR(15),
    PRODUCTO_NOMBRE VARCHAR(160),
    CANTIDAD DECIMAL(18,4) NOT NULL,
    UNIDAD_CODIGO VARCHAR(15),
    PRECIO DECIMAL(18,6) NOT NULL,
    PORC_DESCUENTO DECIMAL(5,2) DEFAULT 0,
    DESCUENTO DECIMAL(18,2) DEFAULT 0,
    BRUTO DECIMAL(18,2),
    NETO DECIMAL(18,2),
    IMPUESTO DECIMAL(18,2),
    TOTAL DECIMAL(18,2),
    COSTO DECIMAL(18,4),
    ALICUOTA_IVA DECIMAL(5,2) DEFAULT 16,
    EXENTO CHAR(1) DEFAULT 'F',
    SERIAL VARCHAR(50),
    LOTE VARCHAR(50),
    FECHA_VENCIMIENTO DATE,
    DEPOSITO_CODIGO VARCHAR(15),
    PRIMARY KEY (CORRELATIVO, CODIGO)
);
```

---

## 3.6 Módulo de Inventario

### 3.6.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         CONTROL DE INVENTARIO            │
├─────────────────────────────────────────┤
│ ✓ Control de existencias                │
│ ✓ Múltiples depósitos                   │
│ ✓ Kárdex valorizado                     │
│ ✓ Costeo promedio                       │
│ ✓ Serialización                         │
│ ✓ Lotes y vencimientos                  │
│ ✓ Ajustes de inventario                 │
│ ✓ Transferencias entre depósitos        │
│ ✓ Inventarios físicos                   │
│ ✓ Alertas de stock mínimo               │
│ ✓ Auditoría de movimientos              │
└─────────────────────────────────────────┘
```

### 3.6.2 Tipos de Operaciones de Inventario

| Código | Tipo | Afecta Costo | Descripción |
|--------|------|--------------|-------------|
| `ENT` | Entrada | ✅ Sí | Compra, devolución, ajuste positivo |
| `SAL` | Salida | ✅ Sí | Venta, consumo, ajuste negativo |
| `TRA` | Traspaso | ❌ No | Movimiento entre depósitos |
| `AJU` | Ajuste | ✅ Sí | Corrección de inventario |
| `INV` | Inventario | ✅ Sí | Conteo físico |

### 3.6.3 Tablas Principales

```sql
-- Tabla: MOVIMIENTOS_INVENTARIO
CREATE TABLE MOVIMIENTOS_INVENTARIO (
    CORRELATIVO INTEGER PRIMARY KEY,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_DOCUMENTO CHAR(3) NOT NULL,
    FECHA DATE NOT NULL,
    HORA TIME,
    DEPOSITO_ORIGEN_CODIGO VARCHAR(15),
    DEPOSITO_DESTINO_CODIGO VARCHAR(15),
    PRODUCTO_CODIGO VARCHAR(15) NOT NULL,
    CANTIDAD DECIMAL(18,4) NOT NULL,
    COSTO DECIMAL(18,4),
    COSTO_PROMEDIO DECIMAL(18,4),
    SERIAL VARCHAR(50),
    LOTE VARCHAR(50),
    FECHA_VENCIMIENTO DATE,
    REFERENCIA VARCHAR(50),
    NOTAS VARCHAR(255),
    USUARIO_CODIGO VARCHAR(15),
    ESTACION VARCHAR(30),
    DOCUMENTO_ORIGEN VARCHAR(10),
    ESTATUS CHAR(1) DEFAULT 'R'
);

-- Tabla: KARDEX
CREATE TABLE KARDEX (
    PRODUCTO_CODIGO VARCHAR(15),
    DEPOSITO_CODIGO VARCHAR(15),
    FECHA DATE,
    DOCUMENTO VARCHAR(10),
    TIPO_MOVIMIENTO CHAR(3),
    ENTRADA_CANTIDAD DECIMAL(18,4),
    ENTRADA_COSTO DECIMAL(18,4),
    ENTRADA_TOTAL DECIMAL(18,2),
    SALIDA_CANTIDAD DECIMAL(18,4),
    SALIDA_COSTO DECIMAL(18,4),
    SALIDA_TOTAL DECIMAL(18,2),
    SALDO_CANTIDAD DECIMAL(18,4),
    SALDO_COSTO DECIMAL(18,4),
    SALDO_TOTAL DECIMAL(18,2),
    PRIMARY KEY (PRODUCTO_CODIGO, DEPOSITO_CODIGO, FECHA, DOCUMENTO)
);
```

### 3.6.4 Método de Costeo Promedio

```
Costo Promedio Ponderado = 
    (Saldo Anterior × Costo Anterior + Entradas × Costo Entrada) /
    (Saldo Anterior + Entradas)

El costo promedio se actualiza con cada entrada de inventario.
Las salidas se valorizan al último costo promedio calculado.
```

---

## 3.7 Módulo de Banco

### 3.7.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         GESTIÓN BANCARIA                 │
├─────────────────────────────────────────┤
│ ✓ Cuentas bancarias                     │
│ ✓ Movimientos bancarios                 │
│ ✓ Conciliación bancaria                 │
│ ✓ Emisión de cheques                    │
│ ✓ Depósitos                             │
│ ✓ Transferencias                        │
│ ✓ Notas de crédito/débito               │
│ ✓ Conciliación automática               │
│ ✓ Reportes de conciliación              │
│ ✓ Auditoría de movimientos              │
└─────────────────────────────────────────┘
```

### 3.7.2 Tablas Principales

```sql
-- Tabla: BANCOS
CREATE TABLE BANCOS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    CODIGO_BANCARIO VARCHAR(10),
    DIRECCION VARCHAR(255),
    TELEFONO VARCHAR(40),
    ESTATUS CHAR(1) DEFAULT 'A'
);

-- Tabla: CUENTAS_BANCARIAS
CREATE TABLE CUENTAS_BANCARIAS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    BANCO_CODIGO VARCHAR(15) NOT NULL,
    NUMERO_CUENTA VARCHAR(30) NOT NULL,
    TIPO_CUENTA CHAR(1) DEFAULT 'C',  -- C=Corriente, A=Ahorro
    MONEDA_CODIGO VARCHAR(15),
    SALDO DECIMAL(18,2) DEFAULT 0,
    SALDO_INICIAL DECIMAL(18,2),
    FECHA_SALDO_INICIAL DATE,
    ESTATUS CHAR(1) DEFAULT 'A'
);

-- Tabla: MOVIMIENTOS_BANCOS
CREATE TABLE MOVIMIENTOS_BANCOS (
    CORRELATIVO INTEGER PRIMARY KEY,
    CUENTA_CODIGO VARCHAR(15) NOT NULL,
    DOCUMENTO VARCHAR(20) NOT NULL,
    TIPO_MOVIMIENTO CHAR(3) NOT NULL,  -- DEP, CHE, TRA, NCR, NDB
    FECHA DATE NOT NULL,
    BENEFICIARIO VARCHAR(160),
    DESCRIPCION VARCHAR(255),
    REFERENCIA VARCHAR(50),
    DEBITO DECIMAL(18,2) DEFAULT 0,
    CREDITO DECIMAL(18,2) DEFAULT 0,
    SALDO_ANTERIOR DECIMAL(18,2),
    SALDO_ACTUAL DECIMAL(18,2),
    CONCILIADO CHAR(1) DEFAULT 'F',
    FECHA_CONCILIACION DATE,
    USUARIO_CODIGO VARCHAR(15),
    ESTATUS CHAR(1) DEFAULT 'R'
);

-- Tabla: CHEQUES
CREATE TABLE CHEQUES (
    CORRELATIVO INTEGER PRIMARY KEY,
    CUENTA_CODIGO VARCHAR(15) NOT NULL,
    NUMERO_CHEQUE VARCHAR(20) NOT NULL,
    FECHA_EMISION DATE NOT NULL,
    BENEFICIARIO_CODIGO VARCHAR(15),
    BENEFICIARIO_NOMBRE VARCHAR(160),
    MONTO DECIMAL(18,2) NOT NULL,
    ESTATUS CHAR(1) DEFAULT 'E',  -- E=Emitido, C=Cobrado, A=Anulado
    FECHA_COBRO DATE,
    DOCUMENTO_PAGO VARCHAR(10)
);
```

---

## 3.8 Módulo de Caja

### 3.8.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         GESTIÓN DE CAJA                  │
├─────────────────────────────────────────┤
│ ✓ Ingresos de caja                      │
│ ✓ Egresos de caja                       │
│ ✓ Cierre de caja                        │
│ ✓ Arqueo de caja                        │
│ ✓ Múltiples cajas                       │
│ ✓ Turnos                                │
│ ✓ Recibos de caja                       │
│ ✓ Control de billetes y monedas         │
│ ✓ Auditoría de movimientos              │
└─────────────────────────────────────────┘
```

### 3.8.2 Tablas Principales

```sql
-- Tabla: CAJAS
CREATE TABLE CAJAS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    UBICACION VARCHAR(255),
    ESTATUS CHAR(1) DEFAULT 'A'
);

-- Tabla: MOVIMIENTOS_CAJA
CREATE TABLE MOVIMIENTOS_CAJA (
    CORRELATIVO INTEGER PRIMARY KEY,
    CAJA_CODIGO VARCHAR(15) NOT NULL,
    DOCUMENTO VARCHAR(10) NOT NULL,
    TIPO_MOVIMIENTO CHAR(3) NOT NULL,  -- ING, EGR
    FECHA_HORA TIMESTAMP NOT NULL,
    DESCRIPCION VARCHAR(255),
    REFERENCIA VARCHAR(50),
    MONTO DECIMAL(18,2) NOT NULL,
    SALDO_ANTERIOR DECIMAL(18,2),
    SALDO_ACTUAL DECIMAL(18,2),
    USUARIO_CODIGO VARCHAR(15),
    ESTATUS CHAR(1) DEFAULT 'R'
);

-- Tabla: CIERRES_CAJA
CREATE TABLE CIERRES_CAJA (
    CORRELATIVO INTEGER PRIMARY KEY,
    CAJA_CODIGO VARCHAR(15) NOT NULL,
    FECHA_INICIO TIMESTAMP NOT NULL,
    FECHA_FIN TIMESTAMP,
    SALDO_INICIAL DECIMAL(18,2),
    TOTAL_INGRESOS DECIMAL(18,2),
    TOTAL_EGRESOS DECIMAL(18,2),
    SALDO_SISTEMA DECIMAL(18,2),
    SALDO_FISICO DECIMAL(18,2),
    DIFERENCIA DECIMAL(18,2),
    USUARIO_CODIGO VARCHAR(15),
    ESTATUS CHAR(1) DEFAULT 'A'  -- A=Abierto, C=Cerrado
);
```

---

## 3.9 Módulo de Nómina

### 3.9.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│         GESTIÓN DE NÓMINA                │
├─────────────────────────────────────────┤
│ ✓ Registro de empleados                 │
│ ✓ Datos personales y laborales          │
│ ✓ Sueldos y salarios                    │
│ ✓ Asignaciones                          │
│ ✓ Deducciones                           │
│ ✓ Vacaciones                            │
│ ✓ Utilidades                            │
│ ✓ Préstamos                             │
│ ✓ Vales                                 │
│ ✓ Recibos de pago                       │
│ ✓ Retenciones ISLR                      │
│ ✓ IVSS, FAOV, INCES                     │
│ ✓ Auditoría de cambios                  │
└─────────────────────────────────────────┘
```

### 3.9.2 Tablas Principales

```sql
-- Tabla: EMPLEADOS
CREATE TABLE EMPLEADOS (
    CODIGO VARCHAR(15) PRIMARY KEY,
    NOMBRE VARCHAR(160) NOT NULL,
    APELLIDO VARCHAR(160) NOT NULL,
    CEDULA VARCHAR(20) NOT NULL,
    FECHA_NACIMIENTO DATE,
    DIRECCION VARCHAR(255),
    TELEFONO VARCHAR(40),
    CORREO_ELECTRONICO VARCHAR(60),
    DEPARTAMENTO_CODIGO VARCHAR(15),
    CARGO VARCHAR(100),
    SUELDO_BASE DECIMAL(18,2),
    FECHA_INGRESO DATE,
    FECHA_EGRESO DATE,
    ESTATUS CHAR(1) DEFAULT 'A',
    CUENTA_BANCARIA_CODIGO VARCHAR(15),
    TIPO_PERSONAL CHAR(1) DEFAULT 'O'  -- O=Ordinario, T=Temporal
);

-- Tabla: NOMINA
CREATE TABLE NOMINA (
    CORRELATIVO INTEGER PRIMARY KEY,
    PERIODO VARCHAR(7) NOT NULL,  -- YYYY-MM
    TIPO_NOMINA CHAR(1) NOT NULL,  -- R=Regular, V=Vacaciones, U=Utilidades
    FECHA_PAGO DATE NOT NULL,
    TOTAL_ASIGNACIONES DECIMAL(18,2),
    TOTAL_DEDUCCIONES DECIMAL(18,2),
    TOTAL_NETO DECIMAL(18,2),
    ESTATUS CHAR(1) DEFAULT 'P',  -- P=Pendiente, Q=Quitada
    USUARIO_CODIGO VARCHAR(15)
);

-- Tabla: NOMINA_DETALLE
CREATE TABLE NOMINA_DETALLE (
    CORRELATIVO INTEGER,
    EMPLEADO_CODIGO VARCHAR(15),
    DIAS_TRABAJADOS DECIMAL(5,2),
    SUELDO_DEVENGADO DECIMAL(18,2),
    ASIGNACION_CODIGO VARCHAR(15),
    ASIGNACION_MONTO DECIMAL(18,2),
    DEDUCCION_CODIGO VARCHAR(15),
    DEDUCCION_MONTO DECIMAL(18,2),
    SALDO_NETO DECIMAL(18,2),
    PRIMARY KEY (CORRELATIVO, EMPLEADO_CODIGO)
);
```

---

## 3.10 Módulo de Contabilidad

### 3.10.1 Funcionalidades Principales

```
┌─────────────────────────────────────────┐
│       GESTIÓN CONTABLE                   │
├─────────────────────────────────────────┤
│ ✓ Plan de cuentas                       │
│ ✓ Asientos contables                    │
│ ✓ Libro diario                          │
│ ✓ Libro mayor                           │
│ ✓ Balances de comprobación              │
│ ✓ Estado de resultados                  │
│ ✓ Balance general                       │
│ ✓ Centros de costo                      │
│ ✓ Integración con módulos               │
│ ✓ Auditoría de asientos                 │
└─────────────────────────────────────────┘
```

### 3.10.2 Tablas Principales

```sql
-- Tabla: PLAN_CUENTAS
CREATE TABLE PLAN_CUENTAS (
    CUENTA_CODIGO VARCHAR(22) PRIMARY KEY,
    CUENTA_NOMBRE VARCHAR(200) NOT NULL,
    CUENTA_TIPO CHAR(1) NOT NULL,  -- A=Activo, P=Pasivo, O=Patrimonio, I=Ingreso, G=Gasto
    CUENTA_NATURALEZA CHAR(1) NOT NULL,  -- D=Deudora, A=Acreedora
    CUENTA_PADRE_CODIGO VARCHAR(22),
    NIVEL SMALLINT DEFAULT 1,
    SALDO DECIMAL(18,2) DEFAULT 0,
    ESTATUS CHAR(1) DEFAULT 'A'
);

-- Tabla: ASIENTOS_CONTABLES
CREATE TABLE ASIENTOS_CONTABLES (
    CORRELATIVO INTEGER PRIMARY KEY,
    NUMERO_ASIENTO VARCHAR(20) NOT NULL,
    FECHA DATE NOT NULL,
    DESCRIPCION VARCHAR(255),
    TOTAL_DEBE DECIMAL(18,2),
    TOTAL_HABER DECIMAL(18,2),
    CUADRADO CHAR(1) DEFAULT 'S',
    USUARIO_CODIGO VARCHAR(15),
    ESTATUS CHAR(1) DEFAULT 'R'
);

-- Tabla: ASIENTOS_DETALLE
CREATE TABLE ASIENTOS_DETALLE (
    CORRELATIVO INTEGER,
    CODIGO INTEGER,
    CUENTA_CODIGO VARCHAR(22) NOT NULL,
    DESCRIPCION VARCHAR(255),
    DEBE DECIMAL(18,2) DEFAULT 0,
    HABER DECIMAL(18,2) DEFAULT 0,
    CENTRO_COSTO_CODIGO VARCHAR(15),
    PRIMARY KEY (CORRELATIVO, CODIGO)
);
```

---

# 4. SISTEMA FISCAL VENEZOLANO

## 4.1 Impuestos Principales

### 4.1.1 IVA (Impuesto al Valor Agregado)

| Concepto | Valor | Descripción |
|----------|-------|-------------|
| **Alícuota General** | 16% | Aplicable a la mayoría de productos |
| **Alícuota Reducida** | 8% | Productos de primera necesidad |
| **Alícuota de Lujo** | 31% | Productos de lujo |
| **Exento** | 0% | Productos exentos |

### 4.1.2 IGTF (Impuesto a las Grandes Transacciones Financieras)

| Concepto | Valor | Descripción |
|----------|-------|-------------|
| **Alícuota** | 3% | Aplicable a pagos en divisas |
| **Base Imponible** | Total de la operación | Incluye IVA |
| **Sujetos Pasivos** | Contribuyentes especiales | |

### 4.1.3 Retenciones

#### Retención de IVA

| Tipo | Porcentaje | Aplicable a |
|------|------------|-------------|
| **Ordinaria** | 75% | Contribuyentes ordinarios |
| **Especial** | 100% | Contribuyentes especiales |
| **Importación** | 100% | Importaciones |

#### Retención de ISLR

| Concepto | Porcentaje | Aplicable a |
|----------|------------|-------------|
| **Servicios Profesionales** | 10% | Honorarios profesionales |
| **Comisiones** | 10% | Comisiones mercantiles |
| **Arrendamientos** | 10% | Alquiler de inmuebles |
| **Fletes** | 3% | Transporte de carga |

## 4.2 Libros Fiscales

### 4.2.1 Libro de Ventas

```
Registro obligatorio de todas las ventas
Debe incluir:
- Número de factura
- Número de control
- Fecha de emisión
- RIF del cliente
- Base imponible
- Alícuota de IVA
- Monto del IVA
- Retención de IVA (si aplica)
- IGTF (si aplica)
```

### 4.2.2 Libro de Compras

```
Registro obligatorio de todas las compras
Debe incluir:
- Número de factura
- Número de control
- Fecha de recepción
- RIF del proveedor
- Base imponible
- Alícuota de IVA
- Monto del IVA
- Retención de IVA
- Retención de ISLR
```

---

# 5. REPORTES DEL SISTEMA

## 5.1 Clasificación de Reportes

### 5.1.1 Reportes de Ventas (13)

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| `FAC_VTA` | Factura de Venta | Fiscal | Factura fiscal con impresión en impresora fiscal |
| `FAC_CRED_VTA` | Factura Crédito | Fiscal | Factura a crédito |
| `DEV_VTA` | Devolución | Fiscal | Devolución de venta |
| `PED_VTA` | Pedido | Operativo | Pedido de cliente |
| `ODD_VTA` | Orden Despacho | Operativo | Orden de despacho |
| `PRS_VTA` | Presupuesto | Operativo | Presupuesto/cotización |
| `NET_VTA` | Nota Entrega | Operativo | Nota de entrega |
| `FPV_VTA` | Factura PV | Fiscal | Factura de punto de venta |
| `HOJA_ANEXA_VTA` | Hoja Anexa | Operativo | Hoja anexa de factura |
| `HOJA_SERIALES_VTA` | Hoja Seriales | Operativo | Relación de seriales |

### 5.1.2 Reportes de Compras (4)

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| `FCM_CMP` | Factura Compra | Fiscal | Factura de compra |
| `ODC_CMP` | Orden Compra | Operativo | Orden de compra |
| `DCM_CMP` | Doc. Compra | Operativo | Documento de compra |
| `RCM_CMP` | Reg. Compra | Fiscal | Registro de compra |

### 5.1.3 Reportes CXC/CXP (16)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `COMP_FAC_CXC` | Comprobante Factura por Cobrar |
| `COMP_FCM_CXP` | Comprobante Factura por Pagar |
| `COMP_NCR_CXC` | Comprobante Nota de Crédito CXC |
| `COMP_NCR_CXP` | Comprobante Nota de Crédito CXP |
| `COMP_NDB_CXC` | Comprobante Nota de Débito CXC |
| `COMP_NDB_CXP` | Comprobante Nota de Débito CXP |
| `COMP_PAG_CXC` | Comprobante de Pago CXC |
| `COMP_PAG_CXP` | Comprobante de Pago CXP |
| `COMP_RTP_IVA_*` | Comprobantes de Retención de IVA |
| `COMP_RET_ISRL` | Comprobante de Retención ISLR |
| `COMP_RTP_MUN_*` | Comprobantes de Retención Municipal |

### 5.1.4 Reportes de Banco (8)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `COMP_DEP_BANCO` | Depósito Bancario |
| `COMP_TRF_BANCO` | Transferencia Bancaria |
| `COMP_CHQ_BANCO` | Cheque Bancario |
| `COMP_NCR_BANCO` | Nota de Crédito Bancaria |
| `COMP_NDB_BANCO` | Nota de Débito Bancaria |
| `CONC_BANCO` | Conciliación Bancaria |

### 5.1.5 Reportes de Caja (4)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `COMP_CIERRE_CAJA` | Cierre de Caja |
| `COMP_INC_CAJ` | Ingreso de Caja |
| `COMP_EGC_CAJ` | Egreso de Caja |
| `RECIBO_CAJA` | Recibo de Caja |

### 5.1.6 Reportes de Nómina (12)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `NOM_RECIBO_PAGO_NOMINA_REGULAR` | Recibo de Nómina Regular |
| `NOM_RECIBO_PAGO_NOMINA_VACACIONES` | Recibo de Vacaciones |
| `NOM_RECIBO_PAGO_NOMINA_UTILIDADES` | Recibo de Utilidades |
| `NOM_RECIBO_PAGO_NOMINA_LIQUIDACION` | Recibo de Liquidación |
| `NOM_RECIBO_PAGO_NOMINA_HISTORICA` | Recibo Histórico |
| `NOM_RECIBO_PRESTAMO` | Recibo de Préstamo |
| `NOM_RECIBO_VALES` | Recibo de Vales |
| `NOM_CONSTANCIA_TRABAJO` | Constancia de Trabajo |
| `NOM_PERMISO_TRABAJADOR` | Permiso de Trabajador |
| `NOM_PAGO_INTERESES` | Pago de Intereses |
| `NOM_ADE_PRS_SOC` | Adeudos Personales/Sociales |
| `NOM_RECIBO_PAGO_PATRONAL` | Recibo de Pago Patronal |

### 5.1.7 Etiquetas (10)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `ETIQUETA3` a `ETIQUETA10` | Etiquetas Varios | Modelos de etiquetas |
| `COD_BAR_EAN8` | Código de Barra EAN8 | Etiqueta con EAN8 |
| `COD_BAR_EAN13` | Código de Barra EAN13 | Etiqueta con EAN13 |
| `COD_BAR_SERIALES` | Código con Seriales | Etiqueta con serial |

### 5.1.8 Reportes Fiscales (2)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `LIB_VTA_CO_NO_MA_1C` | Libro de Ventas | Libro de ventas para contribuyentes especiales |
| `LIB_GRAL_CMP_VTA` | Libro General | Libro general de compras y ventas |

### 5.1.9 Reportes Gerenciales (1)

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `REP_GERENCIAL` | Reporte Gerencial | Dashboard gerencial con KPIs |

---

# 6. FLUJOS DE TRABAJO

## 6.1 Flujo de Venta Contado

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cliente    │────▶│  Pedido     │────▶│  Presupuesto│
└─────────────┘     └─────────────┘     └─────────────┘
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Orden      │     │  Aprobación │
                    │  Despacho   │     │  Cliente    │
                    └─────────────┘     └─────────────┘
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Factura    │◀────│  Orden      │
                    │  Fiscal     │     │  Despacho   │
                    └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Pago       │────▶│  Inventario │
                    │  Contado    │     │  -Existencia│
                    └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Cierre     │
                    │  de Caja    │
                    └─────────────┘
```

## 6.2 Flujo de Venta Crédito

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cliente    │────▶│  Solicitud  │────▶│  Análisis   │
│             │     │  Crédito    │     │  Crédito    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                    ▼                   ▼
                              ┌─────────────┐     ┌─────────────┐
                              │  Aprobado   │     │  Rechazado  │
                              └─────────────┘     └─────────────┘
                                    │
                                    ▼
                              ┌─────────────┐
                              │  Factura    │
                              │  Crédito    │
                              └─────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  CXC        │     │  Inventario │
                    │  +Saldo     │     │  -Existencia│
                    └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Pago       │────▶│  CXC        │
                    │  Cliente    │     │  -Saldo     │
                    └─────────────┘     └─────────────┘
```

## 6.3 Flujo de Compra

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Necesidad  │────▶│  Solicitud  │────▶│  Orden de   │
│  Inventario │     │  Compra     │     │  Compra     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  Proveedor  │
                                        │  Despacha   │
                                        └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  Recepción  │
                                        │  Mercancía  │
                                        └─────────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                    ▼                   ▼
                              ┌─────────────┐     ┌─────────────┐
                              │  Inventario │     │  Factura    │
                              │  +Existencia│     │  Compra     │
                              └─────────────┘     └─────────────┘
                                                        │
                                              ┌─────────┴─────────┐
                                              │                   │
                                              ▼                   ▼
                                        ┌─────────────┐     ┌─────────────┐
                                        │  CXP        │     │  Retenciones│
                                        │  +Saldo     │     │  IVA/ISLR   │
                                        └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  Pago       │
                                        │  Proveedor  │
                                        └─────────────┘
```

---

# 7. GUÍA DE IMPLEMENTACIÓN

## 7.1 Tecnologías Recomendadas

### 7.1.1 Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Python** | 3.8+ | Lógica de negocio |
| **FastAPI** | 0.100+ | API REST |
| **SQLAlchemy** | 2.0+ | ORM |
| **Firebird SQL** | 2.5+ | Base de datos |

### 7.1.2 Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18+ | Interfaz de usuario |
| **TypeScript** | 5+ | Tipado estático |
| **Bootstrap** | 5+ | Estilos |
| **Material UI** | 5+ | Componentes |

### 7.1.3 Reportes

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **ReportLab** | 4+ | Generación de PDF |
| **Jinja2** | 3+ | Plantillas |
| **OpenPyXL** | 3+ | Exportación Excel |

## 7.2 Pasos de Implementación

### Fase 1: Configuración Inicial (2 semanas)

1. **Configurar entorno de desarrollo**
   - Instalar Python 3.8+
   - Instalar Firebird SQL 2.5+
   - Configurar IDE (VS Code, PyCharm)

2. **Crear estructura de base de datos**
   - Ejecutar scripts de creación de tablas
   - Configurar triggers y stored procedures
   - Cargar datos iniciales

3. **Configurar repositorio**
   - Inicializar Git
   - Configurar ramas (main, develop, feature/*)
   - Establecer flujo de trabajo

### Fase 2: Módulos Base (6 semanas)

4. **Módulo de Clientes**
   - CRUD de clientes
   - Validaciones de RIF
   - Control de crédito

5. **Módulo de Proveedores**
   - CRUD de proveedores
   - Clasificación fiscal
   - Control de crédito

6. **Módulo de Productos**
   - CRUD de productos
   - Control de inventario
   - Listas de precios

### Fase 3: Módulos Transaccionales (8 semanas)

7. **Módulo de Ventas**
   - Facturación
   - Cálculo de impuestos
   - Impresión fiscal

8. **Módulo de Compras**
   - Órdenes de compra
   - Recepción de mercancía
   - Control de costos

9. **Módulo de Inventario**
   - Control de existencias
   - Kárdex valorizado
   - Ajustes y transferencias

### Fase 4: Módulos Financieros (6 semanas)

10. **Módulo de Banco**
    - Cuentas bancarias
    - Conciliación
    - Cheques

11. **Módulo de Caja**
    - Ingresos y egresos
    - Cierre de caja
    - Arqueo

12. **Módulo de Contabilidad**
    - Plan de cuentas
    - Asientos contables
    - Reportes financieros

### Fase 5: Nómina y Reportes (4 semanas)

13. **Módulo de Nómina**
    - Registro de empleados
    - Cálculo de nómina
    - Recibos de pago

14. **Sistema de Reportes**
    - Implementar 89 plantillas
    - Exportación a PDF/Excel
    - Reportes gerenciales

### Fase 6: Pruebas y Despliegue (4 semanas)

15. **Pruebas**
    - Pruebas unitarias
    - Pruebas de integración
    - Pruebas de usuario

16. **Despliegue**
    - Configuración de producción
    - Migración de datos
    - Capacitación de usuarios

## 7.3 Cronograma Estimado

```
Fase 1: Configuración Inicial        ████████          2 semanas
Fase 2: Módulos Base                 ██████████████████ 6 semanas
Fase 3: Módulos Transaccionales      ████████████████████████ 8 semanas
Fase 4: Módulos Financieros          ██████████████████ 6 semanas
Fase 5: Nómina y Reportes            ████████████        4 semanas
Fase 6: Pruebas y Despliegue         ████████          2 semanas
                                                      ─────────
TOTAL                                30 semanas (~7 meses)
```

---

# 8. CONCLUSIONES Y RECOMENDACIONES

## 8.1 Complejidad del Sistema

ValeryPro/Violet es un sistema ERP **altamente complejo** con:

- **100+ tablas** de base de datos
- **200+ triggers** para automatización
- **50+ stored procedures** para lógica de negocio
- **89 reportes** diferentes
- **13 módulos** principales
- **Normativa fiscal venezolana** completa

## 8.2 Puntos Críticos

### 8.2.1 Alta Prioridad

1. **Cálculo de Impuestos**
   - IVA (16%, 8%, 31%)
   - Retenciones (75%, 100%)
   - IGTF (3%)
   - Validación con normativa SENIAT

2. **Impresión Fiscal**
   - Drivers de impresoras fiscales
   - Cumplimiento de providencias
   - Libros fiscales electrónicos

3. **Control de Inventario**
   - Costeo promedio ponderado
   - Serialización y lotes
   - Múltiples depósitos

### 8.2.2 Media Prioridad

4. **Conciliación Bancaria**
   - Cruce automático
   - Diferencias cambiarias

5. **Nómina**
   - Cálculos de prestaciones
   - Retenciones ISLR
   - IVSS, FAOV, INCES

## 8.3 Recomendaciones Finales

1. **Comenzar con un MVP**
   - Solo módulos esenciales (Clientes, Productos, Ventas)
   - Ir agregando módulos gradualmente

2. **Usar framework probado**
   - Odoo, ERPNext, o similar
   - Personalizar para Venezuela

3. **Considerar SaaS**
   - Menor inversión inicial
   - Actualizaciones automáticas

4. **Equipo multidisciplinario**
   - Desarrolladores backend/frontend
   - Contador experto en fiscalidad venezolana
   - QA especializado

5. **Presupuesto realista**
   - 7-12 meses de desarrollo
   - Equipo de 5-8 personas
   - Inversión significativa en pruebas

---

# 📞 CONTACTO Y SOPORTE

Para más información sobre esta documentación:

- **Email:** soporte@violet.com
- **Documentación:** Ver carpeta `Ayuda/`
- **Código:** Revisar scripts en `ScriptsMigracion/`

---

**© 2026 Violet Development Team**  
**Documento Técnico v1.0.0**  
**Confidencial - Uso Interno**
