import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Lock,
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
  Coins
} from 'lucide-react';
import Button from '../Button';
import api from '../../services/api';
import { getReports, loadDemoData, clearDemoData, isDemoMode } from '../../utils/storage';
import { calculateRescuePerformance, getFoodDisplayName } from '../../utils/calculations';
import { formatNumber, formatRupiah, formatDate } from '../../utils/formatters';

export default function AdminDashboard({ onNavigate, lang = 'id', currentUser }) {
  const isId = lang === 'id';
  const [reports, setReports] = useState(() => getReports());
  const [demoActive, setDemoActive] = useState(() => isDemoMode());
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (api.isLiveApiEnabled()) {
      setLoadingLogs(true);
      api.admin.getAuditLogs(1, 15).then(res => {
        const list = res?.data?.logs || res?.logs || (Array.isArray(res?.data) ? res.data : []);
        setAuditLogs(Array.isArray(list) ? list : []);
      }).catch(err => {
        console.warn('[REPLATE Admin] Audit log query warning:', err);
      }).finally(() => setLoadingLogs(false));
    }
  }, []);

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
              <Coins className="w-4 h-4" />
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

      {/* 5. Enterprise Security Audit Logs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-display font-black text-brand-900 tracking-tight">
                {isId ? 'Jejak Audit Keamanan & Rekam Jejak Mutasi Sistem' : 'System Security Audit Trail & Mutation Logs'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-1">
              {isId
                ? 'Seluruh mutasi status pengiriman, pembatalan darurat, penolakan fisik di lokasi, dan penghapusan data tercatat secara permanen di server.'
                : 'Permanent immutable audit trail of cancellations, doorstep rejections, and state mutations.'}
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 shrink-0 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            {isId ? 'Audit Trail Terverifikasi' : 'Verified Audit Trail'}
          </span>
        </div>

        {loadingLogs ? (
          <div className="py-8 text-center text-xs font-sans text-slate-400">
            {isId ? 'Memuat log audit dari server backend...' : 'Loading audit logs from backend server...'}
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Aksi</th>
                  <th className="py-2.5 px-3">Aktor</th>
                  <th className="py-2.5 px-3">Entitas / Modul</th>
                  <th className="py-2.5 px-3">Keterangan / Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-display uppercase tracking-wider ${
                        log.action === 'DELETE' || log.action === 'CANCEL' || log.action === 'PHYSICAL_REJECTION'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'CREATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {log.actor?.fullName || log.actor?.email || log.actorUserId || 'Sistem Admin'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {log.tableName || log.entityType || 'SurplusListing'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {log.reason || (log.details ? JSON.stringify(log.details) : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600 font-semibold">
              {isId
                ? 'Tidak ada anomali atau mutasi log mencurigakan. Seluruh aksi tercatat aman di PostgreSQL.'
                : 'No anomalous audit events recorded. All transactions logged in PostgreSQL.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isId ? 'Log akan terisi otomatis saat transaksi real-time berlangsung atau simulasi dijalankan.' : 'Logs populate dynamically as real-time transactions execute.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
