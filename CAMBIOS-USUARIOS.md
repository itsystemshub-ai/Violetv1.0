# 📋 Cambios en Gestión de Usuarios

## ✅ Cambios Aplicados

### 1. Inicio Automático del Servidor Proxy

**Antes:**
```bash
# Tenías que ejecutar dos comandos en terminales separadas
Terminal 1: npm run dev
Terminal 2: cd server && npm start
```

**Ahora:**
```bash
# Un solo comando inicia todo
npm run dev
```

**Qué inicia:**
- ✅ Servidor Vite (puerto 5173) - Aplicación web
- ✅ Servidor Proxy IA (puerto 3001) - API de IA

---

### 2. Columna de Contraseña en Tabla de Usuarios

**Ubicación:** Configuración → Usuarios

**Nueva Estructura de la Tabla:**

| Usuario | Rol | Email | **Contraseña** ⬅️ NUEVO | Acciones |
|---------|-----|-------|----------|----------|
| superadmin | Super Admin | admin@violet.com | `Violet@2026!` | ⋮ |
| jperez | Gerente | jperez@empresa.com | `Pass123!` | ⋮ |
| mgarcia | Vendedor | mgarcia@empresa.com | `Venta456` | ⋮ |

**Características:**
- ✅ Muestra la contraseña en formato código
- ✅ Fácil de copiar
- ✅ Visible para administradores
- ✅ Útil para recuperación de contraseñas

---

## 🎯 Beneficios

### Inicio Automático:
1. **Más rápido** - Un solo comando
2. **Menos errores** - No olvidas iniciar el proxy
3. **Mejor experiencia** - Todo funciona desde el inicio

### Columna de Contraseña:
1. **Recuperación fácil** - Los admins pueden ver las contraseñas
2. **Soporte rápido** - Ayuda a usuarios que olvidaron su contraseña
3. **Gestión eficiente** - Todo en una sola vista

---

## 🚀 Cómo Usar

### Para Desarrollo:

1. **Detén el servidor actual** (si está corriendo):
   ```bash
   Ctrl + C
   ```

2. **Inicia con el nuevo comando:**
   ```bash
   npm run dev
   ```

3. **Verás en la terminal:**
   ```
   🚀 Groq Proxy Server running on http://localhost:3001
   📡 Endpoint: http://localhost:3001/api/groq/chat
   💚 Health Check: http://localhost:3001/health
   
   VITE v6.4.1  ready in 1234 ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

4. **Abre la aplicación:**
   - Ve a http://localhost:5173
   - Login con tus credenciales
   - Ve a Configuración → Usuarios
   - Verás la nueva columna "Contraseña"

---

## 📊 Vista Previa de la Tabla

```
╔════════════════════════════════════════════════════════════════════════════╗
║                          GESTIÓN DE USUARIOS                               ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  VENTAS                                                                 3  ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Usuario      │ Rol       │ Email              │ Contraseña    │ ⋮   │ ║
║  ├──────────────────────────────────────────────────────────────────────┤ ║
║  │ jperez       │ Gerente   │ jperez@...         │ Pass123!      │ ⋮   │ ║
║  │ mgarcia      │ Vendedor  │ mgarcia@...        │ Venta456      │ ⋮   │ ║
║  │ lrodriguez   │ Vendedor  │ lrodriguez@...     │ Vend789       │ ⋮   │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
║  FINANZAS                                                               2  ║
║  ┌──────────────────────────────────────────────────────────────────────┐ ║
║  │ Usuario      │ Rol       │ Email              │ Contraseña    │ ⋮   │ ║
║  ├──────────────────────────────────────────────────────────────────────┤ ║
║  │ cmartinez    │ Contador  │ cmartinez@...      │ Conta123      │ ⋮   │ ║
║  │ alopez       │ Analista  │ alopez@...         │ Anali456      │ ⋮   │ ║
║  └──────────────────────────────────────────────────────────────────────┘ ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## ⚠️ Notas Importantes

### Seguridad:
- Las contraseñas se muestran solo a usuarios con rol de administrador
- En producción, considera ocultar las contraseñas por defecto
- Agrega un botón "Mostrar/Ocultar" si es necesario

### Desarrollo:
- El servidor proxy se reinicia automáticamente con cambios
- Si el puerto 3001 está ocupado, cambia el puerto en `server/groq-proxy.cjs`
- Los logs del proxy aparecen en la misma terminal

---

## 🔧 Solución de Problemas

### El servidor proxy no inicia:

**Problema:** Puerto 3001 ocupado

**Solución:**
```powershell
# Encontrar y detener el proceso
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
Stop-Process -Id [PID] -Force
```

### La columna de contraseña no aparece:

**Problema:** Caché del navegador

**Solución:**
1. Recarga la página con Ctrl + F5
2. O limpia el caché del navegador
3. O abre en modo incógnito

### Las contraseñas aparecen como "••••••••":

**Problema:** El usuario no tiene contraseña guardada

**Solución:**
1. Edita el usuario
2. Establece una nueva contraseña
3. Guarda los cambios

---

## 📝 Comandos Útiles

```bash
# Desarrollo normal (con proxy)
npm run dev

# Solo Vite (sin proxy)
npm run dev:vite

# Solo el proxy
cd server && npm start

# Desarrollo con host expuesto
npm run dev:host

# Build de producción
npm run build:production
```

---

**Última actualización:** 2026-03-06
**Versión:** 0.0.1
**Estado:** ✅ Operativo
