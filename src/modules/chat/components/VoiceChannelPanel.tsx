import React from 'react';
import { Mic, MicOff, Headphones, PhoneOff } from 'lucide-react';
import { useChatStore } from '@/stores';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { playMuteSound, playUnmuteSound, playDeafenSound, playLeaveSound } from '@/lib/sounds';
import { useSpeakingStore, useSpeakingSimulation } from '../hooks/useSpeaking';

export const VoiceChannelPanel: React.FC = () => {
  const { currentUser, getVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen, voiceConnections, getUserById } = useChatStore();
  const speaking = useSpeakingStore((s) => s.speaking);
  const activeVoiceChannel = getVoiceChannel();

  useSpeakingSimulation();

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
        {channelConnections.map((vc) => {
          const voiceUser = getUserById(vc.userId);
          return (
            <div key={vc.userId} className="flex items-center gap-2 px-2 py-1 rounded bg-surface-800/50">
              <div className={cn(
                'transition-all rounded-full',
                speaking[vc.userId] && 'ring-2 ring-green-500 scale-110',
              )}>
                <Avatar
                  name={voiceUser?.displayName ?? '?'}
                  src={voiceUser?.avatar || undefined}
                  size="xs"
                />
              </div>
              <span className="text-xs text-surface-300 flex-1">
                {voiceUser?.displayName ?? vc.userId}
              </span>
              {vc.isMuted && <MicOff size={10} className="text-red-400" />}
              {vc.isDeafened && <Headphones size={10} className="text-red-400" />}
            </div>
          );
        })}
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
