// ============================================================
// Concord — Notification System
// Browser Notifications + In-App Toast Notifications
// ============================================================

import { create } from 'zustand';

// ── Types ───────────────────────────────────────────────────
export type NotificationType = 'message' | 'board' | 'page' | 'voice' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  timestamp: number;
  read: boolean;
}

// ── Notification Store ──────────────────────────────────────
interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  permission: NotificationPermission;
  soundEnabled: boolean;
  addNotification: (type: NotificationType, title: string, body: string, icon?: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  setPermission: (p: NotificationPermission) => void;
  toggleSound: () => void;
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  soundEnabled: true,

  addNotification: (type, title, body, icon) => {
    const notification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      body,
      icon,
      timestamp: Date.now(),
      read: false,
    };

    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 50), // Keep max 50
      unreadCount: s.unreadCount + 1,
    }));

    // Play notification sound
    if (get().soundEnabled) {
      playNotificationSound();
    }

    // Send browser notification if permitted and tab is not focused
    if (document.hidden && get().permission === 'granted') {
      try {
        const browserNotif = new Notification(title, {
          body,
          icon: icon || '/concord-logo.png',
          badge: '/concord-logo.png',
          tag: notification.id,
          silent: true, // We play our own sound
        });

        browserNotif.onclick = () => {
          window.focus();
          browserNotif.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => browserNotif.close(), 5000);
      } catch {
        // Fallback — some browsers don't support Notification constructor
      }
    }
  },

  markAllRead: () => set((s) => ({
    notifications: s.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setPermission: (p) => set({ permission: p }),

  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
}));

// ── Request permission ──────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;

  if (Notification.permission === 'granted') {
    useNotificationStore.getState().setPermission('granted');
    return true;
  }

  if (Notification.permission === 'denied') {
    useNotificationStore.getState().setPermission('denied');
    return false;
  }

  const result = await Notification.requestPermission();
  useNotificationStore.getState().setPermission(result);
  return result === 'granted';
}

// ── Notification sound (Web Audio API) ──────────────────────
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone notification chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    setTimeout(() => ctx.close(), 300);
  } catch {
    // Silently fail if audio context not available
  }
}

// ── Icon mapping for notification types ─────────────────────
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  message: '💬',
  board: '📋',
  page: '📄',
  voice: '🎙️',
  system: '⚡',
};

// ── Update page title with unread count ─────────────────────
export function updatePageTitle(unread: number) {
  const base = 'Concord';
  document.title = unread > 0 ? `(${unread}) ${base}` : base;
}
