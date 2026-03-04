import React from "react";
import { NavLink } from "react-router-dom";
import { Search, ArrowLeft, Cloud, Monitor, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTE_PATHS } from "@/lib";
import { NotificationCenter } from "../Molecules/NotificationCenter";
import { UserMenu } from "../Molecules/UserMenu";
import { SyncStatusIndicator } from "@/shared/components/feedback/SyncStatusIndicator";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";

interface TopBarProps {
  user: any;
  tenant: any;
  allTenants: any[];
  pageTitle: string;
  isDashboard: boolean;
  isCloudConnected: boolean;
  onlineCount: number;
  pendingSyncCount: number;
  unreadCount: number;
  notifications: any[];
  onTenantChange: (id: string) => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
  onBackClick: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  tenant,
  allTenants,
  pageTitle,
  isDashboard,
  isCloudConnected,
  onlineCount,
  pendingSyncCount,
  unreadCount,
  notifications,
  onTenantChange,
  onLogout,
  onProfileClick,
  onSearchClick,
  onBackClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  return (
    <header className="h-16 border-b border-border bg-background/40 backdrop-blur-xl sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 hover:bg-background/50">
      <div className="flex items-center gap-4">
        <NavLink to={ROUTE_PATHS.DASHBOARD} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-inner overflow-hidden">
            <span className="text-primary-foreground font-black text-sm">
              V
            </span>
          </div>
          <span className="font-bold text-foreground hidden sm:block">
            Violet ERP
          </span>
        </NavLink>

        <div className="h-6 w-px bg-border hidden md:block" />

        <div className="flex items-center gap-2">
          {!isDashboard && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              onClick={onBackClick}
              title="Regresar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold lg:text-xl">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search Bar Trigger */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 text-muted-foreground bg-muted/30 border-dashed hover:border-primary/50 transition-colors"
          onClick={onSearchClick}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Buscar...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onSearchClick}
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Network & Sync Status */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-2 w-2 rounded-full animate-pulse",
                isCloudConnected ? "bg-emerald-500" : "bg-rose-500",
              )}
            />
            <Cloud className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Monitor className="w-3.5 h-3.5" />
            <span>{onlineCount} EQUIPOS</span>
          </div>
          {pendingSyncCount > 0 && (
            <>
              <div className="h-4 w-px bg-border text-amber-500" />
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-600 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{pendingSyncCount} PENDIENTES</span>
              </div>
            </>
          )}
        </div>

        {/* Action Menus */}
        <div className="flex items-center gap-2 border-l pl-2 md:pl-4">
          <ThemeToggle />
          <SyncStatusIndicator />
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearAll={onClearAll}
          />
          <UserMenu
            user={user}
            tenant={tenant}
            allTenants={allTenants}
            onTenantChange={onTenantChange}
            onProfileClick={onProfileClick}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};
