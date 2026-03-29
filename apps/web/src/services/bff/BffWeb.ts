import { ApiGatewayService, APIGatewayRoute } from "./ApiGateway";
import { finanzasService } from "../microservices/finanzas/FinanzasService";
import { inventarioService } from "../microservices/inventario/InventarioService";
import { ventasService } from "../microservices/ventas/VentasService";

/**
 * BFF Web (Backend-For-Frontend)
 * Adapts and orchestrates multiple microservice calls for the Web SPA client.
 * Rather than the React client making 5 trips to different DOMAINS, it makes 1 trip here.
 */
export class BffWebService {
  private gateway: ApiGatewayService;

  constructor() {
    this.gateway = ApiGatewayService.getInstance();
  }

  /**
   * Dashboard Init Process
   * Fetches data from Auth MS, Finance MS, and Inventory MS in parallel 
   * and returns a single formatted payload to the Web SPA.
   */
  public async getDashboardData(token: string, tenantId: string) {
    const route: APIGatewayRoute = { domain: "bff-web", path: "/dashboard/init", authRequired: true, mfaRequired: false };

    // 1. Edge Auth Check via Gateway
    const isAuthorized = await this.gateway.authorizeRequest(route, token);
    if (!isAuthorized) throw new Error("Unauthorized Access from Edge Gateway.");

    // 2. Orchestrate calls to internal Microservices (Service Mesh)
    // Instead of using Gateway mock, we call the MS directly through their boundary
    const [accounts, inventory, sales] = await Promise.all([
      finanzasService.getAccounts(tenantId),
      inventarioService.getInventory(tenantId),
      ventasService.getSales(tenantId)
    ]);

    // Calculate aggregated metrics
    const totalAssets = accounts.filter(a => a.type === 'activo').reduce((acc, a) => acc + a.balance, 0);
    const lowStockItems = inventory.filter(i => i.stock < i.minStock || i.stock < 10);
    const totalSalesVolume = sales.reduce((acc, s) => acc + s.total, 0);

    // 3. Format and serialize data specifically for the Web SPA UI
    return {
      status: "success",
      aggregated: {
        finance: {
          totalAssets,
          accountsCount: accounts.length
        },
        inventory: {
          lowStockProducts: lowStockItems,
          lowStockCount: lowStockItems.length,
          totalItems: inventory.length
        },
        sales: {
          totalSalesVolume,
          totalSalesCount: sales.length,
          recentSales: sales.slice(0, 5)
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const bffWeb = new BffWebService();
