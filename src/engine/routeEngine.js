/**
 * REPLATE Route Engine
 * Deterministic, rule-based decision engine to assign the most appropriate route:
 * - REDISTRIBUTE (Direct human nourishment)
 * - PROCESS (Culinary transformation & upcycling)
 * - ORGANIC (Composting & biological energy recovery)
 * - SAFE_DISPOSAL (Controlled non-organic waste disposal)
 * 
 * STRICT COMPLIANCE:
 * The Route Engine MUST respect Food Safety Gate boundaries.
 * Under NO circumstances may a REJECT status be routed to REDISTRIBUTE or PROCESS.
 */

import { ROUTES } from '../data/rules.js';
import { FOOD_TYPES } from '../data/foods.js';
import { getFoodDisplayName } from '../utils/calculations.js';

const ROUTE_META_ID = {
  REDISTRIBUTE: {
    id: 'REDISTRIBUTE',
    title: 'Distribusi Langsung',
    tagline: 'Surplus pangan bernutrisi langsung disalurkan ke program santap komunitas.',
    badgeColor: 'bg-forest-900 text-ivory-50',
    description: 'Cocok untuk makanan dalam kondisi segar/layak yang dapat dikonsumsi dalam batas waktu amannya.'
  },
  PROCESS: {
    id: 'PROCESS',
    title: 'Pengolahan Kuliner Sekunder & Daur Ulang',
    tagline: 'Transformasi kuliner menjadi saus tahan lama, sup, kaldu, atau makanan olahan.',
    badgeColor: 'bg-sage-500 text-ivory-50',
    description: 'Berlaku untuk bahan makanan sehat yang membutuhkan pengolahan dapur, pemanggangan, atau pengawetan sebelum digunakan.'
  },
  ORGANIC: {
    id: 'ORGANIC',
    title: 'Daur Ulang Kompos & Bio-Energi',
    tagline: 'Pengalihan biologis menjadi kompos organik atau pemulihan energi hayati.',
    badgeColor: 'bg-charcoal-800 text-ivory-50',
    description: 'Diperuntukkan bagi sisa makanan yang tidak lagi layak dikonsumsi manusia untuk mencegah timbulan metana di TPA.'
  },
  SAFE_DISPOSAL: {
    id: 'SAFE_DISPOSAL',
    title: 'Pembuangan Terkendali Khusus',
    tagline: 'Penanganan limbah terkontaminasi atau berbahaya secara aman melalui sanitasi resmi.',
    badgeColor: 'bg-rose-900 text-ivory-50',
    description: 'Bahan pangan mengalami kontaminasi fisik, kimia, atau patogen berbahaya. Tidak boleh untuk konsumsi maupun kompos.'
  },
  PENDING_VERIFICATION: {
    id: 'PENDING_VERIFICATION',
    title: 'Rute Ditahan (Verifikasi Diperlukan)',
    tagline: 'Rekomendasi penyaluran konsumsi ditahan sementara hingga pemeriksaan keamanan pangan selesai.',
    badgeColor: 'bg-amber-700 text-ivory-50',
    description: 'Lengkapi data atau lakukan pemeriksaan fisik di lokasi untuk membuka rute konsumsi.'
  }
};

export function determineRoute({
  foodTypeId,
  conditionId,
  timeWindowId,
  foodSafetyGate = null
}, lang = 'id') {
  const isId = lang === 'id';
  const foodType = FOOD_TYPES.find(f => f.id === foodTypeId) || FOOD_TYPES[FOOD_TYPES.length - 1];
  const fName = getFoodDisplayName(foodType.id, foodType.name, lang);

  // ==========================================================
  // GATE BOUNDARY 1: FOOD SAFETY GATE REJECT
  // Completely blocks human consumption (REDISTRIBUTE / PROCESS)
  // ==========================================================
  if (foodSafetyGate && foodSafetyGate.status === 'REJECT') {
    const altRoute = foodSafetyGate.alternativeRouteRecommendation?.route || 'ORGANIC';
    const isSafeDisposal = altRoute === 'SAFE_DISPOSAL';

    const whyPoints = [
      isId
        ? 'DITOLAK OLEH FOOD SAFETY GATE: Makanan tidak memenuhi syarat keamanan pangan untuk konsumsi manusia.'
        : 'REJECTED BY FOOD SAFETY GATE: Food fails minimum human consumption safety thresholds.',
      ...(foodSafetyGate.reasons || [])
    ];

    if (isSafeDisposal) {
      whyPoints.push(
        isId
          ? 'Potensi bahaya cemaran fisik/kimia/botulisme mengharuskan pembuangan khusus (dilarang dicampur kompos).'
          : 'Hazardous physical/chemical/botulism risk mandates controlled sanitation disposal (do not compost).'
      );
      const meta = isId ? ROUTE_META_ID.SAFE_DISPOSAL : {
        id: 'SAFE_DISPOSAL',
        title: 'Controlled Safe Disposal',
        tagline: 'Hazardous or chemically compromised waste disposal through sanitary services.',
        badgeColor: 'bg-rose-900 text-ivory-50',
        description: 'Physical/chemical contamination detected. Unfit for human consumption or open composting.'
      };

      return {
        route: 'SAFE_DISPOSAL',
        routeMeta: meta,
        why: whyPoints,
        safetyNotice: isId
          ? 'DILARANG UNTUK KONSUMSI MANUSIA & KOMPOS TERBUKA. Buang secara aman melalui pembuangan sampah berlabel.'
          : 'PROHIBITED FROM HUMAN CONSUMPTION & OPEN COMPOST. Dispose safely via municipal sanitation.'
      };
    }

    whyPoints.push(
      isId
        ? 'Pengalihan terbatas hanya pada pengomposan aerobik atau fasilitas bio-energi berizin untuk mencegah emisi gas metana.'
        : 'Restricted diversion to certified aerobic composting or bio-energy facilities to avert landfill methane emissions.'
    );

    const meta = isId ? ROUTE_META_ID.ORGANIC : ROUTES.ORGANIC;
    return {
      route: 'ORGANIC',
      routeMeta: meta,
      why: whyPoints,
      safetyNotice: isId
        ? 'BAHAN DITANDAI KHUSUS PEMULIHAN BIOLOGIS/KOMPOS. Dilarang keras disalurkan sebagai makanan konsumsi manusia!'
        : 'MATERIAL RESTRICTED TO BIOLOGICAL ORGANIC RECOVERY. Strictly prohibited for human consumption!'
    };
  }

  // ==========================================================
  // GATE BOUNDARY 2: FOOD SAFETY GATE REVIEW
  // Holds consumption routing pending completion of data
  // ==========================================================
  if (foodSafetyGate && foodSafetyGate.status === 'REVIEW') {
    const whyPoints = [
      isId
        ? 'STATUS FOOD SAFETY GATE: REVIEW (Pemeriksaan Lanjutan Diperlukan).'
        : 'FOOD SAFETY GATE STATUS: REVIEW (Further Inspection Required).',
      ...(foodSafetyGate.reasons || []),
      isId
        ? 'Rekomendasi penyaluran konsumsi ditahan demi perlindungan kesehatan masyarakat.'
        : 'Human consumption routing is held to protect community public health.'
    ];

    const meta = isId ? ROUTE_META_ID.PENDING_VERIFICATION : {
      id: 'PENDING_VERIFICATION',
      title: 'Route Held (Pending Verification)',
      tagline: 'Human consumption routing held until critical safety parameters are verified.',
      badgeColor: 'bg-amber-700 text-ivory-50',
      description: 'Complete missing storage or condition information to evaluate consumption eligibility.'
    };

    return {
      route: 'PENDING_VERIFICATION',
      routeMeta: meta,
      why: whyPoints,
      safetyNotice: isId
        ? 'Pemeriksaan keamanan pangan belum lengkap. Lengkapi data atau lakukan verifikasi fisik sebelum membuka rute konsumsi.'
        : 'Food safety screening incomplete. Complete data or conduct physical verification before dispatch.'
    };
  }

  // ==========================================================
  // STANDARD DETERMINISTIC ROUTE EVALUATION (FOR GATE PASS)
  // ==========================================================
  let selectedRoute = ROUTES.REDISTRIBUTE;
  const whyPoints = [];

  // Deterministic Safety Gate: If legacy condition is Not Suitable
  if (conditionId === 'not_suitable') {
    selectedRoute = ROUTES.ORGANIC;
    if (isId) {
      whyPoints.push('Kondisi makanan telah melewati standar kelayakan konsumsi langsung.');
      whyPoints.push('Pengalihan ke pengomposan aerobik atau bio-energi mencegah pembentukan gas metana TPA.');
      whyPoints.push('Menjaga kesehatan komunitas dengan menerapkan protokol keamanan pangan yang ketat.');
    } else {
      whyPoints.push('Reported condition is past direct edible redistribution standards.');
      whyPoints.push('Directing to aerobic composting or bio-energy avoids landfill methane generation.');
      whyPoints.push('Protects recipient community health by observing strict food safety protocols.');
    }
    
    const meta = isId ? ROUTE_META_ID.ORGANIC : selectedRoute;
    return {
      route: selectedRoute.id,
      routeMeta: meta,
      why: whyPoints,
      safetyNotice: isId
        ? 'Bahan ditandai untuk pemulihan organik. Tidak untuk dikonsumsi manusia.'
        : 'Material flagged for organic recovery. Do not offer for human consumption.'
    };
  }

  // Deterministic Rule 2: Near end of usable window + perishable produce / bakery
  if (conditionId === 'near_window') {
    if (foodType.category === 'produce' || foodType.category === 'bakery') {
      selectedRoute = ROUTES.PROCESS;
      if (isId) {
        whyPoints.push(`Kategori bahan pangan (${fName}) sangat ideal untuk transformasi kuliner.`);
        whyPoints.push('Pengolahan ulang menjadi kaldu, puree, saus, atau crouton memperpanjang masa simpan 3–14 hari.');
        whyPoints.push('Menghindari kendala batas waktu mendesak dari pengiriman makanan siap santap langsung.');
      } else {
        whyPoints.push(`Ingredient category (${foodType.name}) is prime for culinary transformation.`);
        whyPoints.push('Upcycling into broths, purées, sauces, or croutons extends shelf-life by 3–14 days.');
        whyPoints.push('Avoids urgency bottleneck of direct hot-meal transport.');
      }
    } else {
      // Prepared food near end of window with very tight time
      if (timeWindowId === 'under_1h') {
        selectedRoute = ROUTES.REDISTRIBUTE;
        if (isId) {
          whyPoints.push('Batas waktu sangat mendesak: langsung kirim ke dapur umum terdekat sebelum waktu aman berakhir.');
          whyPoints.push('Makanan dilaporkan masih layak konsumsi jika disajikan dengan segera.');
        } else {
          whyPoints.push('Critical immediate window: direct drop-off at nearest soup kitchen before window lapses.');
          whyPoints.push('Food is still reported as suitable for consumption if served promptly.');
        }
      } else {
        selectedRoute = ROUTES.PROCESS;
        if (isId) {
          whyPoints.push('Pengolahan sekunder direkomendasikan untuk mengawetkan surplus makanan sebelum batas waktu konsumsi berakhir.');
        } else {
          whyPoints.push('Secondary culinary processing recommended to preserve surplus before consumption window closes.');
        }
      }
    }
  } else {
    // Fresh / suitable condition
    if (foodType.category === 'produce') {
      selectedRoute = ROUTES.REDISTRIBUTE;
      if (isId) {
        whyPoints.push('Kondisi prima dan bernutrisi tinggi untuk penerima manfaat komunitas.');
        whyPoints.push('Mudah didistribusikan ke dapur umum atau pantry keluarga rentan.');
      } else {
        whyPoints.push('Prime wholesome condition with intact nutritional density.');
        whyPoints.push('Easily distributed to community pantries or vulnerable families.');
      }
    } else if (foodType.category === 'packaged') {
      selectedRoute = ROUTES.REDISTRIBUTE;
      if (isId) {
        whyPoints.push('Produk kemasan stabil dengan masa simpan panjang.');
        whyPoints.push('Pilihan ideal untuk cadangan logistik bank makanan.');
      } else {
        whyPoints.push('Stable shelf-stable groceries with extended shelf-life.');
        whyPoints.push('Ideal foundation for food bank pantry reserves.');
      }
    } else {
      selectedRoute = ROUTES.REDISTRIBUTE;
      if (isId) {
        whyPoints.push('Kualitas makanan siap saji memenuhi standar higienitas untuk redistribusi cepat.');
        whyPoints.push('Penyaluran segera memaksimalkan nilai konsumsi selagi nutrisi terjaga.');
      } else {
        whyPoints.push('Wholesome prepared food quality meeting rapid redistribution criteria.');
        whyPoints.push('Immediate dispatch maximizes meal value while freshness is peak.');
      }
    }
  }

  const meta = isId ? ROUTE_META_ID[selectedRoute.id] : selectedRoute;

  return {
    route: selectedRoute.id,
    routeMeta: meta,
    why: whyPoints,
    safetyNotice: isId
      ? 'Makanan memenuhi kriteria pemeriksaan awal untuk rute yang direkomendasikan.'
      : 'Food meets initial screening criteria for the recommended route.'
  };
}
