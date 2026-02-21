import React, { useState } from 'react';
import { Plus, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import { useBoardStore } from '@/stores';
import { Button, IconButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { CardItem } from './CardItem';
import type { Column, Board, ID } from '@/types';

export const BoardColumn: React.FC<{
  column: Column;
  boardId: ID;
  board: Board;
  onDragStart: (cardId: ID, columnId: ID) => void;
  onDrop: (columnId: ID) => void;
}> = ({ column, boardId, board, onDragStart, onDrop }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const { createCard, renameColumn, deleteColumn } = useBoardStore();
  const [showMenu, setShowMenu] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    createCard(boardId, column.id, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
  };

  const handleRenameColumn = () => {
    if (colTitle.trim()) renameColumn(boardId, column.id, colTitle.trim());
    setEditingTitle(false);
  };

  return (
    <div
      className={cn(
        'w-72 min-w-[288px] flex flex-col bg-surface-900/50 rounded-xl border transition-colors',
        dragOver ? 'border-brand-500/50 bg-brand-600/5' : 'border-surface-800/50',
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(column.id); }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        {editingTitle ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={colTitle}
              onChange={(e) => setColTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn()}
              onBlur={handleRenameColumn}
              className="flex-1 bg-surface-800 border border-surface-600 rounded px-2 py-0.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500"
              autoFocus
            />
          </div>
        ) : (
          <h3
            onClick={() => { setEditingTitle(true); setColTitle(column.title); }}
            className="text-sm font-semibold text-surface-300 cursor-pointer hover:text-surface-100"
          >
            {column.title}
            <span className="ml-1.5 text-xs text-surface-600 font-normal">{column.cards.length}</span>
          </h3>
        )}
        <div className="relative">
          <IconButton icon={<MoreHorizontal size={14} />} size="sm" onClick={() => setShowMenu(!showMenu)} />
          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-40 py-1 min-w-[140px]">
                <button
                  onClick={() => { setEditingTitle(true); setColTitle(column.title); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-surface-300 hover:bg-surface-700"
                >
                  <Edit3 size={12} /> Renomear
                </button>
                <button
                  onClick={() => { deleteColumn(boardId, column.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/10"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 scrollbar-thin min-h-[60px]">
        {column.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            boardId={boardId}
            columnId={column.id}
            board={board}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      <div className="px-2 pb-2">
        {addingCard ? (
          <div className="space-y-2">
            <input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard();
                if (e.key === 'Escape') setAddingCard(false);
              }}
              placeholder="Título do cartão..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newCardTitle.trim()}>Adicionar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCard(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-1.5 px-3 py-2 text-sm text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Adicionar cartão
          </button>
        )}
      </div>
    </div>
  );
};
