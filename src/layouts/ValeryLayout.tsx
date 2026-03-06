/**
 * ValeryLayout - Layout principal estilo Valery Profesional
 * Incluye: Barra de menú superior, panel lateral, área de trabajo, barra de estado
 */

import React, { useState } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  Settings,
  HelpCircle,
  User,
  Building2,
  Calendar,
  Wifi,
  WifiOff,
  Database,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ValeryLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const ValeryLayout: React.FC<ValeryLayoutProps> = ({ children, sidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const { user } = useAuth();

  const currentDate = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Barra de Menú Superior - Estilo Valery */}
      <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        {/* Logo y Menú */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold">Violet ERP</h1>
              <p className="text-[10px] text-muted-foreground">Profesional 5.0</p>
            </div>
          </div>

          {/* Menú Principal */}
          <nav className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Archivo
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Nuevo</DropdownMenuItem>
                <DropdownMenuItem>Abrir</DropdownMenuItem>
                <DropdownMenuItem>Guardar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Imprimir</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Salir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Edición
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Copiar</DropdownMenuItem>
                <DropdownMenuItem>Pegar</DropdownMenuItem>
                <DropdownMenuItem>Eliminar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Buscar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Panel Lateral</DropdownMenuItem>
                <DropdownMenuItem>Barra de Herramientas</DropdownMenuItem>
                <DropdownMenuItem>Barra de Estado</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Herramientas
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem>Calculadora</DropdownMenuItem>
                <DropdownMenuItem>Calendario</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  Ayuda
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Documentación
                </DropdownMenuItem>
                <DropdownMenuItem>Tutoriales</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Acerca de</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Usuario y Estado */}
        <div className="flex items-center gap-3">
          {/* Estado Cloud */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
            {cloudEnabled ? (
              <>
                <Cloud className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium">Cloud</span>
              </>
            ) : (
              <>
                <CloudOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Local</span>
              </>
            )}
          </div>

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{user?.username || 'Usuario'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mi Perfil</DropdownMenuItem>
              <DropdownMenuItem>Cambiar Contraseña</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Barra de Herramientas - Estilo Valery */}
      <div className="h-12 border-b bg-card/30 backdrop-blur-sm flex items-center px-4 gap-2 shrink-0 overflow-x-auto">
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <Database className="h-4 w-4" />
          <span className="text-xs">Nuevo</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <Settings className="h-4 w-4" />
          <span className="text-xs">Editar</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <Calendar className="h-4 w-4" />
          <span className="text-xs">Buscar</span>
        </Button>
        <div className="h-6 w-px bg-border mx-2" />
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <span className="text-xs">Imprimir</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 shrink-0">
          <span className="text-xs">Exportar</span>
        </Button>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Lateral - Estilo Valery */}
        <aside
          className={cn(
            'w-64 border-r bg-card/30 backdrop-blur-sm overflow-y-auto transition-all duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            'absolute lg:relative z-40 h-full'
          )}
        >
          {sidebar}
        </aside>

        {/* Área de Trabajo */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {/* Barra de Estado Inferior - Estilo Valery */}
      <footer className="h-8 border-t bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 text-xs shrink-0">
        <div className="flex items-center gap-4">
          {/* Usuario */}
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{user?.username || 'Usuario'}</span>
          </div>

          {/* Empresa */}
          <div className="hidden sm:flex items-center gap-2">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span>Empresa Demo</span>
          </div>

          {/* Conexión */}
          <div className="flex items-center gap-2">
            {cloudEnabled ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Sin conexión</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Fecha y Hora */}
          <div className="hidden md:flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="capitalize">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono">{currentTime}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ValeryLayout;
