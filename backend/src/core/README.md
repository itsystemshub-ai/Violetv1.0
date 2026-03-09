# Backend Core Services

Servicios transversales del backend utilizados por todos los módulos.

## Estructura

```
core/
├── database/       # Conexión y migraciones de base de datos
├── auth/           # JWT, autenticación y permisos
├── sync/           # Servicios de sincronización
├── ai/             # Servicios de IA (Groq)
└── shared/         # Logger, error handler, rate limiter
```

## Principios

- **Separation of Concerns**: Cada servicio tiene una responsabilidad única
- **Dependency Injection**: Los servicios reciben sus dependencias
- **Error Handling**: Manejo centralizado de errores
- **Logging**: Logging estructurado y centralizado

## Uso

```typescript
import { authMiddleware } from './core/auth/auth.middleware';
import { logger } from './core/shared/logger';
import { SyncService } from './core/sync/sync.service';
```
