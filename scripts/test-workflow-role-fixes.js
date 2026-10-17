/**
 * REPLATE Targeted Workflow & Role Verification Test Suite
 * Tests the specific workflow, role permissions, emergency distribution,
 * and button/status transition fixes.
 */

import assert from 'node:assert';
import {
  STORAGE_KEYS,
  saveReport,
  getReports,
  getUserReports,
  getReportById,
  updateJourneyStatus,
  saveEmergencyRequest,
  getEmergencyRequests,
  findMatchingSurplusForRequest,
  allocateSurplusToEmergencyRequest,
  DEMO_USERS
} from '../src/utils/storage.js';
import { calculateImpactSummary, calculateRescuePerformance } from '../src/utils/calculations.js';

// Setup Mock In-Memory LocalStorage
const memoryStore = new Map();
globalThis.localStorage = {
  getItem: (key) => memoryStore.get(key) || null,
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear()
};

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

console.log('🧪 Running REPLATE Targeted Workflow & Role Fixes Test Suite...\n');

// Clear storage before starting
memoryStore.clear();

const supplierUser = DEMO_USERS.supplier; // usr-supplier
const recipientUser = DEMO_USERS.mitra;   // usr-mitra
const adminUser = DEMO_USERS.admin;       // usr-admin

// =========================================================================
// SCENARIO 1: Mitra Pengirim dapat membuat listing surplus
// =========================================================================
test('Scenario 1: Mitra Pengirim dapat membuat listing surplus valid dengan Food Safety Gate PASS', () => {
  const surplus = saveReport({
    id: 'rep-supplier-test-1',
    foodName: 'Nasi Kotak Ayam Bakar',
    quantity: 20,
    unit: 'kg',
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    timeWindowId: '1_3h',
    sourceContextId: 'Catering',
    reportedBy: { id: supplierUser.id, name: supplierUser.name, role: supplierUser.role }
  });

  assert(surplus && surplus.id === 'rep-supplier-test-1');
  assert.strictEqual(surplus.foodSafetyGate.status, 'PASS');
  assert.strictEqual(surplus.journeyStatus, 'REPORTED');
  assert.strictEqual(getUserReports().length, 1);
});

// =========================================================================
// SCENARIO 2: Mitra Penerima dapat membuat permintaan darurat dengan struktur data berbeda
// =========================================================================
test('Scenario 2: Mitra Penerima dapat membuat permintaan darurat dengan entitas terpisah', () => {
  const emgReq = saveEmergencyRequest({
    neededFoodType: 'cooked_meals',
    requestedPortions: 50,
    beneficiaryCount: 50,
    beneficiaryGroup: 'Posko Pengungsi RW 04',
    targetLocation: 'Posko Dapur Mandiri, Tebet',
    urgencyLevel: 'CRITICAL',
    urgencyDeadline: 'Sebelum 12:00 WIB',
    urgencyReason: 'Tambahan 50 pengungsi baru tiba dan stok nasi habis',
    contactPerson: 'Ibu Siti Rahma',
    contactPhone: '0812-3456-7890'
  });

  assert(emgReq && emgReq.id.startsWith('emg-req-'));
  assert.strictEqual(emgReq.type, 'EMERGENCY_REQUEST');
  assert.strictEqual(emgReq.requestedPortions, 50);
  assert.strictEqual(emgReq.estimatedKg, 17.5); // 50 * 0.35
  assert.strictEqual(emgReq.status, 'OPEN');
  assert.strictEqual(emgReq.matchedSurplusId, null);

  const storedEmg = getEmergencyRequests();
  assert.strictEqual(storedEmg.length, 1);
  assert.strictEqual(storedEmg[0].id, emgReq.id);
});

// =========================================================================
// SCENARIO 3: Permintaan darurat tidak otomatis menjadi listing surplus atau transaksi selesai
// =========================================================================
test('Scenario 3: Permintaan darurat tidak tercatat sebagai surplus dan berstatus OPEN (belum disetujui)', () => {
  const allSurplusReports = getReports();
  // allSurplusReports must ONLY contain the surplus report from Scenario 1, NOT the emergency request
  assert.strictEqual(allSurplusReports.length, 1);
  assert.strictEqual(allSurplusReports[0].id, 'rep-supplier-test-1');
  assert.strictEqual(allSurplusReports[0].type, undefined);

  // Check user reports store
  const userReports = getUserReports();
  assert.strictEqual(userReports.length, 1);
  assert.strictEqual(userReports[0].id, 'rep-supplier-test-1');

  // Emergency request remains OPEN
  const emgList = getEmergencyRequests();
  assert.strictEqual(emgList[0].status, 'OPEN');
});

// =========================================================================
// SCENARIO 4: Supplier tidak dapat mengonfirmasi penerimaan atas nama penerima
// =========================================================================
test('Scenario 4: Supplier tidak dapat mengonfirmasi penerimaan (RECEIVED) atas nama penerima', () => {
  // Advance report from REPORTED -> MATCHED -> RESCUE_INITIATED
  updateJourneyStatus('rep-supplier-test-1', 'MATCHED', 'Matched to Mitra', {}, supplierUser);
  const inTransit = updateJourneyStatus('rep-supplier-test-1', 'RESCUE_INITIATED', 'Dispatched by courier', {}, supplierUser);
  assert(inTransit && inTransit.journeyStatus === 'RESCUE_INITIATED');

  // Supplier tries to confirm receipt
  const unauthorizedConfirm = updateJourneyStatus('rep-supplier-test-1', 'RECEIVED', 'Dikonfirmasi supplier', { actualReceivedKg: 20 }, supplierUser);
  assert.strictEqual(unauthorizedConfirm, null, 'Supplier must be blocked from transitioning to RECEIVED');

  // Verify report status is still in transit
  const current = getReportById('rep-supplier-test-1');
  assert.strictEqual(current.journeyStatus, 'RESCUE_INITIATED');
});

// =========================================================================
// SCENARIO 5: Transaksi yang sudah IN_TRANSIT tidak dapat dibatalkan melalui tindakan normal
// =========================================================================
test('Scenario 5: Transaksi yang sudah IN_TRANSIT tidak dapat dibatalkan tanpa pelaporan kendala eksplisit', () => {
  // Casual cancellation attempt without incident report flag/reason
  const normalCancelAttempt = updateJourneyStatus('rep-supplier-test-1', 'CANCELLED', '', { isIncidentReport: false, cancellationReason: '' }, supplierUser);
  assert.strictEqual(normalCancelAttempt, null, 'Normal cancellation during IN_TRANSIT must be blocked');

  // Status must remain RESCUE_INITIATED
  assert.strictEqual(getReportById('rep-supplier-test-1').journeyStatus, 'RESCUE_INITIATED');

  // But can be cancelled via explicit incident reporting
  const incidentReport = updateJourneyStatus(
    'rep-supplier-test-1',
    'CANCELLED',
    'Kendala Pengiriman: Truk logistik mogok di jalan',
    {
      isIncidentReport: true,
      cancellationReason: '[KENDALA PENGIRIMAN] Truk logistik mogok di jalan',
      issueReportedBy: 'Dapur Grand Catering'
    },
    supplierUser
  );

  assert(incidentReport && incidentReport.journeyStatus === 'CANCELLED');
  assert.strictEqual(getReportById('rep-supplier-test-1').journeyStatus, 'CANCELLED');
});

// =========================================================================
// SCENARIO 6: Mitra Penerima dapat mengonfirmasi penerimaan sesuai status transaksi
// =========================================================================
test('Scenario 6: Mitra Penerima dapat mengonfirmasi penerimaan saat makanan tiba', () => {
  // Create second surplus report
  saveReport({
    id: 'rep-supplier-test-2',
    foodName: 'Sayur Sop Segar',
    quantity: 10,
    unit: 'kg',
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  });

  updateJourneyStatus('rep-supplier-test-2', 'MATCHED');
  updateJourneyStatus('rep-supplier-test-2', 'RESCUE_INITIATED');

  // Recipient confirms physical delivery intake with verified actual weight
  const receivedReport = updateJourneyStatus(
    'rep-supplier-test-2',
    'RECEIVED',
    'Diterima fisik di Dapur Mandiri: 9.5 kg',
    { actualReceivedKg: 9.5 },
    recipientUser
  );

  assert(receivedReport && receivedReport.journeyStatus === 'RECEIVED');
  assert.strictEqual(receivedReport.actualReceivedKg, 9.5);
});

// =========================================================================
// SCENARIO 7: Transaksi yang COMPLETED tidak dapat diselesaikan atau dibatalkan ulang
// =========================================================================
test('Scenario 7: Transaksi COMPLETED (RECEIVED) bersifat terminal dan tidak dapat dibatalkan atau diubah', () => {
  // Attempting to cancel completed transaction
  const cancelAttempt = updateJourneyStatus('rep-supplier-test-2', 'CANCELLED', 'Batalkan selesai', {}, recipientUser);
  assert.strictEqual(cancelAttempt, null, 'Completed transaction cannot transition to CANCELLED');

  // Attempting to reset or change status
  const resetAttempt = updateJourneyStatus('rep-supplier-test-2', 'REPORTED', 'Reset', {}, adminUser);
  assert.strictEqual(resetAttempt, null, 'Completed transaction cannot transition backwards to REPORTED');

  // Verify status remains RECEIVED
  assert.strictEqual(getReportById('rep-supplier-test-2').journeyStatus, 'RECEIVED');
});

// =========================================================================
// SCENARIO 8: Transaksi gagal atau dibatalkan tidak menambah angka distribusi berhasil di Impact
// =========================================================================
test('Scenario 8: Transaksi gagal/dibatalkan tidak dihitung sebagai makanan yang berhasil disalurkan', () => {
  const allReports = getReports();
  // rep-supplier-test-1 is CANCELLED (20 kg)
  // rep-supplier-test-2 is RECEIVED (9.5 kg actual)

  const impact = calculateImpactSummary(allReports);
  // Total rescued kg must ONLY be 9.5 kg, NEVER 29.5 kg!
  assert.strictEqual(impact.totalRescuedKg, 9.5, `Expected 9.5 kg rescued, got ${impact.totalRescuedKg}`);
  assert.strictEqual(impact.completedJourneys, 1, `Expected 1 completed journey, got ${impact.completedJourneys}`);

  // Performance calculations
  const perf = calculateRescuePerformance(allReports, 'id');
  assert.strictEqual(perf.kpis.totalRescuedKg, 9.5);
  assert.strictEqual(perf.kpis.completedTransactions, 1);
  assert.strictEqual(perf.kpis.cancelledTransactions, 1);
  // Success rate is 1 completed out of 2 due = 50%
  assert.strictEqual(perf.kpis.successRate, 50);
});

// =========================================================================
// SCENARIO 9: Pencocokan Permintaan Darurat dengan Surplus Aman
// =========================================================================
test('Scenario 9: Pencocokan permintaan darurat hanya menyaring surplus PASS dan mengalokasikan ke MATCHED', () => {
  // Create third surplus report: ready and PASS
  saveReport({
    id: 'rep-supplier-safe-3',
    foodName: 'Ayam Goreng Lengkuas',
    quantity: 15,
    unit: 'kg',
    foodTypeId: 'prepared-meals',
    recommendedRoute: 'REDISTRIBUTE',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  });

  const emgList = getEmergencyRequests();
  const targetReq = emgList[0];

  // Find matching surplus
  const matched = findMatchingSurplusForRequest(targetReq);
  assert(matched.length >= 1);
  const found = matched.find(m => m.id === 'rep-supplier-safe-3');
  assert(found && found.foodSafetyGate.status === 'PASS');

  // Allocate surplus to emergency request
  const allocation = allocateSurplusToEmergencyRequest(targetReq.id, 'rep-supplier-safe-3', 'Dapur Umum Mandiri');
  assert.strictEqual(allocation.success, true);

  // Check that surplus report transitioned to MATCHED (not RECEIVED!)
  const updatedSurplus = getReportById('rep-supplier-safe-3');
  assert.strictEqual(updatedSurplus.journeyStatus, 'MATCHED');
  assert.strictEqual(updatedSurplus.selectedDestination.allocatedToRequestId, targetReq.id);

  // Check that emergency request is ALLOCATED
  const updatedReq = getEmergencyRequests().find(r => r.id === targetReq.id);
  assert.strictEqual(updatedReq.status, 'ALLOCATED');
  assert.strictEqual(updatedReq.matchedSurplusId, 'rep-supplier-safe-3');
});

console.log(`\n🎉 Success! All ${passed} of ${total} targeted workflow test scenarios passed perfectly!`);
