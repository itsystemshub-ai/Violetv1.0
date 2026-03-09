import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { SyncService } from "@/core/sync/SyncService";
import { User, UserRole } from '@/lib';
import { toast } from 'sonner';
import { localDb } from "@/core/database/localDb";
import { DEFAULT_USERS } from '@/data/defaultUsers';

interface UserManagementState {
  users: User[];
  isLoading: boolean;
  fetchAllUsers: () => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'permissions'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  seedMockUsers: (tenantId: string) => Promise<void>;
  initializeRealtime: () => () => void;
}

export const useUserManagement = create<UserManagementState>((set) => ({
  users: [],
  isLoading: false,

  fetchAllUsers: async () => {
    // 1. Cargar desde Respaldo Local (Instantáneo)
    const localUsers = await localDb.profiles.toArray();
    if (localUsers.length > 0) {
      set({ users: localUsers });
    } else {
      // Auto-seed if empty
      const tenantId = '3e4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d'; // Default tenant
      await useUserManagement.getState().seedMockUsers(tenantId);
    }

    set({ isLoading: true });
    try {
      // CLOUD SYNC DISABLED
      /*
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      */
      const data: any[] = []; // Default to empty or keep local

      if (data && data.length > 0) {
        const mappedUsers: User[] = data.map(p => ({
          id: p.id,
          username: p.username,
          name: p.full_name || p.username,
          email: p.email,
          role: p.role as UserRole,
          tenantId: p.tenant_id,
          avatarUrl: p.avatar_url,
          is2FAEnabled: p.two_factor_enabled || false,
          permissions: (p.permissions as any) || [],
          isSuperAdmin: p.role === 'super_admin',
          department: p.department || undefined
        }));
        set({ users: mappedUsers });
        
        // 2. Actualizar Respaldo Local
        await localDb.profiles.bulkPut(mappedUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      // Don't toast error if it's just a sync failure
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (userData) => {
    try {
      const tempId = crypto.randomUUID();
      const dbPayload = {
        id: tempId,
        username: userData.username,
        full_name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        tenant_id: userData.tenantId,
        department: userData.department,
        updated_at: new Date().toISOString()
      };

      const response = await SyncService.mutate(
        'profiles',
        'INSERT',
        dbPayload,
        tempId
      );

      const error = response.error;
      const data = 'data' in response ? response.data : null;

      if (error) throw error;

      const newUser: User = {
        id: (data as any)?.id || tempId,
        username: dbPayload.username,
        name: dbPayload.full_name,
        email: dbPayload.email,
        password: dbPayload.password,
        role: dbPayload.role as UserRole,
        tenantId: dbPayload.tenant_id,
        is2FAEnabled: false,
        permissions: [],
        isSuperAdmin: dbPayload.role === 'super_admin',
        department: dbPayload.department
      };

      set(state => ({ users: [...state.users, newUser] }));
      await localDb.profiles.put(newUser);
      toast.success('Usuario creado exitosamente');
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error('Error al crear usuario');
    }
  },

  updateUser: async (id, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.role) dbUpdates.role = updates.role;
      if (updates.tenantId) dbUpdates.tenant_id = updates.tenantId;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.department) dbUpdates.department = updates.department;
      if (updates.password) dbUpdates.password = updates.password;
      
      dbUpdates.updated_at = new Date().toISOString();

      const response = await SyncService.mutate(
        'profiles',
        'UPDATE',
        dbUpdates,
        id
      );
      const error = response.error;

      if (error) throw error;

      set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      }));
      toast.success('Usuario actualizado');
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Error al actualizar usuario');
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await SyncService.mutate(
        'profiles',
        'DELETE',
        null,
        id
      );
      const error = response.error;

      if (error) throw error;

      set(state => ({
        users: state.users.filter(u => u.id !== id)
      }));
      toast.success('Usuario eliminado');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Error al eliminar usuario');
    }
  },

  initializeRealtime: () => {
    const channel = supabase
      .channel('profiles_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            const newUser: any = {
                id: newRecord.id,
                username: newRecord.username,
                name: newRecord.full_name || newRecord.username,
                email: newRecord.email,
                role: newRecord.role as UserRole,
                tenantId: newRecord.tenant_id,
                tenant_id: newRecord.tenant_id,
                is2FAEnabled: newRecord.two_factor_enabled || false,
                permissions: newRecord.permissions || [],
                isSuperAdmin: newRecord.role === 'super_admin',
                department: newRecord.department
            };
            set(state => {
                if (state.users.some(u => u.id === newUser.id)) return state;
                return { users: [...state.users, newUser] };
            });
            localDb.profiles.put(newUser);
          } else if (eventType === 'UPDATE') {
            const updatedUser: any = {
                id: newRecord.id,
                username: newRecord.username,
                name: newRecord.full_name || newRecord.username,
                email: newRecord.email,
                role: newRecord.role as UserRole,
                tenantId: newRecord.tenant_id,
                tenant_id: newRecord.tenant_id,
                is2FAEnabled: newRecord.two_factor_enabled || false,
                permissions: newRecord.permissions || [],
                isSuperAdmin: newRecord.role === 'super_admin',
                department: newRecord.department
            };
            set(state => ({
                users: state.users.map(u => u.id === newRecord.id ? updatedUser : u)
            }));
            localDb.profiles.put(updatedUser);
          } else if (eventType === 'DELETE') {
            set(state => ({
                users: state.users.filter(u => u.id !== oldRecord.id)
            }));
            localDb.profiles.delete(oldRecord.id);
          }
        }
      )
      .subscribe();

    return () => {
      channel?.unsubscribe();
    };
  },

  seedMockUsers: async (tenantId) => {
    set({ isLoading: true });
    try {
      let createdCount = 0;
      for (const u of DEFAULT_USERS) {
        // Check if already exists in localDb
        const existing = await localDb.profiles.where('username').equals(u.username).first();
        
        if (!existing) {
          const newUser: User = {
            ...u,
            id: `usr_${crypto.randomUUID()}`,
            tenantId: tenantId,
            permissions: (u as any).permissions || []
          };
          
          await localDb.profiles.put(newUser);
          createdCount++;
        }
      }

      if (createdCount > 0) {
        const allUsers = await localDb.profiles.toArray();
        set({ users: allUsers });
        console.log(`[useUserManagement] Seedeados ${createdCount} usuarios por defecto.`);
      }
    } catch (err) {
      console.error('Error seeding users:', err);
    } finally {
      set({ isLoading: false });
    }
  }
}));
