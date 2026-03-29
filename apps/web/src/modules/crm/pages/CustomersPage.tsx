/**
 * CustomersPage - Directorio de clientes
 */

import { CustomersPanel } from "../components";

export default function CustomersPage() {
  return (
    <>
      <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -z-10" />
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Clientes CRM</h1>
        <CustomersPanel />
      </div>
    </>
  );
}
