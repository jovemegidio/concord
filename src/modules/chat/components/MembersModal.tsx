import React, { useState } from 'react';
import { Users, Crown, Shield } from 'lucide-react';
import { useChatStore, useNavigationStore, CONCORD_USERS, useConnectionStore } from '@/stores';
import { Avatar, Modal } from '@/components/ui';
import { UserProfilePopup } from './UserProfilePopup';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

export const MembersModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, getWorkspaceById, getUserById } = useChatStore();
  const { activeWorkspaceId } = useNavigationStore();
  const { onlineUsers } = useConnectionStore();
  const workspace = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!workspace) return null;

  const memberUsers = workspace.members.map((m) => {
    const user = getUserById(m.userId);
    return { user: user ?? CONCORD_USERS.find((u) => u.id === m.userId)!, member: m };
  }).filter((x) => x.user);

  const filteredMembers = searchTerm
    ? memberUsers.filter((x) => x.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || x.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : memberUsers;

  const roleLabel = (role: string) => {
    if (role === 'owner') return 'Dono';
    if (role === 'admin') return 'Admin';
    return 'Membro';
  };

  const owners = filteredMembers.filter((x) => x.member.role === 'owner');
  const admins = filteredMembers.filter((x) => x.member.role === 'admin');
  const members = filteredMembers.filter((x) => x.member.role === 'member');

  const renderGroup = (title: string, items: typeof filteredMembers, icon?: React.ReactNode) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-[11px] text-surface-500 uppercase tracking-wider font-semibold">
            {title} — {items.length}
          </p>
        </div>
        <div className="space-y-1">
          {items.map(({ user, member }) => {
            const isCurrent = currentUser?.id === user.id;
            const displayUser = isCurrent && currentUser ? currentUser : user;
            const isOnline = onlineUsers.includes(user.id);

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(displayUser)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-800/50 transition-colors text-left group"
              >
                <Avatar
                  name={displayUser.displayName}
                  src={displayUser.avatar || undefined}
                  size="sm"
                  status={isOnline ? (isCurrent ? currentUser!.status : 'online') : 'offline'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-surface-200 truncate">{displayUser.displayName}</p>
                    <span className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                      member.role === 'owner'
                        ? 'bg-amber-600/20 text-amber-400'
                        : member.role === 'admin'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-surface-700/50 text-surface-500',
                    )}>
                      {member.role === 'owner' && <Crown size={8} className="inline mr-0.5 mb-0.5" />}
                      {member.role === 'admin' && <Shield size={8} className="inline mr-0.5 mb-0.5" />}
                      {roleLabel(member.role)}
                    </span>
                  </div>
                  <p className="text-[10px] text-surface-500 truncate">@{displayUser.name}</p>
                </div>
                <span className={cn('text-[10px]', isOnline ? 'text-green-400' : 'text-surface-600')}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Membros — ${workspace.name}`} size="lg">
        <div>
          <div className="mb-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar membros..."
              className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-700">
            <Users size={16} className="text-surface-400" />
            <span className="text-sm text-surface-300 font-medium">
              {filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
          {renderGroup('Dono', owners, <Crown size={14} className="text-amber-400" />)}
          {renderGroup('Administradores', admins, <Shield size={14} className="text-blue-400" />)}
          {renderGroup('Membros', members, <Users size={14} className="text-surface-400" />)}
          {filteredMembers.length === 0 && (
            <p className="text-center text-surface-500 text-sm py-8">Nenhum membro encontrado</p>
          )}
        </div>
      </Modal>
      {selectedUser && (
        <UserProfilePopup user={selectedUser} isOpen={true} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
};
