/**
 * REPLATE Calculations & Impact Analytics
 * Aggregates local-first report datasets into transparent metrics and insights.
 */

import { METRIC_ASSUMPTIONS, CATEGORY_BENCHMARK_PRICE_IDR, OPERATIONAL_STATUS_GROUPS } from '../data/rules.js';

export function calculateImpactSummary(reports = []) {
  if (!reports || reports.length === 0) {
    return {
      totalReports: 0,
      totalRescuedKg: 0,
      totalActiveKg: 0,
      totalHandledKg: 0,
      completedJourneys: 0,
      activeJourneys: 0,
      successfulMatches: 0,
      estimatedServings: 0,
      estimatedCo2eAvoidedKg: 0,
      estimatedWaterSavedLiters: 0,
      routeDistribution: { REDISTRIBUTE: 0, PROCESS: 0, ORGANIC: 0 },
      categoryDistribution: {},
      destinationDistribution: {}
    };
  }

  let totalRescuedKg = 0;
  let totalOrganicKg = 0;
  let totalActiveKg = 0;
  let totalHandledKg = 0;
  let completedJourneys = 0;
  let activeJourneys = 0;
  let successfulMatches = 0;

  const routeDistribution = { REDISTRIBUTE: 0, PROCESS: 0, ORGANIC: 0 };
  const categoryDistribution = {};
  const destinationDistribution = {};

  reports.forEach(rep => {
    const rawKg = rep.unit === 'portions' ? (rep.quantity * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG) : Number(rep.quantity) || 0;
    const kg = Math.max(0, isNaN(rawKg) ? 0 : rawKg);
    totalHandledKg += kg;

    if (rep.journeyStatus === 'RECEIVED') {
      const rawReceivedKg = rep.actualReceivedKg !== undefined && rep.actualReceivedKg !== null && Number(rep.actualReceivedKg) > 0
        ? Number(rep.actualReceivedKg)
        : kg;
      const effectiveKg = Math.max(0, isNaN(rawReceivedKg) ? 0 : rawReceivedKg);

      if (rep.recommendedRoute === 'ORGANIC') {
        totalOrganicKg += effectiveKg;
      } else {
        totalRescuedKg += effectiveKg;
      }
      completedJourneys += 1;
    } else if (rep.journeyStatus === 'RESCUE_INITIATED' || rep.journeyStatus === 'MATCHED') {
      totalActiveKg += kg;
      activeJourneys += 1;
    }

    if (rep.selectedDestination) {
      successfulMatches += 1;
      const destName = rep.selectedDestination.name || 'Unassigned';
      destinationDistribution[destName] = (destinationDistribution[destName] || 0) + kg;
    }

    const route = rep.recommendedRoute || 'REDISTRIBUTE';
    if (routeDistribution[route] !== undefined) {
      routeDistribution[route] += 1;
    }

    const cat = rep.category || rep.foodTypeId || 'other';
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + kg;
  });

  // Calculate estimated servings based on transparent formula
  const estimatedServings = Math.round(totalRescuedKg / METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG);
  const estimatedCo2eAvoidedKg = Math.round(totalRescuedKg * METRIC_ASSUMPTIONS.CO2E_FACTOR_PER_KG * 10) / 10;
  const estimatedWaterSavedLiters = Math.round(totalRescuedKg * METRIC_ASSUMPTIONS.WATER_LITERS_PER_KG);

  return {
    totalReports: reports.length,
    totalRescuedKg: Math.round(totalRescuedKg * 10) / 10,
    totalOrganicKg: Math.round(totalOrganicKg * 10) / 10,
    totalActiveKg: Math.round(totalActiveKg * 10) / 10,
    totalHandledKg: Math.round(totalHandledKg * 10) / 10,
    completedJourneys,
    activeJourneys,
    successfulMatches,
    estimatedServings,
    estimatedCo2eAvoidedKg,
    estimatedWaterSavedLiters,
    routeDistribution,
    categoryDistribution,
    destinationDistribution
  };
}

/**
 * REPLATE Rescue Performance Centralized Analytics Engine
 * Grounded in verified operational supply-chain mathematics.
 * Strictly adheres to non-hallucinatory metrics, honest empty states,
 * and clear denominator definitions.
 */
export function calculateRescuePerformance(reports = [], lang = 'id') {
  const isId = lang === 'id';

  // 1. Deduplicate reports by unique id and sanitize inputs
  const uniqueMap = new Map();
  if (Array.isArray(reports)) {
    reports.forEach(r => {
      if (r && r.id && !uniqueMap.has(r.id)) {
        uniqueMap.set(r.id, r);
      }
    });
  }
  const cleanReports = Array.from(uniqueMap.values());

  // Detect whether demo/simulated data is present
  const hasDemoData = cleanReports.some(r => r.isDemo || String(r.id || '').startsWith('demo-'));

  if (cleanReports.length === 0) {
    return {
      hasData: false,
      hasDemoData: false,
      totalReports: 0,
      kpis: {
        totalReportedKg: 0,
        totalReportedTransactions: 0,
        totalRescuedKg: 0,
        humanRescuedKg: 0,
        organicRescuedKg: 0,
        completedTransactions: 0,
        avgRescueTimeHours: null, // "Belum ada data"
        avgRescueTimeString: isId ? 'Belum ada data' : 'No data available',
        successRate: null, // "Belum ada data"
        successRateString: isId ? 'Belum ada data' : 'No data available',
        dueTransactions: 0,
        activeTransactions: 0,
        cancelledTransactions: 0
      },
      statusOverview: OPERATIONAL_STATUS_GROUPS.map(g => ({
        key: g.key,
        label: isId ? g.labelId : g.labelEn,
        count: 0,
        kg: 0,
        percentage: 0
      })),
      bottlenecks: [],
      funnel: {
        isSufficient: false,
        stages: [
          { name: isId ? 'Laporan Diterima' : 'Intake Reported', count: 0, kg: 0, conversionRate: 0 },
          { name: isId ? 'Terverifikasi & Dinilai' : 'Assessed & Verified', count: 0, kg: 0, conversionRate: 0 },
          { name: isId ? 'Mitra Dicocokkan' : 'Recipient Matched', count: 0, kg: 0, conversionRate: 0 },
          { name: isId ? 'Penjemputan / Logistik' : 'In Transit / Logistics', count: 0, kg: 0, conversionRate: 0 },
          { name: isId ? 'Selesai Diterima' : 'Rescued & Received', count: 0, kg: 0, conversionRate: 0 }
        ]
      },
      longestWaiting: [],
      economics: {
        hasEconomics: false,
        offeredValueIdr: 0,
        completedCommercialValueIdr: 0,
        recipientSavingsIdr: null,
        commercialCompletedCount: 0,
        donatedCompletedCount: 0
      },
      environmentalSecondary: {
        hasData: false,
        co2eAvoidedKg: null,
        waterSavedLiters: null,
        mealsEquivalent: null,
        methodologyNote: isId
          ? 'Metrik sekunder berdasarkan pemodelan US EPA WARM (2.1 kg CO₂e/kg) dan FAO (250 L/kg). Hanya dihitung setelah transaksi fisik dikonfirmasi diterima.'
          : 'Secondary modeling estimates based on US EPA WARM (2.1 kg CO2e/kg) and FAO (250 L/kg). Only calculated from verified received transactions.'
      }
    };
  }

  // 2. Compute standardized weights and metrics
  let totalReportedKg = 0;
  let totalRescuedKg = 0;
  let humanRescuedKg = 0;
  let organicRescuedKg = 0;

  let completedTransactions = 0;
  let activeTransactions = 0;
  let cancelledTransactions = 0;
  let expiredTransactions = 0;

  let commercialCompletedCount = 0;
  let donatedCompletedCount = 0;

  let offeredValueIdr = 0;
  let completedCommercialValueIdr = 0;
  let recipientSavingsIdr = 0;

  const validDurationsMs = [];
  const statusCounts = {
    REPORTED: { count: 0, kg: 0 },
    ASSESSED: { count: 0, kg: 0 },
    ROUTE_SELECTED: { count: 0, kg: 0 },
    MATCHED: { count: 0, kg: 0 },
    RESCUE_INITIATED: { count: 0, kg: 0 },
    RECEIVED: { count: 0, kg: 0 },
    CANCELLED: { count: 0, kg: 0 },
    EXPIRED: { count: 0, kg: 0 }
  };

  const detectedBottlenecks = [];
  const waitingCandidates = [];
  const nowMs = Date.now();

  cleanReports.forEach(rep => {
    // Standardize intake weight
    const rawQty = Number(rep.quantity) || 0;
    const initialKg = rep.unit === 'portions'
      ? rawQty * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG
      : rawQty;
    const reportedKg = Math.max(0, isNaN(initialKg) ? 0 : initialKg);
    totalReportedKg += reportedKg;

    const status = String(rep.journeyStatus || 'REPORTED').toUpperCase();

    // Map into granular status bucket
    if (statusCounts[status]) {
      statusCounts[status].count += 1;
      statusCounts[status].kg += reportedKg;
    } else {
      statusCounts.REPORTED.count += 1;
      statusCounts.REPORTED.kg += reportedKg;
    }

    // Benchmark economic rate
    const foodKey = rep.foodTypeId || 'other';
    const benchmarkPrice = CATEGORY_BENCHMARK_PRICE_IDR[foodKey] || CATEGORY_BENCHMARK_PRICE_IDR.other;
    offeredValueIdr += (reportedKg * benchmarkPrice);

    // Analyze status-specific operational lifecycle
    if (status === 'RECEIVED') {
      completedTransactions += 1;

      // Actual received weight (prioritize confirmed received weight if recorded)
      const confirmedWeight = rep.actualReceivedKg !== undefined && rep.actualReceivedKg !== null
        ? Math.max(0, Number(rep.actualReceivedKg) || 0)
        : reportedKg;

      totalRescuedKg += confirmedWeight;
      if (rep.recommendedRoute === 'ORGANIC') {
        organicRescuedKg += confirmedWeight;
      } else {
        humanRescuedKg += confirmedWeight;
      }

      // Latency calculation: intake createdAt to RECEIVED confirmation
      const tCreated = new Date(rep.createdAt).getTime();
      let tReceived = null;

      if (Array.isArray(rep.journeyEvents)) {
        const receivedEvent = rep.journeyEvents.find(e => e.status === 'RECEIVED');
        if (receivedEvent && receivedEvent.timestamp) {
          tReceived = new Date(receivedEvent.timestamp).getTime();
        }
      }
      if (!tReceived && rep.receivedAt) {
        tReceived = new Date(rep.receivedAt).getTime();
      }
      if (!tReceived && rep.updatedAt) {
        tReceived = new Date(rep.updatedAt).getTime();
      }

      if (tCreated && tReceived && !isNaN(tCreated) && !isNaN(tReceived) && tReceived >= tCreated) {
        validDurationsMs.push(tReceived - tCreated);
      }

      // Economics for completed
      if (rep.isCommercial || (rep.actualPriceIdr && rep.actualPriceIdr > 0)) {
        commercialCompletedCount += 1;
        const actualPrice = Number(rep.actualPriceIdr) || 0;
        completedCommercialValueIdr += (confirmedWeight * actualPrice);
        if (benchmarkPrice > actualPrice) {
          recipientSavingsIdr += ((benchmarkPrice - actualPrice) * confirmedWeight);
        }
      } else {
        // Pure donation / social intake: community saves 100% of benchmark cost
        donatedCompletedCount += 1;
        recipientSavingsIdr += (confirmedWeight * benchmarkPrice);
      }

    } else if (status === 'CANCELLED') {
      cancelledTransactions += 1;
      if (rep.cancellationReason || rep.failureReason) {
        detectedBottlenecks.push({
          type: 'CANCELLED',
          id: rep.id,
          foodName: rep.foodName || foodKey,
          reason: rep.cancellationReason || rep.failureReason
        });
      }
    } else if (status === 'EXPIRED') {
      expiredTransactions += 1;
      detectedBottlenecks.push({
        type: 'EXPIRED',
        id: rep.id,
        foodName: rep.foodName || foodKey,
        reason: isId ? 'Batas waktu aman terlampaui sebelum serah terima selesai' : 'Safe window elapsed prior to intake completion'
      });
    } else {
      // Active ongoing transaction
      activeTransactions += 1;

      const tCreated = new Date(rep.createdAt).getTime();
      const waitingHours = !isNaN(tCreated) ? Math.max(0, (nowMs - tCreated) / (1000 * 3600)) : 0;

      waitingCandidates.push({
        id: rep.id,
        foodTypeId: rep.foodTypeId,
        foodName: rep.foodName || foodKey,
        quantityKg: reportedKg,
        unit: rep.unit,
        source: rep.sourceContextId || 'Kitchen',
        currentStatus: status,
        gateStatus: rep.foodSafetyGate?.status || 'REVIEW',
        route: rep.recommendedRoute || 'REDISTRIBUTE',
        createdAt: rep.createdAt,
        waitingHours
      });

      // Detect real operational friction
      if (waitingHours >= 2 && (status === 'MATCHED' || status === 'RESCUE_INITIATED')) {
        detectedBottlenecks.push({
          type: 'LOGISTICS_DELAY',
          id: rep.id,
          foodName: rep.foodName || foodKey,
          reason: isId
            ? `Menunggu pergerakan logistik > ${Math.round(waitingHours)} jam sejak status ${status}`
            : `Logistics pending > ${Math.round(waitingHours)} hrs in status ${status}`
        });
      }

      if (rep.foodSafetyGate && rep.foodSafetyGate.status === 'REVIEW') {
        detectedBottlenecks.push({
          type: 'SAFETY_REVIEW',
          id: rep.id,
          foodName: rep.foodName || foodKey,
          reason: isId
            ? 'Parameter keamanan pangan memerlukan review sebelum rute konsumsi dapat dibuka'
            : 'Food safety parameters require verification before consumption routing'
        });
      }
    }
  });

  // Sort longest waiting active transactions
  waitingCandidates.sort((a, b) => b.waitingHours - a.waitingHours);
  const longestWaiting = waitingCandidates.slice(0, 5);

  // 3. Compute KPI 3: Average Rescue Latency
  let avgRescueTimeHours = null;
  let avgRescueTimeString = isId ? 'Belum ada data' : 'No data available';
  if (validDurationsMs.length > 0) {
    const totalMs = validDurationsMs.reduce((acc, v) => acc + v, 0);
    const avgMs = totalMs / validDurationsMs.length;
    avgRescueTimeHours = avgMs / (1000 * 3600);
    if (avgRescueTimeHours < 1) {
      const mins = Math.max(1, Math.round(avgRescueTimeHours * 60));
      avgRescueTimeString = `${mins} ${isId ? 'menit' : 'mins'}`;
    } else {
      const h = Math.round(avgRescueTimeHours * 10) / 10;
      avgRescueTimeString = `${h.toLocaleString(isId ? 'id-ID' : 'en-US')} ${isId ? 'jam' : 'hours'}`;
    }
  }

  // 4. Compute KPI 4: Success Rate
  // Denominator definition: Completed transactions + transactions cancelled/expired after due date
  const dueTransactions = completedTransactions + cancelledTransactions + expiredTransactions;
  let successRate = null;
  let successRateString = isId ? 'Belum ada data' : 'No data available';
  if (dueTransactions > 0) {
    successRate = Math.round((completedTransactions / dueTransactions) * 1000) / 10;
    successRateString = `${successRate.toLocaleString(isId ? 'id-ID' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  // 5. Operational Status Grouping
  const statusOverview = [
    {
      key: 'REPORTED',
      label: isId ? 'Menunggu Verifikasi & Penilaian' : 'Awaiting Assessment & Verification',
      count: statusCounts.REPORTED.count,
      kg: Math.round(statusCounts.REPORTED.kg * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round((statusCounts.REPORTED.kg / totalReportedKg) * 1000) / 10 : 0
    },
    {
      key: 'ASSESSED',
      label: isId ? 'Menunggu Rute & Pencocokan Mitra' : 'Awaiting Route & Recipient Match',
      count: statusCounts.ASSESSED.count + statusCounts.ROUTE_SELECTED.count,
      kg: Math.round((statusCounts.ASSESSED.kg + statusCounts.ROUTE_SELECTED.kg) * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round(((statusCounts.ASSESSED.kg + statusCounts.ROUTE_SELECTED.kg) / totalReportedKg) * 1000) / 10 : 0
    },
    {
      key: 'MATCHED',
      label: isId ? 'Menunggu Penjemputan / Logistik' : 'Matched, Awaiting Logistics',
      count: statusCounts.MATCHED.count,
      kg: Math.round(statusCounts.MATCHED.kg * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round((statusCounts.MATCHED.kg / totalReportedKg) * 1000) / 10 : 0
    },
    {
      key: 'IN_TRANSIT',
      label: isId ? 'Dalam Proses Pengantaran' : 'In Transit / Logistics Active',
      count: statusCounts.RESCUE_INITIATED.count,
      kg: Math.round(statusCounts.RESCUE_INITIATED.kg * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round((statusCounts.RESCUE_INITIATED.kg / totalReportedKg) * 1000) / 10 : 0
    },
    {
      key: 'RECEIVED',
      label: isId ? 'Berhasil Disalurkan & Diterima' : 'Successfully Rescued & Received',
      count: statusCounts.RECEIVED.count,
      kg: Math.round(statusCounts.RECEIVED.kg * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round((statusCounts.RECEIVED.kg / totalReportedKg) * 1000) / 10 : 0
    },
    {
      key: 'CANCELLED_EXPIRED',
      label: isId ? 'Dibatalkan / Jatuh Tempo' : 'Cancelled or Lapsed',
      count: statusCounts.CANCELLED.count + statusCounts.EXPIRED.count,
      kg: Math.round((statusCounts.CANCELLED.kg + statusCounts.EXPIRED.kg) * 10) / 10,
      percentage: totalReportedKg > 0 ? Math.round(((statusCounts.CANCELLED.kg + statusCounts.EXPIRED.kg) / totalReportedKg) * 1000) / 10 : 0
    }
  ];

  // 6. Supply Chain Funnel (Step-wise conversion)
  // Stage 1: Intake (All)
  // Stage 2: Assessed or beyond (Assessed, Route Selected, Matched, In Transit, Received)
  // Stage 3: Matched or beyond (Matched, In Transit, Received)
  // Stage 4: In Transit or beyond (In Transit, Received)
  // Stage 5: Received
  const intakeCount = cleanReports.length;
  const assessedCount = cleanReports.filter(r => ['ASSESSED', 'ROUTE_SELECTED', 'MATCHED', 'RESCUE_INITIATED', 'RECEIVED'].includes(r.journeyStatus)).length;
  const matchedCount = cleanReports.filter(r => ['MATCHED', 'RESCUE_INITIATED', 'RECEIVED'].includes(r.journeyStatus)).length;
  const transitCount = cleanReports.filter(r => ['RESCUE_INITIATED', 'RECEIVED'].includes(r.journeyStatus)).length;
  const receivedCount = completedTransactions;

  const funnel = {
    isSufficient: intakeCount > 0,
    stages: [
      {
        name: isId ? '01. Laporan Masuk' : '01. Intake Reported',
        count: intakeCount,
        kg: Math.round(totalReportedKg * 10) / 10,
        conversionRate: 100
      },
      {
        name: isId ? '02. Lolos Verifikasi & Penilaian' : '02. Assessed & Verified',
        count: assessedCount,
        conversionRate: intakeCount > 0 ? Math.round((assessedCount / intakeCount) * 1000) / 10 : 0
      },
      {
        name: isId ? '03. Mitra Dicocokkan' : '03. Recipient Matched',
        count: matchedCount,
        conversionRate: intakeCount > 0 ? Math.round((matchedCount / intakeCount) * 1000) / 10 : 0
      },
      {
        name: isId ? '04. Penjemputan / Logistik' : '04. Logistics In Transit',
        count: transitCount,
        conversionRate: intakeCount > 0 ? Math.round((transitCount / intakeCount) * 1000) / 10 : 0
      },
      {
        name: isId ? '05. Selesai Diterima' : '05. Received & Diverted',
        count: receivedCount,
        conversionRate: intakeCount > 0 ? Math.round((receivedCount / intakeCount) * 1000) / 10 : 0
      }
    ]
  };

  // 7. Secondary Environmental Calculations (Strictly from completed transactions)
  const environmentalSecondary = {
    hasData: totalRescuedKg > 0,
    co2eAvoidedKg: totalRescuedKg > 0 ? Math.round(totalRescuedKg * METRIC_ASSUMPTIONS.CO2E_FACTOR_PER_KG * 10) / 10 : null,
    waterSavedLiters: totalRescuedKg > 0 ? Math.round(totalRescuedKg * METRIC_ASSUMPTIONS.WATER_LITERS_PER_KG) : null,
    mealsEquivalent: humanRescuedKg > 0 ? Math.round(humanRescuedKg / METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG) : (totalRescuedKg > 0 ? 0 : null),
    methodologyNote: isId
      ? 'Metrik sekunder berdasarkan pemodelan faktor US EPA WARM (2.1 kg CO₂e/kg) dan rata-rata FAO (250 L air/kg). Hanya dihitung berdasarkan berat aktual pangan yang telah diverifikasi diterima.'
      : 'Secondary estimates modeled with US EPA WARM (2.1 kg CO2e/kg) and FAO global water footprint benchmark (250 L/kg). Only calculated from verified received surplus.'
  };

  return {
    hasData: cleanReports.length > 0,
    hasDemoData,
    totalReports: cleanReports.length,
    kpis: {
      totalReportedKg: Math.round(totalReportedKg * 10) / 10,
      totalReportedTransactions: cleanReports.length,
      totalRescuedKg: Math.round(totalRescuedKg * 10) / 10,
      humanRescuedKg: Math.round(humanRescuedKg * 10) / 10,
      organicRescuedKg: Math.round(organicRescuedKg * 10) / 10,
      completedTransactions,
      avgRescueTimeHours,
      avgRescueTimeString,
      successRate,
      successRateString,
      dueTransactions,
      activeTransactions,
      cancelledTransactions: cancelledTransactions + expiredTransactions
    },
    statusOverview,
    bottlenecks: detectedBottlenecks,
    funnel,
    longestWaiting,
    economics: {
      hasEconomics: cleanReports.length > 0,
      offeredValueIdr: Math.round(offeredValueIdr),
      completedCommercialValueIdr: Math.round(completedCommercialValueIdr),
      recipientSavingsIdr: completedTransactions > 0 ? Math.round(recipientSavingsIdr) : null,
      commercialCompletedCount,
      donatedCompletedCount
    },
    environmentalSecondary
  };
}


/**
 * Generate dynamic supply-chain insights from stored reports
 */
/**
 * Helper to get localized food name
 */
export function getFoodDisplayName(foodKeyOrName, fallbackName = '', lang = 'id') {
  if (!foodKeyOrName && !fallbackName) return lang === 'id' ? 'Makanan Surplus' : 'Surplus Food';
  const key = String(foodKeyOrName || fallbackName).toLowerCase();

  if (lang === 'id') {
    if (key === 'cooked-rice' || key.includes('rice') || key.includes('nasi')) return 'Nasi Matang';
    if (key === 'bread-pastries' || key.includes('bread') || key.includes('pastr') || key.includes('roti')) return 'Roti & Kue';
    if (key === 'fresh-vegetables' || key.includes('veg') || key.includes('sayur')) return 'Sayuran Segar';
    if (key === 'fruits' || key.includes('fruit') || key.includes('buah')) return 'Buah Segar';
    if (key === 'prepared-meals' || key.includes('meal') || key.includes('buffet') || key.includes('matang') || key.includes('prasmanan')) return 'Makanan Siap Saji';
    if (key === 'packaged-dry-goods' || key.includes('dry') || key.includes('sembako') || key.includes('kering')) return 'Bahan Kering';
    if (key === 'dairy-beverages' || key.includes('dairy') || key.includes('susu') || key.includes('minum')) return 'Susu & Minuman';
    return fallbackName || foodKeyOrName;
  } else {
    if (key === 'cooked-rice' || key.includes('rice') || key.includes('nasi')) return 'Cooked Rice';
    if (key === 'bread-pastries' || key.includes('bread') || key.includes('pastr') || key.includes('roti')) return 'Bread & Pastries';
    if (key === 'fresh-vegetables' || key.includes('veg') || key.includes('sayur')) return 'Fresh Vegetables';
    if (key === 'fruits' || key.includes('fruit') || key.includes('buah')) return 'Fresh Fruits';
    if (key === 'prepared-meals' || key.includes('meal') || key.includes('buffet') || key.includes('matang') || key.includes('prasmanan')) return 'Prepared Meals';
    if (key === 'packaged-dry-goods' || key.includes('dry') || key.includes('sembako') || key.includes('kering')) return 'Packaged Dry Goods';
    if (key === 'dairy-beverages' || key.includes('dairy') || key.includes('susu') || key.includes('minum')) return 'Dairy & Beverages';
    return fallbackName || foodKeyOrName;
  }
}

/**
 * Helper to get localized source context name
 */
export function getSourceDisplayName(sourceKey, lang = 'id') {
  if (!sourceKey) return lang === 'id' ? 'Dapur Komersial' : 'Commercial Kitchen';
  const key = String(sourceKey).toLowerCase();

  if (lang === 'id') {
    if (key.includes('cater')) return 'Katering & Acara';
    if (key.includes('rest')) return 'Restoran & Bistro';
    if (key.includes('retail') || key.includes('ritel') || key.includes('super')) return 'Supermarket / Ritel';
    if (key.includes('event') || key.includes('acara') || key.includes('seminar')) return 'Acara / Konferensi';
    if (key.includes('bake') || key.includes('roti')) return 'Toko Roti & Kafe';
    if (key.includes('school') || key.includes('sekolah') || key.includes('kantin')) return 'Kantin Sekolah';
    if (key.includes('house') || key.includes('rumah')) return 'Rumah Tangga';
    return sourceKey;
  } else {
    if (key.includes('cater')) return 'Catering & Events';
    if (key.includes('rest')) return 'Restaurant & Bistro';
    if (key.includes('retail') || key.includes('ritel') || key.includes('super')) return 'Retail & Grocery';
    if (key.includes('event') || key.includes('acara') || key.includes('seminar')) return 'Events & Banquets';
    if (key.includes('bake') || key.includes('roti')) return 'Bakery & Cafe';
    if (key.includes('school') || key.includes('sekolah') || key.includes('kantin')) return 'School / University';
    if (key.includes('house') || key.includes('rumah')) return 'Household';
    return sourceKey;
  }
}

/**
 * Helper to get localized route name
 */
export function getRouteDisplayName(routeKey, lang = 'id') {
  if (!routeKey) return lang === 'id' ? 'Distribusi Langsung' : 'Direct Redistribution';
  const key = String(routeKey).toUpperCase();
  if (lang === 'id') {
    if (key === 'REDISTRIBUTE') return 'Distribusi Langsung';
    if (key === 'PROCESS') return 'Pengolahan Ulang';
    if (key === 'ORGANIC') return 'Daur Ulang Organik';
    return routeKey;
  } else {
    if (key === 'REDISTRIBUTE') return 'Direct Redistribution';
    if (key === 'PROCESS') return 'Secondary Processing';
    if (key === 'ORGANIC') return 'Organic Recycling';
    return routeKey;
  }
}

export function generateInsights(reports = [], lang = 'id') {
  if (!reports || reports.length === 0) {
    return {
      hasData: false,
      message: lang === 'id'
        ? 'Belum ada data surplus yang tercatat. Buat laporan surplus untuk melihat analisis pola pencegahan.'
        : 'No surplus records available. Report a surplus to view pattern analysis.'
    };
  }

  // 1. Most common surplus food
  const foodCounts = {};
  const sourceCounts = {};
  const routeCounts = {};
  let totalScore = 0;
  let scoreCount = 0;

  reports.forEach(r => {
    const fId = r.foodTypeId || r.foodName || 'other';
    foodCounts[fId] = (foodCounts[fId] || 0) + 1;

    const sId = r.sourceContextId || 'General';
    sourceCounts[sId] = (sourceCounts[sId] || 0) + 1;

    const route = r.recommendedRoute || 'REDISTRIBUTE';
    routeCounts[route] = (routeCounts[route] || 0) + 1;

    if (r.rescueScore !== undefined) {
      totalScore += Number(r.rescueScore);
      scoreCount += 1;
    }
  });

  const getTopKey = (obj) => {
    const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  const topFoodKey = getTopKey(foodCounts);
  const topSourceKey = getTopKey(sourceCounts);
  const topRouteKey = getTopKey(routeCounts);
  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // Localized representations
  const topFood = getFoodDisplayName(topFoodKey, topFoodKey, lang);
  const topSource = getSourceDisplayName(topSourceKey, lang);
  const topRoute = getRouteDisplayName(topRouteKey, lang);

  // Determine structural prevention advice based on top patterns and language
  let preventionTitle = '';
  let preventionAdvice = '';

  const sKeyNorm = String(topSourceKey || '').toLowerCase();

  if (lang === 'id') {
    preventionTitle = `Surplus berulang teridentifikasi: ${topFood}`;
    if (sKeyNorm.includes('cater')) {
      preventionAdvice = `Katering & acara menunjukkan surplus ${topFood.toLowerCase()} yang berulang. Rekomendasi tindakan: terapkan sistem buffer isi ulang wadah 2 tahap untuk mencegah kelebihan porsi yang belum tersaji.`;
    } else if (sKeyNorm.includes('rest')) {
      preventionAdvice = `Catatan dapur restoran menunjukkan surplus ${topFood.toLowerCase()} yang sering terjadi. Rekomendasi tindakan: kalibrasi standar porsi persiapan pada shift kerja di luar jam sibuk.`;
    } else if (sKeyNorm.includes('bake')) {
      preventionAdvice = `Produksi toko roti menunjukkan kelebihan ${topFood.toLowerCase()}. Rekomendasi tindakan: jadwalkan batch kedua yang lebih kecil pada sore hari.`;
    } else {
      preventionAdvice = `Pertimbangkan untuk meninjau perencanaan produksi untuk ${topFood.toLowerCase()} selama operasional ${topSource.toLowerCase()} guna meminimalkan kelebihan makanan di hulu sebelum perlu diselamatkan.`;
    }
  } else {
    preventionTitle = `Recurrent surplus identified: ${topFood}`;
    if (sKeyNorm.includes('cater')) {
      preventionAdvice = `Catering events show a repeated surplus of ${topFood.toLowerCase()}. Recommended action: implement a 2-stage progressive pan refill buffer to prevent unserved batch excess.`;
    } else if (sKeyNorm.includes('rest')) {
      preventionAdvice = `Restaurant kitchen records show frequent ${topFood.toLowerCase()} surplus. Recommended action: calibrate prep-station par levels during off-peak shifts.`;
    } else if (sKeyNorm.includes('bake')) {
      preventionAdvice = `Bakery production shows regular ${topFood.toLowerCase()} surplus. Recommended action: schedule smaller progressive afternoon bake batches.`;
    } else {
      preventionAdvice = `Consider reviewing production planning for ${topFood.toLowerCase()} during ${topSource.toLowerCase()} operations to minimize upstream excess before rescue is required.`;
    }
  }

  return {
    hasData: true,
    topFood,
    topSource,
    topRoute,
    avgScore,
    prevention: {
      title: preventionTitle,
      advice: preventionAdvice,
      sourceContext: topSource,
      targetFood: topFood
    },
    rawStats: {
      foodCounts,
      sourceCounts,
      routeCounts
    }
  };
}

/**
 * Prevention Simulator Model
 * Calculates potential surplus reduction under controlled menu portioning scenarios.
 */
export function simulateSurplusReduction(plannedServings, averageSurplusPercent) {
  const currentSurplusServings = (plannedServings * (averageSurplusPercent / 100));
  
  // Scenarios:
  // Conservative improvement (-25% surplus reduction)
  // Moderate improvement (-45% surplus reduction)
  // Progressive shift batching (-65% surplus reduction)
  const conservativeReduction = currentSurplusServings * 0.25;
  const moderateReduction = currentSurplusServings * 0.45;
  const progressiveReduction = currentSurplusServings * 0.65;

  const kgSavedModerate = moderateReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG;
  const co2eSavedModerate = kgSavedModerate * METRIC_ASSUMPTIONS.CO2E_FACTOR_PER_KG;

  return {
    currentSurplusServings: Math.round(currentSurplusServings),
    estimatedWasteKg: Math.round(currentSurplusServings * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10,
    scenarios: {
      conservative: {
        servingsPrevented: Math.round(conservativeReduction),
        kgPrevented: Math.round(conservativeReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10,
        wasteAvoidedKg: Math.round(conservativeReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10
      },
      moderate: {
        servingsPrevented: Math.round(moderateReduction),
        kgPrevented: Math.round(kgSavedModerate * 10) / 10,
        wasteAvoidedKg: Math.round(kgSavedModerate * 10) / 10,
        co2eAvoidedKg: Math.round(co2eSavedModerate * 10) / 10
      },
      progressive: {
        servingsPrevented: Math.round(progressiveReduction),
        kgPrevented: Math.round(progressiveReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10,
        wasteAvoidedKg: Math.round(progressiveReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10
      },
      aggressive: {
        servingsPrevented: Math.round(progressiveReduction),
        kgPrevented: Math.round(progressiveReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10,
        wasteAvoidedKg: Math.round(progressiveReduction * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG * 10) / 10
      }
    }
  };
}
