/**
 * API Gateway (Conceptual) - Interceptor & Router
 * 
 * In a Hybrid Architecture, this acts as the primary access point (after Edge/WAF/Rate Limiting).
 * Determines authorization, routes to respective BFFs or Microservices directly, and 
 * manages central configuration flags.
 */

import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { toast } from "sonner";

export interface APIGatewayRoute {
  domain: string;
  path: string;
  authRequired: boolean;
  mfaRequired: boolean;
}

export class ApiGatewayService {
  private static instance: ApiGatewayService;

  private constructor() {}

  public static getInstance(): ApiGatewayService {
    if (!ApiGatewayService.instance) {
      ApiGatewayService.instance = new ApiGatewayService();
    }
    return ApiGatewayService.instance;
  }

  // Pre-flight Authorization Check (Edge deciding Auth + Role)
  public async authorizeRequest(route: APIGatewayRoute, token: string | null): Promise<boolean> {
    if (!route.authRequired) return true;

    if (!token) {
      toast.error("Gateway: No token provided. Access Rejected.");
      return false;
    }

    // TODO: Connect to external IdP (Identity Provider) or validate local Supabase session.
    return true; 
  }

  // Routes requests to the Service Mesh (Microservices Layer)
  public async routeToService<T>(route: APIGatewayRoute, payload: any): Promise<T | null> {
    console.log(`[Service Mesh] Routing to -> ${route.domain}:${route.path}`);
    
    try {
      const response = await fetch(`${route.domain}${route.path}`, {
        method: payload ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: payload ? JSON.stringify(payload) : undefined
      });

      if (!response.ok) return null;
      return await response.json() as T;
    } catch (error) {
      console.error(`[Gateway Error] Failed to route to ${route.domain}`, error);
      return null;
    }
  }
}
