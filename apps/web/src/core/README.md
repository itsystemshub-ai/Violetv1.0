# Core Services

Servicios transversales utilizados por todos los módulos de la aplicación.

## Estructura

```
core/
├── auth/           # Autenticación y autorización
├── database/       # Base de datos local (IndexedDB)
├── sync/           # Motor de sincronización
├── ai/             # Servicios de IA (Groq)
├── security/       # Seguridad y encriptación
├── api/            # API Gateway y servicios HTTP
└── shared/         # Utilidades compartidas
```

## Principios

- **Local-First**: Todas las operaciones se hacen primero en local
- **Offline-First**: La aplicación funciona sin conexión
- **Sync en Background**: Sincronización automática cuando hay conexión
- **Conflict Resolution**: Resolución automática de conflictos

## Dependencias

- Core puede importar de `@shared/*`
- Core NO puede importar de `@modules/*`
- Core NO puede importar de `@infrastructure/*`

## Uso

```typescript
import { useAuth } from '@core/auth';
import { localDb } from '@core/database';
import { SyncEngine } from '@core/sync';
import { useAI } from '@core/ai';
```
