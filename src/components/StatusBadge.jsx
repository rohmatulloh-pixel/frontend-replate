import React from 'react';
import { getActiveLanguage } from '../utils/i18n';

export function PriorityBadge({ priority, className = '', lang = getActiveLanguage() }) {
  if (priority === 'HIGH PRIORITY') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide uppercase bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-sm ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {lang === 'id' ? 'Prioritas Tinggi' : 'High Priority'}
      </span>
    );
  }
  if (priority === 'MEDIUM PRIORITY') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide uppercase bg-amber-100 text-amber-950 border border-amber-300 shadow-sm ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        ⚡ {lang === 'id' ? 'Prioritas Sedang' : 'Medium Priority'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide uppercase bg-slate-100 text-slate-800 border border-slate-300 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      🌱 {lang === 'id' ? 'Prioritas Rendah' : 'Low Priority'}
    </span>
  );
}

export function RouteBadge({ route, className = '', lang = getActiveLanguage() }) {
  if (route === 'REDISTRIBUTE') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide bg-brand-100 text-brand-950 border border-brand-300 shadow-sm ${className}`}>
        🍱 {lang === 'id' ? 'Distribusi Langsung' : 'Direct Redistribution'}
      </span>
    );
  }
  if (route === 'PROCESS') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide bg-amber-100 text-amber-950 border border-amber-300 shadow-sm ${className}`}>
        🍳 {lang === 'id' ? 'Pengolahan Ulang' : 'Secondary Processing'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black font-display tracking-wide bg-lime-100 text-lime-950 border border-lime-300 shadow-sm ${className}`}>
      🌱 {lang === 'id' ? 'Daur Ulang Organik' : 'Organic Recovery'}
    </span>
  );
}

export function JourneyBadge({ status, className = '', lang = getActiveLanguage() }) {
  if (status === 'RECEIVED') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black font-display bg-emerald-100 text-emerald-950 border border-emerald-300 ${className}`}>
        ✅ {lang === 'id' ? 'Diterima & Terselamatkan' : 'Rescued & Received'}
      </span>
    );
  }
  if (status === 'RESCUE_INITIATED') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black font-display bg-sky-100 text-sky-950 border border-sky-300 ${className}`}>
        🚚 {lang === 'id' ? 'Sedang Diantar' : 'In Transit'}
      </span>
    );
  }
  if (status === 'MATCHED') {
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black font-display bg-purple-100 text-purple-950 border border-purple-300 ${className}`}>
        🎯 {lang === 'id' ? 'Mitra Terhubung' : 'Partner Matched'}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black font-display bg-slate-100 text-slate-800 border border-slate-300 ${className}`}>
      📝 {(status || 'PENDING').replace('_', ' ')}
    </span>
  );
}
