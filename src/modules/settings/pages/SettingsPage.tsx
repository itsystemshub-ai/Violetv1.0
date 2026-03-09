import React, { useState, useEffect, Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  Server,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUserManagement } from "@/modules/settings/hooks/useUserManagement";
import { useInstanceStore } from "@/shared/hooks/useInstanceStore";
import { useAudit } from "@/modules/settings/hooks/useAudit";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { USER_ROLES, DEPARTMENTS, Tenant, User } from "@/lib";
import { NetworkService } from "@/services/LocalNetworkService";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";

// Lazy-loaded Organisms for Code Splitting
const SystemConfigPanel = lazy(
  () => import("@/modules/settings/components/organisms/SystemConfigPanel"),
);
const CompanyFiscalPanel = lazy(
  () => import("@/modules/settings/components/organisms/CompanyFiscalPanel"),
);
const UserManagementPanel = lazy(
  () => import("@/modules/settings/components/organisms/UserManagementPanel"),
);
const AIChatPanel = lazy(
  () => import("@/modules/settings/components/organisms/AIChatPanel"),
);
const SystemSecurityPanel = lazy(
  () => import("@/modules/settings/components/organisms/SystemSecurityPanel"),
);
const IntegrationsPanel = lazy(
  () => import("@/modules/settings/components/organisms/IntegrationsPanel"),
);
const NotificationsPanel = lazy(
  () => import("@/modules/settings/components/organisms/NotificationsPanel"),
);
const RolesPermissionsPage = lazy(
  () => import("@/modules/settings/pages/RolesPermissionsPage"),
);
const TaxesConfigPanel = lazy(
  () => import("@/modules/settings/components/organisms/TaxesConfigPanel"),
);
const PasswordRequestsPanel = lazy(
  () => import("@/modules/settings/components/organisms/PasswordRequestsPanel"),
);
const AutomationHubPanel = lazy(
  () => import("@/modules/settings/components/organisms/AutomationHubPanel"),
);

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12 w-full h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">
        Cargando módulo de configuración...
      </p>
    </div>
  </div>
);

/**
 * Determine which section to show based on the URL path
 */
function getActiveSection(pathname: string): string {
  if (pathname.includes("/settings/company")) return "company";
  if (pathname.includes("/settings/taxes")) return "taxes";
  if (pathname.includes("/settings/users")) return "users";
  if (pathname.includes("/settings/ai")) return "ai";
  if (pathname.includes("/settings/security")) return "security";
  if (pathname.includes("/settings/integrations")) return "integrations";
  if (pathname.includes("/settings/notifications")) return "notifications";
  if (pathname.includes("/settings/roles")) return "roles";
  if (pathname.includes("/settings/password-requests"))
    return "password-requests";
  if (pathname.includes("/settings/automation")) return "automation";
  if (pathname.includes("/settings/system")) return "system";
  return "company"; // default for /settings
}

export default function SettingsPage() {
  const location = useLocation();
  const activeSection = getActiveSection(location.pathname);

  const {
    tenant,
    allTenants,
    activeTenantId,
    setActiveTenant,
    updateTenantConfig,
    updateTenantById,
    createTenant,
    deleteTenant,
    isMaintenanceMode,
    setMaintenanceMode,
    exchangeRate,
    setExchangeRate,
    syncBcvRate,
    isLoading: isLoadingConfig,
    taxes,
  } = useSystemConfig();

  const { user: currentUser } = useAuth();
  const {
    users,
    isLoading: isLoadingUsers,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
  } = useUserManagement();

  const { instances, syncInstances } = useInstanceStore();
  const {
    auditLogs,
    syncLogs,
    dbStats,
    isLoading: isLoadingAudit,
    purgeAuditLogs,
    refresh: refreshAudit,
  } = useAudit();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: "",
    email: "",
    password: "",
    role: "user",
    department: "Ventas",
  });
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
    name: "",
    rif: "",
    address: "",
  });

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    await createUser(newUser as User);
    setIsAddUserOpen(false);
    setNewUser({
      username: "",
      email: "",
      password: "",
      role: "user",
      department: "Ventas",
    });
  };

  const handleAddTenant = async (tenantData?: Partial<Tenant>) => {
    const dataToUse = tenantData || newTenant;
    if (!dataToUse.name || !dataToUse.rif) {
      toast.error("Por favor completa el nombre y RIF de la empresa");
      return;
    }
    await createTenant(dataToUse as Tenant);
    setIsAddTenantOpen(false);
    setNewTenant({
      name: "",
      rif: "",
      address: "",
      fiscalName: "",
      slug: "",
      currency: "USD",
    });
  };

  const isMaster = currentUser?.isSuperAdmin;

  const renderActiveSection = () => {
    switch (activeSection) {
      case "company":
        return (
          <CompanyFiscalPanel
            tenant={tenant}
            updateTenantById={updateTenantById}
            isMaster={isMaster}
            isAddTenantOpen={isAddTenantOpen}
            setIsAddTenantOpen={setIsAddTenantOpen}
            newTenant={newTenant}
            setNewTenant={setNewTenant}
            handleAddTenant={handleAddTenant}
            allTenants={allTenants}
            activeTenantId={activeTenantId}
            setActiveTenant={setActiveTenant}
            deleteTenant={deleteTenant}
          />
        );
      case "taxes":
        return <TaxesConfigPanel />;
      case "users":
        return (
          <UserManagementPanel
            users={users}
            isLoading={isLoadingUsers}
            onUpdate={updateUser}
            onDelete={deleteUser}
            isMaster={isMaster}
            isAddUserOpen={isAddUserOpen}
            setIsAddUserOpen={setIsAddUserOpen}
            newUser={newUser}
            setNewUser={setNewUser}
            handleAddUser={handleAddUser}
          />
        );
      case "ai":
        return <AIChatPanel isMaster={isMaster} />;
      case "system":
        return (
          <SystemConfigPanel
            activeTenantId={activeTenantId}
            allTenants={allTenants}
            setActiveTenant={setActiveTenant}
            updateTenantById={updateTenantById}
            deleteTenant={deleteTenant}
            isMaintenanceMode={isMaintenanceMode}
            setMaintenanceMode={setMaintenanceMode}
            exchangeRate={exchangeRate}
            setExchangeRate={setExchangeRate}
            syncBcvRate={syncBcvRate}
            isLoading={isLoadingConfig}
            taxes={taxes}
            instances={instances}
            syncInstances={syncInstances}
            isMaster={isMaster}
          />
        );
      case "security":
        return (
          <SystemSecurityPanel
            auditLogs={auditLogs}
            syncLogs={syncLogs}
            dbStats={dbStats}
            purgeAuditLogs={purgeAuditLogs}
            refreshAudit={refreshAudit}
            isMaster={isMaster}
          />
        );
      case "integrations":
        return <IntegrationsPanel />;
      case "notifications":
        return <NotificationsPanel />;
      case "roles":
        return <RolesPermissionsPage />;
      case "password-requests":
        return <PasswordRequestsPanel />;
      case "automation":
        return <AutomationHubPanel />;
      default:
        return null;
    }
  };

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="min-h-full relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10 transition-colors duration-500" />
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-1000 -z-10" />

        <div className="space-y-8 relative z-0 p-4 sm:p-6">
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/30">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center">
                  <SettingsIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Configuración
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">
                    Administración del sistema y preferencias
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT - Rendered based on URL path */}
          <Suspense fallback={<LoadingFallback />}>
            {renderActiveSection()}
          </Suspense>
        </div>
      </div>
    </ValeryLayout>
  );
}
