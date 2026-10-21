// REPLATE Bilingual i18n Dictionary (Indonesian & English)

export const TRANSLATIONS = {
  id: {
    // Navigation
    nav: {
      home: 'Beranda',
      report: 'Lapor Surplus',
      journeys: 'Perjalanan',
      impact: 'Kinerja',
      insights: 'Simulasi',
      learn: 'Metodologi',
      sampleData: 'Data Demo',
      loadDemo: 'Muat Data Simulasi',
      clearDemo: 'Bersihkan Data Demo',
      reportButton: '+ Lapor Surplus',
      activeBadge: 'Aktif',
    },
    // Authentication
    auth: {
      loginBtn: 'Masuk',
      logoutBtn: 'Keluar',
      loginTitle: 'Masuk ke REPLATE',
      loginSubtitle: 'Pilih peran atau masukkan akun untuk mengakses dashboard operasional.',
      usernameLabel: 'Username atau Email',
      usernamePlaceholder: 'admin / supplier / mitra',
      passwordLabel: 'Kata Sandi',
      passwordPlaceholder: 'Masukkan kata sandi',
      submitBtn: 'Masuk ke Akun',
      switchRoleBtn: 'Ganti Peran',
      loggedInAs: 'Masuk sebagai',
      quickFillLabel: 'Pilihan Akun Demo (Klik untuk Isi Cepat):',
      adminRole: 'Administrator',
      supplierRole: 'Penyedia Surplus (Supplier)',
      mitraRole: 'Mitra Penerima',
      adminDesc: 'Akses penuh seluruh data & analitik simulasi.',
      supplierDesc: 'Fokus melapor surplus & melacak penjemputan.',
      mitraDesc: 'Fokus konfirmasi penerimaan pangan & distribusi.',
      errorInvalid: 'Username atau kata sandi tidak sesuai akun demo.',
      demoHelp: 'Kata sandi demo: admin123, supplier123, mitra123'
    },
    // Home Page
    home: {
      badge: 'Makanan Harus Bergerak. Bukan Terbuang!',
      heroTitle: 'Beri Makanan Surplus Rute Berguna',
      heroSubtitle: 'Platform pintar dan deterministik yang membantu surplus makanan menemukan rute terbaik sebelum basi dan menjadi sampah.',
      startNow: 'Mulai Selamatkan Pangan',
      viewJourneys: 'Lihat Pengiriman Aktif 🚚',
      trust: {
        safe: 'Rute Aman & Terverifikasi',
        deterministic: '100% Mesin Deterministik',
        proximity: 'Pencocokan Jarak Terdekat',
        impact: 'Dampak Lingkungan Nyata',
      },
      streamsTitle: 'Pilih Berdasarkan Jenis Pangan',
      streamsSubtitle: 'Pilih kategori makanan untuk melihat potensi penyelamatan dan rute tujuannya.',
      activeTitle: 'Operasi Penyelamatan Aktif',
      activeSubtitle: 'Makanan berlebih yang sedang bergerak dari dapur menuju mitra penerima.',
      viewAll: 'Lihat Semua Perjalanan →',
      featuredBadge: 'Alur Deterministik',
      featuredTitle: 'Penyelamatan Pangan Terverifikasi & Cepat',
      featuredDesc: 'Mesin REPLATE mengevaluasi integritas suhu, menghitung skor kelayakan, dan mencocokkan surplus makanan ke dapur umum atau fasilitas pengolahan terdekat dalam hitungan detik.',
      featuredBtn: 'Mulai Lapor Surplus Sekarang →',
      reviewsTitle: 'Suara Mitra Dapur & Komunitas',
      reviewsSubtitle: 'Ulasan langsung dari pengelola dapur, relawan, dan manajer katering.',
      ctaTitle: 'Siap Menyelamatkan Makanan Hari Ini?',
      ctaSubtitle: 'Laporkan sisa makanan dari dapur, restoran, atau acaramu sekarang juga.',
      ctaBtn: 'Lapor Makanan Surplus Sekarang',
    },
    // Food Streams
    streams: {
      cookedRice: 'Nasi Matang',
      cookedRiceTag: 'Urgensi Tinggi',
      bakeryGrains: 'Roti & Pastry',
      bakeryGrainsTag: 'Bisa Diolah',
      freshVeggies: 'Sayur Segar',
      freshVeggiesTag: 'Bahan Segar',
      freshFruits: 'Buah Segar',
      freshFruitsTag: 'Siap Makan',
      preparedMeals: 'Makanan Siap Saji',
      preparedMealsTag: 'Prasmanan / Buffet',
      packagedGoods: 'Bahan Kering',
      packagedGoodsTag: 'Stok Gudang',
    },
    // Report Page
    report: {
      title: 'Lapor Surplus Makanan',
      subtitle: 'Masukkan detail makanan yang Anda miliki. Sistem akan menghitung kelayakan dan mencocokkannya dengan tujuan terbaik.',
      presetsLabel: 'Preset Cepat:',
      presetRice: '🍱 8 kg Nasi (Katering)',
      presetVeggies: '🥦 4.2 kg Sayuran (Resto)',
      presetBread: '🥖 3 kg Roti (Bakery)',
      f1: '01. Jenis & Kategori Pangan',
      f2: '02. Jumlah & Volume',
      f3: '03. Kondisi Makanan Saat Ini',
      f4: '04. Sisa Waktu Aman Konsumsi',
      f5: '05. Asal / Sumber Makanan',
      f6: '06. Catatan Tambahan & Wadah Simpan (Opsional)',
      f6Placeholder: 'Contoh: Disimpan dalam wadah tertutup food-grade, suhu terjaga, bebas alergen...',
      unitKg: 'Kilogram (KG)',
      unitPortions: 'Porsi Makan',
      submitBtn: 'Hitung Rute Penyelamatan',
      calculating: 'Menghitung Viabilitas...',
      qtyPlaceholder: 'Contoh: 8.0',
      defaultNotes: 'Disimpan dalam wadah tertutup bersih food-grade dengan suhu aman.',
      presetRiceNotes: 'Nasi prasmanan belum tersentuh. Suhu terjaga >60°C dalam wadah Cambro.',
      presetVeggiesNotes: 'Bahan sayuran segar bersih dari shift siang, kondisi prima siap olah.',
      presetBreadNotes: 'Roti sourdough dan baguette segar sisa batch produksi hari ini.',
    },
    // Food Types Translations
    foodTypes: {
      'cooked-rice': { name: 'Nasi Matang', category: 'Siap Saji' },
      'bread-pastries': { name: 'Roti & Kue', category: 'Roti & Gandum' },
      'prepared-meals': { name: 'Prasmanan & Makanan Matang', category: 'Siap Saji' },
      'fresh-vegetables': { name: 'Sayuran Daun & Umbi Segar', category: 'Bahan Segar' },
      'fruits': { name: 'Buah Segar (Kebun & Jeruk)', category: 'Bahan Segar' },
      'packaged-dry-goods': { name: 'Sembako & Bahan Kering', category: 'Bahan Kering' },
      'dairy-beverages': { name: 'Susu & Minuman Nabati', category: 'Produk Susu' },
      'meat-poultry-fish': { name: 'Daging, Unggas & Ikan', category: 'Daging & Ikan' },
      'other': { name: 'Makanan Surplus Lainnya', category: 'Siap Saji' }
    },
    // Conditions
    conditions: {
      fresh_excellent: {
        label: 'Sangat Segar & Bersih',
        desc: 'Belum disentuh, baru selesai disiapkan dalam peralatan komersial bersih.'
      },
      suitable: {
        label: 'Layak & Tersimpan Baik',
        desc: 'Disimpan dalam wadah bersih, suhu aman, rasa dan aroma normal.'
      },
      near_window: {
        label: 'Mendekati Batas Aman',
        desc: 'Masih aman tapi harus segera dikonsumsi atau diolah ulang hari ini.'
      },
      not_suitable: {
        label: 'Tidak Layak Konsumsi Langsung',
        desc: 'Suhu ruang terlalu lama, tekstur berubah. Hanya aman untuk kompos / bio-energi.'
      }
    },
    // Time Windows
    timeWindows: {
      under_1h: '< 1 Jam (Sangat Mendesak)',
      less_1h: '< 1 Jam (Sangat Mendesak)',
      '1_3h': '1 – 3 Jam (Optimal)',
      '3_6h': '3 – 6 Jam (Cukup Waktu)',
      over_6h: '> 6 Jam (Fleksibel)'
    },
    // Source Contexts
    sourceContexts: {
      Catering: 'Katering & Acara',
      Restaurant: 'Restoran & Bistro',
      Retail: 'Supermarket / Ritel',
      Event: 'Acara / Konferensi',
      Bakery: 'Toko Roti & Kafe',
      School: 'Kantin Sekolah / Kampus',
      Household: 'Rumah Tangga / Warga',
      Other: 'Sumber Lainnya'
    },
    // Assessment Page
    assessment: {
      title: 'Hasil Penilaian Rute Surplus',
      subtitle: 'Hasil evaluasi deterministik untuk',
      reAssessBtn: '← Nilai Makanan Lain',
      rescueScore: 'Skor Penyelamatan',
      recommendedRoute: 'Rute yang Direkomendasikan',
      whyRoute: 'Mengapa Rute Ini?',
      destinationsTitle: 'Mitra Penerima yang Cocok',
      bestMatch: 'REKOMENDASI TERBAIK',
      compatibility: 'Kecocokan',
      selectDestination: 'Pilih Tujuan Ini →',
      selectedDestination: 'Tujuan Terpilih ✓',
      confirmBtn: 'Konfirmasi & Mulai Pengiriman 🚚',
    },
    // Journeys Page
    journey: {
      title: 'Pelacakan Pengiriman Makanan',
      subtitle: 'Pantau status serah terima makanan dari dapur Anda hingga sampai dan disajikan di tujuan.',
      newRescue: 'Mulai Pengiriman Baru',
      filterAll: 'Semua',
      filterActive: 'Sedang Berjalan',
      filterCompleted: 'Selesai',
      emptyTitle: 'Belum ada pengiriman makanan yang berjalan',
      emptyDesc: 'Saat Anda melaporkan makanan dan memilih mitra tujuan, status perjalanannya akan tercatat di sini.',
      advanceBtn: 'Perbarui Status Pengiriman →',
      deleteBtn: 'Hapus',
      steps: {
        REPORTED: 'Tercatat',
        ASSESSED: 'Selesai Dinilai',
        ROUTE_SELECTED: 'Rute Disetujui',
        MATCHED: 'Mitra Terpilih',
        RESCUE_INITIATED: 'Sedang Diantar (In Transit)',
        RECEIVED: 'Diterima & Terselamatkan ✅',
      }
    },
    // Rescue Performance Page
    impact: {
      title: 'Kinerja Penyelamatan',
      subtitle: 'Pantau operasi penyelamatan pangan, efisiensi distribusi, dan nilai pangan terselamatkan.',
      badgeOperational: 'Data Operasional Aktual (Local-First)',
      badgeDemo: 'Mode Simulasi (Data Demo)',
      clearDemoBtn: 'Bersihkan Data Demo',
      loadDemoBtn: 'Muat Data Simulasi (Uji Coba)',
      kpi1Title: 'Total Surplus Dilaporkan',
      kpi1Sub: 'Total berat surplus pangan yang telah dicatat dalam sistem',
      kpi2Title: 'Pangan Berhasil Disalurkan',
      kpi2Sub: 'Total berat pangan dari transaksi yang telah dikonfirmasi diterima',
      kpi3Title: 'Rata-rata Waktu Penyelamatan',
      kpi3Sub: 'Selisih waktu antara laporan dibuat dan penerimaan dikonfirmasi',
      kpi4Title: 'Tingkat Keberhasilan',
      kpi4Sub: 'Rasio transaksi selesai terhadap transaksi yang sudah jatuh tempo',
      noData: 'Belum ada data',
      formulaExplainer: 'Detail & Dasar Perhitungan',
      operationalPipelineTitle: 'Status Operasional Pipeline',
      operationalPipelineSub: 'Distribusi posisi surplus makanan dalam alur rantai penyelamatan.',
      bottleneckTitle: 'Hambatan Operasional Terdeteksi',
      noBottleneck: 'Tidak ada hambatan operasional kritis yang terdeteksi.',
      funnelTitle: 'Efisiensi Rantai Penyelamatan (Supply Chain Funnel)',
      funnelSub: 'Persentase konversi berjenjang dari intake laporan hingga serah terima fisik.',
      longestWaitingTitle: 'Antrean Menunggu Tindakan Terlama',
      longestWaitingSub: 'Transaksi aktif yang membutuhkan tindakan lanjutan segera.',
      viewInJourney: 'Buka di Journey →',
      economicsTitle: 'Pertukaran Nilai Surplus (Surplus Value Exchange)',
      economicsSub: 'Valuasi nilai pangan transparan dengan memisahkan penawaran, realisasi transaksi, dan penghematan.',
      offeredValue: 'Nilai Penawaran Surplus',
      offeredValueSub: 'Total nilai surplus yang ditawarkan berdasarkan harga acuan pangan per kategori',
      completedValue: 'Nilai Transaksi Selesai',
      completedValueSub: 'Nilai pangan pada transaksi jual-beli komersial yang telah selesai dikonfirmasi',
      recipientSavings: 'Estimasi Penghematan Penerima',
      recipientSavingsSub: 'Nilai belanja pangan yang berhasil dihemat oleh komunitas penerima donasi',
      donationVsCommercial: 'Pemisahan Model Donasi vs Komersial',
      donatedLabel: 'Donasi Sosial (100% dialihkan untuk kebutuhan sosial, tidak dihitung sebagai omzet pemasok)',
      commercialLabel: 'Surplus Diskon Komersial (penjualan dengan potongan harga langsung)',
      transactionsTableTitle: 'Daftar Catatan Perjalanan Penyelamatan',
      transactionsTableSub: 'Akses langsung audit status tiap transaksi dari pelaporan hingga serah terima.',
      environmentalToggle: 'Estimasi Dampak Lingkungan (Sekunder)',
      environmentalSub: 'Pemodelan sekunder berdasarkan US EPA WARM (2.1 kg CO₂e/kg) & FAO (250 L air/kg). Hanya dihitung untuk pangan yang telah berstatus DITERIMA.',
      methodologyNote: 'Metodologi & Batasan: REPLATE memisahkan metrik operasional nyata dari estimasi dampak lingkungan. Faktor US EPA WARM (2.1 kg CO₂e/kg) dan FAO (250 L air/kg) hanya dihitung untuk transaksi dengan status konfirmasi fisik DITERIMA.',
      emptyTitle: 'Belum ada data kinerja penyelamatan',
      emptyDesc: 'Buat laporan surplus pertama untuk mulai mengukur kinerja operasional dan nilai pangan terselamatkan.',
      createFirstReport: '+ Buat Laporan Surplus Pertama',
      seeAllJourneys: 'Lihat Semua Perjalanan 🚚',
      totalReported: 'Total Dilaporkan',
      totalRescued: 'Total Diselamatkan',
      servings: 'Porsi Makan Disediakan',
      co2: 'Kg Emisi CO₂e Dicegah',
      water: 'Liter Air Dihemat'
    },
    // Insights Page
    insights: {
      title: 'Simulasi Pencegahan Surplus',
      subtitle: 'Gunakan simulator interaktif untuk melihat bagaimana efisiensi porsi dapat mencegah makanan terbuang sejak hulu.',
      simCardTitle: 'Simulator Pencegahan Dapur',
      plannedLabel: 'Rata-rata Porsi yang Direncanakan:',
      bufferLabel: 'Estimasi Buffer Kelebihan Produksi (%):',
      resultsTitle: 'Potensi Penghematan Dapur:',
      wasteAvoided: 'Kg Makanan Dicegah Menjadi Sampah / Bulan',
      costSaved: 'Estimasi Penghematan Bahan Pangan / Bulan',
    },
    // Common
    common: {
      highPriority: 'Prioritas Tinggi',
      mediumPriority: 'Prioritas Sedang',
      lowPriority: 'Prioritas Rendah',
      routeRedistribute: 'Distribusi Langsung',
      routeProcess: 'Pengolahan Ulang',
      routeOrganic: 'Kompos / Organik',
      inTransit: 'Dalam Pengantaran',
      rescued: 'Terselamatkan',
      loadSample: 'Muat Data Contoh',
      clearData: 'Hapus Semua Data',
      destination: 'Tujuan',
      status: 'Status',
      notes: 'Catatan',
    }
  },

  en: {
    // Navigation
    nav: {
      home: 'Home',
      report: 'Report Surplus',
      journeys: 'Journeys',
      impact: 'Performance',
      insights: 'Simulation',
      learn: 'Methodology',
      sampleData: 'Sample Data',
      loadDemo: 'Load Simulation Data',
      clearDemo: 'Clear Demo Data',
      reportButton: '+ Report Surplus',
      activeBadge: 'Active',
    },
    // Authentication
    auth: {
      loginBtn: 'Log In',
      logoutBtn: 'Log Out',
      loginTitle: 'Log in to REPLATE',
      loginSubtitle: 'Choose a role or enter demo credentials to access the operational dashboard.',
      usernameLabel: 'Username or Email',
      usernamePlaceholder: 'admin / supplier / mitra',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password',
      submitBtn: 'Log in to Account',
      switchRoleBtn: 'Switch Role',
      loggedInAs: 'Signed in as',
      quickFillLabel: 'Demo Accounts (Click to Quick-Fill):',
      adminRole: 'Administrator',
      supplierRole: 'Surplus Provider (Supplier)',
      mitraRole: 'Recipient Partner',
      adminDesc: 'Full access to all operations & simulation analytics.',
      supplierDesc: 'Focus on reporting surplus & dispatch tracking.',
      mitraDesc: 'Focus on food intake confirmation & distribution.',
      errorInvalid: 'Invalid username or password for demo accounts.',
      demoHelp: 'Demo passwords: admin123, supplier123, mitra123'
    },
    // Home Page
    home: {
      badge: 'Food Should Move. Not Waste!',
      heroTitle: 'Give Surplus Food Another Route',
      heroSubtitle: 'A smart and deterministic platform helping surplus food find its next useful route before it turns to waste.',
      startNow: 'Start Rescuing Food',
      viewJourneys: 'See Active Journeys 🚚',
      trust: {
        safe: 'Safe & Verified Routing',
        deterministic: '100% Deterministic Engine',
        proximity: 'Proximity Matched',
        impact: 'Real-Time Climate Impact',
      },
      streamsTitle: 'Explore by Food Stream',
      streamsSubtitle: 'Select a food category to assess rescue viability and tailored intake routes.',
      activeTitle: 'Active Rescue Operations',
      activeSubtitle: 'Surplus moving from commercial kitchens to verified community programs.',
      viewAll: 'View All Journeys →',
      featuredBadge: 'Deterministic Pipeline',
      featuredTitle: 'Verified & Rapid Food Rescue',
      featuredDesc: "REPLATE's deterministic engine verifies hygiene integrity, calculates rescue viability scores, and pairs surplus food with verified community intake partners in seconds.",
      featuredBtn: 'Start Reporting Surplus Now →',
      reviewsTitle: 'Loved by Kitchen Teams',
      reviewsSubtitle: 'Direct feedback from community chefs, volunteers, and surplus managers.',
      ctaTitle: 'Ready to Rescue Surplus Food Today?',
      ctaSubtitle: 'Report surplus food from your commercial kitchen, catering, or event now.',
      ctaBtn: 'Report Surplus Food Now',
    },
    // Food Streams
    streams: {
      cookedRice: 'Cooked Rice',
      cookedRiceTag: 'High Urgency',
      bakeryGrains: 'Bakery & Grains',
      bakeryGrainsTag: 'Upcyclable',
      freshVeggies: 'Fresh Veggies',
      freshVeggiesTag: 'Fresh Produce',
      freshFruits: 'Fresh Fruits',
      freshFruitsTag: 'Direct Snack',
      preparedMeals: 'Prepared Meals',
      preparedMealsTag: 'Hot Buffets',
      packagedGoods: 'Packaged Goods',
      packagedGoodsTag: 'Pantry Bulk',
    },
    // Report Page
    report: {
      title: 'Report Surplus Food',
      subtitle: 'Tell us what surplus you have. Our deterministic engine calculates viability and pairs it with the best regional destination.',
      presetsLabel: 'Quick Scenarios:',
      presetRice: '🍱 8 kg Rice (Catering)',
      presetVeggies: '🥦 4.2 kg Veggies (Restaurant)',
      presetBread: '🥖 3 kg Bread (Bakery)',
      f1: '01. Food Type & Category',
      f2: '02. Quantity & Volume',
      f3: '03. Current Food Condition',
      f4: '04. Safe Holding Window',
      f5: '05. Food Source Context',
      f6: '06. Additional Notes & Holding Containers (Optional)',
      f6Placeholder: 'e.g. Stored in clean gastro pans, hot holding verified, allergy notations...',
      unitKg: 'Kilograms (KG)',
      unitPortions: 'Portions / Servings',
      submitBtn: 'Assess Surplus Now',
      calculating: 'Calculating Viability...',
      qtyPlaceholder: 'e.g. 8.0',
      defaultNotes: 'Stored in clean food-grade covered containers at safe temperature.',
      presetRiceNotes: 'Banquet unserved hotel pans. Maintained >60°C in thermal carriers.',
      presetVeggiesNotes: 'Clean prep vegetables from lunch shift, sound condition for processing.',
      presetBreadNotes: 'Artisan sourdough loaves and baguette ends from daily batch.',
    },
    // Food Types Translations
    foodTypes: {
      'cooked-rice': { name: 'Cooked Rice', category: 'Prepared' },
      'bread-pastries': { name: 'Bread & Pastries', category: 'Bakery' },
      'prepared-meals': { name: 'Prepared Buffet & Meals', category: 'Prepared' },
      'fresh-vegetables': { name: 'Fresh Vegetables', category: 'Produce' },
      'fruits': { name: 'Fresh Fruits (Orchard & Citrus)', category: 'Produce' },
      'packaged-dry-goods': { name: 'Packaged & Dry Groceries', category: 'Packaged' },
      'dairy-beverages': { name: 'Dairy & Plant Beverages', category: 'Dairy' },
      'meat-poultry-fish': { name: 'Meat, Poultry & Fish', category: 'Meat & Fish' },
      'other': { name: 'Other Edible Surplus', category: 'Prepared' }
    },
    // Conditions
    conditions: {
      fresh_excellent: {
        label: 'Fresh & Untouched',
        desc: 'Unserved, freshly prepared in clean commercial equipment.'
      },
      suitable: {
        label: 'Wholesome & Properly Stored',
        desc: 'Stored in clean containers at safe temperature, normal aroma.'
      },
      near_window: {
        label: 'Near Holding Window Limit',
        desc: 'Wholesome but must be eaten or culinary upcycled today.'
      },
      not_suitable: {
        label: 'Not Suitable for Direct Redistribution',
        desc: 'Exceeded safe holding temperatures. Safe only for composting / bio-energy.'
      }
    },
    // Time Windows
    timeWindows: {
      under_1h: '< 1 Hour (Urgent)',
      less_1h: '< 1 Hour (Urgent)',
      '1_3h': '1 – 3 Hours (Optimal)',
      '3_6h': '3 – 6 Hours (Adequate Window)',
      over_6h: '> 6 Hours (Flexible)'
    },
    // Source Contexts
    sourceContexts: {
      Catering: 'Catering & Events',
      Restaurant: 'Restaurant & Bistro',
      Retail: 'Supermarket / Retail',
      Event: 'Conference & Event',
      Bakery: 'Bakery & Cafe',
      School: 'School & Institutional',
      Household: 'Household & Neighborhood',
      Other: 'Other Source'
    },
    // Assessment Page
    assessment: {
      title: 'Surplus Assessment Results',
      subtitle: 'Deterministic viability evaluation for',
      reAssessBtn: '← Re-assess Another Batch',
      rescueScore: 'Rescue Score',
      recommendedRoute: 'Recommended Route',
      whyRoute: 'Why this route?',
      destinationsTitle: 'Matched Intake Partners',
      bestMatch: 'RECOMMENDED BEST MATCH',
      compatibility: 'Compatibility',
      selectDestination: 'Select This Destination →',
      selectedDestination: 'Destination Selected ✓',
      confirmBtn: 'Confirm Route & Dispatch 🚚',
    },
    // Journeys Page
    journey: {
      title: 'Rescue Journey Tracker',
      subtitle: 'Follow the custodial handover from your kitchen to the recipient destination.',
      newRescue: 'Start New Rescue',
      filterAll: 'All',
      filterActive: 'In Motion',
      filterCompleted: 'Completed',
      emptyTitle: 'No rescue journeys active yet',
      emptyDesc: 'Once you report surplus and select a destination partner, a live custody timeline will be tracked here.',
      advanceBtn: 'Advance Journey Status →',
      deleteBtn: 'Delete',
      steps: {
        REPORTED: 'Reported',
        ASSESSED: 'Assessed',
        ROUTE_SELECTED: 'Route Confirmed',
        MATCHED: 'Partner Matched',
        RESCUE_INITIATED: 'In Transit 🚚',
        RECEIVED: 'Received & Rescued ✅',
      }
    },
    // Rescue Performance Page
    impact: {
      title: 'Rescue Performance',
      subtitle: 'Monitor food rescue operations, distribution efficiency, and recovered food value.',
      badgeOperational: 'Actual Operational Data (Local-First)',
      badgeDemo: 'Simulation Mode (Demo Data)',
      clearDemoBtn: 'Clear Demo Data',
      loadDemoBtn: 'Load Simulation Data',
      kpi1Title: 'Total Reported Surplus',
      kpi1Sub: 'Total weight of surplus logged in system',
      kpi2Title: 'Food Rescued & Received',
      kpi2Sub: 'Confirmed delivered & received at destination',
      kpi3Title: 'Average Rescue Latency',
      kpi3Sub: 'Duration from initial report intake to receipt confirmation',
      kpi4Title: 'Success Rate',
      kpi4Sub: 'Ratio of completed transactions to due transactions',
      noData: 'No data available',
      formulaExplainer: 'Calculation Methodology & Formulas',
      operationalPipelineTitle: 'Operational Pipeline Overview',
      operationalPipelineSub: 'Distribution of surplus batches across supply chain milestones.',
      bottleneckTitle: 'Detected Operational Bottlenecks',
      noBottleneck: 'No critical operational bottlenecks detected.',
      funnelTitle: 'Supply Chain Performance Funnel',
      funnelSub: 'Sequential conversion efficiency from intake to verified physical intake.',
      longestWaitingTitle: 'Longest-Waiting Active Transactions',
      longestWaitingSub: 'Active surplus items requiring priority operational dispatch.',
      viewInJourney: 'Open in Journey →',
      economicsTitle: 'Surplus Value Exchange',
      economicsSub: 'Transparent economic valuation differentiating offered value, realized transactions, and recipient cost savings.',
      offeredValue: 'Offered Surplus Value',
      offeredValueSub: 'Estimated benchmark market value of all reported surplus',
      completedValue: 'Completed Transaction Value',
      completedValueSub: 'Total value of completed discounted/commercial transactions',
      recipientSavings: 'Community Cost Savings',
      recipientSavingsSub: 'Cumulative food cost saved by charitable recipient programs',
      donationVsCommercial: 'Separation of Social Donations vs Commercial Sales',
      donatedLabel: 'Social Food Relief (100% diverted to charitable intake, never counted as supplier revenue)',
      commercialLabel: 'Commercial Surplus Recovery (discounted direct recovery)',
      transactionsTableTitle: 'Food Rescue Journey Audit Log',
      transactionsTableSub: 'Direct audit access to all transaction milestones from intake to receipt.',
      environmentalToggle: 'Secondary Environmental Estimates',
      environmentalSub: 'Secondary modeling based on US EPA WARM (2.1 kg CO2e/kg) & FAO (250 L water/kg). Grounded strictly on physically RECEIVED food.',
      methodologyNote: 'Methodology & Limitations: REPLATE strictly separates verified operational metrics from environmental models. US EPA WARM (2.1 kg CO2e/kg) and FAO (250 L water/kg) factors are applied exclusively to physically confirmed RECEIVED food.',
      emptyTitle: 'No rescue performance data yet',
      emptyDesc: 'Create your first surplus report to start tracking rescue operations, latency, and recovered food value.',
      createFirstReport: '+ Create First Surplus Report',
      seeAllJourneys: 'View All Journeys 🚚',
      totalReported: 'Total Reported',
      totalRescued: 'Total Rescued',
      servings: 'Servings Provided',
      co2: 'Kg CO₂e Avoided',
      water: 'Liters Water Saved'
    },
    // Insights Page
    insights: {
      title: 'Surplus Prevention Simulator',
      subtitle: 'Interactive operational simulator to analyze how adjusting prep batching prevents upstream waste.',
      simCardTitle: 'Kitchen Surplus Prevention Simulator',
      plannedLabel: 'Average Planned Servings per Service:',
      bufferLabel: 'Estimated Over-Prep Buffer (%):',
      resultsTitle: 'Kitchen Prevention Savings:',
      wasteAvoided: 'Kg Food Prevented from Waste / Month',
      costSaved: 'Estimated Food Cost Saved / Month',
    },
    // Common
    common: {
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      routeRedistribute: 'Direct Redistribution',
      routeProcess: 'Secondary Processing',
      routeOrganic: 'Organic Recovery',
      inTransit: 'In Transit',
      rescued: 'Rescued',
      loadSample: 'Load Sample Data',
      clearData: 'Clear All Data',
      destination: 'Destination',
      status: 'Status',
      notes: 'Notes',
    }
  }
};

// Storage helper for language preference (Option 2: sessionStorage / zero localStorage)
export const getActiveLanguage = () => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem('replate_lang_v1') || 'id';
    }
    return 'id';
  } catch {
    return 'id';
  }
};

export const setActiveLanguage = (lang) => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('replate_lang_v1', lang);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('replate:language-change', { detail: lang }));
      try { window.localStorage?.removeItem('replate_lang_v1'); } catch {}
    }
  } catch (err) {
    console.error('Failed to save language', err);
  }
};
