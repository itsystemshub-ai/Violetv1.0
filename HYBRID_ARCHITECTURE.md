# 💜 Violet ERP v2.0 - Arquitectura Híbrida

**Sistema Empresarial 100% Autocontenido - Local + Nube Híbrido**

---

## 🏗️ Arquitectura Híbrida

Violet ERP ahora funciona en **tres modos** sin dependencias externas:

### 1. **Modo Local (Standalone)**
- Todo se ejecuta en una sola máquina
- Firebird local + SQLite para caché
- Ideal para negocios pequeños sin internet

### 2. **Modo Cloud (SaaS)**
- Todo se ejecuta en el servidor central
- Multi-tenant architecture
- Ideal para empresas 100% en la nube

### 3. **Modo Híbrido** ⭐
- **Local-first**: Los datos se guardan primero localmente
- **Sync asíncrono**: Sincronización automática con el servidor maestro
- **Offline-first**: Funciona sin internet
- **Multi-nodo**: Múltiples sucursales sincronizadas

---

## 📊 Diagrama de Arquitectura Híbrida

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR MAESTRO (Cloud)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Firebird   │  │   Socket.IO │  │  Hybrid Sync Service    │ │
│  │  Principal  │  │  WebSocket  │  │  (Sync entre nodos)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  SYNC_LOGS  │  │ SYNC_NODES  │  │  API REST Híbrida       │ │
│  │  SYNC_QUEUE │  │ SYNC_CONFIG │  │  /api/sync/*            │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                 NODOS SLAVES (Sucursales)                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Cada sucursal tiene:                                     │ │
│  │  • Firebird local (réplica parcial)                       │ │
│  │  • IndexedDB (offline-first)                              │ │
│  │  • Sync Engine (cola de sincronización)                   │ │
│  │  • Socket.IO Client (tiempo real)                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Cuando hay internet: Sync automático cada 15s                  │
│  Sin internet: Todo funciona localmente                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuración por Modo

### Modo Local (Standalone)

```env
HYBRID_MODE=local
HYBRID_NODE_ROLE=standalone
HYBRID_IS_MASTER=false
```

### Modo Cloud (SaaS)

```env
HYBRID_MODE=cloud
HYBRID_NODE_ROLE=master
HYBRID_IS_MASTER=true
```

### Modo Híbrido (Multi-sucursal)

```env
# Servidor Maestro
HYBRID_MODE=hybrid
HYBRID_NODE_ROLE=master
HYBRID_IS_MASTER=true
HYBRID_API_KEY=tu-api-key-secreta

# Sucursal (Slave)
HYBRID_MODE=hybrid
HYBRID_NODE_ROLE=slave
HYBRID_IS_MASTER=false
HYBRID_CLOUD_API_URL=https://master.violet-erp.com
HYBRID_CLOUD_WS_URL=wss://master.violet-erp.com
HYBRID_API_KEY=tu-api-key-secreta
```

---

## 📦 Flujo de Sincronización

### 1. Usuario crea/actualiza registro en Sucursal A

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  IndexedDB   │────▶│  Sync Queue  │
│   (React)    │     │  (Local)     │     │  (Pendiente) │
└──────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Firebird    │
                      │  (Local)     │
                      └──────────────┘
```

### 2. Sync Engine procesa cola (cada 15s)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Sync Queue  │────▶│  API Sync    │────▶│  Maestro     │
│  (Pendientes)│     │  /enqueue    │     │  (Cloud)     │
└──────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Firebird    │
                      │  (Maestro)   │
                      └──────────────┘
```

### 3. Maestro broadcast a otras sucursales (opcional)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Maestro    │────▶│  Sucursal B  │────▶│  Sucursal C  │
│  (Broadcast) │     │  (Sync)      │     │  (Sync)      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🗄️ Tablas de Sincronización

### SYNC_NODES
Registra todos los nodos conectados al sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| NODE_ID | VARCHAR(100) | ID único del nodo |
| NODE_URL | VARCHAR(500) | URL base del nodo |
| NODE_ROLE | VARCHAR(20) | MASTER o SLAVE |
| ACTIVE | CHAR(1) | S/N activo |
| LAST_HEARTBEAT | TIMESTAMP | Último latido |

### SYNC_LOGS
Traza auditoría de todos los cambios sincronizados.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID | VARCHAR(50) | ID del log |
| TABLE_NAME | VARCHAR(100) | Tabla afectada |
| RECORD_ID | VARCHAR(100) | ID del registro |
| ACTION | VARCHAR(20) | INSERT/UPDATE/DELETE |
| PAYLOAD | BLOB TEXT | Datos del cambio |
| SYNC_STATUS | VARCHAR(20) | PENDING/SYNCED/FAILED |
| ATTEMPTS | INTEGER | Intentos realizados |
| NODE_ID | VARCHAR(100) | Nodo origen |

### SYNC_QUEUE
Cola de prioridad para sincronización.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID | VARCHAR(50) | ID de la cola |
| PRIORITY | INTEGER | Prioridad (0-10) |
| TABLE_NAME | VARCHAR(100) | Tabla afectada |
| STATUS | VARCHAR(20) | PENDING/PROCESSING/DONE |

### SYNC_CONFIG
Configuración dinámica del sync.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| KEY | VARCHAR(100) | Clave de configuración |
| VALUE | VARCHAR(500) | Valor |
| DESCRIPTION | VARCHAR(255) | Descripción |

---

## 🚀 Comandos de Sincronización

### Backend

```javascript
// Encolar registro para sync
await hybridSyncService.enqueueSync({
  tableName: 'products',
  recordId: 'PROD-001',
  action: 'UPDATE',
  payload: { price: 100, stock: 50 }
});

// Recibir sync desde slave (master)
const result = await hybridSyncService.receiveFromSlave(
  data,
  'node-123'
);

// Obtener estadísticas
const stats = hybridSyncService.getStats();
// { synced: 100, failed: 2, pending: 5, lastSync: Date }
```

### Frontend

```typescript
import { SyncEngine, configureHybridSync } from '@/core/sync/SyncEngine';

// Configurar
configureHybridSync({
  mode: 'hybrid',
  apiUrl: 'https://api.violet-erp.com',
  wsUrl: 'wss://ws.violet-erp.com',
  syncInterval: 15000,
  autoSync: true,
});

// Mutación (auto-sync)
const result = await SyncEngine.mutate(
  'products',
  'UPDATE',
  { price: 100, stock: 50 },
  'PROD-001'
);

// Sincronizar pendientes
await SyncEngine.syncPending();

// Obtener estadísticas
const stats = await SyncEngine.getStats();
// { pending: 5, completed: 100, failed: 2, total: 107 }
```

---

## 🔌 Endpoints de API Híbrida

### POST /api/sync/receive
Recibe sincronización desde nodos slaves.

```json
{
  "action": "SYNC_RECORD",
  "data": {
    "table_name": "products",
    "action": "UPDATE",
    "payload": { "id": "PROD-001", "price": 100 },
    "record_id": "PROD-001",
    "source_node": "node-123"
  }
}
```

### POST /api/sync/register
Registra un nodo slave en el master.

```json
{
  "nodeId": "sucursal-001",
  "nodeUrl": "https://sucursal-001.violet-erp.com",
  "nodeRole": "SLAVE"
}
```

### GET /api/sync/stats
Obtiene estadísticas de sincronización.

```json
{
  "success": true,
  "data": {
    "synced": 1250,
    "failed": 5,
    "pending": 12,
    "lastSync": "2026-03-31T10:30:00Z",
    "mode": "hybrid",
    "isMaster": true,
    "nodeId": "master-001"
  }
}
```

### POST /api/sync/enqueue
Encola un registro para sincronización.

### GET /api/sync/nodes
Lista nodos registrados.

### POST /api/sync/cleanup
Limpia logs antiguos.

---

## 🔐 Seguridad en Modo Híbrido

### API Key entre Nodos

```env
# Todos los nodos deben tener la misma API Key
HYBRID_API_KEY=tu-api-key-secreta-de-64-caracteres
```

### Validación de Nodos

1. Cada request incluye `X-Node-ID` header
2. Master valida que el nodo esté registrado
3. Requests de nodos no registrados son rechazados

### HTTPS Obligatorio

```env
# Producción
VITE_API_URL=https://api.violet-erp.com
VITE_WS_URL=wss://ws.violet-erp.com
```

---

## 📊 Resolución de Conflictos

### Estrategia: Last Write Wins (LWW)

```typescript
import { ConflictResolver } from '@/core/sync/SyncEngine';

const conflicts = ConflictResolver.detectConflicts(
  localVersion,
  remoteVersion,
  ['price', 'stock', 'name']
);

// Resolver: gana el más reciente
const resolved = ConflictResolver.resolveLWW(
  localVersion,
  remoteVersion
);
```

### Conflictos Comunes

| Escenario | Solución |
|-----------|----------|
| Mismo campo, diferente valor | Último timestamp gana |
| Campos diferentes | Merge automático |
| Delete vs Update | Update gana (soft delete) |

---

## 🔍 Monitoreo y Debug

### Logs de Sincronización

```sql
-- Ver logs pendientes
SELECT * FROM SYNC_LOGS 
WHERE SYNC_STATUS = 'PENDING' 
ORDER BY CREATED_AT DESC;

-- Ver errores recientes
SELECT NODE_ID, TABLE_NAME, RECORD_ID, LAST_ERROR 
FROM SYNC_LOGS 
WHERE SYNC_STATUS = 'FAILED' 
ORDER BY UPDATED_AT DESC;

-- Ver nodos activos
SELECT NODE_ID, NODE_URL, LAST_HEARTBEAT, NODE_ROLE
FROM SYNC_NODES
WHERE ACTIVE = 'S';
```

### Health Check

```bash
# Ver estado del servidor
curl http://localhost:3000/health

# Respuesta:
{
  "status": "ok",
  "mode": "hybrid",
  "nodeRole": "master",
  "database": { "connected": true, "pool": {...} },
  "sync": { "synced": 1250, "failed": 5, "pending": 12 }
}
```

---

## 🎯 Casos de Uso

### 1. Farmacia con 5 sucursales

```
Sucursal A (Master) ←→ Cloud
    ↕
Sucursal B (Slave)  ←→ Sync cada 15s
    ↕
Sucursal C (Slave)  ←→ Sync cada 15s
```

**Ventaja:** Inventario actualizado en todas las sucursales

### 2. Clínica sin internet

```
Modo: local
Todo se guarda localmente
Sin sync, sin nube
```

**Ventaja:** Funciona 100% offline

### 3. Retail multi-ciudad

```
Tienda 1 (Slave) ↘
Tienda 2 (Slave)  →  Master (Cloud)  →  Dashboard Central
Tienda 3 (Slave) ↗
```

**Ventaja:** Reportes centralizados en tiempo real

---

## 📈 Métricas de Rendimiento

| Métrica | Valor |
|---------|-------|
| Sync latency | < 100ms (LAN), < 500ms (WAN) |
| Batch size | 20 registros/lote |
| Sync interval | 15 segundos |
| Max retries | 5 intentos |
| Offline storage | Ilimitado (IndexedDB) |
| Concurrent nodes | Hasta 100 nodos |

---

## 🛠️ Troubleshooting

### Sync no funciona

1. Verificar `HYBRID_MODE=hybrid`
2. Verificar conexión: `GET /api/health`
3. Revisar logs: `SELECT * FROM SYNC_LOGS WHERE SYNC_STATUS='FAILED'`

### Nodos no se registran

1. Verificar `HYBRID_API_KEY` igual en todos los nodos
2. Verificar firewall (puerto 3000/3001)
3. Registrar manualmente: `POST /api/sync/register`

### Conflictos de datos

1. Revisar timestamps: `SELECT updated_at FROM tabla WHERE id=?`
2. Forzar sync: `await SyncEngine.retryFailed()`
3. Limpieza: `POST /api/sync/cleanup`

---

## 📚 Recursos Adicionales

- [API Documentation](./backend/api/README.md)
- [Frontend Sync Guide](./frontend/web/README.md)
- [Database Schema](./database/firebird/schema.sql)

---

<p align="center">
  <sub>Hecho con 💜 por Violet ERP Team - Arquitectura 100% Autocontenida</sub>
</p>
