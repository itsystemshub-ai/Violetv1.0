import React from "react";
import {
  Users2,
  Building2,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEPARTMENTS, USER_ROLES } from "@/lib/index";

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

  return (
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
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo usuario en el sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Nombre de Usuario</Label>
                    <Input
                      value={newUser?.username || ""}
                      onChange={(e) =>
                        setNewUser?.({ ...newUser, username: e.target.value })
                      }
                      placeholder="usuario123"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
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
                    <Label>Contraseña</Label>
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
                  <div>
                    <Label>Rol</Label>
                    <Select
                      value={newUser?.role}
                      onValueChange={(val) =>
                        setNewUser?.({ ...newUser, role: val as any })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(USER_ROLES).map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select
                      value={newUser?.department}
                      onValueChange={(val) =>
                        setNewUser?.({ ...newUser, department: val })
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DEPARTMENTS).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
  );
};

const UserTable = ({ users, onEdit, onDelete }: any) => (
  <Table>
    <TableHeader className="bg-muted/30">
      <TableRow>
        <TableHead className="w-[300px]">Usuario</TableHead>
        <TableHead>Rol</TableHead>
        <TableHead>Email</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {users.map((u: any) => (
        <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
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
                  {u.fullName || u.full_name || "Sin nombre"}
                </span>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge
              variant="outline"
              className="capitalize text-[10px] font-semibold"
            >
              {(u.role || "user").replace("_", " ")}
            </Badge>
          </TableCell>
          <TableCell className="text-[11px] text-muted-foreground">
            {u.email || "Sin email"}
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
      ))}
    </TableBody>
  </Table>
);

export default UserManagementPanel;
