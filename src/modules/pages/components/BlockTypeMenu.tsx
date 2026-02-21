import React from 'react';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Minus, Code, AlertCircle, Image, ToggleLeft, Bell,
} from 'lucide-react';
import type { BlockType } from '@/types';

export const BLOCK_TYPE_CONFIG: Record<BlockType, { label: string; icon: React.ReactNode }> = {
  paragraph: { label: 'Texto', icon: <Type size={14} /> },
  heading1: { label: 'Título 1', icon: <Heading1 size={14} /> },
  heading2: { label: 'Título 2', icon: <Heading2 size={14} /> },
  heading3: { label: 'Título 3', icon: <Heading3 size={14} /> },
  bulletList: { label: 'Lista', icon: <List size={14} /> },
  numberedList: { label: 'Lista Numerada', icon: <ListOrdered size={14} /> },
  todo: { label: 'Tarefa', icon: <CheckSquare size={14} /> },
  quote: { label: 'Citação', icon: <Quote size={14} /> },
  divider: { label: 'Divisor', icon: <Minus size={14} /> },
  code: { label: 'Código', icon: <Code size={14} /> },
  callout: { label: 'Destaque', icon: <AlertCircle size={14} /> },
  image: { label: 'Imagem', icon: <Image size={14} /> },
  toggle: { label: 'Toggle', icon: <ToggleLeft size={14} /> },
  reminder: { label: 'Lembrete', icon: <Bell size={14} /> },
};

export const BlockTypeMenu: React.FC<{
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filter?: string;
}> = ({ onSelect, onClose, filter }) => {
  const types = Object.entries(BLOCK_TYPE_CONFIG).filter(
    ([, cfg]) => !filter || cfg.label.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 py-1 w-56 max-h-64 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] text-surface-500 uppercase tracking-wider">Tipos de bloco</p>
        {types.map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => { onSelect(type as BlockType); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center text-surface-400">{cfg.icon}</span>
            {cfg.label}
          </button>
        ))}
        {types.length === 0 && (
          <p className="px-3 py-2 text-sm text-surface-500">Nenhum bloco encontrado</p>
        )}
      </div>
    </>
  );
};
