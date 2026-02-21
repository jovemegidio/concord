import React from 'react';
import { Hash } from 'lucide-react';

export const EmptyChat: React.FC<{ channelName?: string }> = ({ channelName }) => (
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
