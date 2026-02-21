import React, { useState } from 'react';
import { X, Crown } from 'lucide-react';
import { useChatStore, useNavigationStore, CONCORD_USERS, useConnectionStore } from '@/stores';
import { Avatar } from '@/components/ui';
import { UserProfilePopup } from './UserProfilePopup';
import type { User } from '@/types';

export const MemberListPanel: React.FC = () => {
  const { currentUser, getWorkspaceById, getUserById, removeMember } = useChatStore();
  const { activeWorkspaceId } = useNavigationStore();
  const { onlineUsers } = useConnectionStore();
  const workspace = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
  const isOwner = workspace?.ownerId === currentUser?.id;
  const [profilePopupUser, setProfilePopupUser] = useState<User | null>(null);

  const memberUsers = (workspace?.members ?? []).map((m) => {
    const user = getUserById(m.userId);
    return user ?? CONCORD_USERS.find((u: User) => u.id === m.userId);
  }).filter(Boolean) as User[];

  const allMembers = memberUsers.length > 0 ? memberUsers : CONCORD_USERS;

  const online = allMembers.filter((u) => onlineUsers.includes(u.id));
  const offline = allMembers.filter((u) => !onlineUsers.includes(u.id));

  const handleRemove = (userId: string) => {
    if (!activeWorkspaceId) return;
    removeMember(activeWorkspaceId, userId);
  };

  const renderUser = (user: User) => {
    const isOnline = onlineUsers.includes(user.id);
    const isCurrent = currentUser?.id === user.id;
    const displayUser = isCurrent && currentUser ? currentUser : user;
    const memberData = workspace?.members.find((m) => m.userId === user.id);
    const canRemove = isOwner && !isCurrent && memberData?.role !== 'owner';
    return (
      <div
        key={user.id}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-800/50 transition-colors cursor-pointer group"
        onClick={() => setProfilePopupUser(displayUser)}
      >
        <Avatar
          name={displayUser.displayName}
          src={displayUser.avatar || undefined}
          size="sm"
          status={isOnline ? (isCurrent ? currentUser!.status : 'online') : 'offline'}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-surface-200 truncate">{displayUser.displayName}</p>
          {isCurrent && currentUser?.customStatus && (
            <p className="text-[10px] text-surface-500 truncate">{currentUser.customStatus}</p>
          )}
          {memberData?.role === 'owner' && (
            <p className="text-[10px] text-amber-500 truncate flex items-center gap-0.5">
              <Crown size={8} />
              Dono
            </p>
          )}
        </div>
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(user.id); }}
            className="opacity-0 group-hover:opacity-100 text-surface-600 hover:text-red-400 transition-all"
            title="Remover membro"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-56 min-w-[224px] bg-surface-900/50 border-l border-surface-800/50 flex flex-col">
        <div className="p-3">
          {online.length > 0 && (
            <>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold px-2 mb-1">
                Online — {online.length}
              </p>
              <div className="space-y-0.5 mb-4">
                {online.map(renderUser)}
              </div>
            </>
          )}
          {offline.length > 0 && (
            <>
              <p className="text-[10px] text-surface-500 uppercase tracking-wider font-semibold px-2 mb-1">
                Offline — {offline.length}
              </p>
              <div className="space-y-0.5">
                {offline.map(renderUser)}
              </div>
            </>
          )}
        </div>
      </div>
      {profilePopupUser && (
        <UserProfilePopup
          user={profilePopupUser}
          isOpen={true}
          onClose={() => setProfilePopupUser(null)}
        />
      )}
    </>
  );
};
