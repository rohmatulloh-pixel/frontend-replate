/**
 * REPLATE Text & Value Formatters
 */

export function formatDate(isoString, lang = 'id') {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export function formatWeight(kg) {
  const num = Number(kg) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

export function getPriorityTheme(priority) {
  switch (priority) {
    case 'HIGH PRIORITY':
      return {
        bg: 'bg-forest-50',
        text: 'text-forest-900',
        border: 'border-forest-700/20',
        dot: 'bg-forest-600'
      };
    case 'MEDIUM PRIORITY':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-600/20',
        dot: 'bg-amber-600'
      };
    case 'LOW PRIORITY':
    default:
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-300',
        dot: 'bg-stone-500'
      };
  }
}

export function getRouteTheme(route) {
  switch (route) {
    case 'REDISTRIBUTE':
      return {
        label: 'Direct Redistribution',
        bg: 'bg-forest-900',
        text: 'text-ivory-50',
        tagBg: 'bg-forest-50',
        tagText: 'text-forest-900',
        border: 'border-forest-800'
      };
    case 'PROCESS':
      return {
        label: 'Culinary Processing',
        bg: 'bg-sage-600',
        text: 'text-white',
        tagBg: 'bg-sage-50',
        tagText: 'text-sage-800',
        border: 'border-sage-500'
      };
    case 'ORGANIC':
    default:
      return {
        label: 'Organic Recovery',
        bg: 'bg-[#8C6843]',
        text: 'text-white',
        tagBg: 'bg-amber-50',
        tagText: 'text-[#8C6843]',
        border: 'border-[#8C6843]'
      };
  }
}

export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  const num = Math.round(Number(amount));
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function formatDuration(hours, lang = 'id') {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return lang === 'id' ? 'Belum ada data' : 'No data available';
  }
  const h = Number(hours);
  if (h <= 0) {
    return lang === 'id' ? '< 1 menit' : '< 1 min';
  }
  if (h < 1) {
    const mins = Math.max(1, Math.round(h * 60));
    return `${mins} ${lang === 'id' ? 'menit' : 'mins'}`;
  }
  const roundedHours = Math.round(h * 10) / 10;
  return `${roundedHours.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')} ${lang === 'id' ? 'jam' : 'hours'}`;
}

export function formatNumber(val, decimals = 1, lang = 'id') {
  if (val === null || val === undefined || isNaN(val)) return '0';
  const num = Number(val);
  return num.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function getJourneyStatusMeta(status, lang = 'id') {
  const isId = lang === 'id';
  switch (status) {
    case 'REPORTED':
      return { 
        label: isId ? 'Surplus Tercatat' : 'Surplus Reported', 
        step: 1, 
        color: 'text-slate-800 bg-slate-100 border-slate-300' 
      };
    case 'ASSESSED':
      return { 
        label: isId ? 'Selesai Dinilai' : 'Assessed & Scored', 
        step: 2, 
        color: 'text-sky-800 bg-sky-100 border-sky-300' 
      };
    case 'ROUTE_SELECTED':
      return { 
        label: isId ? 'Rute Disetujui' : 'Route Confirmed', 
        step: 3, 
        color: 'text-teal-800 bg-teal-100 border-teal-300' 
      };
    case 'MATCHED':
      return { 
        label: isId ? 'Mitra Dicocokkan' : 'Destination Matched', 
        step: 4, 
        color: 'text-indigo-800 bg-indigo-100 border-indigo-300' 
      };
    case 'RESCUE_INITIATED':
      return { 
        label: isId ? 'Dalam Pengantaran' : 'In Transit', 
        step: 5, 
        color: 'text-amber-800 bg-amber-100 border-amber-300' 
      };
    case 'RECEIVED':
      return { 
        label: isId ? 'Berhasil Diterima' : 'Rescued & Received', 
        step: 6, 
        color: 'text-emerald-900 bg-emerald-100 border-emerald-300 font-bold' 
      };
    case 'CANCELLED':
      return { 
        label: isId ? 'Dibatalkan' : 'Cancelled', 
        step: 0, 
        color: 'text-rose-900 bg-rose-100 border-rose-300 font-semibold' 
      };
    case 'EXPIRED':
      return { 
        label: isId ? 'Jatuh Tempo' : 'Expired Window', 
        step: 0, 
        color: 'text-stone-700 bg-stone-200 border-stone-300' 
      };
    default:
      return { 
        label: status, 
        step: 1, 
        color: 'text-slate-700 bg-slate-100 border-slate-200' 
      };
  }
}

