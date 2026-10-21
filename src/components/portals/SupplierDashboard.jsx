import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  ChefHat, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Button from '../Button';
import { getReports, getCurrentUser } from '../../utils/storage';
import { getFoodDisplayName } from '../../utils/calculations';
import { formatNumber, formatRupiah, formatDate } from '../../utils/formatters';

export default function SupplierDashboard({ onNavigate, lang = 'id', currentUser }) {
  const isId = lang === 'id';
  const [reports, setReports] = useState(() => getReports());

  useEffect(() => {
    const handleUpdate = () => setReports(getReports());
    window.addEventListener('replate:storage-update', handleUpdate);
    return () => window.removeEventListener('replate:storage-update', handleUpdate);
  }, []);

  // Filter reports that are from catering/supplier or active
  const activeDispatches = reports.filter(r => r.journeyStatus !== 'RECEIVED' && r.journeyStatus !== 'CANCELLED');
  const completedDispatches = reports.filter(r => r.journeyStatus === 'RECEIVED');
  const totalRescuedKg = completedDispatches.reduce((acc, r) => acc + (Number(r.actualReceivedKg || r.quantity) || 0), 0);
  const totalMealsSaved = Math.round(totalRescuedKg * 2.5);
  const totalRupiahSaved = totalRescuedKg * 28000;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* 1. Supplier Hero & Welcome Banner */}
      <div className="bg-gradient-to-br from-amber-500/10 via-teal-50 to-sky-50 rounded-3xl p-6 sm:p-10 border border-teal-200/80 shadow-card relative overflow-hidden">
        <div className="absolute top-4 right-4 text-6xl opacity-15 select-none pointer-events-none">🏪</div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-2xs border border-amber-300 text-xs font-display font-extrabold text-amber-900">
            <span>🏪</span>
            <span>{isId ? 'PORTAL DAPUR DONATUR • GRAND CATERING' : 'DONOR KITCHEN PORTAL • GRAND CATERING'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-brand-900 tracking-tight leading-tight">
            {isId ? 'Dasbor Manajemen Surplus Katering' : 'Catering Surplus Dispatch Hub'}
          </h1>

          <p className="text-sm sm:text-base font-sans font-semibold text-slate-700 leading-relaxed">
            {isId
              ? 'Selamat datang di panel khusus penyedia pangan. Daftarkan makanan siap konsumsi dari shift dapur Anda, pastikan standar keamanan suhu, dan pantau kurir penjemput hingga tiba di mitra penerima.'
              : 'Welcome to the food donor portal. Log ready-to-eat meals from your kitchen, verify temperature safety, and track couriers directly to intake partners.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="sun"
              size="md"
              onClick={() => onNavigate('report')}
              icon={Plus}
              className="w-full sm:w-auto text-xs px-6 py-3 shadow-sun font-display font-black"
            >
              {isId ? '+ Lapor Surplus Makanan Baru' : '+ Log New Surplus Food'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('journeys')}
              icon={Truck}
              className="w-full sm:w-auto text-xs px-6 py-3 font-display font-extrabold"
            >
              {isId ? '🚚 Pantau Penyaluran Berjalan' : '🚚 Track Outbound Deliveries'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Four (4) Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Siap Dijemput' : 'Ready for Pickup'}
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {activeDispatches.length} <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'pengiriman' : 'shipments'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Sedang bergerak menuju mitra' : 'In transit to community kitchens'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Porsi Terselamatkan' : 'Portions Rescued'}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {formatNumber(totalMealsSaved)} <span className="text-sm text-slate-500 font-sans font-medium">{isId ? 'porsi' : 'meals'}</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? `${totalRescuedKg.toFixed(1)} kg telah diterima fisik` : `${totalRescuedKg.toFixed(1)} kg physically verified`}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Nilai Pangan CSR' : 'Social Value'}
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-brand-900">
            {formatRupiah(totalRupiahSaved)}
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Manfaat sosial katering Anda' : 'Community impact generated'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-soft space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-display font-extrabold uppercase tracking-wider">
              {isId ? 'Safety Gate' : 'Safety Compliance'}
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-50 text-brand-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-800">
            100% <span className="text-sm text-slate-500 font-sans font-medium">PASS</span>
          </div>
          <p className="text-[11px] font-sans text-slate-500 font-semibold">
            {isId ? 'Suhu & higienitas terverifikasi' : 'Compliant holding standards'}
          </p>
        </div>
      </div>

      {/* 3. Active Deliveries Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-brand-900">
              {isId ? 'Penyaluran Makanan Aktif dari Dapur Anda' : 'Active Outbound Food Dispatches'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-sans font-semibold">
              {isId ? 'Status terkini armada penjemput dan mitra penerima tujuan' : 'Real-time logistics status of your outgoing donations'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('journeys')}
            className="text-xs font-display font-black text-brand-600 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>{isId ? 'Lihat Semua Logistik' : 'View Full Journey'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {activeDispatches.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-soft space-y-3">
            <span className="text-4xl block">🍳</span>
            <h3 className="text-base font-display font-black text-slate-800">
              {isId ? 'Tidak ada penyaluran makanan yang sedang berjalan' : 'No active dispatches at this moment'}
            </h3>
            <p className="text-xs font-sans text-slate-500 max-w-md mx-auto">
              {isId
                ? 'Selesai memasak atau ada porsi berlebih dari prasmanan katering? Laporkan sekarang agar kurir segera menjemput.'
                : 'Finished your catering shift? Log leftover meals now to dispatch couriers immediately.'}
            </p>
            <Button
              variant="sun"
              size="sm"
              onClick={() => onNavigate('report')}
              icon={Plus}
              className="text-xs px-5 py-2 font-display font-black shadow-sun"
            >
              {isId ? 'Lapor Surplus Sekarang' : 'Report Surplus Now'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDispatches.slice(0, 3).map((item) => (
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
                    🚚 {isId ? 'Sedang Diantar' : 'In Transit'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs font-display space-y-1">
                  <div className="text-slate-500">
                    {isId ? 'Mitra Penerima:' : 'Recipient:'} <strong className="text-brand-900 font-extrabold">{item.selectedDestination?.name || 'Dapur Umum Mandiri'}</strong>
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    {formatDate(item.createdAt)}
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs font-display font-black text-brand-600">
                  <span>{isId ? 'Buka Pelacakan Rute' : 'Open Route Tracker'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SOP 3-Langkah Serah Terima Dapur */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div>
          <span className="text-xs font-display font-extrabold text-brand-600 uppercase tracking-wider block mb-1">
            🛡️ {isId ? 'Standar Operasional Prosedur (SOP)' : 'Standard Operating Procedure'}
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black text-brand-900">
            {isId ? '3 Langkah Penyelamatan Makanan Dapur Katering' : '3-Step Kitchen Surplus Rescue Process'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-display font-black text-xs flex items-center justify-center">
              1
            </div>
            <strong className="text-xs font-display font-black text-brand-950 block">
              {isId ? 'Input Suhu & Kondisi Makanan' : 'Log Temperature & Condition'}
            </strong>
            <p className="text-xs font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Pastikan makanan berkuah/matang berada di atas 60°C atau didinginkan segera di bawah 4°C dalam wadah higienis tertutup.'
                : 'Keep hot holding above 60°C or chill under 4°C in sealed food-grade containers.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-sun-500 text-amber-950 font-display font-black text-xs flex items-center justify-center">
              2
            </div>
            <strong className="text-xs font-display font-black text-slate-900 block">
              {isId ? 'Penjodohan Otomatis dengan Mitra' : 'Automated Partner Pairing'}
            </strong>
            <p className="text-xs font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Algoritma REPLATE langsung menghubungkan dapur Anda dengan Dapur Umum Mandiri atau bank makanan terdekat dalam radius 5 km.'
                : 'REPLATE algorithm matches your kitchen with nearby intake partners within 5 km.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/60 space-y-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 text-white font-display font-black text-xs flex items-center justify-center">
              3
            </div>
            <strong className="text-xs font-display font-black text-slate-900 block">
              {isId ? 'Serah Terima ke Kurir Penjemput' : 'Handoff to Dispatch Courier'}
            </strong>
            <p className="text-xs font-sans text-slate-600 leading-relaxed">
              {isId
                ? 'Kurir tiba dengan thermal bag terinsulasi. Klik tombol serah terima, dan makanan langsung diantar ke mitra penerima.'
                : 'Courier arrives with insulated thermal bags. Confirm handoff and track direct delivery.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
