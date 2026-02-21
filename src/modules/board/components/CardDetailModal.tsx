import React, { useState, useEffect } from 'react';
import { Trash2, Check, X, CheckSquare, Square } from 'lucide-react';
import { useBoardStore, useChatStore, CONCORD_USERS } from '@/stores';
import { Button, IconButton, Modal, Avatar } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelativeDate } from '@/lib/utils';
import { PRIORITY_CONFIG } from '@/types';
import type { Card, Board, Priority, ID } from '@/types';

export const CardDetailModal: React.FC<{
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
              <Button size="sm" variant="ghost" onClick={() => setCardDueDate(boardId, columnId, card.id, null)}>
                Limpar
              </Button>
            )}
            {card.dueDate && (
              <span className={cn('text-xs', card.dueDate < Date.now() ? 'text-red-400' : 'text-green-400')}>
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
