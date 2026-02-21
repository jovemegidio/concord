import React, { useState, useEffect } from 'react';
import {
  Volume2, Plus, Trash2, Settings, ChevronDown, ChevronRight, Users, MicOff,
} from 'lucide-react';
import { useNavigationStore, useChatStore } from '@/stores';
import { Avatar, IconButton } from '@/components/ui';
import { UserProfileModal } from '@/components/layout/UserProfileModal';
import { WorkspaceSettingsModal } from '@/components/layout/WorkspaceSettingsModal';
import { cn } from '@/lib/cn';
import { playJoinSound } from '@/lib/sounds';
import { ChannelIcon } from './ChatPrimitives';
import { CreateChannelModal } from './CreateChannelModal';
import { MembersModal } from './MembersModal';
import { UserProfilePopup } from './UserProfilePopup';
import { VoiceChannelPanel } from './VoiceChannelPanel';
import { useSpeakingStore } from '../hooks/useSpeaking';
import type { User } from '@/types';

export const ChannelSidebar: React.FC = () => {
  const { activeWorkspaceId, activeChannelId, setActiveChannel } = useNavigationStore();
  const { getWorkspaceById, currentUser, deleteChannel, joinVoiceChannel, getVoiceUsers, getVoiceChannel, getUserById } = useChatStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [textExpanded, setTextExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ channelId: string; x: number; y: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [profilePopupUser, setProfilePopupUser] = useState<User | null>(null);
  const speaking = useSpeakingStore((s) => s.speaking);
  const [textCategoryName, setTextCategoryName] = useState('Canais de Texto');
  const [voiceCategoryName, setVoiceCategoryName] = useState('Canais de Voz');
  const [editingCategory, setEditingCategory] = useState<'text' | 'voice' | null>(null);
  const [categoryEditValue, setCategoryEditValue] = useState('');

  const workspace = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
  const textChannels = workspace?.channels.filter((c) => c.type === 'text' || c.type === 'announcement') ?? [];
  const voiceChannels = workspace?.channels.filter((c) => c.type === 'voice') ?? [];
  const activeVoice = getVoiceChannel();

  useEffect(() => {
    if (!activeChannelId && textChannels.length > 0) {
      setActiveChannel(textChannels[0].id);
    }
  }, [activeChannelId, textChannels, setActiveChannel]);

  if (!workspace) return null;

  const handleContextMenu = (e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    setContextMenu({ channelId, x: e.clientX, y: e.clientY });
  };

  const handleDeleteChannel = (channelId: string) => {
    if (!activeWorkspaceId) return;
    deleteChannel(activeWorkspaceId, channelId);
    setContextMenu(null);
    if (activeChannelId === channelId) {
      const remaining = workspace.channels.filter((c) => c.id !== channelId);
      if (remaining.length > 0) setActiveChannel(remaining[0].id);
    }
  };

  return (
    <>
      <div className="w-60 min-w-[240px] bg-surface-900 flex flex-col border-r border-surface-800/50">
        {/* Workspace banner + header */}
        {workspace.banner ? (
          <div className="relative">
            <div
              className="h-[100px] bg-cover bg-center"
              style={{ backgroundImage: `url(${workspace.banner})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-surface-900" />
            </div>
            <div
              onClick={() => setShowWorkspaceSettings(true)}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-black/10 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {workspace.iconImage ? (
                  <img src={workspace.iconImage} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-white/20" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <span className="text-base">{workspace.icon}</span>
                  </div>
                )}
                <h3 className="font-semibold text-white truncate text-[15px] drop-shadow">{workspace.name}</h3>
              </div>
              <ChevronDown size={16} className="text-white/60 group-hover:text-white transition-colors shrink-0 drop-shadow" />
            </div>
            <button
              onClick={() => setShowMembersModal(true)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
              title="Membros"
            >
              <Users size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setShowWorkspaceSettings(true)}
            className="h-12 min-h-[48px] flex items-center justify-between px-4 border-b border-surface-800/50 hover:bg-surface-800/30 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {workspace.iconImage ? (
                <img src={workspace.iconImage} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-surface-700/50" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
                  <span className="text-base">{workspace.icon}</span>
                </div>
              )}
              <h3 className="font-semibold text-surface-100 truncate text-[15px]">{workspace.name}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMembersModal(true); }}
                className="w-6 h-6 rounded flex items-center justify-center text-surface-500 hover:text-surface-300 transition-colors"
                title="Membros"
              >
                <Users size={14} />
              </button>
              <ChevronDown size={16} className="text-surface-500 group-hover:text-surface-300 transition-colors shrink-0" />
            </div>
          </div>
        )}

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          {/* Text channels */}
          <div className="px-2 mb-1">
            {editingCategory === 'text' ? (
              <input
                value={categoryEditValue}
                onChange={(e) => setCategoryEditValue(e.target.value)}
                onBlur={() => {
                  if (categoryEditValue.trim()) setTextCategoryName(categoryEditValue.trim());
                  setEditingCategory(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (categoryEditValue.trim()) setTextCategoryName(categoryEditValue.trim());
                    setEditingCategory(null);
                  }
                  if (e.key === 'Escape') setEditingCategory(null);
                }}
                className="w-full bg-surface-800 border border-brand-500 rounded px-2 py-0.5 text-[11px] font-bold text-surface-200 uppercase tracking-widest focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setTextExpanded(!textExpanded)}
                onDoubleClick={() => { setEditingCategory('text'); setCategoryEditValue(textCategoryName); }}
                className="flex items-center gap-1 text-[11px] font-bold text-surface-500 uppercase tracking-widest hover:text-surface-300 w-full px-1 py-1 transition-colors"
              >
                {textExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                {textCategoryName}
                <Plus
                  size={15}
                  className="ml-auto hover:text-surface-200 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  style={{ opacity: 1 }}
                  onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                />
              </button>
            )}
          </div>

          {textExpanded && textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              onContextMenu={(e) => handleContextMenu(e, channel.id)}
              className={cn(
                'flex items-center gap-2 w-full px-2.5 py-1.5 mx-2 rounded-md text-[13px] transition-all duration-150 group relative',
                'max-w-[calc(100%-16px)]',
                activeChannelId === channel.id
                  ? 'bg-surface-700/70 text-surface-100 font-medium'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50',
              )}
            >
              {activeChannelId === channel.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full" />
              )}
              <ChannelIcon type={channel.type} size={16} className={cn('shrink-0', activeChannelId === channel.id ? 'opacity-80' : 'opacity-50')} />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}

          {/* Voice channels */}
          <div className="px-2 mb-1 mt-5">
            {editingCategory === 'voice' ? (
              <input
                value={categoryEditValue}
                onChange={(e) => setCategoryEditValue(e.target.value)}
                onBlur={() => {
                  if (categoryEditValue.trim()) setVoiceCategoryName(categoryEditValue.trim());
                  setEditingCategory(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (categoryEditValue.trim()) setVoiceCategoryName(categoryEditValue.trim());
                    setEditingCategory(null);
                  }
                  if (e.key === 'Escape') setEditingCategory(null);
                }}
                className="w-full bg-surface-800 border border-brand-500 rounded px-2 py-0.5 text-[11px] font-bold text-surface-200 uppercase tracking-widest focus:outline-none"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setVoiceExpanded(!voiceExpanded)}
                onDoubleClick={() => { setEditingCategory('voice'); setCategoryEditValue(voiceCategoryName); }}
                className="flex items-center gap-1 text-[11px] font-bold text-surface-500 uppercase tracking-widest hover:text-surface-300 w-full px-1 py-1 transition-colors"
              >
                {voiceExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                {voiceCategoryName}
                <Plus
                  size={15}
                  className="ml-auto hover:text-surface-200 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
                />
              </button>
            )}
          </div>

          {voiceExpanded && voiceChannels.map((channel) => {
            const usersInChannel = getVoiceUsers(channel.id);
            const isActive = activeVoice === channel.id;

            return (
              <div key={channel.id}>
                <button
                  onClick={() => {
                    if (activeVoice !== channel.id) { playJoinSound(); joinVoiceChannel(channel.id); }
                    setActiveChannel(channel.id);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, channel.id)}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-1.5 mx-2 rounded-md text-sm transition-colors',
                    'max-w-[calc(100%-16px)]',
                    isActive
                      ? 'bg-green-600/10 text-green-400'
                      : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/50',
                  )}
                >
                  <Volume2 size={16} className="shrink-0 opacity-60" />
                  <span className="truncate">{channel.name}</span>
                  {usersInChannel.length > 0 && (
                    <span className="ml-auto text-[10px] text-green-400">{usersInChannel.length}</span>
                  )}
                </button>
                {usersInChannel.length > 0 && (
                  <div className="ml-8 space-y-0.5 mt-0.5 border-l-2 border-surface-800/60 pl-2">
                    {usersInChannel.map((vc) => {
                      const voiceUser = getUserById(vc.userId);
                      const isCurrent = currentUser?.id === vc.userId;
                      const displayVoiceUser = isCurrent && currentUser ? currentUser : voiceUser;
                      return (
                        <div key={vc.userId} className="flex items-center gap-2 text-xs text-surface-400 px-2 py-1 rounded hover:bg-surface-800/30 cursor-pointer" onClick={() => displayVoiceUser && setProfilePopupUser(displayVoiceUser)}>
                          <div className={cn(
                            'transition-all rounded-full',
                            speaking[vc.userId] && 'ring-2 ring-green-400/50 scale-110',
                          )}>
                            <Avatar
                              name={displayVoiceUser?.displayName ?? '?'}
                              src={displayVoiceUser?.avatar || undefined}
                              size="xs"
                            />
                          </div>
                          <span className={cn('text-[12px]', speaking[vc.userId] && 'text-green-400 font-medium')}>
                            {displayVoiceUser?.displayName ?? vc.userId}
                          </span>
                          {vc.isMuted && <MicOff size={10} className="text-red-400 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Voice panel */}
        <VoiceChannelPanel />

        {/* User info */}
        {currentUser && (
          <div className="px-2 py-2 bg-surface-950/60 border-t border-surface-800/50">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-800/40 transition-colors cursor-pointer" onClick={() => setProfilePopupUser(currentUser)}>
              <Avatar name={currentUser.displayName} src={currentUser.avatar || undefined} status={currentUser.status} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-surface-100 truncate leading-tight">{currentUser.displayName}</p>
                <p className="text-[11px] text-surface-500 truncate leading-tight mt-0.5">
                  {currentUser.customStatus || ({ online: 'Online', idle: 'Ausente', dnd: 'Não Perturbe', offline: 'Offline' } as Record<string, string>)[currentUser.status]}
                </p>
              </div>
              <IconButton icon={<Settings size={15} />} size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowProfile(true); }} />
            </div>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-surface-800 border border-surface-700 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleDeleteChannel(contextMenu.channelId)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/10 transition-colors"
            >
              <Trash2 size={14} />
              Excluir Canal
            </button>
          </div>
        </>
      )}

      <CreateChannelModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <MembersModal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} />
      {profilePopupUser && (
        <UserProfilePopup
          user={profilePopupUser}
          isOpen={true}
          onClose={() => setProfilePopupUser(null)}
        />
      )}
      {activeWorkspaceId && (
        <WorkspaceSettingsModal
          isOpen={showWorkspaceSettings}
          onClose={() => setShowWorkspaceSettings(false)}
          workspaceId={activeWorkspaceId}
        />
      )}
    </>
  );
};
