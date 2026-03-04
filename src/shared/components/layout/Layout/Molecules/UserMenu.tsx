import React from "react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tenant, User } from "@/lib";

interface UserMenuProps {
  user: User | null;
  tenant: Tenant;
  allTenants: Tenant[];
  onTenantChange: (id: string) => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  tenant,
  allTenants,
  onTenantChange,
  onProfileClick,
  onLogout,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-1 hover:bg-accent rounded-full"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user?.name}</p>
            <p className="text-[10px] leading-none text-muted-foreground">
              @{user?.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[9px] uppercase text-muted-foreground tracking-widest font-black">
          Empresa Actual
        </DropdownMenuLabel>
        <div className="max-h-[200px] overflow-y-auto">
          {allTenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => onTenantChange(t.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span
                className={t.id === tenant.id ? "font-bold text-primary" : ""}
              >
                {t.name}
              </span>
              {t.id === tenant.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
