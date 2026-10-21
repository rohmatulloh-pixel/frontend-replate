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
  deleteEmergencyRequestFromSupabase,
  fetchRemoteSurplusReports,
  fetchRemoteEmergencyRequests,
  setupSupabaseRealtimeSubscriptions,
  mapSupabaseRowToReport,
  mapRowToEmergencyRequest,
  syncUserToSupabase,
  fetchRemoteUsers,
  generateUUID
} from './supabase.js';
import api, { mapReportToBackendDto, mapBackendListingToReport } from '../services/api.js';

export const STORAGE_KEYS = {
  USER_REPORTS: 'replate_user_reports_v2',
  DEMO_REPORTS: 'replate_demo_reports_v2',
  LEGACY_REPORTS: 'replate_surplus_reports_v1',
  PREFERENCES: 'replate_user_preferences_v1',
  DEMO_FLAG: 'replate_demo_loaded_v1',
  USER_SESSION: 'replate_user_session_v1',
  REGISTERED_USERS: 'replate_registered_users_v1',
  EMERGENCY_REQUESTS: 'replate_emergency_requests_v1',
  DELETED_REPORT_IDS: 'replate_deleted_report_ids_v1',
  DELETED_EMERGENCY_IDS: 'replate_deleted_emergency_ids_v1',
  SOS_BROADCASTS: 'replate_sos_broadcasts_v1',
  SOS_RESPONSES: 'replate_sos_responses_v1'
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

// ============================================================================
// OPTION 2 ZERO-LOCALSTORAGE ARCHITECTURE:
// 1. Session state lives in sessionStorage (cleared on tab close, kept on F5).
// 2. Business data (reports, emergency requests, demo, SOS) lives 100% in RAM memory.
// 3. Zero writes or reads from localStorage in client browser.
// 4. Automatic purge of any legacy localStorage data on initial load.
// ============================================================================
const inMemoryDataStore = new Map();

export function getSessionStore() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.sessionStorage) {
    return globalThis.sessionStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (key) => inMemoryDataStore.get(`session:${key}`) || null,
    setItem: (key, val) => inMemoryDataStore.set(`session:${key}`, String(val)),
    removeItem: (key) => inMemoryDataStore.delete(`session:${key}`),
    clear: () => {
      for (const k of inMemoryDataStore.keys()) {
        if (k.startsWith('session:')) inMemoryDataStore.delete(k);
      }
    }
  };
}

export function getDataStore() {
  if (isRealBrowserEnvironment()) {
    // In real browser client: 100% In-Memory (Zero disk persistence / Zero localStorage)
    return {
      getItem: (key) => (inMemoryDataStore.has(key) ? inMemoryDataStore.get(key) : null),
      setItem: (key, val) => {
        inMemoryDataStore.set(key, String(val));
      },
      removeItem: (key) => {
        inMemoryDataStore.delete(key);
      },
      clear: () => inMemoryDataStore.clear()
    };
  }
  // In Node.js testing environment: delegate to test runner's mock storage
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return {
    getItem: (key) => (inMemoryDataStore.has(key) ? inMemoryDataStore.get(key) : null),
    setItem: (key, val) => inMemoryDataStore.set(key, String(val)),
    removeItem: (key) => inMemoryDataStore.delete(key),
    clear: () => inMemoryDataStore.clear()
  };
}

// Automatic purge of legacy localStorage keys in real browser on startup
if (isRealBrowserEnvironment()) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.values(STORAGE_KEYS).forEach(k => {
        try { window.localStorage.removeItem(k); } catch {}
      });
      try { window.localStorage.removeItem('replate_access_token'); } catch {}
      try { window.localStorage.removeItem('replate_lang_v1'); } catch {}
    }
  } catch (err) {
    console.warn('[REPLATE Storage] Legacy localStorage purge notice:', err);
  }
}


/**
 * Retrieve set of permanently deleted report IDs (Tombstones) to prevent cloud re-download (resurrection)
 */
export function getDeletedReportIds() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return new Set();
  try {
    const raw = getDataStore().getItem(STORAGE_KEYS.DELETED_REPORT_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Record a report ID as permanently deleted in local tombstone index
 */
export function recordDeletedReportId(id) {
  if (!id || (typeof window === 'undefined' && typeof localStorage === 'undefined')) return;
  try {
    const set = getDeletedReportIds();
    set.add(id);
    getDataStore().setItem(STORAGE_KEYS.DELETED_REPORT_IDS, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('[REPLATE Storage] Error recording deleted report ID:', err);
  }
}

/**
 * Check if a report ID has been marked as deleted
 */
export function isReportDeleted(id) {
  if (!id) return false;
  return getDeletedReportIds().has(id);
}

/**
 * Retrieve set of permanently deleted emergency request IDs (Tombstones)
 */
export function getDeletedEmergencyIds() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return new Set();
  try {
    const raw = getDataStore().getItem(STORAGE_KEYS.DELETED_EMERGENCY_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Record an emergency request ID as permanently deleted in local tombstone index
 */
export function recordDeletedEmergencyId(id) {
  if (!id || (typeof window === 'undefined' && typeof localStorage === 'undefined')) return;
  try {
    const set = getDeletedEmergencyIds();
    set.add(id);
    getDataStore().setItem(STORAGE_KEYS.DELETED_EMERGENCY_IDS, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('[REPLATE Storage] Error recording deleted emergency ID:', err);
  }
}

/**
 * Check if an emergency request ID has been marked as deleted
 */
export function isEmergencyDeleted(id) {
  if (!id) return false;
  return getDeletedEmergencyIds().has(id);
}

/**
 * Backward-compatible migration from legacy storage key.
 * Safely partitions legacy reports into isolated user and demo stores,
 * preserving all user-created records and evaluating missing safety gates.
 */
export function migrateLegacyStorage() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    const legacyRaw = getDataStore().getItem(STORAGE_KEYS.LEGACY_REPORTS);
    if (!legacyRaw) return;

    let parsed;
    try {
      parsed = JSON.parse(legacyRaw);
    } catch {
      // Malformed legacy data - clear to unblock normal operation
      getDataStore().removeItem(STORAGE_KEYS.LEGACY_REPORTS);
      return;
    }

    if (!Array.isArray(parsed)) {
      getDataStore().removeItem(STORAGE_KEYS.LEGACY_REPORTS);
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

    getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(Array.from(userMap.values())));
    if (demoMap.size > 0) {
      getDataStore().setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(Array.from(demoMap.values())));
    }
    getDataStore().removeItem(STORAGE_KEYS.LEGACY_REPORTS);
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
    const raw = getDataStore().getItem(STORAGE_KEYS.USER_REPORTS);
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
    const raw = getDataStore().getItem(STORAGE_KEYS.DEMO_REPORTS);
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
    getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(updated));
    dispatchStorageEvent();

    // Async sync to Supabase Cloud in background (real browser only)
    if (isRealBrowserEnvironment()) {
      syncReportToSupabase(newReport).catch(() => {});

      // Async sync to NestJS Backend API if enabled
      if (api.isLiveApiEnabled()) {
        (async () => {
          try {
            await ensureApiToken();
            const dto = mapReportToBackendDto(newReport);
            const createdRes = await api.surplus.create(dto);
            const backendListing = createdRes?.data || createdRes;

            // If a destination was selected, immediately assign it to trigger backend Journey creation
            if (backendListing?.id && newReport.selectedDestination) {
              const recipientUuid = (typeof newReport.selectedDestination.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(newReport.selectedDestination.id))
                ? newReport.selectedDestination.id
                : '20000000-0000-0000-0000-000000000001';

              try {
                const assignRes = await api.surplus.assignDestination(
                  backendListing.id,
                  recipientUuid,
                  `Dialokasikan ke: ${newReport.selectedDestination.name || 'Dapur Sosial Barokah Matraman'}`
                );
                const journey = assignRes?.data || assignRes;

                // Sync local report IDs with backend UUIDs to prevent duplication
                const curUsers = getUserReports();
                const idx = curUsers.findIndex(r => r.id === newReport.id);
                if (idx !== -1) {
                  curUsers[idx].id = backendListing.id;
                  curUsers[idx].journeyId = journey?.id || backendListing.id;
                  curUsers[idx].journeyStatus = 'MATCHED';
                  getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(curUsers));
                  dispatchStorageEvent();
                }
              } catch (assignErr) {
                console.warn('[REPLATE Backend API] Assign destination warning:', assignErr);
              }
            }
            await syncBackendSurplusToLocal();
          } catch (err) {
            console.warn('[REPLATE Backend API] Surplus creation warning:', err);
          }
        })();
      }
    }

    return newReport;
  } catch (err) {
    console.error('[REPLATE Storage] Error saving report:', err);
    throw err;
  }
}

/**
 * Ensures an active auth token for background API requests
 */
export async function ensureApiToken() {
  if (api.getAuthToken()) return true;
  try {
    const session = getCurrentUser();
    const email = session?.role === 'supplier' || session?.email === 'catering@replate.id'
      ? 'supplier@replate.id'
      : (session?.email || 'supplier@replate.id');
    const pw = session?.role === 'admin' ? 'admin123' : (session?.role === 'mitra' ? 'mitra123' : 'supplier123');
    await api.auth.login(email, pw);
    return Boolean(api.getAuthToken());
  } catch {
    return false;
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
      getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(userReports));
      dispatchStorageEvent();

      // Async sync to Supabase Cloud in background (real browser only)
      if (isRealBrowserEnvironment()) {
        syncReportToSupabase(userReports[uIdx]).catch(() => {});

        // Async sync to NestJS Backend API if enabled
        if (api.isLiveApiEnabled()) {
          (async () => {
            try {
              await ensureApiToken();
              const journeyId = userReports[uIdx].journeyId || (userReports[uIdx].journeys?.[0]?.id) || id;

              if (updates.journeyStatus === 'RECEIVED') {
                await api.journeys.confirmReceipt(journeyId, updates.actualReceivedKg || userReports[uIdx].quantity, updates.note);
              } else if (updates.journeyStatus === 'CANCELLED') {
                await api.journeys.cancel(journeyId, {
                  cancellationReason: updates.cancellationReason || 'Cancelled by user',
                  isIncidentReport: Boolean(updates.isIncidentReport),
                  issueReportedBy: updates.issueReportedBy || undefined,
                  note: updates.note || undefined,
                });
              } else if (updates.journeyStatus) {
                await api.journeys.advanceStatus(journeyId, updates.journeyStatus, updates.note);
              }
              await syncBackendSurplusToLocal();
            } catch (err) {
              console.warn('[REPLATE Backend API] Journey status update warning:', err);
            }
          })();
        }
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
      getDataStore().setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(demoReports));
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
    recordDeletedReportId(id);

    const userReports = getUserReports();
    const uFiltered = userReports.filter(r => r.id !== id);
    let deleted = false;

    if (uFiltered.length !== userReports.length) {
      getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(uFiltered));
      deleted = true;
    }

    const demoReports = getDemoReports();
    const dFiltered = demoReports.filter(r => r.id !== id);
    if (dFiltered.length !== demoReports.length) {
      getDataStore().setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(dFiltered));
      deleted = true;
    }

    if (deleted) {
      dispatchStorageEvent();

      if (isRealBrowserEnvironment()) {
        deleteReportFromSupabase(id).catch(() => {});
        if (api.isLiveApiEnabled()) {
          api.surplus?.delete?.(id)?.catch(() => {});
        }
      }

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
    getDataStore().removeItem(STORAGE_KEYS.USER_REPORTS);
    getDataStore().removeItem(STORAGE_KEYS.DEMO_REPORTS);
    getDataStore().removeItem(STORAGE_KEYS.DEMO_FLAG);
    getDataStore().removeItem(STORAGE_KEYS.LEGACY_REPORTS);
    getDataStore().removeItem(STORAGE_KEYS.DELETED_REPORT_IDS);
    getDataStore().removeItem(STORAGE_KEYS.DELETED_EMERGENCY_IDS);
    getDataStore().removeItem(STORAGE_KEYS.SOS_BROADCASTS);
    getDataStore().removeItem(STORAGE_KEYS.SOS_RESPONSES);
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
  return getDataStore().getItem(STORAGE_KEYS.DEMO_FLAG) === 'true';
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

    // Allow re-loading demo items if previously deleted
    try {
      const delSet = getDeletedReportIds();
      let changed = false;
      for (const c of curated) {
        if (delSet.has(c.id)) {
          delSet.delete(c.id);
          changed = true;
        }
      }
      if (changed && true) {
        getDataStore().setItem(STORAGE_KEYS.DELETED_REPORT_IDS, JSON.stringify(Array.from(delSet)));
      }
    } catch {}

    for (const d of existingDemo) {
      demoMap.set(d.id, d);
    }
    for (const c of curated) {
      if (!demoMap.has(c.id)) {
        demoMap.set(c.id, c);
      }
    }

    const mergedDemo = Array.from(demoMap.values());
    getDataStore().setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(mergedDemo));
    getDataStore().setItem(STORAGE_KEYS.DEMO_FLAG, 'true');

    // Load demo emergency requests if none exist
    try {
      const existingEmg = getEmergencyRequests();
      if (existingEmg.length === 0) {
        const demoEmg = getCuratedDemoEmergencyRequests();
        getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(demoEmg));
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

    // Allow re-resetting demo items if previously deleted
    try {
      const delSet = getDeletedReportIds();
      let changed = false;
      for (const c of freshCurated) {
        if (delSet.has(c.id)) {
          delSet.delete(c.id);
          changed = true;
        }
      }
      if (changed && true) {
        getDataStore().setItem(STORAGE_KEYS.DELETED_REPORT_IDS, JSON.stringify(Array.from(delSet)));
      }
    } catch {}

    getDataStore().setItem(STORAGE_KEYS.DEMO_REPORTS, JSON.stringify(freshCurated));
    getDataStore().setItem(STORAGE_KEYS.DEMO_FLAG, 'true');

    // Reset demo emergency requests while preserving user-created requests
    try {
      const emg = getEmergencyRequests();
      const userEmg = emg.filter(r => !r.isDemo && !String(r.id || '').startsWith('demo-'));
      const freshDemoEmg = getCuratedDemoEmergencyRequests();
      getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify([...userEmg, ...freshDemoEmg]));
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
    getDataStore().removeItem(STORAGE_KEYS.DEMO_REPORTS);
    getDataStore().removeItem(STORAGE_KEYS.DEMO_FLAG);

    // Keep user emergency requests, remove only demo emergency requests
    try {
      const emg = getEmergencyRequests();
      const userEmg = emg.filter(r => !r.isDemo && !String(r.id || '').startsWith('demo-'));
      if (userEmg.length > 0) {
        getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(userEmg));
      } else {
        getDataStore().removeItem(STORAGE_KEYS.EMERGENCY_REQUESTS);
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
    const raw = getSessionStore().getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[REPLATE Storage] Error reading user session:', err);
    return null;
  }
}

/**
 * Get registered user accounts from isolated storage
 */
export function getRegisteredUsers() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = getDataStore().getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('[REPLATE Storage] Error reading registered users:', err);
    return [];
  }
}

/**
 * Register a new user account
 */
export function registerUser({ username, email, password, name, organization, role = 'supplier' }) {
  try {
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();
    const cleanName = String(name || '').trim();
    const cleanOrg = String(organization || '').trim();
    const cleanRole = ['supplier', 'mitra', 'admin'].includes(role) ? role : 'supplier';

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, message: 'Kata sandi minimal 4 karakter.' };
    }
    if (!cleanName) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }

    // Check if username/email already taken in DEMO_USERS
    const takenInDemo = Object.values(DEMO_USERS).some(
      u => u.username.toLowerCase() === cleanUsername || (cleanEmail && u.email.toLowerCase() === cleanEmail)
    );
    if (takenInDemo) {
      return { success: false, message: 'Username atau email ini sudah terdaftar.' };
    }

    const registered = getRegisteredUsers();
    const takenInRegistered = registered.some(
      u => u.username.toLowerCase() === cleanUsername || (cleanEmail && u.email?.toLowerCase() === cleanEmail)
    );
    if (takenInRegistered) {
      return { success: false, message: 'Username atau email ini sudah digunakan.' };
    }

    const roleAvatar = cleanRole === 'supplier' ? '🏪' : cleanRole === 'mitra' ? '🤝' : '👑';
    const roleBadge = cleanRole === 'supplier' ? 'Penyedia Surplus' : cleanRole === 'mitra' ? 'Mitra Penerima' : 'Admin Operasional';

    const newUser = {
      id: generateUUID(),
      username: cleanUsername,
      email: cleanEmail || `${cleanUsername}@replate.id`,
      password: cleanPassword,
      role: cleanRole,
      name: cleanName,
      organization: cleanOrg || (cleanRole === 'supplier' ? 'Dapur Katering Mandiri' : 'Posko Peduli Pangan'),
      avatar: roleAvatar,
      badgeText: roleBadge,
      createdAt: new Date().toISOString()
    };

    registered.push(newUser);
    getDataStore().setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registered));

    // Async sync to Supabase Cloud users table in background (real browser only)
    if (isRealBrowserEnvironment()) {
      syncUserToSupabase(newUser).catch((err) => {
        console.warn('[REPLATE Storage] Background user sync warning:', err);
      });
      if (api.isLiveApiEnabled && api.isLiveApiEnabled()) {
        api.auth.register(newUser).catch((err) => {
          console.warn('[REPLATE Backend Auth] Background register warning:', err);
        });
      }
    }

    // Automatically create active user session
    const sessionUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      organization: newUser.organization,
      avatar: newUser.avatar,
      badgeText: newUser.badgeText,
      loggedInAt: new Date().toISOString()
    };

    getSessionStore().setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionUser));
    dispatchAuthEvent(sessionUser);

    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('[REPLATE Storage] Error registering user:', err);
    return { success: false, message: 'Gagal mendaftarkan akun. Silakan coba lagi.' };
  }
}

/**
 * Log in a user using username or email and password
 */
export function loginUser(identifier, password) {
  try {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPw = String(password || '').trim();

    // 1. Match against demo users
    const matchedKey = Object.keys(DEMO_USERS).find((key) => {
      const u = DEMO_USERS[key];
      return (
        (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === cleanPw
      );
    });

    let matchedUser = matchedKey ? DEMO_USERS[matchedKey] : null;

    // 2. If not a demo user, match against registered users
    if (!matchedUser) {
      const registered = getRegisteredUsers();
      matchedUser = registered.find(
        u => (u.username.toLowerCase() === cleanId || u.email?.toLowerCase() === cleanId) && u.password === cleanPw
      );
    }

    if (!matchedUser) {
      return {
        success: false,
        message: 'Username atau kata sandi tidak sesuai.'
      };
    }

    const sessionUser = {
      id: matchedUser.id,
      username: matchedUser.username,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name,
      organization: matchedUser.organization,
      avatar: matchedUser.avatar || (matchedUser.role === 'supplier' ? '🏪' : '🤝'),
      badgeText: matchedUser.badgeText || (matchedUser.role === 'supplier' ? 'Penyedia Surplus' : 'Mitra Penerima'),
      loggedInAt: new Date().toISOString()
    };

    // If Admin logs in, auto-populate simulation data if none exists
    if (matchedUser.role === 'admin') {
      const existing = getReports();
      if (existing.length === 0) {
        loadDemoData();
      }
    }

    getSessionStore().setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionUser));
    dispatchAuthEvent(sessionUser);

    // Authenticate with live NestJS Backend API if running in real browser
    if (isRealBrowserEnvironment() && api.isLiveApiEnabled()) {
      const backendEmail = matchedUser.role === 'supplier' ? 'supplier@replate.id' : matchedUser.email;
      api.auth.login(backendEmail, matchedUser.password)
        .then(() => {
          syncBackendSurplusToLocal();
        })
        .catch((err) => {
          console.warn('[REPLATE Backend Auth] Background login warning:', err?.message || err);
        });
    }

    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('[REPLATE Storage] Error logging in:', err);
    return { success: false, message: 'Terjadi kesalahan sistem saat masuk.' };
  }
}

/**
 * Asynchronously log in a user with Supabase Cloud real-time check fallback
 */
export async function loginUserAsync(identifier, password) {
  let res = loginUser(identifier, password);
  if (res.success) return res;

  if (isRealBrowserEnvironment()) {
    try {
      const remoteUsers = await fetchRemoteUsers();
      if (remoteUsers && remoteUsers.length > 0) {
        const local = getRegisteredUsers();
        const localEmails = new Set(local.map(u => (u.email || '').toLowerCase()));
        let changed = false;
        for (const ru of remoteUsers) {
          if (!localEmails.has((ru.email || '').toLowerCase())) {
            local.push(ru);
            localEmails.add((ru.email || '').toLowerCase());
            changed = true;
          }
        }
        if (changed) {
          getDataStore().setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(local));
          res = loginUser(identifier, password);
        }
      }
    } catch (err) {
      console.warn('[REPLATE Storage] Cloud login fallback error:', err);
    }
  }
  return res;
}

/**
 * Log out the current user
 */
export function logoutUser() {
  try {
    getSessionStore().removeItem(STORAGE_KEYS.USER_SESSION);
    if (isRealBrowserEnvironment()) {
      api.auth.logout().catch(() => {});
    }
    dispatchAuthEvent(null);
    return true;
  } catch (err) {
    console.error('[REPLATE Storage] Error logging out:', err);
    return false;
  }
}

/**
 * Programmatically open login modal from any component with contextual role/mode/prompt
 */
export function openLoginModal(options = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('replate:open-login', { detail: options }));
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
    const raw = getDataStore().getItem(STORAGE_KEYS.EMERGENCY_REQUESTS);
    if (!raw) {
      if (isDemoMode()) {
        const demoRequests = getCuratedDemoEmergencyRequests();
        getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(demoRequests));
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
  getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(updated));

  try {
    publishSOSBroadcast(newRequest);
  } catch (err) {
    console.warn('[REPLATE Storage] Auto publish SOS broadcast warning:', err);
  }

  dispatchStorageEvent();

  // Async sync to Supabase Cloud in background (real browser only)
  if (isRealBrowserEnvironment()) {
    syncEmergencyRequestToSupabase(newRequest).catch(() => {});
    if (api.isLiveApiEnabled && api.isLiveApiEnabled()) {
      api.emergency?.create?.({
        neededFoodType: newRequest.neededFoodType,
        foodTypeName: newRequest.foodTypeName,
        requestedPortions: Number(newRequest.requestedPortions),
        beneficiaryCount: Number(newRequest.beneficiaryCount),
        beneficiaryGroup: newRequest.beneficiaryGroup,
        targetLocation: newRequest.targetLocation,
        urgencyLevel: newRequest.urgencyLevel,
        urgencyDeadline: newRequest.urgencyDeadline,
        urgencyReason: newRequest.urgencyReason,
        contactPerson: newRequest.contactPerson,
        contactPhone: newRequest.contactPhone,
        notes: newRequest.notes
      })?.catch((err) => {
        console.warn('[REPLATE Backend Emergency] Create sync warning:', err);
      });
    }
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

  getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(existing));
  dispatchStorageEvent();

  // Async sync to Supabase Cloud in background (real browser only)
  if (isRealBrowserEnvironment()) {
    syncEmergencyRequestToSupabase(existing[idx]).catch(() => {});
    if (api.isLiveApiEnabled && api.isLiveApiEnabled()) {
      api.emergency?.updateStatus?.(id, newStatus, extraData?.cancelReason)?.catch((err) => {
        console.warn('[REPLATE Backend Emergency] Status update sync warning:', err);
      });
    }
  }

  if (newStatus === 'FULFILLED' || newStatus === 'CANCELLED') {
    fulfillSOSBroadcast(id);
  }

  return existing[idx];
}

/**
 * Delete emergency request from storage
 */
export function deleteEmergencyRequest(id) {
  recordDeletedEmergencyId(id);
  fulfillSOSBroadcast(id);
  const existing = getEmergencyRequests();
  const filtered = existing.filter(r => r.id !== id);
  if (filtered.length !== existing.length) {
    getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(filtered));
    dispatchStorageEvent();
    if (isRealBrowserEnvironment()) {
      deleteEmergencyRequestFromSupabase(id).catch(() => {});
      if (api.isLiveApiEnabled && api.isLiveApiEnabled()) {
        api.emergency?.delete?.(id)?.catch(() => {});
      }
    }
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

  if (isRealBrowserEnvironment() && api.isLiveApiEnabled && api.isLiveApiEnabled()) {
    api.emergency?.allocate?.(requestId, reportId, `Dialokasikan untuk Permintaan Darurat: ${requestId}`)?.catch((err) => {
      console.warn('[REPLATE Backend Emergency] Allocate sync warning:', err);
    });
  }

  dispatchStorageEvent();
  return { success: true, report: updatedReport };
}

/**
 * Calculate broadcast expiry timestamp
 */
export function calculateSOSExpiry(urgencyLevel) {
  const now = Date.now();
  if (urgencyLevel === 'CRITICAL') {
    return new Date(now + 2 * 60 * 60 * 1000).toISOString();
  }
  if (urgencyLevel === 'HIGH') {
    return new Date(now + 4 * 60 * 60 * 1000).toISOString();
  }
  // MEDIUM: end of current day in WIB (UTC+7)
  const d = new Date(now + 7 * 60 * 60 * 1000);
  const endOfDayUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 16, 59, 59, 999));
  return (endOfDayUtc.getTime() > now ? endOfDayUtc : new Date(endOfDayUtc.getTime() + 24 * 60 * 60 * 1000)).toISOString();
}

/**
 * Retrieve all raw broadcasts from storage
 */
export function getAllSOSBroadcasts() {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = getDataStore().getItem(STORAGE_KEYS.SOS_BROADCASTS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Expire broadcasts that passed expiresAt
 */
export function expireOverdueSOSBroadcasts() {
  const all = getAllSOSBroadcasts();
  const now = Date.now();
  let changed = false;

  const updated = all.map((b) => {
    if (b.status === 'ACTIVE' && new Date(b.expiresAt || 0).getTime() <= now) {
      changed = true;
      return { ...b, status: 'EXPIRED', updatedAt: new Date().toISOString() };
    }
    return b;
  });

  if (changed && true) {
    getDataStore().setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(updated));
    dispatchStorageEvent();
  }
  return updated;
}

/**
 * Publish a new SOS Broadcast from an emergency request
 */
export function publishSOSBroadcast(emergencyRequest) {
  if (!emergencyRequest) return null;
  const broadcasts = getAllSOSBroadcasts();

  // Avoid creating duplicate for same emergencyRequestId
  const existingIdx = broadcasts.findIndex(b => b.emergencyRequestId === emergencyRequest.id);
  const expiresAt = calculateSOSExpiry(emergencyRequest.urgencyLevel);
  const portions = Number(emergencyRequest.requestedPortions) || 10;
  const targetQuantityKg = Number(emergencyRequest.estimatedKg) || Math.round(portions * 0.35 * 100) / 100;

  const newBroadcast = {
    id: `sos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    emergencyRequestId: emergencyRequest.id,
    recipientOrgName: emergencyRequest.requestedBy?.organization || emergencyRequest.requestedBy?.name || emergencyRequest.recipientOrg || 'Mitra Posko Darurat',
    recipientLocation: emergencyRequest.targetLocation || 'Posko Darurat',
    neededFoodType: emergencyRequest.neededFoodType || 'cooked_meals',
    foodTypeName: emergencyRequest.foodTypeName || emergencyRequest.neededFoodType,
    requestedPortions: portions,
    targetQuantityKg,
    urgencyLevel: emergencyRequest.urgencyLevel || 'CRITICAL',
    urgencyDeadline: emergencyRequest.urgencyDeadline || 'Hari ini',
    urgencyReason: emergencyRequest.urgencyReason || 'Kebutuhan pangan mendesak',
    contactPerson: emergencyRequest.contactPerson || 'Koordinator Posko',
    contactPhone: emergencyRequest.contactPhone || '0812-0000-0000',
    radiusKm: 10,
    expiresAt,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    broadcasts[existingIdx] = { ...broadcasts[existingIdx], ...newBroadcast, id: broadcasts[existingIdx].id };
  } else {
    broadcasts.unshift(newBroadcast);
  }

  if (true) {
    getDataStore().setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(broadcasts));
    dispatchStorageEvent();
  }

  return newBroadcast;
}

/**
 * Get active, unexpired broadcasts
 */
export function getActiveSOSBroadcasts() {
  expireOverdueSOSBroadcasts();
  const all = getAllSOSBroadcasts();
  const now = Date.now();

  return all.filter((b) => b.status === 'ACTIVE' && new Date(b.expiresAt || 0).getTime() > now);
}

/**
 * Retrieve supplier response history
 */
export function getSOSHistory(supplierOrgId = null) {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return [];
  try {
    const raw = getDataStore().getItem(STORAGE_KEYS.SOS_RESPONSES);
    if (!raw) return [];
    const list = JSON.parse(raw);
    const arr = Array.isArray(list) ? list : [];
    if (!supplierOrgId) return arr;
    return arr.filter(r => r.supplierOrgId === supplierOrgId);
  } catch {
    return [];
  }
}

/**
 * Respond to an active SOS Broadcast as a supplier
 */
export function respondToSOSBroadcast(broadcastId, notes = '', actingUser = null) {
  const broadcasts = getAllSOSBroadcasts();
  const idx = broadcasts.findIndex(b => b.id === broadcastId);
  if (idx === -1) return { success: false, error: 'Siaran SOS tidak ditemukan' };

  const broadcast = broadcasts[idx];
  if (broadcast.status !== 'ACTIVE') {
    return { success: false, error: `Siaran SOS sudah tidak aktif (${broadcast.status})` };
  }
  if (new Date(broadcast.expiresAt).getTime() <= Date.now()) {
    broadcasts[idx].status = 'EXPIRED';
    if (true) {
      getDataStore().setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(broadcasts));
      dispatchStorageEvent();
    }
    return { success: false, error: 'Siaran SOS telah kedaluwarsa' };
  }

  const user = actingUser || getCurrentUser();
  const supplierOrgName = user?.organization || user?.name || 'Penyedia Surplus Katering';
  const supplierOrgId = user?.organizationId || user?.id || 'usr-supplier';

  // 1. Create emergency SurplusListing in local reports
  const portions = Number(broadcast.requestedPortions) || 20;
  const quantity = Number(broadcast.targetQuantityKg) || Math.round(portions * 0.35 * 100) / 100;

  const newReport = saveReport({
    foodName: broadcast.foodTypeName || 'Makanan Siap Santap Darurat',
    foodTypeId: 'cooked-rice',
    quantity,
    unit: 'kg',
    portions,
    sourceContextId: 'Catering',
    conditionId: 'suitable',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    storageTempId: 'hot_holding_above_60',
    timeWindowId: 'under_2h',
    storageTemp: 65,
    packagingStatus: 'intact_proper',
    hygieneAdequate: true,
    storageHistoryKnown: true,
    isPreparedToday: true,
    recommendedRoute: 'REDISTRIBUTE',
    rescueScore: 92,
    isEmergencyResponse: true,
    notes: notes ? `[RESPONS DARURAT SOS] ${notes}` : '[RESPONS DARURAT SOS] Atestasi donor: Makanan aman, higienis, dan layak konsumsi.',
    selectedDestination: {
      id: 'dest-emergency-posko',
      name: broadcast.recipientOrgName,
      type: 'Posko Darurat',
      address: broadcast.recipientLocation,
      contactPerson: broadcast.contactPerson,
      contactPhone: broadcast.contactPhone,
    },
    recipientPartner: broadcast.recipientOrgName,
    journeyStatus: 'MATCHED',
    reportedBy: {
      id: user?.id || 'usr-supplier',
      name: supplierOrgName,
      role: 'supplier',
      organization: supplierOrgName,
    },
  });

  // 2. Mark broadcast as RESPONDED
  broadcasts[idx] = {
    ...broadcasts[idx],
    status: 'RESPONDED',
    respondedAt: new Date().toISOString(),
    respondedBy: {
      supplierOrgId,
      supplierOrgName,
      supplierUserId: user?.id,
      surplusReportId: newReport.id,
      notes,
    },
    updatedAt: new Date().toISOString(),
  };
  if (true) {
    getDataStore().setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(broadcasts));
  }

  // 3. Update emergency request status to ALLOCATED
  if (broadcast.emergencyRequestId) {
    updateEmergencyRequestStatus(broadcast.emergencyRequestId, 'ALLOCATED', {
      matchedSurplusId: newReport.id,
      matchedSurplusName: newReport.foodName,
      matchedAt: new Date().toISOString(),
    });
  }

  // 4. Save response to SOS history
  const history = getSOSHistory();
  const responseEntry = {
    id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    broadcastId: broadcast.id,
    emergencyRequestId: broadcast.emergencyRequestId,
    recipientOrgName: broadcast.recipientOrgName,
    recipientLocation: broadcast.recipientLocation,
    foodTypeName: broadcast.foodTypeName,
    requestedPortions: broadcast.requestedPortions,
    targetQuantityKg: broadcast.targetQuantityKg,
    urgencyLevel: broadcast.urgencyLevel,
    supplierOrgId,
    supplierOrgName,
    surplusReportId: newReport.id,
    notes,
    respondedAt: new Date().toISOString(),
    journeyStatus: 'MATCHED',
  };
  history.unshift(responseEntry);
  if (true) {
    getDataStore().setItem(STORAGE_KEYS.SOS_RESPONSES, JSON.stringify(history));
  }

  dispatchStorageEvent();

  // Async sync to Backend API if live
  if (isRealBrowserEnvironment() && api.isLiveApiEnabled && api.isLiveApiEnabled()) {
    api.emergencyBroadcasts?.respond?.(broadcastId, { notes })?.catch((err) => {
      console.warn('[REPLATE Backend SOS] Respond sync warning:', err);
    });
  }

  return {
    success: true,
    message: 'Konfirmasi bantuan darurat berhasil disimpan!',
    report: newReport,
    response: responseEntry,
  };
}

/**
 * Fulfill SOS broadcast when emergency request is fulfilled
 */
export function fulfillSOSBroadcast(broadcastId) {
  const broadcasts = getAllSOSBroadcasts();
  const idx = broadcasts.findIndex(b => b.id === broadcastId || b.emergencyRequestId === broadcastId);
  if (idx !== -1) {
    broadcasts[idx].status = 'FULFILLED';
    broadcasts[idx].updatedAt = new Date().toISOString();
    if (true) {
      getDataStore().setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(broadcasts));
      dispatchStorageEvent();
    }
  }
}

/**
 * Synchronize local datasets with Supabase Cloud
 * Fetches remote surplus reports & emergency requests, merges without data loss,
 * and attaches Realtime WebSocket listeners.
 */
export async function initSupabaseCloudSync() {
  if (!isRealBrowserEnvironment()) return () => {};

  try {
    // 1. If backend API toggle is explicitly enabled, sync from Render NestJS
    if (api.isLiveApiEnabled()) {
      syncBackendSurplusToLocal().catch(() => {});
    }

    // 2. Pure Supabase Cloud Surplus Sync (Bidirectional & Idempotent)
    (async () => {
      try {
        const remoteReports = await fetchRemoteSurplusReports().catch(() => []);
        const localUsers = getUserReports();
        const deletedIds = getDeletedReportIds();
        const remoteMap = new Map();
        for (const r of (remoteReports || [])) {
          if (r?.id) remoteMap.set(r.id, r);
        }

        let localChanged = false;
        // Merge remote items into local
        for (const r of (remoteReports || [])) {
          // If deleted locally, never resurrect into localStorage!
          if (deletedIds.has(r.id)) {
            deleteReportFromSupabase(r.id).catch(() => {});
            continue;
          }
          const lIdx = localUsers.findIndex(l => l.id === r.id);
          if (lIdx === -1) {
            localUsers.unshift(r);
            localChanged = true;
          } else {
            const remoteTime = new Date(r.updatedAt || r.createdAt || 0).getTime();
            const localTime = new Date(localUsers[lIdx].updatedAt || localUsers[lIdx].createdAt || 0).getTime();
            if (remoteTime > localTime) {
              localUsers[lIdx] = r;
              localChanged = true;
            }
          }
        }

        // Upload any local reports that are not yet on Supabase Cloud
        for (const l of localUsers) {
          const isTestId = ['usr-rep-', 'rep-spoof-', 'rep-unverified-', 'user-keep-safe', 'rep-valid-flow'].some(prefix => l.id?.startsWith(prefix));
          if (isTestId || l.isDemo || deletedIds.has(l.id)) continue;
          if (!remoteMap.has(l.id)) {
            syncReportToSupabase(l).catch(() => {});
          }
        }

        if (localChanged) {
          getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(localUsers));
          dispatchStorageEvent();
        }
      } catch (err) {
        console.warn('[REPLATE Storage] Background surplus sync error:', err);
      }
    })();

    // 3. Pure Supabase Cloud Emergency Requests Sync (Bidirectional & Idempotent)
    (async () => {
      try {
        const remoteRequests = await fetchRemoteEmergencyRequests().catch(() => []);
        const localReqs = getEmergencyRequests();
        const deletedEmgIds = getDeletedEmergencyIds();
        const remoteReqMap = new Map();
        for (const req of (remoteRequests || [])) {
          if (req?.id) remoteReqMap.set(req.id, req);
        }

        let reqsChanged = false;
        // Merge remote requests into local
        for (const req of (remoteRequests || [])) {
          // If deleted locally, never resurrect into localStorage!
          if (deletedEmgIds.has(req.id)) {
            deleteEmergencyRequestFromSupabase(req.id).catch(() => {});
            continue;
          }
          const lIdx = localReqs.findIndex(l => l.id === req.id);
          if (lIdx === -1) {
            localReqs.unshift(req);
            reqsChanged = true;
          } else {
            const remoteTime = new Date(req.updatedAt || req.createdAt || 0).getTime();
            const localTime = new Date(localReqs[lIdx].updatedAt || localReqs[lIdx].createdAt || 0).getTime();
            if (remoteTime > localTime) {
              localReqs[lIdx] = req;
              reqsChanged = true;
            }
          }
        }

        // Upload any local non-demo requests to Supabase Cloud
        for (const l of localReqs) {
          if (l.isDemo || deletedEmgIds.has(l.id)) continue;
          if (!remoteReqMap.has(l.id)) {
            syncEmergencyRequestToSupabase(l).catch(() => {});
          }
        }

        if (reqsChanged) {
          getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(localReqs));
          dispatchStorageEvent();
        }
      } catch (err) {
        console.warn('[REPLATE Storage] Background emergency sync error:', err);
      }
    })();

    // 4. Pure Supabase Cloud Registered Users Sync (Bidirectional & Idempotent)
    (async () => {
      try {
        const remoteUsers = await fetchRemoteUsers().catch(() => []);
        const localUsers = getRegisteredUsers();
        const localEmailSet = new Set(localUsers.map(u => (u.email || '').toLowerCase()));
        let usersChanged = false;

        for (const ru of remoteUsers) {
          const email = (ru.email || '').toLowerCase();
          if (email && !localEmailSet.has(email)) {
            localUsers.push(ru);
            localEmailSet.add(email);
            usersChanged = true;
          }
        }

        // Upload any local registered users that are not on Supabase Cloud
        const remoteEmailSet = new Set(remoteUsers.map(ru => (ru.email || '').toLowerCase()));
        for (const lu of localUsers) {
          const email = (lu.email || '').toLowerCase();
          if (email && !remoteEmailSet.has(email)) {
            syncUserToSupabase(lu).catch(() => {});
          }
        }

        if (usersChanged) {
          getDataStore().setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(localUsers));
          dispatchStorageEvent();
        }
      } catch (err) {
        console.warn('[REPLATE Storage] Background user sync error:', err);
      }
    })();

    // 5. Setup live Realtime listener
    const cleanup = setupSupabaseRealtimeSubscriptions(
      // On remote surplus change
      (payload) => {
        try {
          const { eventType, new: newRow, old: oldRow } = payload;
          const userReports = getUserReports();

          if (eventType === 'DELETE' && oldRow?.id) {
            recordDeletedReportId(oldRow.id);
            const filtered = userReports.filter(r => r.id !== oldRow.id);
            getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(filtered));
          } else if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
            const incoming = mapSupabaseRowToReport(newRow);
            if (isReportDeleted(incoming.id)) return;
            const idx = userReports.findIndex(r => r.id === incoming.id);
            if (idx !== -1) {
              userReports[idx] = incoming;
            } else {
              userReports.unshift(incoming);
            }
            getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(userReports));
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
            recordDeletedEmergencyId(oldRow.id);
            const filtered = reqs.filter(r => r.id !== oldRow.id);
            getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(filtered));
          } else if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
            const incoming = mapRowToEmergencyRequest(newRow);
            if (isEmergencyDeleted(incoming.id)) return;
            const idx = reqs.findIndex(r => r.id === incoming.id);
            if (idx !== -1) {
              reqs[idx] = incoming;
            } else {
              reqs.unshift(incoming);
            }
            getDataStore().setItem(STORAGE_KEYS.EMERGENCY_REQUESTS, JSON.stringify(reqs));
          }
          dispatchStorageEvent();
        } catch (err) {
          console.warn('[REPLATE Supabase Realtime] Error processing emergency event:', err);
        }
      },
      // On remote user change
      (payload) => {
        try {
          const { eventType, new: newRow } = payload;
          if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRow) {
            const localUsers = getRegisteredUsers();
            const email = (newRow.email || '').toLowerCase();
            const idx = localUsers.findIndex(u => (u.email || '').toLowerCase() === email || u.id === newRow.id);
            const userObj = {
              id: newRow.id,
              username: (newRow.email || '').split('@')[0],
              email: newRow.email,
              password: newRow.password_hash?.startsWith('plain:') ? newRow.password_hash.replace('plain:', '') : (newRow.role === 'SUPPLIER' ? 'supplier123' : newRow.role === 'MITRA' ? 'mitra123' : 'admin123'),
              name: newRow.full_name,
              role: (newRow.role || 'supplier').toLowerCase(),
              organization: newRow.role === 'SUPPLIER' ? 'Dapur Grand Catering' : 'Dapur Umum Mandiri',
              avatar: newRow.role === 'SUPPLIER' ? '🏪' : newRow.role === 'MITRA' ? '🤝' : '👑',
              badgeText: newRow.role === 'SUPPLIER' ? 'Penyedia Surplus' : newRow.role === 'MITRA' ? 'Mitra Penerima' : 'Admin Operasional',
              createdAt: newRow.created_at
            };

            if (idx !== -1) {
              localUsers[idx] = { ...localUsers[idx], ...userObj };
            } else {
              localUsers.push(userObj);
            }
            getDataStore().setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(localUsers));
            dispatchStorageEvent();
          }
        } catch (err) {
          console.warn('[REPLATE Supabase Realtime] Error processing user event:', err);
        }
      }
    );

    return cleanup;
  } catch (err) {
    console.warn('[REPLATE Supabase] Error during initial cloud sync:', err);
    return () => {};
  }
}

/**
 * Synchronize surplus listings with live NestJS Backend API on Render
 * Pulls all surplus listings from the backend and merges into local user reports
 */
export async function syncBackendSurplusToLocal() {
  if (!isRealBrowserEnvironment()) return [];
  if (!api.isLiveApiEnabled()) return [];

  try {
    // 1. Ensure authentication token. If absent, authenticate with active session or default demo supplier
    await ensureApiToken();
    if (!api.getAuthToken()) return [];

    // 2. Fetch all surplus listings from live NestJS backend
    const res = await api.surplus.findAll().catch(() => null);
    const remoteListings = Array.isArray(res) ? res : (res?.data || []);
    if (!remoteListings || remoteListings.length === 0) return [];

    // 3. Map backend DTO to frontend report objects
    const mappedReports = remoteListings.map(mapBackendListingToReport);
    const localUsers = getUserReports();
    const reportMap = new Map();

    for (const r of mappedReports) {
      reportMap.set(r.id, r);
    }
    for (const l of localUsers) {
      const isTestId = ['usr-rep-', 'rep-spoof-', 'rep-unverified-', 'user-keep-safe', 'rep-valid-flow'].some(prefix => l.id?.startsWith(prefix));
      if (isTestId) continue;
      const existing = reportMap.get(l.id);
      if (!existing) {
        // Prevent duplicate item if already saved to backend under a new UUID
        const isDuplicateOfRemote = mappedReports.some(r =>
          r.foodName === l.foodName &&
          Math.abs(new Date(r.createdAt || 0).getTime() - new Date(l.createdAt || 0).getTime()) < 300000
        );
        if (!isDuplicateOfRemote) {
          reportMap.set(l.id, l);
        }
      } else {
        if (new Date(l.updatedAt || 0) > new Date(existing.updatedAt || 0) && l.journeyStatus !== existing.journeyStatus) {
          reportMap.set(l.id, { ...existing, ...l });
        }
      }
    }

    const merged = Array.from(reportMap.values());
    getDataStore().setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(merged));
    dispatchStorageEvent();
    return merged;
  } catch (err) {
    console.warn('[REPLATE Backend Sync] Error during backend surplus sync:', err);
    return [];
  }
}



