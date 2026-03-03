import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTE_PATHS, ERP_MODULES } from "@/lib";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSystemConfig } from "@/modules/settings/hooks/useSystemConfig";
import { useSecurity } from "@/core/security/hooks/useSecurity";
import { useNetwork } from "@/core/shared/hooks/useNetwork";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";
import { useAudit } from "@/modules/settings/hooks/useAudit";
import { CommandPalette } from "@/shared/components/common/CommandPalette";

// Atomic Organisms
import { TopBar } from "./Layout/Organisms/TopBar";
import { AppFooter } from "./Layout/Organisms/AppFooter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { user, logout } = useAuth();
  const { tenant, allTenants, setActiveTenant } = useSystemConfig();
  const { isSecureConnection } = useSecurity();
  const { onlineCount, isCloudConnected } = useNetwork();
  const { syncLogs } = useAudit();
  const { notifications, markAsRead, markAllAsRead, clearAll, getUnreadCount } =
    useNotificationStore();

  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();
  const pendingSyncCount = syncLogs.filter(
    (l) => l.sync_status === "PENDING",
  ).length;

  // Global Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const activeModule = ERP_MODULES.find((m) =>
    location.pathname.startsWith(m.path),
  );
  const pageTitle = activeModule ? activeModule.name : "Dashboard";
  const isDashboard = location.pathname === ROUTE_PATHS.DASHBOARD;

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.LOGIN);
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5dc] relative overflow-hidden flex flex-col">
      {/* Visual background layers preserved */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(180deg, 
              rgba(245,245,220,1) 0%, 
              rgba(255,223,186,0.8) 25%, 
              rgba(255,182,193,0.6) 50%, 
              rgba(147,112,219,0.7) 75%, 
              rgba(72,61,139,0.9) 100%
            ),
            radial-gradient(circle at 30% 20%, rgba(255,255,224,0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(72,61,139,0.6) 0%, transparent 70%),
            radial-gradient(circle at 50% 60%, rgba(147,112,219,0.3) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <TopBar
          user={user}
          tenant={tenant}
          allTenants={allTenants}
          pageTitle={pageTitle}
          isDashboard={isDashboard}
          isCloudConnected={isCloudConnected}
          onlineCount={onlineCount}
          pendingSyncCount={pendingSyncCount}
          unreadCount={unreadCount}
          notifications={notifications}
          onTenantChange={(id) => setActiveTenant(id)}
          onLogout={handleLogout}
          onProfileClick={() => navigate(ROUTE_PATHS.SETTINGS)}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          onBackClick={() => navigate(ROUTE_PATHS.DASHBOARD)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAll}
        />

        <main className="flex-1 px-4 lg:px-6 py-4 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <AppFooter
          isSecureConnection={isSecureConnection}
          currentDate={new Date()}
        />

        <CommandPalette
          open={isCommandPaletteOpen}
          onOpenChange={setIsCommandPaletteOpen}
        />
      </div>
    </div>
  );
}
