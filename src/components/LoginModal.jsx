import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Building,
  Mail,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { DEMO_USERS, loginUser, loginUserAsync, registerUser } from '../utils/storage';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';
import Button from './Button';

export default function LoginModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialRole = 'supplier',
  initialMode = 'login',
  promptMessage = '',
  lang = getActiveLanguage() 
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState(initialMode || 'login'); // 'login' | 'register'
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regRole, setRegRole] = useState(initialRole || 'supplier'); // 'supplier' | 'mitra'
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock background scroll when modal is open and synchronize incoming role/mode/prompt
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError('');
      if (initialMode) setMode(initialMode);
      if (initialRole) setRegRole(initialRole);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen || !mounted) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;
  const isId = lang === 'id';

  // 1-Tap Instant Login for Prototype Roles (Zero Friction)
  const handleQuickLogin = async (roleKey) => {
    const user = DEMO_USERS[roleKey];
    if (user) {
      const result = await loginUserAsync(user.username, user.password);
      if (result.success) {
        setError('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.message || 'Login failed');
      }
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(isId ? 'Harap masukkan username dan kata sandi.' : 'Please enter username and password.');
      return;
    }

    const result = await loginUserAsync(identifier, password);
    if (result.success) {
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.message || (isId ? 'Username atau kata sandi tidak sesuai.' : 'Invalid credentials.'));
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError(isId ? 'Harap masukkan nama lengkap Anda.' : 'Please enter your full name.');
      return;
    }
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setError(isId ? 'Username minimal 3 karakter.' : 'Username must be at least 3 characters.');
      return;
    }
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setError(isId ? 'Kata sandi minimal 4 karakter.' : 'Password must be at least 4 characters.');
      return;
    }

    const result = registerUser({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      name: regName,
      organization: regOrg,
      role: regRole
    });

    if (result.success) {
      setError('');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.message || (isId ? 'Pendaftaran gagal.' : 'Registration failed.'));
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-3.5 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header: Compact Brand */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center text-lg mx-auto shadow-sm shadow-brand-500/20">
            🍲
          </div>
          <h2 className="text-lg sm:text-xl font-display font-black text-brand-900 tracking-tight leading-tight">
            {mode === 'login' ? (isId ? 'Masuk ke REPLATE' : 'Sign in to REPLATE') : (isId ? 'Daftar Akun Baru' : 'Create New Account')}
          </h2>
          <p className="text-[11px] font-sans text-slate-500 max-w-xs mx-auto leading-tight">
            {mode === 'login'
              ? (isId ? 'Masuk ke dashboard akun Anda atau pilih akses instan:' : 'Sign in to your dashboard or select instant access:')
              : (isId ? 'Buat akun katering atau mitra penerima baru untuk mulai beroperasi:' : 'Create a catering or recipient partner account to get started:')}
          </p>
        </div>

        {/* Contextual Authentication Prompt */}
        {promptMessage && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs font-sans flex items-start gap-2 shadow-2xs">
            <span className="text-base shrink-0">🔒</span>
            <span className="font-semibold leading-relaxed">{promptMessage}</span>
          </div>
        )}

        {/* Mode Tab Switcher: Masuk vs Daftar Akun */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-1.5 rounded-xl text-xs font-display font-black transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white text-brand-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isId ? 'Masuk' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-1.5 rounded-xl text-xs font-display font-black transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white text-brand-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isId ? 'Daftar Akun' : 'Register'}</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODE: LOGIN */}
        {/* ======================================================== */}
        {mode === 'login' && (
          <div className="space-y-3">
            {/* 1-Tap Quick Login Buttons */}
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'admin', icon: '👑', label: 'Admin', color: 'hover:border-purple-300 hover:bg-purple-50/60 text-purple-900' },
                  { key: 'supplier', icon: '🏪', label: 'Supplier', color: 'hover:border-amber-300 hover:bg-amber-50/60 text-amber-900' },
                  { key: 'mitra', icon: '🤝', label: 'Mitra', color: 'hover:border-emerald-300 hover:bg-emerald-50/60 text-emerald-900' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handleQuickLogin(p.key)}
                    className={`py-1.5 px-2 rounded-xl border border-slate-200 bg-slate-50/90 text-center transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs group ${p.color}`}
                    title={`Login sebagai ${p.label}`}
                  >
                    <span className="text-sm group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="text-xs font-display font-black">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-0.5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-400">
                {isId ? 'atau masuk manual' : 'or manual login'}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-2.5">
              {/* Identifier Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                  {t.auth.usernameLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    placeholder={t.auth.usernamePlaceholder}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder={t.auth.passwordPlaceholder}
                    className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-sans font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-0.5">
                <Button
                  type="submit"
                  variant="sun"
                  size="sm"
                  className="w-full text-xs font-display font-black py-2.5 shadow-sun"
                >
                  {t.auth.submitBtn}
                </Button>
              </div>

              {/* Bottom Switcher to Register */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-500">
                  {isId ? 'Belum memiliki akun?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="font-display font-black text-brand-700 hover:underline inline-block"
                  >
                    {isId ? 'Daftar Akun Sekarang →' : 'Register Now →'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE: REGISTER */}
        {/* ======================================================== */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-2.5 animate-fadeIn">
            {/* Role Selector */}
            <div className="space-y-1">
              <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                {isId ? 'Pilih Peran Entitas Anda:' : 'Select Your Entity Role:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('supplier')}
                  className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                    regRole === 'supplier'
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/40 text-amber-950 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <span className="text-sm">🏪 {isId ? 'Penyedia Surplus' : 'Surplus Supplier'}</span>
                  <span className="text-[9px] font-sans font-normal text-slate-500">
                    {isId ? 'Katering, Restoran, Hotel' : 'Catering, Restaurant, Hotel'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('mitra')}
                  className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                    regRole === 'mitra'
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-300/40 text-emerald-950 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <span className="text-sm">🤝 {isId ? 'Mitra Penerima' : 'Food Recipient'}</span>
                  <span className="text-[9px] font-sans font-normal text-slate-500">
                    {isId ? 'Dapur Umum, Panti, Posko' : 'Community Kitchen, Shelter'}
                  </span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                {isId ? 'Nama Lengkap / Kontak' : 'Full Name / Contact Person'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    setError('');
                  }}
                  placeholder={isId ? 'Contoh: Siti Rahma' : 'e.g. Siti Rahma'}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                {isId ? 'Nama Usaha / Lembaga / Posko' : 'Organization / Brand / Kitchen'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={regOrg}
                  onChange={(e) => setRegOrg(e.target.value)}
                  placeholder={isId ? 'Contoh: Berkah Catering / Posko Peduli' : 'e.g. Berkah Catering / Relief Posko'}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Username & Email in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                  {isId ? 'Username' : 'Username'} *
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => {
                    setRegUsername(e.target.value);
                    setError('');
                  }}
                  placeholder={isId ? 'huruf/angka' : 'alphanumeric'}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                  {isId ? 'Email' : 'Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3 h-3" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-7 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-700">
                {isId ? 'Kata Sandi Baru' : 'New Password'} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setError('');
                  }}
                  placeholder={isId ? 'Minimal 4 karakter' : 'Min 4 characters'}
                  className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-sans font-semibold flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit CTA */}
            <div className="pt-1">
              <Button
                type="submit"
                variant="sun"
                size="sm"
                className="w-full text-xs font-display font-black py-2.5 shadow-sun"
              >
                {isId ? 'Daftar & Masuk Sekarang' : 'Register & Enter Dashboard'}
              </Button>
            </div>

            {/* Bottom Switcher to Login */}
            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-500">
                {isId ? 'Sudah memiliki akun?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-display font-black text-brand-700 hover:underline inline-block"
                >
                  {isId ? 'Masuk ke Akun →' : 'Sign in here →'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
