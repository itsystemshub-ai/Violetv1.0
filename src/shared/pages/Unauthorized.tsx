import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Página de acceso no autorizado
 * Se muestra cuando un usuario intenta acceder a un recurso sin permisos
 */

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Acceso Denegado
          </h1>
          <p className="text-xl text-gray-600">
            No tienes permisos para acceder a este recurso
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-700">
            <strong>Usuario:</strong> {user?.name || 'Desconocido'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Rol:</strong> {user?.role || 'Sin rol'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver Atrás
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </Button>
        </div>

        <div className="pt-6 border-t">
          <p className="text-xs text-gray-500">
            Código de Error: 403 - Forbidden
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Unauthorized;
