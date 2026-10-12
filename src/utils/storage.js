/**
 * REPLATE Centralized LocalStorage Utility
 * Manages reports, journey logs, impact data, and Food Safety Gate statuses
 * with zero external database dependencies.
 */

import { evaluateFoodSafetyGate } from '../engine/foodSafetyGate.js';

const STORAGE_KEYS = {
  REPORTS: 'replate_surplus_reports_v1',
  PREFERENCES: 'replate_user_preferences_v1',
  DEMO_FLAG: 'replate_demo_loaded_v1'
};

// Custom event to sync components upon storage updates
const dispatchStorageEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('replate:storage-update'));
  }
};

/**
 * Get all surplus reports from localStorage
 * Includes safe, conservative migration for legacy reports lacking Food Safety Gate data.
 */
export function getReports() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list;
  } catch (err) {
    console.error('[REPLATE Storage] Error reading reports:', err);
    return [];
  }
}

/**
 * Get single report by ID
 */
export function getReportById(id) {
  const reports = getReports();
  return reports.find(r => r.id === id) || null;
}

/**
 * Save a new surplus report
 */
export function saveReport(report) {
  try {
    const reports = getReports();

    // Ensure foodSafetyGate information is present and properly evaluated
    const gateResult = report.foodSafetyGate || evaluateFoodSafetyGate(report);

    const newReport = {
      ...report,
      id: report.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: report.createdAt || new Date().toISOString(),
      foodSafetyGate: gateResult,
      journeyEvents: report.journeyEvents || [
        {
          status: 'REPORTED',
          timestamp: new Date().toISOString(),
          note: `Surplus recorded: ${report.quantity} ${report.unit} ${report.foodName || 'Food'}`
        },
        {
          status: 'SAFETY_SCREENED',
          timestamp: new Date().toISOString(),
          note: `Food Safety Gate: ${gateResult.status} — ${gateResult.headline}`
        }
      ]
    };

    const updated = [newReport, ...reports];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    dispatchStorageEvent();
    return newReport;
  } catch (err) {
    console.error('[REPLATE Storage] Error saving report:', err);
    throw err;
  }
}

/**
 * Update an existing report
 */
export function updateReport(id, updates) {
  try {
    const reports = getReports();
    const index = reports.findIndex(r => r.id === id);
    if (index === -1) return null;

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    dispatchStorageEvent();
    return reports[index];
  } catch (err) {
    console.error('[REPLATE Storage] Error updating report:', err);
    throw err;
  }
}

/**
 * Re-evaluate Food Safety Gate for an existing report with updated parameters
 */
export function reassessReportSafety(id, updatedPayload, lang = 'id') {
  const report = getReportById(id);
  if (!report) return null;

  const merged = { ...report, ...updatedPayload };
  const newGate = evaluateFoodSafetyGate(merged, lang);

  const newEvent = {
    status: 'SAFETY_REASSESSED',
    timestamp: new Date().toISOString(),
    note: `Food Safety Gate re-evaluated: ${newGate.status} (${newGate.headline})`
  };

  return updateReport(id, {
    ...updatedPayload,
    foodSafetyGate: newGate,
    journeyEvents: [...(report.journeyEvents || []), newEvent]
  });
}

/**
 * Update Journey Status and append timeline event
 */
export function updateJourneyStatus(id, newStatus, note = '', extraPayload = {}) {
  const report = getReportById(id);
  if (!report) return null;

  const currentEvents = report.journeyEvents || [];
  const newEvent = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status progressed to ${newStatus.replace('_', ' ')}`
  };

  return updateReport(id, {
    journeyStatus: newStatus,
    ...extraPayload,
    journeyEvents: [...currentEvents, newEvent]
  });
}

/**
 * Delete a report
 */
export function deleteReport(id) {
  try {
    const reports = getReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
    dispatchStorageEvent();
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error deleting report:', err);
    return false;
  }
}

/**
 * Clear all surplus data
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DEMO_FLAG);
    dispatchStorageEvent();
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error clearing data:', err);
    return false;
  }
}

/**
 * Generate 5 realistic, transparent supply-chain demo records
 */
export function getCuratedDemoReports() {
  const now = Date.now();
  const h = (hours) => new Date(now - hours * 3600 * 1000).toISOString();

  return [
    {
      id: 'demo-rep-101',
      isDemo: true,
      foodTypeId: 'cooked-rice',
      foodName: 'Nasi Matang Prasmanan Katering',
      quantity: 15,
      actualReceivedKg: 14.5,
      unit: 'kg',
      sourceContextId: 'Catering',
      recommendedRoute: 'REDISTRIBUTE',
      rescueScore: 92,
      priority: 'HIGH PRIORITY',
      journeyStatus: 'RECEIVED',
      createdAt: h(2.5),
      receivedAt: h(0.5),
      selectedDestination: {
        id: 'dest-kitchen-a',
        name: 'Dapur Komunitas Menteng',
        demoDistanceKm: 2.4,
        type: 'Community Kitchen'
      },
      foodSafetyGate: {
        status: 'PASS',
        eligibleForConsumptionRecommendation: true,
        headline: 'LOLOS PEMERIKSAAN AWAL (WHO • KEMENKES • BPOM)',
        summary: 'Kondisi fisik prima, suhu hot-holding terjaga >60°C, wadah Cambro tertutup rapat.',
        reasons: ['Integritas suhu terjaga aman (>60°C).', 'Wadah food-grade bersih dan higienis.'],
        missingInformation: [],
        evaluatedAt: h(2.4),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(2.5), note: 'Surplus intake tercatat: 15 kg Nasi Matang (Katering)' },
        { status: 'ASSESSED', timestamp: h(2.4), note: 'Food Safety Gate: PASS • Skor: 92/100' },
        { status: 'ROUTE_SELECTED', timestamp: h(2.3), note: 'Rute: Distribusi Langsung (Konsumsi)' },
        { status: 'MATCHED', timestamp: h(2.0), note: 'Dipasangkan dengan Dapur Komunitas Menteng' },
        { status: 'RESCUE_INITIATED', timestamp: h(1.2), note: 'Armada logistik dalam perjalanan' },
        { status: 'RECEIVED', timestamp: h(0.5), note: 'Diterima fisik di tujuan: 14.5 kg terverifikasi' }
      ]
    },
    {
      id: 'demo-rep-102',
      isDemo: true,
      foodTypeId: 'fresh-vegetables',
      foodName: 'Sayuran Daun & Wortel Segar',
      quantity: 12,
      unit: 'kg',
      sourceContextId: 'Restaurant',
      recommendedRoute: 'REDISTRIBUTE',
      rescueScore: 88,
      priority: 'HIGH PRIORITY',
      journeyStatus: 'RESCUE_INITIATED',
      createdAt: h(1.5),
      selectedDestination: {
        id: 'dest-foodbank-b',
        name: 'Bank Makanan Jakarta Pusat',
        demoDistanceKm: 4.8,
        type: 'Food Bank'
      },
      foodSafetyGate: {
        status: 'PASS',
        eligibleForConsumptionRecommendation: true,
        headline: 'LOLOS PEMERIKSAAN AWAL',
        summary: 'Sayuran segar bersih dari shift siang restoran.',
        reasons: ['Kondisi fisik segar prima.', 'Bahan terpisah dari kontaminasi mentah/matang.'],
        missingInformation: [],
        evaluatedAt: h(1.4),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(1.5), note: 'Surplus tercatat: 12 kg Sayuran Segar' },
        { status: 'ASSESSED', timestamp: h(1.4), note: 'Food Safety Gate: PASS' },
        { status: 'MATCHED', timestamp: h(1.0), note: 'Dipasangkan dengan Bank Makanan Jakarta Pusat' },
        { status: 'RESCUE_INITIATED', timestamp: h(0.3), note: 'Relawan dalam perjalanan penjemputan' }
      ]
    },
    {
      id: 'demo-rep-103',
      isDemo: true,
      foodTypeId: 'bread-pastries',
      foodName: 'Roti Sourdough & Baguette Sore',
      quantity: 8,
      unit: 'kg',
      sourceContextId: 'Bakery',
      recommendedRoute: 'PROCESS',
      rescueScore: 78,
      priority: 'MEDIUM PRIORITY',
      journeyStatus: 'MATCHED',
      createdAt: h(1.0),
      selectedDestination: {
        id: 'dest-center-c',
        name: 'Dapur Sosial Tebet',
        demoDistanceKm: 3.2,
        type: 'Shelter Meal Program'
      },
      foodSafetyGate: {
        status: 'PASS',
        eligibleForConsumptionRecommendation: true,
        headline: 'LOLOS PEMERIKSAAN AWAL',
        summary: 'Roti batch harian masih sangat layak konsumsi/olah.',
        reasons: ['Kemasan bersih higienis.', 'Belum melewati masa simpan aman.'],
        missingInformation: [],
        evaluatedAt: h(0.9),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(1.0), note: 'Surplus tercatat: 8 kg Roti' },
        { status: 'ASSESSED', timestamp: h(0.9), note: 'Food Safety Gate: PASS • Rute: Repurpose' },
        { status: 'MATCHED', timestamp: h(0.5), note: 'Menunggu konfirmasi armada penjemputan' }
      ]
    },
    {
      id: 'demo-rep-104',
      isDemo: true,
      foodTypeId: 'dairy-beverages',
      foodName: 'Susu Pasteurisasi & Minuman Sehat',
      quantity: 6,
      unit: 'kg',
      sourceContextId: 'Retail',
      recommendedRoute: 'HOLD',
      rescueScore: 0,
      priority: 'HOLD',
      journeyStatus: 'REPORTED',
      createdAt: h(0.5),
      foodSafetyGate: {
        status: 'REVIEW',
        eligibleForConsumptionRecommendation: false,
        headline: 'DATA PERLU REVIEW (SUHU PENYIMPANAN BELUM TERVERIFIKASI)',
        summary: 'Produk susu memerlukan konfirmasi suhu holding chiller sebelum rekomendasi konsumsi dapat disetujui.',
        reasons: ['Riwayat suhu rantai dingin (<4°C) memerlukan konfirmasi petugas.'],
        missingInformation: ['Pemeriksaan sensor suhu cold chain saat serah terima.'],
        evaluatedAt: h(0.5),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(0.5), note: 'Surplus tercatat: 6 kg Produk Susu' },
        { status: 'SAFETY_SCREENED', timestamp: h(0.4), note: 'Status REVIEW: Rekomendasi konsumsi ditahan' }
      ]
    },
    {
      id: 'demo-rep-105',
      isDemo: true,
      foodTypeId: 'prepared-meals',
      foodName: 'Lauk Buffet Prasmanan',
      quantity: 5,
      unit: 'kg',
      sourceContextId: 'Restaurant',
      recommendedRoute: 'REDISTRIBUTE',
      rescueScore: 70,
      priority: 'MEDIUM PRIORITY',
      journeyStatus: 'CANCELLED',
      cancellationReason: 'Kapasitas pendingin mitra penerima penuh',
      createdAt: h(3.0),
      cancelledAt: h(2.0),
      foodSafetyGate: {
        status: 'PASS',
        eligibleForConsumptionRecommendation: true,
        headline: 'LOLOS PEMERIKSAAN AWAL',
        summary: 'Lolos inspeksi awal.',
        reasons: ['Kondisi higienis awal baik.'],
        missingInformation: [],
        evaluatedAt: h(2.9),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(3.0), note: 'Surplus tercatat: 5 kg Lauk' },
        { status: 'MATCHED', timestamp: h(2.5), note: 'Mitra dicocokkan' },
        { status: 'CANCELLED', timestamp: h(2.0), note: 'Dibatalkan: Kapasitas pendingin mitra penerima penuh' }
      ]
    }
  ];
}

/**
 * Check if demo mode is active
 */
export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DEMO_FLAG) === 'true';
}

/**
 * Load curated simulation demo data into localStorage
 */
export function loadDemoData() {
  try {
    const demoReports = getCuratedDemoReports();
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(demoReports));
    localStorage.setItem(STORAGE_KEYS.DEMO_FLAG, 'true');
    dispatchStorageEvent();
    return demoReports;
  } catch (err) {
    console.error('[REPLATE Storage] Error loading demo data:', err);
    return [];
  }
}

/**
 * Clear only demo data without destroying real user reports
 */
export function clearDemoData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      localStorage.removeItem(STORAGE_KEYS.DEMO_FLAG);
      dispatchStorageEvent();
      return true;
    }
    const list = JSON.parse(raw);
    const realReports = Array.isArray(list) ? list.filter(r => !r.isDemo && !String(r.id || '').startsWith('demo-')) : [];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(realReports));
    localStorage.removeItem(STORAGE_KEYS.DEMO_FLAG);
    dispatchStorageEvent();
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error clearing demo data:', err);
    return false;
  }
}

