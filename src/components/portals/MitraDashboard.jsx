import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  PackageCheck
} from 'lucide-react';
import Button from '../Button';
import { getReports } from '../../utils/storage';
import { getFoodDisplayName } from '../../utils/calculations';
import { formatNumber, formatDate } from '../../utils/formatters';

export default function MitraDashboard({ onNavigate, lang = 'id', currentUser }) {
  const isId = lang === 'id';
  const [reports, setReports] = useState(() => getReports());

  useEffect(() => {
    const handleUpdate = () => setReports(getReports());
    window.addEventListener('replate:storage-update', handleUpdate);
    return () => window.removeEventListener('replate:storage-update', handleUpdate);
  }, []);

  // Filter incoming deliveries heading to Mitra
  const incomingDeliveries = reports.filter(r => r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED');
  const receivedDeliveries = reports.filter(r => r.journeyStatus === 'RECEIVED');
  const totalReceivedKg = receivedDeliveries.reduce((acc, r) => acc + (Number(r.actualReceivedKg || r.quantity) || 0), 0);
  const totalBeneficiaryPortions = Math.round(totalReceivedKg * 2.5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* 1. Four (4) Mitra Logistics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Sedang Menuju Dapur' : 'Inbound Deliveries'}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {incomingDeliveries.length} <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'kiriman' : 'batches'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Kurir dalam perjalanan' : 'Couriers on the road'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Estimasi Tiba' : 'Estimated Arrival'}
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-amber-900">
            ~15-30 <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'menit' : 'mins'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Radius donatur terdekat: 2.8 km' : 'Nearest donor radius: 2.8 km'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Porsi Siap Saji Diterima' : 'Total Meals Received'}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {formatNumber(totalBeneficiaryPortions)} <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'porsi' : 'meals'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? `Total ${totalReceivedKg.toFixed(1)} kg bahan & lauk` : `Total ${totalReceivedKg.toFixed(1)} kg food intake`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Kapasitas Tampung' : 'Holding Capacity'}
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-50 text-brand-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-800">
            50 <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'kg / hari' : 'kg / day'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Chiller & meja saji higienis siap' : 'Chillers & serving tables ready'}
          </p>
        </div>
      </div>

      {/* 3. Incoming Deliveries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-brand-900">
              {isId ? 'Antrean Pasokan Masuk Menuju Dapur Umum Mandiri' : 'Inbound Food Deliveries En Route'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans font-semibold">
              {isId ? 'Daftar makanan yang sedang diantar kurir dari donatur katering' : 'Surplus food currently transported by couriers from donor kitchens'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('journeys')}
            className="text-xs font-display font-black text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>{isId ? 'Buka Menu Pasokan Lengkap' : 'Open Full Intake'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {incomingDeliveries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft space-y-3">
            <span className="text-4xl block">🥗</span>
            <h3 className="text-base font-display font-black text-slate-800">
              {isId ? 'Belum ada pasokan baru yang sedang diantar' : 'No active incoming deliveries right now'}
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto">
              {isId
                ? 'Semua makanan yang dialokasikan sebelumnya telah berhasil diterima. Sistem akan otomatis memberitahu jika ada katering yang melaporkan surplus baru.'
                : 'All previous shipments safely received. System will notify automatically when new donor meals are routed.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('journeys')}
              className="text-xs px-5 py-2 font-display font-extrabold"
            >
              {isId ? 'Lihat Riwayat Penerimaan' : 'View Intake History'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomingDeliveries.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('journeys', item.id)}
                className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-brand-300 shadow-soft hover:shadow-card transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-lg font-display font-black text-brand-900 block">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-xs font-sans font-extrabold text-slate-800 block">
                      {getFoodDisplayName(item.foodTypeId, item.foodName, lang)}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-display font-black bg-sky-100 text-sky-950 border border-sky-300">
                    🚚 {isId ? 'Menuju Dapur' : 'En Route'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs font-display space-y-1">
                  <div className="text-slate-500">
                    {isId ? 'Dari Donatur:' : 'From Donor:'} <strong className="text-brand-900 font-extrabold">{item.reportedBy?.name || 'Dapur Grand Catering'}</strong>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    {formatDate(item.createdAt)}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs font-display font-black text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200">
                  <span>{isId ? '✓ Konfirmasi saat Tiba' : '✓ Confirm on Arrival'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SOP 4-Langkah Penerimaan Pangan Aman di Dapur Mitra */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div>
          <span className="text-xs font-display font-extrabold text-brand-600 uppercase tracking-wider block mb-1">
            🛡️ {isId ? 'Checklist Inspeksi Higienitas Masuk' : 'Intake Safety & Hygiene Checklist'}
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
            {isId ? '4 Prosedur Wajib Verifikasi Pangan Tiba' : '4 Mandatory Steps for Food Intake Verification'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-brand-500 text-white font-display font-black text-xs flex items-center justify-center">
              1
            </div>
            <strong className="text-xs font-display font-black text-brand-950 block">
              {isId ? 'Pemeriksaan Wadah & Kurir' : 'Container & Courier Check'}
            </strong>
            <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Pastikan wadah Cambro/kotak makanan tertutup rapat dan kurir mengenakan sarung tangan/masker.'
                : 'Ensure sealed containers and hygienic courier handling.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-display font-black text-xs flex items-center justify-center">
              2
            </div>
            <strong className="text-xs font-display font-black text-slate-900 block">
              {isId ? 'Cek Suhu & Bau Sensori' : 'Temperature & Sensory Test'}
            </strong>
            <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Uji visual fisik dan aroma. Makanan panas harus tetap hangat (>60°C) dan tidak berlendir/asam.'
                : 'Test aroma and appearance. Hot meals must remain hot (>60°C).'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-sun-500 text-amber-950 font-display font-black text-xs flex items-center justify-center">
              3
            </div>
            <strong className="text-xs font-display font-black text-slate-900 block">
              {isId ? 'Timbang Berat Aktual (kg)' : 'Weigh Actual Intake (kg)'}
            </strong>
            <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Timbang berat yang diterima dan masukkan angka kg pada tombol konfirmasi di timeline REPLATE.'
                : 'Weigh food intake and enter actual kg in REPLATE arrival prompt.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-display font-black text-xs flex items-center justify-center">
              4
            </div>
            <strong className="text-xs font-display font-black text-slate-900 block">
              {isId ? 'Segera Bagikan ke Warga' : 'Immediate Distribution'}
            </strong>
            <p className="text-[11px] font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Salurkan makanan siap konsumsi ke warga binaan dalam jendela waktu aman 2-4 jam sejak kedatangan.'
                : 'Distribute ready meals to beneficiaries within 2-4 hours of arrival.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
