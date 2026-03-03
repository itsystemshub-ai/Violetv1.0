import { create } from 'zustand';
import { NetworkService } from '@/services/LocalNetworkService';

interface InstanceState {
  role: 'master' | 'client';
  masterIp: string;
  isLoaded: boolean;
  setInstanceInfo: (role: 'master' | 'client', masterIp: string) => Promise<void>;
  loadInstanceInfo: () => Promise<void>;
}

export const useInstanceStore = create<InstanceState>((set) => ({
  role: 'master',
  masterIp: 'localhost',
  isLoaded: false,

  loadInstanceInfo: async () => {
    if (window.electronAPI) {
      const info = await window.electronAPI.getInstanceInfo();
      set({ ...info, isLoaded: true });
      // Initialize network connection on load
      if (info.masterIp) {
        NetworkService.connect(info.masterIp);
      }
    } else {
      set({ isLoaded: true }); // Fallback para web
      NetworkService.connect('localhost');
    }
  },

  setInstanceInfo: async (role, masterIp) => {
    set({ role, masterIp });
    // Update network connection immediately
    NetworkService.connect(masterIp);
    
    if (window.electronAPI) {
      await window.electronAPI.setInstanceInfo({ role, masterIp });
    }
  }
}));
