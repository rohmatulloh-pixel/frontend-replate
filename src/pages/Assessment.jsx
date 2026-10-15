import React, { useState, useEffect, useMemo } from 'react';
import { calculateRescueScore } from '../engine/rescueScore';
import { determineRoute } from '../engine/routeEngine';
import { matchDestinations } from '../engine/matchingEngine';
import { evaluateFoodSafetyGate } from '../engine/foodSafetyGate';
import { getFoodDisplayName } from '../utils/calculations';
import FoodSafetyGateCard from '../components/FoodSafetyGateCard';
import EditSafetyModal from '../components/EditSafetyModal';
import ScoreBreakdown from '../components/ScoreBreakdown';
import MatchCard from '../components/MatchCard';
import { RouteBadge } from '../components/StatusBadge';
import Button from '../components/Button';
import { AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Assessment({
  pendingReport,
  onDestinationSelected,
  onNavigate,
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

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.id;
  const isId = currentLang === 'id';

  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmOrganicModalOpen, setConfirmOrganicModalOpen] = useState(false);
  const [targetOrganicDestination, setTargetOrganicDestination] = useState(null);

  // Editable local state in case user modifies parameters inside Assessment
  const [currentReport, setCurrentReport] = useState(() => pendingReport || {
    foodTypeId: 'cooked-rice',
    foodName: isId ? 'Nasi Matang' : 'Cooked Rice',
    quantity: 8,
    unit: 'kg',
    conditionId: 'suitable',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    preparedAt: '',
    storageDurationHours: '1.5',
    expiryDate: '',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    timeWindowId: '1_3h',
    sourceContextId: 'Catering',
    notes: 'Surplus catering pans.'
  });

  // Sync if pendingReport prop updates
  useEffect(() => {
    if (pendingReport) {
      setCurrentReport(pendingReport);
    }
  }, [pendingReport]);

  // 1. Evaluate Food Safety Gate FIRST
  const foodSafetyGate = useMemo(() => {
    return evaluateFoodSafetyGate(currentReport, currentLang);
  }, [currentReport, currentLang]);

  // 2. Evaluate Rescue Score, Route Engine, and Matching Engine with Gate Constraints
  const assessmentResult = useMemo(() => {
    const scoreResult = calculateRescueScore(currentReport, currentLang, foodSafetyGate);
    const routeResult = determineRoute({
      ...currentReport,
      foodSafetyGate
    }, currentLang);

    const matchedDestinations = matchDestinations({
      foodTypeId: currentReport.foodTypeId,
      quantity: currentReport.quantity,
      unit: currentReport.unit,
      recommendedRoute: routeResult.route,
      timeWindowId: currentReport.timeWindowId,
      foodSafetyGate
    }, currentLang);

    return {
      score: scoreResult.score,
      priority: scoreResult.priority,
      priorityMeta: scoreResult.priorityMeta,
      scoreBreakdown: scoreResult.breakdown,
      rationale: scoreResult.rationale,
      route: routeResult.route,
      routeMeta: routeResult.routeMeta,
      routeWhy: routeResult.why,
      safetyNotice: routeResult.safetyNotice,
      matches: matchedDestinations,
      gate: foodSafetyGate
    };
  }, [currentReport, currentLang, foodSafetyGate]);


  const handleUpdateSafetyParameters = (updatedFields) => {
    setCurrentReport(prev => ({
      ...prev,
      ...updatedFields
    }));
    setSelectedDestinationId(null);
  };

  const handleSelectDestination = (destination, matchScore) => {
    // Strict Gate Boundary: Cannot select human consumption destination if REVIEW or REJECT
    if (foodSafetyGate.status === 'REVIEW') {
      alert(isId 
        ? 'Penyaluran ditahan! Mohon lengkapi atau perbaiki parameter pemeriksaan Food Safety Gate terlebih dahulu.'
        : 'Dispatch held! Please complete or update Food Safety Gate inspection parameters first.');
      return;
    }

    if (foodSafetyGate.status === 'REJECT') {
      // If organic destination is clicked, show explicit confirmation modal
      if (destination.preferredRoutes.includes('ORGANIC')) {
        setTargetOrganicDestination(destination);
        setConfirmOrganicModalOpen(true);
        return;
      }
      alert(isId
        ? 'Makanan berstatus REJECT tidak boleh disalurkan untuk konsumsi manusia!'
        : 'REJECT surplus cannot be dispatched for human consumption!');
      return;
    }

    setSelectedDestinationId(destination.id);
    if (onDestinationSelected) {
      onDestinationSelected({
        ...currentReport,
        foodSafetyGate,
        rescueScore: assessmentResult.score,
        priority: assessmentResult.priority,
        recommendedRoute: assessmentResult.route,
        selectedDestination: destination,
        matchScore: matchScore,
        journeyStatus: 'MATCHED'
      });
    }
  };

  const handleConfirmOrganicDispatch = () => {
    if (!targetOrganicDestination) return;
    setConfirmOrganicModalOpen(false);
    setSelectedDestinationId(targetOrganicDestination.id);
    if (onDestinationSelected) {
      onDestinationSelected({
        ...currentReport,
        foodSafetyGate,
        rescueScore: 0, // Inedible
        priority: 'ORGANIC RECOVERY',
        recommendedRoute: 'ORGANIC',
        selectedDestination: targetOrganicDestination,
        matchScore: 90,
        journeyStatus: 'MATCHED'
      });
    }
  };

  const bestMatch = assessmentResult.matches[0];
  const otherMatches = assessmentResult.matches.slice(1);


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-200/60">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-display font-bold text-xs mb-1.5 shadow-2xs">
            <span>{isId ? 'Langkah 2 dari 3: Penilaian & Pemilihan Rute' : 'Step 2 of 3: Assessment & Routing'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-brand-900 tracking-tight">
            {t.assessment.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans font-semibold">
            {t.assessment.subtitle} <strong>{currentReport.quantity} {currentReport.unit} {getFoodDisplayName(currentReport.foodTypeId, currentReport.foodName, lang)}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('report')}
            icon={ArrowLeft}
            className="text-xs font-display font-bold"
          >
            {isId ? 'Kembali ke Form Lapor' : 'Back to Report Form'}
          </Button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. FOOD SAFETY GATE CARD (Mandatory Top Gatekeeper) */}
      {/* ======================================================== */}
      <FoodSafetyGateCard
        gateResult={foodSafetyGate}
        onEditParameters={() => setEditModalOpen(true)}
        onOpenMethodology={() => onNavigate('learn')}
        lang={lang}
      />

      {/* ======================================================== */}
      {/* 2. RESCUE SCORE & ROUTE RECOMMENDATION (Respects Gate) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Score Breakdown */}
        <div className="lg:col-span-7">
          {foodSafetyGate.status === 'PASS' ? (
            <ScoreBreakdown
              score={assessmentResult.score}
              priority={assessmentResult.priority}
              breakdown={assessmentResult.scoreBreakdown}
              rationale={assessmentResult.rationale}
              lang={lang}
            />
          ) : foodSafetyGate.status === 'REVIEW' ? (
            <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 text-amber-800">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-xs font-display font-extrabold uppercase tracking-wider text-amber-700">
                    {isId ? 'RESCUE SCORE DITAHAN' : 'RESCUE SCORE HELD'}
                  </span>
                  <h3 className="text-xl font-display font-black text-amber-950">
                    {isId ? 'Belum Dapat Dinilai untuk Prioritas Konsumsi' : 'Pending Safety Verification'}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-semibold">
                {isId
                  ? 'Karena Food Safety Gate berstatus REVIEW, skor kelayakan redistribusi pangan ditangguhkan sementara. Makanan tidak dapat diprioritaskan sebelum riwayat suhu atau data wajib lainnya terverifikasi secara akurat.'
                  : 'Because Food Safety Gate is in REVIEW status, rescue score prioritization is held. Food cannot be prioritized for consumption dispatch before thermal holding history or missing criteria are verified.'}
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs font-sans text-amber-900 space-y-2">
                <p className="font-bold">
                  {isId ? 'Langkah yang Diperlukan:' : 'Required Action:'}
                </p>
                <p>
                  {isId
                    ? 'Klik tombol "Lengkapi Data Pemeriksaan" di atas untuk melengkapi riwayat suhu atau melakukan konfirmasi sensoris.'
                    : 'Click "Complete Missing Data" above to provide storage temperature or sensory confirmation.'}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="w-full text-xs font-display font-bold shadow-sm"
                >
                  {isId ? '✏️ Lengkapi Data Pemeriksaan Sekarang' : '✏️ Complete Missing Inspection Data'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-rose-300 p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center gap-2.5 text-rose-800">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <span className="block text-xs font-display font-extrabold uppercase tracking-wider text-rose-700">
                    {isId ? 'RESCUE SCORE DIBATALKAN' : 'RESCUE SCORE VOID'}
                  </span>
                  <h3 className="text-xl font-display font-black text-rose-950">
                    {isId ? 'Tidak Berlaku untuk Konsumsi Manusia' : 'Ineligible for Human Nourishment'}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-semibold">
                {isId
                  ? 'Makanan telah dinyatakan REJECT oleh Food Safety Gate. Skor viabilitas konsumsi dibatalkan secara permanen dan tidak dapat mengesampingkan pelanggaran keselamatan pangan.'
                  : 'Food has been evaluated as REJECT by Food Safety Gate. Prioritization score is voided and cannot override food safety violations.'}
              </p>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-sans text-rose-900">
                <strong>{isId ? 'Pemberitahuan Kepatuhan: ' : 'Compliance Notice: '}</strong>
                {isId
                  ? 'Penyaluran ke bank makanan, dapur umum, atau panti asuhan DIBLOKIR demi keselamatan publik.'
                  : 'Routing to food banks, soup kitchens, or community shelters is STRICTLY BLOCKED for public health.'}
              </div>
            </div>
          )}
        </div>

        {/* Right: Route Recommendation */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-8 space-y-5">
          <div>
            <span className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              {t.assessment.recommendedRoute}
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-display font-black text-brand-900">
                {assessmentResult.routeMeta.title}
              </span>
            </div>
            <div className="mt-2">
              <RouteBadge route={assessmentResult.route} className="text-xs px-3 py-1 font-extrabold" lang={lang} />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans font-semibold">
            {assessmentResult.routeMeta.tagline}
          </p>

          {/* Safety Notice Callout */}
          {assessmentResult.safetyNotice && (
            <div className={`p-3 rounded-xl border text-xs font-sans font-semibold ${
              foodSafetyGate.status === 'REJECT'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : foodSafetyGate.status === 'REVIEW'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}>
              {assessmentResult.safetyNotice}
            </div>
          )}

          {/* Explainable Why Points */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-400">
              {t.assessment.whyRoute}
            </span>
            <ul className="space-y-1.5 text-xs font-sans text-slate-700">
              {assessmentResult.routeWhy.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DESTINATION MATCHES SECTION (Respects Gate) */}
      {/* ======================================================== */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-900 tracking-tight">
              {foodSafetyGate.status === 'REJECT'
                ? (isId ? 'Mitra Pengolahan Non-Konsumsi yang Sesuai' : 'Non-Consumption Recovery Partners')
                : t.assessment.destinationsTitle}
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              {foodSafetyGate.status === 'REJECT'
                ? (isId ? 'Hanya menampilkan fasilitas daur ulang biologis / kompos. Mitra pangan manusia ditiadakan.' : 'Only showing organic facilities. Human food partners excluded.')
                : foodSafetyGate.status === 'REVIEW'
                ? (isId ? 'Penyaluran terkunci sementara hingga pemeriksaan keamanan pangan selesai.' : 'Intake locked until food safety screening is completed.')
                : (isId ? 'Diurutkan berdasarkan skor kompatibilitas rute, kapasitas, dan jarak terdekat.' : 'Ranked by route fit, capacity, and proximity.')}
            </p>
          </div>
        </div>

        {/* If REJECT with Controlled Disposal (No Partners) */}
        {foodSafetyGate.status === 'REJECT' && assessmentResult.matches.length === 0 && (
          <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-200 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
            <h3 className="text-xl font-display font-black text-rose-950">
              {isId ? 'Tidak Ada Mitra Penyaluran Pangan yang Memenuhi Syarat' : 'No Eligible Donation Partners'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-sans leading-relaxed">
              {isId
                ? 'Karena makanan memiliki indikasi bahaya kontaminasi fisik/kimia/botulisme, bahan ini tidak boleh dikirim ke bank makanan maupun tempat kompos terbuka. Lakukan pembuangan aman melalui sanitasi kota berizin.'
                : 'Because surplus exhibits chemical, physical, or botulism hazards, it cannot be routed to food banks or open composting. Dispose safely via municipal sanitation.'}
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('report')}
                className="text-xs font-display font-bold"
              >
                {isId ? 'Buat Laporan Surplus Baru' : 'Submit New Surplus Report'}
              </Button>
            </div>
          </div>
        )}

        {/* If REVIEW: Show locked cards with explanation */}
        {foodSafetyGate.status === 'REVIEW' && (
          <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-display font-black">
                  {isId ? 'Tombol Pemilihan Mitra Dinonaktifkan' : 'Partner Selection Disabled'}
                </p>
                <p className="text-xs text-amber-800 font-sans mt-0.5">
                  {isId
                    ? 'Selesaikan pemeriksaan Food Safety Gate untuk membuka tombol pemilihan mitra penampung.'
                    : 'Complete Food Safety Gate screening to unlock partner selection.'}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="text-xs whitespace-nowrap font-display font-black"
            >
              {isId ? '✏️ Lengkapi Pemeriksaan' : '✏️ Complete Screening'}
            </Button>
          </div>
        )}

        {/* Best Match Top Card */}
        {bestMatch && (
          <MatchCard
            match={bestMatch}
            isBestMatch={true}
            selected={selectedDestinationId === bestMatch.destination.id}
            onSelect={handleSelectDestination}
            lang={lang}
          />
        )}

        {/* Alternative Matches */}
        {otherMatches.length > 0 && (
          <div className="space-y-4 pt-2">
            {otherMatches.map((match) => (
              <MatchCard
                key={match.destination.id}
                match={match}
                isBestMatch={false}
                selected={selectedDestinationId === match.destination.id}
                onSelect={handleSelectDestination}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Safety Parameters Modal */}
      <EditSafetyModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={currentReport}
        onSave={handleUpdateSafetyParameters}
        lang={lang}
      />

      {/* Explicit Confirmation Dialog for Organic Dispatch of REJECT Food */}
      {confirmOrganicModalOpen && targetOrganicDestination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 shadow-card space-y-5">
            <div className="flex items-center gap-3 text-amber-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-lg font-display font-black text-brand-900">
                  {isId ? 'Konfirmasi Pengalihan Organik (Bukan Pangan)' : 'Confirm Organic Diversion'}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  {isId ? 'Peringatan Ketat Keamanan Pangan' : 'Strict Food Safety Notice'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-semibold">
              {isId
                ? `Makanan ini telah berstatus REJECT untuk konsumsi manusia. Apakah Anda yakin ingin mengirimkannya khusus ke fasilitas pengomposan industri "${targetOrganicDestination.name}" untuk pencegahan emisi metana?`
                : `This surplus is REJECTED for human consumption. Are you sure you wish to dispatch it strictly to the industrial composting facility "${targetOrganicDestination.name}" to prevent methane emissions?`}
            </p>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-sans">
              <strong>{isId ? 'Larangan Keras: ' : 'Strict Prohibition: '}</strong>
              {isId
                ? 'Dilarang keras disajikan kepada siapapun atau dialihkan menjadi pakan ternak tanpa izin.'
                : 'Prohibited from human consumption or unauthorized swill feeding.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmOrganicModalOpen(false)}
                className="text-xs"
              >
                {isId ? 'Batal' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmOrganicDispatch}
                className="text-xs font-display font-black bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isId ? 'Konfirmasi Kirim ke Kompos 🌿' : 'Confirm Dispatch to Compost 🌿'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
