import assert from 'node:assert';
import {
  saveReport,
  getReports,
  deleteReport,
  getDeletedReportIds,
  isReportDeleted,
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

console.log('🧪 Running Tombstone / Zombie Record Deletion Prevention Test...');

// 1. Create a user report
const testReport = {
  id: 'rep-tombstone-test-01',
  foodTypeId: 'cooked-rice',
  foodName: 'Nasi Kuning Pesta',
  quantity: 10,
  unit: 'kg',
  foodSafetyGate: { status: 'PASS' }
};

saveReport(testReport);
let currentReports = getReports();
assert.strictEqual(currentReports.some(r => r.id === 'rep-tombstone-test-01'), true, 'Report must be saved in storage');
assert.strictEqual(isReportDeleted('rep-tombstone-test-01'), false, 'Report must not be marked deleted initially');
console.log('  ✅ [PASS] 1. Laporan baru berhasil dibuat dan belum ditandai terhapus');

// 2. Delete the report
const deleted = deleteReport('rep-tombstone-test-01');
assert.strictEqual(deleted, true, 'deleteReport must return true');
assert.strictEqual(isReportDeleted('rep-tombstone-test-01'), true, 'Report ID must be in tombstone index');
const deletedSet = getDeletedReportIds();
assert.strictEqual(deletedSet.has('rep-tombstone-test-01'), true, 'Deleted ID set must contain the deleted report ID');
currentReports = getReports();
assert.strictEqual(currentReports.some(r => r.id === 'rep-tombstone-test-01'), false, 'Report must not exist in active reports');
console.log('  ✅ [PASS] 2. Laporan berhasil dihapus dan tercatat permanen di indeks Tombstone');

// 3. Simulate remote sync attempt to resurrect the deleted report
const remoteIncoming = [
  {
    id: 'rep-tombstone-test-01',
    foodName: 'Nasi Kuning Pesta',
    quantity: 10,
    unit: 'kg'
  },
  {
    id: 'rep-new-remote-02',
    foodName: 'Roti Gandum',
    quantity: 5,
    unit: 'kg'
  }
];

// Replicate the sync logic filter
const localFiltered = remoteIncoming.filter(r => !isReportDeleted(r.id));
assert.strictEqual(localFiltered.length, 1, 'Tombstone filter must reject resurrected record');
assert.strictEqual(localFiltered[0].id, 'rep-new-remote-02', 'Only legitimate non-deleted records pass through');
console.log('  ✅ [PASS] 3. Filter Tombstone secara deterministik menolak pemulihan (resurrection) data cloud');

// 4. Test clearAllData clears tombstones
clearAllData();
assert.strictEqual(getDeletedReportIds().size, 0, 'clearAllData must reset tombstones');
console.log('  ✅ [PASS] 4. clearAllData membersihkan seluruh data dan reset tombstone');

console.log('\n🎉 Success! All Tombstone deletion tests passed perfectly!\n');
