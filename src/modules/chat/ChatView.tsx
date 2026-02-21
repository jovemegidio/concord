import React, { useState, useRef, useEffect } from 'react';
import { useNavigationStore, useChatStore } from '@/stores';
import {
  ChannelSidebar,
  ChannelHeader,
  MessageBubble,
  MessageInput,
  MemberListPanel,
  EmptyChat,
  VoiceChannelView,
  UserProfilePopup,
} from './components';
import type { Message, User } from '@/types';

export const ChatView: React.FC = () => {
  const { activeWorkspaceId, activeChannelId } = useNavigationStore();
  const { getChannelById, getChannelMessages } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [profilePopupUser, setProfilePopupUser] = useState<User | null>(null);

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
            <ChannelHeader
              channel={channel}
              showMembers={showMembers}
              onToggleMembers={() => setShowMembers(!showMembers)}
            />
            {isTextChannel ? (
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
                            onUserClick={(user) => setProfilePopupUser(user)}
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
            ) : (
              <VoiceChannelView channel={channel} />
            )}
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
      {profilePopupUser && (
        <UserProfilePopup
          user={profilePopupUser}
          isOpen={true}
          onClose={() => setProfilePopupUser(null)}
        />
      )}
    </div>
  );
};
