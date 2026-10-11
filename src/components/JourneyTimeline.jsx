import React from 'react';
import { CheckCircle2, ArrowRight, MapPin } from 'lucide-react';
import { formatTime, formatDate } from '../utils/formatters';
import { getFoodDisplayName } from '../utils/calculations';
import Button from './Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function JourneyTimeline({
  report,
  onAdvanceStatus,
  readOnly = false,
  lang = getActiveLanguage()
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.id;

  if (!report) return null;

  const JOURNEY_STEPS = [
    { id: 'REPORTED', label: t.journey.steps.REPORTED, desc: lang === 'id' ? 'Karakteristik dan kondisi surplus makanan tercatat' : 'Surplus characteristics and condition logged' },
    { id: 'ASSESSED', label: t.journey.steps.ASSESSED, desc: lang === 'id' ? 'Skor kelayakan & rute penanganan selesai dihitung' : 'Rescue score & routing determination computed' },
    { id: 'ROUTE_SELECTED', label: t.journey.steps.ROUTE_SELECTED, desc: lang === 'id' ? 'Strategi rute penanganan disetujui' : 'Disposal diversion strategy locked' },
    { id: 'MATCHED', label: t.journey.steps.MATCHED, desc: lang === 'id' ? 'Dipasangkan dengan organisasi penerima terdekat' : 'Paired with high-compatibility intake organization' },
    { id: 'RESCUE_INITIATED', label: t.journey.steps.RESCUE_INITIATED, desc: lang === 'id' ? 'Kurir bergerak / penjemputan dalam perjalanan' : 'Logistics in motion / transfer in progress' },
    { id: 'RECEIVED', label: t.journey.steps.RECEIVED, desc: lang === 'id' ? 'Makanan diterima dan diverifikasi aman di tujuan' : 'Food safely received and verified at destination' }
  ];

  const currentStatus = report.journeyStatus || 'REPORTED';
  const currentIndex = JOURNEY_STEPS.findIndex(s => s.id === currentStatus);
  const events = report.journeyEvents || [];

  const getEventForStep = (stepId) => {
    return events.find(e => e.status === stepId);
  };

  const nextStep = currentIndex < JOURNEY_STEPS.length - 1 ? JOURNEY_STEPS[currentIndex + 1] : null;

  const handleAdvance = () => {
    if (!nextStep || !onAdvanceStatus) return;
    onAdvanceStatus(report.id, nextStep.id, undefined);
  };

  const isCompleted = currentStatus === 'RECEIVED';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8 space-y-6">
      {/* Journey Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="block text-xs font-display font-extrabold uppercase tracking-wider text-brand-600 mb-1">
            🚚 {lang === 'id' ? 'Protokol Pengiriman Makanan' : 'Rescue Journey Protocol'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {report.quantity} {report.unit} {getFoodDisplayName(report.foodTypeId, report.foodName, lang)}
          </h3>
          <p className="text-xs font-sans font-semibold text-slate-500 mt-1">
            ID: <span className="text-slate-800 font-bold">{report.id}</span> • {formatDate(report.createdAt)}
          </p>

          {/* Food Safety Gate Status Pill */}
          {report.foodSafetyGate && (
            <div className="pt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-black border ${
                report.foodSafetyGate.status === 'PASS'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                  : report.foodSafetyGate.status === 'REVIEW'
                  ? 'bg-amber-50 text-amber-950 border-amber-300'
                  : 'bg-rose-50 text-rose-950 border-rose-300'
              }`}>
                <span>🛡️ Safety Gate: {report.foodSafetyGate.status}</span>
                <span className="font-normal opacity-75">
                  ({report.foodSafetyGate.status === 'PASS' 
                    ? (lang === 'id' ? 'Lolos Awal' : 'Screened Pass') 
                    : report.foodSafetyGate.status === 'REVIEW'
                    ? (lang === 'id' ? 'Review Diperlukan' : 'Review Needed')
                    : (lang === 'id' ? 'Ditolak Konsumsi' : 'Inedible')})
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Milestone Badge */}
        {isCompleted ? (
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-100 via-teal-100 to-sky-100 border border-emerald-300 text-center sm:text-right shadow-sm">
            <span className="block text-2xl font-display font-black text-emerald-900">
              🎉 {report.quantity} {report.unit}
            </span>
            <span className="block text-[11px] font-display font-extrabold tracking-wider uppercase text-emerald-800">
              {lang === 'id' ? 'BERHASIL DISELAMATKAN' : 'SUCCESSFULLY RESCUED'}
            </span>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-left sm:text-right">
            <span className="block text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
              {lang === 'id' ? 'Status Terkini' : 'Current Status'}
            </span>
            <span className="text-xs font-display font-black text-brand-700 uppercase">
              {t.journey.steps[currentStatus] || currentStatus.replace('_', ' ')} 🚚
            </span>
          </div>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="relative py-4 pl-4 sm:pl-6 space-y-6 before:absolute before:left-[19px] sm:before:left-[27px] before:top-8 before:bottom-8 before:w-1 before:bg-slate-100">
        {JOURNEY_STEPS.map((step, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const recordedEvent = getEventForStep(step.id);
          const timeLabel = recordedEvent ? formatTime(recordedEvent.timestamp) : (lang === 'id' ? 'Menunggu' : 'Pending');

          return (
            <div key={step.id} className="relative flex items-start gap-4 sm:gap-5 group">
              {/* Timeline Icon Node */}
              <div
                className={`relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all shadow-sm ${
                  isPassed
                    ? 'bg-brand-500 border-brand-400 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-brand-200 scale-105' : ''}`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 font-bold" />
                ) : (
                  <span className="font-display font-bold text-xs">{idx + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-display font-extrabold uppercase tracking-wider ${
                      isCurrent ? 'text-brand-700' : isPassed ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="inline-block w-2 h-2 rounded-full bg-sun-500 animate-pulse" />
                    )}
                  </div>

                  <span className="text-xs font-display font-bold text-slate-400">
                    {timeLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-0.5 font-sans">
                  {recordedEvent?.note || step.desc}
                </p>

                {step.id === 'MATCHED' && isPassed && report.selectedDestination && (
                  <div className="mt-2 text-xs font-display font-bold bg-sky-50 p-2 rounded-xl inline-flex items-center gap-2 border border-sky-200 text-sky-900">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" />
                    <span>{report.selectedDestination.name}</span>
                    <span className="text-slate-500">({report.selectedDestination.demoDistanceKm} km)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progression Action Button */}
      {!readOnly && nextStep && (
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="sun"
            size="md"
            onClick={handleAdvance}
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto px-6 py-3 text-xs shadow-sun font-display font-black"
          >
            {nextStep.id === 'RECEIVED'
              ? (lang === 'id' ? 'Konfirmasi Diterima & Terselamatkan 🎉' : 'Confirm Received & Rescued 🎉')
              : (lang === 'id' ? 'Perbarui Status Pengiriman →' : 'Advance Status →')}
          </Button>
        </div>
      )}
    </div>
  );
}
