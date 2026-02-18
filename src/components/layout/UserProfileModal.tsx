import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Camera, X, AtSign, Upload } from 'lucide-react';
import { useChatStore } from '@/stores';
import { Avatar, Button, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { UserStatus } from '@/types';

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: '#22c55e' },
  { value: 'idle', label: 'Ausente', color: '#f59e0b' },
  { value: 'dnd', label: 'Não Perturbe', color: '#ef4444' },
  { value: 'offline', label: 'Invisível', color: '#6b7280' },
];

export const UserProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateProfile, updateUserStatus } = useChatStore();

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [status, setStatus] = useState<UserStatus>('online');
  const [activeTab, setActiveTab] = useState<'perfil' | 'conta'>('perfil');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo muito grande (máx. 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setter(reader.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync form when modal opens or user changes
  useEffect(() => {
    if (currentUser && isOpen) {
      setDisplayName(currentUser.displayName);
      setAvatarUrl(currentUser.avatar);
      setBannerUrl(currentUser.banner);
      setCustomStatus(currentUser.customStatus);
      setAboutMe(currentUser.aboutMe);
      setStatus(currentUser.status);
    }
  }, [currentUser, isOpen]);

  if (!currentUser) return null;

  const handleSave = () => {
    updateProfile({
      displayName: displayName.trim() || currentUser.displayName,
      avatar: avatarUrl.trim(),
      banner: bannerUrl.trim(),
      customStatus: customStatus.trim(),
      aboutMe: aboutMe.trim(),
    });
    updateUserStatus(status);
    onClose();
  };

  const handleRemoveAvatar = () => setAvatarUrl('');
  const handleRemoveBanner = () => setBannerUrl('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Perfil" size="lg">
      <div className="flex gap-6">
        {/* Left: tabs */}
        <div className="w-36 shrink-0">
          <nav className="space-y-1">
            {(['perfil', 'conta'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                  activeTab === tab
                    ? 'bg-brand-600/15 text-brand-400'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800',
                )}
              >
                {tab === 'perfil' ? 'Perfil' : 'Conta'}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'perfil' ? (
            <div className="space-y-5">
              {/* Preview card */}
              <div className="rounded-xl overflow-hidden border border-surface-700 bg-surface-800">
                {/* Banner */}
                <div
                  className="h-24 relative bg-gradient-to-r from-brand-600 to-purple-600"
                  style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                >
                  {bannerUrl && (
                    <button
                      onClick={handleRemoveBanner}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {/* Avatar overlap */}
                <div className="relative px-4">
                  <div className="absolute -top-8">
                    <div className="relative group">
                      <Avatar
                        name={displayName || currentUser.displayName}
                        src={avatarUrl || undefined}
                        size="lg"
                        status={status}
                      />
                      {avatarUrl && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="pt-10 pb-3">
                    <p className="font-bold text-surface-100">{displayName || currentUser.displayName}</p>
                    <p className="text-xs text-surface-500">@{currentUser.name}</p>
                    {customStatus && (
                      <p className="text-xs text-surface-400 mt-1">{customStatus}</p>
                    )}
                    {aboutMe && (
                      <div className="mt-2 pt-2 border-t border-surface-700">
                        <p className="text-[10px] text-surface-500 uppercase font-semibold mb-1">Sobre mim</p>
                        <p className="text-xs text-surface-300">{aboutMe}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Nome de Exibição</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={currentUser.displayName}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
                  <Camera size={10} className="inline mr-1" />
                  Foto de Perfil
                </label>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setAvatarUrl)} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-full flex items-center gap-2 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-400 hover:border-brand-500 hover:text-surface-200 transition-colors"
                >
                  <Upload size={14} />
                  {avatarUrl ? 'Trocar imagem...' : 'Importar do computador...'}
                </button>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Banner</label>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setBannerUrl)} />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full flex items-center gap-2 bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-400 hover:border-brand-500 hover:text-surface-200 transition-colors"
                >
                  <Upload size={14} />
                  {bannerUrl ? 'Trocar banner...' : 'Importar do computador...'}
                </button>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Status Personalizado</label>
                <input
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="Jogando, trabalhando, estudando..."
                  maxLength={80}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Sobre Mim</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  maxLength={200}
                  className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 resize-none"
                />
                <p className="text-[10px] text-surface-600 mt-1">{aboutMe.length}/200</p>
              </div>

              <div>
                <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                        status === opt.value
                          ? 'border-brand-500 bg-brand-600/10 text-brand-400'
                          : 'border-surface-700 text-surface-400 hover:border-surface-600',
                      )}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conta tab */
            <div className="space-y-5">
              <div className="rounded-lg border border-surface-700 p-4 bg-surface-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <UserIcon size={18} className="text-surface-400" />
                  <h4 className="text-sm font-semibold text-surface-200">Informações da Conta</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-0.5">Usuário</p>
                    <p className="text-sm text-surface-200 flex items-center gap-1">
                      <AtSign size={12} className="text-surface-500" />
                      {currentUser.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-0.5">E-mail</p>
                    <p className="text-sm text-surface-200">{currentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-surface-500 uppercase tracking-wider mb-0.5">Membro desde</p>
                    <p className="text-sm text-surface-200">
                      {currentUser.createdAt > 0
                        ? new Date(currentUser.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Hoje'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-surface-800">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
