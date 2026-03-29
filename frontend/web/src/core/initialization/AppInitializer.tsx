import { useEffect, useState } from 'react';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[AppInitializer] 🚀 Iniciando Violet ERP...');
        
        // Verificar conexión con API
        try {
          const response = await fetch('http://localhost:3000/health');
          if (response.ok) {
            console.log('[AppInitializer] ✅ API conectada');
          } else {
            console.warn('[AppInitializer] ⚠️ API no disponible');
          }
        } catch {
          console.warn('[AppInitializer] ⚠️ API no responde (puede estar apagada)');
        }

        // Cargar configuración
        const config = localStorage.getItem('violet_config');
        if (config) {
          console.log('[AppInitializer] ✅ Configuración cargada');
        }

        // Marcar como inicializado
        setInitialized(true);
        console.log('[AppInitializer] ✅ Inicialización completada');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        console.error('[AppInitializer] ❌ Error de inicialización:', err);
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fee',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }}>
          <h1 style={{ color: '#e11d48', marginTop: 0 }}>⚠️ Error de Inicialización</h1>
          <p style={{ color: '#666' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <h2 style={{ marginBottom: '10px' }}>💜 Violet ERP</h2>
          <p>Inicializando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
