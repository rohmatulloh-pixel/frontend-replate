/**
 * REPLATE Educational Knowledge Base
 * Structured across five core modules: Understand, Trace, Rescue, Prevent, Impact.
 * Fully bilingual (Indonesian & English).
 */

export const LEARN_MODULES_ID = [
  {
    id: 'understand',
    title: 'Pahami (Understand)',
    subtitle: 'Perbedaan mendasar antara makanan surplus dan limbah pangan',
    icon: 'BookOpen',
    topics: [
      {
        id: 'u1',
        title: 'Surplus vs Sampah: Jendela Waktu Penentu',
        summary: 'Surplus adalah pangan layak makan yang melebihi kebutuhan sesaat. Makanan baru menjadi sampah saat kehilangan rute penyaluran yang tepat waktu.',
        takeaways: [
          'Surplus adalah aset dengan nilai gizi dan nilai ekonomi yang masih utuh.',
          'Sampah terbentuk saat latensi logistik melampaui sisa masa simpan makanan.',
          'Kecepatan rute distribusi adalah variabel intervensi yang paling menentukan.'
        ],
        quote: 'Makanan menjadi sampah bukan karena berlebih, tetapi karena terlupakan.'
      },
      {
        id: 'u2',
        title: 'Kendala Utama Penyelamatan Pangan',
        summary: 'Sebagian besar surplus terbuang bukan karena disengaja, melainkan karena pelaku usaha menghadapi kesulitan koordinasi mencari penerima yang tepat dalam jam operasional yang sempit.',
        takeaways: [
          'Tingginya biaya koordinasi manual menghambat inisiatif donasi spontan.',
          'Kekhawatiran tanggung jawab keamanan pangan menciptakan keraguan tanpa protokol yang jelas.',
          'Sistem pendukung keputusan menghilangkan beban pikiran staf di akhir jam kerja.'
        ]
      }
    ]
  },
  {
    id: 'trace',
    title: 'Telusuri (Trace)',
    subtitle: 'Titik munculnya susut dan surplus di sepanjang rantai pasok pangan',
    icon: 'GitFork',
    stages: [
      {
        step: '01',
        name: 'Produksi Pertanian',
        lossFactor: '14%',
        drivers: 'Standar estetika fisik, fluktuasi harga panen, anomali cuaca.',
        routingOpportunity: 'Jaringan pemungutan hasil panen sisa & pengolahan sekunder.'
      },
      {
        step: '02',
        name: 'Pascapanen & Penyimpanan',
        lossFactor: '8%',
        drivers: 'Rantai dingin terputus, kelembapan gudang tidak tepat, hama simpanan.',
        routingOpportunity: 'Penyaluran inventaris dinamis sebelum penurunan mutu.'
      },
      {
        step: '03',
        name: 'Pengolahan & Manufaktur',
        lossFactor: '6%',
        drivers: 'Sisa pemotongan, kelebihan kapasitas produksi batch, kesalahan label kemasan.',
        routingOpportunity: 'Upcycling dan valorisasi produk sampingan.'
      },
      {
        step: '04',
        name: 'Grosir & Ritel',
        lossFactor: '9%',
        drivers: 'Pemesanan berlebih, kebingungan label tanggal, stok display berlebih.',
        routingOpportunity: 'Pengumpulan massal bank makanan & clearance harga terjangkau.'
      },
      {
        step: '05',
        name: 'Layanan Makanan & Katering',
        lossFactor: '17%',
        drivers: 'Perkiraan jumlah tamu prasmanan tidak pasti, overproduksi buffer.',
        routingOpportunity: 'Redistribusi cepat hari yang sama makanan panas/dingin REPLATE.'
      },
      {
        step: '06',
        name: 'Konsumsi Rumah Tangga',
        lossFactor: '46%',
        drivers: 'Pembelian berlebih, kurangnya perencanaan menu, salah tafsir tanggal kedaluwarsa.',
        routingOpportunity: 'Berbagi antartetangga & pemisahan limbah organik.'
      }
    ]
  },
  {
    id: 'rescue',
    title: 'Selamatkan (Rescue)',
    subtitle: 'Logistik pencocokan surplus dengan kebutuhan masyarakat',
    icon: 'Repeat',
    principles: [
      {
        title: 'Verifikasi Suhu & Waktu',
        detail: 'Makanan panas wajib dijaga >60°C atau didinginkan cepat ke <4°C dalam 2 jam untuk mencegah perkembangbiakan patogen.'
      },
      {
        title: 'Penyaluran Sadar Kapasitas',
        detail: 'Pencocokan harus memperhitungkan daya tampung penerima agar beban penanganan tidak beralih menjadi sampah di dapur relawan.'
      },
      {
        title: 'Prioritas Radius Terdekat',
        detail: 'Makanan matang siap saji mendesak dicocokkan dalam radius 5 km untuk menjaga integritas suhu dan meminimalkan emisi armada.'
      }
    ]
  },
  {
    id: 'prevent',
    title: 'Cegah (Prevent)',
    subtitle: 'Menghilangkan surplus sebelum terbentuk di dapur',
    icon: 'ShieldCheck',
    strategies: [
      {
        title: 'Kalibrasi Porsi & Buffer Masak',
        detail: 'Kurangi kelebihan porsi standar dari 15% menjadi 5% melalui metode memasak bertahap (progressive cooking) pada perhotelan.'
      },
      {
        title: 'Penjadwalan Masak Ber-Shift',
        detail: 'Siapkan hidangan mudah rusak dalam 2 sesi memasak kecil alih-alih 1 porsi raksasa di awal hari.'
      },
      {
        title: 'Pengadaan Berbasis Data Nyata',
        detail: 'Audit kategori surplus mingguan secara rutin untuk mengenali ketidaksesuaian pola pemesanan bahan baku.'
      }
    ]
  },
  {
    id: 'impact',
    title: 'Dampak (Impact)',
    subtitle: 'Manfaat ekologis dan sosial dari makanan yang berhasil diselamatkan',
    icon: 'TrendingUp',
    metrics: [
      {
        label: 'Energi & Air Terkandung',
        desc: 'Setiap kilogram makanan yang terbuang juga menyia-nyiakan pupuk, bahan bakar armada, dan 250+ liter air yang digunakan untuk menanamnya.'
      },
      {
        label: 'Pencegahan Gas Metana',
        desc: 'Pangan yang membusuk secara anaerobik di TPA menghasilkan gas metana—gas rumah kaca 28x lebih berbahaya dari CO₂.'
      },
      {
        label: 'Martabat Manusia & Gizi',
        desc: 'Mengalihkan makanan bergizi utuh secara langsung memberikan asupan seimbang dan kaya protein bagi keluarga yang membutuhkan.'
      }
    ]
  }
];

export const LEARN_MODULES_EN = [
  {
    id: 'understand',
    title: 'Understand',
    subtitle: 'The fundamental distinction between surplus and waste',
    icon: 'BookOpen',
    topics: [
      {
        id: 'u1',
        title: 'Surplus vs. Waste: The Decisive Window',
        summary: 'Surplus is edible food in excess of immediate demand. It only becomes waste when it lacks a timely destination route.',
        takeaways: [
          'Surplus is an asset with intact nutritional and economic value.',
          'Waste occurs when logistical latency exceeds food shelf-life.',
          'Routing speed is the single most critical intervention variable.'
        ],
        quote: 'Food becomes waste not when it is excess, but when it is forgotten.'
      },
      {
        id: 'u2',
        title: 'The Real Bottleneck in Recovery',
        summary: 'Most surplus food is discarded not out of malice, but because business operators face high friction in finding qualified recipients during tight operating windows.',
        takeaways: [
          'High coordination costs prevent spontaneous donation.',
          'Fear of food liability creates hesitation without clear protocols.',
          'Decision support eliminates the cognitive burden at end-of-shift.'
        ]
      }
    ]
  },
  {
    id: 'trace',
    title: 'Trace',
    subtitle: 'Where loss and surplus emerge along the food supply chain',
    icon: 'GitFork',
    stages: [
      {
        step: '01',
        name: 'Agricultural Production',
        lossFactor: '14%',
        drivers: 'Cosmetic standards, harvest price fluctuations, weather disruption.',
        routingOpportunity: 'Gleaning networks and secondary processing.'
      },
      {
        step: '02',
        name: 'Post-Harvest & Storage',
        lossFactor: '8%',
        drivers: 'Cold-chain gaps, improper humidity, storage pests.',
        routingOpportunity: 'Dynamic inventory clearance before degradation.'
      },
      {
        step: '03',
        name: 'Processing & Manufacturing',
        lossFactor: '6%',
        drivers: 'Trim waste, batch overruns, package mislabeling.',
        routingOpportunity: 'Upcycling and byproduct valorization.'
      },
      {
        step: '04',
        name: 'Wholesale & Retail',
        lossFactor: '9%',
        drivers: 'Over-ordering, date-label confusion, display overstock.',
        routingOpportunity: 'Food bank bulk collection and discounted clearance.'
      },
      {
        step: '05',
        name: 'Food Service & Catering',
        lossFactor: '17%',
        drivers: 'Unpredictable banquet headcounts, buffer overproduction.',
        routingOpportunity: 'REPLATE rapid same-day hot/chilled redistribution.'
      },
      {
        step: '06',
        name: 'Household Consumption',
        lossFactor: '46%',
        drivers: 'Over-purchasing, lack of meal planning, date misinterpretation.',
        routingOpportunity: 'Neighborhood sharing and organic separation.'
      }
    ]
  },
  {
    id: 'rescue',
    title: 'Rescue',
    subtitle: 'The logistics of matching supply with community demand',
    icon: 'Repeat',
    principles: [
      {
        title: 'Thermal & Time Verification',
        detail: 'Hot foods must remain >60°C or be rapidly cooled to <4°C within 2 hours to maintain pathogen safety.'
      },
      {
        title: 'Capacity-Aware Dispatch',
        detail: 'Matching must account for destination intake limits to avoid shifting the waste burden to volunteer kitchens.'
      },
      {
        title: 'Proximity Prioritization',
        detail: 'Urgent prepared foods need matches within a 5km radius to preserve temperature and minimize transit emissions.'
      }
    ]
  },
  {
    id: 'prevent',
    title: 'Prevent',
    subtitle: 'Eliminating surplus before it enters the kitchen',
    icon: 'ShieldCheck',
    strategies: [
      {
        title: 'Portion & Buffer Calibration',
        detail: 'Reduce standard over-prep buffers from 15% to 5% using progressive cooking in hospitality.'
      },
      {
        title: 'Batch Scheduling in Shifts',
        detail: 'Prepare perishable items in two smaller shifts rather than one large morning bulk batch.'
      },
      {
        title: 'Data-Driven Procurement',
        detail: 'Audit recurrent surplus categories weekly to spot structural ordering mismatches.'
      }
    ]
  },
  {
    id: 'impact',
    title: 'Impact',
    subtitle: 'The ecological and social return on recovered meals',
    icon: 'TrendingUp',
    metrics: [
      {
        label: 'Embodied Energy & Water',
        desc: 'Every kilogram of discarded food also discards the fertilizer, tractor fuel, transport, and 250+ liters of water used to grow it.'
      },
      {
        label: 'Methane Suppression',
        desc: 'Food decaying anaerobically in landfills generates methane—a greenhouse gas over 28x more potent than CO2.'
      },
      {
        label: 'Human Dignity & Nutrition',
        desc: 'Redirecting wholesome meals immediately provides balanced, protein-rich nourishment to food-insecure families.'
      }
    ]
  }
];

export function getLearnModules(lang = 'id') {
  return lang === 'en' ? LEARN_MODULES_EN : LEARN_MODULES_ID;
}

export const LEARN_MODULES = LEARN_MODULES_ID;
