import React, { useState } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';

interface HelpProps {
  onNavigate?: (view: string) => void;
}

export function Help({ onNavigate }: HelpProps) {
  const { language, t } = useThemeLanguage();
  const isId = language === 'id';

  const [activeTab, setActiveTab] = useState<'step_by_step' | 'per_menu' | 'ai_scanner' | 'reports_guide' | 'faq'>('step_by_step');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const stepsList = [
    {
      step: '01',
      title: isId ? 'Setup Workspace & Multi-Dompet' : 'Setup Workspace & Multi-Wallet',
      subtitle: isId ? 'Pemisahan Keuangan Pribadi, Keluarga, & Bisnis' : 'Separate Personal, Family, & Business Finances',
      icon: 'account_balance_wallet',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      navTarget: 'dashboard',
      details: [
        {
          heading: isId ? '1. Memilih / Menambah Workspace' : '1. Choosing / Adding Workspaces',
          text: isId 
            ? 'Gunakan sakelar (Workspace Switcher) di bagian atas sidebar atau header untuk berpindah antara Dompet Pribadi dan Dompet Keluarga.'
            : 'Use the Workspace Switcher at the top of the sidebar or header to seamlessly switch between Personal Wallet and Family Wallet.'
        },
        {
          heading: isId ? '2. Fungsi Pemisahan Data' : '2. Purpose of Data Isolation',
          text: isId 
            ? 'Setiap workspace memiliki catatan arus kas, anggaran amplop, daftar tagihan, dan laporan keuangan terpisah yang aman & terisolasi.'
            : 'Each workspace maintains completely isolated cash flows, envelope budgets, bill trackers, and financial reports.'
        }
      ]
    },
    {
      step: '02',
      title: isId ? 'Konfigurasi Master Data & Aset' : 'Master Data & Assets Setup',
      subtitle: isId ? 'Mendata Akun Bank, E-Wallet, & Barang Properti' : 'Registering Bank Accounts, E-Wallets, & Assets',
      icon: 'home_work',
      navTarget: 'settings',
      details: [
        {
          heading: isId ? '1. Pendaftaran Rekening Bank & E-Wallet' : '1. Bank & E-Wallet Accounts',
          text: isId 
            ? 'Buka menu "Pengaturan" -> tab "Kategori & Rekening" -> atur rekening bank, e-wallet, atau saldo kas untuk pencatatan transaksi kas masuk & keluar sehari-hari.'
            : 'Navigate to "Settings" -> "Categories & Accounts" tab -> setup bank accounts, e-wallets, or cash balances for daily transaction logging.'
        },
        {
          heading: isId ? '2. Pendataan Barang & Depresiasi Aset' : '2. Property Assets & Depreciation',
          text: isId 
            ? 'Buka menu "Aset & Barang" -> daftarkan tanah, bangunan, kendaraan, atau barang berharga. Aplikasi secara otomatis menghitung estimasi nilai depresiasi dari waktu ke waktu.'
            : 'Go to "Assets & Goods" -> register land, buildings, vehicles, or valuables. The app automatically estimates value depreciation over time.'
        }
      ]
    },
    {
      step: '03',
      title: isId ? 'Pengaturan Amplop Anggaran (Envelope Budgeting)' : 'Envelope Budgeting Setup',
      subtitle: isId ? 'Membagi Batas Batas Belanja Bulanan Per Kategori' : 'Setting Monthly Spending Limits Per Category',
      icon: 'savings',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      navTarget: 'budgeting',
      details: [
        {
          heading: isId ? '1. Membuat Amplop Anggaran' : '1. Creating Budget Envelopes',
          text: isId 
            ? 'Masuk ke menu "Anggaran" -> klik "+ Tambah Amplop". Tentukan nama kategori (misal: Belanja Bulanan) dan alokasi nominal batas maksimal belanja.'
            : 'Go to "Budgeting" -> click "+ Add Envelope". Specify category name (e.g. Groceries) and maximum monthly allocation limit.'
        },
        {
          heading: isId ? '2. Pemantauan Real-Time' : '2. Real-Time Tracking',
          text: isId 
            ? 'Setiap kali Anda mencatat pengeluaran di kategori tersebut, kuota dalam amplop akan otomatis terpotong dengan indikator progress visual.'
            : 'Every expense logged under that category automatically deducts from the envelope limit with visual progress bars.'
        }
      ]
    },
    {
      step: '04',
      title: isId ? 'Master Tagihan & Pengingat Rutin' : 'Bills & Recurring Reminders',
      subtitle: isId ? 'Mencatat Listrik, Internet, Cicilan, & Asuransi' : 'Logging Electricity, Internet, Loans, & Insurance',
      icon: 'receipt_long',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      navTarget: 'bills',
      details: [
        {
          heading: isId ? '1. Mendaftarkan Tagihan' : '1. Registering Bills',
          text: isId 
            ? 'Buka menu "Tagihan" -> klik "+ Tambah Tagihan". Masukkan nama penyedia, tanggal jatuh tempo bulanan, dan estimasi nominal.'
            : 'Open "Bills" -> click "+ Add Bill". Enter vendor name, monthly due date, and estimated amount.'
        },
        {
          heading: isId ? '2. Notifikasi & Eksekusi Bayar' : '2. Notifications & Execution',
          text: isId 
            ? 'Lonceng notifikasi di bagian atas akan menyala saat tagihan mendekati jatuh tempo. Klik "Bayar" untuk langsung memotong saldo dompet.'
            : 'The top bell icon will alert you as due dates approach. Click "Pay" to automatically deduct wallet balance and log the transaction.'
        }
      ]
    },
    {
      step: '05',
      title: isId ? 'Operasional Transaksi Harian & AI Scanner' : 'Daily Transactions & AI Scanner',
      subtitle: isId ? 'Input Manual, Scan Struk Belanja, & Transfer' : 'Manual Entry, Receipt Scanning, & Transfers',
      icon: 'center_focus_strong',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      navTarget: 'cash-flow',
      details: [
        {
          heading: isId ? '1. Pemindaian Struk AI Gemini' : '1. Gemini AI Receipt Scanning',
          text: isId 
            ? 'Klik "+ Transaksi" -> klik "Input Otomatis (AI)". Ambil foto struk belanja dengan kamera HP/Laptop atau unggah gambar. AI Gemini akan membaca merchant, tanggal, total bayar, dan kategori.'
            : 'Click "+ Transaction" -> click "AI Automatic Input". Take a photo of the receipt or upload an image. Gemini AI will automatically extract merchant, date, total amount, and category.'
        },
        {
          heading: isId ? '2. Fitur Transfer Antar Rekening' : '2. Inter-Account Transfers',
          text: isId 
            ? 'Klik "+ Transfer" untuk memindahkan uang dari Bank BCA ke E-Wallet GoPay. Saldo berpindah dengan presisi tanpa merusak statistik pemasukan/pengeluaran bersih.'
            : 'Click "+ Transfer" to move funds from BCA Bank to GoPay E-Wallet. Balances update accurately without altering net income/expense metrics.'
        }
      ]
    },
    {
      step: '06',
      title: isId ? 'Evaluasi & Membaca Laporan Keuangan' : 'Evaluating & Reading Financial Reports',
      subtitle: isId ? 'Menganalisis Kesehatan Arus Kas & Distribusi Pengeluaran' : 'Analyzing Cash Flow Health & Expense Distribution',
      icon: 'assessment',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      navTarget: 'reports',
      details: [
        {
          heading: isId ? '1. Laporan Arus Kas & Diagram Pie' : '1. Cash Flow & Category Pie Charts',
          text: isId 
            ? 'Buka menu "Laporan". Tinjau diagram donat untuk mengetahui proporsi pengeluaran terbesar (misal: 45% untuk Makanan, 20% Tagihan).'
            : 'Open "Reports". Review the donut chart to inspect your top spending categories (e.g. 45% Food, 20% Bills).'
        },
        {
          heading: isId ? '2. Indikator Rasio Kesehatan' : '2. Financial Health Ratios',
          text: isId 
            ? 'Periksa Cash Flow Health Score di Dashboard. Skor di atas 80% menandakan arus kas sehat dengan alokasi tabungan memadai.'
            : 'Check the Cash Flow Health Score on the Dashboard. A score above 80% indicates robust cash flow with healthy savings allocations.'
        }
      ]
    }
  ];

  const menuGuides = [
    {
      menu: 'Dashboard Utama',
      icon: 'dashboard',
      description: isId 
        ? 'Pusat kendali eksekutif yang menyajikan rangkuman total saldo, saldo bersih, indikator kesehatan finansial, grafik tren mingguan, dan jangkauan aksi cepat.'
        : 'Executive dashboard presenting total balance summary, net worth, financial health scores, weekly trend lines, and quick action shortcuts.',
      howToRead: [
        isId ? '1. Total Saldo: Gabungan dana aktif dari seluruh rekening bank dan e-wallet di workspace saat ini.' : '1. Total Balance: Combined active funds across all bank accounts and e-wallets in the active workspace.',
        isId ? '2. Indikator Kesehatan: Persentase efisiensi pengeluaran dibandingkan pemasukan (Idealnya pengeluaran < 70% dari pemasukan).' : '2. Health Indicator: Efficiency ratio comparing expense vs income (Ideally expense < 70% of total income).',
        isId ? '3. Widget Notifikasi: Peringatan dini jika ada tagihan belum dibayar atau amplop anggaran hampir habis.' : '3. Notification Widget: Early warning alerts for unpaid bills or depleted budget envelopes.'
      ]
    },
    {
      menu: 'Arus Kas (Cash Flow)',
      icon: 'swap_horiz',
      description: isId 
        ? 'Buku kas digital tempat mencatat seluruh pengeluaran, pemasukan, dan transfer antar dompet beserta histori riwayat lengkap.'
        : 'Digital cashbook for recording all expenses, incomes, and inter-account transfers with complete audit histories.',
      howToRead: [
        isId ? '1. Filter Tanggal & Kategori: Cari transaksi spesifik berdasarkan rentang waktu atau jenis kategori.' : '1. Date & Category Filters: Search specific transactions by timeframes or category types.',
        isId ? '2. Warna Transaksi: Merah menandakan Pengeluaran (-), Hijau Pemasukan (+), Biru Transfer (Netral).' : '2. Color Coding: Red indicates Expenses (-), Green Incomes (+), Blue Transfers (Neutral).',
        isId ? '3. Aksi Edit/Hapus: Klik icon pensil atau tong sampah pada baris transaksi untuk menyesuaikan data.' : '3. Edit/Delete Actions: Click pencil or trash icon on any transaction row to modify records.'
      ]
    },
    {
      menu: 'Anggaran (Budgeting)',
      icon: 'account_balance_wallet',
      description: isId 
        ? 'Modul Manajemen Amplop Anggaran (Envelope Budgeting) untuk disiplin batas pengeluaran bulanan.'
        : 'Envelope Budgeting module designed for strictly adhering to monthly spending constraints.',
      howToRead: [
        isId ? '1. Warna Progress Bar: Hijau (<75% terpakai = Aman), Kuning (75-90% = Waspada), Merah (>90% = Menipis/Overbudget).' : '1. Progress Bar Colors: Green (<75% used = Safe), Yellow (75-90% = Caution), Red (>90% = Danger/Overbudget).',
        isId ? '2. Batas Aman Belanja Harian: Rekomendasi nominal maksimal yang aman dibelanjakan hari ini agar anggaran cukup hingga akhir bulan.' : '2. Daily Safe Spend: Recommended maximum daily limit to ensure funds last until month-end.',
        isId ? '3. Alokasi Ulang: Klik "Edit Amplop" untuk menambah/mengurangi batas kuota anggaran.' : '3. Re-allocation: Click "Edit Envelope" to adjust allocation limits on the fly.'
      ]
    },
    {
      menu: 'Aset & Barang (Assets)',
      icon: 'home_work',
      description: isId 
        ? 'Modul inventarisasi kekayaan fisik dan finansial, termasuk rumah, kendaraan, rekening bank, logam mulia, dan piutang.'
        : 'Wealth and inventory management module covering physical property, vehicles, bank accounts, precious metals, and receivables.',
      howToRead: [
        isId ? '1. Total Net Worth: Total estimasi harga jual aset bersih setelah dikurangi liabilitas/utang.' : '1. Total Net Worth: Net estimated market value of all assets minus liabilities/debts.',
        isId ? '2. Depresiasi Otomatis: Nilai kendaraan/elektronik secara otomatis menyusut sesuai estimasi umur ekonomis.' : '2. Auto Depreciation: Vehicles/electronics automatically depreciate based on estimated economic lifespan.',
        isId ? '3. Likuiditas Aset: Aset diklasifikasikan menjadi Aset Lancar (Uang Kas/Bank) dan Aset Tetap (Properti/Barang).' : '3. Asset Liquidity: Assets categorized into Liquid Assets (Cash/Bank) and Fixed Assets (Property/Items).'
      ]
    },
    {
      menu: 'Tagihan & Langganan (Bills)',
      icon: 'receipt_long',
      description: isId 
        ? 'Pengelola kewajiban rutin bulanan/tahunan seperti PLN, PDAM, Indihome, BPJS, Spotify, Netflix, dan Cicilan.'
        : 'Manager for recurring monthly/yearly obligations like utilities, internet, insurance, streaming, and installments.',
      howToRead: [
        isId ? '1. Status Tagihan: Lunas (Hijau), Belum Dibayar (Kuning), Terlambat (Merah).' : '1. Bill Status: Paid (Green), Unpaid (Yellow), Overdue (Red).',
        isId ? '2. Total Kewajiban Bulanan: Menampilkan estimasi pengeluaran wajib yang harus dipersiapkan setiap bulan.' : '2. Total Monthly Liability: Summarizes required fixed expenses to allocate each month.',
        isId ? '3. Eksekusi Pembayaran: Klik "Bayar Sekarang" untuk memotong saldo dompet pilihan secara otomatis.' : '3. One-Click Payment: Click "Pay Now" to automatically deduct from selected wallet.'
      ]
    },
    {
      menu: 'Target Finansial (Goals)',
      icon: 'ads_click',
      description: isId 
        ? 'Perencana impian masa depan seperti Dana Darurat, Tabungan Rumah, Liburan, Pendidikan Anak, atau DP Kendaraan.'
        : 'Financial goal planner for emergency funds, house downpayments, vacations, education, or vehicle purchases.',
      howToRead: [
        isId ? '1. Persentase Pencapaian: Progress terkumpul dibanding target nominal impian.' : '1. Achievement Percentage: Accumulated funds vs target goal amount.',
        isId ? '2. Estimasi Waktu Selesai: Perhitungan bulan yang dibutuhkan berdasarkan rata-rata setoran bulanan Anda.' : '2. Estimated Completion: Projected remaining months based on your average monthly contribution rate.',
        isId ? '3. Setor Tabungan: Klik "+ Setor" untuk mentransfer sebagian saldo kas masuk ke alokasi target ini.' : '3. Deposit Funds: Click "+ Deposit" to allocate portion of cash reserves into this goal.'
      ]
    },
    {
      menu: 'Laporan & Analitik (Reports)',
      icon: 'assessment',
      description: isId 
        ? 'Pusat analisis data mendalam berisi grafik tren, diagram donat pengeluaran, perbandingan bulanan, dan evaluasi rasio keuangan.'
        : 'Deep analytical hub with trend graphs, expense breakdown pie charts, monthly comparisons, and financial ratios.',
      howToRead: [
        isId ? '1. Diagram Donat Kategori: Mengidentifikasi pos pengeluaran mana yang paling banyak menguras keuangan Anda.' : '1. Category Pie Chart: Pinpoints which spending categories consume the largest portion of your income.',
        isId ? '2. Rasio Tabungan (Savings Ratio): Persentase pendapatan yang berhasil ditabung (Target ideal minimal 20%).' : '2. Savings Ratio: Percentage of income successfully saved (Ideal target: minimum 20%).',
        isId ? '3. Ekspor Laporan: Mengunduh ringkasan transaksi atau mencetak laporan untuk arsip keluarga/bisnis.' : '3. Report Export: Download transaction summaries or print reports for family/business archives.'
      ]
    }
  ];

  const faqs = [
    {
      q: isId ? 'Bagaimana cara kerja Pemindaian Struk AI Gemini?' : 'How does Gemini AI Receipt Scanning work?',
      a: isId 
        ? 'Ketika Anda mengambil foto atau mengunggah gambar struk belanja, AI Gemini 3.6 Flash di server kami akan menganalisis teks visual. AI membaca nama merchant, total nominal akhir, tanggal belanja, dan secara cerdas memilih kategori pengeluaran yang paling cocok.'
        : 'When you take a photo or upload a receipt image, Gemini 3.6 Flash AI on our server analyzes visual text. The AI extracts the merchant name, total amount, transaction date, and intelligently categorizes the expense.'
    },
    {
      q: isId ? 'Apakah data transaksi saya aman?' : 'Is my transaction data secure?',
      a: isId 
        ? 'Ya. Data Anda disimpan dalam Cloud Firestore terenkripsi dengan aturan keamanan (Security Rules) berbasis otentikasi user. Anda juga dapat memasukkan PIN 6-digit di menu Pengaturan untuk mengunci layar aplikasi saat ditinggalkan.'
        : 'Yes. Your data is stored in encrypted Cloud Firestore with strict rule-based access controls. You can also set a 6-digit security PIN in Settings to lock your app screen.'
    },
    {
      q: isId ? 'Apa perbedaan Dompet Pribadi dan Dompet Keluarga?' : 'What is the difference between Personal and Family Wallet?',
      a: isId 
        ? 'Dompet Pribadi digunakan untuk mencatat pengeluaran pribadi sehari-hari. Dompet Keluarga dirancang untuk kebutuhan bersama (seperti belanja dapur rumah tangga, tagihan listrik rumah, sekolah anak) sehingga catatan tidak tercampur.'
        : 'Personal Wallet tracks day-to-day individual expenses. Family Wallet handles shared household budgets (groceries, home utilities, kids education) so records remain clean and separated.'
    },
    {
      q: isId ? 'Apakah transfer antar rekening mempengaruhi laporan pengeluaran?' : 'Do transfers between accounts affect expense reports?',
      a: isId 
        ? 'Tidak. Fitur Transfer bersifat netral. Memindahkan uang dari Bank BCA ke GoPay hanya mengubah posisi saldo aset Anda tanpa dihitung sebagai Pengeluaran ataupun Pemasukan baru.'
        : 'No. Transfers are neutral. Moving funds from Bank to E-Wallet updates asset distribution without counting as a new expense or income.'
    }
  ];

  const filteredMenuGuides = menuGuides.filter(m => 
    m.menu.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-primary/90 via-primary to-indigo-700 text-on-primary rounded-2xl p-8 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              {isId ? 'Panduan Pengguna Sistem (Functional Manual)' : 'System Functional User Manual'}
            </div>
            <h1 className="font-headline-lg md:font-display-md font-black tracking-tight mb-3">
              {isId ? 'Petunjuk Lengkap Harmoni Finansial' : 'Harmoni Finansial Complete User Guide'}
            </h1>
            <p className="font-body-md text-white/90 leading-relaxed">
              {isId 
                ? 'Panduan terstruktur langkah demi langkah untuk menguasai pengelolaan arus kas, master data, otomatisasi AI, hingga analisis laporan keuangan keluarga & bisnis.' 
                : 'Step-by-step structured manual covering cash flow management, master data configuration, AI automation, and financial reporting analysis.'}
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[220px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              {isId ? 'Pintasan Cepat' : 'Quick Navigation'}
            </span>
            <button 
              onClick={() => setActiveTab('step_by_step')}
              className="text-left text-xs font-bold py-1.5 px-3 rounded-lg bg-white text-primary hover:bg-white/90 transition-colors flex items-center justify-between"
            >
              <span>{isId ? ' Alur Step by Step' : ' Step-by-Step Flow'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports_guide')}
              className="text-left text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-white/20 text-white transition-colors flex items-center justify-between"
            >
              <span>{isId ? ' Cara Membaca Laporan' : ' How to Read Reports'}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant pb-2">
        <button
          onClick={() => setActiveTab('step_by_step')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'step_by_step'
              ? 'bg-primary text-on-primary shadow-sm font-extrabold'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
          {isId ? '1. Alur Step-by-Step' : '1. Step-by-Step Flow'}
        </button>

        <button
          onClick={() => setActiveTab('per_menu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'per_menu'
              ? 'bg-primary text-on-primary shadow-sm font-extrabold'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">widgets</span>
          {isId ? '2. Panduan Per-Menu' : '2. Menu-by-Menu Guide'}
        </button>

        <button
          onClick={() => setActiveTab('ai_scanner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'ai_scanner'
              ? 'bg-primary text-on-primary shadow-sm font-extrabold'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          {isId ? '3. Scan Struk AI Gemini' : '3. Gemini AI Scanner'}
        </button>

        <button
          onClick={() => setActiveTab('reports_guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'reports_guide'
              ? 'bg-primary text-on-primary shadow-sm font-extrabold'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          {isId ? '4. Analisis Laporan' : '4. Reports Analytics'}
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-primary text-on-primary shadow-sm font-extrabold'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          {isId ? '5. Tanya Jawab (FAQ)' : '5. FAQ'}
        </button>
      </div>

      {/* TAB 1: STEP BY STEP FLOW */}
      {activeTab === 'step_by_step' && (
        <section className="space-y-6">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-on-surface font-extrabold mb-1">
                {isId ? 'Siklus Operasional Keuangan Ideal (End-to-End Workflow)' : 'Ideal Financial Operations Cycle'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {isId 
                  ? 'Ikuti 6 langkah berurutan di bawah ini dari setup awal master data hingga evaluasi bulanan untuk mencapai transparansi keuangan maksimal.' 
                  : 'Follow the 6 sequential steps below from setup to monthly evaluation for total financial transparency.'}
              </p>
            </div>
            <div className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg shrink-0">
              {isId ? 'SOP Terstandarisasi' : 'Standardized SOP'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stepsList.map((st, idx) => (
              <div 
                key={idx}
                className="bg-surface border border-outline-variant rounded-2xl p-6 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between shadow-sm relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black font-mono text-outline-variant/80 group-hover:text-primary transition-colors">
                      {st.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${st.color}`}>
                      <span className="material-symbols-outlined text-[22px]">{st.icon}</span>
                    </div>
                  </div>

                  <h4 className="font-headline-xs text-on-surface font-extrabold mb-1">
                    {st.title}
                  </h4>
                  <p className="text-xs font-semibold text-primary mb-4">
                    {st.subtitle}
                  </p>

                  <div className="space-y-3 pt-3 border-t border-outline-variant/60 mb-6">
                    {st.details.map((dt, dIdx) => (
                      <div key={dIdx} className="text-xs space-y-1">
                        <span className="font-bold text-on-surface block">{dt.heading}</span>
                        <p className="text-on-surface-variant leading-relaxed">{dt.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate(st.navTarget)}
                    className="w-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isId ? 'Buka Menu Terkait' : 'Open Related View'}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: PANDUAN PER MENU */}
      {activeTab === 'per_menu' && (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? 'Cari panduan menu...' : 'Search menu guide...'}
                className="w-full pl-10 pr-4 py-2 bg-surface rounded-xl text-xs font-medium text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              {isId ? `Menampilkan ${filteredMenuGuides.length} Modul Fitur` : `Showing ${filteredMenuGuides.length} Feature Modules`}
            </span>
          </div>

          <div className="space-y-4">
            {filteredMenuGuides.map((mg, idx) => (
              <div 
                key={idx} 
                className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">{mg.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-on-surface font-black mb-1">{mg.menu}</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{mg.description}</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4">
                  <h5 className="text-xs font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    {isId ? 'Cara Membaca & Memahami Data Menu Ini:' : 'How to Read & Understand Data in This Menu:'}
                  </h5>
                  <ul className="space-y-1.5">
                    {mg.howToRead.map((line, lIdx) => (
                      <li key={lIdx} className="text-xs text-on-surface font-medium leading-relaxed flex items-start gap-2">
                        <span className="text-primary font-bold shrink-0">•</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: AI SCANNER GUIDE */}
      {activeTab === 'ai_scanner' && (
        <section className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/20 via-primary/10 to-blue-900/20 border border-primary/30 rounded-2xl p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-primary text-on-primary rounded-3xl flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                <span className="material-symbols-outlined text-[48px]">auto_awesome</span>
              </div>
              <div>
                <span className="bg-primary text-on-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-2 inline-block">
                  Gemini 3.6 Flash Integration
                </span>
                <h3 className="font-headline-md text-on-surface font-black mb-2">
                  {isId ? 'Panduan Pemindaian Struk Belanja AI' : 'AI Receipt Scanning Manual'}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
                  {isId 
                    ? 'Aplikasi Harmoni Finansial dilengkapi dengan model kecerdasan buatan Gemini 3.6 Flash di sisi server. Fitur ini membaca gambar struk belanja fisik dari supermarket, kafe, apotek, maupun pom bensin secara otomatis.'
                    : 'Harmoni Finansial integrates Gemini 3.6 Flash AI server-side to automatically scan physical receipt images from supermarkets, cafes, pharmacies, and gas stations.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-bold">1</div>
              <h4 className="font-headline-xs text-on-surface font-extrabold">{isId ? 'Buka Form Transaksi' : 'Open Transaction Form'}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Klik tombol "+ Transaksi" di bagian bawah atau di menu Arus Kas, lalu perhatikan box bagian atas bertuliskan "Input Transaksi Otomatis (AI)".'
                  : 'Click "+ Transaction" at the bottom or in Cash Flow view, then locate the top box labeled "AI Automatic Transaction Input".'}
              </p>
            </div>

            <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center font-bold">2</div>
              <h4 className="font-headline-xs text-on-surface font-extrabold">{isId ? 'Foto atau Unggah Struk' : 'Capture or Upload'}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Klik "Gunakan Kamera" untuk membidik foto struk secara langsung atau "Upload Foto" jika struk berada di galeri HP/Komputer Anda.'
                  : 'Click "Use Camera" to capture the receipt live or "Upload Photo" to select an image from your device.'}
              </p>
            </div>

            <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-bold">3</div>
              <h4 className="font-headline-xs text-on-surface font-extrabold">{isId ? 'Hasil Otomatis Terisi' : 'Auto-Filled Form'}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Dalam hitungan detik, AI mengestrak Total Bayar, Kategori Belanja, Deskripsi Merchant, dan Tanggal. Anda tinggal memeriksa & menyimpan.'
                  : 'In seconds, AI extracts Total Amount, Spending Category, Merchant Description, and Date. Review and click Save.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: REPORTS GUIDE */}
      {activeTab === 'reports_guide' && (
        <section className="space-y-6">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 space-y-4">
            <h3 className="font-headline-sm text-on-surface font-extrabold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">analytics</span>
              {isId ? 'Panduan Membaca Laporan Keuangan per Indikator' : 'Financial Report Indicator Analysis'}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isId 
                ? 'Laporan keuangan Harmoni Finansial disusun agar mudah dipahami oleh seluruh anggota keluarga tanpa latar belakang akuntansi.'
                : 'Harmoni Finansial reports are designed for effortless comprehension by any family member without an accounting background.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  {isId ? '1. Net Cash Flow (Pemasukan Bersih)' : '1. Net Cash Flow'}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isId 
                    ? 'Dihitung dari (Total Pemasukan - Total Pengeluaran). Nilai positif (+/Hijau) menandakan Anda surplus keuangan bulan ini.'
                    : 'Calculated as (Total Income - Total Expenses). A positive value (+/Green) means you achieved a financial surplus this month.'}
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  {isId ? '2. Rasio Efisiensi Anggaran' : '2. Budget Efficiency Ratio'}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isId 
                    ? 'Persentase total pengeluaran riil dibandingkan total batas amplop anggaran yang ditetapkan. Batas aman berada di angka < 85%.'
                    : 'Percentage of actual total expenses compared to defined envelope budgets. Safe threshold is below 85%.'}
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  {isId ? '3. Pertumbuhan Net Worth' : '3. Net Worth Growth'}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isId 
                    ? 'Perubahan total nilai aset fisik dan tabungan tunai dari waktu ke waktu setelah dikurangi penyusutan harga dan kewajiban.'
                    : 'Cumulative changes in physical asset value and liquid cash reserves over time net of depreciation.'}
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  {isId ? '4. Health Score (Skor Kesehatan)' : '4. Financial Health Score'}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {isId 
                    ? 'Skor komposit 0 - 100% yang menilai keseimbangan antara konsumsi harian, tabungan impian, dan ketepatan membayar tagihan.'
                    : 'Composite score (0-100%) evaluating balance between daily consumption, savings progress, and bill payment punctuality.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: FAQ */}
      {activeTab === 'faq' && (
        <section className="space-y-4">
          <h3 className="font-headline-sm text-on-surface font-extrabold mb-2">
            {isId ? 'Pertanyaan yang Sering Diajukan (FAQ)' : 'Frequently Asked Questions'}
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-surface border border-outline-variant rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`material-symbols-outlined text-primary transition-transform duration-200 ${expandedFaq === idx ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </button>

                {expandedFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/40 bg-surface-container-lowest">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
