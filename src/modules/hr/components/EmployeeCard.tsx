/**
 * Componente optimizado para tarjetas de empleados
 * Usa React.memo para prevenir re-renders innecesarios
 */

import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { formatDate } from '@/lib/index';

interface EmployeeCardProps {
  employee: {
    id: string;
    name: string;
    dni?: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    status?: 'active' | 'inactive' | 'suspended';
    hireDate?: string;
    avatarUrl?: string;
  };
  onEdit?: (employee: any) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = React.memo(({
  employee,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-600 border-red-500/30';
      default:
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'suspended':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  };

  return (
    <Card className="bg-card border border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <CardContent className="p-6">
        {/* Header con avatar y acciones */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-border">
              <AvatarImage src={employee.avatarUrl} alt={employee.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-bold text-base text-foreground mb-1">
                {employee.name}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {employee.position || 'Sin cargo'}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onEdit(employee)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => onDelete(employee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Información del empleado */}
        <div className="space-y-2 mb-4">
          {employee.department && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{employee.department}</span>
            </div>
          )}
          
          {employee.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{employee.email}</span>
            </div>
          )}
          
          {employee.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{employee.phone}</span>
            </div>
          )}
          
          {employee.hireDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Ingreso: {formatDate(employee.hireDate)}</span>
            </div>
          )}
        </div>

        {/* Footer con estado y DNI */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          {employee.dni && (
            <span className="text-xs font-bold text-muted-foreground">
              DNI: {employee.dni}
            </span>
          )}
          
          <Badge
            variant="outline"
            className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${getStatusColor(employee.status)}`}
          >
            {getStatusLabel(employee.status)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
});

EmployeeCard.displayName = 'EmployeeCard';
