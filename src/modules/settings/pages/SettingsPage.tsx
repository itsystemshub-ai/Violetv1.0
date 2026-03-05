import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import {
  Building2,
  Users,
  BrainCircuit,
  ShieldCheck,
  Palette,
  Server,
  Settings as SettingsIcon,
  Sparkles,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUserManagement } from "@/modules/settings/hooks/useUserManagement";
import { useInstanceStore } from "@/shared/hooks/useInstanceStore";
import { useAudit } from "@/modules/settings/hooks/useAudit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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

export default function SettingsPage() {
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
  const { auditLogs } = useAudit();

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

  const handleGenerateDefaultUsers = async () => {
    try {
      const { generateDefaultUsers } = await import('@/data/defaultUsers');
      const defaultUsers = generateDefaultUsers(activeTenantId || 'default');
      
      let created = 0;
      for (const user of defaultUsers) {
        // Verificar si el usuario ya existe
        const existing = users.find(u => u.username === user.username);
        if (!existing) {
          await createUser(user);
          created++;
        }
      }
      
      if (created > 0) {
        toast.success(`${created} usuarios predeterminados creados exitosamente`);
        await fetchAllUsers();
      } else {
        toast.info('Todos los usuarios predeterminados ya existen');
      }
    } catch (error) {
      console.error('Error generating default users:', error);
      toast.error('Error al generar usuarios predeterminados');
    }
  };

  const handleAddTenant = async (tenantData?: Partial<Tenant>) => {
    const dataToUse = tenantData || newTenant;
    if (!dataToUse.name || !dataToUse.rif) {
      toast.error("Por favor completa el nombre y RIF de la empresa");
      return;
    }
    await createTenant(dataToUse as Tenant);
    setIsAddTenantOpen(false);
    // Resetear el formulario con valores vacíos
    setNewTenant({ 
      name: "", 
      rif: "", 
      address: "",
      fiscalName: "",
      slug: "",
      currency: "USD"
    });
  };

  const isMaster = currentUser?.isSuperAdmin;

  return (
    <div className="min-h-screen relative pb-12 animate-in fade-in duration-1000 overflow-hidden">
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

        {/* TABS SECTION */}
        <Tabs defaultValue="system" className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg inline-flex">
              <TabsTrigger value="system" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Sistema
              </TabsTrigger>
              <TabsTrigger value="company" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Empresa
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                IA
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-full px-6 data-[state=active]:bg-linear-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                Sistema & Seguridad
              </TabsTrigger>
            </TabsList>
          </div>

          <Suspense fallback={<LoadingFallback />}>
            <TabsContent value="system">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="group relative rounded-xl p-3 backdrop-blur-xl bg-card/80 border transition-all duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1 border-violet-400/30 hover:border-violet-400/60">
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-violet-400/20 to-transparent" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110 bg-linear-to-br from-violet-400/20 to-violet-400/5 border border-violet-400/30">
                    <Building2 className="w-4 h-4 text-violet-400" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
                    Empresas Activas
                  </p>
                  <p className="text-xl font-black text-foreground mb-2 tracking-tight">
                    {allTenants?.length || 0}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-lime-500 dark:text-lime-400" />
                    <span className="text-[10px] font-black text-lime-500 dark:text-lime-400">
                      Multi-tenant
                    </span>
                  </div>
                </div>

                <div className="group relative rounded-xl p-3 backdrop-blur-xl bg-card/80 border transition-all duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1 border-indigo-400/30 hover:border-indigo-400/60">
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-indigo-400/20 to-transparent" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110 bg-linear-to-br from-indigo-400/20 to-indigo-400/5 border border-indigo-400/30">
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
                    Usuarios Totales
                  </p>
                  <p className="text-xl font-black text-foreground mb-2 tracking-tight">
                    {users?.length || 0}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-lime-500 dark:text-lime-400" />
                    <span className="text-[10px] font-black text-lime-500 dark:text-lime-400">
                      Activos
                    </span>
                  </div>
                </div>

                <div className="group relative rounded-xl p-3 backdrop-blur-xl bg-card/80 border transition-all duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1 border-emerald-400/30 hover:border-emerald-400/60">
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-emerald-400/20 to-transparent" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110 bg-linear-to-br from-emerald-400/20 to-emerald-400/5 border border-emerald-400/30">
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
                    Instancias Red
                  </p>
                  <p className="text-xl font-black text-foreground mb-2 tracking-tight">
                    {instances?.length || 0}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-lime-500 dark:text-lime-400" />
                    <span className="text-[10px] font-black text-lime-500 dark:text-lime-400">
                      Sincronizadas
                    </span>
                  </div>
                </div>

                <div className="group relative rounded-xl p-3 backdrop-blur-xl bg-card/80 border transition-all duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1 border-amber-400/30 hover:border-amber-400/60">
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10 bg-linear-to-br from-amber-400/20 to-transparent" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-all duration-500 group-hover:scale-110 bg-linear-to-br from-amber-400/20 to-amber-400/5 border border-amber-400/30">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-1">
                    Eventos Auditoría
                  </p>
                  <p className="text-xl font-black text-foreground mb-2 tracking-tight">
                    {auditLogs?.length || 0}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-lime-500 dark:text-lime-400" />
                    <span className="text-[10px] font-black text-lime-500 dark:text-lime-400">
                      Registrados
                    </span>
                  </div>
                </div>
              </div>

              <SystemConfigPanel
                tenant={tenant}
                allTenants={allTenants}
                activeTenantId={activeTenantId}
                setActiveTenant={setActiveTenant}
                updateTenantConfig={updateTenantConfig}
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
            </TabsContent>

            <TabsContent value="company">
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
            </TabsContent>

            <TabsContent value="users">
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
                onGenerateDefaultUsers={handleGenerateDefaultUsers}
              />
            </TabsContent>

            <TabsContent value="ai">
              <AIChatPanel isMaster={isMaster} />
            </TabsContent>

            <TabsContent value="security">
              <SystemSecurityPanel
                auditLogs={auditLogs}
                isMaster={isMaster}
              />
            </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </div>
  );
}
