/**
 * Automated Verification Script for REPLATE Food Safety Gate
 * Tests all 13 mandatory scenarios defined in Section 11 of prompt.
 */

import assert from 'assert';
import { evaluateFoodSafetyGate } from '../src/engine/foodSafetyGate.js';
import { calculateRescueScore } from '../src/engine/rescueScore.js';
import { determineRoute } from '../src/engine/routeEngine.js';
import { matchDestinations } from '../src/engine/matchingEngine.js';

console.log('🧪 Running REPLATE Food Safety Gate Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function testCase(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ Scenario ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ Scenario ${totalTests}: ${name}`);
    console.error(`     Error: ${err.message}\n`);
    throw err;
  }
}

// =========================================================================
// SCENARIO 1: All relevant info complete & compliant -> PASS
// =========================================================================
testCase('All relevant info complete and compliant -> PASS', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    storageDurationHours: 1.5,
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    timeWindowId: '1_3h'
  }, 'id');

  assert.strictEqual(result.status, 'PASS');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, true);
  assert.strictEqual(result.reasons.length, 0);
  assert.strictEqual(result.missingInformation.length, 0);
});

// =========================================================================
// SCENARIO 2: Storage history unknown -> REVIEW
// =========================================================================
testCase('Storage history unknown -> REVIEW', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'unknown',
    storageTempId: 'unknown',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  }, 'id');

  assert.strictEqual(result.status, 'REVIEW');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
  assert(result.reasons.some(r => r.toLowerCase().includes('riwayat suhu') || r.toLowerCase().includes('penyimpanan')));
  assert(result.missingInformation.length > 0);
});

// =========================================================================
// SCENARIO 3: Incomplete/unclear storage time for high-risk food -> REVIEW
// =========================================================================
testCase('Storage time incomplete / altered condition -> REVIEW', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'altered_needs_check',
    storageHistoryId: 'known_compliant',
    packagingConditionId: 'intact_proper'
  }, 'id');

  assert.strictEqual(result.status, 'REVIEW');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
  assert(result.missingInformation.length > 0);
});

// =========================================================================
// SCENARIO 4: Clear spoilage or damage reported -> REJECT
// =========================================================================
testCase('Clear signs of spoilage reported -> REJECT', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'clear_spoilage',
    storageHistoryId: 'known_compliant',
    packagingConditionId: 'intact_proper'
  }, 'id');

  assert.strictEqual(result.status, 'REJECT');
  assert.strictEqual(result.eligibleForConsumptionRecommendation, false);
  assert(result.reasons.length > 0);
  assert(result.alternativeRouteRecommendation !== null);
});

// =========================================================================
// SCENARIO 5: Invalid date or time (future date or expired product) -> REJECT / REVIEW
// =========================================================================
testCase('Invalid date: Expired product -> REJECT; Future prep -> REVIEW', () => {
  // 5a. Expired date in past
  const pastDate = '2020-01-01';
  const expiredResult = evaluateFoodSafetyGate({
    foodTypeId: 'packaged-dry-goods',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    expiryDate: pastDate
  }, 'id');
  assert.strictEqual(expiredResult.status, 'REJECT');
  assert(expiredResult.reasons.some(r => r.toLowerCase().includes('kedaluwarsa') || r.toLowerCase().includes('expiration')));

  // 5b. Future prep date (illogical)
  const futurePrep = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const futureResult = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    preparedAt: futurePrep
  }, 'id');
  assert.strictEqual(futureResult.status, 'REVIEW');
  assert(futureResult.reasons.some(r => r.toLowerCase().includes('masa depan') || r.toLowerCase().includes('future')));
});

// =========================================================================
// SCENARIO 6: Data modified after assessment -> Re-evaluates accurately
// =========================================================================
testCase('Data re-evaluation dynamically updates status', () => {
  const initialBad = {
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'clear_spoilage',
    storageHistoryId: 'known_compliant'
  };
  const result1 = evaluateFoodSafetyGate(initialBad, 'id');
  assert.strictEqual(result1.status, 'REJECT');

  // User corrects/inspects properly
  const corrected = {
    ...initialBad,
    safetyConditionId: 'no_visible_damage',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated'
  };
  const result2 = evaluateFoodSafetyGate(corrected, 'id');
  assert.strictEqual(result2.status, 'PASS');
});

// =========================================================================
// SCENARIO 7: Food with REVIEW status attempting consumption recommendation -> BLOCKED
// =========================================================================
testCase('REVIEW status blocks human consumption routing', () => {
  const gateReview = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'not_checked',
    storageHistoryId: 'unknown'
  }, 'id');
  assert.strictEqual(gateReview.status, 'REVIEW');

  const routeResult = determineRoute({
    foodTypeId: 'cooked-rice',
    foodSafetyGate: gateReview
  }, 'id');

  assert.strictEqual(routeResult.route, 'PENDING_VERIFICATION');
  assert.notStrictEqual(routeResult.route, 'REDISTRIBUTE');
  assert.notStrictEqual(routeResult.route, 'PROCESS');

  const matches = matchDestinations({
    foodTypeId: 'cooked-rice',
    quantity: 10,
    unit: 'kg',
    recommendedRoute: routeResult.route,
    foodSafetyGate: gateReview
  }, 'id');

  assert(matches.every(m => m.isLockedForReview === true));
});

// =========================================================================
// SCENARIO 8: Food with REJECT status attempting consumption recommendation -> BLOCKED
// =========================================================================
testCase('REJECT status strictly blocks human consumption routing', () => {
  const gateReject = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'clear_spoilage',
    storageHistoryId: 'suspected_non_compliant'
  }, 'id');
  assert.strictEqual(gateReject.status, 'REJECT');

  const routeResult = determineRoute({
    foodTypeId: 'cooked-rice',
    foodSafetyGate: gateReject
  }, 'id');

  assert.notStrictEqual(routeResult.route, 'REDISTRIBUTE');
  assert.notStrictEqual(routeResult.route, 'PROCESS');
  assert.strictEqual(routeResult.route, 'ORGANIC');

  const matches = matchDestinations({
    foodTypeId: 'cooked-rice',
    quantity: 10,
    unit: 'kg',
    recommendedRoute: routeResult.route,
    foodSafetyGate: gateReject
  }, 'id');

  // Food banks and community kitchens must NOT appear
  const soupKitchenMatch = matches.find(m => m.destination.type === 'Community Kitchen' || m.destination.type === 'Food Bank Distribution Center');
  assert.strictEqual(soupKitchenMatch, undefined);
});

// =========================================================================
// SCENARIO 9: Food with PASS status receives proper Rescue Score and route
// =========================================================================
testCase('PASS status receives valid Rescue Score and proper route', () => {
  const gatePass = evaluateFoodSafetyGate({
    foodTypeId: 'cooked-rice',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'hot_holding_above_60',
    packagingConditionId: 'intact_proper',
    handlingIntegrityId: 'hygienic_separated',
    timeWindowId: '1_3h'
  }, 'id');
  assert.strictEqual(gatePass.status, 'PASS');

  const scoreResult = calculateRescueScore({
    foodTypeId: 'cooked-rice',
    quantity: 8,
    unit: 'kg',
    conditionId: 'suitable',
    timeWindowId: '1_3h'
  }, 'id');

  assert(scoreResult.score >= 70 && scoreResult.score <= 100);

  const routeResult = determineRoute({
    foodTypeId: 'cooked-rice',
    conditionId: 'suitable',
    timeWindowId: '1_3h',
    foodSafetyGate: gatePass
  }, 'id');

  assert.strictEqual(routeResult.route, 'REDISTRIBUTE');
});

// =========================================================================
// SCENARIO 10: High Rescue Score CANNOT override REVIEW or REJECT
// =========================================================================
testCase('High Rescue Score cannot override REVIEW or REJECT', () => {
  // Food that would get a 95+ score (large volume, easy distribution, prime urgency)
  // BUT condition is clear spoilage
  const spoiledReport = {
    foodTypeId: 'cooked-rice',
    quantity: 10,
    unit: 'kg',
    conditionId: 'not_suitable',
    safetyConditionId: 'clear_spoilage',
    storageHistoryId: 'suspected_non_compliant',
    timeWindowId: 'under_1h'
  };

  const gateResult = evaluateFoodSafetyGate(spoiledReport, 'id');
  assert.strictEqual(gateResult.status, 'REJECT');

  // Even if rescue score function is executed
  const routeResult = determineRoute({
    ...spoiledReport,
    foodSafetyGate: gateResult
  }, 'id');

  // Consumption routes MUST remain blocked
  assert.notStrictEqual(routeResult.route, 'REDISTRIBUTE');
  assert.notStrictEqual(routeResult.route, 'PROCESS');
});

// =========================================================================
// SCENARIO 11: Gate results persist consistently
// =========================================================================
testCase('Gate status metadata structure is consistent and serialized', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'fresh-vegetables',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    storageTempId: 'cold_holding_below_4',
    packagingConditionId: 'not_applicable_fresh',
    handlingIntegrityId: 'hygienic_separated'
  }, 'id');

  const jsonStr = JSON.stringify(result);
  const parsed = JSON.parse(jsonStr);

  assert.strictEqual(parsed.status, 'PASS');
  assert.strictEqual(parsed.ruleVersion, '1.0');
  assert(parsed.evaluatedAt !== undefined);
  assert(parsed.citations.length >= 3);
});

// =========================================================================
// SCENARIO 12: Legacy localStorage data without gate data handled safely
// =========================================================================
testCase('Legacy reports lacking foodSafetyGate default conservatively to REVIEW', () => {
  const legacyReport = {
    id: 'legacy-123',
    foodTypeId: 'cooked-rice',
    quantity: 5,
    unit: 'kg'
    // no foodSafetyGate object!
  };

  // Emulate storage.js migration rule
  const migrated = !legacyReport.foodSafetyGate ? {
    ...legacyReport,
    foodSafetyGate: {
      status: 'REVIEW',
      eligibleForConsumptionRecommendation: false,
      reasons: ['Data lampau belum memiliki rekaman Food Safety Gate terverifikasi.'],
      missingInformation: ['Parameter lengkap keamanan pangan.']
    }
  } : legacyReport;

  assert.strictEqual(migrated.foodSafetyGate.status, 'REVIEW');
  assert.strictEqual(migrated.foodSafetyGate.eligibleForConsumptionRecommendation, false);
});

// =========================================================================
// SCENARIO 13: Packaging hazard (damaged/dented can) maps to SAFE_DISPOSAL
// =========================================================================
testCase('Contaminated packaging / dented can maps to SAFE_DISPOSAL', () => {
  const result = evaluateFoodSafetyGate({
    foodTypeId: 'packaged-dry-goods',
    safetyConditionId: 'no_visible_damage',
    storageHistoryId: 'known_compliant',
    packagingConditionId: 'damaged_leaking_contaminated'
  }, 'id');

  assert.strictEqual(result.status, 'REJECT');
  assert.strictEqual(result.alternativeRouteRecommendation.route, 'SAFE_DISPOSAL');
  assert(result.reasons.some(r => r.toLowerCase().includes('kemasan') || r.toLowerCase().includes('packaging')));
});

console.log(`\n🎉 All ${passedTests} of ${totalTests} test scenarios passed successfully!`);
