import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// Componente de prueba simple
const TestPage = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '20px',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <h1 style={{ fontSize: '48px', color: '#7c3aed' }}>✅ Violet ERP Funciona!</h1>
    <p style={{ fontSize: '24px', color: '#666' }}>La aplicación se está cargando correctamente</p>
    <div style={{ 
      background: '#f0f0f0', 
      padding: '20px', 
      borderRadius: '8px',
      maxWidth: '600px'
    }}>
      <h2 style={{ marginTop: 0 }}>Siguiente paso:</h2>
      <p>Si ves este mensaje, significa que React está funcionando.</p>
      <p>El problema podría estar en:</p>
      <ul style={{ textAlign: 'left' }}>
        <li>Algún componente específico (Login, Dashboard, etc.)</li>
        <li>Algún hook personalizado</li>
        <li>La conexión con Supabase o IndexedDB</li>
      </ul>
    </div>
  </div>
);

const App = () => {
  console.log('[App-Simple] Iniciando aplicación de prueba...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<TestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        <Toaster />
        <Sonner position="top-right" expand={false} richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
