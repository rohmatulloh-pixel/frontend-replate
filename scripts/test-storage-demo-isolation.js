/**
 * Automated Test Suite for REPLATE Phase 2 (Storage & Demo Isolation) and Phase 4 (Workflow State Machine)
 * Runs in Node.js with localStorage mock.
 */

// Simple mock for localStorage and window in Node environment
const storageStore = new Map();
globalThis.localStorage = {
  getItem: (key) => storageStore.has(key) ? storageStore.get(key) : null,
  setItem: (key, val) => storageStore.set(key, String(val)),
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

import { 
  STORAGE_KEYS,
  saveReport, 
  getReports, 
  getUserReports, 
  getDemoReports, 
  loadDemoData, 
  resetDemoData, 
  clearDemoData, 
  clearAllData,
  updateReport, 
  deleteReport, 
  getReportById,
  migrateLegacyStorage,
  updateJourneyStatus,
  isValidStatusTransition
} from '../src/utils/storage.js';

console.log('🧪 Running REPLATE Storage Demo Isolation & Workflow Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${message}`);
    passedTests++;
  }
}

// Reset store before tests
storageStore.clear();

// Test 1: Create a user report, load demo data, and verify the user report remains unchanged
console.log('--- Scenario 1: User report preservation across demo data operations ---');
const userReport = saveReport({
  id: 'usr-rep-001',
  foodName: 'Nasi Kotak Ayam Bakar',
  foodTypeId: 'cooked-rice',
  quantity: 20,
  unit: 'portions',
  sourceContextId: 'Catering',
  recommendedRoute: 'REDISTRIBUTE',
  packagingConditionId: 'intact_proper',
  handlingIntegrityId: 'hygienic_separated',
  safetyConditionId: 'no_visible_damage',
  storageHistoryId: 'known_compliant',
  storageTempId: 'hot_holding_above_60'
});

assert(userReport && userReport.id === 'usr-rep-001', 'User report created successfully');
assert(getUserReports().length === 1, 'Exactly 1 user report exists in isolated store');

// Now load demo data
const demoData = loadDemoData();
assert(demoData.length === 5, 'Demo data loaded 5 curated records');
const allReportsAfterDemoLoad = getReports();
assert(allReportsAfterDemoLoad.length === 6, 'Total combined reports is 6 (1 user + 5 demo)');
const foundUserReport = allReportsAfterDemoLoad.find(r => r.id === 'usr-rep-001');
assert(foundUserReport !== undefined, 'User report is present in combined reports');
assert(foundUserReport.quantity === 20 && foundUserReport.foodName === 'Nasi Kotak Ayam Bakar', 'User report content was not modified by demo loader');

// Test 2: Load demo data twice and verify no duplicates are created
console.log('\n--- Scenario 2: Idempotent demo loading (No duplicates) ---');
loadDemoData();
loadDemoData();
const demoReportsAfterMultiLoad = getDemoReports();
assert(demoReportsAfterMultiLoad.length === 5, 'Repeated loadDemoData calls do not duplicate demo records (strictly 5)');
assert(getReports().length === 6, 'Total reports remains exactly 6 (1 user + 5 unique demo)');

// Test 3: Reset demo data and verify user records remain intact
console.log('\n--- Scenario 3: Reset demo data affects only demo records ---');
// Modify one demo record
updateReport('demo-rep-101', { quantity: 999 });
assert(getReportById('demo-rep-101').quantity === 999, 'Demo record modified for reset test');

resetDemoData();
assert(getReportById('demo-rep-101').quantity === 15, 'Demo record reset back to original curated value (15 kg)');
assert(getUserReports().length === 1, 'User report store still contains exactly 1 user report');
assert(getReportById('usr-rep-001').quantity === 20, 'User report remains completely unchanged after demo reset');

// Test 4: Clear demo data does not delete user reports or user settings
console.log('\n--- Scenario 4: Clear demo data preserves user reports ---');
clearDemoData();
assert(getDemoReports().length === 0, 'Demo reports cleared');
assert(getUserReports().length === 1, 'User reports preserved after demo clear');
assert(getReports().length === 1, 'getReports() returns only user report when demo mode cleared');
assert(getReports()[0].id === 'usr-rep-001', 'Remaining report is the user report');

// Test 5: Edit and delete one record without affecting unrelated records
console.log('\n--- Scenario 5: Isolated edit and delete operations ---');
const userReport2 = saveReport({
  id: 'usr-rep-002',
  foodName: 'Buah Potong Segar',
  quantity: 5,
  unit: 'kg',
  foodTypeId: 'fresh-fruits',
  packagingConditionId: 'intact_proper',
  handlingIntegrityId: 'hygienic_separated',
  safetyConditionId: 'no_visible_damage',
  storageHistoryId: 'known_compliant',
  storageTempId: 'chilled_below_4'
});
assert(getUserReports().length === 2, 'Second user report added');

// Edit user report 2
updateReport('usr-rep-002', { quantity: 8 });
assert(getReportById('usr-rep-002').quantity === 8, 'User report 2 updated to 8 kg');
assert(getReportById('usr-rep-001').quantity === 20, 'User report 1 unaffected by edit of report 2');

// Delete user report 2
const deleteSuccess = deleteReport('usr-rep-002');
assert(deleteSuccess === true, 'User report 2 deleted successfully');
assert(getReportById('usr-rep-002') === null, 'User report 2 no longer exists');
assert(getReportById('usr-rep-001') !== null, 'User report 1 remains intact');

// Test 6: Legacy format migration
console.log('\n--- Scenario 6: Safe migration from legacy storage key ---');
storageStore.clear();

// Put legacy data directly into legacy key
const legacyData = [
  {
    id: 'legacy-usr-99',
    foodName: 'Legacy Sup Ayam',
    quantity: 10,
    unit: 'portions',
    isDemo: false
  },
  {
    id: 'demo-rep-101',
    foodName: 'Legacy Demo Item',
    isDemo: true
  }
];
storageStore.set(STORAGE_KEYS.LEGACY_REPORTS, JSON.stringify(legacyData));

// Run migration
migrateLegacyStorage();

assert(!storageStore.has(STORAGE_KEYS.LEGACY_REPORTS), 'Legacy storage key removed after migration');
const migratedUser = getUserReports();
assert(migratedUser.length === 1 && migratedUser[0].id === 'legacy-usr-99', 'Legacy user report safely migrated to user namespace');
assert(migratedUser[0].foodSafetyGate !== undefined, 'Migrated legacy record has foodSafetyGate evaluated safely');
assert(migratedUser[0].foodSafetyGate.status === 'REVIEW', 'Legacy record with missing fields assigned conservative REVIEW status');

// Test 7: State machine transitions (Phase 4)
console.log('\n--- Scenario 7: State machine transitions and precedence rules ---');
assert(isValidStatusTransition('REPORTED', 'ASSESSED') === true, 'REPORTED -> ASSESSED is valid');
assert(isValidStatusTransition('REPORTED', 'MATCHED') === true, 'REPORTED -> MATCHED is valid');
assert(isValidStatusTransition('MATCHED', 'RESCUE_INITIATED') === true, 'MATCHED -> RESCUE_INITIATED is valid');
assert(isValidStatusTransition('RESCUE_INITIATED', 'RECEIVED') === true, 'RESCUE_INITIATED -> RECEIVED is valid');
assert(isValidStatusTransition('REPORTED', 'CANCELLED') === true, 'REPORTED -> CANCELLED is valid');
assert(isValidStatusTransition('RECEIVED', 'REPORTED') === false, 'RECEIVED -> REPORTED is impossible / invalid');
assert(isValidStatusTransition('CANCELLED', 'RECEIVED') === false, 'CANCELLED -> RECEIVED is impossible / invalid');

// Test 8: Food safety gate REJECT blocks human distribution
console.log('\n--- Scenario 8: Food Safety Gate REJECT blocks human distribution ---');
const rejectedReport = saveReport({
  id: 'usr-rep-rejected',
  foodName: 'Makanan Basi Berbau',
  quantity: 15,
  unit: 'kg',
  foodTypeId: 'cooked-rice',
  recommendedRoute: 'REDISTRIBUTE',
  packagingConditionId: 'intact_proper',
  handlingIntegrityId: 'hygienic_separated',
  safetyConditionId: 'clear_spoilage', // Confirmed disqualifying condition -> REJECT
  storageHistoryId: 'known_compliant',
  storageTempId: 'hot_holding_above_60'
});

assert(rejectedReport.foodSafetyGate.status === 'REJECT', 'Spoiled report is confirmed REJECT');

// 8a. Test that skipping directly from REPORTED to RECEIVED is blocked by state machine
const impossibleTransition = updateJourneyStatus('usr-rep-rejected', 'RECEIVED');
assert(impossibleTransition === null, 'Skipping stages (REPORTED -> RECEIVED) is blocked by state machine');

// 8b. Test that progressing to MATCHED for human consumption is blocked by Food Safety Gate REJECT rule
const invalidMatchResult = updateJourneyStatus('usr-rep-rejected', 'MATCHED');
assert(invalidMatchResult === null, 'Confirmed REJECT food cannot be MATCHED for human consumption');
assert(getReportById('usr-rep-rejected').journeyStatus === 'REPORTED', 'Report state was not corrupted by invalid transition');

console.log(`\n🎉 Results: ${passedTests} of ${totalTests} storage & workflow tests passed!`);
