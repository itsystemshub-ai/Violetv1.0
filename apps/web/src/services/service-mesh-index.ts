// Microservices & Backend-For-Frontend Exports

export { ApiGatewayService } from './bff/ApiGateway';
export { bffWeb } from './bff/BffWeb';
export { notifications } from './core/notifications/NotificationService';

// Domain Microservices
export { finanzasService } from './microservices/finanzas/FinanzasService';
export { ventasService } from './microservices/ventas/VentasService';
export { inventarioService } from './microservices/inventario/InventarioService';

export { featureFlags } from './core/config/FeatureFlagService';

// Interfaces
export type { APIGatewayRoute } from './bff/ApiGateway';
export type { NotificationPayload, NotificationChannel } from './core/notifications/NotificationService';
