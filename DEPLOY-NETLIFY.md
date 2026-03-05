# 🚀 Despliegue Rápido en Netlify - Violet ERP

## ✅ Paso 1: Ir a Netlify

1. Abre tu navegador y ve a: **https://app.netlify.com**
2. Inicia sesión con tu cuenta de GitHub

## ✅ Paso 2: Importar Proyecto

1. Click en **"Add new site"** (botón verde)
2. Selecciona **"Import an existing project"**
3. Click en **"Deploy with GitHub"**
4. Busca tu repositorio: **"Violet v1"** o **"Violet-v1---1247pm---copia"**
5. Click en el repositorio para seleccionarlo

## ✅ Paso 3: Configurar Build (Auto-detectado)

Netlify debería mostrar automáticamente:
- **Branch to deploy:** `Violetv1`
- **Build command:** `npm run build:production`
- **Publish directory:** `dist`

Si no aparece, agrégalo manualmente.

## ✅ Paso 4: Agregar Variables de Entorno

**IMPORTANTE:** Antes de hacer deploy, agrega estas variables:

### En la sección "Environment variables", agrega:

#### Variable 1 (OBLIGATORIA):
```
Key: VITE_JWT_SECRET
Value: e7656d54e317dd5acdc7d3d155bcaa2b5d0dac7f7da9dc0cffa25ffbbc1c6da528be8cd410601f6b3d3852d022ea4e77c88ab06e5e8f69db8b3bea73ecc2433a
☑️ Contains secret values (marca el checkbox)
```

#### Variable 2 (OBLIGATORIA):
```
Key: VITE_ENABLE_MOCK_USERS
Value: true
☐ Contains secret values (NO marcar)
```

#### Variable 3 (OBLIGATORIA):
```
Key: VITE_SUPER_ADMIN_USER
Value: superadmin
☐ Contains secret values (NO marcar)
```

#### Variable 4 (OBLIGATORIA):
```
Key: VITE_SUPER_ADMIN_PASS
Value: Violet@2026!
☑️ Contains secret values (marca el checkbox)
```

## ✅ Paso 5: Deploy

1. Click en **"Deploy [nombre-del-sitio]"** (botón azul)
2. Espera 5-10 minutos mientras se construye
3. Verás el progreso en tiempo real

## ✅ Paso 6: Acceder a tu Sitio

Una vez completado el deploy:
1. Verás un mensaje: **"Site is live"** ✅
2. Tu URL será algo como: `https://violet-erp-xxxxx.netlify.app`
3. Click en la URL para abrir tu sistema

## 🔐 Credenciales de Acceso

Para entrar al sistema usa:
- **Usuario:** `superadmin`
- **Contraseña:** `Violet@2026!`

## 🎨 Personalizar Dominio (Opcional)

Si quieres cambiar la URL:
1. Ve a **"Site settings"** → **"Domain management"**
2. Click en **"Options"** → **"Edit site name"**
3. Cambia el nombre (ej: `violet-erp-tuempresa`)
4. Tu nueva URL será: `https://violet-erp-tuempresa.netlify.app`

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a la rama `Violetv1`, Netlify:
1. Detectará los cambios automáticamente
2. Construirá la nueva versión
3. Desplegará los cambios en 5-10 minutos

## 📊 Monitoreo

Para ver el estado de tu sitio:
1. Ve a tu dashboard de Netlify
2. Click en tu sitio
3. Verás:
   - **Deploys:** Historial de despliegues
   - **Functions:** APIs serverless (si las usas)
   - **Analytics:** Estadísticas de uso
   - **Logs:** Registros de errores

## ⚠️ Solución de Problemas

### Error: "Build failed"
1. Ve a **"Deploys"** → Click en el deploy fallido
2. Lee el **"Deploy log"** para ver el error
3. Soluciones comunes:
   - Verifica que las variables de entorno estén correctas
   - Asegúrate de que `npm run build:production` funcione localmente

### Error: "Page not found" en rutas
- Ya está solucionado con `netlify.toml`
- Si persiste, verifica que el archivo `netlify.toml` esté en la raíz

### Error: Variables de entorno no funcionan
- Asegúrate de que empiecen con `VITE_`
- Después de agregar variables, haz un nuevo deploy:
  - **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

## 📞 Recursos

- **Documentación:** https://docs.netlify.com
- **Soporte:** https://answers.netlify.com
- **Status:** https://www.netlifystatus.com

---

## 🎉 ¡Listo!

Tu sistema Violet ERP está ahora en la nube y accesible desde cualquier lugar.

**URL de ejemplo:** https://violet-erp-xxxxx.netlify.app

**Próximos pasos opcionales:**
- Configurar dominio personalizado
- Agregar API keys para email/WhatsApp/IA
- Configurar Supabase para base de datos en la nube
- Habilitar analytics de Netlify

---

**Creado:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Versión:** Violet ERP v3
**Branch:** Violetv1
