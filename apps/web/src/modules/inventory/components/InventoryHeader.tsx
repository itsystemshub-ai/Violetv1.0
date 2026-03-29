import { IMAGES } from "@/assets/images";

interface InventoryHeaderProps {
  logic: any; // Using the hook return type
  activeTab?: string; // Add activeTab prop
}

export const InventoryHeader = ({ logic, activeTab }: InventoryHeaderProps) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 opacity-5">
        <img src={IMAGES.OFFICE_WORKSPACE_2} alt="BG" className="w-[300px]" />
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Inventario Maestro
        </h1>
        <p className="text-muted-foreground">
          Sistema centralizado Cauplas - Torflex - Indomax - OEM
        </p>
      </div>
    </header>
  );
};
