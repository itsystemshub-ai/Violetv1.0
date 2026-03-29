import React from "react";
import {
  Users2,
  Building2,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { DEPARTMENTS, USER_ROLES, Permission } from "@/lib/index";

// Función para obtener permisos por rol
const getPermissionsByRole = (role: string): Permission[] => {
  const permissionsByRole: Record<string, Permission[]> = {
    super_admin: [
      "view:dashboard",
      "view:finance",
      "view:inventory",
      "view:sales",
      "view:purchases",
      "view:hr",
      "view:crm",
      "view:settings",
      "finance:read",
      "finance:create",
      "finance:edit",
      "finance:delete",
      "finance:export",
      "inventory:read",
      "inventory:create",
      "inventory:edit",
      "inventory:delete",
      "inventory:export",
      "sales:read",
      "sales:create",
      "sales:edit",
      "sales:delete",
      "sales:export",
      "purchases:read",
      "purchases:create",
      "purchases:edit",
      "purchases:delete",
      "hr:read",
      "hr:create",
      "hr:edit",
      "hr:delete",
      "hr:payroll",
      "crm:read",
      "crm:create",
      "crm:edit",
      "crm:delete",
      "crm:export",
      "settings:read",
      "settings:edit",
      "tenants:manage",
      "users:read",
      "users:create",
      "users:edit",
      "users:delete",
      "roles:manage",
      "audit:view",
      "system:superadmin",
    ] as Permission[],
    admin: [
      "view:dashboard",
      "view:finance",
      "view:inventory",
      "view:sales",
      "view:purchases",
      "view:hr",
      "view:crm",
      "view:settings",
      "finance:read",
      "finance:create",
      "finance:edit",
      "finance:export",
      "inventory:read",
      "inventory:create",
      "inventory:edit",
      "inventory:export",
      "sales:read",
      "sales:create",
      "sales:edit",
      "sales:export",
      "purchases:read",
      "purchases:create",
      "purchases:edit",
      "hr:read",
      "hr:create",
      "hr:edit",
      "crm:read",
      "crm:create",
      "crm:edit",
      "crm:export",
      "settings:read",
      "settings:edit",
      "users:read",
      "users:create",
      "users:edit",
      "audit:view",
    ] as Permission[],
    manager: [
      "view:dashboard",
      "view:finance",
      "view:inventory",
      "view:sales",
      "view:purchases",
      "view:hr",
      "finance:read",
      "finance:create",
      "finance:edit",
      "finance:export",
      "inventory:read",
      "inventory:edit",
      "sales:read",
      "sales:create",
      "sales:edit",
      "sales:export",
      "purchases:read",
      "purchases:create",
      "purchases:edit",
      "hr:read",
      "users:read",
      "audit:view",
    ] as Permission[],
    finanzas: [
      "view:dashboard",
      "view:finance",
      "finance:read",
      "finance:create",
      "finance:edit",
      "finance:delete",
      "finance:export",
      "view:purchases",
      "purchases:read",
      "purchases:export",
      "view:sales",
      "sales:read",
      "sales:export",
      "view:inventory",
      "inventory:read",
      "inventory:export",
      "audit:view",
    ] as Permission[],
    sales: [
      "view:dashboard",
      "view:sales",
      "view:inventory",
      "sales:read",
      "sales:create",
      "sales:edit",
      "sales:export",
      "inventory:read",
    ] as Permission[],
    atencion_cliente: [
      "view:dashboard",
      "view:crm",
      "crm:read",
      "crm:create",
      "crm:edit",
      "crm:export",
      "view:sales",
      "sales:read",
      "view:inventory",
      "inventory:read",
    ] as Permission[],
    warehouse: [
      "view:dashboard",
      "view:inventory",
      "inventory:read",
      "inventory:create",
      "inventory:edit",
      "inventory:export",
      "purchases:read",
    ] as Permission[],
    accountant: [
      "view:dashboard",
      "view:finance",
      "finance:read",
      "finance:create",
      "finance:edit",
      "finance:export",
      "inventory:read",
      "sales:read",
      "sales:export",
      "purchases:read",
      "purchases:export",
    ] as Permission[],
    hr: [
      "view:dashboard",
      "view:hr",
      "hr:read",
      "hr:create",
      "hr:edit",
      "hr:delete",
      "hr:payroll",
      "users:read",
    ] as Permission[],
    client: ["view:dashboard", "view:sales", "sales:read"] as Permission[],
  };

  return permissionsByRole[role] || [];
};

// Función para obtener rol predeterminado por departamento
const getDefaultRoleByDepartment = (department: string): string => {
  const rolesByDepartment: Record<string, string> = {
    "Administración / IT": "admin",
    Gerencia: "manager",
    Ventas: "sales",
    "Atención al Cliente": "atencion_cliente",
    Almacén: "warehouse",
    Finanzas: "finanzas",
    Contabilidad: "accountant",
    "Recursos Humanos": "hr",
    Compras: "manager",
    Tecnología: "admin",
    "Clientes Externos": "client",
  };

  return rolesByDepartment[department] || "sales";
};

interface UserManagementPanelProps {
  users: any[];
  isLoading: boolean;
  onUpdate: (user: any) => void;
  onDelete: (userId: string) => void;
  isMaster: boolean;
  // Props para crear nuevo usuario
  isAddUserOpen?: boolean;
  setIsAddUserOpen?: (open: boolean) => void;
  newUser?: any;
  setNewUser?: (user: any) => void;
  handleAddUser?: () => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  users,
  isLoading,
  onUpdate,
  onDelete,
  isMaster,
  isAddUserOpen,
  setIsAddUserOpen,
  newUser,
  setNewUser,
  handleAddUser,
}) => {
  const filteredUsers = users || [];

  // Inicializar usuario con valores predeterminados cuando se abre el dialog
  React.useEffect(() => {
    if (isAddUserOpen && (!newUser || !newUser.department)) {
      const defaultDepartment = "Ventas";
      const defaultRole = getDefaultRoleByDepartment(defaultDepartment);
      const defaultPermissions = getPermissionsByRole(defaultRole);

      setNewUser?.({
        username: "",
        name: "",
        email: "",
        password: "",
        role: defaultRole,
        department: defaultDepartment,
        permissions: defaultPermissions,
        isSuperAdmin: defaultRole === "super_admin",
        is2FAEnabled: false,
      });
    }
  }, [isAddUserOpen]);

  const getRoleFunctions = (role: string): string[] => {
    const functions: Record<string, string[]> = {
      super_admin: [
        "Acceso total al sistema",
        "Gestión de empresas (multi-tenant)",
        "Gestión de usuarios y roles",
        "Configuración del sistema",
        "Auditoría completa",
      ],
      admin: [
        "Acceso completo a todos los módulos",
        "Gestión de usuarios",
        "Configuración de empresa",
        "Reportes avanzados",
        "Auditoría de operaciones",
      ],
      manager: [
        "Gestión de ventas y compras",
        "Control de inventario",
        "Acceso a finanzas",
        "Reportes gerenciales",
        "Supervisión de equipos",
      ],
      sales: [
        "Crear y gestionar ventas",
        "Gestión de clientes",
        "Consultar inventario",
        "Reportes de ventas",
      ],
      warehouse: [
        "Gestión de inventario",
        "Control de stock",
        "Recepción de mercancía",
        "Despacho de productos",
        "Reportes de almacén",
      ],
      accountant: [
        "Gestión financiera",
        "Registro contable",
        "Conciliación bancaria",
        "Reportes fiscales",
        "Control de impuestos",
      ],
      hr: [
        "Gestión de empleados",
        "Procesamiento de nómina",
        "Control de asistencia",
        "Gestión de vacaciones",
        "Reportes de RRHH",
      ],
      client: [
        "Ver historial de compras",
        "Consultar facturas",
        "Seguimiento de pedidos",
        "Acceso limitado",
      ],
    };
    return functions[role] || ["Sin funciones definidas"];
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Roles */}
      <Card className="border-border/50 bg-linear-to-br from-violet-500/5 to-indigo-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Funciones por Rol
          </CardTitle>
          <CardDescription>
            Descripción de las funciones principales de cada rol en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(USER_ROLES).map((role) => {
              const roleUsers = filteredUsers.filter((u) => u.role === role);
              if (roleUsers.length === 0) return null;

              const getRoleColor = (r: string) => {
                const colors: Record<string, string> = {
                  super_admin: "from-red-500/20 to-red-500/5 border-red-500/30",
                  admin:
                    "from-purple-500/20 to-purple-500/5 border-purple-500/30",
                  manager: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
                  sales: "from-green-500/20 to-green-500/5 border-green-500/30",
                  warehouse:
                    "from-amber-500/20 to-amber-500/5 border-amber-500/30",
                  accountant:
                    "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
                  hr: "from-pink-500/20 to-pink-500/5 border-pink-500/30",
                  client: "from-gray-500/20 to-gray-500/5 border-gray-500/30",
                };
                return (
                  colors[r] ||
                  "from-gray-500/20 to-gray-500/5 border-gray-500/30"
                );
              };

              return (
                <div
                  key={role}
                  className={`p-4 rounded-xl border bg-linear-to-br ${getRoleColor(role)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm capitalize">
                      {role.replace("_", " ")}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {roleUsers.length}
                    </Badge>
                  </div>
                  <ul className="space-y-1.5">
                    {getRoleFunctions(role).map((func, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{func}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gestión de Usuarios */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-primary" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administra los usuarios del sistema y sus permisos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isMaster && setIsAddUserOpen && (
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-full bg-linear-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-lg shadow-violet-500/30">
                    <Plus className="h-4 w-4" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                      Crea un nuevo usuario en el sistema con permisos
                      automáticos según su rol
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre de Usuario *</Label>
                        <Input
                          value={newUser?.username || ""}
                          onChange={(e) =>
                            setNewUser?.({
                              ...newUser,
                              username: e.target.value,
                            })
                          }
                          placeholder="usuario123"
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>Nombre Completo</Label>
                        <Input
                          value={newUser?.name || ""}
                          onChange={(e) =>
                            setNewUser?.({ ...newUser, name: e.target.value })
                          }
                          placeholder="Juan Pérez"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newUser?.email || ""}
                        onChange={(e) =>
                          setNewUser?.({ ...newUser, email: e.target.value })
                        }
                        placeholder="usuario@empresa.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Contraseña *</Label>
                      <Input
                        type="password"
                        value={newUser?.password || ""}
                        onChange={(e) =>
                          setNewUser?.({ ...newUser, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="rounded-xl"
                      />
                    </div>

                    {/* Departamento primero - asigna rol automáticamente */}
                    <div>
                      <Label>Departamento *</Label>
                      <Select
                        value={newUser?.department}
                        onValueChange={(val) => {
                          const defaultRole = getDefaultRoleByDepartment(val);
                          const permissions = getPermissionsByRole(defaultRole);
                          setNewUser?.({
                            ...newUser,
                            department: val,
                            role: defaultRole,
                            permissions: permissions,
                            isSuperAdmin: defaultRole === "super_admin",
                          });
                        }}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecciona departamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(DEPARTMENTS).map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                {dept}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        El rol y permisos se asignarán automáticamente
                      </p>
                    </div>

                    {/* Vista previa de configuración automática */}
                    {newUser?.department && newUser?.role && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-semibold">
                              Asignación Automática Completada
                            </h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-background/50">
                              <span className="text-sm text-muted-foreground">
                                Departamento seleccionado:
                              </span>
                              <Badge
                                variant="outline"
                                className="font-semibold"
                              >
                                <Building2 className="w-3 h-3 mr-1" />
                                {newUser.department}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-background/50">
                              <span className="text-sm text-muted-foreground">
                                Rol asignado automáticamente:
                              </span>
                              <Badge className="bg-emerald-600 font-semibold">
                                <Shield className="w-3 h-3 mr-1" />
                                {newUser.role.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-background/50">
                              <span className="text-sm text-muted-foreground">
                                Permisos incluidos:
                              </span>
                              <Badge
                                variant="secondary"
                                className="font-semibold"
                              >
                                {getPermissionsByRole(newUser.role).length}{" "}
                                permisos
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/30 border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm">
                              Permisos que se asignarán:
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {getPermissionsByRole(newUser.role).length} total
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-background/50 rounded">
                            {getPermissionsByRole(newUser.role).map((perm) => (
                              <Badge
                                key={perm}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mensaje cuando no hay departamento seleccionado */}
                    {!newUser?.department && (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-600" />
                          <p className="text-sm text-amber-700 dark:text-amber-400">
                            Selecciona un departamento para asignar
                            automáticamente el rol y permisos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddUserOpen?.(false)}
                      className="rounded-full"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      className="rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                    >
                      Crear Usuario
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {Object.values(DEPARTMENTS).map((dept) => {
                const deptUsers = filteredUsers.filter(
                  (u) => u.department === dept,
                );
                if (deptUsers.length === 0) return null;

                return (
                  <div key={dept} className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm uppercase tracking-wider text-primary">
                        {dept}
                      </h3>
                      <Badge variant="secondary" className="ml-auto font-mono">
                        {deptUsers.length}
                      </Badge>
                    </div>
                    <div className="rounded-md border bg-card/30 backdrop-blur-sm overflow-hidden">
                      <UserTable
                        users={deptUsers}
                        onEdit={onUpdate}
                        onDelete={onDelete}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Orphan Users */}
              {(() => {
                const orphans = filteredUsers.filter((u) => !u.department);
                if (orphans.length === 0) return null;
                return (
                  <div className="space-y-3 pt-4 border-t border-dashed">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border-l-4 border-muted-foreground/30 rounded-r-lg">
                      <Users2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                        Sin Departamento
                      </h3>
                      <Badge variant="outline" className="ml-auto font-mono">
                        {orphans.length}
                      </Badge>
                    </div>
                    <div className="rounded-md border bg-card/20 overflow-hidden">
                      <UserTable
                        users={orphans}
                        onEdit={onUpdate}
                        onDelete={onDelete}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const UserTable = ({ users, onEdit, onDelete }: any) => {
  const [expandedUser, setExpandedUser] = React.useState<string | null>(null);

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-red-500",
      admin: "bg-purple-500",
      manager: "bg-blue-500",
      sales: "bg-green-500",
      warehouse: "bg-amber-500",
      accountant: "bg-cyan-500",
      hr: "bg-pink-500",
      client: "bg-gray-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const getPermissionLabel = (permission: string): string => {
    const labels: Record<string, string> = {
      "view:dashboard": "Ver Dashboard",
      "view:sales": "Ver Ventas",
      "sales:read": "Leer Ventas",
      "sales:create": "Crear Ventas",
      "sales:edit": "Editar Ventas",
      "sales:delete": "Eliminar Ventas",
      "sales:export": "Exportar Ventas",
      "view:inventory": "Ver Inventario",
      "inventory:read": "Leer Inventario",
      "inventory:create": "Crear Inventario",
      "inventory:edit": "Editar Inventario",
      "inventory:delete": "Eliminar Inventario",
      "inventory:export": "Exportar Inventario",
      "view:finance": "Ver Finanzas",
      "finance:read": "Leer Finanzas",
      "finance:create": "Crear Finanzas",
      "finance:edit": "Editar Finanzas",
      "finance:delete": "Eliminar Finanzas",
      "finance:export": "Exportar Finanzas",
      "view:purchases": "Ver Compras",
      "purchases:read": "Leer Compras",
      "purchases:create": "Crear Compras",
      "purchases:edit": "Editar Compras",
      "purchases:delete": "Eliminar Compras",
      "purchases:export": "Exportar Compras",
      "view:hr": "Ver RRHH",
      "hr:read": "Leer RRHH",
      "hr:create": "Crear RRHH",
      "hr:edit": "Editar RRHH",
      "hr:delete": "Eliminar RRHH",
      "hr:payroll": "Gestionar Nómina",
      "hr:export": "Exportar RRHH",
      "view:settings": "Ver Configuración",
      "settings:read": "Leer Configuración",
      "settings:edit": "Modificar Configuración",
      "view:ai": "Ver IA",
      "ai:read": "Usar IA",
      "ai:write": "Configurar IA",
      "users:read": "Ver Usuarios",
      "users:create": "Crear Usuarios",
      "users:edit": "Editar Usuarios",
      "users:delete": "Eliminar Usuarios",
      "roles:manage": "Gestionar Roles",
      "tenants:manage": "Gestionar Empresas",
      "audit:view": "Ver Auditoría",
      "system:superadmin": "Super Admin",
    };
    return labels[permission] || permission;
  };

  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="w-[300px]">Usuario</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Contraseña</TableHead>
          <TableHead>Permisos</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u: any) => (
          <React.Fragment key={u.id}>
            <TableRow className="hover:bg-muted/20 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage src={u.avatarUrl} />
                    <AvatarFallback className="bg-primary/5 text-primary text-[10px]">
                      {(u.username || "??").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{u.username}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                      {u.name || u.fullName || u.full_name || "Sin nombre"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${getRoleColor(u.role)}`}
                  />
                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] font-semibold"
                  >
                    {(u.role || "user").replace("_", " ")}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-[11px] text-muted-foreground">
                {u.email || "Sin email"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {u.password || "••••••••"}
                  </code>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setExpandedUser(expandedUser === u.id ? null : u.id)
                  }
                >
                  {u.permissions?.length || 0} permisos
                  <Badge variant="secondary" className="ml-2">
                    {expandedUser === u.id ? "▼" : "▶"}
                  </Badge>
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(u)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(u.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
            {expandedUser === u.id &&
              u.permissions &&
              u.permissions.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-muted/10 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Shield className="w-4 h-4 text-primary" />
                        Permisos Asignados ({u.permissions.length})
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {u.permissions.map((perm: string) => (
                          <Badge
                            key={perm}
                            variant="secondary"
                            className="text-[10px] justify-start"
                          >
                            {getPermissionLabel(perm)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserManagementPanel;
