import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Reply } from 'lucide-react';
import { useNavigationStore, useChatStore, syncManager } from '@/stores';
import type { Message } from '@/types';

export const MessageInput: React.FC<{
  channelName: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}> = ({ channelName, replyTo, onCancelReply }) => {
  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const { activeWorkspaceId, activeChannelId } = useNavigationStore();
  const { sendMessage, currentUser, getUserById } = useChatStore();

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const unsub = syncManager.onTyping((data) => {
      if (data.channelId !== activeChannelId) return;
      if (data.userId === currentUser?.id) return;

      if (data.isTyping) {
        setTypingUsers((prev) => [...prev.filter((id) => id !== data.userId), data.userId]);
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

  useEffect(() => {
    setTypingUsers([]);
  }, [activeChannelId]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  const broadcastTyping = useCallback((typing: boolean) => {
    if (!activeChannelId || !currentUser) return;
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    syncManager.sendTyping(activeChannelId, currentUser.id, typing);
  }, [activeChannelId, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 2500);
  };

  const handleSend = () => {
    if (!content.trim() || !activeWorkspaceId || !activeChannelId) return;
    sendMessage(activeWorkspaceId, activeChannelId, content.trim(), replyTo?.id);
    setContent('');
    broadcastTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onCancelReply?.();
    inputRef.current?.focus();
  };

  const replyAuthor = replyTo ? getUserById(replyTo.authorId) : undefined;

  const typingNames = typingUsers
    .map((id) => getUserById(id)?.displayName ?? id)
    .filter(Boolean);

  return (
    <div className="px-4 pb-4">
      <div className="h-6 px-1 mb-0.5 flex items-center">
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[3px]">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <p className="text-[11px] text-surface-400">
              <span className="font-medium text-surface-300">
                {typingNames.length === 1
                  ? typingNames[0]
                  : typingNames.length === 2
                    ? `${typingNames[0]} e ${typingNames[1]}`
                    : `${typingNames[0]} e mais ${typingNames.length - 1}`}
              </span>
              {' '}está digitando...
            </p>
          </div>
        )}
      </div>

      {/* Reply preview banner */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-800/80 border border-surface-700 rounded-t-lg border-b-0">
          <Reply size={14} className="text-brand-400 shrink-0" />
          <span className="text-xs text-surface-400">Respondendo a</span>
          <span className="text-xs font-medium text-surface-200">
            {replyAuthor?.displayName ?? replyTo.authorId}
          </span>
          <span className="text-xs text-surface-500 truncate flex-1 max-w-[300px]">
            {replyTo.content}
          </span>
          <button
            onClick={onCancelReply}
            className="p-0.5 text-surface-500 hover:text-surface-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`flex items-center bg-surface-800 border border-surface-700 focus-within:border-surface-600 transition-colors ${replyTo ? 'rounded-b-lg rounded-t-none' : 'rounded-lg'}`}>
        <input
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSend();
            if (e.key === 'Escape' && replyTo) onCancelReply?.();
          }}
          placeholder={replyTo ? `Responder a ${replyAuthor?.displayName ?? replyTo.authorId}...` : `Mensagem #${channelName}`}
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
