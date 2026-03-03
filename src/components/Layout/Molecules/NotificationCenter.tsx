import React from "react";
import {
  Bell,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib";

interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error";
  module: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative group hover:bg-primary/10 transition-colors"
        >
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center bg-destructive text-[10px] font-bold text-white rounded-full border-2 border-background animate-in zoom-in duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-background/95 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="p-0 text-sm font-black">
              Notificaciones
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] h-4 bg-primary/20 text-primary border-none"
              >
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] font-bold px-2 hover:bg-primary/10 text-primary"
                onClick={onMarkAllAsRead}
              >
                Leídas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={onClearAll}
                title="Borrar todas"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
              <div className="p-4 bg-muted/20 rounded-full">
                <Bell className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-bold">Todo al día</p>
                <p className="text-[11px] text-muted-foreground">
                  No tienes notificaciones pendientes.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "relative p-4 cursor-pointer transition-all hover:bg-muted/30 group",
                    !notif.read && "bg-primary/5",
                  )}
                  onClick={() => onMarkAsRead(notif.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        notif.type === "success" &&
                          "bg-emerald-500/10 text-emerald-500",
                        notif.type === "info" && "bg-blue-500/10 text-blue-500",
                        notif.type === "warning" &&
                          "bg-amber-500/10 text-amber-500",
                        notif.type === "error" &&
                          "bg-rose-500/10 text-rose-500",
                      )}
                    >
                      {notif.type === "success" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {notif.type === "info" && <Info className="w-4 h-4" />}
                      {notif.type === "warning" && (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {notif.type === "error" && (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-black px-1.5 h-4 border-primary/20 bg-primary/5 text-primary"
                        >
                          {notif.module}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {formatDate(new Date(notif.timestamp))}
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-none mt-1 group-hover:text-primary transition-colors">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
