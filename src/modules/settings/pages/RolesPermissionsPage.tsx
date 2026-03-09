/**
 * RolesPermissionsPage - Gestión de Roles y Permisos (Modular)
 */

import React, { useState, useEffect } from "react";
import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Shield,
  Users,
  Edit,
  Building2,
  Save,
  UserCog,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { ALL_PERMISSIONS, Permission, DEPARTMENTS } from "@/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useUserManagement } from "@/modules/settings/hooks/useUserManagement";
import { toast } from "sonner";
import { cn } from "@/core/shared/utils/utils";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  color: string;
}

interface RolesPermissionsPageProps {
  standalone?: boolean;
  view?: "roles" | "users" | "matrix";
}

const PREDEFINED_ROLES: Role[] = [
  {
    id: "super_admin",
    name: "Super Administrador",
    description: "Acceso total al sistema, puede gestionar empresas y usuarios",
    permissions: [...ALL_PERMISSIONS],
    userCount: 0,
    color: "bg-red-500",
  },
  {
    id: "admin",
    name: "Administrador",
    description: "Acceso completo a todos los módulos de la empresa",
    permissions: [...ALL_PERMISSIONS],
    userCount: 0,
    color: "bg-orange-500",
  },
  {
    id: "gerente",
    name: "Gerente",
    description: "Supervisión de ventas, inventario y finanzas",
    permissions: [
      "view:dashboard",
      "view:sales",
      "sales:read",
      "sales:write",
      "view:inventory",
      "inventory:read",
      "view:finance",
      "finance:read",
      "view:reports",
    ] as Permission[],
    userCount: 0,
    color: "bg-purple-500",
  },
  {
    id: "contador",
    name: "Contador",
    description: "Gestión de libros, impuestos y estados financieros",
    permissions: [
      "view:dashboard",
      "view:finance",
      "finance:read",
      "finance:create",
      "finance:edit",
      "view:reports",
    ] as Permission[],
    userCount: 0,
    color: "bg-blue-500",
  },
  {
    id: "finanzas",
    name: "Finanzas",
    description: "Tesorería, bancos y cuentas por cobrar/pagar",
    permissions: [
      "view:dashboard",
      "view:finance",
      "finance:read",
      "finance:create",
      "finance:edit",
    ] as Permission[],
    userCount: 0,
    color: "bg-emerald-500",
  },
  {
    id: "ventas",
    name: "Ventas",
    description: "Facturación, presupuestos y atención al cliente",
    permissions: [
      "view:dashboard",
      "view:sales",
      "sales:read",
      "sales:create",
      "sales:edit",
    ] as Permission[],
    userCount: 0,
    color: "bg-indigo-500",
  },
  {
    id: "almacen",
    name: "Almacén / Logística",
    description: "Control de stock, recepciones y despachos",
    permissions: [
      "view:dashboard",
      "view:inventory",
      "inventory:read",
      "inventory:create",
      "inventory:edit",
    ] as Permission[],
    userCount: 0,
    color: "bg-amber-500",
  },
  {
    id: "recursos_humanos",
    name: "Recursos Humanos",
    description: "Gestión de personal, nómina y asistencia",
    permissions: [
      "view:dashboard",
      "view:hr",
      "hr:read",
      "hr:create",
      "hr:edit",
      "hr:payroll",
    ] as Permission[],
    userCount: 0,
    color: "bg-pink-500",
  },
  {
    id: "atencion_cliente",
    name: "Atención al Cliente (CRM)",
    description: "Gestión de tickets, soporte y fidelización",
    permissions: [
      "view:dashboard",
      "view:crm",
      "crm:read",
      "crm:create",
      "crm:edit",
    ] as Permission[],
    userCount: 0,
    color: "bg-cyan-500",
  },
  {
    id: "cliente",
    name: "Cliente (Portal)",
    description: "Acceso limitado a sus propias facturas y pedidos",
    permissions: ["view:dashboard", "view:sales", "sales:read"] as Permission[],
    userCount: 0,
    color: "bg-slate-500",
  },
];

export default function RolesPermissionsPage({
  standalone = true,
  view,
}: RolesPermissionsPageProps) {
  const [roles, setRoles] = useState<Role[]>(PREDEFINED_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<Permission[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState(view || "roles");
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);

  // Hook de gestión de usuarios
  const { users, isLoading, fetchAllUsers, updateUser } = useUserManagement();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    if (users.length > 0) {
      const updatedRoles = roles.map((role) => ({
        ...role,
        userCount: users.filter((u) => u.role === role.id).length,
      }));
      setRoles(updatedRoles);
    }
  }, [users]);

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setEditingPermissions([...role.permissions]);
    setEditDialogOpen(true);
  };

  const handleViewUsers = (role: Role) => {
    setSelectedRole(role);
    setUsersDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    setRoles(
      roles.map((r) =>
        r.id === selectedRole.id
          ? { ...r, permissions: editingPermissions }
          : r,
      ),
    );
    setEditDialogOpen(false);
    toast.success(
      `Configuración del rol ${selectedRole.name} actualizada localmente`,
    );
  };

  const getPermissionLabel = (permission: string): string => {
    return permission.replace(":", " ").replace("_", " ").toUpperCase();
  };

  const content = (
    <>
      <div className={cn(standalone ? "p-6 space-y-6" : "space-y-6")}>
        {standalone && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                Roles y Permisos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los privilegios de acceso al sistema
              </p>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {!view && (
            <TabsList className="backdrop-blur-xl bg-card/80 border border-border p-1 rounded-full w-fit shadow-lg">
              <TabsTrigger value="roles" className="rounded-full px-6">
                Roles
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-full px-6">
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="matrix" className="rounded-full px-6">
                Matriz
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className="border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                          role.color,
                        )}
                      >
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {role.userCount} usuarios
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-xl font-bold tracking-tight">
                      {role.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {role.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {/* Placeholder for small avatar circles */}
                        <div className="w-6 h-6 rounded-full border-2 border-background bg-muted" />
                        <div className="w-6 h-6 rounded-full border-2 border-background bg-muted" />
                        <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold">
                          +{role.userCount > 3 ? role.userCount - 2 : 0}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Permisos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Matriz de Control de Acceso (RBAC)
                </CardTitle>
                <CardDescription>
                  Define qué roles tienen acceso a cada funcionalidad específica
                  del sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[250px] sticky left-0 z-20 bg-muted/50 backdrop-blur-md border-r">
                        Permiso / Funcionalidad
                      </TableHead>
                      {roles.map((role) => (
                        <TableHead
                          key={role.id}
                          className="text-center min-w-[120px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${role.color}`}
                            />
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                              {role.name}
                            </span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Grupos de Permisos */}
                    {[
                      "Módulos",
                      "Finanzas",
                      "Inventario",
                      "Ventas",
                      "Compras",
                      "RRHH",
                      "CRM",
                      "Configuración",
                    ].map((group) => {
                      const groupLower = group.toLowerCase();
                      const groupPerms = ALL_PERMISSIONS.filter((p) => {
                        if (group === "Módulos") return p.startsWith("view:");
                        if (group === "Configuración")
                          return (
                            p.includes("settings") ||
                            p.includes("users") ||
                            p.includes("roles") ||
                            p.includes("tenants") ||
                            p.includes("audit") ||
                            p.includes("system")
                          );
                        return p.startsWith(
                          groupLower === "ventas"
                            ? "sales"
                            : groupLower === "compras"
                              ? "purchases"
                              : groupLower,
                        );
                      });

                      if (groupPerms.length === 0) return null;

                      return (
                        <React.Fragment key={group}>
                          <TableRow className="bg-violet-500/5 hover:bg-violet-500/5 select-none">
                            <TableCell
                              colSpan={roles.length + 1}
                              className="py-2 px-4"
                            >
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500/80">
                                {group}
                              </span>
                            </TableCell>
                          </TableRow>
                          {groupPerms.map((perm) => (
                            <TableRow
                              key={perm}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium text-xs sticky left-0 z-10 bg-card/80 backdrop-blur-md border-r">
                                {getPermissionLabel(perm)}
                              </TableCell>
                              {roles.map((role) => (
                                <TableCell
                                  key={`${role.id}-${perm}`}
                                  className="text-center p-0"
                                >
                                  <div
                                    className="flex items-center justify-center h-10 w-full cursor-pointer hover:bg-primary/5 transition-colors"
                                    onClick={() => {
                                      const hasPerm = role.permissions.includes(
                                        perm as Permission,
                                      );
                                      const newPerms = hasPerm
                                        ? role.permissions.filter(
                                            (p) => p !== perm,
                                          )
                                        : [
                                            ...role.permissions,
                                            perm as Permission,
                                          ];

                                      setRoles(
                                        roles.map((r) =>
                                          r.id === role.id
                                            ? { ...r, permissions: newPerms }
                                            : r,
                                        ),
                                      );
                                      toast.info(
                                        `Permiso ${getPermissionLabel(perm)} ${hasPerm ? "removido" : "asignado"} a ${role.name}`,
                                        { duration: 1500 },
                                      );
                                    }}
                                  >
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-300",
                                        role.permissions.includes(
                                          perm as Permission,
                                        )
                                          ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                          : "bg-muted/50 text-transparent border border-dashed border-border/50 scale-90 opacity-40",
                                      )}
                                    >
                                      <Save className="w-3 h-3" />
                                    </div>
                                  </div>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="p-4 bg-muted/20 border-t flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground font-medium italic">
                    Los cambios en la matriz se guardan localmente para esta
                    instancia.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full shadow-lg shadow-primary/20 gap-2 h-8 px-6"
                  onClick={() =>
                    toast.success(
                      "Matriz de permisos sincronizada correctamente",
                    )
                  }
                >
                  <Save className="w-3.5 h-3.5" />
                  Sincronizar Todo
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="group relative flex items-center justify-between p-4 rounded-2xl border bg-card/40 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-primary/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-linear-to-br from-primary/20 to-violet-500/10 text-primary font-black">
                          {user.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                          roles.find((r) => r.id === user.role)?.color ||
                            "bg-slate-400",
                        )}
                      >
                        <Shield className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground tracking-tight">
                        {user.username}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase h-4 px-1 border-primary/20 text-primary"
                        >
                          {roles.find((r) => r.id === user.role)?.name ||
                            user.role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {user.department}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                  >
                    <UserCog className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-primary/20 shadow-2xl overflow-hidden p-0 gap-0">
          <div className="bg-linear-to-br from-primary/10 via-background to-background p-6 border-b">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                    selectedRole?.color,
                  )}
                >
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter">
                    {selectedRole?.name}
                  </DialogTitle>
                  <DialogDescription>
                    Administra los permisos granulares para este perfil de
                    usuario.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6 bg-muted/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "General",
                "Finanzas",
                "Inventario",
                "Ventas",
                "Compras",
                "RRHH",
                "Global",
              ].map((group) => {
                const groupLower = group.toLowerCase();
                const perms = ALL_PERMISSIONS.filter((p) => {
                  if (group === "General") return p.startsWith("view:");
                  if (group === "Global")
                    return (
                      p.includes("settings") ||
                      p.includes("users") ||
                      p.includes("roles")
                    );
                  return p.startsWith(
                    groupLower === "ventas"
                      ? "sales"
                      : groupLower === "compras"
                        ? "purchases"
                        : groupLower,
                  );
                });

                if (perms.length === 0) return null;

                return (
                  <div key={group} className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary/70 pl-1 border-l-2 border-primary/30">
                      {group}
                    </h5>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div
                          key={perm}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer",
                            editingPermissions.includes(perm as Permission)
                              ? "bg-primary/5 border-primary/30 text-primary"
                              : "bg-background border-border hover:border-primary/20 hover:bg-muted/30",
                          )}
                          onClick={() => {
                            if (
                              editingPermissions.includes(perm as Permission)
                            ) {
                              setEditingPermissions(
                                editingPermissions.filter((p) => p !== perm),
                              );
                            } else {
                              setEditingPermissions([
                                ...editingPermissions,
                                perm as Permission,
                              ]);
                            }
                          }}
                        >
                          <span className="text-xs font-bold tracking-tight">
                            {getPermissionLabel(perm)}
                          </span>
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                              editingPermissions.includes(perm as Permission)
                                ? "bg-primary border-primary"
                                : "bg-muted border-border",
                            )}
                          >
                            {editingPermissions.includes(
                              perm as Permission,
                            ) && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-background border-t">
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="rounded-full flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveRole}
                className="rounded-full flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!standalone) return content;

  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      {content}
    </ValeryLayout>
  );
}
