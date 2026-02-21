import React, { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useNavigationStore, usePagesStore } from '@/stores';
import { PageSidebar, PageEditor } from './components';

export const PagesView: React.FC = () => {
  const { activePageId, setActivePage, activeWorkspaceId } = useNavigationStore();
  const { getPageById } = usePagesStore();

  const rootPages = activeWorkspaceId
    ? usePagesStore.getState().getRootPages(activeWorkspaceId)
    : [];
  const page = activePageId ? getPageById(activePageId) : undefined;

  // Clear stale active page reference or page from wrong workspace
  useEffect(() => {
    if (activePageId) {
      if (!page || (activeWorkspaceId && page.workspaceId !== activeWorkspaceId)) {
        setActivePage(null);
      }
    }
  }, [activePageId, page, activeWorkspaceId, setActivePage]);

  // Auto-select first page if none is active and pages exist
  useEffect(() => {
    if (!activePageId && rootPages.length > 0) {
      setActivePage(rootPages[0].id);
    }
  }, [activePageId, rootPages, setActivePage]);

  return (
    <div className="flex flex-1 min-w-0">
      <PageSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-surface-900">
        {page ? (
          <PageEditor page={page} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-surface-500" />
              </div>
              <h3 className="text-xl font-bold text-surface-200 mb-2">Selecione uma Nota</h3>
              <p className="text-sm text-surface-500">
                Escolha uma nota na barra lateral ou crie uma nova para começar a escrever.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
