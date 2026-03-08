import { create } from 'zustand';
import { localDb } from '@/core/database/localDb';
import { toast } from 'sonner';

interface PasswordRequest {
  id: string;
  user_id: string | null;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  tenant_id: string;
  created_at: string;
}

interface PasswordRequestsState {
  requests: PasswordRequest[];
  isLoading: boolean;
  fetchRequests: () => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
}

export const usePasswordRequests = create<PasswordRequestsState>((set, get) => ({
  requests: [],
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const dbRequests = await localDb.password_reset_requests
        .orderBy('created_at')
        .reverse()
        .toArray();
      set({ requests: dbRequests });
    } catch (error) {
      console.error('Error fetching password requests:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  approveRequest: async (id) => {
    try {
      const request = await localDb.password_reset_requests.get(id);
      if (!request) return;

      // Actualizar estado de la solicitud
      await localDb.password_reset_requests.update(id, { status: 'approved' });
      
      // Aquí se dispararía la lógica real de cambio de contraseña o envío de email
      // Por ahora simulamos éxito
      toast.success(`Solicitud de ${request.username} aprobada.`);
      
      await get().fetchRequests();
    } catch (error) {
      toast.error('Error al aprobar la solicitud');
    }
  },

  rejectRequest: async (id) => {
    try {
      await localDb.password_reset_requests.update(id, { status: 'rejected' });
      toast.info('Solicitud rechazada');
      await get().fetchRequests();
    } catch (error) {
      toast.error('Error al rechazar la solicitud');
    }
  }
}));
