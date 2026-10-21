import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { getReports, loadDemoData } from '../utils/storage';
import { generateInsights } from '../utils/calculations';
import PreventionSimulator from '../components/PreventionSimulator';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Insights({ onNavigate, lang = getActiveLanguage() }) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (e) => setCurrentLang(e.detail || getActiveLanguage());
    window.addEventListener('replate:language-change', handleLangChange);
    return () => window.removeEventListener('replate:language-change', handleLangChange);
  }, []);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.id;
  const isId = currentLang === 'id';
  const [reports, setReports] = useState(() => getReports());

  useEffect(() => {
    const handleUpdate = () => setReports(getReports());
    window.addEventListener('replate:storage-update', handleUpdate);
    return () => window.removeEventListener('replate:storage-update', handleUpdate);
  }, []);

  const insights = generateInsights(reports, currentLang);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-200/60">
        <div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight">
            {t.insights.title}
          </h1>
          <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 mt-1">
            {t.insights.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="sun"
            size="sm"
            onClick={() => onNavigate('report')}
            className="text-xs px-5 py-2.5 shadow-sun font-display font-extrabold"
          >
            {t.nav.reportButton}
          </Button>
        </div>
      </div>

      {!insights.hasData ? (
        <EmptyState
          title={lang === 'id' ? 'Belum Ada Data Surplus' : 'No Surplus Records Yet'}
          description={lang === 'id' ? 'Laporkan makanan surplus terlebih dahulu agar pola operasional dan analisis pencegahan otomatis dapat dihitung.' : 'Report surplus food first so operational patterns and automated prevention recommendations can be calculated.'}
          actionLabel={t.nav.reportButton}
          onAction={() => onNavigate('report')}
          secondaryActionLabel={t.impact.loadDemoBtn}
          onSecondaryAction={() => {
            loadDemoData();
            setReports(getReports());
          }}
        />
      ) : (
        <>
          {/* Top Pattern Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
              <span className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                {lang === 'id' ? 'Makanan Paling Sering' : 'Top Surplus Food'}
              </span>
              <span className="text-xl sm:text-2xl font-display font-black text-brand-900 block truncate">
                {insights.topFood}
              </span>
              <span className="text-[10px] font-sans font-semibold text-slate-400 mt-1 block">
                {lang === 'id' ? 'Frekuensi tertinggi' : 'Highest frequency item'}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
              <span className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                {lang === 'id' ? 'Sumber Terbanyak' : 'Dominant Source'}
              </span>
              <span className="text-xl sm:text-2xl font-display font-black text-brand-900 block truncate">
                {insights.topSource}
              </span>
              <span className="text-[10px] font-sans font-semibold text-slate-400 mt-1 block">
                {lang === 'id' ? 'Konteks asal utama' : 'Primary origin context'}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
              <span className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                {lang === 'id' ? 'Rute Terbanyak' : 'Dominant Route'}
              </span>
              <span className="text-xl sm:text-2xl font-display font-black text-brand-600 block truncate">
                {insights.topRoute}
              </span>
              <span className="text-[10px] font-sans font-semibold text-slate-400 mt-1 block">
                {lang === 'id' ? 'Jalur penanganan utama' : 'Preferred diversion path'}
              </span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
              <span className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                {lang === 'id' ? 'Rata-rata Skor' : 'Average Rescue Score'}
              </span>
              <span className="text-xl sm:text-2xl font-display font-black text-brand-900 block">
                {insights.avgScore} <span className="text-sm font-display text-slate-400 font-normal">/ 100</span>
              </span>
              <span className="text-[10px] font-sans font-semibold text-slate-400 mt-1 block">
                {lang === 'id' ? 'Tingkat viabilitas tinggi' : 'High viability benchmark'}
              </span>
            </div>
          </div>

          {/* Dynamic Prevention Recommendation Banner */}
          <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-amber-50 rounded-3xl p-6 sm:p-8 border border-brand-200 shadow-card space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-500 text-white font-display font-bold text-xs shadow-sm">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Rekomendasi Pencegahan Otomatis' : 'Prevention Recommendation'}</span>
            </div>

            <h3 className="text-2xl font-display font-black text-brand-900">
              {insights.prevention.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-semibold max-w-3xl">
              {insights.prevention.advice}
            </p>

            <div className="pt-3 border-t border-brand-200/60 flex items-center justify-between text-xs font-display text-slate-500">
              <span>{lang === 'id' ? 'Asal Operasional' : 'Operational Source'}: {insights.prevention.sourceContext}</span>
              <span>{lang === 'id' ? 'Target Pangan' : 'Target Food'}: {insights.prevention.targetFood}</span>
            </div>
          </div>

          {/* Embedded Prevention Simulator Section */}
          <div className="pt-2">
            <PreventionSimulator lang={lang} />
          </div>
        </>
      )}
    </div>
  );
}
