# 🚀 Guía de Despliegue en Netlify

## Paso 1: Preparar el Repositorio en GitHub

1. Asegúrate de que tu código esté en GitHub
2. Haz commit de los archivos de configuración:
   ```bash
   git add netlify.toml .nvmrc
   git commit -m "Add Netlify configuration"
   git push origin main
   ```

## Paso 2: Conectar con Netlify

1. Ve a [Netlify](https://app.netlify.com)
2. Click en "Add new site" → "Import an existing project"
3. Selecciona "GitHub" y autoriza el acceso
4. Busca y selecciona tu repositorio "Violet v3"

## Paso 3: Configurar Build Settings

Netlify debería detectar automáticamente la configuración desde `netlify.toml`, pero verifica:

- **Build command:** `npm run build:production`
- **Publish directory:** `dist`
- **Node version:** 18

## Paso 4: Variables de Entorno (IMPORTANTE)

En la pantalla que te muestra, agrega estas variables de entorno:

### Variables OBLIGATORIAS (mínimo para que funcione):

```env
# JWT Secret - Genera uno nuevo con este comando en tu terminal:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
VITE_JWT_SECRET=tu-secret-key-generada-aqui-minimo-32-caracteres

# Habilitar usuarios mock para demo
VITE_ENABLE_MOCK_USERS=true

# Credenciales Super Admin
VITE_SUPER_ADMIN_USER=superadmin
VITE_SUPER_ADMIN_PASS=Violet@2026!
```

### Variables OPCIONALES (para funcionalidades adicionales):

```env
# API de Email (Resend) - 3,000 emails/mes gratis
# Regístrate en: https://resend.com
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# API de WhatsApp (CallMeBot) - Gratis
# Instrucciones: https://www.callmebot.com/blog/free-api-whatsapp-messages/
VITE_CALLMEBOT_APIKEY=xxxxxxx

# IA Self-Healing - Groq AI (Llama 3) - 14,400 req/día gratis
# Regístrate en: https://console.groq.com
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# IA Fallback - Gemini 2.0 Flash - 1,500 req/día gratis
# Regístrate en: https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# IA Último Recurso - Hugging Face (Mistral 7B) - Gratis
# Regístrate en: https://huggingface.co/settings/tokens
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Paso 5: Configuración de Secrets (Opcional)

Si tienes valores sensibles (API keys de producción), marca el checkbox "Contains secret values" para:
- `VITE_JWT_SECRET`
- `VITE_RESEND_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_HUGGINGFACE_API_KEY`

## Paso 6: Deploy

1. Click en "Deploy site"
2. Espera a que termine el build (5-10 minutos)
3. Una vez completado, tendrás una URL como: `https://tu-sitio.netlify.app`

## Paso 7: Configurar Dominio Personalizado (Opcional)

1. Ve a "Site settings" → "Domain management"
2. Click en "Add custom domain"
3. Sigue las instrucciones para configurar tu dominio

## 🔧 Comandos Útiles

### Generar JWT Secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Probar build localmente:
```bash
npm run build:production
npm run preview
```

### Ver logs de Netlify:
Ve a tu sitio en Netlify → "Deploys" → Click en el deploy → "Deploy log"

## ⚠️ Notas Importantes

1. **Base de Datos:** Esta versión usa almacenamiento local (IndexedDB/Dexie). Los datos se guardan en el navegador del usuario.

2. **Backend:** Si necesitas un backend real con PostgreSQL/Supabase, necesitarás:
   - Configurar Supabase (gratis hasta 500MB)
   - Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

3. **Funciones Serverless:** Si necesitas APIs backend, puedes usar Netlify Functions (incluido en el plan gratuito).

4. **Límites del Plan Gratuito:**
   - 100 GB bandwidth/mes
   - 300 build minutes/mes
   - Deploy ilimitados

## 🐛 Troubleshooting

### Error: "Build failed"
- Revisa los logs en Netlify
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `npm run build:production` funcione localmente

### Error: "Page not found" en rutas
- Verifica que `netlify.toml` tenga la configuración de redirects
- El archivo ya está configurado correctamente

### Error: "Environment variable not found"
- Verifica que todas las variables VITE_ estén configuradas en Netlify
- Las variables deben empezar con `VITE_` para ser accesibles en el frontend

## 📞 Soporte

Si tienes problemas, revisa:
- [Documentación de Netlify](https://docs.netlify.com)
- [Foro de Netlify](https://answers.netlify.com)
- Logs de build en tu dashboard de Netlify

---

**¡Listo!** Tu sistema Violet ERP estará disponible en la web 🎉
