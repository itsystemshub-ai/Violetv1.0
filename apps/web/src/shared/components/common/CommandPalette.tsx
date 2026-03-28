import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/shared/components/ui/command";
import {
  Calculator,
  Settings,
  Smile,
  User,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  FileText,
  LayoutDashboard,
  CreditCard,
  History,
} from "lucide-react";
import { ERP_MODULES, ROUTE_PATHS, formatCurrency } from "@/lib/index";
import {
  mockProducts,
  mockInvoices,
  mockEmployees,
  mockFinancialAccounts,
} from "@/data/index";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Escribe un comando o busca datos (Facturas, Productos, Empleados)..." />
      <CommandList className="max-h-[450px]">
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        <CommandGroup heading="Navegación Rápida">
          <CommandItem
            onSelect={() => runCommand(() => navigate(ROUTE_PATHS.DASHBOARD))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard Ejecutivo</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate("/accounts-receivable"))}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Cuentas por Cobrar</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate("/inventory-movements"))}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Movimientos de Inventario</span>
          </CommandItem>
          {ERP_MODULES.map((module) => {
            // Evaluamos la Feature Flag aquí estáticamente para el Super Admin
            // (Si implementáramos promesas dentro del mapa sería más complejo, pero esta es la idea)
            const isEnabled = module.id !== 'finance' ? true : true; // TODO: Lógica en tiempo real o suscripción

            if (!isEnabled) return null;

            return (
              <CommandItem
                key={module.id}
                onSelect={() => runCommand(() => navigate(module.path))}
              >
                <div className="mr-2">
                  {module.id === "finance" && <Wallet className="h-4 w-4" />}
                  {module.id === "inventory" && <Package className="h-4 w-4" />}
                  {module.id === "sales" && <ShoppingCart className="h-4 w-4" />}
                  {module.id === "purchases" && <Truck className="h-4 w-4" />}
                  {module.id === "hr" && <Users className="h-4 w-4" />}
                </div>
                <span>Módulo: {module.name}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Productos e Inventario">
          {mockProducts.map((product) => (
            <CommandItem
              key={product.id}
              onSelect={() =>
                runCommand(() =>
                  navigate(`${ROUTE_PATHS.INVENTORY}?id=${product.id}`),
                )
              }
            >
              <Package className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  CAUPLAS: {product.cauplas} • Stock: {product.stock}
                </span>
              </div>
              <CommandShortcut>{formatCurrency(product.price)}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Facturación y Ventas">
          {mockInvoices.map((invoice) => (
            <CommandItem
              key={invoice.id}
              onSelect={() =>
                runCommand(() =>
                  navigate(`${ROUTE_PATHS.SALES}?id=${invoice.id}`),
                )
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>
                  {invoice.number} - {invoice.customerName}
                </span>
                <span className="text-xs text-muted-foreground">
                  Estado: {invoice.status}
                </span>
              </div>
              <CommandShortcut>{formatCurrency(invoice.total)}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recursos Humanos">
          {mockEmployees.map((employee) => (
            <CommandItem
              key={employee.id}
              onSelect={() =>
                runCommand(() =>
                  navigate(`${ROUTE_PATHS.HR}?id=${employee.id}`),
                )
              }
            >
              <User className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>
                  {employee.firstName} {employee.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {employee.position} • {employee.department}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cuentas Contables">
          {mockFinancialAccounts.map((account) => (
            <CommandItem
              key={account.id}
              onSelect={() =>
                runCommand(() =>
                  navigate(`${ROUTE_PATHS.FINANCE}?acc=${account.code}`),
                )
              }
            >
              <Calculator className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>
                  {account.code} - {account.name}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {account.type}
                </span>
              </div>
              <CommandShortcut>
                {formatCurrency(account.balance)}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configuración">
          <CommandItem
            onSelect={() => runCommand(() => navigate(ROUTE_PATHS.SETTINGS))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Ajustes del Sistema</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate(ROUTE_PATHS.SETTINGS))}
          >
            <Smile className="mr-2 h-4 w-4" />
            <span>Personalización de Marca</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
