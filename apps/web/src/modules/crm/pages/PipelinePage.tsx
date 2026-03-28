/**
 * PipelinePage - Gestión visual del pipeline
 */

import ValeryLayout from "@/layouts/ValeryLayout";
import ValerySidebar from "@/components/navigation/ValerySidebar";
import { PipelinePanel } from "../components";

export default function PipelinePage() {
  return (
    <ValeryLayout sidebar={<ValerySidebar />}>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Pipeline de Ventas</h1>
        <PipelinePanel />
      </div>
    </ValeryLayout>
  );
}
