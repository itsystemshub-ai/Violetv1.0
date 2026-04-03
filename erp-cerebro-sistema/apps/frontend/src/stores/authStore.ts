import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  firstName: string;
  lastName: string;
  cedula: string;
  role: {
    id: string;
    name: string;
    color: string;
    icon: string;
    permissions: any[];
    modules: any[];
  };
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      login: (user, tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ user, tokens, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
