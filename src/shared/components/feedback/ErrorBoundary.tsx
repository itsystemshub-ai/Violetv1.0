/**
 * Error Boundary Component
 * Captura errores en componentes hijos y muestra UI de fallback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enviar a servicio de logging (ej: Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de error por defecto (Premium Design)
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 flex flex-col items-center text-center space-y-6 border border-white/20 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-rose-400 opacity-20" />
            
            {/* Icon Group */}
            <div className="relative">
              <div className="w-24 h-24 bg-red-50 rounded-[30px] flex items-center justify-center animate-bounce-slow">
                <AlertCircle className="h-10 w-10 text-red-500/80" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-[32px] font-black tracking-tight text-[#D34141] leading-tight">
                Interrupción del Sistema
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50/50 rounded-full border border-red-100">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                  ERROR DETECTADO
                </span>
              </div>
            </div>

            {/* Error Details Box */}
            <div className="w-full bg-[#f8fafc] rounded-2xl border border-slate-100 p-5 font-mono">
              <p className="text-xs text-[#DC4C4C] leading-relaxed break-words">
                {this.state.error?.name || 'ReferenceError'}: {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-[15px] font-semibold text-slate-800 leading-snug">
                Lo sentimos, esta sección ha dejado de responder.
              </p>
              <p className="text-sm text-slate-500/80 leading-relaxed max-w-[90%] mx-auto">
                Hemos aislado este fallo para proteger el resto de tus operaciones. 
                Puedes intentar regresar a la vista anterior o reportar el problema.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="h-14 rounded-full border-slate-100 text-slate-600 font-bold shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Regresar
              </Button>
              <Button
                onClick={this.handleReset}
                className="h-14 rounded-full bg-[#D34141] hover:bg-[#B33535] text-white font-bold shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </Button>
            </div>

            {/* Dashboard Link */}
            <button 
              onClick={this.handleGoHome}
              className="group flex items-center gap-2 text-[#7C3AED] font-bold text-sm hover:opacity-80 transition-opacity"
            >
              <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              Ir al Inicio (Dashboard)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary funcional para rutas específicas
 */
interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName: string;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({
  children,
  routeName,
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`[${routeName}] Error:`, error, errorInfo);
    // Aquí puedes agregar logging específico por ruta
  };

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
};

/**
 * Error Boundary compacto para componentes pequeños
 */
interface CompactErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export class CompactErrorBoundary extends Component<
  CompactErrorBoundaryProps,
  State
> {
  constructor(props: CompactErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[CompactErrorBoundary] Error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">
              {this.props.fallbackMessage || 'Error al cargar este componente'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
