import React, { useState, useEffect } from 'react';
import { useNavigationStore, useChatStore, syncManager } from '@/stores';
import { CONCORD_USERS, CONCORD_PASSWORD } from '@/stores/chat.store';
import { AppSidebar } from './AppSidebar';
import { ChatView } from '@/modules/chat';
import { BoardView } from '@/modules/board';
import { PagesView } from '@/modules/pages';
import { Button, Avatar } from '@/components/ui';
import { Zap, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const VIEW_MAP = {
  chat: ChatView,
  boards: BoardView,
  pages: PagesView,
} as const;

// ── Login Screen ────────────────────────────────────────────
const LoginScreen: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { loginAs } = useChatStore();

  const handleLogin = () => {
    if (!selectedUser) {
      setError('Selecione um usuário');
      return;
    }
    if (password !== CONCORD_PASSWORD) {
      setError('Senha incorreta');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setError('');
    loginAs(selectedUser);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface-950">
      <div className="w-full max-w-lg mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-100 mb-1">Concord</h1>
          <p className="text-surface-500 text-sm">Chat · Quadros · Páginas — Tudo em um</p>
        </div>

        <div className={cn2(
          'bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl transition-transform',
          shake && 'animate-shake',
        )}>
          <h2 className="text-lg font-semibold text-surface-200 mb-5 text-center">Entrar na sua conta</h2>

          {/* User selection */}
          <label className="block text-xs text-surface-400 mb-2.5 uppercase tracking-wider">Quem é você?</label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {CONCORD_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => { setSelectedUser(user.id); setError(''); }}
                className={cn2(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200',
                  selectedUser === user.id
                    ? 'border-brand-500 bg-brand-600/10 shadow-lg shadow-brand-500/10'
                    : 'border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-800',
                )}
              >
                <Avatar name={user.displayName} size="sm" />
                <div className="text-left">
                  <p className={cn2(
                    'text-sm font-semibold',
                    selectedUser === user.id ? 'text-brand-300' : 'text-surface-200',
                  )}>
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-surface-500">@{user.name}</p>
                </div>
                {selectedUser === user.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-brand-500" />
                )}
              </button>
            ))}
          </div>

          {/* Password */}
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <Lock size={10} className="inline mr-1 mb-0.5" />
            Senha
          </label>
          <div className="relative mb-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Digite a senha..."
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs mb-3">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedUser || !password}
            className="w-full mt-3"
            size="lg"
          >
            Entrar
          </Button>
        </div>

        <p className="text-center text-[11px] text-surface-600 mt-6">
          Dados sincronizados em tempo real via WebSocket.
          <br />
          Acesse de qualquer computador com o mesmo link.
        </p>
      </div>
    </div>
  );
};

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
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30">
            <Zap size={32} className="text-white" />
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
  const ActiveView = VIEW_MAP[currentView];

  // Not logged in → login screen
  const isValidUser = currentUser && CONCORD_USERS.some((u) => u.id === currentUser.id);

  // Identify user with server for presence tracking
  useEffect(() => {
    if (isValidUser && currentUser) {
      syncManager.identify(currentUser.id, currentUser.displayName);
    }
  }, [isValidUser, currentUser]);

  // Auto-select a workspace if current one was deleted
  useEffect(() => {
    if (!isValidUser || workspaces.length === 0) return;

    const currentWs = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
    if (!currentWs) {
      // Active workspace was deleted or never set — pick the first available
      const fallback = workspaces[0];
      setActiveWorkspace(fallback.id);
      const firstText = fallback.channels.find((c) => c.type === 'text' || c.type === 'announcement');
      if (firstText) setActiveChannel(firstText.id);
    }
  }, [isValidUser, activeWorkspaceId, workspaces, getWorkspaceById, setActiveWorkspace, setActiveChannel]);

  if (!isValidUser) {
    return <LoginScreen />;
  }

  // Logged in but no workspaces → workspace setup
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
