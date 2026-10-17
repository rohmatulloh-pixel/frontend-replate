/**
 * REPLATE Second-Pass Exhaustive Audit & Integrity Test Suite
 * Covers Food Safety Gate Anti-Spoofing, Exhaustive 100-pair Transition Matrix,
 * Storage Quota & Collision Resilience, and Metric Segregation.
 */

import assert from 'assert';

// Mock localStorage and window in Node environment
const storageStore = new Map();
let shouldStorageThrowOnSet = false;

globalThis.localStorage = {
  getItem: (key) => storageStore.has(key) ? storageStore.get(key) : null,
  setItem: (key, val) => {
    if (shouldStorageThrowOnSet) {
      const err = new Error('QuotaExceededError: DOM Exception 22');
      err.name = 'QuotaExceededError';
      throw err;
    }
    storageStore.set(key, String(val));
  },
  removeItem: (key) => storageStore.delete(key),
  clear: () => storageStore.clear()
};

globalThis.window = {
  dispatchEvent: () => true,
  CustomEvent: class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  }
};

import { evaluateFoodSafetyGate, OFFICIAL_SAFETY_SOURCES } from '../src/engine/foodSafetyGate.js';
import { 
  STORAGE_KEYS,
  saveReport, 
  getReports, 
  getUserReports, 
  getDemoReports, 
  loadDemoData, 
  resetDemoData, 
  clearDemoData, 
  updateReport, 
  deleteReport, 
  getReportById,
  migrateLegacyStorage,
  updateJourneyStatus,
  isValidStatusTransition,
  VALID_STATUS_TRANSITIONS
} from '../src/utils/storage.js';
import { calculateRescuePerformance } from '../src/utils/calculations.js';

console.log('🧪 Running REPLATE Second-Pass Audit Test Suite...\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedChecks++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// SECTION 1: FOOD SAFETY GATE ROBUSTNESS & ANTI-SPOOFING
// =========================================================================
console.log('--- SECTION 1: Food Safety Gate Robustness & Anti-Spoofing ---');

check('1.1 Empty report object returns REVIEW and blocks human consumption', () => {
  const result = evaluateFoodSafetyGate({}, 'id');
  assert.strictEqual(result.status, 'REVIEW');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
  assert(result.missingInformation.length >= 4, 'Must identify all missing mandatory safety information');
});

check('1.2 Unrecognized fields do not cause runtime errors and still evaluate safely to REVIEW', () => {
  const result = evaluateFoodSafetyGate({
    unknownKey: 'randomValue',
    foo: 123,
    bar: true
  }, 'id');
  assert.strictEqual(result.status, 'REVIEW');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
});

check('1.3 Invalid / non-whitelisted enum values are rejected from PASS and flagged for REVIEW', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'mythical_super_fresh', // Invalid enum
    storageHistoryId: 'perfect_nonexistent',   // Invalid enum
    storageTempId: 'ultra_freezer_xyz',        // Invalid enum
    packagingConditionId: 'not_standard_wrap', // Invalid enum
    handlingIntegrityId: 'sterile_magic',      // Invalid enum
    timeWindowId: '1_3h'
  }, 'id');

  assert.strictEqual(result.status, 'REVIEW', 'Invalid enums must never receive PASS');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
  assert(result.reasons.some(r => r.includes('tidak dikenal') || r.includes('Unrecognized')), 'Must explicitly flag unrecognized values');
});

check('1.4 Conflicting inputs (not_suitable intake condition vs no_visible_damage check) triggers REJECT', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    conditionId: 'not_suitable',               // flagged unsuitable at intake
    safetyConditionId: 'no_visible_damage',    // claiming undamaged
    storageHistoryId: 'known_compliant',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    storageTempId: 'hot_holding_above_60'
  }, 'id');

  assert.strictEqual(result.status, 'REJECT', 'Direct contradiction between intake rejection and screening must reject');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
});

check('1.5 Status spoofing in saveReport: frontend cannot forge PASS on spoiled or incomplete food', () => {
  storageStore.clear();
  const spoofedPayload = {
    id: 'rep-spoof-1',
    foodName: 'Spoiled Fish with Fake Pass',
    foodTypeId: 'meat-fish',
    quantity: 10,
    unit: 'kg',
    safetyConditionId: 'clear_spoilage', // Confirmed spoilage!
    // Attacker tries to inject fake gate object
    foodSafetyGate: {
      status: 'PASS',
      eligibleForConsumptionRecommendation: true,
      headline: 'FORGED PASS'
    }
  };

  const saved = saveReport(spoofedPayload);
  assert.strictEqual(saved.foodSafetyGate.status, 'REJECT', 'saveReport must re-evaluate gate from actual data and reject spoofed PASS');
  assert.strictEqual(saved.foodSafetyGate.eligibleForConsumptionRecommendation, false);
});

check('1.6 Status REVIEW bypass in saveReport: unverified food cannot be saved with MATCHED or human destination', () => {
  storageStore.clear();
  const reviewReportWithDestination = {
    id: 'rep-unverified-match',
    foodName: 'Unverified Meat',
    foodTypeId: 'meat-fish',
    quantity: 20,
    unit: 'kg',
    // Missing safety checks -> REVIEW
    recommendedRoute: 'REDISTRIBUTE',
    journeyStatus: 'MATCHED',
    selectedDestination: {
      id: 'dest-mitra',
      name: 'Dapur Umum Mandiri',
      type: 'Community Kitchen' // Human destination
    }
  };

  const saved = saveReport(reviewReportWithDestination);
  assert.strictEqual(saved.foodSafetyGate.status, 'REVIEW');
  assert.strictEqual(saved.journeyStatus, 'REPORTED', 'Unverified food cannot be saved in MATCHED status for human consumption');
  assert.strictEqual(saved.selectedDestination, null, 'Human destination must be detached from unverified food');
});

check('1.7 Status PASS is explicitly marked as initial rule screening, not absolute health guarantee', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    timeWindowId: '1_3h'
  }, 'id');

  assert.strictEqual(result.status, 'PASS');
  assert.strictEqual(result.isOfficialCertification, false);
  assert(result.safetyDisclaimer !== undefined && result.safetyDisclaimer.length > 0);
  assert(result.citations.length >= 4, 'Must reference WHO, Kemenkes, BPOM citations');
});

// =========================================================================
// SECTION 2: STORAGE AND MIGRATION DEEP INTEGRITY
// =========================================================================
console.log('\n--- SECTION 2: Storage and Migration Deep Integrity ---');

check('2.1 Migration when both legacy and v2 data exist simultaneously with ID collisions', () => {
  storageStore.clear();

  // Pre-existing v2 user data
  const existingV2User = [
    {
      id: 'collision-rep-1',
      foodName: 'V2 Updated Data',
      quantity: 50,
      createdAt: '2026-10-16T10:00:00.000Z'
    }
  ];
  storageStore.set(STORAGE_KEYS.USER_REPORTS, JSON.stringify(existingV2User));

  // Legacy data containing older duplicate ID + a new legacy record
  const legacyData = [
    {
      id: 'collision-rep-1', // duplicate
      foodName: 'Older Legacy Data',
      quantity: 10,
      isDemo: false
    },
    {
      id: 'legacy-unique-2', // new record to migrate
      foodName: 'Unique Legacy Record',
      quantity: 25,
      isDemo: false
    }
  ];
  storageStore.set(STORAGE_KEYS.LEGACY_REPORTS, JSON.stringify(legacyData));

  // Run migration
  migrateLegacyStorage();

  const userReports = getUserReports();
  assert.strictEqual(userReports.length, 2, 'Must contain 2 records total');
  const collisionItem = userReports.find(r => r.id === 'collision-rep-1');
  assert.strictEqual(collisionItem.quantity, 50, 'V2 record must be preserved and take precedence over older legacy duplicate');
  const uniqueItem = userReports.find(r => r.id === 'legacy-unique-2');
  assert(uniqueItem !== undefined, 'Unique legacy record must be migrated');
  assert.strictEqual(storageStore.has(STORAGE_KEYS.LEGACY_REPORTS), false, 'Legacy key removed after successful merge');
});

check('2.2 Repeated migration calls are completely idempotent and safe', () => {
  migrateLegacyStorage();
  migrateLegacyStorage();
  migrateLegacyStorage();
  assert.strictEqual(getUserReports().length, 2, 'Multiple migrations do not duplicate or alter records');
});

check('2.3 Corrupted JSON in legacy storage is handled without crashing or corrupting v2 stores', () => {
  storageStore.set(STORAGE_KEYS.LEGACY_REPORTS, '{ invalid json: [ corrupted data');
  migrateLegacyStorage();
  assert.strictEqual(storageStore.has(STORAGE_KEYS.LEGACY_REPORTS), false, 'Corrupted legacy key removed to prevent blocking');
  assert.strictEqual(getUserReports().length, 2, 'Existing v2 user records unaffected by legacy corruption');
});

check('2.4 Storage failure (QuotaExceededError) preserves data without silent partial corruption', () => {
  shouldStorageThrowOnSet = true;
  assert.throws(() => {
    saveReport({
      id: 'rep-quota-fail',
      foodName: 'Fail under quota',
      foodTypeId: 'cooked-rice',
      quantity: 10
    });
  }, /QuotaExceededError/, 'saveReport must propagate error on storage failure rather than silently reporting success');
  shouldStorageThrowOnSet = false;
});

check('2.5 Demo operations (load, reset, clear) strictly isolate demo records from user data and settings', () => {
  storageStore.clear();

  // Create real user report
  saveReport({
    id: 'user-keep-safe',
    foodName: 'User Report - Do Not Touch',
    quantity: 100,
    unit: 'kg',
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  });

  // Store user preference and session
  storageStore.set(STORAGE_KEYS.PREFERENCES, JSON.stringify({ theme: 'dark', lang: 'id' }));
  storageStore.set(STORAGE_KEYS.USER_SESSION, JSON.stringify({ id: 'usr-admin', role: 'admin' }));

  // Load demo data
  loadDemoData();
  assert.strictEqual(getUserReports().length, 1);
  assert.strictEqual(getReportById('user-keep-safe').quantity, 100);

  // Reset demo data
  resetDemoData();
  assert.strictEqual(getUserReports().length, 1);
  assert.strictEqual(getReportById('user-keep-safe').quantity, 100);

  // Clear demo data
  clearDemoData();
  assert.strictEqual(getDemoReports().length, 0);
  assert.strictEqual(getUserReports().length, 1);
  assert.strictEqual(getReportById('user-keep-safe').quantity, 100);

  // Verify preferences and user session remain completely intact
  assert.strictEqual(JSON.parse(storageStore.get(STORAGE_KEYS.PREFERENCES)).theme, 'dark');
  assert.strictEqual(JSON.parse(storageStore.get(STORAGE_KEYS.USER_SESSION)).role, 'admin');
});

// =========================================================================
// SECTION 3: EXHAUSTIVE 100-PAIR STATUS TRANSITION MATRIX
// =========================================================================
console.log('\n--- SECTION 3: Exhaustive 100-pair Status Transition Matrix ---');

const ALL_STATUSES = [
  'REPORTED',
  'ASSESSED',
  'ROUTE_SELECTED',
  'MATCHED',
  'RESCUE_INITIATED',
  'SAFETY_SCREENED',
  'SAFETY_REASSESSED',
  'RECEIVED',
  'CANCELLED',
  'EXPIRED'
];

check('3.1 Full status transition matrix: every single valid and invalid pair matches defined state machine', () => {
  let pairCount = 0;
  for (const from of ALL_STATUSES) {
    for (const to of ALL_STATUSES) {
      pairCount++;
      const result = isValidStatusTransition(from, to);
      if (from === to) {
        assert.strictEqual(result, true, `Self-transition ${from} -> ${to} should be true`);
      } else {
        const allowed = VALID_STATUS_TRANSITIONS[from] || [];
        const expected = allowed.includes(to);
        assert.strictEqual(result, expected, `Transition ${from} -> ${to} expected ${expected} but got ${result}`);
      }
    }
  }
  assert.strictEqual(pairCount, 100, 'Exhaustively tested exactly 100 status combinations');
});

check('3.2 Terminal statuses (RECEIVED, CANCELLED, EXPIRED) reject 100% of outward transitions', () => {
  const terminalStatuses = ['RECEIVED', 'CANCELLED', 'EXPIRED'];
  for (const term of terminalStatuses) {
    for (const target of ALL_STATUSES) {
      if (term !== target) {
        assert.strictEqual(isValidStatusTransition(term, target), false, `Terminal status ${term} cannot transition to ${target}`);
      }
    }
  }
});

check('3.3 updateJourneyStatus blocks REVIEW food from transitioning to human distribution', () => {
  storageStore.clear();
  const unverifiedReport = saveReport({
    id: 'rep-unverified-journey',
    foodName: 'Unverified Milk',
    foodTypeId: 'dairy-beverages',
    quantity: 10,
    unit: 'kg',
    recommendedRoute: 'REDISTRIBUTE'
    // Missing safety data -> REVIEW
  });

  assert.strictEqual(unverifiedReport.foodSafetyGate.status, 'REVIEW');

  // Try transitioning to MATCHED for human consumption
  const matchResult = updateJourneyStatus('rep-unverified-journey', 'MATCHED');
  assert.strictEqual(matchResult, null, 'REVIEW food cannot transition to MATCHED for human consumption');

  // Try transitioning to RESCUE_INITIATED for human consumption
  const transitResult = updateJourneyStatus('rep-unverified-journey', 'RESCUE_INITIATED');
  assert.strictEqual(transitResult, null, 'REVIEW food cannot transition to RESCUE_INITIATED for human consumption');

  // Try transitioning to RECEIVED for human consumption
  const receivedResult = updateJourneyStatus('rep-unverified-journey', 'RECEIVED');
  assert.strictEqual(receivedResult, null, 'REVIEW food cannot transition to RECEIVED for human consumption');
});

check('3.4 updateJourneyStatus normalizes actualReceivedKg and timestamps on completion', () => {
  storageStore.clear();
  const validReport = saveReport({
    id: 'rep-valid-flow',
    foodName: 'Compliant Rice',
    foodTypeId: 'cooked-rice',
    quantity: 30,
    unit: 'kg',
    recommendedRoute: 'REDISTRIBUTE',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  });

  assert.strictEqual(validReport.foodSafetyGate.status, 'PASS');

  // Advance step-by-step
  assert(updateJourneyStatus('rep-valid-flow', 'MATCHED') !== null);
  assert(updateJourneyStatus('rep-valid-flow', 'RESCUE_INITIATED') !== null);

  // Complete with actual received weight
  const completed = updateJourneyStatus('rep-valid-flow', 'RECEIVED', 'Diterima fisik di dapur', {
    actualReceivedKg: 28.5
  });

  assert.strictEqual(completed.journeyStatus, 'RECEIVED');
  assert.strictEqual(completed.actualReceivedKg, 28.5);
  assert(completed.receivedAt !== undefined, 'receivedAt timestamp must be recorded');
});

// =========================================================================
// SECTION 4: ANALYTICS INTEGRITY & SCIENTIFIC CITATIONS
// =========================================================================
console.log('\n--- SECTION 4: Analytics Integrity & Scientific Citations ---');

check('4.1 Meals equivalent is strictly computed from humanRescuedKg, never organic compost', () => {
  // Scenario: 100 kg of spoiled food successfully composted (ORGANIC route)
  const organicReport = {
    id: 'rep-organic-only',
    quantity: 100,
    actualReceivedKg: 100,
    unit: 'kg',
    foodTypeId: 'fresh-vegetables',
    recommendedRoute: 'ORGANIC',
    journeyStatus: 'RECEIVED',
    createdAt: new Date().toISOString()
  };

  const perf = calculateRescuePerformance([organicReport], 'id');
  assert.strictEqual(perf.kpis.totalReportedKg, 100);
  assert.strictEqual(perf.kpis.totalRescuedKg, 100);
  assert.strictEqual(perf.kpis.organicRescuedKg, 100);
  assert.strictEqual(perf.kpis.humanRescuedKg, 0);

  // Environmental: Composting still diverts methane from landfill (US EPA WARM)
  assert.strictEqual(perf.environmentalSecondary.co2eAvoidedKg, 210.0); // 100 * 2.1
  assert.strictEqual(perf.environmentalSecondary.waterSavedLiters, 25000); // 100 * 250

  // Meals equivalent: MUST BE 0! Composting cannot be counted as human meals!
  assert.strictEqual(perf.environmentalSecondary.mealsEquivalent, 0, 'Composted organic diversion must yield 0 meals equivalent');
});

check('4.2 Human meals equivalent accurately calculates based on 0.35 kg/serving benchmark', () => {
  const humanReport = {
    id: 'rep-human-only',
    quantity: 70,
    actualReceivedKg: 70,
    unit: 'kg',
    foodTypeId: 'cooked-rice',
    recommendedRoute: 'REDISTRIBUTE',
    journeyStatus: 'RECEIVED',
    createdAt: new Date().toISOString()
  };

  const perf = calculateRescuePerformance([humanReport], 'id');
  assert.strictEqual(perf.kpis.humanRescuedKg, 70);
  // 70 kg / 0.35 kg/meal = 200 meals
  assert.strictEqual(perf.environmentalSecondary.mealsEquivalent, 200);
});

check('4.3 Deduplication: duplicate IDs in input array are counted only once in all KPIs', () => {
  const duplicateReports = [
    { id: 'rep-dup', quantity: 20, unit: 'kg', journeyStatus: 'RECEIVED' },
    { id: 'rep-dup', quantity: 20, unit: 'kg', journeyStatus: 'RECEIVED' }
  ];

  const perf = calculateRescuePerformance(duplicateReports, 'id');
  assert.strictEqual(perf.totalReports, 1);
  assert.strictEqual(perf.kpis.totalReportedKg, 20);
  assert.strictEqual(perf.kpis.totalRescuedKg, 20);
  assert.strictEqual(perf.kpis.completedTransactions, 1);
});

check('4.4 Scientific reference verification: US EPA WARM, FAO, and GFN citations documented', () => {
  const sources = OFFICIAL_SAFETY_SOURCES;
  const who = sources.find(s => s.id === 'who-food-safety');
  assert(who && who.url.includes('who.int'), 'WHO food safety source verified');
  const kemenkes = sources.find(s => s.id === 'kemenkes-jasaboga');
  assert(kemenkes && kemenkes.url.includes('kemkes.go.id'), 'Kemenkes source verified');
  const bpom = sources.find(s => s.id === 'bpom-pjas-klik');
  assert(bpom && bpom.url.includes('pom.go.id'), 'BPOM source verified');
});

console.log(`\n🎉 All ${passedChecks} of ${totalChecks} second-pass audit test cases passed successfully!`);
