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
      title: isId ? 'Setup Workspace & Scope Akses' : 'Setup Workspaces & Access Scope',
      subtitle: isId ? 'Pemisahan Transparan Keuangan Pribadi & Keluarga' : 'Transparent Separation of Personal & Family Finances',
      icon: 'account_balance_wallet',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      navTarget: 'dashboard',
      details: [
        {
          heading: isId ? '1. Memilih Workspace Active & Scope' : '1. Workspace Selector & Scope Filtering',
          text: isId 
            ? 'Gunakan Workspace Switcher di sidebar/header untuk memilih workspace aktif (Pribadi / Keluarga) atau manfaatkan filter "Semua Workspace" di setiap menu untuk melihat gabungan data secara komprehensif.'
            : 'Use the Workspace Switcher in the sidebar or header to select active workspace (Personal / Family) or use the "All Workspaces" filter in views to review consolidated data.'
        },
        {
          heading: isId ? '2. Pemisahan Data Terisolasi' : '2. Isolated Data Architecture',
          text: isId 
            ? 'Setiap transaksi, rekening bank, barang aset, amplop anggaran, dan tagihan memiliki label workspace sehingga laporan keuangan tidak saling tumpang tindih.'
            : 'Every transaction, bank account, physical asset, envelope budget, and bill carries a workspace label to maintain complete separation.'
        }
      ]
    },
    {
      step: '02',
      title: isId ? 'Konfigurasi Rekening Kas & Aset Fisik' : 'Bank Accounts & Physical Assets Setup',
      subtitle: isId ? 'Mendata Kas Likuid & Inventaris Barang Properti' : 'Registering Liquid Cash Accounts & Property Assets',
      icon: 'home_work',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      navTarget: 'settings',
      details: [
        {
          heading: isId ? '1. Rekening Bank & E-Wallet (Aset Likuid Kas)' : '1. Bank & E-Wallet Accounts (Liquid Cash)',
          text: isId 
            ? 'Daftarkan rekening BCA, Mandiri, e-Wallet GoPay/OVO, atau kas tunai di Pengaturan / Menu Rekening. Setiap rekening menyimpan nomor rekening, nama pemilik, saldo awal, dan scope workspace.'
            : 'Register bank accounts, e-wallets, or cash balances in Settings/Accounts. Store account numbers, holder names, current balances, and workspace scopes.'
        },
        {
          heading: isId ? '2. Pendataan Barang Properti & Depresiasi' : '2. Property Assets & Auto Depreciation',
          text: isId 
            ? 'Di menu "Aset & Barang", daftarkan tanah, bangunan, kendaraan, atau perhiasan. Sistem menghitung estimasi depresiasi (penyusutan nilai) otomatis dari harga beli awal hingga nilai pasar saat ini.'
            : 'In "Assets & Goods", register land, buildings, vehicles, or valuables. The app automatically calculates depreciation from purchase price to current market value.'
        }
      ]
    },
    {
      step: '03',
      title: isId ? 'Amplop Anggaran (Envelope Budgeting)' : 'Envelope Budgeting Setup',
      subtitle: isId ? 'Batas Maksimal Belanja Bulanan & Safe Spend' : 'Monthly Spending Limits & Daily Safe Spend',
      icon: 'savings',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      navTarget: 'budgeting',
      details: [
        {
          heading: isId ? '1. Membuat Amplop Pos Anggaran' : '1. Creating Budget Envelopes',
          text: isId 
            ? 'Masuk ke menu "Anggaran" -> klik "+ Tambah Amplop". Tentukan nama kategori (misal: Belanja Dapur) dan alokasi batas maksimal pengeluaran bulanan.'
            : 'Navigate to "Budgeting" -> click "+ Add Envelope". Specify category name (e.g. Groceries) and maximum monthly allocation limit.'
        },
        {
          heading: isId ? '2. Pemantauan Real-Time & Safespend' : '2. Real-Time Tracking & Daily Safe Spend',
          text: isId 
            ? 'Sistem secara otomatis memotong kuota amplop setiap kali ada transaksi pengeluaran pada kategori tersebut dan menghitung batas belanja harian yang aman.'
            : 'The app automatically deducts from the envelope quota on relevant expenses and calculates recommended daily safe spend limits.'
        }
      ]
    },
    {
      step: '04',
      title: isId ? 'Master Tagihan & Pengingat Rutin' : 'Bills & Recurring Obligations',
      subtitle: isId ? 'Mencatat Listrik, Internet, Cicilan, & Eksekusi Bayar' : 'Tracking Utilities, Subscriptions, Loans & Payments',
      icon: 'receipt_long',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      navTarget: 'bills',
      details: [
        {
          heading: isId ? '1. Mendaftarkan Tagihan Rutin' : '1. Registering Recurring Bills',
          text: isId 
            ? 'Buka menu "Tagihan" -> klik "+ Tambah Tagihan". Catat nama layanan (PLN, Indihome, BPJS), nominal, tanggal jatuh tempo, dan opsi frekuensi.'
            : 'Open "Bills" -> click "+ Add Bill". Record vendor name, amount, monthly due date, and frequency options.'
        },
        {
          heading: isId ? '2. Pengingat & Eksekusi Bayar Langsung' : '2. Reminders & One-Click Payment',
          text: isId 
            ? 'Sistem menandai tagihan mendekati jatuh tempo dengan badge status. Klik "Bayar Sekarang" untuk memotong saldo rekening pilihan dan mencatat transaksi kas keluar otomatis.'
            : 'Status badges highlight upcoming bills. Click "Pay Now" to deduct from your chosen bank account and automatically log the cash outflow.'
        }
      ]
    },
    {
      step: '05',
      title: isId ? 'Operasional Arus Kas & Pemindaian Struk AI' : 'Daily Cash Flow & Gemini AI Scanner',
      subtitle: isId ? 'Input Manual, Scan Struk Belanja, & Transfer Rekening' : 'Manual Entry, AI Receipt Scanning, & Account Transfer',
      icon: 'center_focus_strong',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      navTarget: 'cash-flow',
      details: [
        {
          heading: isId ? '1. Pemindaian Struk AI Gemini 3.6 Flash' : '1. Gemini 3.6 Flash AI Scanning',
          text: isId 
            ? 'Klik "+ Transaksi" -> pilih "Input Otomatis (AI)". Foto/unggah struk belanja dari supermarket atau restoran. AI Gemini akan membaca total nominal, tanggal, merchant, dan kategori secara presisi.'
            : 'Click "+ Transaction" -> select "AI Automatic Input". Capture or upload a receipt image. Gemini AI automatically parses total amount, date, merchant, and category.'
        },
        {
          heading: isId ? '2. Fitur Transfer Antar Rekening' : '2. Inter-Account Fund Transfers',
          text: isId 
            ? 'Klik "+ Transfer" untuk memindahkan dana (misal dari Rekening BCA ke GoPay). Pemindahan dana ini memperbarui saldo kedua rekening secara akurat tanpa merusak laporan arus kas bersih.'
            : 'Click "+ Transfer" to shift funds (e.g., Bank BCA to GoPay). Balance updates immediately across both accounts without impacting net income/expense stats.'
        }
      ]
    },
    {
      step: '06',
      title: isId ? 'Laporan, Ekspor Backup, & Log Aktivitas' : 'Reports, Offline Backup, & Audit Logs',
      subtitle: isId ? 'Ekspor CSV/JSON, Cetak Laporan, & Audit Trail' : 'Export CSV/JSON, Print Statements, & Action Logs',
      icon: 'assessment',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      navTarget: 'reports',
      details: [
        {
          heading: isId ? '1. Ekspor Cadangan Data Offline (CSV & JSON)' : '1. Offline Backup Export (CSV & JSON)',
          text: isId 
            ? 'Di menu "Laporan", Anda dapat mengekspor cadangan lengkap mencakup Rekening Kas Likuid, Aset Fisik, Arus Kas, dan Amplop Anggaran dalam format CSV atau JSON sesuai workspace filter.'
            : 'In "Reports", export a complete offline backup encompassing Liquid Cash Accounts, Physical Assets, Cash Flow, and Budget Envelopes in CSV or JSON.'
        },
        {
          heading: isId ? '2. Cetak Dokumen Laporan & Audit Trail' : '2. Print PDF Reports & Activity Audit Trail',
          text: isId 
            ? 'Cetak Laporan Eksekutif dalam format PDF resmi atau periksa menu "Log Aktivitas" untuk melacak seluruh histori pembuatan, pembaruan, dan pemulihan data.'
            : 'Print executive PDF statements or review "Activity Log" to audit all data creation, updates, and undo restorations.'
        }
      ]
    }
  ];

  const menuGuides = [
    {
      menu: isId ? 'Dashboard Utama' : 'Executive Dashboard',
      icon: 'dashboard',
      description: isId 
        ? 'Pusat ringkasan eksekutif yang menampilkan Total Saldo Kas Likuid, Nilai Aset Fisik, Total Net Worth, indikator Kesehatan Arus Kas, peringatan anggaran, dan akses transaksi cepat.'
        : 'Executive dashboard showcasing Total Liquid Cash, Physical Asset Values, Total Net Worth, Cash Flow Health score, budget warnings, and quick shortcuts.',
      howToRead: [
        isId ? '1. Kas Likuid Bank/E-Wallet: Gabungan saldo tunai aktif di seluruh rekening bank dan e-wallet.' : '1. Liquid Cash: Sum of active funds across all bank accounts and e-wallet balances.',
        isId ? '2. Total Net Worth: Gabungan kas likuid ditambah total nilai pasar aset/barang fisik saat ini.' : '2. Total Net Worth: Combined liquid cash plus current market valuation of physical assets.',
        isId ? '3. Health Score & Alerts: Indikator efisiensi belanja bulanan serta peringatan tagihan mendekati jatuh tempo.' : '3. Health Score & Alerts: Monthly spending efficiency ratio and upcoming bill alerts.'
      ]
    },
    {
      menu: isId ? 'Arus Kas (Cash Flow)' : 'Cash Flow',
      icon: 'swap_horiz',
      description: isId 
        ? 'Catatan buku kas digital lengkap untuk mencatat pengeluaran, pemasukan, dan transfer antar rekening beserta fitur pencarian dan filter scope workspace.'
        : 'Digital cashbook for recording expenses, incomes, and inter-account transfers with search, category filter, and workspace scope selection.',
      howToRead: [
        isId ? '1. Filter Scope Workspace: Bebas berganti antara "Semua Workspace", "Keluarga", atau "Pribadi".' : '1. Workspace Scope Filter: Switch between "All Workspaces", "Family", or "Personal".',
        isId ? '2. Pencarian & Filter Tipe: Filter cepat berdasarkan kata kunci deskripsi, kategori, atau tipe transaksi (Pemasukan/Pengeluaran).' : '2. Search & Type Filters: Filter instantly by keywords, categories, or transaction types.',
        isId ? '3. Pengodean Warna: Hijau untuk Pemasukan (+), Merah untuk Pengeluaran (-), dan Biru untuk Transfer antar rekening.' : '3. Color Coding: Green for Income (+), Red for Expenses (-), and Blue for Transfers.'
      ]
    },
    {
      menu: isId ? 'Anggaran (Budgeting)' : 'Envelope Budgeting',
      icon: 'account_balance_wallet',
      description: isId 
        ? 'Modul Manajemen Amplop Anggaran (Envelope Budgeting) untuk menjaga batas belanja bulanan dan memantau sisa kuota aman harian.'
        : 'Envelope Budgeting module designed to enforce monthly spending limits and monitor daily safe spend allocations.',
      howToRead: [
        isId ? '1. Progress Bar Kuota: Indikator visual tingkat penyerapan anggaran per kategori (Hijau < 75%, Kuning 75-90%, Merah > 90%).' : '1. Progress Bar: Visual envelope utilization level (Green < 75%, Yellow 75-90%, Red > 90%).',
        isId ? '2. Batas Belanja Harian (Safe Spend): Estimasi batas nominal maksimal yang aman dihabiskan per hari.' : '2. Daily Safe Spend: Recommended maximum daily limit to prevent early envelope depletion.',
        isId ? '3. Filter Scope Workspace: Menampilkan amplop anggaran khusus workspace Keluarga, Pribadi, atau Semua.' : '3. Workspace Filter: View budget envelopes specifically for Family, Personal, or All workspaces.'
      ]
    },
    {
      menu: isId ? 'Aset & Barang (Assets)' : 'Physical Assets & Goods',
      icon: 'home_work',
      description: isId 
        ? 'Modul inventarisasi fisik barang, tanah, bangunan, kendaraan, dan barang berharga lengkap dengan harga beli, nilai pasar saat ini, dan kalkulasi depresiasi.'
        : 'Inventory module for land, property, vehicles, and valuables with purchase cost, current market value, and automatic depreciation math.',
      howToRead: [
        isId ? '1. Total Nilai Aset Fisik: Menjumlahkan nilai estimasi pasar seluruh barang fisik milik Anda.' : '1. Total Asset Value: Sum of current estimated market valuation of all physical property.',
        isId ? '2. Depresiasi Otomatis: Nilai barang disesuaikan dari waktu ke waktu sesuai tanggal pembelian dan kondisi.' : '2. Auto Depreciation: Asset values depreciate over time based on acquisition date and condition.',
        isId ? '3. Opsi Status Aset: Menandai barang aktif ("Tersimpan/Dimiliki") atau barang yang sudah "Dijual/Dilepas".' : '3. Asset Status: Mark items as "Owned" or "Sold/Disposed".'
      ]
    },
    {
      menu: isId ? 'Tagihan & Langganan (Bills)' : 'Bills & Subscriptions',
      icon: 'receipt_long',
      description: isId 
        ? 'Pengelola kewajiban rutin bulanan/tahunan seperti PLN, PDAM, Internet, BPJS, streaming, dan cicilan lengkap dengan pengingat jatuh tempo.'
        : 'Manager for recurring obligations like utilities, internet, insurance, streaming, and loans with due date alerts.',
      howToRead: [
        isId ? '1. Badge Status Jatuh Tempo: Lunas (Hijau), Belum Dibayar (Kuning), Terlambat (Merah).' : '1. Status Badges: Paid (Green), Unpaid (Yellow), Overdue (Red).',
        isId ? '2. Eksekusi "Bayar Sekarang": Langsung memotong saldo rekening bank/e-wallet dan mencatat transaksi kas keluar.' : '2. "Pay Now" Execution: Immediately deducts from selected bank account and logs transaction.',
        isId ? '3. Filter Scope Workspace: Memisahkan daftar tagihan antara kebutuhan Pribadi dan Rumah Tangga/Keluarga.' : '3. Workspace Filter: Separates bill lists between Personal and Family obligations.'
      ]
    },
    {
      menu: isId ? 'Target Finansial (Goals)' : 'Financial Goals',
      icon: 'ads_click',
      description: isId 
        ? 'Perencana impian tabungan masa depan seperti Dana Darurat, DP Rumah, Liburan, Pendidikan Anak, atau DP Kendaraan.'
        : 'Goal planner for emergency funds, house downpayments, vacations, education, or vehicle purchases.',
      howToRead: [
        isId ? '1. Progress Bar Tabungan: Persentase saldo terkumpul dibandingkan dengan target nominal impian.' : '1. Savings Progress: Accumulated percentage against total target amount.',
        isId ? '2. Proyeksi Waktu Selesai: Perhitungan estimasi bulan yang dibutuhkan berdasarkan kecepatan setoran Anda.' : '2. Estimated Timeline: Projected completion months based on set contribution rate.',
        isId ? '3. Fitur "+ Setor": Alokasikan kas masuk secara bertahap menuju target impian Anda.' : '3. "+ Deposit" Action: Transfer funds directly towards your savings target.'
      ]
    },
    {
      menu: isId ? 'Laporan & Ekspor Backup (Reports)' : 'Reports & Offline Backup',
      icon: 'assessment',
      description: isId 
        ? 'Pusat laporan eksekutif dengan grafik tren arus kas, diagram donat pengeluaran, pratinjau PDF cetak, dan ekspor cadangan data offline (CSV & JSON).'
        : 'Executive analytics hub with cash flow trend charts, expense pie charts, printable PDF statement, and offline data backup exports (CSV & JSON).',
      howToRead: [
        isId ? '1. Ringkasan Eksekutif: Rincian Kas Likuid Bank, Aset Fisik, Total Kekayaan (Net Worth), dan Tabungan Bersih.' : '1. Executive Summary: Breakdown of Liquid Cash, Physical Assets, Total Net Worth, and Net Savings.',
        isId ? '2. Ekspor Cadangan Offline: Unduh data dalam format CSV (tabel spreadsheet) atau JSON (data utuh) lengkap dengan filter scope.' : '2. Offline Backup Export: Download records as CSV spreadsheets or structured JSON backup files.',
        isId ? '3. Pratinjau Dokumen PDF: Pratinjau cetak resmi Laporan Keuangan untuk arsip pribadi atau dokumen keluarga.' : '3. PDF Document Preview: Clean official statement layout ready for printing or digital archive.'
      ]
    },
    {
      menu: isId ? 'Log Aktivitas & Keamanan (Audit Trail & Security)' : 'Activity Log & Security',
      icon: 'history',
      description: isId 
        ? 'Halaman histori audit lengkap yang mencatat seluruh aksi pengguna (tambah, edit, hapus, bayar tagihan, transfer) serta pengunci PIN 6-digit.'
        : 'Complete audit log view tracking every user action (create, edit, delete, bill pay, transfer) alongside 6-digit PIN app lock.',
      howToRead: [
        isId ? '1. Audit Trail Lengkap: Setiap perubahan data dicatat lengkap dengan timestamp, tipe aksi, dan detail entitas.' : '1. Complete Audit Trail: Tracks every record change with timestamps, action types, and details.',
        isId ? '2. Fitur Urungkan (Undo / Restore): Kembalikan data yang tidak sengaja terhapus dengan satu klik dari log aktivitas.' : '2. Undo / Restore Feature: Easily restore accidentally deleted records directly from the activity log.',
        isId ? '3. Keamanan Keuangan (PIN Lock): Aktifkan pengunci layar 6-digit di menu Pengaturan untuk menjaga privasi data.' : '3. Security PIN Lock: Enable 6-digit screen lock in Settings to guard sensitive financial data.'
      ]
    }
  ];

  const faqs = [
    {
      q: isId ? 'Bagaimana cara kerja Pemindaian Struk AI Gemini 3.6 Flash?' : 'How does Gemini 3.6 Flash AI Receipt Scanning work?',
      a: isId 
        ? 'Ketika Anda mengambil foto atau mengunggah gambar struk belanja, model AI Gemini 3.6 Flash di server kami akan menganalisis teks visual. AI membaca nama merchant, total nominal akhir, tanggal belanja, dan secara cerdas memilih kategori pengeluaran yang paling sesuai.'
        : 'When you capture or upload a receipt image, server-side Gemini 3.6 Flash AI analyzes the visual text. The AI extracts merchant name, total amount, transaction date, and intelligently assigns the matching spending category.'
    },
    {
      q: isId ? 'Apa perbedaan Rekening Bank/E-Wallet (Kas Likuid) dan Aset & Barang (Aset Fisik)?' : 'What is the difference between Bank/E-Wallet (Liquid Cash) and Assets & Goods (Physical Assets)?',
      a: isId 
        ? 'Rekening Bank & E-Wallet adalah tempat penyimpanan uang tunai cair (seperti BCA, Mandiri, GoPay, OVO, Cash) yang digunakan langsung untuk transaksi harian. Sedangkan Aset & Barang adalah inventaris kekayaan fisik (seperti tanah, rumah, mobil, laptop, perhiasan) yang nilainya dapat mengalami depresiasi atau apresiasi pasar.'
        : 'Bank Accounts & E-Wallets store liquid cash reserves (BCA, Mandiri, GoPay, OVO, Cash) used directly for daily transactions. Assets & Goods store physical inventory (land, homes, cars, laptops, jewelry) subject to market value changes or depreciation.'
    },
    {
      q: isId ? 'Bagaimana cara menggunakan filter Scope Workspace (Semua Workspace, Keluarga, Pribadi)?' : 'How does the Workspace Scope Filter work (All Workspaces, Family, Personal)?',
      a: isId 
        ? 'Di bagian atas setiap halaman (Arus Kas, Anggaran, Tagihan, Target, Aset, Laporan), Anda dapat mengeklik tombol switch filter workspace. Opsi "Semua Workspace" menggabungkan seluruh catatan data dari Dompet Pribadi dan Dompet Keluarga tanpa perlu berganti-ganti workspace.'
        : 'At the top of each view (Cash Flow, Budgeting, Bills, Goals, Assets, Reports), click the workspace scope switcher. Selecting "All Workspaces" aggregates data from both Personal and Family wallets into a unified view.'
    },
    {
      q: isId ? 'Bagaimana cara melakukan cadangan data offline (Offline Backup) & ekspor laporan?' : 'How to export offline data backups and financial statements?',
      a: isId 
        ? 'Buka menu "Laporan", lalu scroll ke bagian "Ekspor Laporan & Cadangan Data". Pilih bulan, tahun, scope workspace, serta jenis data yang ingin disertakan (Rekening Kas Likuid, Aset Fisik, Arus Kas, Amplop Anggaran). Pilih format CSV (untuk Excel/Spreadsheet) atau JSON (cadangan aplikasi), lalu klik Unduh.'
        : 'Navigate to "Reports" -> scroll to "Export Statement & Backup". Choose month, year, workspace scope, and dataset checkboxes (Liquid Cash Accounts, Physical Assets, Cash Flow, Budget Envelopes). Download in CSV spreadsheet or full JSON format.'
    },
    {
      q: isId ? 'Bagaimana jika saya tidak sengaja menghapus data transaksi atau aset?' : 'What if I accidentally delete a transaction or asset record?',
      a: isId 
        ? 'Buka menu "Log Aktivitas". Semua tindakan seperti penambahan, pembaruan, dan penghapusan tersimpan dengan rapi. Cari catatan tindakan yang dihapus, lalu klik tombol "Urungkan / Pulihkan" untuk mengembalikan data tersebut secara instan.'
        : 'Open the "Activity Log" view. Every creation, edit, and deletion is recorded. Locate the deleted action entry and click the "Undo / Restore" button to instantly recover the record.'
    },
    {
      q: isId ? 'Apakah data transaksi saya aman dan bisa dikunci dengan PIN?' : 'Is my financial data secure and protected with a PIN lock?',
      a: isId 
        ? 'Ya. Data Anda disimpan secara terenkripsi di Firestore. Selain itu, Anda dapat mengaktifkan opsi "Keamanan PIN 6-Digit" di menu Pengaturan. Setiap kali aplikasi dibuka atau ditinggalkan, layar pengunci PIN akan muncul untuk menjaga privasi keuangan Anda.'
        : 'Yes. Data is securely stored in encrypted Firestore. Furthermore, enable "6-Digit Security PIN" in Settings. The app will prompt for the PIN whenever opened to safeguard your financial privacy.'
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
              {isId ? 'Panduan Pengguna Sistem & Pusat Bantuan' : 'System User Guide & Help Center'}
            </div>
            <h1 className="font-headline-lg md:font-display-md font-black tracking-tight mb-3">
              {isId ? 'Petunjuk Lengkap Harmoni Finansial' : 'Harmoni Finansial Complete User Manual'}
            </h1>
            <p className="font-body-md text-white/90 leading-relaxed">
              {isId 
                ? 'Panduan terstruktur langkah demi langkah untuk menguasai pengelolaan arus kas, master data rekening & aset, otomatisasi AI Gemini, hingga analisis laporan keuangan & ekspor cadangan data.' 
                : 'Step-by-step structured manual covering cash flow tracking, bank accounts & physical assets, Gemini AI automation, reporting analytics, and offline data backups.'}
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
          {isId ? '4. Laporan & Backup' : '4. Reports & Backup'}
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
                  ? 'Ikuti 6 langkah berurutan di bawah ini dari setup awal master data hingga evaluasi bulanan dan pencadangan data untuk akurasi finansial maksimal.' 
                  : 'Follow the 6 sequential steps below from setup to monthly evaluation and offline backups for complete accuracy.'}
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