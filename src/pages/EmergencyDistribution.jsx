import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  ListFilter, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Info,
  Trash2
} from 'lucide-react';
import Button from '../components/Button';
import { 
  getEmergencyRequests, 
  saveEmergencyRequest, 
  updateEmergencyRequestStatus, 
  deleteEmergencyRequest,
  findMatchingSurplusForRequest,
  allocateSurplusToEmergencyRequest,
  getCurrentUser,
  openLoginModal,
  loginUser
} from '../utils/storage';
import { getFoodDisplayName } from '../utils/calculations';
import { formatDate } from '../utils/formatters';

const FOOD_CATEGORY_OPTIONS = [
  { id: 'cooked_meals', labelId: 'Makanan Siap Santap / Nasi Kotak', labelEn: 'Ready-to-Eat Cooked Meals', icon: '🍱', descId: 'Nasi, lauk pauk matang, sup, hidangan katering', descEn: 'Cooked rice, side dishes, soup, catering meals' },
  { id: 'fresh_produce', labelId: 'Sayuran & Bahan Masak Segar', labelEn: 'Fresh Vegetables & Produce', icon: '🥬', descId: 'Sayur mayur, wortel, kentang, bahan olah', descEn: 'Greens, carrots, potatoes, raw ingredients' },
  { id: 'pantry_staples', labelId: 'Sembako & Beras / Bahan Pokok', labelEn: 'Dry Staples & Grains', icon: '🌾', descId: 'Beras, mie, minyak, tepung, makanan kering', descEn: 'Rice, noodles, cooking oil, flour, dry goods' },
  { id: 'protein_meat', labelId: 'Lauk Protein / Daging / Telur / Tempe', labelEn: 'Protein & Fresh Meat/Poultry', icon: '🍗', descId: 'Ayam, telur, ikan, tahu tempe, daging olah', descEn: 'Chicken, eggs, fish, tofu, tempeh, meat' },
  { id: 'bakery_snacks', labelId: 'Roti & Kudapan Bergizi', labelEn: 'Bakery & Nutritious Snacks', icon: '🍞', descId: 'Roti tawar, kue, biskuit, camilan padat nutrisi', descEn: 'Bread, pastries, biscuits, nutritious snacks' }
];

const URGENCY_LEVELS = [
  { id: 'CRITICAL', labelId: '🚨 Kritis (< 2 Jam)', labelEn: '🚨 Critical (< 2 Hours)', descId: 'Mendesak untuk makan siang/malam segera', descEn: 'Immediate requirement for imminent meal service' },
  { id: 'HIGH', labelId: '⚡ Tinggi (2 - 4 Jam)', labelEn: '⚡ High (2 - 4 Hours)', descId: 'Stok dapur menipis dalam shift berjalan', descEn: 'Kitchen inventory running low in current shift' },
  { id: 'MEDIUM', labelId: '⏳ Siaga (Hari Ini)', labelEn: '⏳ Moderate (Within Today)', descId: 'Persiapan makan untuk shift berikutnya', descEn: 'Advance meal prep for next upcoming shift' }
];

export default function EmergencyDistribution({ onNavigate, lang = 'id', currentUser }) {
  const isId = lang === 'id';
  const [activeUser, setActiveUser] = useState(() => currentUser || getCurrentUser());

  useEffect(() => {
    setActiveUser(currentUser || getCurrentUser());
  }, [currentUser]);

  useEffect(() => {
    const handleAuth = (e) => {
      setActiveUser(e.detail !== undefined ? e.detail : getCurrentUser());
    };
    window.addEventListener('replate:auth-change', handleAuth);
    return () => window.removeEventListener('replate:auth-change', handleAuth);
  }, []);

  const [requests, setRequests] = useState(() => getEmergencyRequests());
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form'
  const [selectedRequestForMatching, setSelectedRequestForMatching] = useState(null);
  const [matchingCandidates, setMatchingCandidates] = useState([]);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    neededFoodType: 'cooked_meals',
    requestedPortions: '',
    beneficiaryCount: '',
    beneficiaryGroup: 'Warga Terdampak Banjir & Pengungsi',
    targetLocation: 'Posko Dapur Umum Mandiri, Tebet Barat, Jakarta Selatan',
    urgencyLevel: 'CRITICAL',
    urgencyDeadline: 'Hari ini sebelum 12:30 WIB (Makan Siang)',
    urgencyReason: '',
    contactPerson: activeUser?.name || 'Ibu Siti Rahma (Koordinator)',
    contactPhone: '0812-3456-7890',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const refreshRequests = () => {
    setRequests(getEmergencyRequests());
  };

  useEffect(() => {
    window.addEventListener('replate:storage-update', refreshRequests);
    return () => window.removeEventListener('replate:storage-update', refreshRequests);
  }, []);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const validate = () => {
    const errs = {};
    if (!formData.neededFoodType) {
      errs.neededFoodType = isId ? 'Pilih kategori makanan yang dibutuhkan' : 'Select needed food category';
    }
    const portions = Number(formData.requestedPortions);
    if (!portions || portions <= 0) {
      errs.requestedPortions = isId ? 'Masukkan jumlah porsi yang valid (> 0)' : 'Enter valid portions (> 0)';
    }
    const beneficiaries = Number(formData.beneficiaryCount);
    if (!beneficiaries || beneficiaries <= 0) {
      errs.beneficiaryCount = isId ? 'Masukkan jumlah penerima manfaat (> 0)' : 'Enter beneficiary count (> 0)';
    }
    if (!formData.targetLocation || !formData.targetLocation.trim()) {
      errs.targetLocation = isId ? 'Lokasi tujuan pengantaran wajib diisi' : 'Target delivery location required';
    }
    if (!formData.urgencyReason || formData.urgencyReason.trim().length < 10) {
      errs.urgencyReason = isId 
        ? 'Jelaskan alasan urgensi secara detail (minimal 10 karakter)' 
        : 'Describe urgency reason in detail (min 10 chars)';
    }
    if (!formData.contactPhone || !formData.contactPhone.trim()) {
      errs.contactPhone = isId ? 'Kontak telepon koordinator wajib diisi' : 'Contact phone required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!activeUser) {
      openLoginModal({
        role: 'mitra',
        mode: 'login',
        prompt: isId 
          ? 'Wajib masuk sebagai Mitra Penerima untuk mengajukan permohonan pangan darurat.' 
          : 'Please sign in as a Recipient Partner to submit emergency food requests.'
      });
      return;
    }

    if (!validate()) return;

    try {
      const selectedCat = FOOD_CATEGORY_OPTIONS.find(c => c.id === formData.neededFoodType);
      const newReq = saveEmergencyRequest({
        ...formData,
        foodTypeName: isId ? selectedCat?.labelId : selectedCat?.labelEn,
        requestedBy: {
          id: activeUser.id,
          name: activeUser.name,
          role: activeUser.role,
          organization: activeUser.organization
        }
      });

      showNotification(
        isId 
          ? `Permintaan darurat (${newReq.requestedPortions} porsi) berhasil dibuat! Sinyal SOS otomatis disiarkan ke penyedia surplus terdekat.`
          : `Emergency request (${newReq.requestedPortions} portions) logged! SOS broadcast automatically dispatched to nearby suppliers.`
      );

      // Reset form fields
      setFormData(prev => ({
        ...prev,
        requestedPortions: '',
        beneficiaryCount: '',
        urgencyReason: '',
        notes: ''
      }));
      setErrors({});
      setActiveTab('list');
      refreshRequests();
    } catch (err) {
      showNotification(err.message || 'Gagal menyimpan permintaan', 'error');
    }
  };

  // Open matching modal and look for safe surplus candidates
  const handleOpenMatching = (req) => {
    if (!activeUser) {
      openLoginModal({
        role: 'mitra',
        mode: 'login',
        prompt: isId 
          ? 'Wajib masuk untuk mencocokkan dan mengalokasikan bantuan surplus pangan.' 
          : 'Please sign in to match and allocate surplus food relief.'
      });
      return;
    }

    setSelectedRequestForMatching(req);
    const candidates = findMatchingSurplusForRequest(req);
    setMatchingCandidates(candidates);
  };

  // Allocate a surplus item to this emergency request
  const handleAllocateSurplus = (requestId, reportId) => {
    if (!activeUser) {
      openLoginModal({
        role: 'mitra',
        mode: 'login',
        prompt: isId 
          ? 'Wajib masuk untuk mengalokasikan pasokan pangan ke permohonan darurat.' 
          : 'Please sign in to allocate surplus food.'
      });
      return;
    }

    const orgName = activeUser?.organization || activeUser?.name || 'Dapur Umum Mandiri';
    const result = allocateSurplusToEmergencyRequest(requestId, reportId, orgName);
    if (result.success) {
      showNotification(
        isId
          ? 'Surplus berhasil dialokasikan! Transaksi kini berstatus MATCHED dan siap diantar oleh pihak donor.'
          : 'Surplus successfully allocated! Status changed to MATCHED.'
      );
      setSelectedRequestForMatching(null);
      refreshRequests();
    } else {
      showNotification(result.error || 'Gagal mengalokasikan surplus', 'error');
    }
  };

  // Cancel emergency request
  const handleCancelRequest = (id) => {
    const promptMsg = isId 
      ? 'Masukkan alasan pembatalan permintaan darurat ini:' 
      : 'Enter cancellation reason for this emergency request:';
    const reason = window.prompt(promptMsg, isId ? 'Kebutuhan telah terpenuhi dari sumber lain' : 'Fulfilled from other source');
    if (!reason || !reason.trim()) return;

    updateEmergencyRequestStatus(id, 'CANCELLED', { cancelReason: reason.trim() });
    showNotification(isId ? 'Permintaan darurat dibatalkan.' : 'Request cancelled.');
    refreshRequests();
  };

  // Mark fulfilled
  const handleMarkFulfilled = (id) => {
    updateEmergencyRequestStatus(id, 'FULFILLED', { fulfilledAt: new Date().toISOString() });
    showNotification(isId ? 'Permintaan darurat ditandai telah terpenuhi sepenuhnya!' : 'Request marked fulfilled!');
    refreshRequests();
  };

  // Delete emergency request permanently
  const handleDeleteRequest = (id) => {
    if (!activeUser) {
      openLoginModal({
        role: 'mitra',
        mode: 'login',
        prompt: isId 
          ? 'Wajib masuk untuk mengelola atau menghapus permohonan darurat.' 
          : 'Please sign in to delete emergency requests.'
      });
      return;
    }

    const confirmMsg = isId 
      ? 'Apakah Anda yakin ingin menghapus permintaan darurat ini secara permanen?' 
      : 'Are you sure you want to permanently delete this emergency request?';
    if (!window.confirm(confirmMsg)) return;

    deleteEmergencyRequest(id);
    showNotification(isId ? 'Permintaan darurat telah berhasil dihapus.' : 'Emergency request permanently deleted.');
    refreshRequests();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* 1. Header & Context */}
      <div className="bg-gradient-to-br from-rose-500/10 via-amber-50 to-teal-50 rounded-3xl p-6 sm:p-10 border border-rose-200/80 shadow-card relative overflow-hidden">
        <div className="absolute top-4 right-4 text-6xl opacity-15 select-none pointer-events-none">🚨</div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-2xs border border-rose-300 text-xs font-display font-extrabold text-rose-900">
            <span>🚨</span>
            <span>{isId ? 'PORTAL MITRA PENERIMA • DISTRIBUSI DARURAT' : 'RECIPIENT PORTAL • EMERGENCY REQUESTS'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight leading-tight">
            {isId ? 'Pusat Permintaan Pangan Mendesak' : 'Emergency Food Relief Intake'}
          </h1>

          <p className="text-sm sm:text-base font-sans font-semibold text-slate-700 leading-relaxed">
            {isId
              ? 'Menu khusus mitra penerima untuk mengajukan kebutuhan makanan darurat saat terjadi lonjakan pengungsi, bencana alam, atau kehabisan stok dapur posko. Permintaan akan dicocokkan dengan surplus donor yang telah lolos uji Food Safety Gate.'
              : 'Submit and manage urgent food relief requests for natural disaster response, shelter overflow, or kitchen stockouts. Requests are matched against safety-verified surplus meals.'}
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs font-display font-bold flex items-center justify-between shadow-card animate-fade-in ${
          notification.type === 'error' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{notification.msg}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
      )}

      {/* 2. Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-display font-black transition-all flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{isId ? 'Daftar & Status Permintaan' : 'Active Requests & Status'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {requests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-display font-black transition-all flex items-center gap-2 ${
              activeTab === 'form'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isId ? '+ Buat Permintaan Darurat Baru' : '+ New Relief Request'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('journeys')}
          className="text-xs font-display font-bold text-brand-700 hover:underline flex items-center gap-1"
        >
          <span>{isId ? 'Lihat Pasokan Masuk (Journeys) →' : 'View Inbound Deliveries →'}</span>
        </button>
      </div>

      {/* 3. Tab: Buat Permintaan Baru */}
      {activeTab === 'form' && (
        !activeUser ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-rose-200/80 shadow-card text-center space-y-6 max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center text-3xl mx-auto shadow-md shadow-rose-500/20">
              🚨
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-900 border border-rose-300 text-xs font-display font-extrabold">
                <span>🤝</span>
                <span>{isId ? 'PORTAL MITRA PENERIMA RESMI' : 'OFFICIAL RECIPIENT PARTNER PORTAL'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-900 tracking-tight">
                {isId ? 'Wajib Masuk untuk Mengajukan Bantuan Darurat' : 'Login Required to Submit Emergency Requests'}
              </h2>
              <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 leading-relaxed">
                {isId
                  ? 'Pengajuan permintaan pangan darurat (Emergency Relief Intake) hanya dapat diterbitkan oleh lembaga terdaftar (Dapur Umum, Panti Asuhan, Posko Bencana, Yayasan Sosial) demi menjamin bantuan pangan sampai langsung ke penerima manfaat yang sah.'
                  : 'Emergency food relief requests can only be initiated by registered recipient organizations to guarantee meals reach verified beneficiaries.'}
              </p>
            </div>

            <div className="max-w-md mx-auto pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => openLoginModal({ 
                  role: 'mitra', 
                  mode: 'login', 
                  prompt: isId ? 'Masuk dengan akun Mitra Penerima untuk mengajukan permohonan darurat.' : 'Sign in as a Recipient Partner to submit emergency requests.' 
                })}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-display font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>🔑</span>
                <span>{isId ? 'Masuk Akun Mitra' : 'Sign In as Mitra'}</span>
              </button>

              <button
                type="button"
                onClick={() => openLoginModal({ 
                  role: 'mitra', 
                  mode: 'register', 
                  prompt: isId ? 'Daftarkan dapur umum, posko bencana, atau yayasan Anda sebagai mitra penerima.' : 'Register your organization as an official recipient partner.' 
                })}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-display font-extrabold text-xs border border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <span>📝</span>
                <span>{isId ? 'Daftar Akun Mitra' : 'Register New Mitra'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
              <p className="text-[11px] font-sans font-bold text-slate-500 mb-2">
                {isId ? 'Ingin mencoba langsung simulasi permohonan darurat?' : 'Want to test emergency request simulation instantly?'}
              </p>
              <button
                type="button"
                onClick={() => {
                  loginUser('mitra', 'mitra123');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-display font-extrabold transition-all active:scale-95"
              >
                <span>🤝</span>
                <span>{isId ? '⚡ Akses Cepat Demo: Dapur Umum Mandiri' : '⚡ Quick Demo Access: Dapur Umum Mandiri'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card space-y-8">
            <div>
              <span className="text-xs font-display font-extrabold text-rose-600 uppercase tracking-wider block mb-1">
                📝 {isId ? 'Formulir Permintaan Pangan Darurat' : 'Emergency Food Relief Form'}
              </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-900">
              {isId ? 'Ajukan Kebutuhan Makanan Mendesak' : 'Submit Urgent Meal Requisition'}
            </h2>
            <p className="text-xs font-sans text-slate-600 mt-1">
              {isId 
                ? 'Isi rincian kebutuhan pangan secara jujur. Data ini akan dipasangkan dengan stok surplus yang terverifikasi aman.' 
                : 'Specify your emergency meal requirements accurately to match with safety-screened surplus food.'}
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Field 1: Needed Food Category */}
            <div className="space-y-3">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                01. {isId ? 'Kategori Makanan yang Dibutuhkan' : 'Food Category Needed'} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FOOD_CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = formData.neededFoodType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, neededFoodType: cat.id })}
                      className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-400/30 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs">✓</span>
                        )}
                      </div>
                      <div>
                        <strong className={`block text-xs font-display ${isSelected ? 'text-rose-950 font-black' : 'text-slate-800 font-extrabold'}`}>
                          {isId ? cat.labelId : cat.labelEn}
                        </strong>
                        <span className="block text-[11px] font-sans text-slate-500 mt-0.5">
                          {isId ? cat.descId : cat.descEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.neededFoodType && <p className="text-xs text-rose-600 font-bold">{errors.neededFoodType}</p>}
            </div>

            {/* Field 2: Requested Portions & Beneficiaries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                  02. {isId ? 'Jumlah Porsi Dibutuhkan (Porsi)' : 'Requested Portions'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={isId ? 'Contoh: 60' : 'e.g. 60'}
                  value={formData.requestedPortions}
                  onChange={(e) => setFormData({ ...formData, requestedPortions: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-display font-extrabold focus:outline-none focus:border-rose-500 focus:bg-white"
                />
                {formData.requestedPortions && Number(formData.requestedPortions) > 0 && (
                  <p className="text-[11px] font-sans font-semibold text-slate-500">
                    ⚖️ {isId ? 'Estimasi setara bobot: ' : 'Estimated net weight: '}
                    <strong className="text-brand-900 font-bold">
                      {(Number(formData.requestedPortions) * 0.35).toFixed(1)} kg
                    </strong> {isId ? '(standar 0.35 kg/porsi)' : '(standard 0.35 kg/portion)'}
                  </p>
                )}
                {errors.requestedPortions && <p className="text-xs text-rose-600 font-bold">{errors.requestedPortions}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                  03. {isId ? 'Jumlah Penerima Manfaat (Jiwa)' : 'Beneficiary Count'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={isId ? 'Contoh: 60' : 'e.g. 60'}
                  value={formData.beneficiaryCount}
                  onChange={(e) => setFormData({ ...formData, beneficiaryCount: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-display font-extrabold focus:outline-none focus:border-rose-500 focus:bg-white"
                />
                {errors.beneficiaryCount && <p className="text-xs text-rose-600 font-bold">{errors.beneficiaryCount}</p>}
              </div>
            </div>

            {/* Field 3: Urgency Level & Deadline */}
            <div className="space-y-3">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                04. {isId ? 'Tingkat Urgensi & Batas Waktu' : 'Urgency Level & Deadline'} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {URGENCY_LEVELS.map((lvl) => {
                  const isSelected = formData.urgencyLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgencyLevel: lvl.id })}
                      className={`p-3.5 rounded-2xl text-left border-2 transition-all ${
                        isSelected
                          ? 'bg-rose-50 border-rose-500 text-rose-950 font-black ring-2 ring-rose-400/30'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold'
                      }`}
                    >
                      <span className="block text-xs font-display">{isId ? lvl.labelId : lvl.labelEn}</span>
                      <span className="block text-[11px] font-sans text-slate-500 mt-0.5">{isId ? lvl.descId : lvl.descEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-display font-extrabold uppercase text-slate-600 mb-1">
                  {isId ? 'Tenggat Waktu Dibutuhkan' : 'Required Deadline'}
                </label>
                <input
                  type="text"
                  placeholder={isId ? 'Contoh: Hari ini sebelum 12:30 WIB (Makan Siang)' : 'e.g. Today before 12:30 PM'}
                  value={formData.urgencyDeadline}
                  onChange={(e) => setFormData({ ...formData, urgencyDeadline: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans font-semibold text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Field 4: Target Location */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                05. {isId ? 'Lokasi Posko / Dapur Tujuan Pengantaran' : 'Target Intake Facility / Shelter Location'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder={isId ? 'Nama posko, nama jalan, kecamatan, kota' : 'Facility name, address, district'}
                value={formData.targetLocation}
                onChange={(e) => setFormData({ ...formData, targetLocation: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans font-semibold text-sm focus:outline-none focus:border-rose-500 focus:bg-white"
              />
              {errors.targetLocation && <p className="text-xs text-rose-600 font-bold">{errors.targetLocation}</p>}
            </div>

            {/* Field 5: Urgency Reason */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                06. {isId ? 'Alasan Kebutuhan Mendesak' : 'Urgency Reason & Context'} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder={isId 
                  ? 'Contoh: Kedatangan 40 warga pengungsi baru akibat luapan kali. Stok logistik beras dan lauk posko habis untuk shift siang.' 
                  : 'Describe why this food relief is urgently needed...'}
                value={formData.urgencyReason}
                onChange={(e) => setFormData({ ...formData, urgencyReason: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans font-semibold text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
              />
              {errors.urgencyReason && <p className="text-xs text-rose-600 font-bold">{errors.urgencyReason}</p>}
            </div>

            {/* Field 6: Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                  07. {isId ? 'Koordinator / Relawan Jaga' : 'Contact Person'}
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans font-semibold text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                  08. {isId ? 'Nomor Telepon / WhatsApp' : 'Phone / WhatsApp'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans font-semibold text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
                />
                {errors.contactPhone && <p className="text-xs text-rose-600 font-bold">{errors.contactPhone}</p>}
              </div>
            </div>

            {/* Field 7: Additional Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                09. {isId ? 'Catatan Kebutuhan Tambahan (Opsional)' : 'Additional Notes (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isId ? 'Contoh: Kemasan kotak terpisah diutamakan, pantangan makanan bersantan' : 'e.g. Individually boxed preferred'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="text-xs font-display font-bold text-slate-500 hover:text-slate-800"
            >
              ← {isId ? 'Kembali ke Daftar Permintaan' : 'Back to Requests'}
            </button>

            <Button
              type="submit"
              variant="sun"
              size="md"
              icon={AlertTriangle}
              className="w-full sm:w-auto px-8 py-3.5 text-xs shadow-sun font-display font-black bg-rose-600 hover:bg-rose-700 text-white border-rose-500"
            >
              {isId ? '🚨 Kirim Permintaan Darurat' : '🚨 Submit Emergency Requisition'}
            </Button>
          </div>
        </form>
      )
    )}

      {/* 4. Tab: Daftar Permintaan Darurat */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center space-y-4 shadow-soft">
              <div className="text-5xl">📋</div>
              <h3 className="text-xl font-display font-black text-brand-900">
                {isId ? 'Belum Ada Permintaan Darurat' : 'No Emergency Requests Logged'}
              </h3>
              <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
                {isId
                  ? 'Saat dapur posko Anda memerlukan pasokan pangan tambahan secara mendesak, ajukan permintaan di sini.'
                  : 'Submit an emergency food request whenever your shelter or community kitchen needs urgent meal supplies.'}
              </p>
              <div className="pt-2">
                <Button
                  variant="sun"
                  size="sm"
                  onClick={() => setActiveTab('form')}
                  icon={Plus}
                  className="text-xs px-6 py-2.5 font-display font-black"
                >
                  {isId ? 'Buat Permintaan Pertama' : 'Create First Request'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requests.map((req) => {
                const isAllocated = req.status === 'ALLOCATED';
                const isFulfilled = req.status === 'FULFILLED';
                const isCancelled = req.status === 'CANCELLED';
                const isOpen = req.status === 'OPEN' || req.status === 'MATCHING';

                const statusBg = isFulfilled
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : isAllocated
                  ? 'bg-teal-100 text-brand-950 border-brand-300'
                  : isCancelled
                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                  : 'bg-amber-100 text-amber-950 border-amber-300';

                const statusLabel = isFulfilled
                  ? (isId ? '✅ TERPENUHI' : '✅ FULFILLED')
                  : isAllocated
                  ? (isId ? '🤝 SURPLUS TERALOKASI' : '🤝 ALLOCATED')
                  : isCancelled
                  ? (isId ? '✕ DIBATALKAN' : '✕ CANCELLED')
                  : (isId ? '⏳ MENUNGGU PENCOCOKAN' : '⏳ OPEN FOR MATCH');

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft hover:shadow-card transition-all space-y-4 relative"
                  >
                    {/* Header: Urgency & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-display font-black bg-rose-50 text-rose-900 border border-rose-200">
                        {req.urgencyLevel === 'CRITICAL'
                          ? (isId ? '🚨 KRITIS' : '🚨 CRITICAL')
                          : req.urgencyLevel === 'HIGH'
                            ? (isId ? '⚡ TINGGI' : '⚡ HIGH')
                            : (isId ? '⏳ SIAGA' : '⏳ STANDBY')}
                      </span>

                      <span className={`px-3 py-1 rounded-full text-[11px] font-display font-black border ${statusBg}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Food Type & Portions */}
                    <div>
                      <h3 className="text-xl font-display font-black text-brand-900">
                        {req.requestedPortions} {isId ? 'Porsi' : 'Portions'} • {req.foodTypeName || req.neededFoodType}
                      </h3>
                      <p className="text-xs font-sans text-slate-500 font-semibold mt-0.5">
                        {req.beneficiaryCount} {isId ? 'Penerima Manfaat' : 'Beneficiaries'} ({req.beneficiaryGroup || 'Posko'}) • ID: <span className="font-mono">{req.id}</span>
                      </p>
                    </div>

                    {/* Details Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-sans space-y-2">
                      <div className="flex items-start gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span><strong>{isId ? 'Lokasi Posko:' : 'Location:'}</strong> {req.targetLocation}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>{isId ? 'Tenggat Waktu:' : 'Deadline:'}</strong> {req.urgencyDeadline}</span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span><strong>{isId ? 'Kontak:' : 'Contact:'}</strong> {req.contactPerson} ({req.contactPhone})</span>
                      </div>

                      <div className="pt-1 border-t border-slate-200 text-slate-600 text-[11px]">
                        <strong>{isId ? 'Alasan Urgensi:' : 'Reason:'}</strong> {req.urgencyReason}
                      </div>

                      {req.matchedSurplusName && (
                        <div className="p-2 rounded-xl bg-teal-50 border border-brand-200 text-brand-900 font-display font-bold text-[11px]">
                          🔗 {isId ? 'Dipasangkan dengan surplus: ' : 'Matched with: '} {req.matchedSurplusName}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-[11px] font-sans text-slate-400">
                      {isId ? 'Dibuat pada: ' : 'Logged: '} {formatDate(req.createdAt, lang)}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      {isOpen && (
                        <div className="w-full flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(req.id)}
                              className="text-xs font-display font-bold text-rose-600 hover:underline"
                            >
                              ✕ {isId ? 'Batalkan' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(req.id)}
                              className="text-xs font-display font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                              title={isId ? 'Hapus Permintaan' : 'Delete Request'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isId ? 'Hapus' : 'Delete'}</span>
                            </button>
                          </div>

                          <Button
                            variant="sun"
                            size="sm"
                            onClick={() => handleOpenMatching(req)}
                            icon={Search}
                            className="text-xs px-4 py-2 font-display font-black"
                          >
                            {isId ? '🔍 Cari Surplus Cocok' : '🔍 Match Surplus'}
                          </Button>
                        </div>
                      )}

                      {isAllocated && (
                        <div className="w-full flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onNavigate('journeys')}
                            className="text-xs font-display font-bold text-brand-700 hover:underline"
                          >
                            🚚 {isId ? 'Pantau di Menu Perjalanan' : 'Track in Journeys'}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(req.id)}
                              className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 text-xs font-display font-bold transition-colors flex items-center gap-1"
                              title={isId ? 'Hapus Permintaan' : 'Delete Request'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isId ? 'Hapus' : 'Delete'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkFulfilled(req.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-display font-black text-xs hover:bg-emerald-700 transition-colors"
                            >
                              ✓ {isId ? 'Tandai Terpenuhi' : 'Mark Fulfilled'}
                            </button>
                          </div>
                        </div>
                      )}

                      {isFulfilled && (
                        <div className="w-full flex items-center justify-between gap-2">
                          <div className="text-xs font-display font-extrabold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isId ? 'Kebutuhan telah selesai terpenuhi' : 'Relief fully fulfilled'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-xs font-display font-bold transition-colors flex items-center gap-1 active:scale-95 border border-slate-200"
                            title={isId ? 'Hapus Permintaan' : 'Delete Request'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isId ? 'Hapus' : 'Delete'}</span>
                          </button>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="w-full flex items-center justify-between gap-2">
                          <div className="text-xs font-display font-semibold text-rose-600">
                            {req.cancelReason ? `${isId ? 'Alasan: ' : 'Reason: '}${req.cancelReason}` : (isId ? 'Permintaan dibatalkan' : 'Request cancelled')}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteRequest(req.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-display font-black transition-colors flex items-center gap-1 active:scale-95 border border-rose-200 shrink-0"
                            title={isId ? 'Hapus Permintaan' : 'Delete Request'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isId ? 'Hapus Permintaan' : 'Delete Request'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Matching Modal / Overlay */}
      {selectedRequestForMatching && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-display font-black text-brand-600 uppercase tracking-wider block">
                  🔍 {isId ? 'Pencocokan Surplus Layak Pangan' : 'Food Safety Gate Matcher'}
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900 mt-0.5">
                  {isId ? 'Surplus Tersedia untuk Permintaan Ini' : 'Available Safety-Screened Surplus'}
                </h3>
                <p className="text-xs font-sans text-slate-500 mt-1">
                  {isId ? 'Permintaan:' : 'Request:'} <strong>{selectedRequestForMatching.requestedPortions} {isId ? 'Porsi' : 'Portions'} • {selectedRequestForMatching.foodTypeName}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequestForMatching(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Safety Rule Assurance */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-brand-200 text-brand-950 text-xs font-sans flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-display font-bold block">
                  {isId ? 'Penegakan Food Safety Gate Ketat' : 'Strict Safety Gate Enforcement'}
                </strong>
                <p className="text-slate-700 leading-relaxed mt-0.5">
                  {isId
                    ? 'Hanya makanan dengan status PASS (lolos standar WHO, BPOM, dan Kemenkes) yang ditampilkan untuk konsumsi manusia. Makanan berstatus REVIEW atau REJECT secara deterministik diblokir dari alokasi ini.'
                    : 'Only PASS-verified food eligible for human consumption is presented. REVIEW or REJECT surplus is deterministically excluded.'}
                </p>
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-3">
              {matchingCandidates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <div className="text-3xl">⏳</div>
                  <strong className="block text-xs font-display text-slate-700">
                    {isId ? 'Belum Ada Surplus PASS yang Siap Dipasangkan' : 'No PASS-Screened Surplus Available'}
                  </strong>
                  <p className="text-[11px] font-sans text-slate-500">
                    {isId 
                      ? 'Saat ini belum ada laporan surplus aktif berstatus PASS yang belum dicocokkan. Sistem akan terus memantau laporan katering baru.'
                      : 'No unassigned PASS reports available right now. Check back as donors submit surplus batches.'}
                  </p>
                </div>
              ) : (
                matchingCandidates.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-brand-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-display font-black text-brand-900">
                          {rep.quantity} {rep.unit}
                        </span>
                        <span className="text-xs font-sans font-bold text-slate-800">
                          {getFoodDisplayName(rep.foodTypeId, rep.foodName, lang)}
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-slate-500 mt-0.5">
                        {isId ? 'Dari: ' : 'From: '} <strong className="text-slate-700">{rep.reportedBy?.name || 'Dapur Grand Catering'}</strong> • {isId ? 'Skor:' : 'Score:'} {rep.rescueScore || 90}/100
                      </div>
                    </div>

                    <Button
                      variant="sun"
                      size="sm"
                      onClick={() => handleAllocateSurplus(selectedRequestForMatching.id, rep.id)}
                      className="w-full sm:w-auto text-xs px-4 py-2 font-display font-black"
                    >
                      {isId ? '🤝 Alokasikan ke Permintaan Ini' : '🤝 Allocate to Request'}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedRequestForMatching(null)}
                className="text-xs px-5 py-2"
              >
                {isId ? 'Tutup' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
