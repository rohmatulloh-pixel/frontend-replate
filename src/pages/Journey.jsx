import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { getReports, updateJourneyStatus, deleteReport, loadDemoData, getCurrentUser } from '../utils/storage';
import { getFoodDisplayName } from '../utils/calculations';
import JourneyTimeline from '../components/JourneyTimeline';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Journey({ onNavigate, lang = getActiveLanguage(), initialSelectedId = null }) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const timelineRef = useRef(null);

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
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [selectedReportId, setSelectedReportId] = useState(() => {
    if (initialSelectedId) return initialSelectedId;
    const initial = getReports();
    return initial.length > 0 ? initial[0].id : null;
  });

  const refreshReports = () => {
    const data = getReports();
    setReports(data);
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    window.addEventListener('replate:storage-update', refreshReports);
    return () => window.removeEventListener('replate:storage-update', refreshReports);
  }, []);

  // Sync when initialSelectedId is passed from external view
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedReportId(initialSelectedId);
      const rep = getReports().find(r => r.id === initialSelectedId);
      if (rep) {
        if (rep.journeyStatus === 'RECEIVED') {
          setActiveFilter('COMPLETED');
        } else if (rep.journeyStatus === 'CANCELLED' || rep.journeyStatus === 'EXPIRED') {
          setActiveFilter('CANCELLED');
        } else {
          setActiveFilter('ALL');
        }
      }
    }
  }, [initialSelectedId]);

  const handleAdvance = (id, newStatus, note, extraPayload) => {
    updateJourneyStatus(id, newStatus, note, extraPayload, currentUser);
    refreshReports();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const confirmMsg = lang === 'id'
      ? 'Hapus data pengiriman ini dari perangkat Anda?'
      : 'Remove this journey record from your device?';
    if (window.confirm(confirmMsg)) {
      deleteReport(id);
      refreshReports();
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
    }
  };

  // Filter list
  const filteredReports = reports.filter(r => {
    if (activeFilter === 'ACTIVE') return r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED' && r.journeyStatus !== 'EXPIRED';
    if (activeFilter === 'COMPLETED') return r.journeyStatus === 'RECEIVED';
    if (activeFilter === 'CANCELLED') return r.journeyStatus === 'CANCELLED' || r.journeyStatus === 'EXPIRED';
    return true;
  });

  // Ensure activeReport prioritizes the item in filtered list, fallback to first in filter
  const activeReport = filteredReports.find(r => r.id === selectedReportId) || filteredReports[0] || null;

  const handleSelectReport = (id) => {
    setSelectedReportId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    const newFiltered = reports.filter(r => {
      if (filterId === 'ACTIVE') return r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED' && r.journeyStatus !== 'EXPIRED';
      if (filterId === 'COMPLETED') return r.journeyStatus === 'RECEIVED';
      if (filterId === 'CANCELLED') return r.journeyStatus === 'CANCELLED' || r.journeyStatus === 'EXPIRED';
      return true;
    });
    if (newFiltered.length > 0 && !newFiltered.some(r => r.id === selectedReportId)) {
      setSelectedReportId(newFiltered[0].id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-200/60">
        <div>
          {currentUser && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold bg-teal-50 text-teal-900 border border-brand-300">
                <span>{currentUser.avatar}</span>
                <span>{currentUser.name}</span>
                <span className="text-teal-400 font-normal">•</span>
                <span className="font-semibold text-teal-800">{currentUser.badgeText}</span>
              </span>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight">
            {currentUser?.role === 'mitra'
              ? (isId ? 'Pasokan Makanan Masuk (Inbound)' : 'Incoming Food Deliveries (Inbound)')
              : currentUser?.role === 'supplier'
              ? (isId ? 'Penyaluran Surplus Pangan (Outbound)' : 'Surplus Food Dispatch (Outbound)')
              : t.journey.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-sans font-semibold mt-1">
            {currentUser?.role === 'supplier'
              ? (isId
                  ? 'Pantau surplus makanan dari Dapur Grand Catering yang sedang dijemput kurir & dikirim ke mitra penerima.'
                  : 'Track surplus food dispatched from Dapur Grand Catering to intake partners.')
              : currentUser?.role === 'mitra'
              ? (isId
                  ? 'Daftar bantuan pangan yang dialokasikan dan sedang dalam perjalanan menuju Dapur Umum Mandiri.'
                  : 'Surplus food shipments allocated and in transit towards Dapur Umum Mandiri.')
              : t.journey.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.role === 'mitra' ? (
            <Button
              variant="sun"
              size="sm"
              onClick={refreshReports}
              className="text-xs px-5 py-2.5 shadow-sun font-display font-extrabold"
            >
              {isId ? '🔄 Perbarui Pasokan Masuk' : '🔄 Refresh Inbound'}
            </Button>
          ) : (
            <Button
              variant="sun"
              size="sm"
              onClick={() => onNavigate('report')}
              icon={Plus}
              className="text-xs px-5 py-2.5 shadow-sun font-display font-extrabold"
            >
              {currentUser?.role === 'supplier'
                ? (isId ? '+ Lapor Surplus Baru' : '+ Report Surplus')
                : t.journey.newRescue}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content or Empty State */}
      {reports.length === 0 ? (
        <EmptyState
          title={t.journey.emptyTitle}
          description={t.journey.emptyDesc}
          actionLabel={t.nav.reportButton}
          onAction={() => onNavigate('report')}
          secondaryActionLabel={t.impact.loadDemoBtn}
          onSecondaryAction={() => {
            loadDemoData();
            refreshReports();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Master List */}
          <div className="lg:col-span-5 space-y-4">
            {/* Filter Pills with 100% Readable Uniform Shapes */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-slate-100 text-xs font-display">
              <span className="text-slate-500 font-extrabold mr-1 shrink-0">Filter:</span>
              {[
                { id: 'ALL', label: currentUser?.role === 'mitra' ? (isId ? 'Semua Pasokan' : 'All Deliveries') : t.journey.filterAll },
                { id: 'ACTIVE', label: currentUser?.role === 'mitra' ? (isId ? 'Dalam Perjalanan' : 'In Transit') : t.journey.filterActive },
                { id: 'COMPLETED', label: currentUser?.role === 'mitra' ? (isId ? 'Diterima' : 'Received') : t.journey.filterCompleted },
                { id: 'CANCELLED', label: lang === 'id' ? 'Batal' : 'Cancelled' },
              ].map((filter) => {
                const isSelected = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`whitespace-nowrap h-8 px-4 rounded-full uppercase border-2 inline-flex items-center justify-center text-xs font-display transition-all shrink-0 ${
                      isSelected
                        ? 'bg-brand-500 text-white font-black border-brand-600 shadow-sm'
                        : 'bg-white text-slate-800 font-extrabold hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* List of Journeys */}
            <div className="space-y-3">
              {filteredReports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                const isDone = rep.journeyStatus === 'RECEIVED';
                const isCancelled = rep.journeyStatus === 'CANCELLED' || rep.journeyStatus === 'EXPIRED';

                return (
                  <div
                    key={rep.id}
                    onClick={() => handleSelectReport(rep.id)}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-teal-50/70 border-brand-500 ring-2 ring-brand-400/20 shadow-card'
                        : 'bg-white border-slate-100 shadow-soft hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-display font-black text-brand-900">
                            {rep.quantity} {rep.unit}
                          </span>
                          <span className="text-xs font-sans font-extrabold text-slate-800">
                            {getFoodDisplayName(rep.foodTypeId, rep.foodName, lang)}
                          </span>
                        </div>

                        {currentUser?.role === 'mitra' ? (
                          <div>
                            <span className="text-xs font-display text-slate-500 block">
                              {isId ? 'Dari Donatur:' : 'From Donor:'} <strong className="text-brand-900 font-bold">{rep.reportedBy?.name || 'Dapur Grand Catering'}</strong>
                            </span>
                            <span className="text-[11px] font-display text-slate-500 block mt-0.5">
                              {isId ? 'Tujuan Masuk:' : 'Intake Destination:'} <strong className="text-slate-800 font-bold">{currentUser?.name || 'Dapur Umum Mandiri'}</strong>
                            </span>
                          </div>
                        ) : currentUser?.role === 'supplier' ? (
                          <div>
                            <span className="text-xs font-display text-slate-500 block">
                              {isId ? 'Dapur Asal:' : 'Origin Kitchen:'} <strong className="text-slate-700 font-bold">{currentUser?.name || 'Dapur Grand Catering'}</strong>
                            </span>
                            <span className="text-[11px] font-display text-slate-500 block mt-0.5">
                              {isId ? 'Mitra Tujuan:' : 'Destination Partner:'} <strong className="text-brand-900 font-bold">{rep.selectedDestination?.name || 'Dapur Umum Mandiri'}</strong>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-display text-slate-500 block">
                            {t.common.destination}: <strong className="text-slate-900 font-bold">{rep.selectedDestination?.name || 'Unassigned'}</strong>
                          </span>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-display font-black px-2.5 py-0.5 rounded-full border ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-950 border-rose-300'
                            : 'bg-sky-100 text-sky-950 border-sky-300'
                        }`}>
                          {isDone
                            ? (currentUser?.role === 'mitra' ? (isId ? '✓ Diterima' : '✓ Received') : '✓ ' + (lang === 'id' ? 'Selesai' : 'Completed'))
                            : isCancelled
                            ? '✕ ' + (lang === 'id' ? 'Dibatalkan' : 'Cancelled')
                            : (lang === 'id' ? 'Sedang Diantar' : 'In Transit')}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(rep.id, e)}
                          className="text-[11px] font-display font-bold text-slate-400 hover:text-coral-600 transition-colors"
                        >
                          {t.journey.deleteBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Journey Detail Timeline */}
          <div ref={timelineRef} className="lg:col-span-7">
            {activeReport ? (
              <JourneyTimeline
                report={activeReport}
                onAdvanceStatus={handleAdvance}
                lang={lang}
                currentUser={currentUser}
              />
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-500 border border-slate-100 font-display">
                {lang === 'id' ? 'Pilih salah satu perjalanan di samping untuk melihat rincian.' : 'Select a journey from the list to view timeline details.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
