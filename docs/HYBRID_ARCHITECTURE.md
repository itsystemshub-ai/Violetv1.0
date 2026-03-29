# 💜 Violet ERP - Arquitectura Híbrida Local + Nube

## 📋 Descripción General

Violet ERP utiliza una **arquitectura híbrida** que permite operar tanto **localmente** (offline-first) como en la **nube**, con sincronización bidireccional automática.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIOLET ERP - HYBRID                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐                           ┌──────────────┐  │
│   │   LOCAL      │◄────── Sync ─────────────►│     CLOUD    │  │
│   │   (SQLite)   │      Bidireccional        │ (PostgreSQL) │  │
│   │              │                           │   Supabase   │  │
│   │  - Offline   │                           │              │  │
│   │  - Rápido    │                           │  - Central   │  │
│   │  - Local LAN │                           │  - Remoto    │  │
│   └──────────────┘                           └──────────────┘  │
│         │                                          │            │
│         └──────────────────────────────────────────┘            │
│                          Sync Automático                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Modos de Operación

### 1. **Modo Local** (Offline)
- Base de datos: SQLite
- Operación: 100% local
- Ideal: Sucursales sin internet constante

```env
HYBRID_MODE=local
DB_TYPE=sqlite
SYNC_ENABLED=false
```

### 2. **Modo Nube** (Online)
- Base de datos: PostgreSQL/Supabase
- Operación: Centralizada
- Ideal: Oficina principal, siempre online

```env
HYBRID_MODE=cloud
DB_TYPE=postgres
DATABASE_URL=postgresql://...
```

### 3. **Modo Híbrido** (Recomendado)
- Base de datos: SQLite + PostgreSQL
- Operación: Local con sync a nube
- Ideal: Múltiples sucursales, operación continua

```env
HYBRID_MODE=both
DB_TYPE=sqlite
SYNC_ENABLED=true
CLOUD_API_URL=https://api.violet-erp.com
CLOUD_API_KEY=tu-api-key
```

---

## 🔄 Sincronización

### Características

| Característica | Descripción |
|----------------|-------------|
| **Bidireccional** | Los cambios se sincronizan en ambas direcciones |
| **Automática** | Se ejecuta cada 30 segundos (configurable) |
| **Offline-first** | Funciona sin conexión, sincroniza cuando hay internet |
| **Resolución de conflictos** | Configurable (cloud-wins, local-wins, manual) |
| **Cola de operaciones** | Las operaciones se encolan si no hay conexión |

### Configuración

```env
# Sincronización
SYNC_ENABLED=true
SYNC_INTERVAL=30000          # 30 segundos
SYNC_BATCH_SIZE=100          # Registros por lote

# Resolución de conflictos
CONFLICT_RESOLUTION=cloud-wins  # cloud-wins, local-wins, manual

# Offline
OFFLINE_MODE=false
OFFLINE_QUEUE_MAX=1000

# Cloud
CLOUD_API_URL=https://api.violet-erp.com
CLOUD_WS_URL=wss://ws.violet-erp.com
CLOUD_API_KEY=tu-api-key
CLOUD_INSTANCE_ID=unique-id
```

### Flujo de Sincronización

```
1. Cambio local detectado (trigger)
   ↓
2. Registro en tabla _changes
   ↓
3. Cola de sincronización
   ↓
4. Push a la nube (cada 30s)
   ↓
5. Confirmación de nube
   ↓
6. Mark como sincronizado
   ↓
7. Pull de cambios de nube
   ↓
8. Aplicar cambios localmente
```

---

## 🗄️ Base de Datos

### Esquema Híbrido

Cada tabla incluye:
- `sync_updated_at`: Timestamp de última actualización para sync
- Triggers automáticos: `_insert_trigger`, `_update_trigger`, `_delete_trigger`
- Tabla de cambios: `table_changes` para tracking

### Tablas Sincronizadas

```
✓ users              ✓ customers         ✓ purchases
✓ roles              ✓ customer_addresses ✓ purchase_items
✓ permissions        ✓ customer_contacts  ✓ suppliers
✓ role_permissions   ✓ sales             ✓ supplier_addresses
✓ products           ✓ sale_items        ✓ supplier_contacts
✓ categories         ✓ invoices          ✓ accounts
✓ brands             ✓ invoice_items     ✓ journal_entries
✓ units              ✓ payments          ✓ journal_entry_items
✓ inventory          ✓ warehouses        ✓ system_config
✓ stock_movements
```

### Tablas de Sistema (No sincronizadas)

```
- sessions           - sync_conflicts
- audit_logs         - sync_queue
- notifications      - sync_state
```

---

## 🚀 Implementación con PM2

### ¿Por qué PM2 en lugar de Docker?

| PM2 | Docker |
|-----|--------|
| Ligero, sin overhead de contenedores | Más pesado, requiere Docker daemon |
| Nativo en Node.js | Requiere configuración adicional |
| clustering automático | Escalado manual |
| Logs integrados | Logs por contenedor |
| Auto-restart | Políticas de restart |
| Menor uso de memoria | Mayor uso de memoria |

### Configuración PM2

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'violet-erp-api',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'violet-erp-sync',
      script: './src/sync/sync-worker.js',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
```

### Comandos PM2

```bash
# Iniciar
pnpm pm2:setup

# Ver estado
pm2 status

# Ver logs
pnpm pm2:logs

# Reiniciar
pnpm pm2:restart

# Detener
pnpm pm2:stop

# Eliminar
pnpm pm2:delete
```

---

## 🔧 Nginx como Reverse Proxy

### Configuración

```nginx
# API
location /api {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# WebSocket
location /socket.io {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Frontend
location / {
    root /var/www/violet-erp/web;
    try_files $uri $uri/ /index.html;
}
```

### SSL/HTTPS

```bash
# Generar certificado (Let's Encrypt)
certbot --nginx -d violet-erp.com -d www.violet-erp.com
```

---

## 📊 Monitorización

### Estado de Sincronización

```javascript
const status = hybridSync.getSyncStatus();
// {
//   mode: 'both',
//   isSyncing: false,
//   lastSyncTime: Date,
//   pendingChanges: 0,
//   queueLength: 0,
//   cloudConnected: true
// }
```

### Logs

```bash
# Logs de API
tail -f apps/api/logs/combined.log

# Logs de sync
tail -f apps/api/logs/sync-combined.log

# Logs de errores
tail -f apps/api/logs/error.log
```

### Métricas PM2

```bash
# Monitor en tiempo real
pm2 monit

# Estadísticas
pm2 show violet-erp-api
```

---

## 🔐 Seguridad

### Firewall

```bash
# Puertos necesarios
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 22/tcp    # SSH (cambiar puerto en producción)
```

### Rate Limiting (Nginx)

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
```

### Headers de Seguridad

```nginx
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```

---

## 📁 Scripts de Base de Datos

```bash
# Migrar (crear esquema)
pnpm db:migrate

# Backup
pnpm db:backup

# Restaurar
pnpm db:restore <archivo>

# Sync manual
pnpm sync:local
pnpm sync:cloud
```

---

## 🏗️ Despliegue en Producción

### 1. Servidor Local (Sucursal)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2
npm install -g pm2

# Clonar proyecto
git clone <repo> violet-erp
cd violet-erp

# Instalar dependencias
pnpm install

# Configurar
cp .env.example .env
# Editar .env para modo local/híbrido

# Migrar BD
cd apps/api && pnpm db:migrate

# Iniciar con PM2
pnpm pm2:setup

# Guardar configuración PM2
pm2 save

# Iniciar PM2 en boot
pm2 startup
```

### 2. Servidor Nube (Central)

```bash
# Mismo proceso, pero configurar para modo cloud
# DATABASE_URL=postgresql://...
# HYBRID_MODE=cloud
```

### 3. Frontend

```bash
# Build
pnpm build:web

# Copiar a nginx
sudo cp -r apps/web/dist/* /var/www/violet-erp/web/
```

---

## 🔧 Troubleshooting

### Sync no funciona

```bash
# Verificar logs
pnpm pm2:logs

# Forzar sync
pm2 send violet-erp-sync 'sync:force'

# Ver estado
SELECT * FROM sync_state;
SELECT COUNT(*) FROM products_changes WHERE synced = 0;
```

### Conflictos

```bash
# Ver conflictos pendientes
SELECT * FROM sync_conflicts WHERE resolution IS NULL;

# Resolver manualmente
UPDATE sync_conflicts 
SET resolution = 'cloud-wins', resolved_at = CURRENT_TIMESTAMP 
WHERE id = <id>;
```

### Base de datos corrupta

```bash
# Restaurar último backup
pnpm db:restore

# O recrear desde cero
rm violet.db
pnpm db:migrate
```

---

## 📈 Mejores Prácticas

1. **Backups diarios**: `pnpm db:backup` en cron
2. **Monitorizar sync**: Alertas si pendingChanges > 1000
3. **Rotar logs**: Configurar logrotate para nginx
4. **SSL siempre**: Usar HTTPS en producción
5. **Firewall**: Solo puertos necesarios
6. **Actualizaciones**: Probar en staging antes de producción

---

<p align="center">
  <sub>Hecho con 💜 por Violet ERP Team</sub>
</p>
