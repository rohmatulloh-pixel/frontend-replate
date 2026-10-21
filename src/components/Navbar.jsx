import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, LogOut, RefreshCw, User as UserIcon } from 'lucide-react';
import { getReports, isDemoMode, clearDemoData, getCurrentUser, logoutUser, getActiveSOSBroadcasts, getEmergencyRequests } from '../utils/storage';
import { TRANSLATIONS, getActiveLanguage, setActiveLanguage } from '../utils/i18n';
import LoginModal from './LoginModal';

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
  const [demoActive, setDemoActive] = useState(() => isDemoMode());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalConfig, setLoginModalConfig] = useState({ role: 'supplier', mode: 'login', prompt: '' });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const [activeCount, setActiveCount] = useState(() => {
    const reports = getReports();
    return reports.filter(r => r.journeyStatus !== 'RECEIVED').length;
  });

  const [hasActiveSOS, setHasActiveSOS] = useState(() => {
    try {
      const activeBroadcasts = getActiveSOSBroadcasts();
      const openRequests = getEmergencyRequests().filter(r => r.status === 'OPEN');
      return activeBroadcasts.length > 0 || openRequests.length > 0;
    } catch {
      return false;
    }
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;

  useEffect(() => {
    const syncActiveCount = () => {
      const reports = getReports();
      const active = reports.filter(r => r.journeyStatus !== 'RECEIVED').length;
      setActiveCount(active);
      setDemoActive(isDemoMode());
      setCurrentUser(getCurrentUser());
      try {
        const activeBroadcasts = getActiveSOSBroadcasts();
        const openRequests = getEmergencyRequests().filter(r => r.status === 'OPEN');
        setHasActiveSOS(activeBroadcasts.length > 0 || openRequests.length > 0);
      } catch {
        setHasActiveSOS(false);
      }
    };

    const syncLanguage = (e) => {
      setLang(e.detail || getActiveLanguage());
    };

    const syncAuth = (e) => {
      setCurrentUser(e.detail !== undefined ? e.detail : getCurrentUser());
      setProfileDropdownOpen(false);
    };

    const handleOpenLogin = (e) => {
      const detail = e.detail || {};
      setLoginModalConfig({
        role: detail.role || 'supplier',
        mode: detail.mode || 'login',
        prompt: detail.prompt || ''
      });
      setLoginModalOpen(true);
    };

    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener('replate:storage-update', syncActiveCount);
    window.addEventListener('replate:language-change', syncLanguage);
    window.addEventListener('replate:auth-change', syncAuth);
    window.addEventListener('replate:open-login', handleOpenLogin);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('replate:storage-update', syncActiveCount);
      window.removeEventListener('replate:language-change', syncLanguage);
      window.removeEventListener('replate:auth-change', syncAuth);
      window.removeEventListener('replate:open-login', handleOpenLogin);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    setActiveLanguage(nextLang);
  };


  const handleClearDemo = () => {
    clearDemoData();
    setDemoActive(false);
  };

  // Dynamic Navigation Links based on active User Role
  const isId = lang === 'id';
  const navLinks = (() => {
    if (currentUser?.role === 'supplier') {
      return [
        { id: 'home', label: isId ? 'Beranda Dapur' : 'Kitchen Hub' },
        { id: 'sos', label: 'SOS', isSOS: true, hasDot: hasActiveSOS },
        { id: 'report', label: isId ? 'Lapor Surplus' : 'Log Surplus' },
        { id: 'journeys', label: isId ? 'Penyaluran Makanan' : 'Outbound Dispatch', badge: activeCount > 0 ? activeCount : null },
        { id: 'impact', label: isId ? 'Dampak Katering' : 'Kitchen Impact' },
        { id: 'learn', label: isId ? 'SOP Sanitasi' : 'Kitchen SOP' },
      ];
    }
    if (currentUser?.role === 'mitra') {
      return [
        { id: 'home', label: isId ? 'Beranda Mitra' : 'Receiver Hub' },
        { id: 'emergency', label: isId ? 'Distribusi Darurat' : 'Emergency Requests', isSOS: true, hasDot: hasActiveSOS },
        { id: 'journeys', label: isId ? 'Pasokan Masuk' : 'Inbound Intake', badge: activeCount > 0 ? activeCount : null },
        { id: 'impact', label: isId ? 'Dampak Bantuan' : 'Distribution Impact' },
        { id: 'learn', label: isId ? 'Standar Kelayakan' : 'Intake Standards' },
      ];
    }
    if (currentUser?.role === 'admin') {
      return [
        { id: 'home', label: isId ? 'Control Room' : 'Control Room' },
        { id: 'sos', label: 'SOS', isSOS: true, hasDot: hasActiveSOS },
        { id: 'journeys', label: isId ? 'Monitoring Logistik' : 'Fleet Monitor', badge: activeCount > 0 ? activeCount : null },
        { id: 'report', label: isId ? 'Lapor Surplus' : 'Report Surplus' },
        { id: 'impact', label: isId ? 'Analitik Kinerja' : 'City Impact' },
        { id: 'insights', label: isId ? 'Pusat Simulasi' : 'Simulator' },
        { id: 'learn', label: isId ? 'Metodologi' : 'Methodology' },
      ];
    }
    return [
      { id: 'home', label: t.nav.home },
      { id: 'sos', label: 'SOS', isSOS: true, hasDot: hasActiveSOS },
      { id: 'report', label: t.nav.report },
      { id: 'journeys', label: t.nav.journeys, badge: activeCount > 0 ? activeCount : null },
      { id: 'impact', label: t.nav.impact },
      { id: 'insights', label: t.nav.insights },
      { id: 'learn', label: t.nav.learn },
    ];
  })();

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 pt-3 px-3 sm:px-6 transition-all">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-card border border-white/80 py-2 px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="h-9 px-2 py-1 rounded-2xl bg-teal-50/90 border border-teal-200/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
            <img
              src="/replate-logo.png"
              alt="REPLATE"
              className="h-6 w-auto object-contain"
            />
          </div>

          <div>
            <span className="text-lg sm:text-xl font-display font-black tracking-tight text-brand-900 group-hover:text-brand-600 transition-colors">
              REPLATE
            </span>
          </div>
        </div>

        {/* Center Pill Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink min-w-0">
          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-xs font-display font-extrabold whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'bg-teal-50 text-brand-800 border-2 border-brand-400 shadow-xs'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-slate-100/70 border-2 border-transparent'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{link.label}</span>
                  {link.hasDot && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </span>
                {link.badge && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-sun-500 text-amber-950 font-bold shadow-xs">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons - Strictly lg:flex to avoid overlapping on tablets/laptop split view */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 shrink-0">
          {demoActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-display font-extrabold bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>{lang === 'id' ? 'Simulasi' : 'Demo'}</span>
              <button
                type="button"
                onClick={handleClearDemo}
                className="ml-1 text-rose-600 hover:text-rose-800 font-bold transition-colors"
                title={lang === 'id' ? 'Bersihkan data demo' : 'Clear demo data'}
              >
                ✕
              </button>
            </div>
          )}

          {/* Language Switcher Pill [ 🇮🇩 ID | 🇬🇧 EN ] */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full p-0.5 xl:p-1 text-xs font-display font-extrabold transition-all shadow-inner shrink-0"
            title="Switch Language / Ganti Bahasa"
          >
            <span
              className={`px-2 xl:px-2.5 py-0.5 xl:py-1 rounded-full transition-all flex items-center gap-1 ${
                lang === 'id'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlagID className="w-3.5 h-2.5 xl:w-4 xl:h-3" />
              <span>ID</span>
            </span>
            <span
              className={`px-2 xl:px-2.5 py-0.5 xl:py-1 rounded-full transition-all flex items-center gap-1 ${
                lang === 'en'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlagGB className="w-3.5 h-2.5 xl:w-4 xl:h-3" />
              <span>EN</span>
            </span>
          </button>

          {/* Auth Button / Profile Dropdown (Desktop) */}
          {!currentUser ? (
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="px-4 py-1.5 rounded-full text-xs font-display font-black bg-sun-400 hover:bg-sun-500 text-amber-950 border border-sun-300 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{t.auth?.loginBtn || (isId ? 'Masuk' : 'Sign In')}</span>
            </button>
          ) : (
            <div className="relative shrink-0" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-display font-extrabold bg-teal-50 hover:bg-teal-100/80 text-brand-950 border-2 border-brand-400/80 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span className="text-sm">{currentUser.avatar}</span>
                <span className="max-w-[85px] xl:max-w-[115px] truncate">{currentUser.name}</span>
                <span className="text-[10px] bg-brand-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                  {currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-card border border-slate-100 p-3 z-50 animate-fadeIn space-y-2">
                  <div className="pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentUser.avatar}</span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-display font-black text-brand-900 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 font-sans truncate">{currentUser.organization}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-display font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {currentUser.role === 'admin'
                          ? (isId ? 'Admin Operasional' : 'Operations Admin')
                          : currentUser.role === 'supplier'
                            ? (isId ? 'Penyedia Surplus' : 'Surplus Provider')
                            : currentUser.role === 'mitra'
                              ? (isId ? 'Mitra Penerima' : 'Recipient Partner')
                              : (currentUser.badgeText || (isId ? 'Pengguna' : 'User'))}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        @{currentUser.username}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-display font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-900 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.auth?.switchRoleBtn || (isId ? 'Ganti Peran' : 'Switch Role')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logoutUser();
                      handleNavClick('home');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-display font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t.auth?.logoutBtn || (isId ? 'Keluar' : 'Log Out')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger, Lang Switcher & User Avatar (< lg) */}
        <div className="flex items-center gap-1.5 lg:hidden">
          {/* Mobile User Pill */}
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setMobileMenuOpen(true);
              } else {
                setLoginModalOpen(true);
              }
            }}
            className={`px-2 py-1 rounded-full text-xs font-display font-extrabold border transition-all flex items-center gap-1 ${
              currentUser
                ? 'bg-teal-50 border-brand-400 text-brand-900 shadow-xs'
                : 'bg-sun-400 hover:bg-sun-500 text-amber-950 border-sun-300 shadow-xs'
            }`}
            title={currentUser ? currentUser.name : (t.auth?.loginBtn || 'Masuk')}
          >
            <span>{currentUser ? currentUser.avatar : '👤'}</span>
            <span className="text-[10px] font-black">{currentUser ? currentUser.role.toUpperCase() : (t.auth?.loginBtn || 'Masuk')}</span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2 py-1 rounded-full text-xs font-display font-extrabold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all"
            title="Switch Language / Ganti Bahasa"
          >
            {lang === 'id' ? (
              <>
                <FlagID className="w-3.5 h-2.5" />
                <span>ID</span>
              </>
            ) : (
              <>
                <FlagGB className="w-3.5 h-2.5" />
                <span>EN</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 bg-white rounded-3xl shadow-card border border-slate-100 p-4 space-y-3 animate-fadeIn max-w-md mx-auto">
          {/* Mobile Auth Header in Drawer */}
          {!currentUser ? (
            <div className="pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-display font-black bg-sun-400 hover:bg-sun-500 text-amber-950 border-2 border-sun-300 shadow-sun flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>👤</span>
                <span>{isId ? 'Masuk / Daftar Akun' : 'Sign In / Register'}</span>
              </button>
            </div>
          ) : (
            <div className="pb-2 border-b border-slate-100 space-y-2">
              <div className="bg-gradient-to-r from-teal-50 to-sky-50 rounded-2xl p-3 border border-brand-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentUser.avatar}</span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-display font-black text-brand-900 leading-tight">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 font-sans">{currentUser.organization}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-display font-black uppercase px-2 py-0.5 rounded-full bg-brand-500 text-white">
                    {currentUser.role === 'admin'
                      ? (isId ? 'Admin Operasional' : 'Operations Admin')
                      : currentUser.role === 'supplier'
                        ? (isId ? 'Penyedia Surplus' : 'Surplus Provider')
                        : currentUser.role === 'mitra'
                          ? (isId ? 'Mitra Penerima' : 'Recipient Partner')
                          : (currentUser.badgeText || (isId ? 'Pengguna' : 'User'))}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-brand-100/80 text-[11px] font-display font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-center hover:bg-slate-50 flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>{t.auth?.switchRoleBtn || (isId ? 'Ganti Peran' : 'Switch Role')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutUser();
                      handleNavClick('home');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-center hover:bg-rose-100 flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <LogOut className="w-3 h-3 text-rose-500" />
                    <span>{t.auth?.logoutBtn || (isId ? 'Keluar' : 'Log Out')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {navLinks.map((link) => {
              const isActive = activePage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-2xl text-xs font-display font-extrabold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-teal-50 text-brand-800 border-2 border-brand-400 shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{link.label}</span>
                    {link.hasDot && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </span>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-sun-500 text-amber-950 font-bold">
                      {link.badge} {t.nav.activeBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setLoginModalConfig({ role: 'supplier', mode: 'login', prompt: '' });
        }}
        onSuccess={() => {
          setLoginModalOpen(false);
          setLoginModalConfig({ role: 'supplier', mode: 'login', prompt: '' });
          handleNavClick('home');
        }}
        initialRole={loginModalConfig.role}
        initialMode={loginModalConfig.mode}
        promptMessage={loginModalConfig.prompt}
        lang={lang}
      />
    </header>
  );
}
