import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { DEMO_USERS, loginUser } from '../utils/storage';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';
import Button from './Button';

export default function LoginModal({ isOpen, onClose, onSuccess, lang = getActiveLanguage() }) {
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;
  const isId = lang === 'id';

  // 1-Tap Instant Login for Prototype Roles (Zero Friction)
  const handleQuickLogin = (roleKey) => {
    const user = DEMO_USERS[roleKey];
    if (user) {
      const result = loginUser(user.username, user.password);
      if (result.success) {
        setError('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.message || 'Login failed');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(isId ? 'Harap masukkan username dan kata sandi.' : 'Please enter username and password.');
      return;
    }

    const result = loginUser(identifier, password);
    if (result.success) {
      setError('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setError(result.message || (isId ? 'Username atau kata sandi tidak sesuai.' : 'Invalid credentials.'));
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

        {/* Header: Compact Inline Brand */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center text-lg mx-auto shadow-sm shadow-brand-500/20">
            🍲
          </div>
          <h2 className="text-lg sm:text-xl font-display font-black text-brand-900 tracking-tight leading-tight">
            {t.auth.loginTitle}
          </h2>
          <p className="text-[11px] font-sans text-slate-500 max-w-xs mx-auto leading-tight">
            {isId ? 'Masuk ke dashboard akun Anda atau pilih akses instan:' : 'Sign in to your dashboard or select instant access:'}
          </p>
        </div>

        {/* 1-Tap Quick Login Buttons (Instant Entry - No Typing & No Scrolling) */}
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
        <form onSubmit={handleSubmit} className="space-y-2.5">
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
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
