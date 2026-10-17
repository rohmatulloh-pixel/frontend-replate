/**
 * REPLATE Destination Matching Engine
 * Ranks simulated destinations based on multi-factor compatibility.
 * 
 * Factors:
 * - Food Type Compatibility (30%)
 * - Route Compatibility (20%)
 * - Capacity Fit (15%)
 * - Time Compatibility (15%)
 * - Proximity / Distance (10%)
 * - Need Urgency (10%)
 * 
 * GATE INTEGRATION:
 * - If Food Safety Gate is REJECT: Excludes all human meal destinations (kitchens, shelters, food banks).
 *   Only certified organic/compost facilities are matched if organic diversion is viable.
 * - If Food Safety Gate is REVIEW: Flags destinations as locked pending inspection completion.
 * - Explicitly notes distances as simulated estimates rather than live GPS tracking.
 */

import { MATCHING_WEIGHTS } from '../data/rules.js';
import { DESTINATIONS } from '../data/destinations.js';
import { FOOD_TYPES } from '../data/foods.js';

export function matchDestinations({
  foodTypeId,
  quantity,
  unit = 'kg',
  recommendedRoute,
  timeWindowId,
  foodSafetyGate = null
}, lang = 'id') {
  const isId = lang === 'id';
  const foodType = FOOD_TYPES.find(f => f.id === foodTypeId) || FOOD_TYPES[0];
  const qtyInKg = unit === 'portions' ? quantity * 0.35 : Number(quantity) || 1;

  // Filter candidate destinations based on Food Safety Gate status
  let candidateDestinations = [...DESTINATIONS];

  if (foodSafetyGate && foodSafetyGate.status === 'REJECT') {
    const altRoute = foodSafetyGate.alternativeRouteRecommendation?.route;
    if (altRoute === 'SAFE_DISPOSAL') {
      // Hazardous or contaminated: no donation or composting partner eligible
      return [];
    }
    // Only organic recovery / composting facilities allowed
    candidateDestinations = candidateDestinations.filter(d => 
      d.preferredRoutes.includes('ORGANIC')
    );
  }

  const scoredList = candidateDestinations.map(dest => {
    // 1. Food Type Compatibility (0-100)
    let foodCompat = 40;
    if (dest.acceptedFoodTypes.includes(foodType.id)) {
      foodCompat = 100;
    } else if (dest.acceptedCategories.includes(foodType.category)) {
      foodCompat = 85;
    }

    // 2. Route Compatibility (0-100)
    let routeCompat = 30;
    if (dest.preferredRoutes.includes(recommendedRoute)) {
      routeCompat = 100;
    } else if (recommendedRoute === 'REDISTRIBUTE' && dest.preferredRoutes.includes('PROCESS')) {
      routeCompat = 70;
    } else if (recommendedRoute === 'ORGANIC' && dest.preferredRoutes.includes('ORGANIC')) {
      routeCompat = 100;
    }

    // 3. Capacity Fit (0-100)
    let capacityFit = 80;
    if (dest.currentAvailableCapacityKg >= qtyInKg) {
      capacityFit = 95;
    } else if (dest.currentAvailableCapacityKg >= qtyInKg * 0.5) {
      capacityFit = 65;
    } else {
      capacityFit = 30;
    }

    // 4. Time Window Compatibility (0-100)
    let timeCompat = 80;
    if (timeWindowId === 'under_1h') {
      timeCompat = dest.demoDistanceKm <= 3.5 ? 98 : 70;
    } else if (timeWindowId === '1_3h') {
      timeCompat = dest.demoDistanceKm <= 6.0 ? 94 : 80;
    } else {
      timeCompat = 90;
    }

    // 5. Distance Factor (0-100) - based on simulated benchmark distance
    const distanceScore = Math.max(30, Math.min(100, Math.round(100 - (dest.demoDistanceKm * 3.5))));

    // 6. Destination Need (0-100)
    const needScore = dest.needScore || 75;

    // Weighted Total Score
    const rawTotal = 
      (foodCompat * MATCHING_WEIGHTS.foodCompatibility) +
      (routeCompat * MATCHING_WEIGHTS.routeCompatibility) +
      (capacityFit * MATCHING_WEIGHTS.capacityFit) +
      (timeCompat * MATCHING_WEIGHTS.timeCompatibility) +
      (distanceScore * MATCHING_WEIGHTS.distance) +
      (needScore * MATCHING_WEIGHTS.destinationNeed);

    const matchScore = Math.min(100, Math.max(20, Math.round(rawTotal)));

    // Gate Lock State
    const isLockedForReview = Boolean(foodSafetyGate && foodSafetyGate.status === 'REVIEW');
    const isRestrictedToCompost = Boolean(foodSafetyGate && foodSafetyGate.status === 'REJECT');

    // Compatibility Checklist with honest simulated distance indicators
    const checklist = isId ? [
      { label: 'Kesesuaian jenis pangan', passed: foodCompat >= 80, detail: dest.acceptedFoodTypes.includes(foodType.id) ? 'Kecocokan langsung' : 'Kategori sesuai' },
      { label: 'Kesesuaian rute penanganan', passed: routeCompat >= 80, detail: `Mendukung rute ${recommendedRoute}` },
      { label: 'Kapasitas penerimaan', passed: capacityFit >= 80, detail: `Kapasitas intake ${dest.currentAvailableCapacityKg} kg` },
      { label: 'Kesesuaian jam intake', passed: timeCompat >= 80, detail: dest.operatingWindow },
      { label: 'Jarak & kedekatan (simulasi)', passed: distanceScore >= 70, detail: `${dest.demoDistanceKm} km (estimasi simulasi)` },
      { label: 'Tingkat urgensi kebutuhan', passed: needScore >= 75, detail: `Prioritas kebutuhan ${dest.urgencyNeed === 'high' ? 'TINGGI' : dest.urgencyNeed === 'medium' ? 'SEDANG' : 'STANDAR'}` }
    ] : [
      { label: 'Food compatibility', passed: foodCompat >= 80, detail: dest.acceptedFoodTypes.includes(foodType.id) ? 'Direct match' : 'Category fit' },
      { label: 'Route compatibility', passed: routeCompat >= 80, detail: `${recommendedRoute} supported` },
      { label: 'Capacity available', passed: capacityFit >= 80, detail: `${dest.currentAvailableCapacityKg} kg intake capacity` },
      { label: 'Time window match', passed: timeCompat >= 80, detail: dest.operatingWindow },
      { label: 'Distance estimate (simulated)', passed: distanceScore >= 70, detail: `${dest.demoDistanceKm} km (simulated benchmark)` },
      { label: 'Community urgency need', passed: needScore >= 75, detail: `${dest.urgencyNeed.toUpperCase()} need level` }
    ];

    // Explainable rationale
    const rationale = isId ? [
      dest.acceptedFoodTypes.includes(foodType.id) ? `Menerima langsung jenis ${foodType.name}` : `Menerima kategori ${foodType.category}`,
      `Kapasitas intake ${dest.currentAvailableCapacityKg} kg siap menampung ${qtyInKg.toFixed(1)} kg`,
      `Berjarak ~${dest.demoDistanceKm} km (estimasi simulasi) dengan jendela intake terbuka`,
      ...(isRestrictedToCompost ? ['Hanya untuk pengolahan organik kompos / bio-energi. Dilarang untuk makanan manusia.'] : [])
    ] : [
      dest.acceptedFoodTypes.includes(foodType.id) ? `Directly accepts ${foodType.name}` : `Accepts ${foodType.category} category`,
      `Intake capacity of ${dest.currentAvailableCapacityKg} kg easily handles ${qtyInKg.toFixed(1)} kg`,
      `Located ~${dest.demoDistanceKm} km away (simulated benchmark) with open intake operating window`,
      ...(isRestrictedToCompost ? ['Restricted to organic composting / bio-energy recovery only. Not for human food.'] : [])
    ];

    return {
      destination: dest,
      matchScore,
      checklist,
      rationale,
      isLockedForReview,
      isRestrictedToCompost,
      factors: {
        foodCompat,
        routeCompat,
        capacityFit,
        timeCompat,
        distanceScore,
        needScore
      }
    };
  });

  // Sort descending by matchScore
  return scoredList.sort((a, b) => b.matchScore - a.matchScore);
}
