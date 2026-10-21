import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Shield,
  Key,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Refrigerator,
  Sparkles,
  Truck
} from 'lucide-react';
import Button from '../components/Button';
import { getCurrentUser, updateUserProfile, changeUserPassword, fetchUserProfile } from '../utils/storage';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';

export default function Profile({ onNavigate, lang = 'id' }) {
  const isId = lang === 'id';
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form Profile State
  const [fullName, setFullName] = useState(currentUser?.name || currentUser?.fullName || '');
  const [organizationName, setOrganizationName] = useState(currentUser?.organization || currentUser?.organizationName || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.contactPhone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.contactEmail || currentUser?.email || '');
  const [latitude, setLatitude] = useState(currentUser?.latitude != null ? String(currentUser.latitude) : '');
  const [longitude, setLongitude] = useState(currentUser?.longitude != null ? String(currentUser.longitude) : '');

  // Recipient Specific State
  const [recipientType, setRecipientType] = useState(currentUser?.recipientProfile?.recipientType || 'COMMUNITY_KITCHEN');
  const [dailyMaxCapacityKg, setDailyMaxCapacityKg] = useState(currentUser?.recipientProfile?.dailyMaxCapacityKg || 100);
  const [hasRefrigeration, setHasRefrigeration] = useState(Boolean(currentUser?.recipientProfile?.hasRefrigeration));
  const [hasFreezer, setHasFreezer] = useState(Boolean(currentUser?.recipientProfile?.hasFreezer));
  const [acceptedCategories, setAcceptedCategories] = useState(
    currentUser?.recipientProfile?.acceptedFoodCategories || ['COOKED_MEALS', 'BAKERY_PASTRY']
  );

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchUserProfile().then(user => {
      if (user) {
        setCurrentUser(user);
        setFullName(user.name || user.fullName || '');
        setOrganizationName(user.organization || user.organizationName || '');
        if (user.address) setAddress(user.address);
        if (user.contactPhone) setContactPhone(user.contactPhone);
        if (user.contactEmail) setContactEmail(user.contactEmail);
        if (user.latitude != null) setLatitude(String(user.latitude));
        if (user.longitude != null) setLongitude(String(user.longitude));
        if (user.recipientProfile) {
          setRecipientType(user.recipientProfile.recipientType || 'COMMUNITY_KITCHEN');
          setDailyMaxCapacityKg(user.recipientProfile.dailyMaxCapacityKg || 100);
          setHasRefrigeration(Boolean(user.recipientProfile.hasRefrigeration));
          setHasFreezer(Boolean(user.recipientProfile.hasFreezer));
          if (user.recipientProfile.acceptedFoodCategories) {
            setAcceptedCategories(user.recipientProfile.acceptedFoodCategories);
          }
        }
      }
    });
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotification({
        type: 'error',
        message: isId ? 'Browser Anda tidak mendukung layanan Geolocation.' : 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setNotification({
          type: 'success',
          message: isId ? `Berhasil mengambil koordinat GPS: (${lat}, ${lng})` : `GPS Coordinates acquired: (${lat}, ${lng})`
        });
      },
      (err) => {
        setIsLocating(false);
        setNotification({
          type: 'error',
          message: isId ? `Gagal mendeteksi lokasi: ${err.message}` : `Failed to acquire location: ${err.message}`
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    const payload = {
      fullName,
      organizationName,
      address,
      contactPhone,
      contactEmail,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    if (currentUser?.role === 'mitra') {
      payload.recipientProfile = {
        recipientType,
        dailyMaxCapacityKg: Number(dailyMaxCapacityKg) || 100,
        hasRefrigeration,
        hasFreezer,
        acceptedFoodCategories: acceptedCategories
      };
    }

    const res = await updateUserProfile(payload);
    setIsLoading(false);

    if (res.success) {
      setCurrentUser(res.user);
      setNotification({
        type: 'success',
        message: isId ? 'Profil dan koordinat geospasial berhasil diperbarui!' : 'Profile and geospatial coordinates updated successfully!'
      });
    } else {
      setNotification({
        type: 'error',
        message: res.message || (isId ? 'Gagal menyimpan profil.' : 'Failed to save profile.')
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setNotification({ type: 'error', message: isId ? 'Masukkan kata sandi saat ini.' : 'Please enter current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setNotification({ type: 'error', message: isId ? 'Kata sandi baru minimal 6 karakter.' : 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', message: isId ? 'Konfirmasi kata sandi baru tidak cocok.' : 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    setNotification(null);

    const res = await changeUserPassword(currentPassword, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotification({
        type: 'success',
        message: isId ? 'Kata sandi akun berhasil diubah!' : 'Password updated successfully!'
      });
    } else {
      setNotification({
        type: 'error',
        message: res.message || (isId ? 'Gagal mengubah kata sandi.' : 'Failed to change password.')
      });
    }
  };

  const isMitra = currentUser?.role === 'mitra';
  const roleBadgeColor = currentUser?.role === 'admin'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : currentUser?.role === 'mitra'
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isId ? 'Kembali ke Beranda' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleBadgeColor}`}>
              {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'mitra' ? (isId ? 'Mitra Penerima' : 'Recipient Mitra') : (isId ? 'Penyedia Surplus' : 'Food Supplier')}
            </span>
          </div>
        </div>

        {/* Page Title & Profile Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {(fullName || currentUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{fullName || currentUser?.name || 'Pengguna REPLATE'}</h1>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                <Building className="w-4 h-4 text-slate-400" />
                {organizationName || currentUser?.organization || 'Organisasi Terdaftar'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email || 'email@replate.id'}</p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">{isId ? 'Status Autentikasi' : 'Authentication'}</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {isId ? 'Terhubung ke Backend REST API' : 'Connected to Live API'}
            </span>
          </div>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Profile & Geolocation Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Informasi Organisasi */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                {isId ? 'Identitas Organisasi & Kontak' : 'Organization & Contact Identity'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isId
                  ? 'Data kontak dan alamat resmi yang digunakan untuk verifikasi logistik penjemputan surplus.'
                  : 'Official contact and physical address for food rescue pickup and verification.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Nama Lengkap Narahubung' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="Contoh: Siti Rahma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Nama Organisasi / Usaha' : 'Organization Name'}
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="Contoh: Grand Sahid Catering"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Nomor Telepon / WhatsApp' : 'Phone / WhatsApp'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Contoh: 0812-3456-7890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Email Narahubung' : 'Contact Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="kontak@organisasi.id"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isId ? 'Alamat Fisik Lengkap' : 'Physical Address'}
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="Jl. Matraman Raya No. 42, RT 05 / RW 03, Jakarta Timur"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Koordinat Geospasial & Haversine GPS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                  {isId ? 'Koordinat Geospasial & Radius Jangkauan' : 'Geospatial Coordinates & Coverage'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isId
                    ? 'Koordinat GPS digunakan oleh formula Haversine backend untuk mengukur jarak km riil dan memfilter sinyal SOS dalam radius 20 km.'
                    : 'GPS coordinates power the backend Haversine engine for live kilometer distances and 20 km SOS filters.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shrink-0"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                {isLocating
                  ? isId ? 'Mendeteksi GPS...' : 'Acquiring GPS...'
                  : isId ? 'Ambil Lokasi Saat Ini (GPS)' : 'Get Current Location (GPS)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Latitude (Lintang)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  placeholder="-6.208800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Longitude (Bujur)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  placeholder="106.845600"
                />
              </div>
            </div>

            {latitude && longitude && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {isId ? 'Koordinat aktif tersimpan:' : 'Active coordinates:'} <strong>{latitude}, {longitude}</strong>
                </span>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline font-bold"
                >
                  {isId ? 'Lihat di Google Maps ↗' : 'View on Google Maps ↗'}
                </a>
              </div>
            )}
          </div>

          {/* Section 3: Khusus Mitra Penerima */}
          {isMitra && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Refrigerator className="w-5 h-5 text-blue-600" />
                  {isId ? 'Spesifikasi & Kapasitas Penampungan Mitra' : 'Recipient Capacity & Storage Specs'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isId
                    ? 'Informasi ini digunakan oleh algoritma pencocokan backend agar tidak terjadi kelebihan alokasi (overbooking).'
                    : 'Used by the matching engine to prevent capacity overflow and match temperature requirements.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isId ? 'Tipe Fasilitas Penerima' : 'Recipient Facility Type'}
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                  >
                    <option value="COMMUNITY_KITCHEN">Dapur Sosial (Community Kitchen)</option>
                    <option value="FOOD_BANK">Bank Makanan (Food Bank)</option>
                    <option value="ORPHANAGE">Panti Asuhan / Penampungan (Orphanage)</option>
                    <option value="COMPOST_FACILITY">Pusat Kompos Organik (Compost Facility)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isId ? 'Kapasitas Harian Maksimal (kg)' : 'Max Daily Capacity (kg)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dailyMaxCapacityKg}
                    onChange={(e) => setDailyMaxCapacityKg(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isId ? 'Ketersediaan Peralatan Pendingin' : 'Available Cold Storage Equipment'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRefrigeration}
                      onChange={(e) => setHasRefrigeration(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800">{isId ? 'Kulkas / Chiller (0° - 4°C)' : 'Refrigeration (0° - 4°C)'}</span>
                      <p className="text-xs text-slate-500">{isId ? 'Dapat menerima makanan siap santap dan produk susu' : 'Accepts dairy and perishable meals'}</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFreezer}
                      onChange={(e) => setHasFreezer(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800">{isId ? 'Freezer Beku (≤ -18°C)' : 'Deep Freezer (≤ -18°C)'}</span>
                      <p className="text-xs text-slate-500">{isId ? 'Dapat menyimpan makanan beku jangka panjang' : 'For long-term frozen food'}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="px-6 py-2.5 font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading
                ? isId ? 'Menyimpan Perubahan...' : 'Saving Changes...'
                : isId ? 'Simpan Profil & Koordinat' : 'Save Profile & Coordinates'}
            </Button>
          </div>
        </form>

        {/* Section 4: Ubah Kata Sandi (Argon2id) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              {isId ? 'Keamanan Akun & Ubah Kata Sandi' : 'Account Security & Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isId
                ? 'Kata sandi diverifikasi dan dienkripsi menggunakan hashing standar industri Argon2id di server NestJS.'
                : 'Protected and verified via server-side Argon2id hashing algorithms.'}
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isId ? 'Kata Sandi Saat Ini' : 'Current Password'}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isId ? 'Kata Sandi Baru (Min. 6 Karakter)' : 'New Password (Min. 6 Chars)'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isId ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="secondary"
              disabled={isChangingPassword}
              className="px-5 py-2 text-xs font-bold flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              {isChangingPassword
                ? isId ? 'Memproses...' : 'Processing...'
                : isId ? 'Perbarui Kata Sandi' : 'Update Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
