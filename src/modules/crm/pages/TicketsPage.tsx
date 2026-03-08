/**
 * TicketsPage - Gestión de soporte
 */

import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { TicketsPanel } from "../components";

export default function TicketsPage() {
  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Tickets de Soporte</h1>
        <TicketsPanel />
      </div>
    </ValeryLayout>
  );
}
