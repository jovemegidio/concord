import React, { useState } from 'react';
import { Plus, Trash2, LayoutGrid, Columns } from 'lucide-react';
import { useNavigationStore, useBoardStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

export const BoardSidebar: React.FC = () => {
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
