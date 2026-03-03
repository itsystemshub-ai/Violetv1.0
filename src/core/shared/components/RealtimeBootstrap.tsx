import { useEffect } from "react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useInventoryStore } from "@/features/inventory/hooks/useInventoryStore";
import { useSalesStore } from "@/features/sales/hooks/useSalesStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInstanceStore } from "@/hooks/useInstanceStore";

/**
 * RealtimeBootstrap
 * Este componente no renderiza nada, pero se encarga de inicializar
 * todos los canales de Supabase Realtime cuando el usuario está autenticado.
 * También arranca el servicio de sincronización solo en el Maestro.
 */
export function RealtimeBootstrap() {
  const { user } = useAuth();
  const { activeTenantId, initializeRealtime: initSystem } = useSystemConfig();
  const { initializeRealtime: initUsers } = useUserManagement();
  const { initializeRealtime: initInventory } = useInventoryStore();
  const { initializeRealtime: initSales } = useSalesStore();
  const { role, isLoaded, loadInstanceInfo } = useInstanceStore();

  useEffect(() => {
    loadInstanceInfo();
  }, [loadInstanceInfo]);

  useEffect(() => {
    if (!user || !isLoaded) return;

    console.log(`[Instance] Rol detectado: ${role}`);

    // Solo el Maestro ejecuta el Worker de sincronización con la nube (Manejado por Electron)
    if (role === "master") {
      console.log("[Sync] Modo Maestro detectado.");
    }

    console.log("[Realtime] Inicializando suscripciones globales...");

    // Suscripciones globales (Configuración y Perfiles de Usuario)
    const cleanupSystem = initSystem();
    const cleanupUsers = initUsers();

    return () => {
      cleanupSystem();
      cleanupUsers();
    };
  }, [user, isLoaded, role, initSystem, initUsers]);

  useEffect(() => {
    if (!user || !activeTenantId || activeTenantId === "none" || !isLoaded)
      return;

    console.log(
      `[Realtime] Inicializando suscripciones para tenant: ${activeTenantId}`,
    );

    // Suscripciones específicas del Tenant (Inventario y Ventas)
    const cleanupInventory = initInventory(activeTenantId);
    const cleanupSales = initSales(activeTenantId);

    return () => {
      cleanupInventory();
      cleanupSales();
    };
  }, [user, activeTenantId, isLoaded, initInventory, initSales]);

  return null;
}
