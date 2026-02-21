import React, { useState, useEffect } from 'react';
import { useNavigationStore, useChatStore, useConnectionStore, syncManager, useAuthStore } from '@/stores';
import { CONCORD_USERS, ZYNTRA_WORKSPACE_ID } from '@/stores/chat.store';
import { AppSidebar } from './AppSidebar';
import { AuthScreen } from './AuthScreen';
import { ChatView } from '@/modules/chat';
import { BoardView } from '@/modules/board';
import { PagesView } from '@/modules/pages';
import { Button } from '@/components/ui';

const VIEW_MAP = {
  chat: ChatView,
  boards: BoardView,
  pages: PagesView,
} as const;

// ── Workspace Setup (after first login) ─────────────────────
const WorkspaceSetup: React.FC = () => {
  const [wsName, setWsName] = useState('');
  const [wsIcon, setWsIcon] = useState('⚡');
  const { createWorkspace, createChannel } = useChatStore();
  const { setActiveWorkspace, setActiveChannel } = useNavigationStore();

  const WORKSPACE_ICONS = ['⚡', '🏠', '💼', '🚀', '🎮', '🎵', '📚', '🔬', '🌍', '🎯', '💎', '🦊'];

  const handleFinish = () => {
    const workspaceName = wsName.trim() || 'Meu Workspace';
    const wsId = createWorkspace(workspaceName, wsIcon);
    const generalId = createChannel(wsId, 'general', 'text', 'Discussão geral');
    createChannel(wsId, 'random', 'text', 'Bate-papo');
    createChannel(wsId, 'Bate-papo de Voz', 'voice', 'Canal de voz');
    setActiveWorkspace(wsId);
    setActiveChannel(generalId);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface-950">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30 ring-1 ring-brand-500/20 overflow-hidden">
            <img src="/concord-logo.png" alt="Concord" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Crie seu workspace</h1>
          <p className="text-surface-500 text-sm">Um espaço para sua equipe colaborar</p>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Ícone</label>
              <div className="flex gap-2 flex-wrap">
                {WORKSPACE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setWsIcon(icon)}
                    className={cn2(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                      wsIcon === icon
                        ? 'bg-brand-600/20 ring-2 ring-brand-500 scale-110'
                        : 'bg-surface-800 hover:bg-surface-700',
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nome do Workspace</label>
              <input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFinish()}
                placeholder="Minha Equipe"
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                autoFocus
              />
            </div>
          </div>

          <Button onClick={handleFinish} className="w-full mt-6" size="lg">
            Começar
          </Button>
        </div>
      </div>
    </div>
  );
};

// Simple cn2 helper for inline use (avoids extra import in this file)
function cn2(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const AppLayout: React.FC = () => {
  const { currentView, activeWorkspaceId, setActiveWorkspace, setActiveChannel } = useNavigationStore();
  const { currentUser, workspaces, getWorkspaceById } = useChatStore();
  const { initialSyncDone } = useConnectionStore();
  const { isAuthenticated, mode } = useAuthStore();
  const ActiveView = VIEW_MAP[currentView];

  // Dual-mode auth check:
  // - API mode: check auth store isAuthenticated
  // - Legacy mode: check chat store currentUser against CONCORD_USERS
  const isLegacyValid = currentUser && CONCORD_USERS.some((u) => u.id === currentUser.id);
  const isLoggedIn = (mode === 'api' && isAuthenticated) || (mode === 'legacy' && isLegacyValid);

  // Identify user with server for presence tracking (legacy mode)
  useEffect(() => {
    if (mode === 'legacy' && isLegacyValid && currentUser) {
      syncManager.identify(currentUser.id, currentUser.displayName);
    }
  }, [mode, isLegacyValid, currentUser]);

  // Ensure Zyntra workspace always exists when legacy user is valid
  useEffect(() => {
    if (mode !== 'legacy' || !isLegacyValid) return;
    const hasZyntra = useChatStore.getState().workspaces.find((w) => w.id === ZYNTRA_WORKSPACE_ID);
    if (!hasZyntra) {
      useChatStore.getState().ensureZyntra();
    }
  }, [mode, isLegacyValid, initialSyncDone]);

  // Timeout: if server doesn't respond within 3s, proceed with local state
  useEffect(() => {
    if (initialSyncDone) return;
    const timeout = setTimeout(() => {
      if (!useConnectionStore.getState().initialSyncDone) {
        useConnectionStore.getState()._setInitialSyncDone(true);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [initialSyncDone]);

  // Auto-select a workspace if current one was deleted (legacy mode)
  useEffect(() => {
    if (!isLoggedIn || workspaces.length === 0) return;

    const currentWs = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
    if (!currentWs) {
      const fallback = workspaces.find((w) => w.id === ZYNTRA_WORKSPACE_ID) || workspaces[0];
      setActiveWorkspace(fallback.id);
      const firstText = fallback.channels.find((c) => c.type === 'text' || c.type === 'announcement');
      if (firstText) setActiveChannel(firstText.id);
    }
  }, [isLoggedIn, activeWorkspaceId, workspaces, getWorkspaceById, setActiveWorkspace, setActiveChannel]);

  // Not logged in → auth screen (enterprise + legacy selection)
  if (!isLoggedIn) {
    return <AuthScreen />;
  }

  // Wait for initial sync from server before deciding if workspaces are really empty
  if (workspaces.length === 0 && !initialSyncDone) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-brand-500/20 overflow-hidden">
            <img src="/concord-logo.png" alt="Concord" className="w-14 h-14 object-contain" />
          </div>
          <p className="text-surface-400 text-sm animate-pulse">Conectando ao servidor...</p>
          <p className="text-surface-600 text-xs mt-2">Aguarde ou continue sem conexão</p>
        </div>
      </div>
    );
  }

  // Logged in but no workspaces even after sync → workspace setup
  if (workspaces.length === 0) {
    return <WorkspaceSetup />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex min-w-0">
        <ActiveView />
      </main>
    </div>
  );
};
