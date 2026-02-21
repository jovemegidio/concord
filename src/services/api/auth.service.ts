// ============================================================================
// Auth Service - Frontend API layer
// ============================================================================

import httpClient from '../../infrastructure/http/client';
import type { AuthTokens } from '../../types/api.types';

export const authService = {
  async register(email: string, password: string, displayName: string): Promise<AuthTokens> {
    const result = await httpClient.post<AuthTokens>('/auth/register', {
      email,
      password,
      displayName,
    });

    httpClient.setTokens(result.accessToken, result.refreshToken);

    if (result.tenants.length > 0) {
      httpClient.setTenant(result.tenants[0].id);
    }

    return result;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const result = await httpClient.post<AuthTokens>('/auth/login', {
      email,
      password,
    });

    httpClient.setTokens(result.accessToken, result.refreshToken);

    if (result.tenants.length > 0) {
      httpClient.setTenant(result.tenants[0].id);
    }

    return result;
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      httpClient.clearAuth();
    }
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return httpClient.post<AuthTokens>('/auth/refresh', { refreshToken });
  },
};
