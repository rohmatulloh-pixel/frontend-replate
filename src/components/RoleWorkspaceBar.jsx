import React from 'react';
import { getCurrentUser, loginUser, logoutUser, DEMO_USERS } from '../utils/storage';

export default function RoleWorkspaceBar({ currentUser, onNavigate, lang = 'id' }) {
  if (!currentUser) return null;

  const isId = lang === 'id';

  const handleQuickSwitch = (roleKey) => {
    const targetUser = DEMO_USERS[roleKey];
    if (targetUser) {
      loginUser(targetUser.username, targetUser.password);
      if (onNavigate) {
        onNavigate('home');
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-2xs py-2 px-3 sm:px-6 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Active Role Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-black bg-brand-500 text-white shadow-2xs">
            <span>{currentUser.avatar}</span>
            <span>
              {currentUser.role === 'supplier'
                ? (isId ? 'PORTAL SUPPLIER' : 'SUPPLIER PORTAL')
                : currentUser.role === 'mitra'
                ? (isId ? 'PORTAL MITRA' : 'RECIPIENT PORTAL')
                : (isId ? 'CONTROL ROOM ADMIN' : 'ADMIN CONTROL ROOM')}
            </span>
          </span>

          <div className="flex items-center gap-1.5 text-xs font-display">
            <span className="font-extrabold text-slate-900">{currentUser.name}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-sans font-medium text-[11px] hidden md:inline">
              {currentUser.organization}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isId ? 'Sesi Aktif' : 'Active Session'}</span>
          </span>
        </div>

        {/* Right: Quick Switcher Between All 3 Roles */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
          <span className="text-[11px] font-display font-extrabold text-slate-400 mr-1 hidden lg:inline">
            {isId ? 'Ganti Portal Cepat:' : 'Quick Switch:'}
          </span>

          {Object.keys(DEMO_USERS).map((roleKey) => {
            const u = DEMO_USERS[roleKey];
            const isCurrent = currentUser.role === u.role;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => handleQuickSwitch(roleKey)}
                disabled={isCurrent}
                className={`px-2.5 py-1 rounded-xl text-xs font-display font-bold transition-all flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-brand-50 text-brand-900 border border-brand-300 shadow-2xs font-black cursor-default'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 active:scale-95'
                }`}
                title={`Beralih ke ${u.name}`}
              >
                <span>{u.avatar}</span>
                <span className="capitalize">{u.role}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="px-2.5 py-1 rounded-xl text-xs font-display font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors ml-1"
            title="Keluar dari sesi ini"
          >
            ✕ {isId ? 'Keluar' : 'Exit'}
          </button>
        </div>

      </div>
    </div>
  );
}
