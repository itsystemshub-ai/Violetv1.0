import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      platform: string;
      version: string;
      getConfig: () => Promise<Record<string, unknown>>;
      saveConfig: (config: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
      getVersion: () => Promise<string>;
      printPage: () => Promise<void>;
      getInstanceInfo: () => Promise<{ role: 'master' | 'client'; masterIp: string }>;
      setInstanceInfo: (info: { role: 'master' | 'client'; masterIp: string }) => Promise<{ success: boolean; error?: string }>;
      executeSql: (query: string, params?: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
    };
  }
}

// Valores por defecto de .env (se usan variables dummy para evitar crash sincrónico antes de cargar la config de Electron)
const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';


// Inicialización del cliente con capacidad de actualización
export let supabase = createClient(defaultUrl, defaultKey);

// Si estamos en modo escritorio (Electron), intentamos cargar la config persistente
if (window.electronAPI?.getConfig) {
  window.electronAPI.getConfig().then((config) => {
    const url = config.supabaseUrl as string | undefined;
    const key = config.supabaseAnonKey as string | undefined;
    if (url && key) {
      console.log('Violet ERP: Usando configuración de base de datos persistente.');
      supabase = createClient(url, key);
    } else {
      // Si el archivo de config está vacío, guardamos los valores por defecto
      window.electronAPI?.saveConfig({
        supabaseUrl: defaultUrl,
        supabaseAnonKey: defaultKey,
      });
    }
  }).catch((err: unknown) => console.error('Error al sincronizar config persistente:', err));
}
