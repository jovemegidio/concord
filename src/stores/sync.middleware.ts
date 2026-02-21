// ============================================================
// Concord — Real-Time Sync via WebSocket (v2)
// Granular event-based sync instead of full state replacement
// JWT-authenticated connections
// ============================================================

import { create } from 'zustand';
import { getWsUrl, getAccessToken } from '@/lib/api';

// ── Connection state ────────────────────────────────────────
interface ConnectionState {
  connected: boolean;
  initialSyncDone: boolean;
  onlineUsers: string[];
  _setConnected: (v: boolean) => void;
  _setInitialSyncDone: (v: boolean) => void;
  _setOnlineUsers: (ids: string[]) => void;
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  connected: false,
  initialSyncDone: false,
  onlineUsers: [],
  _setConnected: (v) => set({ connected: v }),
  _setInitialSyncDone: (v) => set({ initialSyncDone: v }),
  _setOnlineUsers: (ids) => set({ onlineUsers: ids }),
}));

// ── Event Listener Type ─────────────────────────────────────
type EventListener = (data: Record<string, unknown>) => void;

// ── Sync Manager (singleton) ────────────────────────────────
class SyncManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<string, Set<EventListener>>();
  private typingListeners: Array<(data: { channelId: string; userId: string; displayName: string; isTyping: boolean }) => void> = [];
  private speakingListeners: Array<(data: { userId: string; speaking: boolean }) => void> = [];
  private voiceListeners: Array<(data: Record<string, unknown>) => void> = [];

  connect() {
    const token = getAccessToken();
    if (!token) {
      // No token yet, wait and retry
      this.reconnectTimer = setTimeout(() => this.connect(), 1000);
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsUrl();
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket conectado (v2 — eventos granulares)');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      useConnectionStore.getState()._setConnected(true);
      useConnectionStore.getState()._setInitialSyncDone(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'presence':
            useConnectionStore.getState()._setOnlineUsers(msg.online ?? []);
            break;

          case 'typing':
            this.typingListeners.forEach((fn) => fn(msg));
            break;

          case 'speaking':
            this.speakingListeners.forEach((fn) => fn(msg));
            break;

          case 'voice:join':
          case 'voice:leave':
          case 'voice:mute':
          case 'voice:deafen':
            this.voiceListeners.forEach((fn) => fn(msg));
            break;

          default: {
            // Granular data events: message:created, board:updated, page:created, etc.
            const eventListeners = this.listeners.get(msg.type);
            if (eventListeners) {
              eventListeners.forEach((fn) => fn(msg));
            }
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      useConnectionStore.getState()._setConnected(false);
      // Reconnect with backoff
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useConnectionStore.getState()._setConnected(false);
  }

  // ── Event Registration ──────────────────────────────────
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  // ── Send message to server ──────────────────────────────
  send(message: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch {
        // ignore
      }
    }
  }

  // ── Identify (legacy compat — JWT provides identity now) ──
  identify(_userId?: string, _displayName?: string) {
    // No-op: identity comes from JWT token on WebSocket connection
    // Just ensure we're connected
    this.connect();
  }

  // ── Typing ──────────────────────────────────────────────
  sendTyping(channelId: string, _userId?: string, isTyping?: boolean) {
    // Supports both (channelId, userId, isTyping) and (channelId, isTyping)
    const typing = typeof _userId === 'boolean' ? _userId : isTyping;
    this.send({ type: 'typing', channelId, isTyping: typing ?? true });
  }

  onTyping(listener: (data: { channelId: string; userId: string; displayName: string; isTyping: boolean }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter((fn) => fn !== listener);
    };
  }

  // ── Speaking ────────────────────────────────────────────
  sendSpeaking(_userId?: string, speaking?: boolean) {
    // Supports both (userId, speaking) and (speaking)
    const isSpeaking = typeof _userId === 'boolean' ? _userId : speaking;
    this.send({ type: 'speaking', speaking: isSpeaking ?? false });
  }

  onSpeaking(listener: (data: { userId: string; speaking: boolean }) => void) {
    this.speakingListeners.push(listener);
    return () => {
      this.speakingListeners = this.speakingListeners.filter((fn) => fn !== listener);
    };
  }

  // ── Voice ───────────────────────────────────────────────
  sendVoice(type: string, data?: Record<string, unknown>) {
    this.send({ type, ...data });
  }

  onVoice(listener: (data: Record<string, unknown>) => void) {
    this.voiceListeners.push(listener);
    return () => {
      this.voiceListeners = this.voiceListeners.filter((fn) => fn !== listener);
    };
  }

  // ── Subscribe to workspace events ───────────────────────
  subscribe(workspaceId: string) {
    this.send({ type: 'subscribe', workspaceId });
  }
}

export const syncManager = new SyncManager();

// ── Legacy compat: enableSync is now a no-op ────────────────
// Stores use API calls + WS events instead of full-state sync
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function enableSync(_store: unknown, _key: string, _exclude?: string[]) {
  // No-op — left for backward compatibility during migration
}
