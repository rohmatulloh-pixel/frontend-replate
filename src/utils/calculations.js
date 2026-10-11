/**
 * REPLATE Calculations & Impact Analytics
 * Aggregates local-first report datasets into transparent metrics and insights.
 */

import { METRIC_ASSUMPTIONS } from '../data/rules.js';

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
    // Standardize weight to kg
    const kg = rep.unit === 'portions' ? (rep.quantity * METRIC_ASSUMPTIONS.AVERAGE_SERVING_KG) : Number(rep.quantity) || 0;
    totalHandledKg += kg;

    if (rep.journeyStatus === 'RECEIVED') {
      if (rep.recommendedRoute === 'ORGANIC') {
        totalOrganicKg += kg;
      } else {
        totalRescuedKg += kg;
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
