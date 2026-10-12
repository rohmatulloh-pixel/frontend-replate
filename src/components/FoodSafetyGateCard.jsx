import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Thermometer, 
  Box, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import Button from './Button';
import { getActiveLanguage } from '../utils/i18n';

export default function FoodSafetyGateCard({
  gateResult,
  onEditParameters,
  onOpenMethodology,
  lang = getActiveLanguage()
}) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (e) => setCurrentLang(e.detail || getActiveLanguage());
    window.addEventListener('replate:language-change', handleLangChange);
    return () => window.removeEventListener('replate:language-change', handleLangChange);
  }, []);

  const [showParameters, setShowParameters] = useState(false);
  const isId = currentLang === 'id';

  if (!gateResult) return null;

  const {
    status = 'REVIEW',
    headline = '',
    summary = '',
    reasons = [],
    missingInformation = [],
    parametersChecked = {},
    alternativeRouteRecommendation = null,
    citations = []
  } = gateResult;

  // Status Styling Configuration
  const statusConfig = {
    PASS: {
      badgeBg: 'bg-emerald-50 border-emerald-400/40 text-emerald-950',
      pillBg: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-300',
      headerBg: 'from-emerald-50 via-teal-50 to-sky-50',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      tagText: isId ? 'LOLOS PEMERIKSAAN AWAL' : 'PASSED INITIAL SCREENING',
      subNotice: isId
        ? 'Lolos pemeriksaan awal berdasarkan informasi yang dimasukkan pengguna (bukan sertifikasi resmi).'
        : 'Passed initial screening based on user-provided data (not an official food safety certificate).'
    },
    REVIEW: {
      badgeBg: 'bg-amber-50 border-amber-400/40 text-amber-950',
      pillBg: 'bg-amber-500 text-white',
      borderClass: 'border-amber-300',
      headerBg: 'from-amber-50 via-orange-50 to-yellow-50',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      tagText: isId ? 'MEMERLUKAN PEMERIKSAAN LANJUTAN' : 'FURTHER INSPECTION REQUIRED',
      subNotice: isId
        ? 'Rekomendasi penyaluran konsumsi DITAHAN sementara. Terdapat data penting yang belum terverifikasi.'
        : 'Consumption routing is HELD PENDING. Critical safety parameters require on-site verification.'
    },
    REJECT: {
      badgeBg: 'bg-rose-50 border-rose-400/40 text-rose-950',
      pillBg: 'bg-rose-600 text-white',
      borderClass: 'border-rose-300',
      headerBg: 'from-rose-50 via-red-50 to-orange-50',
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      tagText: isId ? 'TIDAK LAYAK KONSUMSI MANUSIA' : 'UNFIT FOR HUMAN CONSUMPTION',
      subNotice: isId
        ? 'Makanan melanggar standar keselamatan pangan. Dilarang keras disalurkan untuk konsumsi manusia!'
        : 'Food breaches safety rules. Strictly prohibited from distribution for human consumption!'
    }
  };

  const currentConfig = statusConfig[status] || statusConfig.REVIEW;
  const StatusIcon = currentConfig.icon;

  return (
    <div className={`rounded-3xl border-2 ${currentConfig.borderClass} bg-white shadow-card overflow-hidden transition-all space-y-0`}>
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 bg-gradient-to-r ${currentConfig.headerBg} border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0">
            <StatusIcon className={`w-8 h-8 ${currentConfig.iconColor}`} />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-display font-extrabold uppercase tracking-wider text-slate-500">
                REPLATE FOOD SAFETY GATE v1.0
              </span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-display font-black tracking-wide ${currentConfig.pillBg} shadow-xs`}>
                {status}: {currentConfig.tagText}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">
              {headline}
            </h2>

            <p className="text-xs sm:text-sm font-sans font-semibold text-slate-700 max-w-2xl leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          {onEditParameters && (
            <Button
              variant={status === 'PASS' ? 'secondary' : 'primary'}
              size="sm"
              onClick={onEditParameters}
              className="text-xs font-display font-bold whitespace-nowrap shadow-sm"
            >
              {status === 'PASS' 
                ? (isId ? 'Periksa / Ubah Input' : 'Review / Edit Input')
                : (isId ? '✏️ Lengkapi Data Pemeriksaan' : '✏️ Complete Missing Data')}
            </Button>
          )}

          {onOpenMethodology && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenMethodology}
              icon={Info}
              className="text-xs font-display font-bold whitespace-nowrap bg-white/80"
            >
              {isId ? 'Metodologi & Sumber' : 'Methodology & Sources'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Warning / Reason Callout */}
        {reasons && reasons.length > 0 && (
          <div className={`p-4 sm:p-5 rounded-2xl border ${currentConfig.badgeBg} space-y-2`}>
            <span className="block text-xs font-display font-black uppercase tracking-wider">
              {status === 'REJECT' 
                ? (isId ? 'Alasan Penolakan Rekomendasi Konsumsi:' : 'Reasons for Consumption Rejection:') 
                : (isId ? 'Catatan Perhatian & Verifikasi Lanjutan:' : 'Points Requiring Verification:')}
            </span>
            <ul className="space-y-1.5 text-xs font-sans font-semibold">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Information Checklist for REVIEW */}
        {status === 'REVIEW' && missingInformation.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-300 space-y-2">
            <span className="block text-xs font-display font-black uppercase tracking-wider text-amber-950">
              {isId ? 'Informasi yang Masih Perlu Dilengkapi / Diverifikasi:' : 'Information Required to Proceed:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans font-semibold text-amber-900">
              {missingInformation.map((info, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/70 p-2 rounded-xl border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternative Route Recommendation for REJECT */}
        {status === 'REJECT' && alternativeRouteRecommendation && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center gap-2 text-sun-300 font-display font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-sun-400" />
              <span>{isId ? 'Rekomendasi Penanganan Alternatif Non-Konsumsi' : 'Non-Consumption Alternative Handling'}</span>
            </div>

            <h4 className="text-lg font-display font-black text-white">
              {alternativeRouteRecommendation.title}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
              {alternativeRouteRecommendation.description}
            </p>

            <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-amber-200 font-sans font-semibold">
              <strong>{isId ? 'Petunjuk Keamanan: ' : 'Safety Directive: '}</strong>
              {alternativeRouteRecommendation.safeHandlingInstructions}
            </div>
          </div>
        )}

        {/* Expandable Parameter Audit Breakdown */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowParameters(!showParameters)}
            className="w-full flex items-center justify-between py-2 text-xs font-display font-extrabold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
          >
            <span>
              {isId 
                ? `Rincian 6 Parameter Pemeriksaan (${showParameters ? 'Sembunyikan' : 'Tampilkan'})`
                : `6 Safety Parameters Inspection Detail (${showParameters ? 'Hide' : 'Show'})`}
            </span>
            {showParameters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showParameters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 animate-fadeIn">
              {/* Parameter 1: Food Type */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '01. Kategori Pangan' : '01. Food Category'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs font-display font-black text-slate-900">
                  {parametersChecked.foodType?.name || 'Surplus Food'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.foodType?.note}
                </p>
              </div>

              {/* Parameter 2: Condition */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '02. Kondisi Sensoris' : '02. Sensory Condition'}</span>
                  {parametersChecked.condition?.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : parametersChecked.condition?.status === 'review' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-xs font-display font-black text-slate-900 capitalize">
                  {parametersChecked.condition?.value?.replace(/_/g, ' ') || '-'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.condition?.note}
                </p>
              </div>

              {/* Parameter 3: Storage History */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '03. Riwayat Suhu' : '03. Storage & Temperature'}</span>
                  {parametersChecked.storageHistory?.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : parametersChecked.storageHistory?.status === 'review' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-xs font-display font-black text-slate-900 capitalize">
                  {parametersChecked.storageHistory?.tempCondition?.replace(/_/g, ' ') || 'Suhu Standard'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.storageHistory?.note}
                </p>
              </div>

              {/* Parameter 4: Timing */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '04. Waktu & Kedaluwarsa' : '04. Timing & Expiry'}</span>
                  {parametersChecked.timing?.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : parametersChecked.timing?.status === 'review' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-xs font-display font-black text-slate-900">
                  {parametersChecked.timing?.timeWindowId || 'Standard Window'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.timing?.note}
                </p>
              </div>

              {/* Parameter 5: Packaging */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '05. Integritas Kemasan' : '05. Packaging Integrity'}</span>
                  {parametersChecked.packaging?.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : parametersChecked.packaging?.status === 'review' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                </div>
                <p className="text-xs font-display font-black text-slate-900 capitalize">
                  {parametersChecked.packaging?.value?.replace(/_/g, ' ') || 'Intact'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.packaging?.note}
                </p>
              </div>

              {/* Parameter 6: Handling & Source */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs font-display font-bold text-slate-500">
                  <span>{isId ? '06. Penanganan & Pemisahan' : '06. Handling & Separation'}</span>
                  {parametersChecked.handlingSource?.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <p className="text-xs font-display font-black text-slate-900 capitalize">
                  {parametersChecked.handlingSource?.value?.replace(/_/g, ' ') || 'Hygienic'}
                </p>
                <p className="text-[11px] text-slate-500 font-sans">
                  {parametersChecked.handlingSource?.note}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Transparent Citations Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-sans">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-700">
              {isId ? 'Rujukan Pedoman Resmi:' : 'Official Regulatory Basis:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.who.int/news-room/fact-sheets/detail/food-safety"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold underline"
              >
                <span>WHO</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href="https://kemkes.go.id/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold underline"
              >
                <span>Kemenkes RI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>•</span>
              <a
                href="https://www.pom.go.id/berita/keamanan-pangan-jajanan-anak-sekolah-%28pjas%29"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold underline"
              >
                <span>BPOM RI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            {currentConfig.subNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
