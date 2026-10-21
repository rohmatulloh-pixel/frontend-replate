import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { getReports } from '../utils/storage';
import { getFoodDisplayName, getRouteDisplayName } from '../utils/calculations';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Home({ onNavigate, lang = getActiveLanguage() }) {
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

  const topicStreams = [
    { id: 'cooked-rice', name: t.streams.cookedRice, icon: '🍚', color: 'from-amber-100 to-amber-200 text-amber-900 border-amber-300', tag: t.streams.cookedRiceTag },
    { id: 'bread-pastries', name: t.streams.bakeryGrains, icon: '🥖', color: 'from-orange-100 to-orange-200 text-orange-900 border-orange-300', tag: t.streams.bakeryGrainsTag },
    { id: 'fresh-vegetables', name: t.streams.freshVeggies, icon: '🥦', color: 'from-emerald-100 to-emerald-200 text-emerald-900 border-emerald-300', tag: t.streams.freshVeggiesTag },
    { id: 'fruits', name: t.streams.freshFruits, icon: '🍎', color: 'from-rose-100 to-rose-200 text-rose-900 border-rose-300', tag: t.streams.freshFruitsTag },
    { id: 'prepared-meals', name: t.streams.preparedMeals, icon: '🍱', color: 'from-teal-100 to-teal-200 text-teal-900 border-teal-300', tag: t.streams.preparedMealsTag },
    { id: 'packaged-dry-goods', name: t.streams.packagedGoods, icon: '📦', color: 'from-sky-100 to-sky-200 text-sky-900 border-sky-300', tag: t.streams.packagedGoodsTag },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-8 bg-[#F0F9FF] overflow-hidden">
        <div className="absolute top-10 left-10 text-3xl opacity-30 select-none animate-pulse">☁️</div>
        <div className="absolute top-20 right-16 text-4xl opacity-30 select-none animate-pulse">☁️</div>
        {/* Subtle ambient lighting without stars */}

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 shadow-sm border border-emerald-200 text-xs font-display font-bold text-emerald-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.home.badge}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-brand-900 tracking-tight leading-[1.08]">
            {t.home.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl font-sans font-semibold text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Button
              variant="sun"
              size="lg"
              onClick={() => onNavigate('report')}
              icon={ArrowRight}
              iconPosition="right"
              className="w-full sm:w-auto text-sm px-8 py-3.5 shadow-sun"
            >
              {t.home.startNow}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('journeys')}
              className="w-full sm:w-auto text-sm px-7 py-3.5"
            >
              {t.home.viewJourneys}
            </Button>
          </div>

          {/* Trust Badges Bar */}
          <div className="pt-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-white/95 rounded-full px-6 py-3 shadow-card border border-white max-w-4xl mx-auto text-xs font-display font-bold text-slate-700">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <span>🛡️</span>
                <span>{t.home.trust.safe}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-amber-900">
                <span>⚡</span>
                <span>{t.home.trust.deterministic}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-sky-800">
                <span>🚚</span>
                <span>{t.home.trust.proximity}</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-teal-800">
                <span>🌍</span>
                <span>{t.home.trust.impact}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          EXPLORE BY FOOD STREAM
      ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-brand-900 tracking-tight">
            {t.home.streamsTitle}
          </h2>
          <p className="text-sm text-slate-600 font-sans font-semibold mt-1">
            {t.home.streamsSubtitle}
          </p>
        </div>

        {/* 6 Squircles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {topicStreams.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onNavigate('report')}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer text-center group flex flex-col items-center justify-between"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${topic.color} border flex items-center justify-center text-3xl shadow-sm mb-3 group-hover:scale-110 transition-transform`}>
                {topic.icon}
              </div>

              <div>
                <span className="font-display font-bold text-sm text-slate-800 block group-hover:text-brand-600 transition-colors">
                  {topic.name}
                </span>
                <span className="text-[10px] font-display font-semibold text-slate-500 block mt-0.5">
                  {topic.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          ACTIVE RESCUE OPERATIONS
      ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-brand-900 tracking-tight">
              {t.home.activeTitle}
            </h2>
            <p className="text-sm text-slate-600 font-sans font-semibold mt-1">
              {t.home.activeSubtitle}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('journeys')}
            className="self-start sm:self-auto text-xs px-4"
          >
            {t.home.viewAll}
          </Button>
        </div>

        {/* Dynamic User Reports or Clean Zero-Data State */}
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {reports.slice(0, 4).map((item) => {
              const isDone = item.journeyStatus === 'RECEIVED';
              const fName = getFoodDisplayName(item.foodTypeId, item.foodName, lang);
              const rName = getRouteDisplayName(item.recommendedRoute, lang);
              const statusLabel = isDone
                ? (lang === 'id' ? 'Selesai Disajikan ✅' : 'Delivered & Plated ✅')
                : (lang === 'id' ? 'Sedang Diantar 🚚' : 'In Transit 🚚');

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate('journeys')}
                  className="bg-white rounded-3xl border border-slate-100 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  <div className="h-32 bg-gradient-to-tr from-teal-400 to-sky-400 flex flex-col items-center justify-center p-4 relative text-white">
                    <span className="text-4xl drop-shadow-md">🍲</span>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/95 font-display font-black text-xs text-brand-900 shadow-sm">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-extrabold text-base text-slate-800 leading-tight truncate">
                        {fName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="truncate">{item.selectedDestination?.name || (lang === 'id' ? 'Menunggu Penjemputan' : 'Pending Intake')}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-display font-extrabold text-[10px] bg-teal-100 text-brand-800">
                        {rName}
                      </span>
                      <span className="text-[10px] font-display font-bold text-slate-600">
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-sky-100 p-8 sm:p-12 text-center shadow-soft max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto bg-sky-100 rounded-full flex items-center justify-center text-3xl">
              🚚
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
              {lang === 'id' ? 'Belum Ada Operasi Penyelamatan' : 'No Active Rescue Operations'}
            </h3>
            <p className="text-xs sm:text-sm font-sans font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              {lang === 'id'
                ? 'Dapur Anda belum memiliki catatan surplus yang sedang berjalan. Mulai laporkan makanan berlebih untuk menghubungkan porsi berharga ke mitra penerima terdekat.'
                : 'Your kitchen does not have any active surplus rescues running. Report surplus food now to route wholesome meals to nearby community partners.'}
            </p>
            <div className="pt-2">
              <Button
                variant="sun"
                size="md"
                onClick={() => onNavigate('report')}
                icon={ArrowRight}
                className="text-xs px-6 py-2.5 font-display font-black shadow-sun"
              >
                {t.nav.reportButton}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          FEATURED ADVENTURE BANNER
      ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-sky-100 via-teal-50 to-amber-50 rounded-3xl sm:rounded-[40px] p-8 sm:p-12 border border-sky-200/80 shadow-card relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Visual Icon Illustration */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-sun-400 via-brand-400 to-sky-400 p-2 shadow-card flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <span className="text-5xl">🍲</span>
                  <span className="text-xl font-display font-black text-brand-900">
                    REPLATE
                  </span>
                  <span className="text-xs font-display font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    {lang === 'id' ? 'Deterministik & Cepat' : 'Deterministic & Fast'}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Text Content */}
            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-500 text-white font-display font-bold text-xs shadow-sm">
                <span>⚡</span>
                <span>{t.home.featuredBadge}</span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-display font-black text-brand-900 leading-tight">
                {t.home.featuredTitle}
              </h3>

              <p className="text-sm font-sans font-semibold text-slate-600 leading-relaxed max-w-xl">
                {t.home.featuredDesc}
              </p>

              <div className="pt-2">
                <Button
                  variant="sun"
                  size="md"
                  onClick={() => onNavigate('report')}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="px-6 py-3 text-xs"
                >
                  {t.home.featuredBtn}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LOVED BY COMMUNITY PARTNERS
      ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-display font-black text-brand-900 tracking-tight">
            {t.home.reviewsTitle}
          </h2>
          <p className="text-sm text-slate-600 font-sans font-semibold mt-1">
            {t.home.reviewsSubtitle}
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              avatar: '👩‍🍳',
              name: 'Chef Sarah M.',
              role: lang === 'id' ? 'Head Chef, Grand Banquet Catering' : 'Head Chef, Grand Banquet Catering',
              quote: lang === 'id'
                ? '"REPLATE menghilangkan kepanikan di akhir acara. Dalam 30 detik kami tahu surplus kami menuju dapur umum, bukan ke tempat pembuangan."'
                : '"REPLATE eliminates the end-of-night panic. In 30 seconds we know our surplus is heading to hot dinner service instead of the dumpster."'
            },
            {
              avatar: '👨‍💼',
              name: 'Daniel R.',
              role: lang === 'id' ? 'Pengelola Dapur Umum Alpha' : 'Director, Community Kitchen Alpha',
              quote: lang === 'id'
                ? '"Pencocokannya sangat presisi. Kami hanya menerima makanan matang yang sesuai dengan kapasitas dan jam operasional kami."'
                : '"The compatibility filter is genius. We only receive hot wholesome foods that our kitchen can safely plate within our operating hours."'
            },
            {
              avatar: '👩‍🌾',
              name: 'Priya S.',
              role: lang === 'id' ? 'Manajer Keberlanjutan Resto' : 'Sustainability Lead, Bistro Collective',
              quote: lang === 'id'
                ? '"Metrik porsi makan dan pengurangan CO2e yang langsung terlihat membuat laporan keberlanjutan kami menjadi sangat mudah dan terverifikasi."'
                : '"Having quantifiable CO2e and meal metrics makes our sustainability reporting effortless and 100% verified by scientific standards."'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft space-y-4 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  {item.avatar}
                </div>
                <div>
                  <span className="font-display font-bold text-sm text-slate-800 block">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-sans font-semibold text-slate-500 block">
                    {item.role}
                  </span>
                </div>
              </div>

              <p className="text-xs font-sans text-slate-600 leading-relaxed italic">
                {item.quote}
              </p>

              <div className="flex items-center gap-1 text-sun-500 text-sm pt-2 border-t border-slate-100">
                {'★★★★★'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gradient-to-tr from-brand-600 via-teal-600 to-sky-600 rounded-3xl sm:rounded-[40px] p-8 sm:p-12 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-3xl sm:text-4xl font-display font-black text-white leading-tight">
              {t.home.ctaTitle}
            </h3>
            <p className="text-sm font-sans font-semibold text-teal-100 max-w-md leading-relaxed">
              {t.home.ctaSubtitle}
            </p>
          </div>

          <Button
            variant="sun"
            size="lg"
            onClick={() => onNavigate('report')}
            className="text-xs px-8 py-4 shadow-sun w-full sm:w-auto font-display font-black"
          >
            {t.home.ctaBtn}
          </Button>
        </div>
      </section>
    </div>
  );
}
