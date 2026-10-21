import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  AlertCircle, 
  Thermometer, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { 
  FOOD_TYPES, 
  CONDITION_OPTIONS, 
  TIME_WINDOWS, 
  SOURCE_CONTEXTS,
  SAFETY_CONDITION_OPTIONS,
  SAFETY_STORAGE_HISTORY_OPTIONS,
  SAFETY_TEMP_OPTIONS,
  SAFETY_PACKAGING_OPTIONS,
  SAFETY_HANDLING_OPTIONS
} from '../data/foods';
import Button from '../components/Button';
import { TRANSLATIONS, getActiveLanguage } from '../utils/i18n';
import { getCurrentUser, openLoginModal, loginUser } from '../utils/storage';

export default function ReportSurplus({ onSubmitReport, lang = getActiveLanguage() }) {
  const [currentLang, setCurrentLang] = useState(lang || getActiveLanguage());
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

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

  const [showAdvancedSafety, setShowAdvancedSafety] = useState(false);

  const [formData, setFormData] = useState(() => ({
    foodTypeId: 'cooked-rice',
    quantity: '',
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
    notes: ''
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.foodTypeId) {
      errs.foodTypeId = isId ? 'Pilih jenis makanan' : 'Select a food type';
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errs.quantity = isId ? 'Masukkan jumlah yang valid (angka > 0)' : 'Enter a valid quantity (> 0)';
    }
    if (!formData.safetyConditionId) {
      errs.safetyConditionId = isId ? 'Pilih kondisi fisik makanan' : 'Select food condition';
    }
    if (!formData.storageHistoryId) {
      errs.storageHistoryId = isId ? 'Pilih riwayat penyimpanan' : 'Select storage history';
    }
    if (!formData.packagingConditionId) {
      errs.packagingConditionId = isId ? 'Pilih kondisi kemasan' : 'Select packaging condition';
    }
    if (!formData.handlingIntegrityId) {
      errs.handlingIntegrityId = isId ? 'Pilih kebersihan penanganan' : 'Select handling hygiene';
    }
    if (!formData.timeWindowId) {
      errs.timeWindowId = isId ? 'Pilih sisa waktu aman' : 'Select safe time window';
    }
    if (!formData.sourceContextId) {
      errs.sourceContextId = isId ? 'Pilih sumber makanan' : 'Select food source';
    }

    // Validate future preparation date
    if (formData.preparedAt) {
      const prepDate = new Date(formData.preparedAt);
      const fifteenMinFuture = new Date(Date.now() + 15 * 60 * 1000);
      if (prepDate > fifteenMinFuture) {
        errs.preparedAt = isId 
          ? 'Tanggal/jam penyiapan tidak boleh di masa depan'
          : 'Preparation time cannot be set in the future';
      }
    }

    // Validate negative storage duration
    if (formData.storageDurationHours !== '' && Number(formData.storageDurationHours) < 0) {
      errs.storageDurationHours = isId 
        ? 'Durasi penyimpanan tidak boleh negatif' 
        : 'Storage duration cannot be negative';
    }

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      openLoginModal({
        role: 'supplier',
        mode: 'login',
        prompt: isId 
          ? 'Wajib masuk sebagai Donatur untuk melaporkan surplus pangan.' 
          : 'Please sign in as a Food Donor to report surplus food.'
      });
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    const selectedFood = FOOD_TYPES.find(f => f.id === formData.foodTypeId) || FOOD_TYPES[0];
    const selectedCondition = CONDITION_OPTIONS.find(c => c.id === formData.conditionId) || CONDITION_OPTIONS[0];
    const selectedTime = TIME_WINDOWS.find(t => t.id === formData.timeWindowId) || TIME_WINDOWS[0];

    const reportPayload = {
      ...formData,
      foodName: getFoodText(formData.foodTypeId).name || selectedFood.name,
      category: selectedFood.category,
      quantity: parseFloat(formData.quantity),
      conditionLabel: getConditionText(formData.conditionId).label || selectedCondition.label,
      availableTimeLabel: getTimeWindowText(formData.timeWindowId) || selectedTime.label,
      notes: formData.notes.trim(),
      reportedBy: {
        id: currentUser.id,
        name: currentUser.name,
        organization: currentUser.organization,
        role: currentUser.role
      }
    };

    if (onSubmitReport) {
      onSubmitReport(reportPayload);
    }
  };

  // Helper for translated food type
  const getFoodText = (foodId) => {
    return t.foodTypes?.[foodId] || { name: foodId, category: '' };
  };

  // Helper for translated condition
  const getConditionText = (condId) => {
    return t.conditions?.[condId] || { label: condId, desc: '' };
  };

  // Helper for translated time window
  const getTimeWindowText = (timeId) => {
    return t.timeWindows?.[timeId] || timeId;
  };

  // Helper for translated source context
  const getSourceText = (sourceId) => {
    return t.sourceContexts?.[sourceId] || sourceId;
  };

  // Mandatory Authentication Guard for Unauthenticated Users
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-brand-200/80 shadow-card text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-500 to-teal-400 text-white flex items-center justify-center text-3xl mx-auto shadow-md shadow-brand-500/20">
            🔐
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 text-brand-900 border border-brand-300 text-xs font-display font-extrabold">
              <span>🏪</span>
              <span>{isId ? 'PORTAL MITRA DONATUR PANGAN' : 'SURPLUS FOOD DONOR PORTAL'}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-brand-900 tracking-tight">
              {isId ? 'Wajib Masuk untuk Melaporkan Surplus' : 'Login Required to Log Surplus Food'}
            </h1>
            <p className="text-xs sm:text-sm font-sans font-semibold text-slate-600 leading-relaxed">
              {isId
                ? 'Untuk menjamin ketertelusuran pangan (traceability), akuntabilitas batch masakan, serta kepatuhan standar Food Safety Gate, pelaporan surplus makanan hanya dapat dilakukan oleh mitra donatur terdaftar (Katering, Restoran, Bakery, Hotel, atau Toko Retail).'
                : 'To ensure food traceability, batch accountability, and strict Food Safety Gate compliance, reporting surplus food is strictly restricted to verified food donors.'}
            </p>
          </div>

          {/* Action Cards / Buttons */}
          <div className="max-w-md mx-auto pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openLoginModal({ 
                role: 'supplier', 
                mode: 'login', 
                prompt: isId ? 'Masuk dengan akun Donatur Anda untuk melanjutkan pelaporan makanan.' : 'Sign in as a Food Donor to continue reporting food.' 
              })}
              className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-display font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>{isId ? 'Masuk Akun Donatur' : 'Sign In as Donor'}</span>
            </button>

            <button
              type="button"
              onClick={() => openLoginModal({ 
                role: 'supplier', 
                mode: 'register', 
                prompt: isId ? 'Daftarkan usaha kuliner atau dapur Anda sebagai mitra donatur resmi.' : 'Register your kitchen or business as an authorized food donor.' 
              })}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-display font-extrabold text-xs border border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>{isId ? 'Daftar Akun Donatur' : 'Register New Donor'}</span>
            </button>
          </div>

          {/* Fast-Track 1-Tap Demo Donor Login */}
          <div className="pt-4 border-t border-slate-100 max-w-md mx-auto">
            <p className="text-[11px] font-sans font-bold text-slate-500 mb-2">
              {isId ? 'Ingin mencoba langsung simulasi donatur?' : 'Want to test donor simulation instantly?'}
            </p>
            <button
              type="button"
              onClick={() => {
                loginUser('supplier', 'supplier123');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-display font-extrabold transition-all active:scale-95"
            >
              <span>🏪</span>
              <span>{isId ? '⚡ Akses Cepat Demo: Dapur Grand Catering' : '⚡ Quick Demo Access: Grand Catering'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Clean Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight">
          {t.report.title}
        </h1>
        <p className="text-sm font-sans font-semibold text-slate-600 max-w-xl mx-auto">
          {t.report.subtitle}
        </p>

        {currentUser && (
          <div className="pt-2 flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-display font-extrabold bg-teal-50 text-teal-900 border border-brand-300">
              <span>{currentUser.avatar}</span>
              <span>{currentUser.name}</span>
              <span className="text-teal-400 font-normal">•</span>
              <span className="font-semibold text-teal-800">{currentUser.badgeText}</span>
            </span>
          </div>
        )}
      </div>

      {/* Contextual Role Banner */}
      {currentUser?.role === 'mitra' && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs font-sans flex items-start gap-3">
          <span className="text-base">ℹ️</span>
          <div>
            <strong className="font-display font-bold block">
              {isId ? 'Akun Anda: Mitra Penerima (Dapur Umum Mandiri)' : 'Account: Recipient Partner (Dapur Umum Mandiri)'}
            </strong>
            <p className="mt-0.5 text-sky-900 leading-relaxed">
              {isId
                ? 'Sebagai mitra penerima pangan, fungsi utama Anda adalah memverifikasi dan menerima pasokan masuk pada menu Perjalanan. Gunakan formulir ini hanya jika dapur umum Anda memiliki surplus berlebih tak terduga yang perlu diredistribusikan ke panti atau komunitas lain.'
                : 'As a food recipient partner, your primary action is accepting incoming deliveries in the Journey tab. Use this form only if your kitchen has unexpected excess meals to redistribute.'}
            </p>
          </div>
        </div>
      )}

      {currentUser?.role === 'supplier' && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs font-sans flex items-start gap-3">
          <span className="text-base">🏪</span>
          <div>
            <strong className="font-display font-bold block">
              {isId ? 'Entitas Donatur: Dapur Grand Catering' : 'Donor Entity: Dapur Grand Catering'}
            </strong>
            <p className="mt-0.5 text-teal-900 leading-relaxed">
              {isId
                ? 'Input sisa porsi berlebih dari operasional katering Anda. Sistem REPLATE akan otomatis memverifikasi standar Food Safety Gate dan menyalurkannya langsung ke mitra penerima terdekat.'
                : 'Log surplus food from your catering shift. REPLATE will screen safety standards and pair it directly with nearby recipient partners.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-card space-y-8">
        {/* Field 01: Food Type */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {t.report.f1} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FOOD_TYPES.map((type) => {
              const isSelected = formData.foodTypeId === type.id;
              const foodInfo = getFoodText(type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    const nextTemp = (type.category === 'prepared' || type.category === 'meat_fish')
                      ? 'hot_holding_above_60'
                      : type.category === 'dairy'
                      ? 'cold_holding_below_4'
                      : 'ambient_room_temp';
                    setFormData({
                      ...formData,
                      foodTypeId: type.id,
                      storageTempId: nextTemp,
                      packagingConditionId: type.category === 'produce' ? 'not_applicable_fresh' : formData.packagingConditionId
                    });
                  }}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <span className={`block text-xs font-display ${isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'}`}>
                      {foodInfo.name || type.name}
                    </span>
                    <span className={`block text-[11px] font-sans capitalize mt-0.5 ${isSelected ? 'text-brand-700 font-bold' : 'text-slate-500'}`}>
                      {type.category.replace('_', ' ')}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.foodTypeId && (
            <p className="text-xs text-coral-600 font-display font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.foodTypeId}
            </p>
          )}
        </div>

        {/* Field 02: Quantity & Unit */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {t.report.f2} <span className="text-coral-500">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder={t.report.qtyPlaceholder || (isId ? 'Contoh: 8.0' : 'e.g. 8.0')}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-base font-display font-extrabold focus:outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, unit: 'kg' })}
                className={`px-5 py-3 rounded-2xl text-xs font-display font-extrabold uppercase border-2 transition-all flex items-center gap-1.5 ${
                  formData.unit === 'kg'
                    ? 'bg-teal-50 border-brand-500 text-brand-950 ring-2 ring-brand-400/30 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{t.report.unitKg}</span>
                {formData.unit === 'kg' && <span className="text-brand-600 font-bold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, unit: 'portions' })}
                className={`px-5 py-3 rounded-2xl text-xs font-display font-extrabold uppercase border-2 transition-all flex items-center gap-1.5 ${
                  formData.unit === 'portions'
                    ? 'bg-teal-50 border-brand-500 text-brand-950 ring-2 ring-brand-400/30 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{t.report.unitPortions}</span>
                {formData.unit === 'portions' && <span className="text-brand-600 font-bold">✓</span>}
              </button>
            </div>
          </div>
          {errors.quantity && (
            <p className="text-xs text-coral-600 font-display font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.quantity}
            </p>
          )}
        </div>

        {/* Field 03: Food Condition (Sensoris / Fisik) */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '03. Kondisi Fisik & Sensoris Makanan' : '03. Food Physical & Sensory Condition'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAFETY_CONDITION_OPTIONS.map((opt) => {
              const isSelected = formData.safetyConditionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const legacyCond = opt.id === 'no_visible_damage' ? 'suitable' :
                                       opt.id === 'altered_needs_check' ? 'near_window' :
                                       opt.id === 'clear_spoilage' ? 'not_suitable' : 'near_window';
                    setFormData({
                      ...formData,
                      safetyConditionId: opt.id,
                      conditionId: legacyCond
                    });
                  }}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`block text-xs font-display ${
                      isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'
                    }`}>
                      {isId ? opt.labelId : opt.labelEn}
                    </span>
                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-1">
                      {isId ? opt.descriptionId : opt.descriptionEn}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.safetyConditionId && (
            <p className="text-xs text-coral-600 font-display font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.safetyConditionId}
            </p>
          )}
        </div>

        {/* Field 04: Storage History & Thermal Holding */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '04. Riwayat Penyimpanan & Suhu Holding' : '04. Storage History & Thermal Holding'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SAFETY_STORAGE_HISTORY_OPTIONS.map((opt) => {
              const isSelected = formData.storageHistoryId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, storageHistoryId: opt.id })}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <span className={`block text-xs font-display ${
                      isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'
                    }`}>
                      {isId ? opt.labelId : opt.labelEn}
                    </span>
                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed mt-1">
                      {isId ? opt.descriptionId : opt.descriptionEn}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Thermal Temperature Selection */}
          <div className="pt-2">
            <span className="block text-[11px] font-display font-bold text-slate-600 mb-1.5">
              {isId ? 'Suhu penyimpanan aktual saat ini:' : 'Actual current holding temperature:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {SAFETY_TEMP_OPTIONS.map((temp) => (
                <button
                  key={temp.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, storageTempId: temp.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    formData.storageTempId === temp.id
                      ? 'bg-teal-50 border-brand-500 text-brand-950 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5 mb-1 text-teal-600" />
                  <span className={`block text-[11px] font-display leading-tight ${
                    formData.storageTempId === temp.id ? 'font-black text-brand-950' : 'font-extrabold text-slate-700'
                  }`}>
                    {isId ? temp.labelId : temp.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Field 05: Packaging Integrity */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '05. Kondisi & Integritas Kemasan (Cek KLIK)' : '05. Packaging Integrity'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAFETY_PACKAGING_OPTIONS.map((opt) => {
              const isSelected = formData.packagingConditionId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, packagingConditionId: opt.id })}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`text-xs font-display ${
                    isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'
                  }`}>
                    {isId ? opt.labelId : opt.labelEn}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field 06: Handling Integrity */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '06. Higiene Penanganan & Pemisahan Bahan Mentah' : '06. Handling Hygiene & Raw Separation'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAFETY_HANDLING_OPTIONS.map((opt) => {
              const isSelected = formData.handlingIntegrityId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, handlingIntegrityId: opt.id })}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`text-xs font-display ${
                    isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'
                  }`}>
                    {isId ? opt.labelId : opt.labelEn}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field 04: Available Time Window */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '07. Sisa Waktu Aman Penyaluran' : '07. Safe Window Remaining'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TIME_WINDOWS.map((time) => {
              const isSelected = formData.timeWindowId === time.id;
              const timeLabel = getTimeWindowText(time.id);
              return (
                <button
                  key={time.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, timeWindowId: time.id })}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`text-xs font-display ${isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'}`}>
                    {timeLabel}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.timeWindowId && (
            <p className="text-xs text-coral-600 font-display font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.timeWindowId}
            </p>
          )}
        </div>

        {/* Field 05: Source Context */}
        <div className="space-y-3">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '08. Sumber / Konteks Operasional' : '08. Origin / Operational Context'} <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SOURCE_CONTEXTS.map((src) => {
              const isSelected = formData.sourceContextId === src.id;
              const srcLabel = getSourceText(src.id);
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, sourceContextId: src.id })}
                  className={`p-3.5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-brand-500 ring-2 ring-brand-400/30 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`text-xs font-display ${isSelected ? 'font-black text-brand-950' : 'font-extrabold text-slate-800'}`}>
                    {srcLabel}
                  </span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.sourceContextId && (
            <p className="text-xs text-coral-600 font-display font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.sourceContextId}
            </p>
          )}
        </div>

        {/* Optional Dates Toggle */}
        <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50 space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvancedSafety(!showAdvancedSafety)}
            className="flex items-center justify-between w-full text-xs font-display font-bold text-slate-700 hover:text-slate-900"
          >
            <span>
              {isId ? '🕒 Tanggal/Jam Penyiapan & Kedaluwarsa (Opsional)' : '🕒 Prep Datetime & Expiry (Optional)'}
            </span>
            {showAdvancedSafety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvancedSafety && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-display font-bold text-slate-600 mb-1">
                  {isId ? 'Tanggal & Jam Selesai Dimasak:' : 'Cooking/Prep Datetime:'}
                </label>
                <input
                  type="datetime-local"
                  value={formData.preparedAt}
                  onChange={(e) => setFormData({ ...formData, preparedAt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
                />
                {errors.preparedAt && (
                  <p className="text-[11px] text-coral-600 font-bold mt-1">{errors.preparedAt}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold text-slate-600 mb-1">
                  {isId ? 'Lama Penyimpanan (Jam):' : 'Holding Duration (Hours):'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.storageDurationHours}
                  placeholder="1.5"
                  onChange={(e) => setFormData({ ...formData, storageDurationHours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold text-slate-600 mb-1">
                  {isId ? 'Tanggal Kedaluwarsa (Jika Ada):' : 'Expiry / Use-by Date:'}
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Field 06: Handling Notes */}
        <div className="space-y-2">
          <label className="block text-xs font-display font-extrabold uppercase tracking-wider text-slate-800">
            {isId ? '09. Catatan Tambahan & Wadah Simpan (Opsional)' : '09. Handling Notes (Optional)'}
          </label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
            }}
            placeholder={t.report.f6Placeholder}
            className="w-full p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-sans focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>

        {/* Form Submission CTA */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="sun"
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full sm:w-auto text-sm px-8 py-3.5 shadow-sun font-display font-black"
          >
            {isId ? 'Lanjutkan ke Food Safety Gate & Penilaian' : 'Proceed to Food Safety Gate & Assessment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
