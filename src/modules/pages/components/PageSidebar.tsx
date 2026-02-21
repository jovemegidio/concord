import React, { useState } from 'react';
import { Plus, Trash2, Star, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigationStore, usePagesStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Page } from '@/types';

const PageTreeItem: React.FC<{ page: Page; depth: number }> = ({ page, depth }) => {
  const [expanded, setExpanded] = useState(false);
  const { activePageId, setActivePage, activeWorkspaceId } = useNavigationStore();
  const { getChildPages, createPage, deletePage, toggleFavorite, favorites } = usePagesStore();
  const childPages = getChildPages(page.id);
  const hasChildren = childPages.length > 0;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 mx-1 rounded-md text-sm cursor-pointer group transition-colors',
          activePageId === page.id
            ? 'bg-surface-800/70 text-surface-100'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/30',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-surface-500">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-3" />
        )}

        <span onClick={() => setActivePage(page.id)} className="flex-1 flex items-center gap-1.5 truncate">
          <span className="text-sm">{page.icon}</span>
          <span className="truncate">{page.title || 'Sem título'}</span>
        </span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(page.id); }}
            className={cn('text-surface-500 hover:text-amber-400', favorites.includes(page.id) && 'text-amber-400')}
          >
            <Star size={10} fill={favorites.includes(page.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!activeWorkspaceId) return;
              const childId = createPage(activeWorkspaceId, 'Sem título', '📄', page.id);
              setActivePage(childId);
              setExpanded(true);
            }}
            className="text-surface-500 hover:text-surface-200"
          >
            <Plus size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
            className="text-surface-500 hover:text-red-400"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {expanded && childPages.map((child) => (
        <PageTreeItem key={child.id} page={child} depth={depth + 1} />
      ))}
    </>
  );
};

export const PageSidebar: React.FC = () => {
  const { activeWorkspaceId, activePageId, setActivePage } = useNavigationStore();
  const { getRootPages, createPage, favorites, pages } = usePagesStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const rootPages = activeWorkspaceId ? getRootPages(activeWorkspaceId) : [];
  const favoritePages = pages.filter((p) => favorites.includes(p.id));

  const handleCreate = () => {
    if (!newTitle.trim() || !activeWorkspaceId) return;
    const id = createPage(activeWorkspaceId, newTitle.trim());
    setActivePage(id);
    setNewTitle('');
    setShowCreate(false);
  };

  return (
    <div className="w-60 min-w-[240px] bg-surface-900 flex flex-col border-r border-surface-800/50">
      <div className="h-12 min-h-[48px] flex items-center px-4 border-b border-surface-800/50">
        <FileText size={18} className="text-surface-500 mr-2" />
        <h3 className="font-semibold text-surface-200">Notas</h3>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {favoritePages.length > 0 && (
          <>
            <p className="px-3 py-1 text-[10px] text-surface-500 uppercase tracking-wider font-semibold">★ Favoritos</p>
            {favoritePages.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={cn(
                  'flex items-center gap-1.5 w-full px-3 py-1.5 text-sm transition-colors',
                  activePageId === page.id
                    ? 'bg-surface-800/70 text-surface-100'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/30',
                )}
              >
                <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />
                <span className="text-sm mr-1">{page.icon}</span>
                <span className="truncate">{page.title || 'Sem título'}</span>
              </button>
            ))}
            <div className="h-px bg-surface-800 my-2 mx-3" />
          </>
        )}

        <p className="px-3 py-1 text-[10px] text-surface-500 uppercase tracking-wider font-semibold">Notas</p>
        {rootPages.map((page) => (
          <PageTreeItem key={page.id} page={page} depth={0} />
        ))}

        {rootPages.length === 0 && !showCreate && (
          <div className="px-4 py-8 text-center">
            <FileText size={32} className="text-surface-700 mx-auto mb-2" />
            <p className="text-xs text-surface-600">Nenhuma nota ainda</p>
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
              placeholder="Título da nota..."
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
            Nova Nota
          </Button>
        )}
      </div>
    </div>
  );
};
