import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Edit3, X, Check, MoreHorizontal,
  CheckSquare, Square, Calendar, MessageSquare,
  LayoutGrid, Columns,
} from 'lucide-react';
import { useNavigationStore, useBoardStore, useChatStore, CONCORD_USERS } from '@/stores';
import { Button, IconButton, Modal, Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelativeDate } from '@/lib/utils';
import type { Card, Column, Board, Priority, Label, ID } from '@/types';
import { PRIORITY_CONFIG } from '@/types';

// ── PRIORITY BADGE ──────────────────────────────────────────
const PriorityBadge: React.FC<{ priority: Priority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  if (priority === 'none') return null;
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
      )}
      style={{ backgroundColor: `${config.color}18`, color: config.color }}
    >
      {config.icon} {config.label}
    </span>
  );
};

// ── LABEL BADGE ─────────────────────────────────────────────
const LabelBadge: React.FC<{ label: Label }> = ({ label }) => (
  <span
    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
    style={{ backgroundColor: label.color }}
  >
    {label.name}
  </span>
);

// ── CHECKLIST PROGRESS ──────────────────────────────────────
const ChecklistProgress: React.FC<{ items: { isCompleted: boolean }[] }> = ({ items }) => {
  if (items.length === 0) return null;
  const done = items.filter((i) => i.isCompleted).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-surface-400">
      <CheckSquare size={10} />
      <div className="w-12 h-1 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{done}/{items.length}</span>
    </div>
  );
};

// ── CARD DETAIL MODAL ───────────────────────────────────────
const CardDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  boardId: ID;
  columnId: ID;
  board: Board;
}> = ({ isOpen, onClose, card, boardId, columnId, board }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const { currentUser, getUserById } = useChatStore();

  // Sync local state when a different card opens
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description);
    setEditingTitle(false);
  }, [card.id, card.title, card.description]);
  const {
    updateCard, setCardDescription, setCardPriority, toggleCardLabel,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    addComment, deleteComment, deleteCard,
    setCardAssignees, setCardDueDate,
  } = useBoardStore();

  const toggleAssignee = (userId: ID) => {
    const current = card.assignees ?? [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    setCardAssignees(boardId, columnId, card.id, next);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardDueDate(boardId, columnId, card.id, val ? new Date(val).getTime() : null);
  };

  const handleTitleSave = () => {
    if (title.trim()) updateCard(boardId, columnId, card.id, { title: title.trim() });
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    setCardDescription(boardId, columnId, card.id, description);
  };

  const handleAddCheckItem = () => {
    if (!newCheckItem.trim()) return;
    addChecklistItem(boardId, columnId, card.id, newCheckItem.trim());
    setNewCheckItem('');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    addComment(boardId, columnId, card.id, newComment.trim(), currentUser.id);
    setNewComment('');
  };

  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low', 'none'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Title */}
        <div>
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="flex-1 text-xl font-bold bg-surface-900 border border-surface-600 rounded px-2 py-1 text-surface-200 focus:outline-none focus:border-brand-500"
                autoFocus
              />
              <IconButton icon={<Check size={16} />} onClick={handleTitleSave} />
            </div>
          ) : (
            <h2
              onClick={() => { setEditingTitle(true); setTitle(card.title); }}
              className="text-xl font-bold text-surface-100 cursor-pointer hover:text-brand-400 transition-colors"
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Etiquetas</h4>
          <div className="flex flex-wrap gap-1.5">
            {board.labels.map((label) => {
              const isActive = card.labels.some((l) => l.id === label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleCardLabel(boardId, columnId, card.id, label)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-medium transition-all border',
                    isActive
                      ? 'text-white border-transparent'
                      : 'text-surface-400 border-surface-700 hover:border-surface-600',
                  )}
                  style={isActive ? { backgroundColor: label.color } : undefined}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Prioridade</h4>
          <div className="flex gap-1.5">
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => setCardPriority(boardId, columnId, card.id, p)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                  card.priority === p
                    ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                    : 'border-surface-700 text-surface-400 hover:border-surface-600',
                )}
              >
                {PRIORITY_CONFIG[p].icon} {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignees */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Responsáveis</h4>
          <div className="flex flex-wrap gap-2">
            {CONCORD_USERS.map((u) => {
              const assigned = (card.assignees ?? []).includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleAssignee(u.id)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                    assigned
                      ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                      : 'border-surface-700 text-surface-400 hover:border-surface-600',
                  )}
                >
                  <Avatar name={u.displayName} src={u.avatar || undefined} size="xs" />
                  {u.displayName}
                  {assigned && <Check size={12} className="ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Data de Entrega</h4>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''}
              onChange={handleDueDateChange}
              className="bg-surface-900 border border-surface-700 rounded-lg px-3 py-1.5 text-sm text-surface-200 focus:outline-none focus:border-brand-500 [color-scheme:dark]"
            />
            {card.dueDate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCardDueDate(boardId, columnId, card.id, null)}
              >
                Limpar
              </Button>
            )}
            {card.dueDate && (
              <span className={cn(
                'text-xs',
                card.dueDate < Date.now() ? 'text-red-400' : 'text-green-400',
              )}>
                {card.dueDate < Date.now() ? 'Atrasado' : 'No prazo'}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Descrição</h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescSave}
            placeholder="Adicione uma descrição detalhada..."
            rows={3}
            className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {/* Checklist */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">
            Lista de Tarefas {card.checklist.length > 0 && `(${card.checklist.filter((i) => i.isCompleted).length}/${card.checklist.length})`}
          </h4>
          <div className="space-y-1 mb-2">
            {card.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <button
                  onClick={() => toggleChecklistItem(boardId, columnId, card.id, item.id)}
                  className="text-surface-400 hover:text-brand-400"
                >
                  {item.isCompleted ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} />}
                </button>
                <span className={cn('text-sm flex-1', item.isCompleted && 'line-through text-surface-600')}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteChecklistItem(boardId, columnId, card.id, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCheckItem()}
              placeholder="Adicionar item..."
              className="flex-1 bg-surface-900 border border-surface-700 rounded px-2 py-1.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            />
            <Button size="sm" onClick={handleAddCheckItem} disabled={!newCheckItem.trim()}>Adicionar</Button>
          </div>
        </div>

        {/* Comments */}
        <div>
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">
            Comentários ({card.comments.length})
          </h4>
          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
            {card.comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar name={getUserById(comment.authorId)?.displayName ?? comment.authorId} size="xs" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-surface-300">{getUserById(comment.authorId)?.displayName ?? comment.authorId}</span>
                    <span className="text-[10px] text-surface-600">{formatRelativeDate(comment.createdAt)}</span>
                    <button
                      onClick={() => deleteComment(boardId, columnId, card.id, comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400 text-[10px] ml-auto"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <p className="text-sm text-surface-300">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Escreva um comentário..."
              className="flex-1 bg-surface-900 border border-surface-700 rounded px-2 py-1.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>Enviar</Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t border-surface-800 pt-4">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => { deleteCard(boardId, columnId, card.id); onClose(); }}
          >
            Excluir Cartão
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  );
};

// ── CARD ITEM ───────────────────────────────────────────────
const CardItem: React.FC<{
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
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((l) => (
              <LabelBadge key={l.id} label={l} />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-sm text-surface-200 font-medium mb-2 leading-snug">{card.title}</p>

        {/* Meta row */}
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

          {/* Assignee avatars */}
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

// ── BOARD COLUMN ────────────────────────────────────────────
const BoardColumn: React.FC<{
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
      {/* Column header */}
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
          <IconButton
            icon={<MoreHorizontal size={14} />}
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
          />
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

      {/* Cards */}
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

      {/* Add card */}
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

// ── BOARD SELECTOR / SIDEBAR ────────────────────────────────
const BoardSidebar: React.FC = () => {
  const { activeWorkspaceId, activeBoardId, setActiveBoard } = useNavigationStore();
  const { getBoardsByWorkspace, createBoard, deleteBoard } = useBoardStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const boards = activeWorkspaceId ? getBoardsByWorkspace(activeWorkspaceId) : [];

  const handleCreate = () => {
    if (!newTitle.trim() || !activeWorkspaceId) return;
    const id = createBoard(activeWorkspaceId, newTitle.trim());
    setActiveBoard(id);
    setNewTitle('');
    setShowCreate(false);
  };

  return (
    <div className="w-60 min-w-[240px] bg-surface-900 flex flex-col border-r border-surface-800/50">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-surface-800/50">
        <LayoutGrid size={18} className="text-surface-500 mr-2" />
        <h3 className="font-semibold text-surface-200">Quadros</h3>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => setActiveBoard(board.id)}
            className={cn(
              'flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors group',
              activeBoardId === board.id
                ? 'bg-surface-800/70 text-surface-100 border-l-2 border-brand-500'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/30',
            )}
          >
            <Columns size={14} className="shrink-0 opacity-50" />
            <span className="truncate">{board.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }}
              className="ml-auto opacity-0 group-hover:opacity-100 text-surface-500 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </button>
        ))}

        {boards.length === 0 && !showCreate && (
          <div className="px-4 py-8 text-center">
            <LayoutGrid size={32} className="text-surface-700 mx-auto mb-2" />
            <p className="text-xs text-surface-600">Nenhum quadro ainda</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-surface-800/50">
        {showCreate ? (
          <div className="space-y-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              placeholder="Título do quadro..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} className="flex-1">Criar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)} icon={<Plus size={14} />} className="w-full">
            Novo Quadro
          </Button>
        )}
      </div>
    </div>
  );
};

// ── BOARD VIEW (MAIN EXPORT) ────────────────────────────────
export const BoardView: React.FC = () => {
  const { activeBoardId, setActiveBoard } = useNavigationStore();
  const { getBoardById, createColumn, moveCard } = useBoardStore();
  const [newColTitle, setNewColTitle] = useState('');
  const [addingCol, setAddingCol] = useState(false);
  const [dragState, setDragState] = useState<{ cardId: ID; fromColumnId: ID } | null>(null);

  const board = activeBoardId ? getBoardById(activeBoardId) : undefined;

  // Clear stale active board reference
  useEffect(() => {
    if (activeBoardId && !board) setActiveBoard(null);
  }, [activeBoardId, board, setActiveBoard]);

  const handleAddColumn = () => {
    if (!newColTitle.trim() || !activeBoardId) return;
    createColumn(activeBoardId, newColTitle.trim());
    setNewColTitle('');
    setAddingCol(false);
  };

  const handleDragStart = (cardId: ID, columnId: ID) => {
    setDragState({ cardId, fromColumnId: columnId });
  };

  const handleDrop = (toColumnId: ID) => {
    if (!dragState || !activeBoardId) return;
    const { cardId, fromColumnId } = dragState;
    const toCol = board?.columns.find((c) => c.id === toColumnId);
    moveCard(activeBoardId, fromColumnId, toColumnId, cardId, toCol?.cards.length ?? 0);
    setDragState(null);
  };

  return (
    <div className="flex flex-1 min-w-0">
      <BoardSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {board ? (
          <>
            {/* Header */}
            <div className="h-12 min-h-[48px] flex items-center px-6 border-b border-surface-800/50">
              <h2 className="font-semibold text-surface-200">{board.title}</h2>
              <span className="ml-3 text-xs text-surface-500">{board.columns.length} colunas · {board.columns.reduce((a, c) => a + c.cards.length, 0)} cartões</span>
            </div>

            {/* Columns */}
            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex gap-4 items-start min-h-full">
                {board.columns.map((col) => (
                  <BoardColumn
                    key={col.id}
                    column={col}
                    boardId={board.id}
                    board={board}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
                ))}

                {/* Add column */}
                <div className="w-72 min-w-[288px]">
                  {addingCol ? (
                    <div className="bg-surface-900/50 rounded-xl border border-surface-800/50 p-3 space-y-2">
                      <input
                        value={newColTitle}
                        onChange={(e) => setNewColTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddColumn();
                          if (e.key === 'Escape') setAddingCol(false);
                        }}
                        placeholder="Título da coluna..."
                        className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddColumn}>Adicionar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingCol(false)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingCol(true)}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-surface-700 text-sm text-surface-500 hover:text-surface-300 hover:border-surface-600 transition-colors"
                    >
                      <Plus size={16} />
                      Adicionar coluna
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <LayoutGrid size={32} className="text-surface-500" />
              </div>
              <h3 className="text-xl font-bold text-surface-200 mb-2">Selecione um Quadro</h3>
              <p className="text-sm text-surface-500">Escolha um quadro na barra lateral ou crie um novo para começar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
