// ============================================================
// Concord — Real-Time Sync via WebSocket
// Replaces BroadcastChannel with a WebSocket relay server
// Handles: state sync, presence (online/offline), typing
// ============================================================

import { create } from 'zustand';
import type { StoreApi } from 'zustand';

// ── Connection state (reactive via tiny Zustand store) ──────
interface ConnectionState {
  connected: boolean;
  onlineUsers: string[];
  _setConnected: (v: boolean) => void;
  _setOnlineUsers: (ids: string[]) => void;
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  connected: false,
  onlineUsers: [],
  _setConnected: (v) => set({ connected: v }),
  _setOnlineUsers: (ids) => set({ onlineUsers: ids }),
}));

// ── Sync Manager (singleton) ────────────────────────────────
class SyncManager {
  private ws: WebSocket | null = null;
  private stores = new Map<string, { store: StoreApi<unknown>; exclude?: string[] }>();
  private isSyncing = false;
  private ready = false; // Don't broadcast until initial state received
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private typingListeners: Array<(data: { channelId: string; userId: string; isTyping: boolean }) => void> = [];
  private speakingListeners: Array<(data: { userId: string; speaking: boolean }) => void> = [];
  private pendingIdentity: { userId: string; displayName: string } | null = null;

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // In dev mode (Vite), connect directly to the server port
    // In production, connect to the same host serving the app
    const wsUrl = import.meta.env.DEV
      ? 'ws://localhost:3001'
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ Conectado ao servidor Concord');
      if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
      useConnectionStore.getState()._setConnected(true);
      // Re-identify on reconnect
      if (this.pendingIdentity) {
        this.identify(this.pendingIdentity.userId, this.pendingIdentity.displayName);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'init': {
            // Server sends full state snapshot on connect
            this.isSyncing = true;
            for (const [name, { store }] of this.stores) {
              if (msg.state[name]) {
                store.setState(msg.state[name]);
              }
            }
            this.isSyncing = false;
            this.ready = true; // Now safe to broadcast local changes
            break;
          }

          case 'sync': {
            // Another client updated a store
            const entry = this.stores.get(msg.store);
            if (entry) {
              this.isSyncing = true;
              entry.store.setState(msg.state);
              this.isSyncing = false;
            }
            break;
          }

          case 'presence': {
            // Online users list update
            useConnectionStore.getState()._setOnlineUsers(msg.online ?? []);
            break;
          }

          case 'typing': {
            // Typing indicator from another user
            this.typingListeners.forEach((fn) => fn(msg));
            break;
          }

          case 'speaking': {
            // Speaking indicator from another user
            this.speakingListeners.forEach((fn) => fn(msg));
            break;
          }
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      useConnectionStore.getState()._setConnected(false);
      this.ready = false;
      // Reconnect after 2 seconds
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  register(store: StoreApi<unknown>, name: string, exclude?: string[]) {
    this.stores.set(name, { store, exclude });

    // Subscribe to local state changes → send to server
    store.subscribe((state) => {
      if (this.isSyncing || !this.ready) return;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const filtered: Record<string, unknown> = {};
      const s = state as Record<string, unknown>;
      for (const key of Object.keys(s)) {
        if (typeof s[key] === 'function') continue;
        if (exclude?.includes(key)) continue;
        filtered[key] = s[key];
      }

      try {
        this.ws.send(JSON.stringify({
          type: 'sync',
          store: name,
          state: filtered,
        }));
      } catch {
        // ignore serialization failures
      }
    });

    // Auto-connect on first register
    if (!this.ws) this.connect();
  }

  /** Identify the current user to the server (for presence tracking) */
  identify(userId: string, displayName: string) {
    this.pendingIdentity = { userId, displayName };
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'identify', userId, displayName }));
    }
  }

  /** Send typing indicator */
  sendTyping(channelId: string, userId: string, isTyping: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'typing', channelId, userId, isTyping }));
    }
  }

  /** Listen for typing indicators from other users */
  onTyping(listener: (data: { channelId: string; userId: string; isTyping: boolean }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter((fn) => fn !== listener);
    };
  }

  /** Send speaking indicator (relayed but not persisted) */
  sendSpeaking(userId: string, speaking: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'speaking', userId, speaking }));
    }
  }

  /** Listen for speaking indicators from other users */
  onSpeaking(listener: (data: { userId: string; speaking: boolean }) => void) {
    this.speakingListeners.push(listener);
    return () => {
      this.speakingListeners = this.speakingListeners.filter((fn) => fn !== listener);
    };
  }
}

export const syncManager = new SyncManager();

/**
 * Enable real-time sync for a Zustand store.
 *
 * Call once after store creation:
 *   enableSync(useChatStore, 'chat', ['currentUser']);
 */
export function enableSync<T extends object>(
  store: StoreApi<T>,
  channelName: string,
  exclude?: string[],
) {
  syncManager.register(store as StoreApi<unknown>, channelName, exclude);
}
