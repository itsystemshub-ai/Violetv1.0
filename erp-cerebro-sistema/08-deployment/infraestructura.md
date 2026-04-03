# Módulo 08: DEPLOYMENT - Infraestructura y Despliegue

## Descripción

Este módulo documenta la infraestructura y el proceso de despliegue del ERP ZENITH en servicios cloud. **NO usa Docker**, se despliega directamente en Railway para backend y Vercel para frontend.

## 🏗️ Arquitectura de Infraestructura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS + CDN)                      │
│              • DNS Management                                   │
│              • SSL/TLS                                          │
│              • R2 Storage (archivos)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌───────────────────────┐   ┌───────────────────────┐
│      VERCEL           │   │      RAILWAY          │
│   (Frontend Next.js)  │   │  (Backend NestJS)     │
│                       │   │                       │
│ • Next.js 14          │   │ • NestJS 10           │
│ • Static Generation   │   │ • REST API            │
│ • Edge Functions      │   │ • Prisma ORM          │
│ • Auto SSL            │   │ • Auto SSL            │
│ • Custom Domain       │   │ • Custom Domain       │
└───────────────────────┘   └──────────┬────────────┘
                                       │
                                       │ Prisma Client
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEON (PostgreSQL Serverless)                 │
│              • PostgreSQL 15                                     │
│              • Serverless (auto-scaling)                         │
│              • Branching                                         │
│              • Backups automáticos                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    N8N.CLOUD (Automatización)                   │
│              • Webhooks                                          │
│              • Cron jobs                                         │
│              • Integraciones                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Servicios Utilizados

| Servicio | Propósito | Plan | Costo Estimado |
|----------|-----------|------|----------------|
| **Vercel** | Frontend Next.js | Pro | $20/mes |
| **Railway** | Backend NestJS | Standard | $20/mes |
| **Neon** | PostgreSQL DB | Free/Pro | $0-19/mes |
| **Cloudflare R2** | Almacenamiento archivos | Free tier | $0-5/mes |
| **n8n.cloud** | Automatización | Starter | $20/mes |
| **Total** | | | **~$60-84/mes** |

---

## 🔧 Configuración del Backend (Railway)

### Paso 1: Preparar Proyecto para Railway

```json
// apps/backend/package.json (scripts importantes)
{
  "name": "erp-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:prod": "node dist/main",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "postinstall": "prisma generate"
  }
}
```

### Paso 2: Railway Configuration

```toml
# railway.toml (en raíz del backend)
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm run prisma:migrate && npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Paso 3: Variables de Entorno en Railway

```bash
# .env.production (configurar en Railway UI)

# Base de Datos (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/erp?sslmode=require"

# JWT
JWT_SECRET="super-secret-key-min-32-characters-long"
JWT_REFRESH_SECRET="another-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="8h"

# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID="xxx"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="xxx"
CLOUDFLARE_R2_ENDPOINT="https://account-id.r2.cloudflarestorage.com"
CLOUDFLARE_R2_BUCKET="erp-files"
CLOUDFLARE_R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# IA
HF_TOKEN="hf_xxx"
GEMINI_API_KEY="xxx"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="erp@empresa.com"
SMTP_PASS="app-password"
SMTP_FROM="ERP Venezuela <erp@empresa.com>"

# n8n
N8N_WEBHOOK_URL="https://n8n.cloud/webhook"
N8N_API_KEY="xxx"

# App
PORT="3000"
NODE_ENV="production"
FRONTEND_URL="https://erp.empresa.com"
API_URL="https://api.erp.empresa.com"
```

### Paso 4: Main.ts Configurado para Producción

```typescript
// apps/backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ─────────────────────────────────────────────────────────────
  // SEGURIDAD
  // ─────────────────────────────────────────────────────────────
  
  app.use(helmet({
    contentSecurityPolicy: false, // Desactivar para SPA
    crossOriginEmbedderPolicy: false,
  }));
  
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // ─────────────────────────────────────────────────────────────
  // COMPRESIÓN
  // ─────────────────────────────────────────────────────────────
  
  app.use(compression());

  // ─────────────────────────────────────────────────────────────
  // VALIDACIÓN GLOBAL
  // ─────────────────────────────────────────────────────────────
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // ─────────────────────────────────────────────────────────────
  // PREFIJO GLOBAL
  // ─────────────────────────────────────────────────────────────
  
  app.setGlobalPrefix('api/v1');

  // ─────────────────────────────────────────────────────────────
  // SWAGGER (Solo en desarrollo)
  // ─────────────────────────────────────────────────────────────
  
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ERP ZENITH API')
      .setDescription('API documentation for ERP ZENITH')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ─────────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ─────────────────────────────────────────────────────────────
  
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // PUERTO (Railway asigna puerto automáticamente)
  // ─────────────────────────────────────────────────────────────
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  console.log(`❤️ Health: http://localhost:${port}/health`);
}

bootstrap();
```

---

## 🎨 Configuración del Frontend (Vercel)

### Paso 1: Next.config.js Optimizado

```javascript
// apps/frontend/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imágenes externas permitidas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev', // Cloudflare R2
      },
    ],
  },
  
  // Variables de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    NEXT_PUBLIC_APP_NAME: 'ERP ZENITH',
  },
  
  // Optimizaciones de producción
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Paso 2: Variables de Entorno en Vercel

```bash
# Configurar en Vercel UI (Project Settings > Environment Variables)

NEXT_PUBLIC_API_URL="https://api.erp.empresa.com"
NEXT_PUBLIC_R2_PUBLIC_URL="https://pub-xxx.r2.dev"
NEXT_PUBLIC_APP_NAME="ERP ZENITH"

# Production
NEXT_PUBLIC_BASE_URL="https://erp.empresa.com"

# Staging (opcional)
NEXT_PUBLIC_BASE_URL_STAGING="https://staging.erp.empresa.com"
```

### Paso 3: vercel.json (Opcional)

```json
{
  "framework": "nextjs",
  "regions": ["iad1"], // US East
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.erp.empresa.com/api/:path*"
    }
  ]
}
```

---

## 🗄️ Base de Datos (Neon PostgreSQL)

### Paso 1: Crear Proyecto en Neon

1. Ir a https://neon.tech
2. Crear nuevo proyecto
3. Obtener connection string

### Paso 2: Configurar Prisma

```prisma
# apps/backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL") // Para migraciones
}
```

### Paso 3: Migraciones

```bash
# Desarrollo local
npx prisma migrate dev --name init

# Producción (Railway ejecuta automáticamente)
npx prisma migrate deploy

# Generar Prisma Client
npx prisma generate
```

### Paso 4: Seed (Datos Iniciales)

```typescript
// apps/backend/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ─────────────────────────────────────────────────────────────
  // ROLES DEL SISTEMA
  // ─────────────────────────────────────────────────────────────
  
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador del Sistema',
      color: '#dc2626',
      icon: 'crown',
      isSystem: true,
    },
  });

  const contadorRole = await prisma.role.upsert({
    where: { name: 'CONTADOR' },
    update: {},
    create: {
      name: 'CONTADOR',
      description: 'Contador',
      color: '#2563eb',
      icon: 'calculator',
      isSystem: true,
    },
  });

  const vendedorRole = await prisma.role.upsert({
    where: { name: 'VENDEDOR' },
    update: {},
    create: {
      name: 'VENDEDOR',
      description: 'Vendedor',
      color: '#db2777',
      icon: 'shopping-cart',
      isSystem: true,
    },
  });

  // ─────────────────────────────────────────────────────────────
  // USUARIO ADMIN POR DEFECTO
  // ─────────────────────────────────────────────────────────────
  
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      username: 'admin',
      passwordHash,
      name: 'Administrador',
      firstName: 'Administrador',
      lastName: 'del Sistema',
      cedula: 'V-00000000',
      roleId: adminRole.id,
      isActive: true,
      isVerified: true,
    },
  });

  // ─────────────────────────────────────────────────────────────
  // CONFIGURACIÓN DE EMPRESA
  // ─────────────────────────────────────────────────────────────
  
  await prisma.companyConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      businessName: 'Empresa C.A.',
      rif: 'J-00000000-0',
      address: 'Dirección fiscal',
      phone: '',
      email: '',
      fiscalYear: 'ENERO-DICIEMBRE',
      currency: 'VES',
      taxRate: 0.16,
      invoicePrefix: 'F',
      invoiceControl: '00-00000001',
      invoiceSeries: 'A',
      nextInvoiceNum: 1,
      checkStock: true,
      allowNegativeStock: false,
      valuationMethod: 'PROMEDIO',
    },
  });

  // ─────────────────────────────────────────────────────────────
  // POLÍTICAS DE SEGURIDAD
  // ─────────────────────────────────────────────────────────────
  
  await prisma.securityPolicy.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Default',
      minPasswordLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true,
      passwordHistory: 5,
      passwordExpiryDays: 90,
      maxConcurrentSessions: 3,
      sessionTimeoutMinutes: 480,
      inactiveTimeoutMinutes: 30,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      enableAuditLog: true,
      auditLogRetentionDays: 365,
    },
  });

  console.log('✅ Seed completado');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## ☁️ Cloudflare R2 (Almacenamiento)

### Configuración

```typescript
// apps/backend/src/modules/common/r2.service.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class R2Service {
  private s3: S3Client;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: this.config.get('CLOUDFLARE_R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.get('CLOUDFLARE_R2_BUCKET'),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3.send(command);
    return this.getPublicUrl(key);
  }

  async getPublicUrl(key: string): Promise<string> {
    return `${this.config.get('CLOUDFLARE_R2_PUBLIC_URL')}/${key}`;
  }

  async generatePresignedPutUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.get('CLOUDFLARE_R2_BUCKET'),
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.get('CLOUDFLARE_R2_BUCKET'),
      Key: key,
    });

    await this.s3.send(command);
  }
}
```

### Estructura de Carpetas en R2

```
erp-files/
├── facturas/
│   ├── F2024-000001.pdf
│   ├── F2024-000001.xml
│   └── ...
├── receipts/
│   ├── user-id/
│   │   └── payroll-id.pdf
│   └── ...
├── reports/
│   ├── libro-diario-2024-01.xlsx
│   ├── libro-ventas-2024-01.xlsx
│   └── ...
├── documents/
│   ├── employees/
│   ├── suppliers/
│   └── customers/
├── avatars/
│   └── user-id.jpg
└── backups/
    └── db-2024-01-01.sql.gz
```

---

## 🔄 n8n Cloud (Automatización)

### Webhooks Principales

```typescript
// Webhooks que el backend dispara a n8n

// 1. Facturación Electrónica
POST https://n8n.cloud/webhook/factura-electronica
Body: { sale: {...} }

// 2. Alerta de Stock Bajo
POST https://n8n.cloud/webhook/stock-bajo
Body: { products: [...] }

// 3. Recordatorio de Cobranza
POST https://n8n.cloud/webhook/recordatorio-cobro
Body: { receivable: {...} }

// 4. Aprobación de Compras
POST https://n8n.cloud/webhook/aprobacion-compra
Body: { purchaseOrder: {...} }
```

### Flujos n8n Esenciales

1. **Facturación Electrónica SENIAT**
   - Trigger: Webhook factura-electronica
   - Acciones: Generar XML → Firmar → Enviar SENIAT → Subir PDF a R2

2. **Alerta de Stock Bajo**
   - Trigger: Cron cada 6 horas
   - Acciones: Consultar stock → Filtrar < mínimo → Enviar email a compras

3. **Recordatorio de Cobranza**
   - Trigger: Cron diario
   - Acciones: Consultar vencidas → Enviar email recordatorio

4. **Backup Automático**
   - Trigger: Cron diario 2am
   - Acciones: pg_dump → Comprimir → Subir a R2 → Limpiar antiguos

---

## 📊 Monitoreo y Logs

### Health Check Endpoints

```typescript
// Backend: /health

GET https://api.erp.empresa.com/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production"
}
```

### Logs en Railway

```bash
# Ver logs en tiempo real
railway logs --follow

# Ver logs de errores
railway logs --status error

# Ver logs de un deploy específico
railway logs --deployment=xxx
```

### Logs en Vercel

```bash
# Ver logs en tiempo real
vercel logs

# Ver logs de una función específica
vercel logs --follow
```

---

## 🚀 Pipeline de CI/CD

### GitHub Actions (Opcional)

```yaml
# .github/workflows/deploy.yml

name: Deploy ERP

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run prisma:generate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - run: npm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/frontend
```

---

## ⚠️ Consideraciones de Producción

1. **Backups**: Configurar backups automáticos en Neon (diarios)
2. **SSL**: Todos los servicios tienen SSL automático
3. **CDN**: Cloudflare para DNS y CDN
4. **Logs**: Retener logs por 30 días mínimo
5. **Monitoreo**: Configurar alertas de uptime
6. **Escalado**: Railway y Vercel escalan automáticamente
7. **Costos**: Monitorear uso para evitar sorpresas

---

## 📁 Checklist de Deploy

### Pre-Deploy

- [ ] Variables de entorno configuradas en Railway
- [ ] Variables de entorno configuradas en Vercel
- [ ] Base de datos Neon creada
- [ ] Bucket R2 configurado
- [ ] n8n workflows importados
- [ ] Dominios configurados en Cloudflare

### Deploy Inicial

- [ ] Backend desplegado en Railway
- [ ] Frontend desplegado en Vercel
- [ ] Migraciones ejecutadas (`prisma migrate deploy`)
- [ ] Seed ejecutado (`npx prisma db seed`)
- [ ] Health check pasando

### Post-Deploy

- [ ] Login de admin funciona
- [ ] Permisos RBAC configurados
- [ ] Configuración de empresa creada
- [ ] Prueba de venta completa
- [ ] Prueba de facturación
- [ ] Backups configurados

---

## 📁 Archivos del Módulo

```
08-deployment/
├── infraestructura.md (este archivo)
├── railway.md
├── vercel.md
├── neon.md
├── cloudflare-r2.md
└── variables-entorno.md
```

**Anterior**: `07-integraciones/n8n.md` | **Siguiente**: N/A (último módulo)

---

## 🔗 Referencias

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [n8n Documentation](https://docs.n8n.io)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NestJS Deployment](https://docs.nestjs.com/techniques/deployment)
