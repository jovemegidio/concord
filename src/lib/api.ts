// ============================================================
// Concord — HTTP API Client with JWT Token Management
// Auto-refresh, error handling, type-safe requests
// ============================================================

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

// ── Token Management ────────────────────────────────────────
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('concord-access-token', access);
  localStorage.setItem('concord-refresh-token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('concord-access-token');
  localStorage.removeItem('concord-refresh-token');
}

export function getAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('concord-access-token');
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (!refreshToken) {
    refreshToken = localStorage.getItem('concord-refresh-token');
  }
  return refreshToken;
}

// ── Core Fetch ──────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 — try to refresh token
  if (res.status === 401 && getRefreshToken()) {
    await doRefresh();
    // Retry with new token
    const newToken = getAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new ApiError(err.error || `HTTP ${retry.status}`, retry.status);
      }
      return retry.json();
    }
    // Refresh failed — clear auth
    clearTokens();
    window.dispatchEvent(new Event('concord:auth:expired'));
    throw new ApiError('Sessão expirada', 401);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new ApiError(err.error || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

async function doRefresh() {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const rt = getRefreshToken();
      if (!rt) throw new Error('No refresh token');

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearTokens();
        window.dispatchEvent(new Event('concord:auth:expired'));
        return;
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
    } catch {
      clearTokens();
      window.dispatchEvent(new Event('concord:auth:expired'));
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Error Class ─────────────────────────────────────────────
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Public API Methods ──────────────────────────────────────
export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),

  // ── Auth (no token required) ────────────────────────────
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro no login' }));
        throw new ApiError(err.error, res.status);
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return data;
    },

    register: async (email: string, password: string, displayName: string) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro no registro' }));
        throw new ApiError(err.error, res.status);
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return data;
    },

    logout: async () => {
      try {
        const rt = getRefreshToken();
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: rt }),
        });
      } catch {
        // Ignore logout errors
      } finally {
        clearTokens();
      }
    },

    me: () => apiFetch<{ user: unknown }>('/auth/me'),

    updateProfile: (updates: Record<string, unknown>) =>
      apiFetch<{ user: unknown }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },
};

// ── WebSocket URL Builder ───────────────────────────────────
export function getWsUrl(): string {
  const token = getAccessToken();
  const base = import.meta.env.DEV
    ? 'ws://localhost:3001'
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
  return `${base}?token=${token}`;
}
