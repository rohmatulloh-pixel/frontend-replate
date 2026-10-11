/**
 * REPLATE Food Types Dataset
 * Factual reference data for common surplus food streams.
 * Includes perishability windows, default distribution ease, and standard density/serving factors.
 * Reference: FAO Food Loss & Waste Protocols, USDA Serving Size Guidelines, WHO Food Safety Guidelines.
 */

export const FOOD_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'prepared', name: 'Prepared Food & Meals' },
  { id: 'bakery', name: 'Bakery & Grains' },
  { id: 'produce', name: 'Fresh Produce' },
  { id: 'packaged', name: 'Packaged & Ambient' },
  { id: 'dairy', name: 'Dairy & Chilled' },
  { id: 'meat_fish', name: 'Meat, Poultry & Fish' }
];

export const FOOD_TYPES = [
  {
    id: 'cooked-rice',
    name: 'Cooked Rice',
    category: 'prepared',
    defaultPerishabilityHours: 4,
    densityCategory: 'high',
    servingWeightKg: 0.20, // 200g typical portion
    distributionEase: 82,
    handlingNotes: 'Requires rapid thermal control (maintain above 60°C or chill below 4°C). Bacillus cereus risk.',
    typicalRoutes: ['REDISTRIBUTE', 'ORGANIC'],
    sourceCitation: 'USDA Food Safety and Inspection Service (FSIS) & WHO 5 Keys to Safer Food.'
  },
  {
    id: 'bread-pastries',
    name: 'Bread & Pastries',
    category: 'bakery',
    defaultPerishabilityHours: 48,
    densityCategory: 'low',
    servingWeightKg: 0.12, // 120g typical serving
    distributionEase: 95,
    handlingNotes: 'Ambient stable, low microbiological moisture risk, easily portioned.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS', 'ORGANIC'],
    sourceCitation: 'FAO Technical Platform on Food Loss & BPOM Guidelines.'
  },
  {
    id: 'prepared-meals',
    name: 'Prepared Buffet & Cooked Meals',
    category: 'prepared',
    defaultPerishabilityHours: 3,
    densityCategory: 'medium',
    servingWeightKg: 0.35, // 350g complete meal
    distributionEase: 75,
    handlingNotes: 'Strict time-temperature window (Danger zone 5°C-60°C max 4 hours). Rapid dispatch required.',
    typicalRoutes: ['REDISTRIBUTE', 'ORGANIC'],
    sourceCitation: 'Kemenkes RI Permenkes Jasaboga & WHO Food Safety Fact Sheet.'
  },
  {
    id: 'fresh-vegetables',
    name: 'Fresh Leafy & Root Vegetables',
    category: 'produce',
    defaultPerishabilityHours: 72,
    densityCategory: 'medium',
    servingWeightKg: 0.25,
    distributionEase: 88,
    handlingNotes: 'Resilient for processing and community kitchens if physically sound and unblemished.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS', 'ORGANIC'],
    sourceCitation: 'FAO Post-harvest Loss Assessment Database.'
  },
  {
    id: 'fruits',
    name: 'Fresh Fruits (Orchard & Citrus)',
    category: 'produce',
    defaultPerishabilityHours: 96,
    densityCategory: 'medium',
    servingWeightKg: 0.20,
    distributionEase: 90,
    handlingNotes: 'High direct value; suitable for processing into purées or direct snacking if skin intact.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS', 'ORGANIC'],
    sourceCitation: 'FAO Global Food Losses and Food Waste.'
  },
  {
    id: 'packaged-dry-goods',
    name: 'Packaged & Dry Groceries',
    category: 'packaged',
    defaultPerishabilityHours: 720, // 30 days
    densityCategory: 'high',
    servingWeightKg: 0.30,
    distributionEase: 98,
    handlingNotes: 'Shelf-stable, minimal temperature risk. Verify BPOM Cek KLIK (Kemasan, Label, Izin, Kedaluwarsa).',
    typicalRoutes: ['REDISTRIBUTE'],
    sourceCitation: 'BPOM RI Prinsip Cek KLIK & ReFED Food Recovery Protocols.'
  },
  {
    id: 'dairy-beverages',
    name: 'Dairy & Plant Beverages',
    category: 'dairy',
    defaultPerishabilityHours: 12,
    densityCategory: 'medium',
    servingWeightKg: 0.25,
    distributionEase: 70,
    handlingNotes: 'Requires continuous unbroken cold chain (below 4°C). High microbial risk.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS'],
    sourceCitation: 'International Dairy Federation & BPOM Keamanan Pangan Olahan Dingin.'
  },
  {
    id: 'meat-poultry-fish',
    name: 'Meat, Poultry & Fish',
    category: 'meat_fish',
    defaultPerishabilityHours: 2,
    densityCategory: 'medium',
    servingWeightKg: 0.25,
    distributionEase: 65,
    handlingNotes: 'Critical high-protein perishable. Strict separation from ready-to-eat food; maintain <4°C or >60°C.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS', 'ORGANIC'],
    sourceCitation: 'WHO Food Safety & Kemenkes Standar Higiene Sanitasi Pengolahan Daging.'
  },
  {
    id: 'other',
    name: 'Other Edible Surplus',
    category: 'other',
    defaultPerishabilityHours: 6,
    densityCategory: 'medium',
    servingWeightKg: 0.30,
    distributionEase: 80,
    handlingNotes: 'Requires manual verification of safe holding temperatures and container integrity.',
    typicalRoutes: ['REDISTRIBUTE', 'PROCESS', 'ORGANIC'],
    sourceCitation: 'REPLATE Food Safety Gate Protocol.'
  }
];

export const SOURCE_CONTEXTS = [
  { id: 'Catering', name: 'Catering & Banquet Service', typicalUrgency: 'High', avgVolume: 'Medium-Large' },
  { id: 'Restaurant', name: 'Restaurant / Commercial Dining', typicalUrgency: 'High', avgVolume: 'Small-Medium' },
  { id: 'Retail', name: 'Supermarket / Grocery Retail', typicalUrgency: 'Medium', avgVolume: 'Medium' },
  { id: 'Event', name: 'Conference / Large Event', typicalUrgency: 'High', avgVolume: 'Large' },
  { id: 'Bakery', name: 'Artisan / Commercial Bakery', typicalUrgency: 'Medium', avgVolume: 'Medium' },
  { id: 'School', name: 'School / Institutional Canteen', typicalUrgency: 'High', avgVolume: 'Medium' },
  { id: 'Household', name: 'Household / Neighborhood', typicalUrgency: 'Low', avgVolume: 'Small' },
  { id: 'Other', name: 'Other Supply Chain Node', typicalUrgency: 'Medium', avgVolume: 'Variable' }
];

export const CONDITION_OPTIONS = [
  {
    id: 'fresh_excellent',
    label: 'Fresh / Excellent Condition',
    scoreFactor: 98,
    description: 'Recently prepared or harvested, stored in proper temperature containment.',
    recommendedRoute: 'REDISTRIBUTE'
  },
  {
    id: 'suitable',
    label: 'Still Suitable / Wholesome',
    scoreFactor: 88,
    description: 'Good sensory quality, clean handling, suitable for immediate consumption or cooking.',
    recommendedRoute: 'REDISTRIBUTE'
  },
  {
    id: 'near_window',
    label: 'Near End of Usable Window',
    scoreFactor: 64,
    description: 'Requires immediate redistribution or secondary culinary processing today.',
    recommendedRoute: 'PROCESS'
  }
];

export const TIME_WINDOWS = [
  { id: 'under_1h', label: 'Under 1 hour (Immediate urgency)', hours: 0.8, urgencyScore: 98 },
  { id: '1_3h', label: '1 to 3 hours (High urgency)', hours: 2.5, urgencyScore: 90 },
  { id: '3_6h', label: '3 to 6 hours (Moderate window)', hours: 5.0, urgencyScore: 78 },
  { id: 'over_6h', label: 'More than 6 hours (Flexible window)', hours: 12.0, urgencyScore: 65 }
];

/**
 * FOOD SAFETY GATE OPTIONS & PARAMETER VOCABULARY
 * Corresponds to WHO, Kemenkes RI, and BPOM guidelines.
 */
export const SAFETY_CONDITION_OPTIONS = [
  {
    id: 'no_visible_damage',
    labelId: 'Tidak ditemukan tanda kerusakan yang terlihat',
    labelEn: 'No visible signs of spoilage or damage',
    descriptionId: 'Warna, aroma, dan tekstur tampak normal secara kasat mata.',
    descriptionEn: 'Normal appearance, color, and aroma upon visual inspection.',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'altered_needs_check',
    labelId: 'Ada perubahan kondisi yang perlu diperiksa',
    labelEn: 'Altered condition requiring closer inspection',
    descriptionId: 'Sedikit layu, tekstur berubah, atau ada keraguan sensoris ringan yang butuh konfirmasi.',
    descriptionEn: 'Slight wilting, texture softening, or minor sensory variation needing verification.',
    gateImpact: 'review_trigger'
  },
  {
    id: 'clear_spoilage',
    labelId: 'Ada tanda kerusakan yang jelas',
    labelEn: 'Clear signs of spoilage or contamination',
    descriptionId: 'Berlendir, bau tidak sedap / asam, berjamur, berulat, atau pembusukan nyata.',
    descriptionEn: 'Slime, foul/sour odor, mold, discoloration, or obvious biological decay.',
    gateImpact: 'reject_trigger'
  },
  {
    id: 'not_checked',
    labelId: 'Belum diperiksa',
    labelEn: 'Not inspected / Unchecked',
    descriptionId: 'Pemeriksaan fisik visual belum dilakukan.',
    descriptionEn: 'Physical or sensory inspection has not yet been conducted.',
    gateImpact: 'review_trigger'
  }
];

export const SAFETY_STORAGE_HISTORY_OPTIONS = [
  {
    id: 'known_compliant',
    labelId: 'Riwayat penyimpanan diketahui & memenuhi standar',
    labelEn: 'Storage history known & complies with safety standards',
    descriptionId: 'Suhu terjaga konsisten sesuai kebutuhan kategori (panas >60°C atau dingin <4°C atau ruang kering).',
    descriptionEn: 'Consistent thermal control maintained per category specifications (hot >60°C, cold <4°C, or dry).',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'unknown',
    labelId: 'Riwayat penyimpanan tidak diketahui',
    labelEn: 'Storage history unknown / undocumented',
    descriptionId: 'Tidak ada catatan atau kepastian suhu penyimpanan sejak awal disiapkan.',
    descriptionEn: 'No holding temperature records or certainty regarding prior storage conditions.',
    gateImpact: 'review_trigger'
  },
  {
    id: 'suspected_non_compliant',
    labelId: 'Ada dugaan penyimpanan yang tidak sesuai',
    labelEn: 'Suspected improper storage / thermal abuse',
    descriptionId: 'Terbiarkan di suhu ruang (5°C–60°C) melebihi batas aman, atau rantai dingin terputus.',
    descriptionEn: 'Left in temperature danger zone (5°C–60°C) beyond safe limits or broken cold chain.',
    gateImpact: 'reject_trigger'
  },
  {
    id: 'not_checked',
    labelId: 'Belum diperiksa',
    labelEn: 'Not verified / Unchecked',
    descriptionId: 'Status penyimpanan belum diverifikasi.',
    descriptionEn: 'Storage conditions have not been verified.',
    gateImpact: 'review_trigger'
  }
];

export const SAFETY_TEMP_OPTIONS = [
  {
    id: 'hot_holding_above_60',
    labelId: 'Disimpan panas (suhu di atas 60°C)',
    labelEn: 'Hot holding (maintained above 60°C)',
    categoryFit: ['prepared', 'meat_fish'],
    safeZone: true
  },
  {
    id: 'cold_holding_below_4',
    labelId: 'Disimpan dingin (rantai dingin di bawah 4°C)',
    labelEn: 'Chilled / Cold chain (below 4°C)',
    categoryFit: ['prepared', 'dairy', 'meat_fish', 'produce'],
    safeZone: true
  },
  {
    id: 'ambient_room_temp',
    labelId: 'Suhu ruang terkontrol (kering & sejuk)',
    labelEn: 'Ambient controlled room temperature (dry & cool)',
    categoryFit: ['bakery', 'packaged', 'produce'],
    safeZone: true
  },
  {
    id: 'uncontrolled_fluctuating',
    labelId: 'Suhu tidak terkontrol / bahaya (5°C - 60°C)',
    labelEn: 'Uncontrolled / Danger zone (5°C - 60°C)',
    categoryFit: ['prepared', 'dairy', 'meat_fish', 'bakery', 'produce', 'packaged', 'other'],
    safeZone: false
  },
  {
    id: 'unknown',
    labelId: 'Suhu tidak diketahui',
    labelEn: 'Unknown temperature',
    categoryFit: ['all'],
    safeZone: false
  }
];

export const SAFETY_PACKAGING_OPTIONS = [
  {
    id: 'intact_proper',
    labelId: 'Kemasan utuh, tertutup rapat & sesuai standar',
    labelEn: 'Packaging intact, sealed & food-grade',
    descriptionId: 'Wadah bersih berpenutup rapat, segel pabrik utuh, atau wadah gastronorm higienis.',
    descriptionEn: 'Clean covered container, intact factory seal, or food-grade gastronorm.',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'opened_verified_clean',
    labelId: 'Kemasan terbuka tetapi penanganan bersih & terverifikasi',
    labelEn: 'Opened packaging but hygienically handled & covered',
    descriptionId: 'Segel telah dibuka namun langsung ditutup kembali dan dijaga dari cemaran serangga/debu.',
    descriptionEn: 'Opened container promptly re-covered, shielded from pests, dust, and droplet exposure.',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'damaged_leaking_contaminated',
    labelId: 'Kemasan rusak, bocor, kaleng kembung/penyok, atau kotor',
    labelEn: 'Damaged, leaking, swollen/dented can, or contaminated packaging',
    descriptionId: 'Ada robekan, kebocoran, kaleng menggembung (risiko Clostridium botulinum), atau kontak kotoran.',
    descriptionEn: 'Tears, leaks, dented/swollen cans (botulism risk), or direct dirt/chemical contact.',
    gateImpact: 'reject_trigger'
  },
  {
    id: 'not_applicable_fresh',
    labelId: 'Tidak berlaku (bahan pangan segar berpelindung alami)',
    labelEn: 'Not applicable (whole fresh produce with natural peel)',
    descriptionId: 'Untuk buah utuh berkulit (pisang, jeruk, kelapa) atau umbi segar yang belum dipotong.',
    descriptionEn: 'For whole uncut fruits with intact skins/rinds or whole tubers.',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'not_checked',
    labelId: 'Belum diperiksa',
    labelEn: 'Not inspected / Unchecked',
    descriptionId: 'Kondisi kemasan belum diperiksa.',
    descriptionEn: 'Packaging integrity has not been verified.',
    gateImpact: 'review_trigger'
  }
];

export const SAFETY_HANDLING_OPTIONS = [
  {
    id: 'hygienic_separated',
    labelId: 'Penanganan higienis & terpisah dari bahan mentah',
    labelEn: 'Hygienically handled & strictly separated from raw foods',
    descriptionId: 'Penjamah menggunakan alat bersih/sarung tangan; tidak ada kontak silang daging mentah ke makanan matang.',
    descriptionEn: 'Clean utensils/gloves used; strict separation prevents cross-contamination from raw meat/poultry.',
    gateImpact: 'pass_eligible'
  },
  {
    id: 'potential_cross_contamination',
    labelId: 'Ada potensi kontak silang atau penjamah belum terverifikasi',
    labelEn: 'Potential cross-contamination or unverified food handlers',
    descriptionId: 'Risiko kontak dengan alat bekas daging mentah, alergen tanpa label, atau penjamah kurang higienis.',
    descriptionEn: 'Shared cutting boards/utensils with raw meat, unlabeled allergens, or unmonitored handlers.',
    gateImpact: 'review_trigger'
  },
  {
    id: 'unknown',
    labelId: 'Riwayat penanganan tidak diketahui',
    labelEn: 'Handling history unknown / undocumented',
    descriptionId: 'Tidak ada informasi mengenai proses persiapan atau higienitas penjamah makanan.',
    descriptionEn: 'No information regarding food preparation hygiene or custody handling.',
    gateImpact: 'review_trigger'
  }
];
