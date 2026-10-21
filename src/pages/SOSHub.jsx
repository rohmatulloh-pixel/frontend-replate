import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Radio,
  EyeOff,
  ArrowRight,
  ListFilter,
  Check,
  HeartHandshake,
  Sparkles,
  Info
} from 'lucide-react';
import Button from '../components/Button';
import {
  getActiveSOSBroadcasts,
  getSOSHistory,
  respondToSOSBroadcast,
  getCurrentUser,
  openLoginModal
} from '../utils/storage';
import { formatDate } from '../utils/formatters';

export default function SOSHub({ onNavigate, lang = 'id', currentUser }) {
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

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [broadcasts, setBroadcasts] = useState(() => getActiveSOSBroadcasts());
  const [responses, setResponses] = useState(() => getSOSHistory(activeUser?.organizationId));
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Session-based dismissed broadcast IDs
  const [dismissedIds, setDismissedIds] = useState(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return new Set();
    try {
      const raw = sessionStorage.getItem('replate_dismissed_sos_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  // Countdown timer state
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => {
    setBroadcasts(getActiveSOSBroadcasts());
    setResponses(getSOSHistory(activeUser?.organizationId));
  };

  useEffect(() => {
    window.addEventListener('replate:storage-update', refreshData);
    return () => window.removeEventListener('replate:storage-update', refreshData);
  }, [activeUser]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDismiss = (broadcastId) => {
    const nextSet = new Set(dismissedIds);
    nextSet.add(broadcastId);
    setDismissedIds(nextSet);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('replate_dismissed_sos_ids', JSON.stringify(Array.from(nextSet)));
    }
    showNotification(isId ? 'Permintaan darurat disembunyikan untuk sesi ini.' : 'Request dismissed for this session.', 'info');
  };

  const formatCountdown = (expiresAt) => {
    const target = new Date(expiresAt).getTime();
    const diff = target - now;
    if (diff <= 0) return isId ? 'Kedaluwarsa' : 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleOpenConfirmModal = (broadcast) => {
    if (!activeUser) {
      openLoginModal({
        role: 'supplier',
        mode: 'login',
        prompt: isId
          ? 'Masuk sebagai Penyedia Surplus untuk merespons permintaan pangan darurat.'
          : 'Sign in as a Supplier to respond to emergency food relief requests.',
      });
      return;
    }
    setSelectedBroadcast(broadcast);
    setResponseNotes('');
  };

  const handleConfirmResponse = async () => {
    if (!selectedBroadcast) return;
    setIsSubmitting(true);
    try {
      const res = respondToSOSBroadcast(selectedBroadcast.id, responseNotes, activeUser);
      if (res.success) {
        showNotification(
          isId
            ? 'Bantuan darurat berhasil dikonfirmasi! Transaksi langsung tercatat di menu Perjalanan.'
            : 'Emergency relief confirmed! Transaction logged in Journeys.',
          'success'
        );
        setSelectedBroadcast(null);
        refreshData();
        setActiveTab('history');
      } else {
        showNotification(res.error || (isId ? 'Gagal mengonfirmasi bantuan' : 'Failed to confirm relief'), 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out session-dismissed broadcasts
  const visibleBroadcasts = broadcasts.filter((b) => !dismissedIds.has(b.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-br from-rose-500/10 via-amber-50 to-teal-50 rounded-3xl p-6 sm:p-10 border border-rose-200/80 shadow-card relative overflow-hidden">
        <div className="absolute top-4 right-4 text-6xl opacity-15 select-none pointer-events-none">🚨</div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-2xs border border-rose-300 text-xs font-display font-extrabold text-rose-900">
            <span className="animate-pulse">📡</span>
            <span>{isId ? 'PORTAL SUPPLIER • PUSAT SIARAN SOS DARURAT' : 'SUPPLIER PORTAL • EMERGENCY SOS BROADCASTS'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight leading-tight">
            {isId ? 'Siaran Kebutuhan Pangan Mendesak' : 'Urgent Food Relief Broadcasts'}
          </h1>

          <p className="text-sm sm:text-base font-sans font-semibold text-slate-700 leading-relaxed">
            {isId
              ? 'Posko bencana dan dapur umum di sekitar Anda membutuhkan pasokan makanan darurat segera. Tanggapi langsung dalam satu klik tanpa perlu membuat formulir surplus terpisah.'
              : 'Community shelters and crisis kitchens nearby require urgent food supplies. Confirm relief in a single click without filling out separate surplus forms.'}
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-display font-bold flex items-center justify-between shadow-card animate-fade-in ${
            notification.type === 'error'
              ? 'bg-rose-100 text-rose-900 border border-rose-300'
              : notification.type === 'info'
              ? 'bg-sky-100 text-sky-950 border border-sky-300'
              : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === 'error' ? '⚠️' : notification.type === 'info' ? 'ℹ️' : '✅'}</span>
            <span>{notification.msg}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-900">
            ✕
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-display font-black transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{isId ? 'SOS Aktif & Siaga' : 'Active SOS Broadcasts'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {visibleBroadcasts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-display font-black transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{isId ? 'Riwayat Respons Bantuan' : 'My Response History'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {responses.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('journeys')}
          className="text-xs font-display font-bold text-brand-700 hover:underline flex items-center gap-1"
        >
          <span>{isId ? 'Lihat Semua Perjalanan (Journeys) →' : 'View All Journeys →'}</span>
        </button>
      </div>

      {/* 3. Tab: Active SOS Broadcasts */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {visibleBroadcasts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 text-center space-y-4 shadow-soft">
              <div className="text-5xl">🛡️</div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
                {isId ? 'Tidak Ada Permintaan Pangan Darurat Aktif' : 'No Active Emergency Food Requests'}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-md mx-auto leading-relaxed">
                {isId
                  ? 'Saat ini seluruh dapur posko bencana di sekitar Anda dalam kondisi aman. Sistem akan otomatis memunculkan siaran dan menyalakan indikator merah saat ada permintaan baru.'
                  : 'All nearby shelter kitchens currently have adequate food supplies. The system will automatically broadcast and activate the indicator when a new request arrives.'}
              </p>
              {dismissedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDismissedIds(new Set());
                    sessionStorage.removeItem('replate_dismissed_sos_ids');
                  }}
                  className="text-xs font-display font-bold text-rose-600 hover:underline pt-2 inline-block"
                >
                  {isId ? '↺ Tampilkan kembali siaran yang sempat disembunyikan' : '↺ Restore hidden broadcasts'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleBroadcasts.map((b) => {
                const countdownStr = formatCountdown(b.expiresAt);
                const isCritical = b.urgencyLevel === 'CRITICAL';
                const isHigh = b.urgencyLevel === 'HIGH';

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-rose-200/90 shadow-card hover:border-rose-400 transition-all space-y-5 relative flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Urgency Badge & Countdown */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-display font-black flex items-center gap-1.5 ${
                            isCritical
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isHigh
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-teal-600 text-white shadow-xs'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {isCritical
                              ? isId
                                ? '🚨 KRITIS (< 2 Jam)'
                                : '🚨 CRITICAL (< 2h)'
                              : isHigh
                              ? isId
                                ? '⚡ TINGGI (2-4 Jam)'
                                : '⚡ HIGH (2-4h)'
                              : isId
                              ? '⏳ SIAGA (Hari Ini)'
                              : '⏳ MODERATE'}
                          </span>
                        </span>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-950 font-display font-black text-xs border border-rose-200">
                          <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                          <span>{countdownStr}</span>
                        </div>
                      </div>

                      {/* Food & Portions */}
                      <div>
                        <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900 leading-tight">
                          {b.requestedPortions} {isId ? 'Porsi' : 'Portions'} • {b.foodTypeName || b.neededFoodType}
                        </h3>
                        <p className="text-xs font-sans text-slate-500 font-semibold mt-1">
                          ⚖️ {isId ? 'Estimasi bobot: ' : 'Estimated weight: '}
                          <strong className="text-brand-900 font-bold">{b.targetQuantityKg} kg</strong> • {isId ? 'Radius siaran: ' : 'Radius: '}
                          <span className="font-bold">{b.radiusKm || 10} km</span>
                        </p>
                      </div>

                      {/* Recipient Details Box */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs font-sans space-y-2.5">
                        <div className="flex items-start gap-2 text-slate-800">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-slate-900 font-display font-bold">{b.recipientOrgName}</strong>
                            <span className="text-slate-600">{b.recipientLocation}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>
                            <strong>{b.contactPerson}</strong> ({b.contactPhone})
                          </span>
                        </div>

                        {b.urgencyDeadline && (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {isId ? 'Tenggat Waktu: ' : 'Deadline: '}
                              <strong>{b.urgencyDeadline}</strong>
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                          <strong>💬 {isId ? 'Alasan Urgensi:' : 'Reason:'}</strong> "{b.urgencyReason}"
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDismiss(b.id)}
                        className="text-xs font-display font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>{isId ? 'Sembunyikan' : 'Dismiss'}</span>
                      </button>

                      <Button
                        variant="sun"
                        size="sm"
                        onClick={() => handleOpenConfirmModal(b)}
                        icon={HeartHandshake}
                        className="text-xs px-5 py-2.5 font-display font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95"
                      >
                        {isId ? '🤝 Saya Bisa Bantu' : '🤝 I Can Fulfill This'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab: Response History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {responses.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-100 text-center space-y-4 shadow-soft">
              <div className="text-5xl">📋</div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
                {isId ? 'Belum Ada Riwayat Bantuan SOS' : 'No SOS Relief History'}
              </h3>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-md mx-auto leading-relaxed">
                {isId
                  ? 'Setiap kali Anda merespons siaran darurat posko bencana, riwayat dan status pengantaran fisik akan tercatat rapi di halaman ini.'
                  : 'Whenever you respond to emergency broadcasts, delivery records will be organized and tracked here.'}
              </p>
              <div className="pt-2">
                <Button
                  variant="sun"
                  size="sm"
                  onClick={() => setActiveTab('active')}
                  className="text-xs px-6 py-2.5 font-display font-black"
                >
                  {isId ? 'Periksa SOS Aktif' : 'Check Active SOS'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {responses.map((resp) => (
                <div
                  key={resp.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft hover:shadow-card transition-all space-y-4 relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-display font-black bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isId ? '🤝 BANTUAN DIKONFIRMASI' : '🤝 RELIEF CONFIRMED'}</span>
                      </span>

                      <span className="text-[11px] font-sans text-slate-400 font-semibold">
                        {formatDate(resp.respondedAt, lang)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-display font-black text-brand-900">
                        {resp.requestedPortions || 20} {isId ? 'Porsi' : 'Portions'} • {resp.foodTypeName || 'Makanan Siap Santap'}
                      </h4>
                      <p className="text-xs font-sans text-slate-500 font-semibold mt-0.5">
                        ⚖️ {resp.targetQuantityKg || 7.0} kg • {isId ? 'Penerima: ' : 'Recipient: '}
                        <strong className="text-slate-800">{resp.recipientOrgName}</strong>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-sans space-y-1.5">
                      <div className="flex items-start gap-2 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{resp.recipientLocation}</span>
                      </div>
                      {resp.notes && (
                        <div className="pt-1.5 border-t border-slate-200 text-slate-600 text-[11px]">
                          <strong>{isId ? 'Catatan Anda:' : 'Your Note:'}</strong> {resp.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('journeys')}
                      className="text-xs font-display font-bold text-brand-700 hover:underline flex items-center gap-1"
                    >
                      <span>🚚 {isId ? 'Pantau Logistik di Journeys →' : 'Track in Journeys →'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Confirmation Modal */}
      {selectedBroadcast && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-display font-black text-rose-600 uppercase tracking-wider block">
                  🚨 {isId ? 'Konfirmasi Bantuan Pangan Darurat' : 'Confirm Emergency Food Relief'}
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900 mt-0.5">
                  {isId ? 'Siap Kirim Pasokan ke Posko?' : 'Ready to Dispatch Meals?'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBroadcast(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Target Spec Summary */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-sans space-y-2">
              <strong className="block text-rose-950 font-display font-black text-sm">
                {selectedBroadcast.requestedPortions} {isId ? 'Porsi' : 'Portions'} • {selectedBroadcast.foodTypeName}
              </strong>
              <div className="text-slate-700 space-y-1">
                <div>
                  <strong>{isId ? 'Tujuan Posko:' : 'Destination:'}</strong> {selectedBroadcast.recipientOrgName} ({selectedBroadcast.recipientLocation})
                </div>
                <div>
                  <strong>{isId ? 'Kontak Koordinator:' : 'Contact:'}</strong> {selectedBroadcast.contactPerson} ({selectedBroadcast.contactPhone})
                </div>
                <div>
                  <strong>{isId ? 'Tenggat Waktu:' : 'Deadline:'}</strong> {selectedBroadcast.urgencyDeadline}
                </div>
              </div>
            </div>

            {/* Attestation Notice */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-brand-200 text-brand-950 text-xs font-sans flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-display font-bold block">
                  {isId ? 'Atestasi Keamanan Pangan Darurat' : 'Emergency Food Safety Attestation'}
                </strong>
                <p className="text-slate-700 leading-relaxed mt-0.5">
                  {isId
                    ? 'Dengan mengonfirmasi, Anda menyatakan makanan dalam kondisi segar, bersih, higienis, dan layak konsumsi. Sistem akan otomatis menerbitkan catatan pengiriman di menu Perjalanan.'
                    : 'By confirming, you attest that meals are fresh, hygienic, and safe for human consumption. A logistics dispatch will be created automatically.'}
                </p>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
                {isId ? 'Catatan Kesiapan / Jam Jemput (Opsional)' : 'Readiness Note (Optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  isId
                    ? 'Contoh: Makanan sudah siap santap dikemas kotak, siap diambil mulai jam 11:30'
                    : 'e.g. 60 boxed meals ready for pickup at 11:30'
                }
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 font-sans text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBroadcast(null)}
                disabled={isSubmitting}
                className="text-xs px-5 py-2.5"
              >
                {isId ? 'Batal' : 'Cancel'}
              </Button>

              <Button
                variant="sun"
                size="sm"
                onClick={handleConfirmResponse}
                disabled={isSubmitting}
                icon={Check}
                className="text-xs px-6 py-2.5 font-display font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95"
              >
                {isSubmitting ? (isId ? 'Memproses...' : 'Processing...') : isId ? '🚀 Konfirmasi & Kirim Bantuan' : '🚀 Confirm & Dispatch Relief'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
