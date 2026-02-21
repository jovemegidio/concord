// ============================================================================
// Auth Store — Manages authentication state with real backend API
// Supports dual mode: API-backed auth (enterprise) + legacy local auth
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/api/auth.service';
import httpClient from '@/infrastructure/http/client';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  // State
  user: AuthUser | null;
  tenants: AuthTenant[];
  activeTenantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  mode: 'api' | 'legacy'; // Which auth mode is active

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;

  // Legacy mode (for backward compatibility with existing relay server)
  setLegacyMode: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tenants: [],
      activeTenantId: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mode: 'legacy', // Default to legacy for backward compat

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          // Store tokens in HTTP client
          httpClient.setTokens(response.accessToken, response.refreshToken);

          // Set first tenant as active
          const activeTenantId = response.tenants?.[0]?.id || null;
          if (activeTenantId) {
            httpClient.setTenant(activeTenantId);
          }

          set({
            user: response.user,
            tenants: response.tenants || [],
            activeTenantId,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mode: 'api',
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Falha no login',
          });
          throw err;
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(email, password, displayName);

          httpClient.setTokens(response.accessToken, response.refreshToken);

          const activeTenantId = response.tenants?.[0]?.id || null;
          if (activeTenantId) {
            httpClient.setTenant(activeTenantId);
          }

          set({
            user: response.user,
            tenants: response.tenants || [],
            activeTenantId,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            mode: 'api',
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Falha no registro',
          });
          throw err;
        }
      },

      logout: async () => {
        const { mode, refreshToken } = get();
        try {
          if (mode === 'api' && refreshToken) {
            await authService.logout().catch(() => {});
          }
        } finally {
          httpClient.clearAuth();
          set({
            user: null,
            tenants: [],
            activeTenantId: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      switchTenant: (tenantId: string) => {
        httpClient.setTenant(tenantId);
        set({ activeTenantId: tenantId });
      },

      setError: (error: string | null) => set({ error }),

      clearAuth: () => {
        httpClient.clearAuth();
        set({
          user: null,
          tenants: [],
          activeTenantId: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLegacyMode: () => set({ mode: 'legacy' }),
    }),
    {
      name: 'concord-auth',
      partialize: (state) => ({
        user: state.user,
        tenants: state.tenants,
        activeTenantId: state.activeTenantId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        mode: state.mode,
      }),
    },
  ),
);

// Listen for token expiration events from HTTP client
if (typeof window !== 'undefined') {
  window.addEventListener('concord:auth:expired', () => {
    useAuthStore.getState().clearAuth();
  });
}
