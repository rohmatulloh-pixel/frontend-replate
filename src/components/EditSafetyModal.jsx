import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Thermometer, 
  Box, 
  Clock 
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
    storageDurationHours: initialData?.storageDurationHours || '1.5',
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
        storageDurationHours: initialData.storageDurationHours || '1.5',
        expiryDate: initialData.expiryDate || '',
        preparedAt: initialData.preparedAt || ''
      });
    }
  }, [initialData, isOpen]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[88vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed & Compact */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-black text-brand-900 leading-tight">
                {isId ? 'Perbarui Parameter Keamanan Pangan' : 'Update Food Safety Parameters'}
              </h3>
              <p className="text-[11px] text-slate-500 font-sans leading-tight">
                {isId 
                  ? 'Lengkapi atau ubah data untuk evaluasi ulang Food Safety Gate secara instan.' 
                  : 'Modify fields to immediately re-evaluate the Food Safety Gate.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Form Body - Responsive 2-Column Grid */}
        <form id="edit-safety-form" onSubmit={handleApply} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Parameter 1: Food Type & Category */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '01. Kategori & Karakteristik Pangan:' : '01. Food Category & Stream:'}
              </label>
              <select
                value={formData.foodTypeId}
                onChange={(e) => setFormData({ ...formData, foodTypeId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {FOOD_TYPES.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.name} ({getCategoryLabel(ft.category)})
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter 2: Condition */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '02. Kondisi Fisik & Sensoris:' : '02. Physical & Sensory Condition:'}
              </label>
              <select
                value={formData.safetyConditionId}
                onChange={(e) => setFormData({ ...formData, safetyConditionId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {SAFETY_CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isId ? opt.labelId : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter 3: Storage History */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '03. Riwayat Penyimpanan:' : '03. Storage History:'}
              </label>
              <select
                value={formData.storageHistoryId}
                onChange={(e) => setFormData({ ...formData, storageHistoryId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {SAFETY_STORAGE_HISTORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isId ? opt.labelId : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter 4: Storage Temperature Holding */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '04. Suhu Penyimpanan Aktual:' : '04. Actual Holding Temperature:'}
              </label>
              <select
                value={formData.storageTempId}
                onChange={(e) => setFormData({ ...formData, storageTempId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {SAFETY_TEMP_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isId ? opt.labelId : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter 5: Packaging */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '05. Integritas Kemasan:' : '05. Packaging Integrity:'}
              </label>
              <select
                value={formData.packagingConditionId}
                onChange={(e) => setFormData({ ...formData, packagingConditionId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {SAFETY_PACKAGING_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isId ? opt.labelId : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameter 6: Handling & Hygiene */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-black uppercase tracking-wider text-slate-700">
                {isId ? '06. Higiene Penanganan & Pemisahan:' : '06. Handling Hygiene & Separation:'}
              </label>
              <select
                value={formData.handlingIntegrityId}
                onChange={(e) => setFormData({ ...formData, handlingIntegrityId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {SAFETY_HANDLING_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isId ? opt.labelId : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Holding Duration */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-bold text-slate-600">
                {isId ? 'Lama Penyimpanan (Jam):' : 'Holding Duration (Hours):'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.storageDurationHours}
                onChange={(e) => setFormData({ ...formData, storageDurationHours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
              >
              </input>
            </div>

            {/* Safe Time Window */}
            <div className="space-y-1">
              <label className="block text-[11px] font-display font-bold text-slate-600">
                {isId ? 'Sisa Waktu Aman Konsumsi:' : 'Safe Consumption Window:'}
              </label>
              <select
                value={formData.timeWindowId}
                onChange={(e) => setFormData({ ...formData, timeWindowId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
              >
                {TIME_WINDOWS.map((tw) => (
                  <option key={tw.id} value={tw.id}>
                    {tw.label}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </form>

        {/* Footer - Fixed / Sticky Bottom with Always-Visible Action Buttons */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs px-4 py-2"
          >
            {isId ? 'Batal' : 'Cancel'}
          </Button>

          <Button
            type="submit"
            form="edit-safety-form"
            variant="sun"
            size="sm"
            className="text-xs font-display font-black shadow-sun px-5 py-2"
          >
            {isId ? 'Simpan & Evaluasi Ulang' : 'Save & Re-Evaluate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
