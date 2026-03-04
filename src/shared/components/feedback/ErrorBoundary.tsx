/**
 * Error Boundary Component
 * Captura errores en componentes hijos y muestra UI de fallback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from "@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card';

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

      // UI de error por defecto
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
          <Card className="max-w-2xl w-full border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Algo salió mal</CardTitle>
                  <CardDescription>
                    Ha ocurrido un error inesperado en la aplicación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mensaje de error */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error?.message || 'Error desconocido'}
                </p>
              </div>

              {/* Stack trace (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="p-4 bg-muted rounded-lg">
                  <summary className="text-sm font-semibold cursor-pointer mb-2">
                    Detalles técnicos (desarrollo)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Intentar de nuevo
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </Button>
              </div>

              {/* Información adicional */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Si el problema persiste, por favor contacta al soporte técnico con el
                  siguiente código de error:
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  {this.state.error?.name || 'UnknownError'}-
                  {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
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
