import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Hash, Volume2, Megaphone, Pin, SmilePlus,
  Plus, Trash2, Edit3, Send, Mic, MicOff, Headphones,
  PhoneOff, Settings, ChevronDown, ChevronRight, X, Check,
  Users,
} from 'lucide-react';
import { useNavigationStore, useChatStore, syncManager, CONCORD_USERS, useConnectionStore } from '@/stores';
import { Avatar, IconButton, Button, Modal } from '@/components/ui';
import { UserProfileModal } from '@/components/layout/UserProfileModal';
import { WorkspaceSettingsModal } from '@/components/layout/WorkspaceSettingsModal';
import { cn } from '@/lib/cn';
import { formatMessageTime } from '@/lib/utils';
import { playJoinSound, playLeaveSound, playMuteSound, playUnmuteSound, playDeafenSound } from '@/lib/sounds';
import type { Message, Channel, ChannelType } from '@/types';

// ── EMOJI PICKER (inline) ───────────────────────────────────
const EMOJI_GROUPS = [
  ['👍', '❤️', '😂', '🔥', '👀', '🚀', '🎉', '💯'],
  ['😊', '😢', '😮', '😡', '🤔', '👋', '✅', '❌'],
];

const EmojiPicker: React.FC<{ onSelect: (e: string) => void; onClose: () => void }> = ({
  onSelect,
  onClose,
}) => (
  <div className="absolute bottom-full right-0 mb-1 bg-surface-800 border border-surface-700 rounded-lg p-2 shadow-xl z-50">
    {EMOJI_GROUPS.map((group, gi) => (
      <div key={gi} className="flex gap-1 mb-1">
        {group.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-700 text-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    ))}
  </div>
);

// ── CHANNEL ICON ────────────────────────────────────────────
const ChannelIcon: React.FC<{ type: ChannelType; size?: number; className?: string }> = ({
  type,
  size = 16,
  className,
}) => {
  const icons = { text: Hash, voice: Volume2, announcement: Megaphone };
  const Icon = icons[type];
  return <Icon size={size} className={className} />;
};

// ── CREATE CHANNEL MODAL ────────────────────────────────────
const CreateChannelModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [description, setDescription] = useState('');
  const { createChannel } = useChatStore();
  const { activeWorkspaceId, setActiveChannel } = useNavigationStore();

  const handleCreate = () => {
    if (!name.trim() || !activeWorkspaceId) return;
    const channelId = createChannel(activeWorkspaceId, name.trim(), type, description.trim());
    setActiveChannel(channelId);
    setName('');
    setType('text');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Canal">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['text', 'voice', 'announcement'] as ChannelType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm',
                type === t
                  ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                  : 'border-surface-700 text-surface-400 hover:border-surface-600',
              )}
            >
              <ChannelIcon type={t} size={14} />
              {{ text: 'Texto', voice: 'Voz', announcement: 'Anúncio' }[t]}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nome do Canal</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="novo-canal"
            className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Descrição (opcional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobre o que é este canal?"
            className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Criar Canal</Button>
        </div>
      </div>
    </Modal>
  );
};

// ── CHANNEL HEADER ──────────────────────────────────────────
const ChannelHeader: React.FC<{ channel: Channel; showMembers: boolean; onToggleMembers: () => void }> = ({ channel, showMembers, onToggleMembers }) => {
  const [showPins, setShowPins] = useState(false);
  const { getChannelMessages } = useChatStore();
  const { activeWorkspaceId } = useNavigationStore();
  const messages = activeWorkspaceId ? getChannelMessages(activeWorkspaceId, channel.id) : [];
  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-surface-800/50 bg-surface-900/50">
      <ChannelIcon type={channel.type} size={20} className="text-surface-500 mr-2" />
      <h2 className="font-semibold text-surface-200">{channel.name}</h2>
      {channel.description && (
        <>
          <div className="w-px h-5 bg-surface-700 mx-3" />
          <span className="text-xs text-surface-500 truncate">{channel.description}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <IconButton
            icon={<Pin size={16} />}
            onClick={() => setShowPins(!showPins)}
            tooltip={`${pinnedMessages.length} fixada(s)`}
          />
          {showPins && pinnedMessages.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 p-3 max-h-60 overflow-y-auto">
              <h3 className="text-xs font-semibold text-surface-400 uppercase mb-2">
                Mensagens Fixadas ({pinnedMessages.length})
              </h3>
              {pinnedMessages.map((m) => (
                <div key={m.id} className="text-sm text-surface-300 py-1.5 border-b border-surface-700 last:border-0">
                  {m.content}
                </div>
              ))}
            </div>
          )}
        </div>
        <IconButton
          icon={<Users size={16} />}
          onClick={onToggleMembers}
          tooltip="Membros"
          className={showMembers ? 'text-brand-400' : undefined}
        />
      </div>
    </div>
  );
};

// ── MESSAGE BUBBLE ──────────────────────────────────────────
const MessageBubble: React.FC<{
  message: Message;
  showAvatar: boolean;
}> = ({ message, showAvatar }) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { currentUser, toggleReaction, deleteMessage, editMessage, togglePinMessage, getUserById } = useChatStore();
  const { activeWorkspaceId } = useNavigationStore();
  const author = getUserById(message.authorId);
  const isOwn = currentUser?.id === message.authorId;
  const authorName = author?.displayName ?? message.authorId;

  const handleEditSave = () => {
    if (!activeWorkspaceId || !editContent.trim()) return;
    editMessage(activeWorkspaceId, message.channelId, message.id, editContent.trim());
    setEditing(false);
  };

  const handleDelete = () => {
    if (!activeWorkspaceId) return;
    deleteMessage(activeWorkspaceId, message.channelId, message.id);
  };

  const handlePin = () => {
    if (!activeWorkspaceId) return;
    togglePinMessage(activeWorkspaceId, message.channelId, message.id);
  };

  const handleReaction = (emoji: string) => {
    if (!activeWorkspaceId) return;
    toggleReaction(activeWorkspaceId, message.channelId, message.id, emoji);
  };

  // Render markdown: code blocks, inline code, bold, italic, strikethrough, links
  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|https?:\/\/\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^\w+\n/, '');
        return (
          <pre key={i} className="bg-surface-950 rounded-md px-3 py-2 my-1 text-xs font-mono overflow-x-auto">
            <code className="text-emerald-400">{code}</code>
          </pre>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-surface-800 px-1.5 py-0.5 rounded text-xs text-amber-400 font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-surface-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <span key={i} className="line-through text-surface-500">{part.slice(2, -2)}</span>;
      }
      if (/^https?:\/\/\S+$/.test(part)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        'group px-4 py-0.5 hover:bg-surface-800/30 relative',
        showAvatar && 'mt-4 pt-1',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false); }}
    >
      <div className="flex items-start gap-3">
        {showAvatar ? (
          <Avatar name={authorName} src={author?.avatar || undefined} size="sm" className="mt-0.5" />
        ) : (
          <div className="w-8 flex items-center justify-center">
            <span className="text-[10px] text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {showAvatar && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-sm text-surface-100">{authorName}</span>
              <span className="text-[11px] text-surface-600">{formatMessageTime(message.createdAt)}</span>
              {message.isPinned && <Pin size={10} className="text-amber-500" />}
            </div>
          )}

          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="flex-1 bg-surface-900 border border-surface-600 rounded px-2 py-1 text-sm text-surface-200 focus:outline-none focus:border-brand-500"
                autoFocus
              />
              <IconButton icon={<Check size={14} />} onClick={handleEditSave} />
              <IconButton icon={<X size={14} />} onClick={() => setEditing(false)} />
            </div>
          ) : (
            <div className="text-sm text-surface-300 leading-relaxed break-words">
              {renderContent(message.content)}
              {message.isEdited && (
                <span className="text-[10px] text-surface-600 ml-1">(editado)</span>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors',
                    reaction.userIds.includes(currentUser?.id ?? '')
                      ? 'bg-brand-600/15 border-brand-500/40 text-brand-300'
                      : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-600',
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {showActions && !editing && (
        <div className="absolute -top-3 right-4 flex items-center bg-surface-800 border border-surface-700 rounded-lg shadow-lg z-10 overflow-hidden">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-1.5 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
            >
              <SmilePlus size={14} />
            </button>
            {showEmoji && <EmojiPicker onSelect={handleReaction} onClose={() => setShowEmoji(false)} />}
          </div>
          <button
            onClick={handlePin}
            className="p-1.5 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
            title={message.isPinned ? 'Desafixar' : 'Fixar'}
          >
            <Pin size={14} />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => { setEditing(true); setEditContent(message.content); }}
                className="p-1.5 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 hover:bg-red-600/20 text-surface-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── MESSAGE INPUT ───────────────────────────────────────────
const MessageInput: React.FC<{ channelName: string }> = ({ channelName }) => {
  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const { activeWorkspaceId, activeChannelId } = useNavigationStore();
  const { sendMessage, currentUser, getUserById } = useChatStore();

  // Listen for typing indicators from other users
  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const unsub = syncManager.onTyping((data) => {
      if (data.channelId !== activeChannelId) return;
      if (data.userId === currentUser?.id) return;

      if (data.isTyping) {
        setTypingUsers((prev) => [...prev.filter((id) => id !== data.userId), data.userId]);
        // Auto-clear after 4s if no update
        if (timers.has(data.userId)) clearTimeout(timers.get(data.userId)!);
        timers.set(data.userId, setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
          timers.delete(data.userId);
        }, 4000));
      } else {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        if (timers.has(data.userId)) {
          clearTimeout(timers.get(data.userId)!);
          timers.delete(data.userId);
        }
      }
    });

    return () => {
      unsub();
      timers.forEach((t) => clearTimeout(t));
    };
  }, [activeChannelId, currentUser?.id]);

  // Clear typing users when switching channels
  useEffect(() => {
    setTypingUsers([]);
  }, [activeChannelId]);

  const broadcastTyping = useCallback((typing: boolean) => {
    if (!activeChannelId || !currentUser) return;
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    syncManager.sendTyping(activeChannelId, currentUser.id, typing);
  }, [activeChannelId, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    // Broadcast "typing" on first keystroke, then debounce "stop typing"
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2500);
  };

  const handleSend = () => {
    if (!content.trim() || !activeWorkspaceId || !activeChannelId) return;
    sendMessage(activeWorkspaceId, activeChannelId, content.trim());
    setContent('');
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    inputRef.current?.focus();
  };

  const typingNames = typingUsers
    .map((id) => getUserById(id)?.displayName ?? id)
    .filter(Boolean);

  return (
    <div className="px-4 pb-4">
      {/* Typing indicator */}
      <div className="h-5 px-1 mb-0.5">
        {typingNames.length > 0 && (
          <p className="text-[11px] text-surface-400 animate-pulse-soft">
            <span className="font-medium text-surface-300">
              {typingNames.length === 1
                ? typingNames[0]
                : typingNames.length === 2
                  ? `${typingNames[0]} e ${typingNames[1]}`
                  : `${typingNames[0]} e mais ${typingNames.length - 1}`}
            </span>
            {' '}está digitando...
          </p>
        )}
      </div>

      <div className="flex items-center bg-surface-800 rounded-lg border border-surface-700 focus-within:border-surface-600 transition-colors">
        <input
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Mensagem #${channelName}`}
          className="flex-1 bg-transparent px-4 py-3 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="p-2 mr-1 text-surface-500 hover:text-brand-400 disabled:opacity-30 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

// ── VOICE CHANNEL PANEL ─────────────────────────────────────
const VoiceChannelPanel: React.FC = () => {
  const { currentUser, getVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen, voiceConnections, getUserById } = useChatStore();
  const activeVoiceChannel = getVoiceChannel();

  if (!activeVoiceChannel || !currentUser) return null;

  const myConnection = voiceConnections.find((vc) => vc.userId === currentUser.id);
  const channelConnections = voiceConnections.filter((vc) => vc.channelId === activeVoiceChannel);

  return (
    <div className="border-t border-surface-800 bg-surface-900/80 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Voz Conectada</span>
        </div>
        <span className="text-[10px] text-surface-500">{channelConnections.length} usuário(s)</span>
      </div>

      <div className="space-y-1 mb-3">
        {channelConnections.map((vc) => (
          <div key={vc.userId} className="flex items-center gap-2 px-2 py-1 rounded bg-surface-800/50">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
              vc.isSpeaking ? 'ring-2 ring-green-500 bg-green-600' : 'bg-surface-700',
            )}>
              {(getUserById(vc.userId)?.displayName ?? '?')[0]}
            </div>
            <span className="text-xs text-surface-300 flex-1">
              {getUserById(vc.userId)?.displayName ?? vc.userId}
            </span>
            {vc.isMuted && <MicOff size={10} className="text-red-400" />}
            {vc.isDeafened && <Headphones size={10} className="text-red-400" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => { myConnection?.isMuted ? playUnmuteSound() : playMuteSound(); toggleMute(); }}
          className={cn(
            'flex-1 p-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors',
            myConnection?.isMuted
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
              : 'bg-surface-800 text-surface-300 hover:bg-surface-700',
          )}
        >
          {myConnection?.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
        <button
          onClick={() => { playDeafenSound(); toggleDeafen(); }}
          className={cn(
            'flex-1 p-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-colors',
            myConnection?.isDeafened
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
              : 'bg-surface-800 text-surface-300 hover:bg-surface-700',
          )}
        >
          <span className="relative">
            <Headphones size={14} />
            {myConnection?.isDeafened && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="block w-[18px] h-[2px] bg-red-400 -rotate-45 rounded" />
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => { playLeaveSound(); leaveVoiceChannel(); }}
          className="flex-1 p-2 rounded-lg text-sm flex items-center justify-center gap-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
        >
          <PhoneOff size={14} />
        </button>
      </div>
    </div>
  );
};

// ── CHANNEL SIDEBAR ─────────────────────────────────────────
const ChannelSidebar: React.FC = () => {
  const { activeWorkspaceId, activeChannelId, setActiveChannel } = useNavigationStore();
  const { getWorkspaceById, currentUser, deleteChannel, joinVoiceChannel, getVoiceUsers, getVoiceChannel, getUserById } = useChatStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [textExpanded, setTextExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ channelId: string; x: number; y: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);

  const workspace = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;

  const textChannels = workspace?.channels.filter((c) => c.type === 'text' || c.type === 'announcement') ?? [];
  const voiceChannels = workspace?.channels.filter((c) => c.type === 'voice') ?? [];
  const activeVoice = getVoiceChannel();

  // Auto-select first text channel when none is selected
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
        {/* Workspace header */}
        <div
          onClick={() => setShowWorkspaceSettings(true)}
          className="h-12 min-h-[48px] flex items-center justify-between px-4 border-b border-surface-800/50 hover:bg-surface-800/30 cursor-pointer"
        >
          <h3 className="font-semibold text-surface-200 truncate">{workspace.name}</h3>
          <div className="flex items-center gap-1">
            <ChevronDown size={14} className="text-surface-500" />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          {/* Text channels */}
          <div className="px-2 mb-1">
            <button
              onClick={() => setTextExpanded(!textExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-surface-500 uppercase tracking-wider hover:text-surface-300 w-full px-1"
            >
              {textExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Canais de Texto
              <Plus
                size={14}
                className="ml-auto hover:text-surface-200"
                onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
              />
            </button>
          </div>

          {textExpanded && textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              onContextMenu={(e) => handleContextMenu(e, channel.id)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 mx-2 rounded-md text-sm transition-colors group',
                'max-w-[calc(100%-16px)]',
                activeChannelId === channel.id
                  ? 'bg-surface-700/70 text-surface-100'
                  : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800/50',
              )}
            >
              <ChannelIcon type={channel.type} size={16} className="shrink-0 opacity-60" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}

          {/* Voice channels */}
          <div className="px-2 mb-1 mt-4">
            <button
              onClick={() => setVoiceExpanded(!voiceExpanded)}
              className="flex items-center gap-1 text-[11px] font-semibold text-surface-500 uppercase tracking-wider hover:text-surface-300 w-full px-1"
            >
              {voiceExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Canais de Voz
              <Plus
                size={14}
                className="ml-auto hover:text-surface-200"
                onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }}
              />
            </button>
          </div>

          {voiceExpanded && voiceChannels.map((channel) => {
            const usersInChannel = getVoiceUsers(channel.id);
            const isActive = activeVoice === channel.id;

            return (
              <div key={channel.id}>
                <button
                  onClick={() => { playJoinSound(); joinVoiceChannel(channel.id); setActiveChannel(channel.id); }}
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
                {/* Users in voice channel */}
                {usersInChannel.length > 0 && (
                  <div className="ml-10 space-y-0.5 mt-0.5">
                    {usersInChannel.map((vc) => (
                      <div key={vc.userId} className="flex items-center gap-2 text-xs text-surface-400 px-2 py-0.5">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center text-[8px]',
                          vc.isSpeaking ? 'bg-green-600 ring-1 ring-green-400' : 'bg-surface-700',
                        )}>
                          {(getUserById(vc.userId)?.displayName ?? '?')[0]}
                        </div>
                        <span>{getUserById(vc.userId)?.displayName ?? vc.userId}</span>
                        {vc.isMuted && <MicOff size={8} className="text-red-400" />}
                      </div>
                    ))}
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
          <div className="p-2 bg-surface-950/50 border-t border-surface-800/50">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
              <Avatar name={currentUser.displayName} src={currentUser.avatar || undefined} status={currentUser.status} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-200 truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-surface-500 truncate">
                  {currentUser.customStatus || ({ online: 'Online', idle: 'Ausente', dnd: 'Não Perturbe', offline: 'Offline' } as Record<string, string>)[currentUser.status]}
                </p>
              </div>
              <IconButton icon={<Settings size={14} />} size="sm" onClick={() => setShowProfile(true)} />
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

// ── MEMBER LIST PANEL ─────────────────────────────────────────────
const MemberListPanel: React.FC = () => {
  const { currentUser } = useChatStore();
  const { onlineUsers } = useConnectionStore();

  const online = CONCORD_USERS.filter((u) => onlineUsers.includes(u.id));
  const offline = CONCORD_USERS.filter((u) => !onlineUsers.includes(u.id));

  const renderUser = (user: typeof CONCORD_USERS[0]) => {
    const isOnline = onlineUsers.includes(user.id);
    const isCurrent = currentUser?.id === user.id;
    const displayUser = isCurrent && currentUser ? currentUser : user;
    return (
      <div
        key={user.id}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-800/50 transition-colors cursor-pointer"
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
        </div>
      </div>
    );
  };

  return (
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
  );
};

// ── EMPTY STATE ─────────────────────────────────────────────
const EmptyChat: React.FC<{ channelName?: string }> = ({ channelName }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
        <Hash size={32} className="text-surface-500" />
      </div>
      <h3 className="text-xl font-bold text-surface-200 mb-2">
        {channelName ? `Bem-vindo ao #${channelName}` : 'Selecione um canal'}
      </h3>
      <p className="text-sm text-surface-500">
        {channelName
          ? 'Este é o início deste canal. Envie uma mensagem para começar a conversa!'
          : 'Escolha um canal de texto na barra lateral para começar a conversar.'}
      </p>
    </div>
  </div>
);

// ── VOICE CHANNEL VIEW (main area) ──────────────────────────
const VoiceChannelView: React.FC<{ channel: Channel }> = ({ channel }) => {
  const { getVoiceUsers, getVoiceChannel, joinVoiceChannel, leaveVoiceChannel, getUserById } = useChatStore();
  const voiceUsers = getVoiceUsers(channel.id);
  const activeVoice = getVoiceChannel();
  const isConnected = activeVoice === channel.id;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all',
        isConnected
          ? 'bg-green-600/20 ring-4 ring-green-500/30'
          : 'bg-surface-800',
      )}>
        <Volume2 size={40} className={isConnected ? 'text-green-400' : 'text-surface-500'} />
      </div>
      <h3 className="text-xl font-bold text-surface-200 mb-1">{channel.name}</h3>
      <p className="text-sm text-surface-500 mb-6">
        {isConnected ? 'Você está conectado a este canal de voz' : 'Canal de Voz'}
      </p>

      {/* Connected users */}
      {voiceUsers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {voiceUsers.map((vc) => {
            const name = getUserById(vc.userId)?.displayName ?? vc.userId;
            return (
              <div key={vc.userId} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all',
                  vc.isSpeaking
                    ? 'ring-[3px] ring-green-500 bg-green-600 text-white'
                    : 'bg-surface-700 text-surface-300',
                )}>
                  {name[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-xs text-surface-400 max-w-[70px] truncate">{name}</span>
                <div className="flex gap-1">
                  {vc.isMuted && <MicOff size={10} className="text-red-400" />}
                  {vc.isDeafened && <Headphones size={10} className="text-red-400" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {voiceUsers.length === 0 && (
        <p className="text-sm text-surface-600 mb-6">Ninguém conectado ainda</p>
      )}

      {!isConnected ? (
        <Button onClick={() => { playJoinSound(); joinVoiceChannel(channel.id); }} size="lg">
          <Volume2 size={18} />
          Entrar no Canal de Voz
        </Button>
      ) : (
        <Button variant="danger" onClick={() => { playLeaveSound(); leaveVoiceChannel(); }} size="lg">
          <PhoneOff size={18} />
          Desconectar
        </Button>
      )}
    </div>
  );
};

// ── CHAT VIEW (MAIN EXPORT) ────────────────────────────────
export const ChatView: React.FC = () => {
  const { activeWorkspaceId, activeChannelId } = useNavigationStore();
  const { getChannelById, getChannelMessages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);

  const channel =
    activeWorkspaceId && activeChannelId
      ? getChannelById(activeWorkspaceId, activeChannelId)
      : undefined;

  const messages =
    activeWorkspaceId && activeChannelId
      ? getChannelMessages(activeWorkspaceId, activeChannelId)
      : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  // Check if we should show messages (text channel only)
  const isTextChannel = channel && channel.type !== 'voice';

  const shouldShowAvatar = (msg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    if (prevMsg.authorId !== msg.authorId) return true;
    return msg.createdAt - prevMsg.createdAt > 5 * 60 * 1000;
  };

  return (
    <div className="flex flex-1 min-w-0">
      <ChannelSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {channel ? (
          <>
            <ChannelHeader channel={channel} showMembers={showMembers} onToggleMembers={() => setShowMembers(!showMembers)} />
            {isTextChannel ? (
              <>
                <div className="flex-1 flex min-h-0">
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {messages.length === 0 ? (
                        <EmptyChat channelName={channel.name} />
                      ) : (
                        <div className="py-4">
                          {messages.map((msg, i) => (
                            <MessageBubble
                              key={msg.id}
                              message={msg}
                              showAvatar={shouldShowAvatar(msg, messages[i - 1])}
                            />
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                    <MessageInput channelName={channel.name} />
                  </div>
                  {showMembers && <MemberListPanel />}
                </div>
              </>
            ) : (
              <VoiceChannelView channel={channel} />
            )}
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
};
