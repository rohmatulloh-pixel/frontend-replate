import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { getReports } from '../utils/storage';
import { TRANSLATIONS, getActiveLanguage, setActiveLanguage } from '../utils/i18n';

// Real SVG Flags for cross-platform support (Windows laptops, macOS, iOS, Android)
function FlagID({ className = "w-4 h-3" }) {
  return (
    <svg
      className={`${className} inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-black/15 align-middle`}
      viewBox="0 0 640 480"
      aria-hidden="true"
    >
      <rect width="640" height="240" fill="#E70011" />
      <rect y="240" width="640" height="240" fill="#FFFFFF" />
    </svg>
  );
}

function FlagGB({ className = "w-4 h-3" }) {
  return (
    <svg
      className={`${className} inline-block rounded-[2px] shadow-xs shrink-0 overflow-hidden border border-black/15 align-middle`}
      viewBox="0 0 60 30"
      aria-hidden="true"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export default function Navbar({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState(() => getActiveLanguage());
  const [activeCount, setActiveCount] = useState(() => {
    const reports = getReports();
    return reports.filter(r => r.journeyStatus !== 'RECEIVED').length;
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;

  useEffect(() => {
    const syncActiveCount = () => {
      const reports = getReports();
      const active = reports.filter(r => r.journeyStatus !== 'RECEIVED').length;
      setActiveCount(active);
    };

    const syncLanguage = (e) => {
      setLang(e.detail || getActiveLanguage());
    };

    window.addEventListener('replate:storage-update', syncActiveCount);
    window.addEventListener('replate:language-change', syncLanguage);
    return () => {
      window.removeEventListener('replate:storage-update', syncActiveCount);
      window.removeEventListener('replate:language-change', syncLanguage);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    setActiveLanguage(nextLang);
  };

  // Only 5 Core Pages
  const navLinks = [
    { id: 'home', label: t.nav.home },
    { id: 'report', label: t.nav.report },
    { id: 'journeys', label: t.nav.journeys, badge: activeCount > 0 ? activeCount : null },
    { id: 'impact', label: t.nav.impact },
    { id: 'insights', label: t.nav.insights },
    { id: 'learn', label: t.nav.learn },
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 pt-3 px-3 sm:px-6 transition-all">
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-card border border-white/80 py-2.5 px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🍲</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-brand-900 group-hover:text-brand-600 transition-colors">
                REPLATE
              </span>
              <span className="text-amber-500 text-sm">✨</span>
            </div>
          </div>
        </div>

        {/* Center Pill Nav Links */}
        <nav className="hidden lg:flex items-center space-x-1.5">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`px-4 py-2 rounded-full text-xs font-display font-extrabold transition-all relative ${
                  isActive
                    ? 'bg-teal-50 text-brand-800 border-2 border-brand-400 shadow-sm'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-slate-100/70 border-2 border-transparent'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-sun-500 text-amber-950 font-bold shadow-sm">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Language Switcher Pill [ 🇮🇩 ID | 🇬🇧 EN ] */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full p-1 text-xs font-display font-extrabold transition-all shadow-inner"
            title="Switch Language / Ganti Bahasa"
          >
            <span
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                lang === 'id'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlagID className="w-4 h-3" />
              <span>ID</span>
            </span>
            <span
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                lang === 'en'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlagGB className="w-4 h-3" />
              <span>EN</span>
            </span>
          </button>

          {/* Action CTA Button */}
          <button
            type="button"
            onClick={() => handleNavClick('report')}
            className="px-4 py-2 rounded-full text-xs font-display font-black bg-sun-500 hover:bg-sun-600 text-amber-950 border border-sun-300 transition-all shadow-sun flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer"
            title={t.nav.reportButton}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
            <span>{t.nav.reportButton}</span>
          </button>
        </div>

        {/* Mobile Hamburger & Lang Switcher */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full text-xs font-display font-extrabold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1.5 transition-all"
            title="Switch Language / Ganti Bahasa"
          >
            {lang === 'id' ? (
              <>
                <FlagID className="w-4 h-3" />
                <span>ID</span>
              </>
            ) : (
              <>
                <FlagGB className="w-4 h-3" />
                <span>EN</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 bg-white rounded-3xl shadow-card border border-slate-100 p-4 space-y-2 animate-fadeIn max-w-md mx-auto">
          <div className="grid grid-cols-1 gap-1.5">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-full text-sm font-display font-extrabold flex items-center justify-between ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-sun-500 text-amber-950 font-bold">
                      {link.badge} {t.nav.activeBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                handleNavClick('report');
              }}
              className="w-full py-2.5 rounded-full text-xs font-display font-black bg-sun-500 hover:bg-sun-600 text-amber-950 border-2 border-sun-300 shadow-sun flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ✨ {t.nav.reportButton}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
