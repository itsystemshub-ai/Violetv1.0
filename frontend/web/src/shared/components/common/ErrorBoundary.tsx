import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Captura errores en tiempo de ejecución para evitar caídas totales del sistema.
 * Permite al usuario regresar a la página anterior o reintentar la acción.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Aquí se podría enviar el error a un servicio como Sentry si estuviera configurado
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoBack = () => {
    window.history.back();
    // Damos un pequeño respiro antes de resetear el estado para que la navegación ocurra
    setTimeout(this.handleReset, 100);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 animate-in fade-in zoom-in duration-500">
          <Card className="w-full max-w-md border-destructive/20 bg-card/60 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute inset-0 bg-linear-to-br from-destructive/10 via-transparent to-transparent -z-10" />

            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-linear-to-br from-destructive/20 to-destructive/5 flex items-center justify-center mb-4 border border-destructive/20 shadow-xl shadow-destructive/10">
                <AlertCircle className="w-10 h-10 text-destructive animate-pulse" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter text-destructive">
                Interrupción del Sistema
              </CardTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                Error Detectado
              </p>
            </CardHeader>

            <CardContent className="text-center space-y-6 px-8">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-left overflow-auto max-h-[120px] shadow-inner">
                <p className="text-[10px] font-mono text-destructive/80 leading-relaxed break-words">
                  {this.state.error?.toString() ||
                    "Error inesperado en el componente"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  Lo sentimos, esta sección ha dejado de responder.
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed px-2">
                  Hemos aislado este fallo para proteger el resto de tus
                  operaciones. Puedes intentar regresar a la vista anterior o
                  reportar el problema.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pb-10 px-10">
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  className="rounded-full gap-2 border-border/50 h-11 font-bold hover:bg-muted/50 transition-all active:scale-95"
                  onClick={this.handleGoBack}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Regresar
                </Button>
                <Button
                  className="rounded-full gap-2 bg-destructive hover:bg-destructive/90 text-white font-bold h-11 shadow-lg shadow-destructive/20 transition-all active:scale-95"
                  onClick={this.handleReset}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reintentar
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full rounded-xl gap-2 text-primary hover:bg-primary/5 font-bold h-10 mt-2"
                onClick={() => {
                  window.location.hash = "/";
                  this.handleReset();
                }}
              >
                <Home className="w-4 h-4" />
                Ir al Inicio (Dashboard)
              </Button>
            </CardFooter>

            {/* Decorative element */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-destructive/20 blur-md rounded-full" />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
