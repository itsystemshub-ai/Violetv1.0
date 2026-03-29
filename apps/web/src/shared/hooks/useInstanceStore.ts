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
    // En entorno cloud/web, por ahora asumimos master localmente o vía ENV
    set({ isLoaded: true, role: 'master', masterIp: 'localhost' });
    NetworkService.connect('localhost');
  },

  setInstanceInfo: async (role, masterIp) => {
    set({ role, masterIp });
    // Update network connection immediately
    NetworkService.connect(masterIp);
  }
}));
