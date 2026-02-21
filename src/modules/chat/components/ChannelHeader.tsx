import React, { useState } from 'react';
import { Pin, Users } from 'lucide-react';
import { useChatStore, useNavigationStore } from '@/stores';
import { IconButton } from '@/components/ui';
import { ChannelIcon } from './ChatPrimitives';
import { formatMessageTime } from '@/lib/utils';
import type { Channel } from '@/types';

export const ChannelHeader: React.FC<{
  channel: Channel;
  showMembers: boolean;
  onToggleMembers: () => void;
}> = ({ channel, showMembers, onToggleMembers }) => {
  const [showPins, setShowPins] = useState(false);
  const { getChannelMessages, getUserById } = useChatStore();
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
          {showPins && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPins(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 p-3 max-h-60 overflow-y-auto">
                <h3 className="text-xs font-semibold text-surface-400 uppercase mb-2">
                  Mensagens Fixadas ({pinnedMessages.length})
                </h3>
                {pinnedMessages.length === 0 && (
                  <p className="text-xs text-surface-600 py-2">Nenhuma mensagem fixada</p>
                )}
                {pinnedMessages.map((m) => {
                  const author = getUserById(m.authorId);
                  return (
                    <div key={m.id} className="py-2 border-b border-surface-700 last:border-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-surface-200">{author?.displayName ?? m.authorId}</span>
                        <span className="text-[10px] text-surface-600">{formatMessageTime(m.createdAt)}</span>
                      </div>
                      <p className="text-sm text-surface-300">{m.content}</p>
                    </div>
                  );
                })}
              </div>
            </>
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
