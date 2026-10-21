import assert from 'node:assert';
import {
  saveEmergencyRequest,
  getEmergencyRequests,
  getActiveSOSBroadcasts,
  getSOSHistory,
  respondToSOSBroadcast,
  expireOverdueSOSBroadcasts,
  fulfillSOSBroadcast,
  getReports,
  clearAllData,
  STORAGE_KEYS
} from '../src/utils/storage.js';

// Setup mock browser localStorage
const memoryStore = {};
global.window = {
  dispatchEvent: () => true
};
global.localStorage = {
  getItem: (key) => memoryStore[key] || null,
  setItem: (key, val) => { memoryStore[key] = String(val); },
  removeItem: (key) => { delete memoryStore[key]; },
  clear: () => { Object.keys(memoryStore).forEach(k => delete memoryStore[k]); }
};

console.log('🧪 Running REPLATE SOS Emergency Broadcast Test Suite...');

// 1. Create emergency request with CRITICAL urgency -> Auto-publishes SOS broadcast
const emergencyReq = saveEmergencyRequest({
  neededFoodType: 'cooked_meals',
  foodTypeName: 'Makanan Siap Saji',
  requestedPortions: 60,
  urgencyLevel: 'CRITICAL',
  urgencyReason: 'Banjir bandang, pengungsi butuh makan siang segera',
  targetLocation: 'Jl. Pemuda No. 10, Posko Bencana',
  recipientLatitude: -6.2088,
  recipientLongitude: 106.8456,
  notes: 'Harap kemasan higienis',
  requestedBy: {
    id: 'rec-mitra-01',
    name: 'Dapur Sosial Kasih',
    role: 'mitra'
  }
});

assert.ok(emergencyReq.id, 'Emergency request must have an ID');
const activeBroadcasts = getActiveSOSBroadcasts();
assert.strictEqual(activeBroadcasts.length, 1, 'Should have exactly 1 active SOS broadcast');
const broadcast = activeBroadcasts[0];
assert.strictEqual(broadcast.emergencyRequestId, emergencyReq.id, 'Broadcast should reference the emergency request');
assert.strictEqual(broadcast.urgencyLevel, 'CRITICAL', 'Urgency level should match');
assert.strictEqual(broadcast.status, 'ACTIVE', 'Broadcast status should be ACTIVE');

// Expiration for CRITICAL should be ~2 hours from now
const expiryTime = new Date(broadcast.expiresAt).getTime();
const now = Date.now();
const diffHours = (expiryTime - now) / (1000 * 60 * 60);
assert.ok(diffHours > 1.9 && diffHours <= 2.05, `CRITICAL urgency should expire in ~2 hours (got ${diffHours} hours)`);
console.log('  ✅ [PASS] 1. Permintaan darurat otomatis membuat sinyal SOS aktif dengan batas waktu 2 jam');

// 2. High urgency creates 4 hour expiration
const highReq = saveEmergencyRequest({
  neededFoodType: 'bakery',
  foodTypeName: 'Roti & Kue',
  requestedPortions: 30,
  urgencyLevel: 'HIGH',
  urgencyReason: 'Pasokan sarapan tambahan',
  targetLocation: 'Panti Asuhan Melati',
  recipientLatitude: -6.2100,
  recipientLongitude: 106.8400,
  requestedBy: {
    id: 'rec-mitra-02',
    name: 'Panti Asuhan Melati',
    role: 'mitra'
  }
});
const broadcastsAfterHigh = getActiveSOSBroadcasts();
assert.strictEqual(broadcastsAfterHigh.length, 2, 'Should now have 2 active broadcasts');
const highBroadcast = broadcastsAfterHigh.find(b => b.emergencyRequestId === highReq.id);
const highExpiryHours = (new Date(highBroadcast.expiresAt).getTime() - now) / (1000 * 60 * 60);
assert.ok(highExpiryHours > 3.9 && highExpiryHours <= 4.05, `HIGH urgency should expire in ~4 hours (got ${highExpiryHours} hours)`);
console.log('  ✅ [PASS] 2. Permintaan darurat HIGH urgency memiliki jendela waktu 4 jam');

// 3. Supplier 1-click response to the CRITICAL broadcast
const supplierUser = {
  id: 'supp-hotel-01',
  name: 'Hotel Santika Premiere',
  organization: 'Hotel Santika Premiere',
  role: 'supplier',
  latitude: -6.2050,
  longitude: 106.8420
};

const result = respondToSOSBroadcast(broadcast.id, '60 porsi nasi kotak siap dikirimkan dalam 30 menit.', supplierUser);

assert.ok(result.success, 'Response should succeed');
assert.ok(result.response?.id, 'Response should have an ID');
assert.ok(result.report, 'Surplus report should be generated');
assert.strictEqual(result.report.isEmergencyResponse, true, 'Surplus must be marked as emergency response');
assert.strictEqual(result.report.foodSafetyGate.status, 'PASS', 'Safety gate must be PASS with emergency attestation');
assert.strictEqual(result.report.journeyStatus, 'MATCHED', 'Report status must transition to MATCHED directly');
assert.strictEqual(result.report.recipientPartner, 'Dapur Sosial Kasih', 'Recipient partner must be matched');
console.log('  ✅ [PASS] 3. Konfirmasi 1-klik supplier otomatis meng-generate SurplusListing (PASS) dan RescueJourney (MATCHED)');

// 4. Verify broadcast is now fulfilled and removed from active list
const remainingActive = getActiveSOSBroadcasts();
assert.strictEqual(remainingActive.some(b => b.id === broadcast.id), false, 'Fulfilled broadcast must no longer be in active list');
assert.strictEqual(remainingActive.length, 1, 'Only highBroadcast should remain active');
console.log('  ✅ [PASS] 4. Sinyal SOS yang sudah dipenuhi otomatis hilang dari daftar aktif');

// 5. Verify supplier response history
const supplierHistory = getSOSHistory(supplierUser.id);
assert.strictEqual(supplierHistory.length, 1, 'Supplier history should record 1 response');
assert.strictEqual(supplierHistory[0].broadcastId, broadcast.id, 'History should match broadcast ID');
assert.strictEqual(supplierHistory[0].recipientOrgName, 'Dapur Sosial Kasih', 'History recipient should match');
console.log('  ✅ [PASS] 5. Riwayat bantuan darurat tercatat rapi di profil supplier');

// 6. Test Expiration Mechanism: manually rewind expiration of the HIGH broadcast and run expireOverdueSOSBroadcasts
const rawBroadcasts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOS_BROADCASTS) || '[]');
const modifiedBroadcasts = rawBroadcasts.map(b => {
  if (b.id === highBroadcast.id) {
    return { ...b, expiresAt: new Date(Date.now() - 60000).toISOString() }; // expired 1 min ago
  }
  return b;
});
localStorage.setItem(STORAGE_KEYS.SOS_BROADCASTS, JSON.stringify(modifiedBroadcasts));

const updatedBroadcasts = expireOverdueSOSBroadcasts();
const expiredOne = updatedBroadcasts.find(b => b.id === highBroadcast.id);
assert.strictEqual(expiredOne.status, 'EXPIRED', 'Overdue broadcast should be marked EXPIRED');
const activeAfterExpiry = getActiveSOSBroadcasts();
assert.strictEqual(activeAfterExpiry.length, 0, 'No active broadcasts should remain');
console.log('  ✅ [PASS] 6. Sinyal SOS yang telah melewati batas waktu otomatis kedaluwarsa (EXPIRED)');

console.log('\n🎉 All 6 SOS Emergency Broadcast scenarios passed successfully!');
