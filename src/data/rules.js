/**
 * REPLATE Engine Rules & Decision Coefficients
 * 100% deterministic, explainable, and transparent mathematical parameters.
 */

export const RESCUE_SCORE_WEIGHTS = {
  condition: 0.30,
  urgency: 0.25,
  quantity: 0.15,
  distributionEase: 0.15,
  destinationCompatibility: 0.15
};

export const MATCHING_WEIGHTS = {
  foodCompatibility: 0.30,
  routeCompatibility: 0.20,
  capacityFit: 0.15,
  timeCompatibility: 0.15,
  distance: 0.10,
  destinationNeed: 0.10
};

export const PRIORITY_THRESHOLDS = {
  high: {
    min: 80,
    max: 100,
    label: 'HIGH PRIORITY',
    description: 'Strong immediate rescue feasibility. Rapid dispatch recommended.',
    colorClasses: 'text-forest-900 bg-forest-50 border-forest-600/30'
  },
  medium: {
    min: 60,
    max: 79,
    label: 'MEDIUM PRIORITY',
    description: 'Viable rescue opportunity within standard logistical windows.',
    colorClasses: 'text-terracotta-500 bg-terracotta-50 border-terracotta-400/30'
  },
  low: {
    min: 0,
    max: 59,
    label: 'LOW PRIORITY',
    description: 'Lower direct rescue window or material requires composting/bio-conversion route.',
    colorClasses: 'text-charcoal-600 bg-stone-100 border-stone-300'
  }
};

export const ROUTES = {
  REDISTRIBUTE: {
    id: 'REDISTRIBUTE',
    title: 'Direct Redistribution',
    tagline: 'Wholesome surplus routed immediately to community nourishment programs.',
    badgeColor: 'bg-forest-900 text-ivory-50',
    description: 'Suitable for food in fresh/wholesome condition that can be consumed within its safe temperature window.'
  },
  PROCESS: {
    id: 'PROCESS',
    title: 'Secondary Processing & Upcycling',
    tagline: 'Culinary transformation into shelf-stable sauces, soups, or preserved goods.',
    badgeColor: 'bg-sage-500 text-ivory-50',
    description: 'Applicable to wholesome ingredients requiring culinary intervention, baking, or preservation before use.'
  },
  ORGANIC: {
    id: 'ORGANIC',
    title: 'Organic Recovery & Composting',
    tagline: 'Nutrient return to soil through municipal or localized biological recovery.',
    badgeColor: 'bg-[#8C6843] text-ivory-50',
    description: 'For materials past safe culinary thresholds, preventing methane generation in landfills.'
  }
};

/**
 * Metric Assumptions & Methodologies
 * Clearly labeled to prevent pseudo-scientific claims.
 */
export const METRIC_ASSUMPTIONS = {
  AVERAGE_SERVING_KG: 0.35, // 350 grams per standard emergency food relief meal
  AVERAGE_SERVING_LABEL: 'Prototype assumption (350g/meal based on Global FoodBanking Network benchmark)',
  CO2E_FACTOR_PER_KG: 2.1,  // 2.1 kg CO2e prevented per 1 kg food waste diverted from landfill (EPA WFM benchmark)
  CO2E_LABEL: 'Estimated based on US EPA Waste Reduction Model (WARM) food diversion factor',
  WATER_LITERS_PER_KG: 250, // 250L water embodied per kg food (FAO Global Food Wastage Footprint avg estimate)
  WATER_LABEL: 'Estimated based on FAO Food Wastage Footprint global weighted average'
};

export const JOURNEY_STATUS_FLOW = [
  { id: 'REPORTED', label: 'Surplus Reported', order: 1, stepName: 'Intake' },
  { id: 'ASSESSED', label: 'Assessment Complete', order: 2, stepName: 'Score & Route' },
  { id: 'ROUTE_SELECTED', label: 'Route Confirmed', order: 3, stepName: 'Strategy' },
  { id: 'MATCHED', label: 'Destination Matched', order: 4, stepName: 'Allocation' },
  { id: 'RESCUE_INITIATED', label: 'Rescue In Transit', order: 5, stepName: 'Logistics' },
  { id: 'RECEIVED', label: 'Received & Rescued', order: 6, stepName: 'Impact Realized' }
];

/**
 * Economic Valuation Benchmarks (IDR per kg)
 * Conservative retail/market benchmark value by food category in Indonesia.
 * Used transparently to compute Offered Surplus Value and Recipient Cost Savings.
 */
export const CATEGORY_BENCHMARK_PRICE_IDR = {
  'cooked-rice': 25000,          // Rp 25.000 / kg (standard cooked staple food)
  'bread-pastries': 35000,       // Rp 35.000 / kg (bakery items)
  'prepared-meals': 32000,       // Rp 32.000 / kg (cooked dishes & banquet buffet)
  'fresh-vegetables': 20000,     // Rp 20.000 / kg (fresh produce)
  'fruits': 26000,               // Rp 26.000 / kg (fresh orchard & citrus)
  'packaged-dry-goods': 28000,   // Rp 28.000 / kg (grains, pantry goods)
  'dairy-beverages': 30000,      // Rp 30.000 / kg (dairy & wholesome beverages)
  'meat-poultry-fish': 55000,    // Rp 55.000 / kg (protein items)
  'other': 25000                 // Rp 25.000 / kg default conservative benchmark
};

/**
 * Operational Pipeline Groupings for Rescue Performance
 */
export const OPERATIONAL_STATUS_GROUPS = [
  {
    key: 'REPORTED',
    labelId: 'Menunggu Verifikasi & Penilaian',
    labelEn: 'Awaiting Assessment & Verification',
    statuses: ['REPORTED']
  },
  {
    key: 'ASSESSED',
    labelId: 'Menunggu Pemilihan Rute & Pencocokan',
    labelEn: 'Awaiting Route & Match',
    statuses: ['ASSESSED', 'ROUTE_SELECTED']
  },
  {
    key: 'MATCHED',
    labelId: 'Menunggu Penjemputan / Logistik',
    labelEn: 'Matched, Awaiting Logistics',
    statuses: ['MATCHED']
  },
  {
    key: 'IN_TRANSIT',
    labelId: 'Dalam Proses Pengantaran',
    labelEn: 'In Transit / Rescue in Progress',
    statuses: ['RESCUE_INITIATED']
  },
  {
    key: 'RECEIVED',
    labelId: 'Berhasil Disalurkan & Diterima',
    labelEn: 'Successfully Rescued & Received',
    statuses: ['RECEIVED']
  },
  {
    key: 'CANCELLED_EXPIRED',
    labelId: 'Dibatalkan / Jatuh Tempo',
    labelEn: 'Cancelled or Lapsed',
    statuses: ['CANCELLED', 'EXPIRED']
  }
];

