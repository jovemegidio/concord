// ============================================================
// Concord — Notification Watcher
// Listens for store changes and triggers notifications
// ============================================================

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/stores';
import { useBoardStore } from '@/stores';
import { usePagesStore } from '@/stores';
import {
  useNotificationStore,
  requestNotificationPermission,
  updatePageTitle,
  NOTIFICATION_ICONS,
} from '@/lib/notifications';
import { CONCORD_USERS } from '@/stores/chat.store';

// ── Toast Component ─────────────────────────────────────────
const Toast: React.FC<{
  title: string;
  body: string;
  icon: string;
  onClose: () => void;
}> = ({ title, body, icon, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-slide-in flex items-start gap-3 bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 shadow-2xl shadow-black/40 max-w-sm w-full backdrop-blur-sm">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-surface-100 truncate">{title}</p>
        <p className="text-xs text-surface-400 line-clamp-2 mt-0.5">{body}</p>
      </div>
      <button
        onClick={onClose}
        className="text-surface-500 hover:text-surface-300 text-lg leading-none mt-0.5"
      >
        ×
      </button>
    </div>
  );
};

// ── Toast Container ─────────────────────────────────────────
export const ToastContainer: React.FC = () => {
  const notifications = useNotificationStore((s) => s.notifications);
  const recentUnread = notifications.filter((n) => !n.read && Date.now() - n.timestamp < 5000).slice(0, 3);

  if (recentUnread.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {recentUnread.map((n) => (
        <Toast
          key={n.id}
          title={n.title}
          body={n.body}
          icon={NOTIFICATION_ICONS[n.type]}
          onClose={() => useNotificationStore.getState().markAllRead()}
        />
      ))}
    </div>
  );
};

// ── Notification Watcher ────────────────────────────────────
export const NotificationWatcher: React.FC = () => {
  const currentUser = useChatStore((s) => s.currentUser);
  const workspaces = useChatStore((s) => s.workspaces);
  const boards = useBoardStore((s) => s.boards);
  const pages = usePagesStore((s) => s.pages);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const addNotification = useNotificationStore((s) => s.addNotification);

  // Track previous state for comparison
  const prevMessages = useRef<number>(0);
  const prevCards = useRef<number>(0);
  const prevPages = useRef<number>(0);
  const isInitialized = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission();
    }
  }, [currentUser]);

  // Update page title with unread count
  useEffect(() => {
    updatePageTitle(unreadCount);
  }, [unreadCount]);

  // Count total messages across all workspaces
  const totalMessages = workspaces.reduce((acc, ws) =>
    acc + ws.channels.reduce((ch, c) => ch + c.messages.length, 0), 0
  );

  // Count total cards across all boards
  const totalCards = boards.reduce((acc, b) =>
    acc + b.columns.reduce((col, c) => col + c.cards.length, 0), 0
  );

  // Count total pages
  const totalPages = pages.length;

  // Watch for new messages
  useEffect(() => {
    if (!isInitialized.current) {
      prevMessages.current = totalMessages;
      prevCards.current = totalCards;
      prevPages.current = totalPages;
      isInitialized.current = true;
      return;
    }

    if (!currentUser) return;

    // New message
    if (totalMessages > prevMessages.current) {
      // Find the newest message
      let newest: { authorId: string; content: string; channelName: string; createdAt: number } | null = null;
      for (const ws of workspaces) {
        for (const ch of ws.channels) {
          if (ch.messages.length > 0) {
            const last = ch.messages[ch.messages.length - 1];
            if (!newest || last.createdAt > newest.createdAt) {
              newest = { authorId: last.authorId, content: last.content, channelName: ch.name, createdAt: last.createdAt };
            }
          }
        }
      }

      if (newest && newest.authorId !== currentUser.id) {
        const author = CONCORD_USERS.find((u) => u.id === newest!.authorId);
        addNotification(
          'message',
          `${author?.displayName ?? 'Alguém'} em #${newest.channelName}`,
          newest.content.length > 80 ? newest.content.slice(0, 80) + '...' : newest.content,
        );
      }
    }
    prevMessages.current = totalMessages;
  }, [totalMessages]);

  // Watch for new cards
  useEffect(() => {
    if (!isInitialized.current || !currentUser) return;

    if (totalCards > prevCards.current) {
      const diff = totalCards - prevCards.current;
      addNotification(
        'board',
        'Novo cartão no Kanban',
        `${diff} cartão(s) adicionado(s) ao quadro`,
      );
    }
    prevCards.current = totalCards;
  }, [totalCards]);

  // Watch for new pages
  useEffect(() => {
    if (!isInitialized.current || !currentUser) return;

    if (totalPages > prevPages.current) {
      const diff = totalPages - prevPages.current;
      addNotification(
        'page',
        'Nova página criada',
        `${diff} página(s) adicionada(s)`,
      );
    }
    prevPages.current = totalPages;
  }, [totalPages]);

  return null;
};
