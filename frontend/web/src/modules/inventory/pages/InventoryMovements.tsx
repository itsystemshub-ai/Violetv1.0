/**
 * InventoryMovements - Página de movimientos de inventario con análisis completo
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useMovements } from "../hooks/useMovements";
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Settings,
  Package,
  Warehouse,
} from "lucide-react";

export default function InventoryMovements() {
  const {
    movements,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    warehouseFilter,
    setWarehouseFilter,
    dateFilter,
    setDateFilter,
    stats,
  } = useMovements();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: "Entrada",
      exit: "Salida",
      adjustment: "Ajuste",
      transfer: "Transferencia",
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      entry: "default",
      exit: "destructive",
      adjustment: "secondary",
      transfer: "outline",
    };
    return variants[type] || "default";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "entry":
        return <TrendingUp className="h-4 w-4" />;
      case "exit":
        return <TrendingDown className="h-4 w-4" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4" />;
      case "adjustment":
        return <Settings className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimientos de Inventario</h1>
          <p className="text-muted-foreground">
            Historial completo de movimientos de productos
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Movimientos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovements}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthCount} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalEntries}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalValueIn)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salidas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.totalExits}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalValueOut)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Neto</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.netValue >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(stats.netValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTransfers} transferencias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, CAUPLAS, referencia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="entry">Entradas</SelectItem>
                <SelectItem value="exit">Salidas</SelectItem>
                <SelectItem value="transfer">Transferencias</SelectItem>
                <SelectItem value="adjustment">Ajustes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los almacenes</SelectItem>
                <SelectItem value="WH-001">Almacén Principal</SelectItem>
                <SelectItem value="WH-002">Almacén Secundario</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el tiempo</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            Mostrando {movements.length} movimiento(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>CAUPLAS</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground"
                  >
                    No se encontraron movimientos
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {new Date(movement.date).toLocaleDateString("es-VE")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getTypeBadge(movement.type)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getTypeIcon(movement.type)}
                        {getTypeLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.cauplas}</Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        movement.quantity >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {movement.quantity >= 0 ? "+" : ""}
                      {movement.quantity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{movement.warehouse}</span>
                      </div>
                      {movement.destinationWarehouse && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <ArrowRightLeft className="h-3 w-3" />
                          {movement.destinationWarehouse}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{movement.reason}</TableCell>
                    <TableCell>
                      {movement.reference && (
                        <Badge variant="secondary">{movement.reference}</Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        movement.totalValue >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(movement.totalValue))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {movement.createdBy}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
