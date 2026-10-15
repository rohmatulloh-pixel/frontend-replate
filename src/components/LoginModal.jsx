import React, { useState } from 'react';
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;
  const isId = lang === 'id';

  const handleQuickFill = (roleKey) => {
    const user = DEMO_USERS[roleKey];
    if (user) {
      setIdentifier(user.username);
      setPassword(user.password);
      setSelectedRole(roleKey);
      setError('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-sm sm:max-w-md w-full p-5 sm:p-7 shadow-card relative my-auto space-y-4 max-h-[95vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center text-xl mx-auto shadow-sm shadow-brand-500/20">
            🍲
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-brand-900 tracking-tight">
            {t.auth.loginTitle}
          </h2>
          <p className="text-xs font-sans text-slate-500 max-w-xs mx-auto">
            {t.auth.loginSubtitle}
          </p>
        </div>

        {/* Compact 1-Tap Role Selector */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-display font-black uppercase tracking-wider text-slate-400 text-center">
            {t.auth.quickFillLabel}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'admin', icon: '👑', label: 'Admin' },
              { key: 'supplier', icon: '🏪', label: 'Supplier' },
              { key: 'mitra', icon: '🤝', label: 'Mitra' },
            ].map((p) => {
              const isSelected = selectedRole === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleQuickFill(p.key)}
                  className={`py-2 px-2 rounded-2xl border-2 text-center transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-xs text-brand-950 font-black'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-extrabold'
                  }`}
                >
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-display">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Identifier Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-display font-extrabold uppercase tracking-wider text-slate-700">
              {t.auth.usernameLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-display font-extrabold uppercase tracking-wider text-slate-700">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-1">
            <Button
              type="submit"
              variant="sun"
              size="md"
              className="w-full text-xs font-display font-black py-3 shadow-sun"
            >
              {t.auth.submitBtn}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
