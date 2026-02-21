import React, { useState, useEffect } from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import { useNavigationStore, useBoardStore } from '@/stores';
import { Button } from '@/components/ui';
import { BoardColumn, BoardSidebar } from './components';
import type { ID } from '@/types';

export const BoardView: React.FC = () => {
  const { activeBoardId, setActiveBoard, activeWorkspaceId } = useNavigationStore();
  const { getBoardById, createColumn, moveCard, getBoardsByWorkspace } = useBoardStore();
  const [newColTitle, setNewColTitle] = useState('');
  const [addingCol, setAddingCol] = useState(false);
  const [dragState, setDragState] = useState<{ cardId: ID; fromColumnId: ID } | null>(null);

  const boards = activeWorkspaceId ? getBoardsByWorkspace(activeWorkspaceId) : [];
  const board = activeBoardId ? getBoardById(activeBoardId) : undefined;

  useEffect(() => {
    if (activeBoardId) {
      if (!board) setActiveBoard(null);
      else if (activeWorkspaceId && board.workspaceId !== activeWorkspaceId) setActiveBoard(null);
    }
  }, [activeBoardId, board, activeWorkspaceId, setActiveBoard]);

  useEffect(() => {
    if (!activeBoardId && boards.length > 0) setActiveBoard(boards[0].id);
  }, [activeBoardId, boards, setActiveBoard]);

  const handleAddColumn = () => {
    if (!newColTitle.trim() || !activeBoardId) return;
    createColumn(activeBoardId, newColTitle.trim());
    setNewColTitle('');
    setAddingCol(false);
  };

  const handleDragStart = (cardId: ID, columnId: ID) => setDragState({ cardId, fromColumnId: columnId });

  const handleDrop = (toColumnId: ID) => {
    if (!dragState || !activeBoardId) return;
    const toCol = board?.columns.find((c) => c.id === toColumnId);
    moveCard(activeBoardId, dragState.fromColumnId, toColumnId, dragState.cardId, toCol?.cards.length ?? 0);
    setDragState(null);
  };

  return (
    <div className="flex flex-1 min-w-0">
      <BoardSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {board ? (
          <>
            <div className="h-12 min-h-[48px] flex items-center px-6 border-b border-surface-800/50">
              <h2 className="font-semibold text-surface-200">{board.title}</h2>
              <span className="ml-3 text-xs text-surface-500">
                {board.columns.length} colunas · {board.columns.reduce((a, c) => a + c.cards.length, 0)} cartões
              </span>
            </div>

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
