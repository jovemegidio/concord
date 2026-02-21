import React, { useState } from 'react';
import { useNavigationStore, useChatStore } from '@/stores';
import { Button, Modal } from '@/components/ui';
import { ChannelIcon } from './ChatPrimitives';
import { cn } from '@/lib/cn';
import type { ChannelType } from '@/types';

export const CreateChannelModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
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
