/**
 * REPLATE Food Safety Gate Engine
 * 
 * Gatekeeper logic prior to human consumption routing.
 * Grounded in principles from:
 * - World Health Organization (WHO) 5 Keys to Safer Food & Food Safety Fact Sheets
 * - Kementerian Kesehatan RI (Permenkes Higiene Sanitasi Jasaboga & Standar Sanitasi)
 * - Badan Pengawas Obat dan Makanan (BPOM RI) Prinsip Cek KLIK & Keamanan PJAS
 * 
 * IMPORTANT DISCLAIMER:
 * This tool performs initial rule-based screening based SOLELY on user-reported parameters.
 * It is NOT an official food safety certification, NOT a substitute for on-site inspection
 * by competent health inspectors, and status PASS must NEVER be construed as an absolute safety guarantee.
 */

import { FOOD_TYPES } from '../data/foods.js';

export const FOOD_SAFETY_RULE_VERSION = '1.0';

export const OFFICIAL_SAFETY_SOURCES = [
  {
    id: 'who-food-safety',
    title: 'Food Safety Fact Sheet & 5 Keys to Safer Food',
    publisher: 'World Health Organization (WHO)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/food-safety',
    principles: [
      'Pencegahan bahaya biologis (patogen bakteri seperti Salmonella, E. coli, B. cereus), kimia, dan fisik.',
      'Suhu aman: jaga makanan panas di atas 60°C atau dingin di bawah 5°C; hindari "Danger Zone" (5°C–60°C).',
      'Pemisahan ketat pangan mentah dan pangan siap santap sepanjang rantai distribusi.'
    ],
    principlesEn: [
      'Prevention of biological hazards (Salmonella, E. coli, B. cereus, Listeria), chemical, and physical hazards.',
      'Safe temperatures: hold hot food >60°C or chilled <5°C; avoid temperature danger zone (5°C–60°C).',
      'Strict separation of raw and cooked ready-to-eat foods throughout custody.'
    ]
  },
  {
    id: 'who-summer-advice',
    title: 'Public Health Advice on Food Safety',
    publisher: 'World Health Organization (WHO)',
    url: 'https://www.who.int/news-room/fact-sheets/item/public-health-advice-on-food-safety-during-summer',
    principles: [
      'Proliferasi bakteri terjadi sangat cepat pada suhu ruang dalam hitungan jam.',
      'Makanan matang yang disimpan di suhu ruang lebih dari 2 jam memiliki risiko perkembangbiakan mikroba patogen.'
    ],
    principlesEn: [
      'Bacterial proliferation accelerates exponentially at ambient room temperatures within hours.',
      'Cooked food kept at room temperature for over 2 hours presents elevated microbial risks.'
    ]
  },
  {
    id: 'kemenkes-jasaboga',
    title: 'Pedoman Higiene Sanitasi Pangan Siap Saji',
    publisher: 'Kementerian Kesehatan Republik Indonesia',
    url: 'https://kemkes.go.id/',
    jdihUrl: 'https://jdih.kemkes.go.id/',
    principles: [
      'Higiene penjamah makanan dan sanitasi wadah pengangkut makanan siap santap.',
      'Penyajian makanan matang tidak boleh melampaui batas waktu aman konsumsi (maksimal 4 jam di suhu ruang terbuka).',
      'Pengangkutan makanan wajib menggunakan wadah tertutup yang kedap debu dan serangga.'
    ],
    principlesEn: [
      'Food handler hygiene and sanitation of transport containment for ready-to-eat meals.',
      'Cooked food service must not exceed safe consumption window (maximum 4 hours at open ambient temperature).',
      'Food transport must utilize sealed, food-grade containers protected against dust and pests.'
    ]
  },
  {
    id: 'bpom-pjas-klik',
    title: 'Prinsip Keamanan Pangan & Pedoman Cek KLIK',
    publisher: 'Badan Pengawas Obat dan Makanan (BPOM RI)',
    url: 'https://www.pom.go.id/berita/keamanan-pangan-jajanan-anak-sekolah-%28pjas%29',
    principles: [
      'Prinsip Cek KLIK: Kemasan utuh, Label terbaca, Izin edar resmi, dan Kedaluwarsa belum terlampaui.',
      'Pangan dengan tanda kerusakan organoleptik (lendir, bau asam/tengik, perubahan warna, jamur) mutlak dilarang dikonsumsi.',
      'Kaleng kembung atau penyok parah mengindikasikan risiko kontaminasi anaerobik berbahaya.'
    ],
    principlesEn: [
      'Cek KLIK Principle: Packaging intact, Label readable, Permit verified, and Expiry date unexpired.',
      'Food showing organoleptic spoilage (slime, sour/rancid odor, mold) is strictly prohibited from consumption.',
      'Bulging or heavily dented cans indicate high anaerobic contamination risk.'
    ]
  }
];

/**
 * Main Food Safety Gate Evaluation Function
 * 
 * Rules priority: REJECT > REVIEW > PASS
 * Status PASS requires all criteria met and zero risk triggers.
 */
export function evaluateFoodSafetyGate(surplusReport = {}, lang = 'id') {
  const {
    foodTypeId = 'cooked-rice',
    conditionId = 'suitable',
    safetyConditionId = null,
    storageHistoryId = null,
    storageTempId = null,
    preparedAt = null,
    storageDurationHours = null,
    expiryDate = null,
    timeWindowId = '1_3h',
    packagingConditionId = null,
    handlingIntegrityId = null,
    sourceContextId = 'Catering'
  } = surplusReport;

  const isId = lang === 'id';
  const foodType = FOOD_TYPES.find(f => f.id === foodTypeId) || FOOD_TYPES[0];
  const category = foodType.category || 'prepared';

  // Resolved values (mapping legacy condition if safety parameters not yet explicitly set)
  const resolvedCondition = safetyConditionId || (
    conditionId === 'fresh_excellent' ? 'no_visible_damage' :
    conditionId === 'suitable' ? 'no_visible_damage' :
    conditionId === 'near_window' ? 'altered_needs_check' :
    conditionId === 'not_suitable' ? 'clear_spoilage' : 'not_checked'
  );

  const resolvedStorage = storageHistoryId || 'known_compliant';
  const resolvedPackaging = packagingConditionId || (
    category === 'produce' ? 'not_applicable_fresh' : 'intact_proper'
  );
  const resolvedHandling = handlingIntegrityId || 'hygienic_separated';
  const resolvedTemp = storageTempId || (
    category === 'prepared' || category === 'meat_fish' ? 'hot_holding_above_60' :
    category === 'dairy' ? 'cold_holding_below_4' : 'ambient_room_temp'
  );

  const rejectReasons = [];
  const reviewReasons = [];
  const missingInformation = [];
  const checkedParameters = {};

  // ==========================================
  // PARAMETER 1: FOOD TYPE & CATEGORY SPECIFIC CONTEXT
  // ==========================================
  checkedParameters.foodType = {
    id: foodType.id,
    name: foodType.name,
    category: category,
    status: 'pass',
    note: isId
      ? `Kategori ${category.toUpperCase()}: parameter evaluasi disesuaikan spesifik.`
      : `Category ${category.toUpperCase()}: category-specific safety checks applied.`
  };

  // ==========================================
  // PARAMETER 4 (PRE-CHECK): TIMING & DATES VALIDATION
  // Validate illogical timestamps before checking other rules
  // ==========================================
  let timingStatus = 'pass';
  let timingNote = isId ? 'Waktu penyiapan dan batas aman valid.' : 'Preparation & safe window valid.';

  const now = new Date();

  // 4a. Check Expiration / Use-by Date
  if (expiryDate) {
    const exp = new Date(expiryDate);
    // Set to end of expiry day
    exp.setHours(23, 59, 59, 999);
    if (exp.getTime() < now.getTime()) {
      rejectReasons.push(
        isId
          ? `Produk telah melewati batas tanggal kedaluwarsa (${expiryDate}). Melanggar prinsip BPOM Cek KLIK & tidak boleh disalurkan untuk konsumsi.`
          : `Product has passed its expiration / use-by date (${expiryDate}). Violates BPOM safety standards; prohibited from human consumption.`
      );
      timingStatus = 'reject';
    }
  }

  // 4b. Check Illogical Future Preparation Date
  if (preparedAt) {
    const prep = new Date(preparedAt);
    const fifteenMinutesInFuture = new Date(now.getTime() + 15 * 60 * 1000);
    if (prep.getTime() > fifteenMinutesInFuture.getTime()) {
      reviewReasons.push(
        isId
          ? 'Waktu penyiapan yang dimasukkan berada di masa depan (tidak logis). Periksa kembali tanggal & jam penyiapan.'
          : 'Preparation timestamp is set in the future (illogical). Please verify prep date and time.'
      );
      missingInformation.push(isId ? 'Koreksi tanggal/jam penyiapan' : 'Correct preparation datetime');
      if (timingStatus !== 'reject') timingStatus = 'review';
    }
  }

  // 4c. Check Storage Duration
  if (storageDurationHours !== null && storageDurationHours !== undefined && storageDurationHours !== '') {
    const dur = Number(storageDurationHours);
    if (isNaN(dur) || dur < 0) {
      reviewReasons.push(
        isId
          ? 'Lama penyimpanan tidak valid (angka negatif). Masukkan durasi jam yang benar.'
          : 'Invalid storage duration (negative number). Enter valid hours.'
      );
      missingInformation.push(isId ? 'Durasi penyimpanan valid' : 'Valid storage duration');
      if (timingStatus !== 'reject') timingStatus = 'review';
    } else {
      // Per Kemenkes & WHO: High-protein cooked food or meat held at room temp for > 4 hours
      if ((category === 'prepared' || category === 'meat_fish') && resolvedTemp === 'uncontrolled_fluctuating' && dur > 4) {
        rejectReasons.push(
          isId
            ? `Makanan matang/daging telah berada di suhu ruang selama ${dur} jam (>4 jam batas aman Kemenkes/WHO). Risiko proliferasi toksin bakteri tinggi.`
            : `Cooked food/meat held at ambient danger zone for ${dur} hours (>4-hour WHO/Kemenkes threshold). High bacterial toxin proliferation risk.`
        );
        timingStatus = 'reject';
      }
    }
  }

  // 4d. Immediate Urgency Check without clear timing
  if (timeWindowId === 'under_1h' && resolvedCondition === 'altered_needs_check') {
    reviewReasons.push(
      isId
        ? 'Sisa waktu aman kurang dari 1 jam dengan kondisi makanan memerlukan pemeriksaan. Verifikasi fisik diperlukan segera sebelum pengiriman.'
        : 'Safe window under 1 hour with altered food condition. On-site physical check required before dispatch.'
    );
    if (timingStatus !== 'reject') timingStatus = 'review';
  }

  checkedParameters.timing = {
    preparedAt,
    storageDurationHours,
    expiryDate,
    timeWindowId,
    status: timingStatus,
    note: timingNote
  };

  // ==========================================
  // PARAMETER 2: FOOD CONDITION (Visual & Sensory)
  // ==========================================
  let conditionStatus = 'pass';
  if (resolvedCondition === 'clear_spoilage') {
    rejectReasons.push(
      isId
        ? 'Ditemukan tanda kerusakan atau pembusukan yang jelas (lendir, bau tidak sedap, jamur, atau perubahan tekstur abnormal). Dilarang untuk konsumsi manusia (Ref: BPOM & WHO).'
        : 'Clear signs of spoilage or decay detected (slime, sour/putrid odor, mold, abnormal texture). Human consumption prohibited (Ref: BPOM & WHO).'
    );
    conditionStatus = 'reject';
  } else if (resolvedCondition === 'altered_needs_check') {
    reviewReasons.push(
      isId
        ? 'Kondisi makanan mengalami perubahan fisik yang memerlukan pemeriksaan sensoris lanjutan oleh staf dapur sebelum dapat direkomendasikan.'
        : 'Food condition shows physical alteration requiring secondary sensory inspection by kitchen staff before recommendation.'
    );
    missingInformation.push(isId ? 'Konfirmasi hasil pemeriksaan sensoris' : 'Secondary sensory inspection confirmation');
    conditionStatus = 'review';
  } else if (resolvedCondition === 'not_checked') {
    reviewReasons.push(
      isId
        ? 'Kondisi fisik makanan belum diperiksa secara visual. Pemeriksaan fisik wajib dilakukan untuk memastikan kelayakan konsumsi.'
        : 'Food physical condition has not been visually inspected. Physical verification is required before recommendation.'
    );
    missingInformation.push(isId ? 'Pemeriksaan visual fisik makanan' : 'Visual physical inspection');
    conditionStatus = 'review';
  }

  checkedParameters.condition = {
    value: resolvedCondition,
    status: conditionStatus,
    note: isId
      ? (conditionStatus === 'pass' ? 'Tidak ada tanda kerusakan kasat mata.' : 'Memerlukan perhatian keamanan.')
      : (conditionStatus === 'pass' ? 'No visible signs of decay.' : 'Requires safety attention.')
  };

  // ==========================================
  // PARAMETER 3: STORAGE HISTORY & TEMPERATURE
  // ==========================================
  let storageStatus = 'pass';
  if (resolvedStorage === 'suspected_non_compliant') {
    rejectReasons.push(
      isId
        ? 'Riwayat penyimpanan diduga tidak sesuai persyaratan keamanan pangan (terpapar bahaya suhu atau rantai dingin terputus). Risiko mikrobiologis tidak dapat ditoleransi (Ref: WHO).'
        : 'Suspected improper holding storage (thermal abuse or broken cold chain). Microbial safety compromised (Ref: WHO).'
    );
    storageStatus = 'reject';
  } else if (resolvedStorage === 'unknown') {
    reviewReasons.push(
      isId
        ? 'Riwayat suhu dan cara penyimpanan makanan tidak diketahui. Makanan sensitif suhu tidak boleh dianggap aman tanpa kepastian riwayat penyimpanan.'
        : 'Storage temperature history is unknown. Perishable items cannot be presumed safe without verified holding history.'
    );
    missingInformation.push(isId ? 'Informasi riwayat suhu penyimpanan' : 'Storage holding temperature records');
    storageStatus = 'review';
  } else if (resolvedStorage === 'not_checked') {
    reviewReasons.push(
      isId
        ? 'Status penyimpanan belum diperiksa. Perlu memastikan metode penyimpanan yang telah diterapkan.'
        : 'Storage status unchecked. Storage holding verification required.'
    );
    missingInformation.push(isId ? 'Verifikasi riwayat penyimpanan' : 'Storage history verification');
    storageStatus = 'review';
  }

  // Category-specific thermal checks
  if (category === 'prepared' || category === 'meat_fish') {
    if (resolvedTemp === 'uncontrolled_fluctuating' && storageStatus !== 'reject') {
      reviewReasons.push(
        isId
          ? 'Makanan matang / daging disimpan pada suhu yang tidak terkontrol (Danger Zone 5°C–60°C). Diperlukan konfirmasi batas waktu penyimpanan.'
          : 'Prepared meal / meat held at uncontrolled temperature (Danger Zone 5°C–60°C). Holding duration verification required.'
      );
      if (storageStatus === 'pass') storageStatus = 'review';
    } else if (resolvedTemp === 'unknown' && storageStatus === 'pass') {
      reviewReasons.push(
        isId
          ? 'Informasi suhu penyimpanan makanan matang / daging tidak diketahui. Wajib diketahui untuk mencegah pertumbuhan spora patogen.'
          : 'Storage holding temperature unknown for prepared food / meat. Required to prevent pathogen growth.'
      );
      storageStatus = 'review';
      missingInformation.push(isId ? 'Suhu penyimpanan aktual' : 'Actual storage temperature');
    }
  } else if (category === 'dairy') {
    if (resolvedTemp !== 'cold_holding_below_4' && storageStatus !== 'reject') {
      reviewReasons.push(
        isId
          ? 'Produk susu dan olahan dingin memerlukan rantai dingin konsisten (<4°C). Suhu saat ini perlu diverifikasi.'
          : 'Dairy and chilled items require continuous cold chain (<4°C). Current holding temperature requires verification.'
      );
      if (storageStatus === 'pass') storageStatus = 'review';
      missingInformation.push(isId ? 'Verifikasi rantai dingin susu (<4°C)' : 'Dairy cold chain verification (<4°C)');
    }
  }

  checkedParameters.storageHistory = {
    value: resolvedStorage,
    tempCondition: resolvedTemp,
    status: storageStatus,
    note: isId
      ? (storageStatus === 'pass' ? 'Riwayat penyimpanan memenuhi standar.' : 'Riwayat suhu memerlukan klarifikasi.')
      : (storageStatus === 'pass' ? 'Storage history complies with standards.' : 'Thermal history requires clarification.')
  };

  // ==========================================
  // PARAMETER 5: PACKAGING & CONTAMINATION
  // ==========================================
  let packagingStatus = 'pass';
  if (resolvedPackaging === 'damaged_leaking_contaminated') {
    rejectReasons.push(
      isId
        ? 'Wadah atau kemasan rusak, bocor, kaleng kembung/penyok parah, atau terpapar cemaran langsung. Bahaya kontaminasi bakteri/kimia (Ref: BPOM Cek KLIK).'
        : 'Packaging damaged, leaking, swollen/dented can, or directly contaminated. Bacterial/chemical hazard (Ref: BPOM Cek KLIK).'
    );
    packagingStatus = 'reject';
  } else if (resolvedPackaging === 'not_checked') {
    reviewReasons.push(
      isId
        ? 'Integritas kemasan atau wadah makanan belum diperiksa.'
        : 'Packaging or container integrity has not been inspected.'
    );
    missingInformation.push(isId ? 'Pemeriksaan integritas wadah/kemasan' : 'Container/packaging inspection');
    packagingStatus = 'review';
  }

  checkedParameters.packaging = {
    value: resolvedPackaging,
    status: packagingStatus,
    note: isId
      ? (packagingStatus === 'pass' ? 'Kemasan utuh dan terlindung dari cemaran.' : 'Integritas kemasan bermasalah.')
      : (packagingStatus === 'pass' ? 'Packaging intact and protected.' : 'Packaging integrity issue.')
  };

  // ==========================================
  // PARAMETER 6: HANDLING & SOURCE INTEGRITY
  // ==========================================
  let handlingStatus = 'pass';
  if (resolvedHandling === 'potential_cross_contamination') {
    reviewReasons.push(
      isId
        ? 'Terdapat potensi kontaminasi silang (misal kontak alat dengan bahan mentah atau penjamah makanan belum terverifikasi). Memerlukan inspeksi ulang sebelum konsumsi (Ref: Kemenkes & WHO).'
        : 'Potential cross-contamination identified (shared contact with raw goods or unverified handlers). Secondary check required (Ref: Kemenkes & WHO).'
    );
    missingInformation.push(isId ? 'Verifikasi pemisahan dari bahan mentah' : 'Raw/cooked separation verification');
    handlingStatus = 'review';
  } else if (resolvedHandling === 'unknown') {
    reviewReasons.push(
      isId
        ? 'Riwayat kebersihan penanganan makanan tidak diketahui. Informasi tidak diketahui tidak boleh diperlakukan otomatis sebagai aman.'
        : 'Food handling history is undocumented. Unknown handling cannot be assumed safe.'
    );
    missingInformation.push(isId ? 'Informasi penanganan pangan' : 'Food handling information');
    handlingStatus = 'review';
  }

  checkedParameters.handlingSource = {
    value: resolvedHandling,
    sourceContextId,
    status: handlingStatus,
    note: isId
      ? (handlingStatus === 'pass' ? 'Penanganan higienis dan terpisah dari bahan mentah.' : 'Perlu klarifikasi higienitas.')
      : (handlingStatus === 'pass' ? 'Hygienic handling and raw separation verified.' : 'Hygiene clarification required.')
  };

  // ==========================================
  // DETERMINISTIC STATUS SYNTHESIS
  // Strict Hierarchy: REJECT > REVIEW > PASS
  // ==========================================
  let finalStatus = 'PASS';
  let eligibleForConsumption = true;
  let headline = '';
  let summary = '';

  if (rejectReasons.length > 0) {
    finalStatus = 'REJECT';
    eligibleForConsumption = false;
    headline = isId
      ? 'TIDAK LAYAK UNTUK DIREKOMENDASIKAN KONSUMSI MANUSIA'
      : 'NOT ELIGIBLE FOR HUMAN CONSUMPTION RECOMMENDATION';
    summary = isId
      ? 'Berdasarkan parameter yang dilaporkan, makanan ini melanggar kriteria keamanan pangan dasar dan berisiko membahayakan kesehatan penerima manfaat. Makanan TIDAK BOLEH disalurkan untuk konsumsi manusia.'
      : 'Based on reported parameters, this surplus breaches essential food safety criteria and presents health risks. Food MUST NOT be distributed for human consumption.';
  } else if (reviewReasons.length > 0 || missingInformation.length > 0) {
    finalStatus = 'REVIEW';
    eligibleForConsumption = false; // Hold consumption recommendation
    headline = isId
      ? 'MEMERLUKAN PEMERIKSAAN & VERIFIKASI LANJUTAN'
      : 'FURTHER SAFETY VERIFICATION REQUIRED';
    summary = isId
      ? 'Rekomendasi penyaluran untuk konsumsi DITAHAN sementara karena terdapat informasi penting yang belum lengkap atau membutuhkan verifikasi langsung di lokasi.'
      : 'Human consumption recommendations are HELD PENDING verification because critical safety data is missing or requires on-site inspection.';
  } else {
    finalStatus = 'PASS';
    eligibleForConsumption = true;
    headline = isId
      ? 'LOLOS PEMERIKSAAN AWAL KEAMANAN PANGAN'
      : 'PASSED INITIAL FOOD SAFETY SCREENING';
    summary = isId
      ? 'Berdasarkan informasi yang dimasukkan pengguna, tidak ditemukan indikator bahaya yang melanggar aturan keamanan pangan dasar. Makanan memenuhi syarat untuk dilanjutkan ke penilaian prioritas Rescue Score. (Catatan: ini bukan sertifikasi keamanan pangan resmi).'
      : 'Based on user-provided information, no violation indicators were detected against baseline safety rules. Eligible to proceed to Rescue Score prioritization. (Note: this is not an official food safety certification).';
  }

  // ==========================================
  // ALTERNATIVE ROUTE EVALUATION (FOR REJECT)
  // Evaluated independently — never automatic composting for all rejects!
  // ==========================================
  let alternativeRouteRecommendation = null;

  if (finalStatus === 'REJECT') {
    // Check if the rejection reason is biological organic spoilage vs hazardous chemical/toxic/foreign contaminant
    const hasChemicalOrGlassHazard = resolvedPackaging === 'damaged_leaking_contaminated' && (
      category === 'packaged' // Dented/bulging cans -> botulism hazard / chemical leaching
    );

    if (hasChemicalOrGlassHazard) {
      alternativeRouteRecommendation = {
        route: 'SAFE_DISPOSAL',
        title: isId ? 'Pembuangan Terkendali Khusus (Bukan Kompos)' : 'Safe Controlled Disposal (Not for Compost)',
        description: isId
          ? 'Kemasan berisiko toksin bakteri anaerobik (botulisme) atau pecahan kaca/kaleng. Jangan dimasukkan ke dalam pakan ternak atau tumpukan kompos terbuka.'
          : 'High anaerobic toxin (botulism) or physical glass/metal hazard. Do not mix into open composting or animal feed.',
        safeHandlingInstructions: isId
          ? 'Kemas ganda dalam kantong limbah tertutup rapat, beri label limbah non-konsumsi, dan buang melalui pengolahan limbah kota yang aman.'
          : 'Double-bag in heavy-duty sealed waste liner, label as non-consumable waste, and dispose via municipal sanitation.'
      };
    } else {
      // Biological spoilage of organic matter (e.g. stale rice, spoiled fruit/vegetables)
      alternativeRouteRecommendation = {
        route: 'ORGANIC',
        title: isId ? 'Pengalihan Biologis: Daur Ulang Kompos / Bio-Energi' : 'Organic Recovery: Aerobic Composting / Bio-Energy',
        description: isId
          ? 'Bahan organik nabati atau sisa makanan yang rusak secara biologis masih dapat dialihkan ke fasilitas pengomposan industri atau reaktor biogas guna mencegah timbulan gas metana.'
          : 'Biologically spoiled organic matter can be diverted to industrial composting or anaerobic digestion to avert landfill methane.',
        safeHandlingInstructions: isId
          ? 'Pisahkan dari kemasan plastik/anorganik. Kirim hanya ke fasilitas kompos berizin. DILARANG KERAS dijadikan pakan ternak tanpa perlakuan termal resmi.'
          : 'Separate strictly from plastics/inorganics. Send only to certified composting facilities. Strictly prohibited as direct livestock swill.'
      };
    }
  }

  return {
    status: finalStatus,
    eligibleForConsumptionRecommendation: eligibleForConsumption,
    headline,
    summary,
    reasons: finalStatus === 'REJECT' ? rejectReasons : reviewReasons,
    missingInformation,
    parametersChecked: checkedParameters,
    alternativeRouteRecommendation,
    citations: OFFICIAL_SAFETY_SOURCES,
    evaluatedAt: new Date().toISOString(),
    ruleVersion: FOOD_SAFETY_RULE_VERSION
  };
}
