import assert from 'assert';
import { calculateRescuePerformance } from '../src/utils/calculations.js';
import { formatRupiah, formatDuration, formatNumber } from '../src/utils/formatters.js';

console.log('🧪 Running REPLATE Rescue Performance Analytics Test Suite...\n');

// SCENARIO 1: Empty State
{
  const perf = calculateRescuePerformance([], 'id');
  assert.strictEqual(perf.hasData, false, 'hasData should be false');
  assert.strictEqual(perf.totalReports, 0, 'totalReports should be 0');
  assert.strictEqual(perf.kpis.totalReportedKg, 0, 'totalReportedKg should be 0');
  assert.strictEqual(perf.kpis.totalRescuedKg, 0, 'totalRescuedKg should be 0');
  assert.strictEqual(perf.kpis.avgRescueTimeHours, null, 'avgRescueTimeHours should be null');
  assert.strictEqual(perf.kpis.avgRescueTimeString, 'Belum ada data', 'avgRescueTimeString should be "Belum ada data"');
  assert.strictEqual(perf.kpis.successRate, null, 'successRate should be null to avoid false 0%');
  assert.strictEqual(perf.kpis.successRateString, 'Belum ada data', 'successRateString should be "Belum ada data"');
  assert.strictEqual(perf.funnel.isSufficient, false, 'funnel should be marked insufficient');
  assert.strictEqual(perf.environmentalSecondary.co2eAvoidedKg, null, 'co2e should be null');
  console.log('  ✅ Scenario 1: Empty state safely handles zero-division and honest "Belum ada data"');
}

// SCENARIO 2: Active reports only (not completed, not due)
{
  const reports = [
    {
      id: 'rep-1',
      quantity: 10,
      unit: 'kg',
      foodTypeId: 'cooked-rice',
      journeyStatus: 'REPORTED',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rep-2',
      quantity: 15,
      unit: 'kg',
      foodTypeId: 'fresh-vegetables',
      journeyStatus: 'MATCHED',
      createdAt: new Date().toISOString()
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  assert.strictEqual(perf.kpis.totalReportedKg, 25, 'totalReportedKg should be 25');
  assert.strictEqual(perf.kpis.totalRescuedKg, 0, 'totalRescuedKg must be 0 for active unconfirmed reports');
  assert.strictEqual(perf.kpis.completedTransactions, 0, 'completedTransactions should be 0');
  assert.strictEqual(perf.kpis.activeTransactions, 2, 'activeTransactions should be 2');
  assert.strictEqual(perf.kpis.dueTransactions, 0, 'dueTransactions should be 0');
  assert.strictEqual(perf.kpis.successRate, null, 'active unexpired items must not count as failure');
  assert.strictEqual(perf.environmentalSecondary.co2eAvoidedKg, null, 'environmental impact should be null if 0 received');
  console.log('  ✅ Scenario 2: Active ongoing reports never falsely claimed as rescued or failed');
}

// SCENARIO 3: Completed reports with valid timestamps
{
  const t0 = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
  const t1 = new Date().toISOString();

  const reports = [
    {
      id: 'rep-comp-1',
      quantity: 20,
      unit: 'kg',
      foodTypeId: 'cooked-rice',
      journeyStatus: 'RECEIVED',
      createdAt: t0,
      journeyEvents: [
        { status: 'REPORTED', timestamp: t0 },
        { status: 'RECEIVED', timestamp: t1 }
      ]
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  assert.strictEqual(perf.kpis.totalReportedKg, 20);
  assert.strictEqual(perf.kpis.totalRescuedKg, 20);
  assert.strictEqual(perf.kpis.completedTransactions, 1);
  assert.strictEqual(perf.kpis.dueTransactions, 1);
  assert.strictEqual(perf.kpis.successRate, 100);
  assert.strictEqual(perf.kpis.successRateString, '100,0%'); // Indonesian locale uses comma decimal separator
  assert(perf.kpis.avgRescueTimeHours >= 1.9 && perf.kpis.avgRescueTimeHours <= 2.1, 'avg latency should be ~2 hours');
  assert.strictEqual(perf.environmentalSecondary.hasData, true);
  assert.strictEqual(perf.environmentalSecondary.co2eAvoidedKg, 42.0); // 20 * 2.1 = 42.0
  console.log('  ✅ Scenario 3: Completed reports calculate 100% success rate, latency, and CO2e correctly');
}

// SCENARIO 4: Actual received weight differs from initial weight
{
  const reports = [
    {
      id: 'rep-actual-weight',
      quantity: 50,
      unit: 'kg',
      actualReceivedKg: 42.5, // 42.5 kg confirmed physically
      foodTypeId: 'fresh-vegetables',
      journeyStatus: 'RECEIVED',
      createdAt: new Date().toISOString(),
      receivedAt: new Date().toISOString()
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  assert.strictEqual(perf.kpis.totalReportedKg, 50, 'intake reported weight is 50 kg');
  assert.strictEqual(perf.kpis.totalRescuedKg, 42.5, 'rescued weight must use confirmed actual received weight');
  console.log('  ✅ Scenario 4: Confirmed actual received weight prioritized over reported weight');
}

// SCENARIO 5: Portions conversion to kg
{
  const reports = [
    {
      id: 'rep-portions',
      quantity: 40,
      unit: 'portions', // 40 portions * 0.35 kg = 14 kg
      foodTypeId: 'prepared-meals',
      journeyStatus: 'REPORTED',
      createdAt: new Date().toISOString()
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  assert.strictEqual(perf.kpis.totalReportedKg, 14, '40 portions converted to 14 kg');
  console.log('  ✅ Scenario 5: Portions standardized accurately via 0.35 kg/portion benchmark');
}

// SCENARIO 6: Mixed outcomes (Completed vs Cancelled)
{
  const reports = [
    {
      id: 'rep-a',
      quantity: 10,
      unit: 'kg',
      journeyStatus: 'RECEIVED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      receivedAt: new Date().toISOString()
    },
    {
      id: 'rep-b',
      quantity: 10,
      unit: 'kg',
      journeyStatus: 'RECEIVED',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      receivedAt: new Date().toISOString()
    },
    {
      id: 'rep-c',
      quantity: 10,
      unit: 'kg',
      journeyStatus: 'CANCELLED',
      cancellationReason: 'Kapasitas penerima penuh',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rep-d',
      quantity: 10,
      unit: 'kg',
      journeyStatus: 'MATCHED', // active ongoing, NOT due
      createdAt: new Date().toISOString()
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  assert.strictEqual(perf.kpis.completedTransactions, 2);
  assert.strictEqual(perf.kpis.cancelledTransactions, 1);
  assert.strictEqual(perf.kpis.activeTransactions, 1);
  assert.strictEqual(perf.kpis.dueTransactions, 3); // 2 completed + 1 cancelled
  assert.strictEqual(perf.kpis.successRate, 66.7); // (2 / 3) * 100 = 66.7%
  assert.strictEqual(perf.kpis.successRateString, '66,7%');
  assert.strictEqual(perf.bottlenecks.length, 1);
  assert.strictEqual(perf.bottlenecks[0].reason, 'Kapasitas penerima penuh');
  console.log('  ✅ Scenario 6: Success rate denominator correctly includes only due transactions');
}

// SCENARIO 7: Surplus Value Exchange (Separation of donation vs commercial)
{
  const reports = [
    {
      id: 'rep-donated',
      quantity: 10,
      unit: 'kg',
      foodTypeId: 'cooked-rice', // benchmark Rp 25.000
      journeyStatus: 'RECEIVED',
      isCommercial: false
    },
    {
      id: 'rep-commercial',
      quantity: 5,
      unit: 'kg',
      foodTypeId: 'bread-pastries', // benchmark Rp 35.000
      journeyStatus: 'RECEIVED',
      isCommercial: true,
      actualPriceIdr: 15000 // discounted sale
    }
  ];

  const perf = calculateRescuePerformance(reports, 'id');
  // Offered: 10*25000 + 5*35000 = 250000 + 175000 = 425000
  assert.strictEqual(perf.economics.offeredValueIdr, 425000);
  // Commercial Completed: 5 * 15000 = 75000
  assert.strictEqual(perf.economics.completedCommercialValueIdr, 75000);
  // Recipient Savings:
  // Donated: 10 * 25000 = 250000
  // Discounted: 5 * (35000 - 15000) = 100000
  // Total Savings = 350000
  assert.strictEqual(perf.economics.recipientSavingsIdr, 350000);
  assert.strictEqual(perf.economics.donatedCompletedCount, 1);
  assert.strictEqual(perf.economics.commercialCompletedCount, 1);
  console.log('  ✅ Scenario 7: Surplus Value Exchange clearly differentiates donation savings from commercial sales');
}

// SCENARIO 8: Formatters validation
{
  assert.strictEqual(formatRupiah(1250000), 'Rp 1.250.000');
  assert.strictEqual(formatRupiah(0), 'Rp 0');
  assert.strictEqual(formatDuration(null, 'id'), 'Belum ada data');
  assert.strictEqual(formatDuration(null, 'en'), 'No data available');
  assert.strictEqual(formatDuration(0.5, 'id'), '30 menit');
  assert.strictEqual(formatDuration(2.4, 'id'), '2,4 jam');
  console.log('  ✅ Scenario 8: Formatters format Indonesian currency and durations reliably');
}

console.log('\n🎉 All 8 of 8 Rescue Performance test scenarios passed successfully!');
