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
  lang = getActiveLanguage(),
  currentUser = null
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

    if (nextStep.id === 'RECEIVED') {
      // Role enforcement: Supplier CANNOT confirm receipt on behalf of recipient
      if (currentUser?.role === 'supplier') {
        alert(lang === 'id'
          ? 'Perhatian: Konfirmasi penerimaan pangan hanya dapat dilakukan oleh pihak Mitra Penerima saat makanan tiba di lokasi.'
          : 'Notice: Delivery intake confirmation can only be completed by the recipient partner upon arrival.');
        return;
      }

      const recipientName = currentUser?.role === 'mitra' 
        ? (currentUser.name || 'Dapur Umum Mandiri') 
        : (report.selectedDestination?.name || 'Mitra Penerima');

      const promptMsg = lang === 'id'
        ? `Konfirmasi Penerimaan Pangan (${recipientName})\n\nPastikan pemeriksaan fisik telah memenuhi standar kelayakan & sanitasi.\nMasukkan berat aktual yang diterima (kg):`
        : `Confirm Food Delivery Intake (${recipientName})\n\nEnter actual verified weight received (kg):`;

      const inputWeight = window.prompt(promptMsg, String(report.quantity));
      if (inputWeight === null) return; // cancelled prompt
      const parsedKg = parseFloat(inputWeight);
      const actualReceivedKg = (!isNaN(parsedKg) && parsedKg > 0) ? parsedKg : Number(report.quantity) || 0;

      onAdvanceStatus(report.id, 'RECEIVED', `Diterima di tujuan (${recipientName}): ${actualReceivedKg} kg`, {
        actualReceivedKg,
        receivedAt: new Date().toISOString()
      });
      return;
    }

    onAdvanceStatus(report.id, nextStep.id, undefined);
  };

  // Explicit incident reporting during in-transit state
  const handleReportIncident = () => {
    if (!onAdvanceStatus) return;

    const incidentReasons = lang === 'id' ? [
      'Kurir mengalami kendala armada atau kecelakaan di perjalanan',
      'Kemasan rusak parah atau makanan tumpah saat pengantaran',
      'Lokasi fasilitas penerima tutup atau tidak dapat dihubungi',
      'Suhu makanan jebol di luar batas toleransi (>4 jam holding)',
      'Lainnya (tuliskan kendala)'
    ] : [
      'Courier vehicle breakdown or transit incident',
      'Packaging damaged or food spilled in transit',
      'Recipient facility closed or unreachable',
      'Critical temperature breach in danger zone',
      'Other delivery issue'
    ];

    const promptText = lang === 'id'
      ? `⚠️ LAPORKAN KENDALA PENGIRIMAN (IN-TRANSIT)\n\nPengiriman yang sedang berjalan tidak dapat dibatalkan tanpa alasan kendala nyata.\nPilih nomor (1-4) atau tuliskan kendala yang terjadi:\n1. ${incidentReasons[0]}\n2. ${incidentReasons[1]}\n3. ${incidentReasons[2]}\n4. ${incidentReasons[3]}\n\nKetik alasan kendala:`
      : `⚠️ REPORT DELIVERY INCIDENT (IN-TRANSIT)\n\nIn-transit deliveries require an explicit incident reason.\nChoose or enter reason:\n1. ${incidentReasons[0]}\n2. ${incidentReasons[1]}\n3. ${incidentReasons[2]}\n4. ${incidentReasons[3]}\n\nEnter incident description:`;

    const input = window.prompt(promptText, incidentReasons[0]);
    if (!input || !input.trim()) return;

    const trimmed = input.trim();
    const finalReason = trimmed.length === 1 && !isNaN(trimmed) && incidentReasons[Number(trimmed) - 1]
      ? incidentReasons[Number(trimmed) - 1]
      : trimmed;

    const reporterName = currentUser?.name || (currentUser?.role === 'supplier' ? 'Dapur Donatur' : 'Mitra Penerima');

    onAdvanceStatus(report.id, 'CANCELLED', `Kendala Pengiriman: ${finalReason} (Dilaporkan oleh: ${reporterName})`, {
      isIncidentReport: true,
      cancellationReason: `[KENDALA PENGIRIMAN] ${finalReason}`,
      issueReportedBy: reporterName,
      cancelledAt: new Date().toISOString()
    });
  };

  // Normal cancellation before delivery begins (pre-transit)
  const handleCancelPreTransit = () => {
    if (!onAdvanceStatus) return;

    const defaultReasons = lang === 'id'
      ? ['Kapasitas penerima tidak mencukupi', 'Pengambilan terlewat', 'Perubahan jadwal katering', 'Dibatalkan oleh penyedia']
      : ['Recipient capacity full', 'Pickup missed', 'Schedule change', 'Cancelled by donor'];

    const reasonPrompt = lang === 'id'
      ? `Batalkan Penyaluran Surplus (Pra-Pengiriman):\n1. ${defaultReasons[0]}\n2. ${defaultReasons[1]}\n3. ${defaultReasons[2]}\n4. ${defaultReasons[3]}\n\nKetik alasan pembatalan:`
      : `Cancel Surplus Journey (Pre-Transit):\nEnter cancellation reason:`;

    const inputReason = window.prompt(reasonPrompt, defaultReasons[0]);
    if (!inputReason || !inputReason.trim()) return;

    const trimmed = inputReason.trim();
    const finalReason = trimmed.length === 1 && !isNaN(trimmed) && defaultReasons[Number(trimmed) - 1]
      ? defaultReasons[Number(trimmed) - 1]
      : trimmed;

    onAdvanceStatus(report.id, 'CANCELLED', `Dibatalkan: ${finalReason}`, {
      cancellationReason: finalReason,
      cancelledAt: new Date().toISOString()
    });
  };

  const isCompleted = currentStatus === 'RECEIVED';
  const isCancelled = currentStatus === 'CANCELLED';

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

          {/* User Role Context Pill */}
          {currentUser && (
            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-extrabold bg-teal-50 text-teal-900 border border-brand-300">
                <span>{currentUser.avatar}</span>
                <span>
                  {currentUser.role === 'supplier'
                    ? (lang === 'id' ? 'Pengirim: Dapur Grand Catering' : 'Donor: Dapur Grand Catering')
                    : currentUser.role === 'mitra'
                    ? (lang === 'id' ? 'Penerima: Dapur Umum Mandiri' : 'Receiver: Dapur Umum Mandiri')
                    : (lang === 'id' ? 'Administrator Operasional' : 'Operations Admin')}
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
        ) : isCancelled ? (
          <div className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-300 text-left sm:text-right">
            <span className="block text-[10px] font-display font-bold uppercase tracking-wider text-rose-600">
              {lang === 'id' ? 'Status Terkini' : 'Current Status'}
            </span>
            <span className="text-xs font-display font-black text-rose-700 uppercase">
              ✕ {lang === 'id' ? 'Dibatalkan' : 'Cancelled'}
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

                {step.id === 'MATCHED' && isPassed && (
                  <div className="mt-2 text-xs font-display font-bold bg-sky-50 p-2 rounded-xl inline-flex items-center gap-2 border border-sky-200 text-sky-900">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>
                      {currentUser?.role === 'mitra'
                        ? (lang === 'id' ? 'Donatur: Dapur Grand Catering → Masuk: Dapur Umum Mandiri' : 'Donor: Dapur Grand Catering → Intake: Dapur Umum Mandiri')
                        : currentUser?.role === 'supplier'
                        ? (lang === 'id' ? 'Mitra Penerima: ' : 'Intake Partner: ') + (report.selectedDestination?.name || 'Dapur Umum Mandiri')
                        : (report.selectedDestination?.name || 'Unassigned')}
                    </span>
                    {report.selectedDestination?.demoDistanceKm && (
                      <span className="text-slate-500">({report.selectedDestination.demoDistanceKm} km)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-sans flex items-start gap-2.5">
          <span className="text-base">⚠️</span>
          <div>
            <strong className="font-display font-bold block">
              {lang === 'id' ? 'Pengiriman Dibatalkan / Gagal' : 'Journey Cancelled or Lapsed'}
            </strong>
            <p className="mt-0.5 text-rose-900">
              {report.cancellationReason || (lang === 'id' ? 'Transaksi ditutup sebelum konfirmasi serah terima fisik.' : 'Workflow closed prior to physical receipt.')}
            </p>
          </div>
        </div>
      )}

      {/* Verified Completion Banner */}
      {isCompleted && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-sans space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</span>
            <strong className="font-display font-black text-sm uppercase tracking-wider text-emerald-900">
              {lang === 'id' ? 'Pengiriman Selesai & Terverifikasi (COMPLETED)' : 'Journey Completed & Verified (COMPLETED)'}
            </strong>
          </div>
          <p className="text-emerald-800 leading-relaxed">
            {lang === 'id'
              ? `Makanan telah diterima dan diverifikasi dengan aman di ${report.selectedDestination?.name || 'lokasi mitra'}. Total berat bersih: ${report.actualReceivedKg || report.quantity} kg (${Math.round((report.actualReceivedKg || report.quantity) / 0.35)} porsi terselamatkan). Transaksi telah final dan tidak dapat dibatalkan.`
              : `Food safely received and verified at ${report.selectedDestination?.name || 'partner facility'}. Total verified weight: ${report.actualReceivedKg || report.quantity} kg (${Math.round((report.actualReceivedKg || report.quantity) / 0.35)} servings rescued). Transaction is finalized.`}
          </p>
        </div>
      )}

      {/* Progression Action Buttons */}
      {!readOnly && !isCompleted && !isCancelled && (
        <>
          {/* Status IN_TRANSIT (RESCUE_INITIATED) - Role specific button layout */}
          {currentStatus === 'RESCUE_INITIATED' ? (
            currentUser?.role === 'supplier' ? (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs font-sans flex items-start gap-2.5">
                  <span className="text-base">🚚</span>
                  <div>
                    <strong className="font-display font-bold block">
                      {lang === 'id' ? 'Sedang Dalam Pengantaran (In Transit)' : 'Delivery in Progress (In Transit)'}
                    </strong>
                    <p className="mt-0.5 text-sky-800 leading-relaxed">
                      {lang === 'id'
                        ? 'Kurir armada sedang menuju lokasi tujuan. Konfirmasi penerimaan fisik akan dilakukan oleh pihak Mitra Penerima saat makanan tiba di dapur.'
                        : 'Courier is en route. Physical receipt confirmation will be performed by the recipient partner upon arrival.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReportIncident}
                    className="px-4 py-2.5 rounded-xl text-xs font-display font-bold text-rose-700 hover:bg-rose-50 border border-rose-300 transition-colors flex items-center gap-1.5"
                  >
                    <span>⚠️</span>
                    <span>{lang === 'id' ? 'Laporkan Kendala Pengiriman' : 'Report Delivery Incident'}</span>
                  </button>
                  <span className="text-xs font-display font-semibold text-slate-500">
                    {lang === 'id' ? 'Menunggu Konfirmasi Penerima...' : 'Awaiting Recipient Intake...'}
                  </span>
                </div>
              </div>
            ) : currentUser?.role === 'mitra' ? (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReportIncident}
                  className="text-xs font-display font-bold text-rose-600 hover:text-rose-800 hover:underline py-2"
                >
                  {lang === 'id' ? '⚠️ Laporkan Kendala / Tolak di Lokasi' : '⚠️ Report Issue / Reject on Site'}
                </button>
                <Button
                  variant="sun"
                  size="md"
                  onClick={handleAdvance}
                  icon={CheckCircle2}
                  iconPosition="left"
                  className="w-full sm:w-auto px-6 py-3 text-xs shadow-sun font-display font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {lang === 'id' ? 'Konfirmasi Pangan Tiba & Diterima (Mitra) ✅' : 'Confirm Delivery Intake & Received (Mitra) ✅'}
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleReportIncident}
                  className="px-4 py-2.5 rounded-xl text-xs font-display font-bold text-rose-700 hover:bg-rose-50 border border-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <span>⚠️</span>
                  <span>{lang === 'id' ? 'Laporkan Kendala Pengiriman' : 'Report Delivery Incident'}</span>
                </button>
                <Button
                  variant="sun"
                  size="md"
                  onClick={handleAdvance}
                  icon={CheckCircle2}
                  iconPosition="left"
                  className="w-full sm:w-auto px-6 py-3 text-xs shadow-sun font-display font-black"
                >
                  {lang === 'id' ? 'Konfirmasi Diterima (Admin Override) ✅' : 'Confirm Received (Admin Override) ✅'}
                </Button>
              </div>
            )
          ) : (
            /* Pre-transit Statuses (REPORTED, ASSESSED, ROUTE_SELECTED, MATCHED) */
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCancelPreTransit}
                className="text-xs font-display font-bold text-rose-600 hover:text-rose-800 hover:underline py-2"
              >
                {currentStatus === 'MATCHED'
                  ? (lang === 'id' ? '✕ Batalkan Pengiriman' : '✕ Cancel Journey')
                  : (lang === 'id' ? '✕ Batalkan Transaksi' : '✕ Cancel Transaction')}
              </button>

              {nextStep && (
                <Button
                  variant="sun"
                  size="md"
                  onClick={handleAdvance}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full sm:w-auto px-6 py-3 text-xs shadow-sun font-display font-black"
                >
                  {currentUser?.role === 'supplier' && (currentStatus === 'REPORTED' || currentStatus === 'MATCHED')
                    ? (lang === 'id' ? 'Serahkan ke Kurir / Mulai Penjemputan 🚚' : 'Handover to Logistics 🚚')
                    : (lang === 'id' ? 'Perbarui Status Pengiriman →' : 'Advance Status →')}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
