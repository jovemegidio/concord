import React, { useState, useEffect } from 'react';
import { Shield, Crown, Users, Trash2, Image } from 'lucide-react';
import { useChatStore, CONCORD_USERS } from '@/stores';
import { Avatar, Button, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { ID } from '@/types';

const WORKSPACE_ICONS = [
  '⚡', '🏠', '💼', '🚀', '🎮', '🎵', '📚', '🔬', '🌍', '🎯',
  '💎', '🦊', '🐉', '🌸', '🔥', '⭐', '🎨', '🧠', '🛠️', '💡',
];

export const WorkspaceSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  workspaceId: ID;
}> = ({ isOpen, onClose, workspaceId }) => {
  const { getWorkspaceById, updateWorkspace, deleteWorkspace, currentUser } = useChatStore();
  const workspace = getWorkspaceById(workspaceId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'membros'>('geral');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (workspace && isOpen) {
      setName(workspace.name);
      setIcon(workspace.icon);
      setDescription(workspace.description ?? '');
      setBannerUrl(workspace.banner ?? '');
      setActiveTab('geral');
      setConfirmDelete(false);
    }
  }, [workspace, isOpen]);

  if (!workspace || !currentUser) return null;

  const isOwner = workspace.ownerId === currentUser.id;
  const roleLabel = (role: string) => {
    if (role === 'owner') return 'Dono';
    if (role === 'admin') return 'Admin';
    return 'Membro';
  };

  const handleSave = () => {
    updateWorkspace(workspaceId, {
      name: name.trim() || workspace.name,
      icon,
      description: description.trim(),
      banner: bannerUrl.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    deleteWorkspace(workspaceId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Servidor" size="lg">
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-36 shrink-0">
          <nav className="space-y-1">
            {([
              { key: 'geral' as const, label: 'Geral' },
              { key: 'membros' as const, label: 'Membros' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === key
                    ? 'bg-brand-600/15 text-brand-400'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'geral' ? (
            <div className="space-y-5">
              {/* Banner preview */}
              <div className="rounded-xl overflow-hidden border border-surface-700">
                <div
                  className="h-28 relative bg-gradient-to-r from-brand-600/30 to-purple-600/30"
                  style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  <div className="absolute bottom-3 left-4 flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div>
                      <p className="font-bold text-surface-100 text-lg drop-shadow">{name || workspace.name}</p>
                      {description && (
                        <p className="text-xs text-surface-300 drop-shadow">{description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Ícone do Servidor</label>
                <div className="flex gap-2 flex-wrap">
                  {WORKSPACE_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                        icon === emoji
                          ? 'bg-brand-600/20 ring-2 ring-brand-500 scale-110'
                          : 'bg-surface-800 hover:bg-surface-700',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nome do Servidor</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={workspace.name}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu servidor..."
                  rows={2}
                  maxLength={200}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Banner URL */}
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
                  <Image size={10} className="inline mr-1" />
                  URL do Banner
                </label>
                <input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Danger zone */}
              {isOwner && (
                <div className="rounded-lg border border-red-600/30 p-4 bg-red-600/5">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Zona de Perigo</h4>
                  {!confirmDelete ? (
                    <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14} />}>
                      Excluir Servidor
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-red-400">Tem certeza? Isso não pode ser desfeito.</p>
                      <Button variant="danger" size="sm" onClick={handleDelete}>Confirmar</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Members tab */
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-surface-400" />
                <h4 className="text-sm font-semibold text-surface-200">
                  Membros ({workspace.members.length})
                </h4>
              </div>

              {/* All predefined users shown as members */}
              {CONCORD_USERS.map((user) => {
                const member = workspace.members.find((m) => m.userId === user.id);
                const role = member?.role ?? 'member';
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors"
                  >
                    <Avatar
                      name={user.displayName}
                      src={user.avatar || undefined}
                      size="sm"
                      status={user.id === currentUser.id ? currentUser.status : 'offline'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">{user.displayName}</p>
                      <p className="text-[10px] text-surface-500">@{user.name}</p>
                    </div>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium',
                      role === 'owner'
                        ? 'bg-amber-600/20 text-amber-400'
                        : role === 'admin'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-surface-700 text-surface-400',
                    )}>
                      {role === 'owner' && <Crown size={8} className="inline mr-0.5 mb-0.5" />}
                      {role === 'admin' && <Shield size={8} className="inline mr-0.5 mb-0.5" />}
                      {roleLabel(role)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save / Cancel */}
          {activeTab === 'geral' && (
            <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-surface-800">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
