// ============================================================================
// Auth Store — JWT-based authentication with the new scalable API
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, clearTokens, getAccessToken } from '@/lib/api';
import type { User } from '@/types';

// Re-export for backward compatibility
export type AuthUser = User;
export type AuthTenant = { id: string; name: string; slug: string; role: string };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mode: 'api' | 'legacy';

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateProfile: (updates: Partial<Pick<User, 'displayName' | 'avatar' | 'aboutMe'>>) => Promise<void>;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  setLegacyMode: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mode: 'legacy',

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.auth.login(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mode: 'api',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Falha no login';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.auth.register(email, password, displayName);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mode: 'api',
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Falha no registro';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        try {
          if (get().mode === 'api') {
            await api.auth.logout().catch(() => {});
          }
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false, error: null });
        }
      },

      checkAuth: async () => {
        const token = getAccessToken();
        if (!token) return false;
        try {
          const data = await api.auth.me();
          const user = (data as { user: User }).user ?? data;
          set({ user: user as User, isAuthenticated: true, mode: 'api' });
          return true;
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },

      updateProfile: async (updates) => {
        try {
          const data = await api.auth.updateProfile(updates as Record<string, unknown>);
          const user = (data as { user: User }).user ?? data;
          set({ user: user as User });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Falha ao atualizar perfil';
          set({ error: message });
        }
      },

      setError: (error) => set({ error }),
      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, error: null });
      },

      setLegacyMode: () => set({ mode: 'legacy' }),
    }),
    {
      name: 'concord-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        mode: state.mode,
      }),
    },
  ),
);

// Listen for token expiration
if (typeof window !== 'undefined') {
  window.addEventListener('concord:auth:expired', () => {
    useAuthStore.getState().clearAuth();
  });
}
