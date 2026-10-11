import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleApply = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-100 max-w-2xl w-full p-6 sm:p-8 shadow-card relative my-8 space-y-6 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-xl font-display font-black text-brand-900">
                {isId ? 'Perbarui Parameter Keamanan Pangan' : 'Update Food Safety Parameters'}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {isId 
                  ? 'Ubah data untuk melakukan evaluasi ulang Food Safety Gate secara instan.' 
                  : 'Modify fields to immediately re-evaluate the Food Safety Gate.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-5">
          {/* Parameter 2: Condition */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
              {isId ? '02. Kondisi Fisik & Sensoris:' : '02. Physical & Sensory Condition:'}
            </label>
            <select
              value={formData.safetyConditionId}
              onChange={(e) => setFormData({ ...formData, safetyConditionId: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {SAFETY_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter 3: Storage History */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
              {isId ? '03. Riwayat Penyimpanan:' : '03. Storage History:'}
            </label>
            <select
              value={formData.storageHistoryId}
              onChange={(e) => setFormData({ ...formData, storageHistoryId: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {SAFETY_STORAGE_HISTORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Storage Temperature Holding */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
              {isId ? 'Suhu Penyimpanan Aktual:' : 'Actual Storage Holding:'}
            </label>
            <select
              value={formData.storageTempId}
              onChange={(e) => setFormData({ ...formData, storageTempId: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {SAFETY_TEMP_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter 5: Packaging */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
              {isId ? '05. Integritas Kemasan:' : '05. Packaging Integrity:'}
            </label>
            <select
              value={formData.packagingConditionId}
              onChange={(e) => setFormData({ ...formData, packagingConditionId: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {SAFETY_PACKAGING_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter 6: Handling */}
          <div className="space-y-2">
            <label className="block text-xs font-display font-black uppercase tracking-wider text-slate-700">
              {isId ? '06. Higiene Penanganan & Pemisahan Mentah/Matang:' : '06. Handling Hygiene & Separation:'}
            </label>
            <select
              value={formData.handlingIntegrityId}
              onChange={(e) => setFormData({ ...formData, handlingIntegrityId: e.target.value })}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-display font-bold text-slate-800 focus:outline-none focus:border-brand-500"
            >
              {SAFETY_HANDLING_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Timing Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-display font-bold text-slate-600 mb-1">
                {isId ? 'Lama Penyimpanan (Jam):' : 'Holding Duration (Hours):'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.storageDurationHours}
                onChange={(e) => setFormData({ ...formData, storageDurationHours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-sans text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold text-slate-600 mb-1">
                {isId ? 'Sisa Waktu Aman Konsumsi:' : 'Safe Time Window:'}
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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              {isId ? 'Batal' : 'Cancel'}
            </Button>

            <Button
              type="submit"
              variant="sun"
              size="sm"
              className="text-xs font-display font-black shadow-sm"
            >
              {isId ? 'Simpan & Evaluasi Ulang ✨' : 'Save & Re-Evaluate ✨'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
