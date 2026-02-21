import React from 'react';
import { Hash, Volume2, Megaphone } from 'lucide-react';
import type { ChannelType } from '@/types';

// ── EMOJI PICKER ────────────────────────────────────────────
const EMOJI_GROUPS = [
  ['👍', '❤️', '😂', '🔥', '👀', '🚀', '🎉', '💯'],
  ['😊', '😢', '😮', '😡', '🤔', '👋', '✅', '❌'],
];

export const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => (
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
export const ChannelIcon: React.FC<{
  type: ChannelType;
  size?: number;
  className?: string;
}> = ({ type, size = 16, className }) => {
  const icons = { text: Hash, voice: Volume2, announcement: Megaphone };
  const Icon = icons[type];
  return <Icon size={size} className={className} />;
};
