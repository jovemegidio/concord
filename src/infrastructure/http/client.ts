// ============================================================================
// HTTP Client - Base API service with interceptors
// Handles JWT refresh, tenant headers, and error handling
// ============================================================================

import type { ApiResponse } from '../../types/api.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class HttpClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tenantId: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  // ─── Token Management ───

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('concord_access_token', accessToken);
    localStorage.setItem('concord_refresh_token', refreshToken);
  }

  setTenant(tenantId: string) {
    this.tenantId = tenantId;
    localStorage.setItem('concord_tenant_id', tenantId);
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tenantId = null;
    localStorage.removeItem('concord_access_token');
    localStorage.removeItem('concord_refresh_token');
    localStorage.removeItem('concord_tenant_id');
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('concord_access_token');
    this.refreshToken = localStorage.getItem('concord_refresh_token');
    this.tenantId = localStorage.getItem('concord_tenant_id');
  }

  // ─── Request Methods ───

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ─── Core Request ───

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.tenantId) {
      headers['X-Tenant-Id'] = this.tenantId;
    }

    const url = `${this.baseUrl}${path}`;

    let response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — try token refresh
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();

      // Retry with new token
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error,
      );
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  // ─── Token Refresh ───

  private async refreshAccessToken(): Promise<void> {
    // Deduplicate concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          this.clearAuth();
          window.dispatchEvent(new CustomEvent('concord:auth:expired'));
          throw new Error('Session expired');
        }

        const result = await response.json();
        this.setTokens(result.data.accessToken, result.data.refreshToken);
      } catch (error) {
        this.clearAuth();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

// ─── Error Class ───

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Singleton ───

export const httpClient = new HttpClient(API_BASE);
export default httpClient;
