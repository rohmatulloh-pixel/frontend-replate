import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  BarChart3, 
  ArrowRight, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import Button from '../Button';
import { getReports, loadDemoData, clearDemoData, isDemoMode } from '../../utils/storage';
import { calculateRescuePerformance, getFoodDisplayName } from '../../utils/calculations';
import { formatNumber, formatRupiah, formatDate } from '../../utils/formatters';

export default function AdminDashboard({ onNavigate, lang = 'id', currentUser }) {
  const isId = lang === 'id';
  const [reports, setReports] = useState(() => getReports());
  const [demoActive, setDemoActive] = useState(() => isDemoMode());

  const refreshState = () => {
    setReports(getReports());
    setDemoActive(isDemoMode());
  };

  useEffect(() => {
    window.addEventListener('replate:storage-update', refreshState);
    return () => window.removeEventListener('replate:storage-update', refreshState);
  }, []);

  const perf = calculateRescuePerformance(reports, lang);
  const { kpis, statusOverview, economics, environmentalSecondary } = perf;

  const handleLoadDemo = () => {
    loadDemoData();
    refreshState();
  };

  const handleClearDemo = () => {
    if (window.confirm(isId ? 'Bersihkan data simulasi/demo?' : 'Clear demo simulation data?')) {
      clearDemoData();
      refreshState();
    }
  };

  const activeReports = reports.filter(r => r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* 1. Admin Control Room Header */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-card border border-brand-800 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-7xl opacity-10 select-none pointer-events-none">👑</div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-display font-extrabold text-teal-300">
            <span>👑</span>
            <span>{isId ? 'REPLATE OPERATIONS CONTROL ROOM • PUSAT KENDALI KOTA' : 'OPERATIONS CONTROL ROOM • CITY HUB'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-tight">
            {isId ? 'Pusat Kendali Penyelamatan Pangan' : 'Food Rescue Operations Command'}
          </h1>

          <p className="text-sm sm:text-base font-sans font-medium text-slate-300 leading-relaxed">
            {isId
              ? 'Monitoring menyeluruh seluruh rantai pasok penyelamatan surplus makanan perkotaan: validasi Food Safety Gate, optimasi rute armada kurir, dan dampak sosio-ekologis real-time.'
              : 'End-to-end command center for urban food rescue logistics: Food Safety Gate auditing, courier route optimization, and real-time socioeconomic impact.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="sun"
              size="md"
              onClick={() => onNavigate('journeys')}
              icon={Truck}
              className="text-xs px-6 py-3 shadow-sun font-display font-black text-amber-950"
            >
              {isId ? '🚚 Monitoring Seluruh Logistik' : '🚚 Full Fleet Monitoring'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('impact')}
              icon={BarChart3}
              className="text-xs px-6 py-3 font-display font-extrabold bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              {isId ? '📊 Analitik Kinerja Kota' : '📊 Citywide Analytics'}
            </Button>

            {reports.length === 0 ? (
              <button
                type="button"
                onClick={handleLoadDemo}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-display font-extrabold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isId ? 'Muat Data Simulasi Demo' : 'Load Simulation Data'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearDemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-display font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isId ? 'Reset Data Simulasi' : 'Reset Simulation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. City-Wide Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Total Dilaporkan' : 'Total Logged'}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {(kpis.totalReportedKg ?? kpis.totalVolumeKg ?? 0).toFixed(1)} <span className="text-sm text-slate-500 font-sans font-medium">kg</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? `${reports.length} transaksi surplus tercatat` : `${reports.length} surplus records total`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Tingkat Sukses (Rescue Rate)' : 'Rescue Success Rate'}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-800">
            {kpis.successRate ?? 0}%
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId
              ? `${(kpis.totalRescuedKg ?? kpis.deliveredVolumeKg ?? 0).toFixed(1)} kg diterima fisik di mitra`
              : `${(kpis.totalRescuedKg ?? kpis.deliveredVolumeKg ?? 0).toFixed(1)} kg successfully received`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Emisi CO₂e Dicegah' : 'GHG Avoidance'}
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {(environmentalSecondary?.co2eAvoidedKg ?? 0).toFixed(1)} <span className="text-sm text-slate-500 font-sans font-medium">kg CO₂e</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Pengalihan dari landfill / TPA' : 'Diverted from urban landfills'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Nilai Ekonomi Pangan' : 'Economic Value'}
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {formatRupiah(economics.offeredValueIdr || economics.completedCommercialValueIdr || economics.economicBenefitRp || 0)}
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Penghematan anggaran sosial' : 'Food value preserved'}
          </p>
        </div>
      </div>

      {/* 3. Operational Pipeline Funnel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div>
          <span className="text-xs font-display font-extrabold text-brand-600 uppercase tracking-wider block mb-1">
            ⚡ {isId ? 'Funnel Rantai Pasok Kota' : 'Supply Chain Routing Funnel'}
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
            {isId ? 'Alur Status Penyelamatan Real-Time' : 'Live Rescue Pipeline Status'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
            <span className="text-xs font-display font-extrabold text-slate-500 uppercase block">1. Dilaporkan</span>
            <span className="text-2xl font-display font-black text-brand-900 block">
              {reports.filter(r => r.journeyStatus === 'REPORTED').length}
            </span>
            <span className="text-[11px] text-slate-400 font-sans font-medium">Batch Masuk</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-1">
            <span className="text-xs font-display font-extrabold text-teal-800 uppercase block">2. Dinilai Safety</span>
            <span className="text-2xl font-display font-black text-teal-950 block">
              {reports.filter(r => ['ASSESSED', 'ROUTE_SELECTED', 'SAFETY_SCREENED', 'SAFETY_REASSESSED'].includes(r.journeyStatus)).length}
            </span>
            <span className="text-[11px] text-teal-700 font-sans font-medium">Lolos Evaluasi</span>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-1">
            <span className="text-xs font-display font-extrabold text-sky-800 uppercase block">3. Dijodohkan</span>
            <span className="text-2xl font-display font-black text-sky-950 block">
              {reports.filter(r => r.journeyStatus === 'MATCHED').length}
            </span>
            <span className="text-[11px] text-sky-700 font-sans font-medium">Mitra Siap</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
            <span className="text-xs font-display font-extrabold text-amber-800 uppercase block">4. Sedang Diantar</span>
            <span className="text-2xl font-display font-black text-amber-950 block">
              {reports.filter(r => r.journeyStatus === 'RESCUE_INITIATED').length}
            </span>
            <span className="text-[11px] text-amber-700 font-sans font-medium">Kurir Bergerak</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs font-display font-extrabold text-emerald-800 uppercase block">5. Sukses Diterima</span>
            <span className="text-2xl font-display font-black text-emerald-950 block">
              {reports.filter(r => r.journeyStatus === 'RECEIVED').length}
            </span>
            <span className="text-[11px] text-emerald-700 font-sans font-medium">Pangan Selamat</span>
          </div>
        </div>
      </div>

      {/* 4. Live Dispatches Monitoring Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-black text-brand-900">
              {isId ? 'Aktivitas Logistik Terbaru (Seluruh Kota)' : 'Recent Citywide Logistics Activity'}
            </h3>
            <p className="text-xs font-sans text-slate-500 font-semibold">
              {isId ? 'Rekapitulasi perpindahan makanan antar entitas' : 'Cross-entity food transfer monitor'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('journeys')}
            className="text-xs font-display font-black text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>{isId ? 'Buka Peta Logistik Lengkap' : 'Open Full Logistics'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {reports.slice(0, 4).map((r) => (
            <div 
              key={r.id} 
              onClick={() => onNavigate('journeys', r.id)}
              className="py-3.5 px-2.5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0"></span>
                <div>
                  <span className="text-sm font-display font-black text-brand-900 block">
                    {r.quantity} {r.unit} {getFoodDisplayName(r.foodTypeId, r.foodName, lang)}
                  </span>
                  <span className="text-xs text-slate-500 font-sans font-semibold">
                    {isId ? 'Dari:' : 'From:'} <strong>{r.reportedBy?.name || 'Dapur Grand Catering'}</strong> → {isId ? 'Tujuan:' : 'To:'} <strong>{r.selectedDestination?.name || 'Dapur Umum Mandiri'}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-[10px] font-display font-black px-2.5 py-0.5 rounded-full border ${
                  r.journeyStatus === 'RECEIVED'
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : r.journeyStatus === 'CANCELLED'
                    ? 'bg-rose-100 text-rose-950 border-rose-300'
                    : 'bg-sky-100 text-sky-950 border-sky-300'
                }`}>
                  {r.journeyStatus === 'RECEIVED' ? '✓ SELESAI' : r.journeyStatus === 'CANCELLED' ? '✕ BATAL' : '🚚 DIANTAR'}
                </span>
                <span className="block text-[10px] text-slate-400 font-sans mt-0.5">{formatDate(r.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
