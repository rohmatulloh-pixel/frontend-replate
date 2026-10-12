import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getReports, updateJourneyStatus, deleteReport, loadDemoData } from '../utils/storage';
import { getFoodDisplayName } from '../utils/calculations';
import JourneyTimeline from '../components/JourneyTimeline';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Journey({ onNavigate, lang = getActiveLanguage() }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;

  const [reports, setReports] = useState(() => getReports());
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [selectedReportId, setSelectedReportId] = useState(() => {
    const initial = getReports();
    return initial.length > 0 ? initial[0].id : null;
  });

  const refreshReports = () => {
    const data = getReports();
    setReports(data);
  };

  useEffect(() => {
    window.addEventListener('replate:storage-update', refreshReports);
    return () => window.removeEventListener('replate:storage-update', refreshReports);
  }, []);

  const handleAdvance = (id, newStatus, note, extraPayload) => {
    updateJourneyStatus(id, newStatus, note, extraPayload);
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

  const activeReport = reports.find(r => r.id === selectedReportId) || filteredReports[0] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-200/60">
        <div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight">
            {t.journey.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-sans font-semibold mt-1">
            {t.journey.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="sun"
            size="sm"
            onClick={() => onNavigate('report')}
            icon={Plus}
            className="text-xs px-5 py-2.5 shadow-sun font-display font-extrabold"
          >
            {t.journey.newRescue}
          </Button>
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
            {/* Filter Pills with 100% Readable High-Contrast Buttons */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-display">
              <span className="text-slate-500 font-extrabold mr-1">Filter:</span>
              {[
                { id: 'ALL', label: t.journey.filterAll },
                { id: 'ACTIVE', label: t.journey.filterActive },
                { id: 'COMPLETED', label: t.journey.filterCompleted },
                { id: 'CANCELLED', label: lang === 'id' ? 'Batal' : 'Cancelled' },
              ].map((filter) => {
                const isSelected = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-1.5 rounded-full uppercase border-2 transition-all ${
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

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedReportId(rep.id)}
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
                        <span className="text-xs font-display text-slate-500 block">
                          {t.common.destination}: <strong className="text-slate-900 font-bold">{rep.selectedDestination?.name || 'Unassigned'}</strong>
                        </span>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-display font-black px-2.5 py-0.5 rounded-full border ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : 'bg-sky-100 text-sky-950 border-sky-300'
                        }`}>
                          {isDone ? '✓ ' + (lang === 'id' ? 'Selesai' : 'Completed') : (lang === 'id' ? 'Sedang Diantar' : 'In Transit')}
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
          <div className="lg:col-span-7">
            {activeReport ? (
              <JourneyTimeline
                report={activeReport}
                onAdvanceStatus={handleAdvance}
                lang={lang}
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
