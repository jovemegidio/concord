import React, { useState } from 'react';
import {
  MessageSquare, LayoutGrid, FileText,
  Palette, Wifi, WifiOff, Plus, LogOut,
} from 'lucide-react';
import { useNavigationStore, useChatStore, useThemeStore, useConnectionStore, CONCORD_USERS } from '@/stores';
import type { ThemeName } from '@/stores';
import { Avatar, Button, Modal } from '@/components/ui';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { AppView } from '@/types';

// ── Navigation Items ────────────────────────────────────────
const NAV_ITEMS: { view: AppView; label: string; icon: React.ReactNode }[] = [
  { view: 'chat', label: 'Chat', icon: <MessageSquare size={22} /> },
  { view: 'boards', label: 'Quadros', icon: <LayoutGrid size={22} /> },
  { view: 'pages', label: 'Páginas', icon: <FileText size={22} /> },
];

// ── Theme names ─────────────────────────────────────────────
const THEME_OPTIONS: { name: ThemeName; label: string; preview: string }[] = [
  { name: 'dark', label: 'Escuro', preview: '#1e1e2e' },
  { name: 'midnight', label: 'Meia-noite', preview: '#0f172a' },
  { name: 'light', label: 'Claro', preview: '#f8fafc' },
  { name: 'forest', label: 'Floresta', preview: '#1a2e1a' },
  { name: 'sunset', label: 'Pôr do Sol', preview: '#2d1b2e' },
];

// ── Workspace Selector Modal ────────────────────────────────
const WorkspaceModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { workspaces, createWorkspace } = useChatStore();
  const { setActiveWorkspace } = useNavigationStore();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('⚡');
  const WORKSPACE_ICONS = ['⚡', '🏠', '💼', '🚀', '🎮', '🎵', '📚', '🔬', '🌍', '🎯'];

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createWorkspace(newName.trim(), newIcon);
    setActiveWorkspace(id);
    setNewName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspaces">
      <div className="space-y-4">
        {/* Existing workspaces */}
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => {
              setActiveWorkspace(ws.id);
              const firstText = ws.channels.find((c) => c.type === 'text' || c.type === 'announcement');
              if (firstText) useNavigationStore.getState().setActiveChannel(firstText.id);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors group"
          >
            <span className="text-2xl">{ws.icon}</span>
            <div className="text-left">
              <p className="text-sm font-medium text-surface-200">{ws.name}</p>
              <p className="text-xs text-surface-500">{ws.channels.length} canais</p>
            </div>
          </button>
        ))}

        <div className="h-px bg-surface-800" />

        {/* Create new */}
        <div>
          <label className="block text-xs text-surface-400 mb-2 uppercase tracking-wider">
            Novo Workspace
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {WORKSPACE_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setNewIcon(icon)}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all',
                  newIcon === icon
                    ? 'bg-brand-600/20 ring-2 ring-brand-500'
                    : 'bg-surface-800 hover:bg-surface-700',
                )}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nome do workspace..."
              className="flex-1 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            />
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ── App Sidebar (Discord-like left rail) ────────────────────
export const AppSidebar: React.FC = () => {
  const { currentView, setView, activeWorkspaceId } = useNavigationStore();
  const { getWorkspaceById, currentUser, workspaces } = useChatStore();
  const { theme, setTheme } = useThemeStore();
  const { connected, onlineUsers } = useConnectionStore();
  const [showThemes, setShowThemes] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);

  const workspace = activeWorkspaceId ? getWorkspaceById(activeWorkspaceId) : undefined;
  const onlineCount = onlineUsers.length;
  const onlineNames = onlineUsers
    .map((id) => CONCORD_USERS.find((u) => u.id === id)?.displayName ?? id)
    .join(', ');

  return (
    <>
      <div className="w-[72px] min-w-[72px] bg-surface-950 flex flex-col items-center py-3 border-r border-surface-800/50">
        {/* Workspace icon */}
        <Tooltip content={workspace?.name ?? 'Workspaces'} position="right">
          <button
            onClick={() => setShowWorkspaces(true)}
            className="w-12 h-12 rounded-2xl bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white font-bold text-lg transition-all duration-200 hover:rounded-xl mb-2 shadow-lg shadow-brand-600/20"
          >
            {workspace?.icon ?? '⚡'}
          </button>
        </Tooltip>

        {/* Other workspaces quick buttons */}
        {workspaces
          .filter((ws) => ws.id !== activeWorkspaceId)
          .slice(0, 3)
          .map((ws) => (
            <Tooltip key={ws.id} content={ws.name} position="right">
              <button
                onClick={() => {
                  useNavigationStore.getState().setActiveWorkspace(ws.id);
                  const firstText = ws.channels.find((c) => c.type === 'text' || c.type === 'announcement');
                  if (firstText) useNavigationStore.getState().setActiveChannel(firstText.id);
                }}
                className="w-10 h-10 rounded-2xl bg-surface-800 hover:bg-surface-700 flex items-center justify-center text-sm transition-all duration-200 hover:rounded-xl mb-1"
              >
                {ws.icon}
              </button>
            </Tooltip>
          ))}

        <div className="w-8 h-0.5 bg-surface-800 rounded-full my-2" />

        {/* Module navigation */}
        <nav className="flex flex-col items-center gap-2 flex-1">
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.view} content={item.label} position="right">
              <button
                onClick={() => setView(item.view)}
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 relative',
                  'hover:rounded-xl',
                  currentView === item.view
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200',
                )}
              >
                {item.icon}
                {currentView === item.view && (
                  <span className="absolute left-0 w-1 h-8 bg-white rounded-r-full" />
                )}
              </button>
            </Tooltip>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          {/* Theme toggle */}
          <div className="relative">
            <Tooltip content="Tema" position="right">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
              >
                <Palette size={18} />
              </button>
            </Tooltip>

            {showThemes && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemes(false)} />
                <div className="absolute left-full bottom-0 ml-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 py-2 px-1 min-w-[140px]">
                  <p className="px-2 pb-1.5 text-[10px] text-surface-500 uppercase tracking-wider">Tema</p>
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => { setTheme(t.name); setShowThemes(false); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                        theme === t.name
                          ? 'bg-brand-600/15 text-brand-400'
                          : 'text-surface-300 hover:bg-surface-700',
                      )}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-surface-600"
                        style={{ backgroundColor: t.preview }}
                      />
                      {t.label}
                      {theme === t.name && <span className="ml-auto text-brand-400">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Tooltip content={connected ? `Online: ${onlineNames || 'ninguém'}` : 'Desconectado do servidor'} position="right">
            <button className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative',
              connected
                ? 'text-green-500 hover:bg-green-600/10'
                : 'text-red-400 hover:bg-red-600/10',
            )}>
              {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
              {connected && onlineCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-600 text-[9px] text-white font-bold rounded-full flex items-center justify-center">
                  {onlineCount}
                </span>
              )}
            </button>
          </Tooltip>

          <div className="w-8 h-0.5 bg-surface-800 rounded-full my-1" />

          {/* User avatar */}
          {currentUser && (
            <Tooltip content={currentUser.displayName} position="right">
              <button className="relative">
                <Avatar
                  name={currentUser.displayName}
                  src={currentUser.avatar || undefined}
                  status={currentUser.status}
                  size="sm"
                />
              </button>
            </Tooltip>
          )}

          {/* Logout */}
          <Tooltip content="Sair" position="right">
            <button
              onClick={() => useChatStore.getState().logout()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </Tooltip>
        </div>
      </div>

      <WorkspaceModal isOpen={showWorkspaces} onClose={() => setShowWorkspaces(false)} />
    </>
  );
};
