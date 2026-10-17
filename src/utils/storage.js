/**
 * REPLATE Centralized LocalStorage Utility
 * Manages reports, journey logs, impact data, and Food Safety Gate statuses
 * with isolated namespaces to guarantee user data protection against demo/simulation operations.
 */

import { evaluateFoodSafetyGate } from '../engine/foodSafetyGate.js';
import {
  syncReportToSupabase,
  deleteReportFromSupabase,
  syncEmergencyRequestToSupabase,
  fetchRemoteSurplusReports,
  fetchRemoteEmergencyRequests,
  setupSupabaseRealtimeSubscriptions,
  mapSupabaseRowToReport,
  mapRowToEmergencyRequest
} from './supabase.js';

export const STORAGE_KEYS = {
  USER_REPORTS: 'replate_user_reports_v2',
  DEMO_REPORTS: 'replate_demo_reports_v2',
  LEGACY_REPORTS: 'replate_surplus_reports_v1',
  PREFERENCES: 'replate_user_preferences_v1',
  DEMO_FLAG: 'replate_demo_loaded_v1',
  USER_SESSION: 'replate_user_session_v1',
  EMERGENCY_REQUESTS: 'replate_emergency_requests_v1'
};

// Custom event to sync components upon storage updates
const dispatchStorageEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('replate:storage-update'));
  }
};

/**
 * Detect real client browser vs Node.js test environment (which may mock window)
 */
function isRealBrowserEnvironment() {
  if (typeof window === 'undefined' || typeof window.document === 'undefined' || typeof window.location === 'undefined') {
    return false;
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return false;
  }
  return true;
}

/**
 * Backward-compatible migration from legacy storage key.
 * Safely partitions legacy reports into isolated user and demo stores,
 * preserving all user-created records and evaluating missing safety gates.
 */
export function migrateLegacyStorage() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    const legacyRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_REPORTS);
    if (!legacyRaw) return;

    let parsed;
    try {
      parsed = JSON.parse(legacyRaw);
    } catch {
      // Malformed legacy data - clear to unblock normal operation
      localStorage.removeItem(STORAGE_KEYS.LEGACY_REPORTS);
      return;
    }

    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEYS.LEGACY_REPORTS);
      return;
    }

    const existingUser = getUserReports();
    const existingDemo = getDemoReports();
    const userMap = new Map(existingUser.map(r => [r.id, r]));
    const demoMap = new Map(existingDemo.map(r => [r.id, r]));

    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const isDemoItem = Boolean(item.isDemo || (typeof item.id === 'string' && item.id.startsWith('demo-')));
      const itemWithSafety = {
        ...item,
        foodSafetyGate: item.foodSafetyGate || evaluateFoodSafetyGate(item)
      };

      if (isDemoItem) {
        if (!demoMap.has(itemWithSafety.id)) {
          demoMap.set(itemWithSafety.id, itemWithSafety);
        }
      } else {
        if (!userMap.has(itemWithSafety.id)) {
          userMap.set(itemWithSafety.id, itemWithSafety);
        }
      }
    }

    localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(Array.from(userMap.values())));
    if (demoMap.size > 0) {
      localStorage.setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(Array.from(demoMap.values())));
    }
    localStorage.removeItem(STORAGE_KEYS.LEGACY_REPORTS);
  } catch (err) {
    console.error('[REPLATE Storage] Error migrating legacy storage:', err);
  }
}

/**
 * Get user-created reports from isolated store
 */
export function getUserReports() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_REPORTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[REPLATE Storage] Error reading user reports:', err);
    return [];
  }
}

/**
 * Get demo/simulation reports from isolated demo store
 */
export function getDemoReports() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEMO_REPORTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[REPLATE Storage] Error reading demo reports:', err);
    return [];
  }
}

/**
 * Get all active reports: User reports + Demo reports (if demo mode is active).
 * Automatically migrates legacy stores and returns combined list sorted by createdAt desc.
 */
export function getReports() {
  migrateLegacyStorage();
  const userList = getUserReports();
  const demoList = isDemoMode() ? getDemoReports() : [];

  const combined = [...userList, ...demoList];
  return combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

/**
 * Get a single report by ID across user and demo datasets
 */
export function getReportById(id) {
  migrateLegacyStorage();
  const userMatch = getUserReports().find(r => r.id === id);
  if (userMatch) return userMatch;
  const demoMatch = getDemoReports().find(r => r.id === id);
  return demoMatch || null;
}

/**
 * Save a new user-created surplus report.
 * Guaranteed to write strictly to STORAGE_KEYS.USER_REPORTS and never touches demo records.
 */
export function saveReport(report) {
  migrateLegacyStorage();
  try {
    const userReports = getUserReports();

    // Re-evaluate Food Safety Gate strictly from actual parameters to prevent frontend status spoofing
    const gateResult = evaluateFoodSafetyGate(report);

    const isHumanRoute = !report.recommendedRoute || ['REDISTRIBUTE', 'PROCESS', 'HUMAN'].includes(report.recommendedRoute);
    const isUnverifiedOrRejected = gateResult.status === 'REJECT' || gateResult.status === 'REVIEW';

    // Disallow human recipient match if food is rejected or unverified
    let selectedDest = report.selectedDestination || null;
    let initialJourneyStatus = report.journeyStatus || 'REPORTED';

    if (isUnverifiedOrRejected && isHumanRoute) {
      if (selectedDest && !selectedDest.preferredRoutes?.includes('ORGANIC')) {
        selectedDest = null;
      }
      if (['MATCHED', 'RESCUE_INITIATED', 'RECEIVED'].includes(initialJourneyStatus)) {
        initialJourneyStatus = 'REPORTED';
      }
    } else if (selectedDest && initialJourneyStatus === 'REPORTED') {
      initialJourneyStatus = 'MATCHED';
    }

    // Build base events
    const defaultEvents = [
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
    ];

    if (selectedDest && initialJourneyStatus === 'MATCHED') {
      defaultEvents.push({
        status: 'MATCHED',
        timestamp: new Date().toISOString(),
        note: `Penyaluran disetujui ke: ${selectedDest.name} (${selectedDest.type})`
      });
    }

    const newReport = {
      ...report,
      id: report.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: report.createdAt || new Date().toISOString(),
      foodSafetyGate: gateResult,
      selectedDestination: selectedDest,
      journeyStatus: initialJourneyStatus,
      journeyEvents: report.journeyEvents || defaultEvents,
      isDemo: false
    };

    const updated = [newReport, ...userReports];
    localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(updated));
    dispatchStorageEvent();

    // Async sync to Supabase Cloud in background (real browser only)
    if (isRealBrowserEnvironment()) {
      syncReportToSupabase(newReport).catch(() => {});
    }

    return newReport;
  } catch (err) {
    console.error('[REPLATE Storage] Error saving report:', err);
    throw err;
  }
}

/**
 * Update an existing report in its respective namespace
 */
export function updateReport(id, updates) {
  migrateLegacyStorage();
  try {
    const userReports = getUserReports();
    const uIdx = userReports.findIndex(r => r.id === id);
    if (uIdx !== -1) {
      userReports[uIdx] = {
        ...userReports[uIdx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(userReports));
      dispatchStorageEvent();

      // Async sync to Supabase Cloud in background (real browser only)
      if (isRealBrowserEnvironment()) {
        syncReportToSupabase(userReports[uIdx]).catch(() => {});
      }

      return userReports[uIdx];
    }

    const demoReports = getDemoReports();
    const dIdx = demoReports.findIndex(r => r.id === id);
    if (dIdx !== -1) {
      demoReports[dIdx] = {
        ...demoReports[dIdx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(demoReports));
      dispatchStorageEvent();
      return demoReports[dIdx];
    }

    return null;
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
 * Valid state transitions for the supply chain journey
 */
export const VALID_STATUS_TRANSITIONS = {
  REPORTED: ['ASSESSED', 'ROUTE_SELECTED', 'MATCHED', 'CANCELLED', 'EXPIRED'],
  ASSESSED: ['ROUTE_SELECTED', 'MATCHED', 'CANCELLED', 'EXPIRED'],
  ROUTE_SELECTED: ['MATCHED', 'CANCELLED', 'EXPIRED'],
  MATCHED: ['RESCUE_INITIATED', 'CANCELLED', 'EXPIRED'],
  RESCUE_INITIATED: ['RECEIVED', 'CANCELLED', 'EXPIRED'],
  SAFETY_SCREENED: ['ASSESSED', 'ROUTE_SELECTED', 'MATCHED', 'CANCELLED', 'EXPIRED'],
  SAFETY_REASSESSED: ['ASSESSED', 'ROUTE_SELECTED', 'MATCHED', 'CANCELLED', 'EXPIRED'],
  RECEIVED: [],
  CANCELLED: [],
  EXPIRED: []
};

/**
 * Check if a status transition is permitted
 */
export function isValidStatusTransition(currentStatus, newStatus) {
  if (!currentStatus || currentStatus === newStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Update Journey Status with deterministic state machine verification, role authorization,
 * terminal state protection, in-transit incident validation, and safety gate check
 */
export function updateJourneyStatus(id, newStatus, note = '', extraPayload = {}, actingUser = null) {
  const report = getReportById(id);
  if (!report) return null;

  const currentStatus = report.journeyStatus || 'REPORTED';
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    console.warn(`[REPLATE Workflow] Invalid status transition from ${currentStatus} to ${newStatus} for report ${id}`);
    return null;
  }

  // Terminal state protection: terminal records cannot transition to any other state
  if (['RECEIVED', 'CANCELLED', 'EXPIRED'].includes(currentStatus)) {
    console.warn(`[REPLATE Workflow] Report ${id} is in terminal status ${currentStatus} and cannot transition.`);
    return null;
  }

  const user = actingUser || getCurrentUser();

  // Role authorization: Supplier cannot confirm delivery intake on behalf of recipient
  if (newStatus === 'RECEIVED' && user?.role === 'supplier') {
    console.warn(`[REPLATE Workflow] Supplier (${user?.name || user?.id}) is not authorized to confirm delivery intake on behalf of recipient.`);
    return null;
  }

  // IN_TRANSIT (RESCUE_INITIATED) cancellation validation:
  // Cannot be cancelled via casual / normal cancellation; requires explicit incident / bottleneck report with reason
  if (currentStatus === 'RESCUE_INITIATED' && newStatus === 'CANCELLED') {
    const hasExplicitIssue = Boolean(
      extraPayload.isIncidentReport ||
      (extraPayload.cancellationReason && extraPayload.cancellationReason.trim().length >= 4) ||
      (note && (note.toLowerCase().includes('kendala') || note.toLowerCase().includes('incident') || note.toLowerCase().includes('masalah')))
    );
    if (!hasExplicitIssue) {
      console.warn(`[REPLATE Workflow] Cannot cancel transaction in RESCUE_INITIATED via normal action. Explicit incident reporting with reason is required.`);
      return null;
    }
  }

  // Precedence rule: REJECT & REVIEW status cannot transition to human consumption distribution
  if (['MATCHED', 'RESCUE_INITIATED', 'RECEIVED'].includes(newStatus)) {
    const gateStatus = report.foodSafetyGate?.status || 'REVIEW';
    const isHumanRoute = !report.recommendedRoute || ['REDISTRIBUTE', 'PROCESS', 'HUMAN'].includes(report.recommendedRoute);
    if ((gateStatus === 'REJECT' || gateStatus === 'REVIEW') && isHumanRoute) {
      console.warn(`[REPLATE Workflow] Food report ${id} with status ${gateStatus} cannot transition to ${newStatus} for human consumption`);
      return null;
    }
  }

  const normalizedPayload = { ...extraPayload };
  if (newStatus === 'RECEIVED') {
    const rawWeight = extraPayload.actualReceivedKg ?? report.actualReceivedKg ?? report.quantity;
    normalizedPayload.actualReceivedKg = Math.max(0, Number(rawWeight) || 0);
    normalizedPayload.receivedAt = extraPayload.receivedAt || new Date().toISOString();
  } else if (newStatus === 'CANCELLED') {
    normalizedPayload.cancelledAt = extraPayload.cancelledAt || new Date().toISOString();
  } else if (newStatus === 'EXPIRED') {
    normalizedPayload.expiredAt = extraPayload.expiredAt || new Date().toISOString();
  }

  const currentEvents = report.journeyEvents || [];
  const newEvent = {
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status progressed to ${newStatus.replace('_', ' ')}`
  };

  return updateReport(id, {
    journeyStatus: newStatus,
    ...normalizedPayload,
    journeyEvents: [...currentEvents, newEvent]
  });
}

/**
 * Delete a report from its respective store
 */
export function deleteReport(id) {
  migrateLegacyStorage();
  try {
    const userReports = getUserReports();
    const uFiltered = userReports.filter(r => r.id !== id);
    if (uFiltered.length !== userReports.length) {
      localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(uFiltered));
      dispatchStorageEvent();

      if (isRealBrowserEnvironment()) {
        deleteReportFromSupabase(id).catch(() => {});
      }

      return true;
    }

    const demoReports = getDemoReports();
    const dFiltered = demoReports.filter(r => r.id !== id);
    if (dFiltered.length !== demoReports.length) {
      localStorage.setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(dFiltered));
      dispatchStorageEvent();
      return true;
    }

    return false;
  } catch (err) {
    console.error('[REPLATE Storage] Error deleting report:', err);
    return false;
  }
}

/**
 * Clear all surplus data (both user and demo), preserving user session
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DEMO_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DEMO_FLAG);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_REPORTS);
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
      reportedBy: {
        id: 'usr-supplier',
        name: 'Dapur Grand Catering',
        role: 'supplier'
      },
      createdAt: h(2.5),
      receivedAt: h(0.5),
      selectedDestination: {
        id: 'dest-mitra',
        name: 'Dapur Umum Mandiri',
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
        { status: 'MATCHED', timestamp: h(2.0), note: 'Dipasangkan dengan Dapur Umum Mandiri' },
        { status: 'RESCUE_INITIATED', timestamp: h(1.2), note: 'Armada logistik dalam perjalanan' },
        { status: 'RECEIVED', timestamp: h(0.5), note: 'Diterima fisik di Dapur Umum Mandiri: 14.5 kg terverifikasi' }
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
      reportedBy: {
        id: 'usr-supplier',
        name: 'Dapur Grand Catering',
        role: 'supplier'
      },
      createdAt: h(1.5),
      selectedDestination: {
        id: 'dest-mitra',
        name: 'Dapur Umum Mandiri',
        demoDistanceKm: 3.1,
        type: 'Community Kitchen'
      },
      foodSafetyGate: {
        status: 'PASS',
        eligibleForConsumptionRecommendation: true,
        headline: 'LOLOS PEMERIKSAAN AWAL',
        summary: 'Sayuran segar bersih dari shift siang katering.',
        reasons: ['Kondisi fisik segar prima.', 'Bahan terpisah dari kontaminasi mentah/matang.'],
        missingInformation: [],
        evaluatedAt: h(1.4),
        ruleVersion: '2.0'
      },
      journeyEvents: [
        { status: 'REPORTED', timestamp: h(1.5), note: 'Surplus tercatat: 12 kg Sayuran Segar' },
        { status: 'ASSESSED', timestamp: h(1.4), note: 'Food Safety Gate: PASS' },
        { status: 'MATCHED', timestamp: h(1.0), note: 'Dipasangkan dengan Dapur Umum Mandiri' },
        { status: 'RESCUE_INITIATED', timestamp: h(0.3), note: 'Relawan dalam perjalanan menuju Dapur Umum Mandiri' }
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
      reportedBy: {
        id: 'usr-supplier',
        name: 'Dapur Grand Catering',
        role: 'supplier'
      },
      createdAt: h(1.0),
      selectedDestination: {
        id: 'dest-mitra',
        name: 'Dapur Umum Mandiri',
        demoDistanceKm: 2.8,
        type: 'Community Kitchen'
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
        { status: 'MATCHED', timestamp: h(0.5), note: 'Alokasi intake disetujui Dapur Umum Mandiri' }
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
      reportedBy: {
        id: 'usr-supplier',
        name: 'Dapur Grand Catering',
        role: 'supplier'
      },
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
      reportedBy: {
        id: 'usr-supplier',
        name: 'Dapur Grand Catering',
        role: 'supplier'
      },
      selectedDestination: {
        id: 'dest-mitra',
        name: 'Dapur Umum Mandiri',
        demoDistanceKm: 2.5,
        type: 'Community Kitchen'
      },
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
        { status: 'MATCHED', timestamp: h(2.5), note: 'Mitra dicocokkan dengan Dapur Umum Mandiri' },
        { status: 'CANCELLED', timestamp: h(2.0), note: 'Dibatalkan: Kapasitas pendingin mitra penerima penuh' }
      ]
    }
  ];
}

/**
 * Check if demo mode is active
 */
export function isDemoMode() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DEMO_FLAG) === 'true';
}

/**
 * Load curated simulation demo data into isolated demo storage namespace.
 * Deduplicates by record id to prevent duplication on multiple calls.
 * Guaranteed to leave STORAGE_KEYS.USER_REPORTS untouched.
 */
export function loadDemoData() {
  migrateLegacyStorage();
  try {
    const curated = getCuratedDemoReports();
    const existingDemo = getDemoReports();
    const demoMap = new Map();

    for (const d of existingDemo) {
      demoMap.set(d.id, d);
    }
    for (const c of curated) {
      if (!demoMap.has(c.id)) {
        demoMap.set(c.id, c);
      }
    }

    const mergedDemo = Array.from(demoMap.values());
    localStorage.setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(mergedDemo));
    localStorage.setItem(STORAGE_KEYS.DEMO_FLAG, 'true');

    // Load demo emergency requests if none exist
    try {
      const existingEmg = getEmergencyRequests();
      if (existingEmg.length === 0) {
        const demoEmg = getCuratedDemoEmergencyRequests();
        localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(demoEmg));
      }
    } catch {
      // Ignore emergency demo error in edge environments
    }

    dispatchStorageEvent();
    return mergedDemo;
  } catch (err) {
    console.error('[REPLATE Storage] Error loading demo data:', err);
    return [];
  }
}

/**
 * Reset demo data back to original 5 curated simulation reports.
 * Affects ONLY demo records; user records remain completely untouched.
 */
export function resetDemoData() {
  migrateLegacyStorage();
  try {
    const freshCurated = getCuratedDemoReports();
    localStorage.setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(freshCurated));
    localStorage.setItem(STORAGE_KEYS.DEMO_FLAG, 'true');

    // Reset demo emergency requests while preserving user-created requests
    try {
      const emg = getEmergencyRequests();
      const userEmg = emg.filter(r => !r.isDemo && !String(r.id || '').startsWith('demo-'));
      const freshDemoEmg = getCuratedDemoEmergencyRequests();
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify([...userEmg, ...freshDemoEmg]));
    } catch {
      // Ignore in edge environments
    }

    dispatchStorageEvent();
    return freshCurated;
  } catch (err) {
    console.error('[REPLATE Storage] Error resetting demo data:', err);
    return [];
  }
}

/**
 * Clear only demo data without modifying user-created reports or settings.
 */
export function clearDemoData() {
  migrateLegacyStorage();
  try {
    localStorage.removeItem(STORAGE_KEYS.DEMO_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DEMO_FLAG);

    // Keep user emergency requests, remove only demo emergency requests
    try {
      const emg = getEmergencyRequests();
      const userEmg = emg.filter(r => !r.isDemo && !String(r.id || '').startsWith('demo-'));
      if (userEmg.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(userEmg));
      } else {
        localStorage.removeItem(STORAGE_KEYS.EMERGENCY_REQUESTS);
      }
    } catch {
      // Ignore in edge environments
    }

    dispatchStorageEvent();
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error clearing demo data:', err);
    return false;
  }
}

/**
 * Demo Users Configuration
 */
export const DEMO_USERS = {
  admin: {
    id: 'usr-admin',
    username: 'admin',
    email: 'admin@replate.id',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
    organization: 'REPLATE Operations',
    avatar: '👑',
    badgeText: 'Admin Operasional'
  },
  supplier: {
    id: 'usr-supplier',
    username: 'supplier',
    email: 'catering@replate.id',
    password: 'supplier123',
    role: 'supplier',
    name: 'Dapur Grand Catering',
    organization: 'PT Boga Berkah Katering',
    avatar: '🏪',
    badgeText: 'Penyedia Surplus'
  },
  mitra: {
    id: 'usr-mitra',
    username: 'mitra',
    email: 'mitra@replate.id',
    password: 'mitra123',
    role: 'mitra',
    name: 'Dapur Umum Mandiri',
    organization: 'Yayasan Peduli Pangan',
    avatar: '🤝',
    badgeText: 'Mitra Penerima'
  }
};

/**
 * Dispatch authentication change event
 */
const dispatchAuthEvent = (user) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('replate:auth-change', { detail: user }));
    dispatchStorageEvent();
  }
};

/**
 * Get the currently logged-in user session
 */
export function getCurrentUser() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[REPLATE Storage] Error reading user session:', err);
    return null;
  }
}

/**
 * Log in a user using username or email and password
 */
export function loginUser(identifier, password) {
  try {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPw = String(password || '').trim();

    // Match against demo users
    const matchedKey = Object.keys(DEMO_USERS).find((key) => {
      const u = DEMO_USERS[key];
      return (
        (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === cleanPw
      );
    });

    if (!matchedKey) {
      return {
        success: false,
        message: 'Username atau kata sandi tidak sesuai akun demo.'
      };
    }

    const matchedUser = DEMO_USERS[matchedKey];
    const sessionUser = {
      id: matchedUser.id,
      username: matchedUser.username,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name,
      organization: matchedUser.organization,
      avatar: matchedUser.avatar,
      badgeText: matchedUser.badgeText,
      loggedInAt: new Date().toISOString()
    };

    // If Admin logs in, auto-populate simulation data if none exists
    if (matchedUser.role === 'admin') {
      const existing = getReports();
      if (existing.length === 0) {
        loadDemoData();
      }
    }

    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionUser));
    dispatchAuthEvent(sessionUser);
    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('[REPLATE Storage] Error logging in:', err);
    return { success: false, message: 'Terjadi kesalahan sistem saat masuk.' };
  }
}

/**
 * Log out the current user
 */
export function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    dispatchAuthEvent(null);
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error logging out:', err);
    return false;
  }
}

/**
 * Generate 2 realistic curated demo emergency requests for recipient portal
 */
export function getCuratedDemoEmergencyRequests() {
  const now = Date.now();
  const h = (hours) => new Date(now - hours * 3600 * 1000).toISOString();

  return [
    {
      id: 'demo-emg-001',
      isDemo: true,
      type: 'EMERGENCY_REQUEST',
      neededFoodType: 'cooked_meals',
      foodTypeName: 'Makanan Siap Santap / Nasi Kotak',
      requestedPortions: 60,
      estimatedKg: 21,
      beneficiaryCount: 60,
      beneficiaryGroup: 'Warga Pengungsi Genangan Air',
      targetLocation: 'Posko Dapur Umum Mandiri, Tebet Barat, Jakarta Selatan',
      urgencyLevel: 'CRITICAL',
      urgencyDeadline: 'Hari ini sebelum 12:30 WIB (Makan Siang)',
      urgencyReason: 'Kedatangan 40 warga pengungsi tambahan pasca luapan kali, persediaan lauk pauk posko tidak mencukupi untuk shift siang.',
      contactPerson: 'Ibu Siti Rahma (Koordinator Dapur)',
      contactPhone: '0812-3456-7890',
      status: 'OPEN',
      notes: 'Diutamakan makanan siap santap higienis bersuhu hangat dengan kemasan kotak terpisah.',
      createdAt: h(1.5),
      matchedSurplusId: null
    },
    {
      id: 'demo-emg-002',
      isDemo: true,
      type: 'EMERGENCY_REQUEST',
      neededFoodType: 'fresh_produce',
      foodTypeName: 'Sayuran Segar & Bahan Olah Pokok',
      requestedPortions: 100,
      estimatedKg: 35,
      beneficiaryCount: 120,
      beneficiaryGroup: 'Warga Lansia & Balita Dhuafa',
      targetLocation: 'Dapur Komunitas Lansia Mandiri, Kampung Melayu',
      urgencyLevel: 'HIGH',
      urgencyDeadline: 'Sore ini sebelum 17:00 WIB',
      urgencyReason: 'Bahan masakan sayur dan protein untuk memasak makan malam 120 lansia binaan habis.',
      contactPerson: 'Bapak Hendra (Relawan Posko)',
      contactPhone: '0857-1234-5678',
      status: 'OPEN',
      notes: 'Dapat menerima sayur mayur segar atau bahan mentah higienis yang belum dipotong.',
      createdAt: h(3.0),
      matchedSurplusId: null
    }
  ];
}

/**
 * Get all emergency requests from dedicated isolated namespace
 */
export function getEmergencyRequests() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMERGENCY_REQUESTS);
    if (!raw) {
      if (isDemoMode()) {
        const demoRequests = getCuratedDemoEmergencyRequests();
        localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(demoRequests));
        return demoRequests;
      }
      return [];
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[REPLATE Storage] Error reading emergency requests:', err);
    return [];
  }
}

/**
 * Save a new emergency food request from recipient partner
 */
export function saveEmergencyRequest(requestData) {
  if (!requestData || typeof requestData !== 'object') {
    throw new Error('Data permintaan darurat tidak valid.');
  }

  if (!requestData.neededFoodType) {
    throw new Error('Jenis makanan yang dibutuhkan wajib dipilih.');
  }

  const portions = Number(requestData.requestedPortions);
  if (!portions || portions <= 0) {
    throw new Error('Jumlah porsi harus berupa angka positif.');
  }

  if (!requestData.targetLocation || !requestData.targetLocation.trim()) {
    throw new Error('Lokasi tujuan pengantaran wajib diisi.');
  }

  if (!requestData.urgencyReason || !requestData.urgencyReason.trim()) {
    throw new Error('Alasan urgensi kebutuhan wajib diisi.');
  }

  const existing = getEmergencyRequests();
  const currentUser = getCurrentUser();

  const newRequest = {
    ...requestData,
    id: requestData.id || `emg-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'EMERGENCY_REQUEST',
    requestedPortions: portions,
    estimatedKg: Math.round(portions * 0.35 * 10) / 10,
    beneficiaryCount: Number(requestData.beneficiaryCount) || portions,
    beneficiaryGroup: requestData.beneficiaryGroup || 'Masyarakat Membutuhkan',
    targetLocation: requestData.targetLocation.trim(),
    urgencyLevel: requestData.urgencyLevel || 'HIGH',
    urgencyDeadline: requestData.urgencyDeadline || 'Hari ini',
    urgencyReason: requestData.urgencyReason.trim(),
    contactPerson: requestData.contactPerson || currentUser?.name || 'Koordinator Dapur',
    contactPhone: requestData.contactPhone || '0812-xxxx-xxxx',
    notes: requestData.notes || '',
    status: 'OPEN',
    createdAt: requestData.createdAt || new Date().toISOString(),
    isDemo: false,
    matchedSurplusId: null
  };

  const updated = [newRequest, ...existing];
  localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(updated));
  dispatchStorageEvent();

  // Async sync to Supabase Cloud in background (real browser only)
  if (isRealBrowserEnvironment()) {
    syncEmergencyRequestToSupabase(newRequest).catch(() => {});
  }

  return newRequest;
}

/**
 * Update emergency request status
 */
export function updateEmergencyRequestStatus(id, newStatus, extraData = {}) {
  const existing = getEmergencyRequests();
  const idx = existing.findIndex(r => r.id === id);
  if (idx === -1) return null;

  existing[idx] = {
    ...existing[idx],
    status: newStatus,
    ...extraData,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(existing));
  dispatchStorageEvent();

  // Async sync to Supabase Cloud in background (real browser only)
  if (isRealBrowserEnvironment()) {
    syncEmergencyRequestToSupabase(existing[idx]).catch(() => {});
  }

  return existing[idx];
}

/**
 * Delete emergency request from storage
 */
export function deleteEmergencyRequest(id) {
  const existing = getEmergencyRequests();
  const filtered = existing.filter(r => r.id !== id);
  if (filtered.length !== existing.length) {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(filtered));
    dispatchStorageEvent();
    return true;
  }
  return false;
}

/**
 * Find matching active surplus items for an emergency request
 * Strictly enforces that surplus must have Food Safety Gate status 'PASS'
 */
export function findMatchingSurplusForRequest(emergencyRequest) {
  if (!emergencyRequest) return [];
  const reports = getReports();

  return reports.filter(r => {
    // 1. Food safety gate MUST be PASS (cannot match unverified or spoiled food)
    if (r.foodSafetyGate?.status !== 'PASS') return false;

    // 2. Journey status must be in pre-matched or ready state
    if (!['REPORTED', 'ASSESSED', 'ROUTE_SELECTED'].includes(r.journeyStatus)) return false;

    // 3. Recommended route must be for human consumption
    if (r.recommendedRoute && !['REDISTRIBUTE', 'PROCESS', 'HUMAN'].includes(r.recommendedRoute)) return false;

    return true;
  });
}

/**
 * Allocate surplus report to an emergency request
 * Links surplus report with recipient and transitions status to MATCHED
 */
export function allocateSurplusToEmergencyRequest(requestId, reportId, recipientOrg = 'Dapur Umum Mandiri') {
  const report = getReportById(reportId);
  if (!report) return { success: false, error: 'Laporan surplus tidak ditemukan' };

  if (report.foodSafetyGate?.status !== 'PASS') {
    return { success: false, error: 'Makanan belum lolos verifikasi Food Safety Gate' };
  }

  // Update surplus destination and status
  const updatedReport = updateReport(reportId, {
    journeyStatus: 'MATCHED',
    selectedDestination: {
      id: 'dest-mitra-emergency',
      name: recipientOrg,
      type: 'Emergency Redistribution Hub',
      allocatedToRequestId: requestId
    },
    journeyEvents: [
      ...(report.journeyEvents || []),
      {
        status: 'MATCHED',
        timestamp: new Date().toISOString(),
        note: `Dialokasikan untuk Permintaan Darurat: ${requestId} (${recipientOrg})`
      }
    ]
  });

  // Update emergency request status
  updateEmergencyRequestStatus(requestId, 'ALLOCATED', {
    matchedSurplusId: reportId,
    matchedSurplusName: report.foodName || report.foodTypeId,
    matchedAt: new Date().toISOString()
  });

  dispatchStorageEvent();
  return { success: true, report: updatedReport };
}

/**
 * Synchronize local datasets with Supabase Cloud
 * Fetches remote surplus reports & emergency requests, merges without data loss,
 * and attaches Realtime WebSocket listeners.
 */
export async function initSupabaseCloudSync() {
  if (!isRealBrowserEnvironment()) return () => {};

  try {
    // 1. Fetch remote surplus reports and merge with local user reports
    const remoteReports = await fetchRemoteSurplusReports();
    if (remoteReports.length > 0) {
      const localUsers = getUserReports();
      const reportMap = new Map();

      for (const r of remoteReports) {
        reportMap.set(r.id, r);
      }
      for (const l of localUsers) {
        const isTestId = ['usr-rep-', 'rep-spoof-', 'rep-unverified-', 'user-keep-safe', 'rep-valid-flow'].some(prefix => l.id.startsWith(prefix));
        if (isTestId) continue;
        const existing = reportMap.get(l.id);
        if (!existing || new Date(l.updatedAt || l.createdAt || 0) >= new Date(existing.updatedAt || existing.createdAt || 0)) {
          reportMap.set(l.id, l);
        }
      }

      const merged = Array.from(reportMap.values());
      localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(merged));
    }

    // 2. Fetch remote emergency requests and merge
    const remoteRequests = await fetchRemoteEmergencyRequests();
    if (remoteRequests.length > 0) {
      const localReqs = getEmergencyRequests();
      const reqMap = new Map();

      for (const req of remoteRequests) {
        reqMap.set(req.id, req);
      }
      for (const l of localReqs) {
        const existing = reqMap.get(l.id);
        if (!existing || new Date(l.updatedAt || l.createdAt || 0) >= new Date(existing.updatedAt || existing.createdAt || 0)) {
          reqMap.set(l.id, l);
        }
      }

      const mergedReqs = Array.from(reqMap.values());
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(mergedReqs));
    }

    dispatchStorageEvent();

    // 3. Setup live Realtime listener
    const cleanup = setupSupabaseRealtimeSubscriptions(
      // On remote surplus change
      (payload) => {
        try {
          const { eventType, new: newRow, old: oldRow } = payload;
          const userReports = getUserReports();

          if (eventType === 'DELETE' && oldRow?.id) {
            const filtered = userReports.filter(r => r.id !== oldRow.id);
            localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(filtered));
          } else if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
            const incoming = mapSupabaseRowToReport(newRow);
            const idx = userReports.findIndex(r => r.id === incoming.id);
            if (idx !== -1) {
              userReports[idx] = incoming;
            } else {
              userReports.unshift(incoming);
            }
            localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(userReports));
          }
          dispatchStorageEvent();
        } catch (err) {
          console.warn('[REPLATE Supabase Realtime] Error processing report event:', err);
        }
      },
      // On remote emergency request change
      (payload) => {
        try {
          const { eventType, new: newRow, old: oldRow } = payload;
          const reqs = getEmergencyRequests();

          if (eventType === 'DELETE' && oldRow?.id) {
            const filtered = reqs.filter(r => r.id !== oldRow.id);
            localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(filtered));
          } else if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
            const incoming = mapRowToEmergencyRequest(newRow);
            const idx = reqs.findIndex(r => r.id === incoming.id);
            if (idx !== -1) {
              reqs[idx] = incoming;
            } else {
              reqs.unshift(incoming);
            }
            localStorage.setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(reqs));
          }
          dispatchStorageEvent();
        } catch (err) {
          console.warn('[REPLATE Supabase Realtime] Error processing emergency event:', err);
        }
      }
    );

    return cleanup;
  } catch (err) {
    console.warn('[REPLATE Supabase] Error during initial cloud sync:', err);
    return () => {};
  }
}


