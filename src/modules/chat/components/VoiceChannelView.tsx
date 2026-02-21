import React from 'react';
import { Volume2, MicOff, Headphones, PhoneOff } from 'lucide-react';
import { useChatStore } from '@/stores';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { playJoinSound, playLeaveSound } from '@/lib/sounds';
import { useSpeakingStore } from '../hooks/useSpeaking';
import type { Channel } from '@/types';

export const VoiceChannelView: React.FC<{ channel: Channel }> = ({ channel }) => {
  const { getVoiceUsers, getVoiceChannel, joinVoiceChannel, leaveVoiceChannel, getUserById } = useChatStore();
  const speaking = useSpeakingStore((s) => s.speaking);
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

      {voiceUsers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {voiceUsers.map((vc) => {
            const voiceUser = getUserById(vc.userId);
            const name = voiceUser?.displayName ?? vc.userId;
            return (
              <div key={vc.userId} className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  'rounded-full transition-all',
                  speaking[vc.userId] ? 'ring-[3px] ring-green-500 scale-105' : '',
                )}>
                  <Avatar name={name} src={voiceUser?.avatar || undefined} size="lg" />
                </div>
                <span className="text-xs text-surface-400 max-w-[80px] truncate">{name}</span>
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
