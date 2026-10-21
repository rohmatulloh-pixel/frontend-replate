import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ExternalLink, 
  BookOpen, 
  GitFork, 
  Repeat, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getLearnModules } from '../data/learning';
import { OFFICIAL_SAFETY_SOURCES } from '../engine/foodSafetyGate';
import Button from '../components/Button';
import { getActiveLanguage } from '../utils/i18n';

export default function Learn({ onNavigate, lang = getActiveLanguage() }) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());

  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const handleLangChange = (e) => {
      setCurrentLang(e.detail || getActiveLanguage());
    };
    window.addEventListener('replate:language-change', handleLangChange);
    return () => window.removeEventListener('replate:language-change', handleLangChange);
  }, []);

  const isId = currentLang === 'id';
  const modules = getLearnModules(currentLang);
  const [activeTab, setActiveTab] = useState('safety-gate'); // 'safety-gate' | 'learning-modules'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fadeIn">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight">
          {isId ? 'Metodologi & Landasan Sains REPLATE' : 'REPLATE Methodology & Scientific Foundation'}
        </h1>

        <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 leading-relaxed">
          {isId
            ? 'Dokumentasi terbuka mengenai prinsip keamanan pangan, algoritma keputusan deterministik, sumber rujukan resmi, serta batasan operasional platform.'
            : 'Transparent documentation covering food safety principles, deterministic decision algorithms, official regulatory sources, and system operational boundaries.'}
        </p>

        {/* Tab Navigation Switcher */}
        <div className="pt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('safety-gate')}
            className={`px-5 py-2.5 rounded-full text-xs font-display font-black transition-all ${
              activeTab === 'safety-gate'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            🛡️ {isId ? 'Metodologi Food Safety Gate' : 'Food Safety Gate Methodology'}
          </button>
          <button
            onClick={() => setActiveTab('learning-modules')}
            className={`px-5 py-2.5 rounded-full text-xs font-display font-black transition-all ${
              activeTab === 'learning-modules'
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            📚 {isId ? 'Modul Edukasi Rantai Pasok' : 'Supply Chain Learning Modules'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: FOOD SAFETY GATE METHODOLOGY */}
      {/* ======================================================== */}
      {activeTab === 'safety-gate' && (
        <div className="space-y-10 animate-fadeIn">
          {/* Conceptual Foundation Banner */}
          <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-amber-50 rounded-3xl p-6 sm:p-10 border border-brand-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-display font-extrabold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{isId ? 'Prinsip Gerbang Keamanan Pangan (Gatekeeper Principle)' : 'Gatekeeper Principle'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-900">
              {isId 
                ? 'Mengapa Keamanan Pangan Diperiksa Sebelum Rescue Score?' 
                : 'Why Food Safety is Evaluated Before Rescue Score?'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 font-sans font-semibold leading-relaxed max-w-3xl">
              {isId
                ? 'Di dunia nyata, surplus makanan tidak memiliki nilai sosial jika membahayakan orang yang memakannya. Rescue Score (skor kemudahan dan nilai logistik penyelamatan) tidak boleh diizinkan mengesampingkan parameter mikrobiologis atau risiko keracunan pangan. Oleh karena itu, Food Safety Gate berdiri sebagai gerbang awal deterministik yang mutlak: hanya makanan yang lolos pemeriksaan awal yang berhak mendapatkan rekomendasi konsumsi manusia.'
                : 'Surplus food has zero social value if it endangers the health of those who eat it. Rescue scores (logistical feasibility and rescue value) must NEVER be permitted to override microbiological or foodborne illness risks. Therefore, the Food Safety Gate acts as an uncompromising deterministic gatekeeper: only food passing baseline screening earns human consumption routing.'}
            </p>

            {/* Clear Status Definitions Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-display font-black text-xs">
                  PASS
                </span>
                <h4 className="text-sm font-display font-black text-emerald-950">
                  {isId ? 'Lolos Pemeriksaan Awal' : 'Initial Screening Passed'}
                </h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {isId
                    ? 'Berdasarkan informasi yang dimasukkan pengguna, tidak ditemukan indikator bahaya yang melanggar standar. Memenuhi syarat untuk dilanjutkan ke penilaian prioritas Rescue Score. BUKAN jaminan mutlak/sertifikasi laboratorium.'
                    : 'Based on user data, no breach indicators were detected. Eligible to proceed to Rescue Score prioritization. NOT an absolute guarantee or lab certification.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-300 shadow-xs space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-display font-black text-xs">
                  REVIEW
                </span>
                <h4 className="text-sm font-display font-black text-amber-950">
                  {isId ? 'Pemeriksaan Lanjutan' : 'Inspection Required'}
                </h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {isId
                    ? 'Terdapat informasi penting yang belum diketahui (misal: riwayat suhu holding atau kondisi kemasan belum diperiksa). Rekomendasi konsumsi DITAHAN sementara hingga diverifikasi.'
                    : 'Critical safety information is undocumented (e.g. unknown thermal history). Human consumption recommendation is HELD PENDING on-site resolution.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-rose-300 shadow-xs space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-display font-black text-xs">
                  REJECT
                </span>
                <h4 className="text-sm font-display font-black text-rose-950">
                  {isId ? 'Ditolak untuk Konsumsi' : 'Consumption Prohibited'}
                </h4>
                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  {isId
                    ? 'Makanan melanggar standar keamanan (kerusakan nyata, kedaluwarsa, cemaran). Penyaluran konsumsi DIBLOKIR permanen. Dialihkan terpisah ke kompos atau pembuangan aman.'
                    : 'Food violates safety standards (spoilage, expired, contamination). Human consumption is STRICTLY BLOCKED. Evaluated separately for composting or disposal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Three-Tier Classification Table (Official vs Prototype vs Assumptions) */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-150 shadow-card space-y-6">
            <div className="flex items-center gap-2 text-brand-600 font-display font-extrabold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>{isId ? 'Transparansi Tiga Tingkat (Three-Tier Transparency)' : 'Three-Tier Transparency'}</span>
            </div>

            <h3 className="text-2xl font-display font-black text-brand-900">
              {isId ? 'Pemisahan Landasan Aturan REPLATE' : 'Separation of REPLATE Rule Foundations'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Tier 1: Official Sources */}
              <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-display font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-display font-black text-sm text-teal-950">
                    {isId ? 'Prinsip Didukung Sumber Resmi' : 'Official Principles'}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs font-sans text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span><strong>WHO:</strong> {isId ? 'Bahaya Danger Zone (5°C–60°C); pencegahan kontaminasi silang antara makanan mentah dan matang.' : 'Danger Zone hazards (5°C–60°C); strict prevention of cross-contamination between raw and cooked food.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span><strong>{isId ? 'Kemenkes RI:' : 'Ministry of Health:'}</strong> {isId ? 'Higiene jasaboga; batas waktu saji di suhu ruang maksimal 4 jam; wadah tertutup kedap debu.' : 'Food service hygiene; maximum 4-hour ambient serving limit; sealed dust-proof transport containers.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span><strong>{isId ? 'BPOM RI:' : 'BPOM (Indonesian FDA):'}</strong> {isId ? 'Prinsip Cek KLIK; larangan konsumsi makanan berlendir/tengik/berjamur; kaleng kembung/penyok parah.' : 'Cek KLIK principle; strict ban on slimy/rancid/moldy food; bloated or dented cans.'}</span>
                  </li>
                </ul>
              </div>

              {/* Tier 2: Operational Prototype Rules */}
              <div className="p-5 rounded-2xl bg-sky-50/50 border border-sky-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-display font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-display font-black text-sm text-sky-950">
                    {isId ? 'Aturan Operasional Prototipe' : 'Prototype Rules'}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs font-sans text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{isId ? 'Struktur hierarki gerbang: ' : 'Gate hierarchy: '}<code>REJECT &gt; REVIEW &gt; PASS</code> {isId ? '(kondisi REJECT tidak boleh ditimpa skor tinggi).' : '(REJECT conditions cannot be overridden by scores).'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{isId ? 'Pemetaan jalur non-konsumsi: pemisahan limbah organik untuk kompos vs limbah bahaya kemasan untuk pembuangan khusus.' : 'Non-consumption routing: organic waste to compost vs packaging hazard to safe disposal.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{isId ? 'Pemblokiran otomatis penugasan mitra bank makanan jika status belum berstatus PASS.' : 'Automated blockage of consumption routing until status is confirmed PASS.'}</span>
                  </li>
                </ul>
              </div>

              {/* Tier 3: Assumptions & Limitations */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-display font-bold text-xs flex items-center justify-center">3</span>
                  <h4 className="font-display font-black text-sm text-amber-950">
                    {isId ? 'Asumsi & Batasan Prototipe' : 'Assumptions & Limits'}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs font-sans text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isId ? 'Keterbatasan Input:' : 'Input Boundary:'}</strong> {isId ? 'Evaluasi bergantung pada kejujuran dan ketepatan data yang diinput staf pengirim.' : 'Screening relies entirely on the honesty and accuracy of user-reported data.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isId ? 'Bukan Sertifikasi:' : 'Not a Certification:'}</strong> {isId ? 'Sistem tidak menggantikan inspeksi fisik langsung oleh inspektur kesehatan pangan bersertifikat.' : 'The system does not replace on-site physical inspections by certified food safety officers.'}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>{isId ? 'Uji Fisik Diperlukan:' : 'On-Site Verification:'}</strong> {isId ? 'Mitra penerima tetap diwajibkan melakukan verifikasi organoleptik saat serah terima.' : 'Receiving partners must perform sensory organoleptic verification during physical handover.'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Official Reference Directory */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-black text-brand-900">
              {isId ? 'Daftar Sumber Referensi Regulasi Resmi' : 'Official Regulatory Reference Directory'}
            </h3>
            <p className="text-xs text-slate-600 font-sans">
              {isId
                ? 'Sumber rujukan resmi yang digunakan sebagai landasan konseptual gerbang keamanan pangan REPLATE. Ketiga lembaga ini merupakan acuan regulasi dan bukan merupakan pemberi sertifikasi produk prototipe ini.'
                : 'Official sources used as conceptual foundations for REPLATE Food Safety Gate. These bodies provide published standards and have not specifically certified this prototype.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {OFFICIAL_SAFETY_SOURCES.map((source) => (
                <div key={source.id} className="bg-white rounded-3xl p-6 border border-slate-150 shadow-soft space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-display font-extrabold uppercase text-brand-600 tracking-wider">
                        {isId ? source.publisher : (source.publisherEn || source.publisher)}
                      </span>
                      <h4 className="text-lg font-display font-black text-brand-900 mt-0.5">
                        {isId ? source.title : (source.titleEn || source.title)}
                      </h4>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-teal-100 flex items-center justify-center text-slate-600 hover:text-teal-900 transition-colors shrink-0"
                      aria-label="Open source link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="block text-[11px] font-display font-bold text-slate-400 uppercase">
                      {isId ? 'Prinsip yang Diterapkan:' : 'Applied Principles:'}
                    </span>
                    <ul className="space-y-1 text-xs font-sans text-slate-600">
                      {(isId ? source.principles : source.principlesEn).map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-teal-600 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-display font-extrabold text-teal-700 hover:text-teal-950 underline"
                    >
                      <span>{isId ? 'Kunjungi Dokumen Resmi' : 'View Official Publication'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: SUPPLY CHAIN LEARNING MODULES */}
      {/* ======================================================== */}
      {activeTab === 'learning-modules' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod) => (
              <div key={mod.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-150 shadow-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-black text-brand-900">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans font-medium">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                {mod.topics && (
                  <div className="space-y-3 pt-2">
                    {mod.topics.map((t) => (
                      <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <h4 className="text-sm font-display font-black text-slate-900">{t.title}</h4>
                        <p className="text-xs text-slate-600 font-sans leading-relaxed">{t.summary}</p>
                        {t.quote && (
                          <p className="text-xs italic text-teal-800 font-display pt-1 border-t border-slate-200 mt-2">
                            "{t.quote}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {mod.stages && (
                  <div className="space-y-2 pt-2">
                    {mod.stages.map((st) => (
                      <div key={st.step} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs">
                        <span className="font-display font-black text-teal-700">{st.step}</span>
                        <div>
                          <span className="font-display font-bold text-slate-900 block">{st.name} ({st.lossFactor} loss)</span>
                          <span className="text-slate-500 font-sans block">{st.drivers}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {mod.principles && (
                  <div className="space-y-2 pt-2">
                    {mod.principles.map((pr, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="font-display font-black text-slate-900 block">{pr.title}</span>
                        <span className="text-slate-600 font-sans block">{pr.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mod.strategies && (
                  <div className="space-y-2 pt-2">
                    {mod.strategies.map((str, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="font-display font-black text-slate-900 block">{str.title}</span>
                        <span className="text-slate-600 font-sans block">{str.detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {mod.metrics && (
                  <div className="space-y-2 pt-2">
                    {mod.metrics.map((met, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="font-display font-black text-slate-900 block">{met.label}</span>
                        <span className="text-slate-600 font-sans block">{met.desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-gradient-to-tr from-brand-600 via-teal-600 to-sky-600 rounded-3xl sm:rounded-[40px] p-8 sm:p-12 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center sm:text-left">
          <h3 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">
            {isId ? 'Siap Mencoba Alur Penilaian Aman?' : 'Ready to Test Verified Routing?'}
          </h3>
          <p className="text-xs sm:text-sm font-sans font-semibold text-teal-100 max-w-md leading-relaxed">
            {isId
              ? 'Mulai input surplus makanan untuk melihat langsung cara kerja Food Safety Gate dan Rescue Score.'
              : 'Report surplus to observe the Food Safety Gate and Rescue Score in action.'}
          </p>
        </div>

        <Button
          variant="sun"
          size="lg"
          onClick={() => onNavigate('report')}
          className="text-xs px-8 py-4 shadow-sun w-full sm:w-auto font-display font-black whitespace-nowrap"
          icon={ArrowRight}
          iconPosition="right"
        >
          {isId ? 'Mulai Lapor Surplus' : 'Start Reporting Surplus'}
        </Button>
      </div>
    </div>
  );
}
