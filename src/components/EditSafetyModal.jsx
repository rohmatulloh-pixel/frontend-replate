import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert,
  CheckCircle2, 
  Thermometer, 
  Box, 
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  FOOD_TYPES,
  SAFETY_CONDITION_OPTIONS, 
  SAFETY_STORAGE_HISTORY_OPTIONS, 
  SAFETY_TEMP_OPTIONS, 
  SAFETY_PACKAGING_OPTIONS, 
  SAFETY_HANDLING_OPTIONS,
  TIME_WINDOWS 
} from '../data/foods';
import { evaluateFoodSafetyGate } from '../engine/foodSafetyGate';
import Button from './Button';

export default function EditSafetyModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  lang = 'id'
}) {
  const isId = lang === 'id';

  const [formData, setFormData] = useState(() => ({
    foodTypeId: initialData?.foodTypeId || 'cooked-rice',
    safetyConditionId: initialData?.safetyConditionId || 'no_visible_damage',
    storageHistoryId: initialData?.storageHistoryId || 'known_compliant',
    storageTempId: initialData?.storageTempId || 'hot_holding_above_60',
    packagingConditionId: initialData?.packagingConditionId || 'intact_proper',
    handlingIntegrityId: initialData?.handlingIntegrityId || 'hygienic_separated',
    timeWindowId: initialData?.timeWindowId || '1_3h',
    storageDurationHours: initialData?.storageDurationHours ?? '1.5',
    expiryDate: initialData?.expiryDate || '',
    preparedAt: initialData?.preparedAt || ''
  }));

  // Re-sync when initialData changes or modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        foodTypeId: initialData.foodTypeId || 'cooked-rice',
        safetyConditionId: initialData.safetyConditionId || 'no_visible_damage',
        storageHistoryId: initialData.storageHistoryId || 'known_compliant',
        storageTempId: initialData.storageTempId || 'hot_holding_above_60',
        packagingConditionId: initialData.packagingConditionId || 'intact_proper',
        handlingIntegrityId: initialData.handlingIntegrityId || 'hygienic_separated',
        timeWindowId: initialData.timeWindowId || '1_3h',
        storageDurationHours: initialData.storageDurationHours ?? '1.5',
        expiryDate: initialData.expiryDate || '',
        preparedAt: initialData.preparedAt || ''
      });
    }
  }, [initialData, isOpen]);

  // Lock background scroll & handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Real-time live gate prediction so user immediately knows if partner confirmation will unlock!
  const previewGate = useMemo(() => {
    return evaluateFoodSafetyGate({
      ...formData,
      quantity: initialData?.quantity || 1,
      unit: initialData?.unit || 'kg'
    }, lang);
  }, [formData, initialData, lang]);

  if (!isOpen) return null;

  const handleApply = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSave) {
      onSave({
        ...formData,
        storageDurationHours: formData.storageDurationHours !== '' ? String(formData.storageDurationHours) : '0'
      });
    }
    onClose();
  };

  const getCategoryLabel = (catId) => {
    switch (catId) {
      case 'prepared': return isId ? 'Matang / Siap Santap' : 'Prepared Meal';
      case 'bakery': return isId ? 'Roti & Kudapan' : 'Bakery & Grains';
      case 'produce': return isId ? 'Bahan Segar' : 'Fresh Produce';
      case 'packaged': return isId ? 'Kemasan Kering' : 'Packaged';
      case 'dairy': return isId ? 'Susu & Olahan Dingin' : 'Dairy & Chilled';
      case 'meat_fish': return isId ? 'Daging / Ikan' : 'Meat & Fish';
      default: return catId;
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="presentation"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-3xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-safety-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Form wraps whole content: header, scrollable body, and sticky footer */}
        <form onSubmit={handleApply} className="flex flex-col h-full max-h-[92vh] overflow-hidden">
          {/* Header - Fixed & High-Contrast */}
          <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h3 id="edit-safety-title" className="text-base sm:text-lg font-display font-black text-brand-900 leading-tight">
                  {isId ? 'Perbarui Parameter Keamanan Pangan' : 'Update Food Safety Parameters'}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-tight mt-0.5">
                  {isId 
                    ? 'Sesuaikan parameter untuk evaluasi ulang status kelayakan dan membuka konfirmasi mitra.' 
                    : 'Modify inspection parameters to re-evaluate gate status and unlock destination routing.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              aria-label={isId ? 'Tutup modal' : 'Close modal'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Real-time Status Prediction Callout */}
            <div className={`p-4 rounded-2xl border text-xs font-sans transition-all flex items-start gap-3 ${
              previewGate.status === 'PASS'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : previewGate.status === 'REVIEW'
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-rose-50/90 border-rose-300 text-rose-950'
            }`}>
              {previewGate.status === 'PASS' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {previewGate.status === 'REVIEW' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              {previewGate.status === 'REJECT' && <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-extrabold uppercase tracking-wide">
                    {isId ? 'Prediksi Hasil Evaluasi:' : 'Safety Prediction:'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-display font-black text-[11px] ${
                    previewGate.status === 'PASS' 
                      ? 'bg-emerald-600 text-white' 
                      : previewGate.status === 'REVIEW'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    {previewGate.status}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-semibold">
                  {previewGate.status === 'PASS' && (
                    isId 
                      ? 'Parameter memenuhi standar WHO & BPOM. Tombol pemilihan mitra penerima AKAN AKTIF setelah Anda klik Simpan.' 
                      : 'All criteria meet safety standards. Recipient destination selection will UNLOCK upon saving.'
                  )}
                  {previewGate.status === 'REVIEW' && (
                    isId 
                      ? 'Suhu penyimpanan atau kondisi belum terverifikasi aman. Tombol pemilihan mitra konsumsi AKAN TETAP TERKUNCI demi keselamatan publik.' 
                      : 'Thermal holding or condition not verified safe. Human consumption dispatch will REMAIN LOCKED for public safety.'
                  )}
                  {previewGate.status === 'REJECT' && (
                    isId 
                      ? 'Makanan terindikasi rusak atau melanggar standar keselamatan pangan. Hanya dapat dialihkan ke kompos organik industri.' 
                      : 'Food exhibits spoilage. Restricted strictly to certified composting facility.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Parameter 1: Food Type & Category */}
              <div className="space-y-1.5">
                <label htmlFor="edit-food-type" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '01. Kategori & Karakteristik Pangan:' : '01. Food Category & Stream:'}
                </label>
                <select
                  id="edit-food-type"
                  value={formData.foodTypeId}
                  onChange={(e) => setFormData({ ...formData, foodTypeId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {FOOD_TYPES.map((ft) => (
                    <option key={ft.id} value={ft.id}>
                      {ft.name} ({getCategoryLabel(ft.category)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter 2: Condition */}
              <div className="space-y-1.5">
                <label htmlFor="edit-safety-condition" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '02. Kondisi Fisik & Sensoris:' : '02. Physical & Sensory Condition:'}
                </label>
                <select
                  id="edit-safety-condition"
                  value={formData.safetyConditionId}
                  onChange={(e) => setFormData({ ...formData, safetyConditionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {SAFETY_CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter 3: Storage History */}
              <div className="space-y-1.5">
                <label htmlFor="edit-storage-history" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '03. Riwayat Penyimpanan:' : '03. Storage History:'}
                </label>
                <select
                  id="edit-storage-history"
                  value={formData.storageHistoryId}
                  onChange={(e) => setFormData({ ...formData, storageHistoryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {SAFETY_STORAGE_HISTORY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter 4: Storage Temperature Holding */}
              <div className="space-y-1.5">
                <label htmlFor="edit-storage-temp" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '04. Suhu Penyimpanan Aktual:' : '04. Actual Holding Temperature:'}
                </label>
                <select
                  id="edit-storage-temp"
                  value={formData.storageTempId}
                  onChange={(e) => setFormData({ ...formData, storageTempId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {SAFETY_TEMP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter 5: Packaging */}
              <div className="space-y-1.5">
                <label htmlFor="edit-packaging-condition" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '05. Integritas Kemasan:' : '05. Packaging Integrity:'}
                </label>
                <select
                  id="edit-packaging-condition"
                  value={formData.packagingConditionId}
                  onChange={(e) => setFormData({ ...formData, packagingConditionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {SAFETY_PACKAGING_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter 6: Handling & Hygiene */}
              <div className="space-y-1.5">
                <label htmlFor="edit-handling-integrity" className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
                  {isId ? '06. Higiene Penanganan & Pemisahan:' : '06. Handling Hygiene & Separation:'}
                </label>
                <select
                  id="edit-handling-integrity"
                  value={formData.handlingIntegrityId}
                  onChange={(e) => setFormData({ ...formData, handlingIntegrityId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {SAFETY_HANDLING_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Holding Duration */}
              <div className="space-y-1.5">
                <label htmlFor="edit-storage-duration" className="block text-xs font-display font-bold text-slate-700">
                  {isId ? 'Lama Penyimpanan (Jam):' : 'Holding Duration (Hours):'}
                </label>
                <input
                  id="edit-storage-duration"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.storageDurationHours}
                  onChange={(e) => setFormData({ ...formData, storageDurationHours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  placeholder="Contoh: 1.5"
                />
              </div>

              {/* Safe Time Window */}
              <div className="space-y-1.5">
                <label htmlFor="edit-time-window" className="block text-xs font-display font-bold text-slate-700">
                  {isId ? 'Sisa Waktu Aman Konsumsi:' : 'Safe Consumption Window:'}
                </label>
                <select
                  id="edit-time-window"
                  value={formData.timeWindowId}
                  onChange={(e) => setFormData({ ...formData, timeWindowId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                >
                  {TIME_WINDOWS.map((tw) => (
                    <option key={tw.id} value={tw.id}>
                      {tw.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prepared Time (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="edit-prepared-at" className="block text-xs font-display font-bold text-slate-700">
                  {isId ? 'Waktu Penyiapan (Opsional):' : 'Preparation Time (Optional):'}
                </label>
                <input
                  id="edit-prepared-at"
                  type="datetime-local"
                  value={formData.preparedAt ? formData.preparedAt.substring(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, preparedAt: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Expiry Date (Optional) */}
              <div className="space-y-1.5">
                <label htmlFor="edit-expiry-date" className="block text-xs font-display font-bold text-slate-700">
                  {isId ? 'Tanggal Kedaluwarsa (Opsional):' : 'Expiry Date (Optional):'}
                </label>
                <input
                  id="edit-expiry-date"
                  type="date"
                  value={formData.expiryDate ? formData.expiryDate.substring(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>

            </div>
          </div>

          {/* Footer - Fixed / Sticky Bottom with Always-Functional Submit Action */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 font-sans hidden sm:block">
              {isId ? 'Klik tombol di kanan untuk menerapkan perubahan.' : 'Click save to apply inspection changes.'}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-xs px-4 py-2 font-display font-bold"
              >
                {isId ? 'Batal' : 'Cancel'}
              </Button>

              <Button
                type="submit"
                variant="sun"
                size="sm"
                onClick={handleApply}
                className="text-xs font-display font-black shadow-sun px-6 py-2"
              >
                {isId ? 'Simpan & Evaluasi Ulang ✨' : 'Save & Re-Evaluate ✨'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
