import React, { useState } from 'react';
import { Calendar, MessageSquare, Edit3 } from 'lucide-react';
import { CONCORD_USERS } from '@/stores';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { PriorityBadge, LabelBadge, ChecklistProgress } from './CardBadges';
import { CardDetailModal } from './CardDetailModal';
import type { Card, Board, ID } from '@/types';

export const CardItem: React.FC<{
  card: Card;
  boardId: ID;
  columnId: ID;
  board: Board;
  onDragStart: (cardId: ID, columnId: ID) => void;
}> = ({ card, boardId, columnId, board, onDragStart }) => {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        draggable
        onDragStart={() => onDragStart(card.id, columnId)}
        onClick={() => setShowDetail(true)}
        className="bg-surface-800 rounded-lg p-3 cursor-pointer border border-surface-700/50 hover:border-surface-600 transition-all group shadow-sm hover:shadow-md"
      >
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((l) => <LabelBadge key={l.id} label={l} />)}
          </div>
        )}

        <p className="text-sm text-surface-200 font-medium mb-2 leading-snug">{card.title}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={card.priority} />
          <ChecklistProgress items={card.checklist} />

          {card.dueDate && (
            <span className={cn(
              'text-[10px] flex items-center gap-0.5',
              card.dueDate < Date.now() ? 'text-red-400' : 'text-surface-500',
            )}>
              <Calendar size={10} />
              {new Date(card.dueDate).toLocaleDateString()}
            </span>
          )}

          {card.comments.length > 0 && (
            <span className="text-[10px] text-surface-500 flex items-center gap-0.5">
              <MessageSquare size={10} />
              {card.comments.length}
            </span>
          )}

          {card.description && (
            <span className="text-[10px] text-surface-500 flex items-center gap-0.5">
              <Edit3 size={10} />
            </span>
          )}

          {(card.assignees ?? []).length > 0 && (
            <div className="flex -space-x-1.5 ml-auto">
              {(card.assignees ?? []).map((uid) => {
                const u = CONCORD_USERS.find((cu) => cu.id === uid);
                return u ? (
                  <Avatar key={uid} name={u.displayName} src={u.avatar || undefined} size="xs" />
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      <CardDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        card={card}
        boardId={boardId}
        columnId={columnId}
        board={board}
      />
    </>
  );
};
