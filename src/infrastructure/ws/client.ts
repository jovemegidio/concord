// ============================================================================
// WebSocket Client - Socket.IO based real-time connection
// Manages communication and realtime namespaces
// ============================================================================

type EventHandler = (...args: any[]) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketClient {
  private sockets: Map<string, any> = new Map();
  private listeners: Map<string, Map<string, Set<EventHandler>>> = new Map();
  private connected = false;

  /**
   * Connect to a WebSocket namespace.
   * Namespaces: '/communication', '/realtime'
   */
  async connect(namespace: string): Promise<void> {
    if (this.sockets.has(namespace)) return;

    // Dynamic import to avoid SSR issues
    const { io } = await import('socket.io-client');

    const socket = io(`${WS_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log(`🔌 WS connected to ${namespace}`);
      this.connected = true;
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`🔌 WS disconnected from ${namespace}: ${reason}`);
      this.connected = false;
    });

    socket.on('connect_error', (error: Error) => {
      console.warn(`WS connection error (${namespace}):`, error.message);
    });

    this.sockets.set(namespace, socket);
    this.listeners.set(namespace, new Map());
  }

  /**
   * Emit an event to a namespace.
   */
  emit(namespace: string, event: string, data?: any): void {
    const socket = this.sockets.get(namespace);
    if (!socket) {
      console.warn(`Socket not connected to ${namespace}`);
      return;
    }
    socket.emit(event, data);
  }

  /**
   * Listen for events on a namespace.
   */
  on(namespace: string, event: string, handler: EventHandler): () => void {
    const socket = this.sockets.get(namespace);
    if (!socket) {
      console.warn(`Socket not connected to ${namespace}`);
      return () => {};
    }

    socket.on(event, handler);

    // Track listeners for cleanup
    const nsListeners = this.listeners.get(namespace)!;
    if (!nsListeners.has(event)) {
      nsListeners.set(event, new Set());
    }
    nsListeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      socket.off(event, handler);
      nsListeners.get(event)?.delete(handler);
    };
  }

  /**
   * Disconnect from a namespace.
   */
  disconnect(namespace: string): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
      this.listeners.delete(namespace);
    }
  }

  /**
   * Disconnect from all namespaces.
   */
  disconnectAll(): void {
    for (const [namespace] of this.sockets) {
      this.disconnect(namespace);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
