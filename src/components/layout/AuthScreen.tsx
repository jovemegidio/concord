import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Avatar } from '@/components/ui';
import { Lock, Eye, EyeOff, AlertCircle, Mail, User, ArrowLeft, Sparkles } from 'lucide-react';
import { useChatStore, CONCORD_USERS, CONCORD_PASSWORD } from '@/stores';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type AuthMode = 'select' | 'login' | 'register' | 'legacy';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('select');

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface-950">
      <div className="w-full max-w-lg mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600/10 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/30 ring-1 ring-brand-500/20 overflow-hidden">
            <img src="/concord-logo.png" alt="Concord" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-surface-100 mb-1">Concord</h1>
          <p className="text-surface-500 text-sm">Chat · Kanban · Notas — Tudo em um</p>
        </div>

        {mode === 'select' && <ModeSelect onSelect={setMode} />}
        {mode === 'login' && <LoginForm onBack={() => setMode('select')} />}
        {mode === 'register' && <RegisterForm onBack={() => setMode('select')} />}
        {mode === 'legacy' && <LegacyLogin onBack={() => setMode('select')} />}
      </div>
    </div>
  );
};

// ── Mode Selection ──────────────────────────────────────────
const ModeSelect: React.FC<{ onSelect: (mode: AuthMode) => void }> = ({ onSelect }) => (
  <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl">
    <h2 className="text-lg font-semibold text-surface-200 mb-5 text-center">
      Bem-vindo ao Concord
    </h2>

    <div className="space-y-3">
      <button
        onClick={() => onSelect('login')}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-surface-700 bg-surface-800/50 hover:border-brand-500 hover:bg-brand-600/5 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-brand-600/10 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
          <Mail size={18} className="text-brand-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-surface-200">Entrar com Email</p>
          <p className="text-[11px] text-surface-500">Login com sua conta enterprise</p>
        </div>
      </button>

      <button
        onClick={() => onSelect('register')}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-surface-700 bg-surface-800/50 hover:border-green-500 hover:bg-green-600/5 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center group-hover:bg-green-600/20 transition-colors">
          <Sparkles size={18} className="text-green-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-surface-200">Criar Conta</p>
          <p className="text-[11px] text-surface-500">Registre-se e crie seu workspace</p>
        </div>
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-surface-900 text-surface-500">ou</span>
        </div>
      </div>

      <button
        onClick={() => onSelect('legacy')}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-800 transition-all group"
      >
        <div className="w-10 h-10 rounded-lg bg-surface-700/50 flex items-center justify-center group-hover:bg-surface-700 transition-colors">
          <User size={18} className="text-surface-400" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-surface-200">Modo Local</p>
          <p className="text-[11px] text-surface-500">Entrar com usuário local (sem backend)</p>
        </div>
      </button>
    </div>
  </div>
);

// ── Enterprise Login Form ───────────────────────────────────
const LoginForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const { login, isLoading, error, setError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    try {
      await login(email, password);
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={cn(
      'bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl transition-transform',
      shake && 'animate-shake',
    )}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-surface-500 hover:text-surface-300 text-xs mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <h2 className="text-lg font-semibold text-surface-200 mb-5 text-center">
        Entrar na sua conta
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <Mail size={10} className="inline mr-1 mb-0.5" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="seu@email.com"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <Lock size={10} className="inline mr-1 mb-0.5" />
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Sua senha"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs mt-3">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <Button
        onClick={handleLogin}
        disabled={!email || !password || isLoading}
        className="w-full mt-5"
        size="lg"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
    </div>
  );
};

// ── Register Form ───────────────────────────────────────────
const RegisterForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const { register, isLoading, error, setError } = useAuthStore();

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    if (password.length < 8) {
      setError('Senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    try {
      await register(email, password, displayName);
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={cn(
      'bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl transition-transform',
      shake && 'animate-shake',
    )}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-surface-500 hover:text-surface-300 text-xs mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <h2 className="text-lg font-semibold text-surface-200 mb-5 text-center">
        Criar sua conta
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <User size={10} className="inline mr-1 mb-0.5" />
            Nome
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError(null); }}
            placeholder="Seu nome"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <Mail size={10} className="inline mr-1 mb-0.5" />
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="seu@email.com"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            <Lock size={10} className="inline mr-1 mb-0.5" />
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1.5 uppercase tracking-wider">
            Confirmar Senha
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            placeholder="Repita a senha"
            className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs mt-3">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <Button
        onClick={handleRegister}
        disabled={!displayName || !email || !password || isLoading}
        className="w-full mt-5"
        size="lg"
      >
        {isLoading ? 'Criando...' : 'Criar Conta'}
      </Button>
    </div>
  );
};

// ── Legacy Login (backward compatibility) ───────────────────
const LegacyLogin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { loginAs } = useChatStore();
  const { setLegacyMode } = useAuthStore();

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
    setLegacyMode();
    loginAs(selectedUser);
  };

  return (
    <div className={cn(
      'bg-surface-900 border border-surface-800 rounded-xl p-6 shadow-xl transition-transform',
      shake && 'animate-shake',
    )}>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-surface-500 hover:text-surface-300 text-xs mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>

      <h2 className="text-lg font-semibold text-surface-200 mb-5 text-center">
        Modo Local
      </h2>

      <p className="text-xs text-surface-500 text-center mb-4">
        Dados sincronizados via WebSocket relay. Sem backend enterprise.
      </p>

      {/* User selection */}
      <label className="block text-xs text-surface-400 mb-2.5 uppercase tracking-wider">Quem é você?</label>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {CONCORD_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => { setSelectedUser(user.id); setError(''); }}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200',
              selectedUser === user.id
                ? 'border-brand-500 bg-brand-600/10 shadow-lg shadow-brand-500/10'
                : 'border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-800',
            )}
          >
            <Avatar name={user.displayName} size="sm" />
            <div className="text-left">
              <p className={cn(
                'text-sm font-semibold',
                selectedUser === user.id ? 'text-brand-300' : 'text-surface-200',
              )}>
                {user.displayName}
              </p>
              <p className="text-[10px] text-surface-500">@{user.name}</p>
            </div>
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
  );
};
