import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 sm:p-8 shadow-card relative my-8 space-y-5 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center text-2xl mx-auto shadow-md shadow-brand-500/20">
            🍲
          </div>
          <h2 className="text-2xl font-display font-black text-brand-900 tracking-tight">
            {t.auth.loginTitle}
          </h2>
          <p className="text-xs font-sans text-slate-500 leading-relaxed max-w-xs mx-auto">
            {t.auth.loginSubtitle}
          </p>
        </div>

        {/* Quick Fill Preset Cards */}
        <div className="space-y-2 pt-1">
          <span className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-500 text-center">
            {t.auth.quickFillLabel}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'admin', icon: '👑', label: 'Admin', sub: 'Simulasi ✨' },
              { key: 'supplier', icon: '🏪', label: 'Supplier', sub: 'Katering 🍲' },
              { key: 'mitra', icon: '🤝', label: 'Mitra', sub: 'Penerima 🚚' },
            ].map((p) => {
              const isSelected = selectedRole === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleQuickFill(p.key)}
                  className={`p-2.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className={`text-xs font-display leading-tight ${isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'}`}>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans leading-none">
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Identifier Input */}
          <div className="space-y-1">
            <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-700">
              {t.auth.usernameLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                placeholder={t.auth.usernamePlaceholder}
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-700">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={t.auth.passwordPlaceholder}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-sans font-semibold focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="sun"
              size="lg"
              className="w-full text-xs font-display font-black py-3.5 shadow-sun"
            >
              {t.auth.submitBtn}
            </Button>
          </div>
        </form>

        {/* Credentials Cheat Sheet Helper */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] font-sans text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-display font-bold text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>{isId ? 'Kredensial Akun Prototipe:' : 'Prototype Account Credentials:'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px] font-mono">
            <div><strong>admin</strong> / admin123</div>
            <div><strong>supplier</strong> / supplier123</div>
            <div><strong>mitra</strong> / mitra123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
