import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Download,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpenseChart } from "@/components/Charts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib";
import { HRLogic } from "@/features/hr/hooks/useHRLogic";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";

interface EmployeeDirectoryProps {
  logic: HRLogic;
}

export function EmployeeDirectory({ logic }: EmployeeDirectoryProps) {
  const {
    canManageHR,
    searchTerm,
    setSearchTerm,
    isLoading,
    filteredEmployees,
    employees,
    payrollSummary,
    handleExportPayrollReceipt,
    handleExportLiquidacion,
  } = logic;

  // Paginación
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
  } = usePagination(filteredEmployees, 10);

  if (!canManageHR) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/20">
        <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground font-medium text-center">
          Acceso restringido al directorio de personal.
          <br />
          Consulte con el departamento de Recursos Humanos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="border-none shadow-xl shadow-foreground/5 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula, RIF o cargo..."
                className="pl-9 bg-background/50 border-none ring-1 ring-border focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Centro Costos</TableHead>
                  <TableHead>Cargas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Cargando colaboradores...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length > 0 ? (
                  paginatedData.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.firstName}`}
                            />
                            <AvatarFallback>
                              {emp.firstName[0]}
                              {emp.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {emp.dni} | {emp.rif || "Sin RIF"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {emp.position}
                          </span>
                          <Badge
                            variant="secondary"
                            className="w-fit text-[10px] h-4 mt-1"
                          >
                            {emp.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {emp.centroCostos || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {emp.cargasFamiliares || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Mail className="h-4 w-4" /> Enviar Correo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Phone className="h-4 w-4" /> Llamar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleExportPayrollReceipt(emp.id)}
                            >
                              <Download className="h-4 w-4" /> Generar Recibo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleExportLiquidacion(emp.id)}
                            >
                              <FileText className="h-4 w-4" /> Liquidación
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive flex items-center gap-2">
                              Dar de Baja
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No se encontraron colaboradores.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Paginación */}
            {filteredEmployees.length > 0 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredEmployees.length}
                  onPageChange={goToPage}
                  onNextPage={nextPage}
                  onPrevPage={prevPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="border-none shadow-xl shadow-foreground/5 bg-primary overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24 text-white" />
          </div>
          <CardHeader className="relative z-10 text-primary-foreground">
            <h3 className="text-white font-bold text-lg">Nómina Mensual</h3>
            <p className="text-white/70 text-sm">
              Estimado con deducciones de ley.
            </p>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(payrollSummary.totalToPay)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-white/80 text-xs">
              <span>SSO: {formatCurrency(payrollSummary.totalSSO)}</span>
              <span>FAOV: {formatCurrency(payrollSummary.totalFAOV)}</span>
              <span>RPE: {formatCurrency(payrollSummary.totalRPE)}</span>
              <span>CT: {formatCurrency(payrollSummary.totalCestaTicket)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-foreground/5">
          <CardHeader>
            <h3 className="text-lg font-bold">Por Centro de Costos</h3>
          </CardHeader>
          <CardContent>
            <ExpenseChart
              title="Distribución"
              data={
                employees.length > 0
                  ? Object.entries(
                      employees.reduce((acc: Record<string, number>, emp) => {
                        const key = emp.centroCostos || "General";
                        acc[key] = (acc[key] || 0) + emp.salary;
                        return acc;
                      }, {}),
                    ).map(([name, value]) => ({ name, value }))
                  : [{ name: "Sin empleados", value: 1 }]
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
