import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  HelpCircle, 
  TrendingUp,
  Trash2
} from 'lucide-react';
import { getReports, clearDemoData, getCurrentUser } from '../utils/storage';
import { 
  calculateRescuePerformance, 
  getFoodDisplayName, 
  getRouteDisplayName, 
  getSourceDisplayName 
} from '../utils/calculations';
import { 
  formatRupiah, 
  formatDuration, 
  formatNumber, 
  formatDate, 
  getJourneyStatusMeta 
} from '../utils/formatters';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Impact({ onNavigate, lang = getActiveLanguage() }) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (e) => setCurrentLang(e.detail || getActiveLanguage());
    const handleAuthChange = (e) => setCurrentUser(e.detail || getCurrentUser());
    window.addEventListener('replate:language-change', handleLangChange);
    window.addEventListener('replate:auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('replate:language-change', handleLangChange);
      window.removeEventListener('replate:auth-change', handleAuthChange);
    };
  }, []);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.id;
  const isId = currentLang === 'id';

  const [reports, setReports] = useState(() => getReports());
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showEnvSection, setShowEnvSection] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const handleUpdate = () => {
      setReports(getReports());
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('replate:storage-update', handleUpdate);
    return () => window.removeEventListener('replate:storage-update', handleUpdate);
  }, []);

  const perf = calculateRescuePerformance(reports, currentLang);
  const { kpis, statusOverview, bottlenecks, funnel, longestWaiting, economics, environmentalSecondary } = perf;

  const handleClearDemo = () => {
    const confirmMsg = isId
      ? 'Hapus data simulasi/demo dari perangkat Anda?'
      : 'Clear simulated demo data from your device?';
    if (window.confirm(confirmMsg)) {
      clearDemoData();
      setReports(getReports());
    }
  };

  // Filtered reports for Master Audit Table
  const filteredReports = reports.filter(r => {
    if (filterStatus === 'ACTIVE') return r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED' && r.journeyStatus !== 'EXPIRED';
    if (filterStatus === 'COMPLETED') return r.journeyStatus === 'RECEIVED';
    if (filterStatus === 'CANCELLED') return r.journeyStatus === 'CANCELLED' || r.journeyStatus === 'EXPIRED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* 1. Header & Operational Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-sky-200/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            {perf.hasDemoData && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                {t.impact.badgeDemo}
              </span>
            )}

            {currentUser && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold bg-teal-50 text-teal-900 border border-brand-300">
                <span>{currentUser.avatar}</span>
                <span>
                  {currentUser.role === 'supplier'
                    ? (isId ? 'Perspektif Penyedia: Dapur Grand Catering' : 'Donor Perspective: Dapur Grand Catering')
                    : currentUser.role === 'mitra'
                    ? (isId ? 'Perspektif Penerima: Dapur Umum Mandiri' : 'Recipient Perspective: Dapur Umum Mandiri')
                    : (isId ? 'Perspektif Operasional: Admin' : 'Operations Perspective: Admin')}
                </span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-brand-900 tracking-tight">
            {t.impact.title}
          </h1>
          <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {t.impact.subtitle}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>{t.impact.formulaExplainer}</span>
          </button>

          {perf.hasDemoData && (
            <button
              type="button"
              onClick={handleClearDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-display font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{t.impact.clearDemoBtn}</span>
            </button>
          )}

          <Button
            variant="sun"
            size="sm"
            onClick={() => onNavigate('report')}
            className="text-xs px-5 py-2.5 font-display font-extrabold shadow-sm"
          >
            {t.nav.reportButton}
          </Button>
        </div>
      </div>

      {/* Empty State Guard if 0 reports */}
      {!perf.hasData ? (
        <EmptyState
          title={t.impact.emptyTitle}
          description={t.impact.emptyDesc}
          actionLabel={t.impact.createFirstReport}
          onAction={() => onNavigate('report')}
        />
      ) : (
        <>
          {/* 2. Four (4) Operational KPI Cards */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-display font-black uppercase tracking-wider text-slate-500">
                {isId ? 'Empat Metrik Operasional Utama' : 'Four Core Operational KPIs'}
              </h2>
              <span className="text-xs text-slate-400 font-sans">
                {isId ? 'Dihitung deterministik dari data lokal' : 'Deterministically evaluated from local datasets'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* KPI 1: Total Surplus Dilaporkan */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-display font-black uppercase tracking-wider text-slate-500">
                      {t.impact.kpi1Title}
                    </span>
                    <Scale className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight">
                      {formatNumber(kpis.totalReportedKg, 1, lang)}
                    </span>
                    <span className="text-lg font-display font-bold text-slate-500">
                      KG
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.kpi1Sub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-display text-slate-500">
                  <span>{kpis.totalReportedTransactions} {isId ? 'laporan intake' : 'intake reports'}</span>
                  <span className="text-slate-400">100% Tercatat</span>
                </div>
              </div>

              {/* KPI 2: Pangan Berhasil Disalurkan */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-display font-black uppercase tracking-wider text-emerald-800">
                      {t.impact.kpi2Title}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-display font-black text-emerald-950 tracking-tight">
                      {formatNumber(kpis.totalRescuedKg, 1, lang)}
                    </span>
                    <span className="text-lg font-display font-bold text-emerald-700">
                      KG
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.kpi2Sub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-display text-slate-600">
                  <span>{kpis.completedTransactions} {isId ? 'selesai fisik' : 'intake completed'}</span>
                  <span className="font-bold text-emerald-800">
                    {kpis.totalReportedKg > 0 ? `${Math.round((kpis.totalRescuedKg / kpis.totalReportedKg) * 100)}% divergen` : '—'}
                  </span>
                </div>
              </div>

              {/* KPI 3: Rata-rata Waktu Penyelamatan */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-display font-black uppercase tracking-wider text-slate-500">
                      {t.impact.kpi3Title}
                    </span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl sm:text-4xl font-display font-black tracking-tight ${
                      kpis.avgRescueTimeHours !== null ? 'text-slate-900' : 'text-slate-400 text-2xl'
                    }`}>
                      {kpis.avgRescueTimeString}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.kpi3Sub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-display text-slate-500">
                  <span>{kpis.completedTransactions > 0 ? `${kpis.completedTransactions} sampel serah terima` : (isId ? 'Menunggu transaksi selesai' : 'Awaiting completed flow')}</span>
                  <span className="text-slate-400">Timestamp valid</span>
                </div>
              </div>

              {/* KPI 4: Tingkat Keberhasilan */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-display font-black uppercase tracking-wider text-slate-500">
                      {t.impact.kpi4Title}
                    </span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl sm:text-5xl font-display font-black tracking-tight ${
                      kpis.successRate !== null ? 'text-slate-900' : 'text-slate-400 text-2xl'
                    }`}>
                      {kpis.successRateString}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.kpi4Sub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] font-display text-slate-500">
                  <span>Penyebut: {kpis.dueTransactions} {isId ? 'jatuh tempo' : 'due items'}</span>
                  <span className="text-slate-400">Aktif: {kpis.activeTransactions}</span>
                </div>
              </div>

            </div>
          </section>

          {/* 3. Operational Pipeline Overview */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                  {t.impact.operationalPipelineTitle}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 mt-0.5">
                  {t.impact.operationalPipelineSub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('journeys')}
                className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-[#0a5c56] hover:underline self-start sm:self-auto"
              >
                <span>{t.impact.seeAllJourneys}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pipeline Stage Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {statusOverview.map((item, idx) => {
                const isFinal = item.key === 'RECEIVED';
                const isFail = item.key === 'CANCELLED_EXPIRED';

                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                      isFinal
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : isFail
                        ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                        : 'bg-stone-50/80 border-stone-200 text-slate-900'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-display font-extrabold tracking-wider uppercase text-slate-400 block mb-1">
                        Tahap {idx + 1}
                      </span>
                      <h4 className="text-xs font-display font-extrabold leading-snug line-clamp-2 min-h-[32px]">
                        {item.label}
                      </h4>
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-200/60">
                      <div className="text-2xl font-display font-black tracking-tight">
                        {item.count}
                      </div>
                      <div className="text-[11px] font-sans font-medium text-slate-500 mt-0.5">
                        {formatNumber(item.kg, 1, lang)} kg • {item.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Operational Bottlenecks Callout */}
            <div className="pt-2">
              <h4 className="text-xs font-display font-black uppercase tracking-wider text-slate-500 mb-2.5">
                {t.impact.bottleneckTitle}
              </h4>

              {bottlenecks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 text-xs font-sans text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t.impact.noBottleneck}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {bottlenecks.map((b, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs font-sans text-amber-950 flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-display font-bold">[{b.id}] {b.foodName}:</strong>{' '}
                        <span>{b.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 4. Supply Chain Performance (Funnel & Longest Waiting) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Supply Chain Funnel */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                  {t.impact.funnelTitle}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 mt-1">
                  {t.impact.funnelSub}
                </p>
              </div>

              {!funnel.isSufficient ? (
                <div className="p-8 text-center text-xs font-display text-slate-400 border border-dashed rounded-2xl">
                  {isId ? 'Data belum mencukupi untuk membuat analisis funnel.' : 'Insufficient data to compute stage funnel.'}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {funnel.stages.map((stage, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-display">
                        <span className="font-extrabold text-slate-800">
                          {stage.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-medium">
                            {stage.count} {isId ? 'laporan' : 'batches'}
                          </span>
                          <span className="font-black text-[#0a5c56] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {stage.conversionRate}%
                          </span>
                        </div>
                      </div>

                      {/* Funnel Progress Bar */}
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0a5c56] to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, stage.conversionRate))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Longest-Waiting Transactions */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                  {t.impact.longestWaitingTitle}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 mt-1">
                  {t.impact.longestWaitingSub}
                </p>
              </div>

              {longestWaiting.length === 0 ? (
                <div className="p-8 text-center text-xs font-sans text-slate-500 border border-stone-100 rounded-2xl bg-stone-50/50">
                  {isId
                    ? 'Tidak ada transaksi aktif yang mengantre. Semua laporan telah selesai atau dibatalkan.'
                    : 'No active items pending action. All workflows completed or concluded.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {longestWaiting.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-display font-black text-slate-900">
                            {item.quantityKg} kg {getFoodDisplayName(item.foodTypeId, item.foodName, lang)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{item.id.slice(-6)}
                          </span>
                        </div>
                        <div className="text-[11px] font-sans text-slate-500">
                          {getSourceDisplayName(item.source, lang)} • Status: <strong className="text-slate-700">{item.currentStatus}</strong>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-xs font-display font-black text-amber-800">
                          ⏳ {formatDuration(item.waitingHours, lang)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('journeys')}
                          className="text-[11px] font-display font-bold text-[#0a5c56] hover:underline mt-1 inline-flex items-center gap-1"
                        >
                          <span>{t.impact.viewInJourney}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* 5. Surplus Value Exchange (Economic Valuation) */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="pb-4 border-b border-stone-100">
              <span className="text-xs font-display font-black uppercase tracking-wider text-slate-400 block mb-1">
                Economic Recovery & Value Exchange
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                {t.impact.economicsTitle}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {t.impact.economicsSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box A: Offered Value */}
              <div className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {t.impact.offeredValue}
                  </span>
                  <div className="text-3xl font-display font-black text-slate-900 tracking-tight">
                    {formatRupiah(economics.offeredValueIdr)}
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.offeredValueSub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-200 text-[11px] font-display text-slate-500">
                  {kpis.totalReportedTransactions} laporan • Harga acuan kategori
                </div>
              </div>

              {/* Box B: Completed Commercial Value */}
              <div className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    {t.impact.completedValue}
                  </span>
                  <div className="text-3xl font-display font-black text-slate-900 tracking-tight">
                    {formatRupiah(economics.completedCommercialValueIdr)}
                  </div>
                  <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed">
                    {t.impact.completedValueSub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-200 text-[11px] font-display text-slate-500">
                  {economics.commercialCompletedCount} transaksi komersial selesai
                </div>
              </div>

              {/* Box C: Recipient Community Savings */}
              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    {t.impact.recipientSavings}
                  </span>
                  <div className="text-3xl font-display font-black text-emerald-950 tracking-tight">
                    {economics.recipientSavingsIdr !== null ? formatRupiah(economics.recipientSavingsIdr) : t.impact.noData}
                  </div>
                  <p className="text-xs font-sans text-emerald-900 mt-2 leading-relaxed">
                    {t.impact.recipientSavingsSub}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-emerald-200/70 text-[11px] font-display text-emerald-800">
                  {economics.donatedCompletedCount} program donasi pangan terealisasi
                </div>
              </div>

            </div>

            {/* Model Separation Disclaimer */}
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 text-xs font-sans text-sky-950 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-display font-extrabold">{t.impact.donationVsCommercial}:</strong>
                <p className="leading-relaxed text-sky-900">
                  {t.impact.donatedLabel} • {t.impact.commercialLabel}
                </p>
              </div>
            </div>
          </section>

          {/* 6. Food Rescue Journey Audit Master Table */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                  {t.impact.transactionsTableTitle}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 mt-0.5">
                  {t.impact.transactionsTableSub}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-full text-xs font-display">
                {[
                  { id: 'ALL', label: isId ? 'Semua' : 'All' },
                  { id: 'ACTIVE', label: isId ? 'Sedang Berjalan' : 'Active' },
                  { id: 'COMPLETED', label: isId ? 'Selesai' : 'Completed' },
                  { id: 'CANCELLED', label: isId ? 'Batal / Gugur' : 'Lapsed' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      filterStatus === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-stone-200 text-slate-400 font-display font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pr-4">ID & Tanggal</th>
                    <th className="pb-3 pr-4">Pangan & Kuantitas</th>
                    <th className="pb-3 pr-4">Safety Gate</th>
                    <th className="pb-3 pr-4">Mitra & Rute</th>
                    <th className="pb-3 pr-4">Status Transaksi</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 font-display">
                        {isId ? 'Tidak ada transaksi yang cocok dengan filter.' : 'No transactions matching active filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(rep => {
                      const statusMeta = getJourneyStatusMeta(rep.journeyStatus, lang);
                      const isDone = rep.journeyStatus === 'RECEIVED';
                      const gateStatus = rep.foodSafetyGate?.status || 'REVIEW';

                      return (
                        <tr key={rep.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 pr-4">
                            <span className="font-mono font-bold text-slate-900 block">
                              #{rep.id.slice(-8)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(rep.createdAt)}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4">
                            <strong className="font-display font-bold text-slate-900 block">
                              {getFoodDisplayName(rep.foodTypeId, rep.foodName, lang)}
                            </strong>
                            <span className="text-[11px] text-slate-500">
                              Lapor: {rep.quantity} {rep.unit} {rep.actualReceivedKg ? `• Aktual: ${rep.actualReceivedKg} kg` : ''}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display font-bold border ${
                              gateStatus === 'PASS'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : gateStatus === 'REVIEW'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-rose-50 text-rose-900 border-rose-300'
                            }`}>
                              🛡️ {gateStatus}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4">
                            <span className="text-slate-800 font-semibold block">
                              {rep.selectedDestination?.name || 'Belum Ditentukan'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {getRouteDisplayName(rep.recommendedRoute, lang)}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-display font-bold border ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          </td>

                          <td className="py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => onNavigate('journeys', rep.id)}
                              className="text-xs font-display font-bold text-[#0a5c56] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Detail</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Estimasi Dampak Lingkungan (Sekunder) - Collapsible Section */}
          <section className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEnvSection(!showEnvSection)}
              className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-display font-black uppercase tracking-wider text-slate-400">
                    Secondary Modeling
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-stone-100 text-slate-600">
                    Opsional / Sekunder
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight mt-1">
                  {t.impact.environmentalToggle}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 mt-0.5">
                  {t.impact.environmentalSub}
                </p>
              </div>

              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-slate-500 shrink-0">
                {showEnvSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {showEnvSection && (
              <div className="p-6 sm:p-8 pt-0 border-t border-stone-100 space-y-6">
                
                {/* Secondary Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
                  
                  {/* CO2e Avoided */}
                  <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200">
                    <span className="text-xs font-display font-bold text-slate-500 block mb-1">
                      {t.impact.co2}
                    </span>
                    <div className="text-3xl font-display font-black text-slate-900 tracking-tight">
                      {environmentalSecondary.co2eAvoidedKg !== null 
                        ? `${formatNumber(environmentalSecondary.co2eAvoidedKg, 1, lang)} kg`
                        : (isId ? 'Belum dapat dihitung' : 'Not computable')}
                    </div>
                    <span className="text-[11px] font-sans text-slate-500 mt-1 block">
                      Faktor EPA WARM 2.1 kg CO₂e / kg pangan
                    </span>
                  </div>

                  {/* Water Saved */}
                  <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200">
                    <span className="text-xs font-display font-bold text-slate-500 block mb-1">
                      {t.impact.water}
                    </span>
                    <div className="text-3xl font-display font-black text-slate-900 tracking-tight">
                      {environmentalSecondary.waterSavedLiters !== null 
                        ? `${formatNumber(environmentalSecondary.waterSavedLiters, 0, lang)} L`
                        : (isId ? 'Belum dapat dihitung' : 'Not computable')}
                    </div>
                    <span className="text-[11px] font-sans text-slate-500 mt-1 block">
                      Rata-rata global FAO (250 L air / kg)
                    </span>
                  </div>

                  {/* Estimated Servings */}
                  <div className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200">
                    <span className="text-xs font-display font-bold text-slate-500 block mb-1">
                      {t.impact.servings}
                    </span>
                    <div className="text-3xl font-display font-black text-slate-900 tracking-tight">
                      {environmentalSecondary.mealsEquivalent !== null 
                        ? `${formatNumber(environmentalSecondary.mealsEquivalent, 0, lang)} porsi`
                        : (isId ? 'Belum dapat dihitung' : 'Not computable')}
                    </div>
                    <span className="text-[11px] font-sans text-slate-500 mt-1 block">
                      Standar porsi bantuan (350 gram / porsi)
                    </span>
                  </div>

                </div>

                {/* Explicit Methodology Disclaimer */}
                <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200 text-xs font-sans text-slate-700 leading-relaxed">
                  <strong className="font-display font-bold text-slate-900 block mb-1">
                    Pedoman Metodologi & Transparansi Data:
                  </strong>
                  <p>{t.impact.methodologyNote}</p>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* Formula Explainer Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-display font-black uppercase tracking-wider text-[#0a5c56]">
                  Mathematical Formulation
                </span>
                <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">
                  {t.impact.formulaExplainer}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-slate-700 leading-relaxed">
              
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-sm">
                  1. Total Surplus Dilaporkan (kg)
                </h4>
                <p>
                  Menjumlahkan seluruh kuantitas intake pangan yang valid yang tersimpan di sistem. Jika input berupa porsi, dikonversi menggunakan rasio baku 0.35 kg/porsi. Setiap laporan diidentifikasi dengan ID unik untuk mencegah duplikasi data.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-sm">
                  2. Pangan Berhasil Disalurkan (kg)
                </h4>
                <p>
                  <strong>Hanya menghitung transaksi dengan status akhir konfirmasi fisik DITERIMA (RECEIVED).</strong> Laporan yang masih dalam proses verifikasi, pencocokan, penjemputan, atau dibatalkan TIDAK dimasukkan ke dalam metrik ini. Berat aktual saat penerimaan digunakan jika tercatat.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-sm">
                  3. Rata-rata Waktu Penyelamatan (Jam / Menit)
                </h4>
                <p>
                  Dihitung sebagai selisih waktu terverifikasi antara timestamp pembuatan laporan (<code className="bg-stone-200 px-1 py-0.5 rounded">createdAt</code>) dan timestamp konfirmasi penerimaan (<code className="bg-stone-200 px-1 py-0.5 rounded">RECEIVED</code>). Jika belum ada transaksi selesai, sistem menampilkan secara jujur <em>"Belum ada data"</em>, tanpa menghasilkan angka sembarangan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-sm">
                  4. Tingkat Keberhasilan (%) & Definisi Penyeleksi
                </h4>
                <div className="p-3 bg-white rounded-xl border border-stone-200 font-mono text-[11px] text-slate-800">
                  Tingkat Keberhasilan = (Transaksi Selesai / Transaksi Jatuh Tempo) × 100%
                </div>
                <p className="mt-2">
                  <strong>Penyebut (Denominator):</strong> Transaksi Selesai + Transaksi Dibatalkan/Kedaluwarsa. Transaksi yang masih aktif dan belum melewati batas waktu aman TIDAK dianggap sebagai kegagalan. Jika penyebut nol, sistem menampilkan <em>"Belum ada data"</em> guna mencegah 0% yang menyesatkan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-display font-extrabold text-slate-900 text-sm">
                  5. Valuasi Ekonomi & Pertukaran Nilai
                </h4>
                <p>
                  Menghitung Nilai Penawaran (seluruh laporan berdasarkan acuan harga pangan per kategori), Nilai Transaksi Selesai (transaksi komersial yang selesai), dan Penghematan Penerima (selisih belanja yang dihemat oleh komunitas penerima donasi sosial). Nilai donasi sosial tidak pernah dihitung sebagai omzet pemasok.
                </p>
              </div>

            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <Button
                variant="sun"
                size="sm"
                onClick={() => setShowFormulaModal(false)}
                className="text-xs px-6 py-2.5 font-display font-bold"
              >
                Tutup Panduan
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
