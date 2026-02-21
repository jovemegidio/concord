import React, { useState } from 'react';
import { SmilePlus, Pin, Edit3, Trash2, Check, X } from 'lucide-react';
import { useChatStore, useNavigationStore } from '@/stores';
import { Avatar, IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatMessageTime } from '@/lib/utils';
import { EmojiPicker } from './ChatPrimitives';
import type { Message, User } from '@/types';

const renderMarkdown = (content: string) => {
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

export const MessageBubble: React.FC<{
  message: Message;
  showAvatar: boolean;
  onUserClick?: (user: User) => void;
}> = ({ message, showAvatar, onUserClick }) => {
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
          <button onClick={() => author && onUserClick?.(author)} className="hover:opacity-80 transition-opacity">
            <Avatar name={authorName} src={author?.avatar || undefined} size="sm" className="mt-0.5" />
          </button>
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
              <button onClick={() => author && onUserClick?.(author)} className="font-semibold text-sm text-surface-100 hover:underline">{authorName}</button>
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
              {renderMarkdown(message.content)}
              {message.isEdited && (
                <span className="text-[10px] text-surface-600 ml-1">(editado)</span>
              )}
            </div>
          )}

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
