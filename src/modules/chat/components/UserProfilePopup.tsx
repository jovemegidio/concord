import React from 'react';
import { useChatStore, useConnectionStore } from '@/stores';
import { Avatar } from '@/components/ui';
import type { User } from '@/types';

export const UserProfilePopup: React.FC<{
  user: User;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}> = ({ user, isOpen, onClose }) => {
  const { currentUser } = useChatStore();
  const { onlineUsers } = useConnectionStore();

  if (!isOpen) return null;

  const isCurrent = currentUser?.id === user.id;
  const displayUser = isCurrent && currentUser ? currentUser : user;
  const isOnline = onlineUsers.includes(user.id);
  const statusLabel: Record<string, string> = {
    online: 'Online',
    idle: 'Ausente',
    dnd: 'Não Perturbe',
    offline: 'Offline',
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="fixed z-50 inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-[340px] bg-surface-850 border border-surface-700 rounded-xl shadow-2xl overflow-hidden animate-pop-in">
          {/* Banner */}
          <div
            className="h-[80px] relative"
            style={displayUser.banner
              ? { backgroundImage: `url(${displayUser.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, var(--brand-600, #4f46e5) 0%, #7c3aed 100%)' }}
          />

          {/* Avatar overlapping banner */}
          <div className="relative px-4">
            <div className="absolute -top-8">
              <div className="rounded-full p-1 bg-surface-850">
                <Avatar
                  name={displayUser.displayName}
                  src={displayUser.avatar || undefined}
                  size="lg"
                  status={isOnline ? (isCurrent ? currentUser!.status : 'online') : 'offline'}
                />
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 pt-10 pb-4">
            <div className="bg-surface-900 rounded-lg p-3">
              <h3 className="font-bold text-surface-100 text-lg leading-tight">{displayUser.displayName}</h3>
              <p className="text-xs text-surface-500">@{displayUser.name}</p>

              {/* Status */}
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: isOnline ? '#22c55e' : '#6b7280' }}
                />
                <span className="text-xs text-surface-400">
                  {isCurrent && currentUser
                    ? statusLabel[currentUser.status] || 'Online'
                    : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Custom status */}
              {displayUser.customStatus && (
                <div className="mt-2 pt-2 border-t border-surface-700">
                  <p className="text-xs text-surface-300">💭 {displayUser.customStatus}</p>
                </div>
              )}

              {/* About me */}
              {displayUser.aboutMe && (
                <div className="mt-2 pt-2 border-t border-surface-700">
                  <p className="text-[10px] text-surface-500 uppercase font-semibold mb-1">Sobre mim</p>
                  <p className="text-xs text-surface-300 whitespace-pre-wrap">{displayUser.aboutMe}</p>
                </div>
              )}

              {/* Member since */}
              <div className="mt-2 pt-2 border-t border-surface-700">
                <p className="text-[10px] text-surface-500 uppercase font-semibold mb-1">Membro desde</p>
                <p className="text-xs text-surface-300">
                  {displayUser.createdAt > 0
                    ? new Date(displayUser.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Hoje'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
