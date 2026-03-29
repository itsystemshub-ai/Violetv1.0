import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import '../index.css'

// Inicializar Sentry para logging en producción
import { initSentry } from '../config/sentry'
initSentry()

// Inicializar Analytics
import { analytics } from '../lib/analytics'

console.log('[main.tsx] 🚀 Iniciando Violet ERP...');
console.log('[main.tsx] Versión de React:', React.version);
console.log('[main.tsx] Modo:', import.meta.env.MODE);
console.log('[main.tsx] Entorno:', import.meta.env.VITE_APP_ENV || 'development');

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('[main.tsx] ❌ ERROR CRÍTICO: No se encontró el elemento #root en el DOM');
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fee;
      font-family: system-ui, sans-serif;
      padding: 20px;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 600px;
      ">
        <h1 style="color: #e11d48; margin-top: 0;">❌ Error Crítico</h1>
        <p style="font-size: 18px; color: #666;">
          No se encontró el elemento <code>#root</code> en el HTML.
        </p>
        <p style="color: #888;">
          Esto indica un problema con el archivo <code>index.html</code>.
        </p>
      </div>
    </div>
  `;
} else {
  console.log('[main.tsx] ✅ Elemento #root encontrado');
  
  try {
    console.log('[main.tsx] Creando root de React...');
    const root = createRoot(rootElement);
    
    console.log('[main.tsx] Renderizando App...');
    root.render(<App />);
    
    console.log('[main.tsx] ✅ App renderizada exitosamente');
  } catch (error) {
    console.error('[main.tsx] ❌ Error al renderizar:', error);
    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fee;
        font-family: system-ui, sans-serif;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 600px;
        ">
          <h1 style="color: #e11d48; margin-top: 0;">❌ Error al Renderizar</h1>
          <p style="font-size: 18px; color: #666;">
            ${error instanceof Error ? error.message : String(error)}
          </p>
          <pre style="
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 12px;
          ">${error instanceof Error ? error.stack : ''}</pre>
        </div>
      </div>
    `;
  }
}
