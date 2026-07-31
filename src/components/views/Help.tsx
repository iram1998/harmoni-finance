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
            ? 'Setiap transaksi, rekening bank, barang aset, utang/piutang, amplop anggaran, dan tagihan memiliki label workspace sehingga laporan keuangan tidak saling tumpang tindih.'
            : 'Every transaction, bank account, physical asset, debt, envelope budget, and bill carries a workspace label to maintain complete separation.'
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
            ? 'Daftarkan rekening BCA, Mandiri, e-Wallet GoPay/OVO, atau kas tunai di Pengaturan / Menu Rekening. Setiap rekening menyimpan nomor rekening, nama pemilik, saldo awal, dan fitur rekonsiliasi kas.'
            : 'Register bank accounts, e-wallets, or cash balances in Settings/Accounts. Store account numbers, holder names, current balances, and use cash reconciliation.'
        },
        {
          heading: isId ? '2. Pendataan Barang Properti & Depresiasi' : '2. Property Assets & Auto Depreciation',
          text: isId 
            ? 'Di menu "Aset & Barang", daftarkan tanah, bangunan, kendaraan, atau perhiasan. Sistem menghitung estimasi depresiasi (penyusutan nilai) serta konversi satuan Borongan (Kalsel) untuk tanah/lahan.'
            : 'In "Assets & Goods", register land, buildings, vehicles, or valuables. The app automatically calculates depreciation and traditional Borongan unit conversions for land.'
        }
      ]
    },
    {
      step: '03',
      title: isId ? 'Manajemen Utang & Piutang (Debts & Receivables)' : 'Debts & Receivables Management',
      subtitle: isId ? 'Pencatatan Kewajiban, Tagihan Piutang, & Pelunasan' : 'Tracking Liabilities, Receivables, & Installments',
      icon: 'account_balance',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      navTarget: 'debts',
      details: [
        {
          heading: isId ? '1. Mencatat Utang & Piutang Baru' : '1. Logging Debts & Receivables',
          text: isId 
            ? 'Buka menu "Utang & Piutang" -> klik "+ Tambah Utang / Piutang". Pilih jenis (Utang yang harus Anda bayar atau Piutang yang harus Anda tagih), nominal, pemberi/penerima pinjaman, dan tanggal jatuh tempo.'
            : 'Open "Debts & Receivables" -> click "+ Add Debt/Receivable". Select type (Debt owed by you or Receivable owed to you), total amount, counterparty, and due date.'
        },
        {
          heading: isId ? '2. Pelunasan Bertahap & Mutasi Rekening' : '2. Installments & Automatic Account Balance Update',
          text: isId 
            ? 'Klik "+ Catat Pelunasan" pada entitas utang/piutang. Membayar utang akan memotong saldo rekening pilihan, sedangkan menerima pelunasan piutang akan menambah saldo rekening secara otomatis.'
            : 'Click "+ Log Payment" on any record. Paying a debt automatically deducts from your bank account, while receiving a receivable payment increases your account balance.'
        }
      ]
    },
    {
      step: '04',
      title: isId ? 'Amplop Anggaran & Tagihan Rutin' : 'Envelope Budgeting & Recurring Bills',
      subtitle: isId ? 'Batas Belanja Bulanan, Safe Spend, & Pengingat PLN/BPJS' : 'Spending Limits, Daily Safe Spend, & Bill Reminders',
      icon: 'savings',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      navTarget: 'budgeting',
      details: [
        {
          heading: isId ? '1. Membagi Kuota Amplop Anggaran' : '1. Allocating Envelope Budgets',
          text: isId 
            ? 'Di menu "Anggaran", buat amplop batas pengeluaran per kategori. Sistem menghitung batas belanja harian aman (Daily Safe Spend) agar anggaran tidak habis sebelum akhir bulan.'
            : 'In "Budgeting", create envelope monthly limits per category. The app calculates Daily Safe Spend targets to prevent overspending.'
        },
        {
          heading: isId ? '2. Pengingat & Eksekusi Bayar Tagihan' : '2. Bill Reminders & One-Click Payments',
          text: isId 
            ? 'Di menu "Tagihan", daftarkan PLN, Indihome, BPJS, atau cicilan. Klik "Bayar Sekarang" untuk memotong saldo rekening dan mencatat transaksi kas keluar otomatis.'
            : 'In "Bills", register utilities or subscriptions. Click "Pay Now" to deduct from your selected bank account and log the cash outflow automatically.'
        }
      ]
    },
    {
      step: '05',
      title: isId ? 'Operasional Arus Kas & Scan Struk AI' : 'Daily Cash Flow & Gemini AI Receipt Scan',
      subtitle: isId ? 'Input Manual, Pemindaian AI Gemini, & Transfer Rekening' : 'Manual Entry, Gemini AI Scanning, & Inter-Account Transfers',
      icon: 'center_focus_strong',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      navTarget: 'cash-flow',
      details: [
        {
          heading: isId ? '1. Pemindaian Struk AI Gemini 3.6 Flash' : '1. Gemini 3.6 Flash AI Scanning',
          text: isId 
            ? 'Klik "+ Transaksi" -> pilih "Input Otomatis (AI)". Unggah/foto struk belanja fisik. AI Gemini di server akan mengekstrak total nominal, tanggal, nama merchant, dan kategori secara presisi.'
            : 'Click "+ Transaction" -> select "AI Automatic Input". Upload a receipt photo. Gemini AI parses total amount, date, merchant description, and category instantly.'
        },
        {
          heading: isId ? '2. Transfer Antar Rekening' : '2. Inter-Account Transfers',
          text: isId 
            ? 'Klik "+ Transfer" untuk memindahkan dana (misal BCA ke GoPay). Mutasi saldo memperbarui kedua rekening tanpa merusak angka pendapatan atau pengeluaran bersih.'
            : 'Click "+ Transfer" to shift funds (e.g. Bank BCA to GoPay). Balances update immediately without skewing net income or expense metrics.'
        }
      ]
    },
    {
      step: '06',
      title: isId ? 'Laporan, Log Aktivitas Audit, & Backup' : 'Reports, Audit Trail, & Offline Backups',
      subtitle: isId ? 'Ekspor CSV/JSON, Cetak Laporan PDF, & Fitur Restore' : 'CSV/JSON Export, Printable PDF Statements, & Undo/Restore',
      icon: 'assessment',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      navTarget: 'reports',
      details: [
        {
          heading: isId ? '1. Ekspor Cadangan Data Offline (CSV & JSON)' : '1. Offline Backup Export (CSV & JSON)',
          text: isId 
            ? 'Di menu "Laporan", unduh cadangan lengkap mencakup Rekening Kas, Aset, Utang, Arus Kas, dan Anggaran dalam format CSV spreadsheet atau JSON utuh.'
            : 'In "Reports", export full offline backups including Cash Accounts, Assets, Debts, Cash Flow, and Envelopes in CSV or JSON format.'
        },
        {
          heading: isId ? '2. Cetak Dokumen & Audit Trail' : '2. PDF Statements & Activity Log Undo',
          text: isId 
            ? 'Cetak Laporan Keuangan resmi ke PDF atau periksa menu "Log Aktivitas" untuk memulihkan (Undo/Restore) data yang tidak sengaja terhapus.'
            : 'Print clean PDF statements or review "Activity Log" to restore accidentally deleted data with a single click.'
        }
      ]
    }
  ];

  const menuGuides = [
    {
      menu: isId ? 'Dashboard Utama' : 'Executive Dashboard',
      icon: 'dashboard',
      description: isId 
        ? 'Pusat ringkasan eksekutif yang menampilkan Total Saldo Kas Likuid, Nilai Aset Fisik, Total Kekayaan Bersih (Net Worth), Kewajiban Utang & Piutang, indikator Kesehatan Arus Kas, dan peringatan anggaran.'
        : 'Executive dashboard showcasing Total Liquid Cash, Physical Asset Values, Net Worth, Net Debts & Receivables, Cash Flow Health score, and budget alerts.',
      howToRead: [
        isId ? '1. Kas Likuid Bank/E-Wallet: Gabungan saldo tunai aktif di seluruh rekening bank dan e-wallet.' : '1. Liquid Cash: Sum of active funds across all bank accounts and e-wallet balances.',
        isId ? '2. Total Net Worth: Gabungan kas likuid ditambah total nilai pasar aset fisik dikurangi total kewajiban utang.' : '2. Total Net Worth: Combined liquid cash plus current physical asset market value minus total debt obligations.',
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
      menu: isId ? 'Utang & Piutang (Debts & Receivables)' : 'Debts & Receivables',
      icon: 'account_balance',
      description: isId 
        ? 'Modul pencatatan kewajiban utang dan tagihan piutang lengkap dengan tanggal jatuh tempo, status pelunasan, serta riwayat cicilan yang otomatis memperbarui saldo rekening.'
        : 'Module for managing debt obligations and receivables with due dates, payment status, and installment tracking that automatically syncs bank balances.',
      howToRead: [
        isId ? '1. Pemisahan Tab Utang vs Piutang: Tab Utang berisi kewajiban pembayaran Anda, sedangkan Tab Piutang berisi uang yang harus Anda tagih dari pihak lain.' : '1. Debts vs Receivables Tabs: Debt tab lists your obligations, while Receivable tab tracks money owed to you.',
        isId ? '2. Eksekusi "+ Catat Pelunasan": Setiap pembayaran atau penerimaan cicilan akan mencatat transaksi di Arus Kas dan menyesuaikan saldo rekening terpilih.' : '2. "+ Log Payment" Execution: Payments or repayments update Cash Flow records and automatically reflect in your chosen bank account.',
        isId ? '3. Progress Bar Pelunasan: Menampilkan persentase jumlah sisa utang/piutang dibandingkan dengan total nominal awal.' : '3. Payment Progress Bar: Shows remaining balance percentage against initial principal amount.'
      ]
    },
    {
      menu: isId ? 'Aset & Barang (Assets)' : 'Physical Assets & Goods',
      icon: 'home_work',
      description: isId 
        ? 'Modul inventarisasi fisik barang, tanah, bangunan, kendaraan, dan barang berharga lengkap dengan harga beli, nilai pasar saat ini, revaluasi riwayat harga, konversi Borongan Kalsel, kalkulasi depresiasi, dan koordinat GPS Google Maps.'
        : 'Inventory module for land, property, vehicles, and valuables with purchase cost, current market value, historical revaluation logs, Borongan unit conversion, automatic depreciation math, and Google Maps GPS coordinates.',
      howToRead: [
        isId ? '1. Total Nilai Aset Fisik: Menjumlahkan nilai estimasi pasar seluruh barang fisik milik Anda.' : '1. Total Asset Value: Sum of current estimated market valuation of all physical property.',
        isId ? '2. Konversi Satuan Borongan (Kalsel): Untuk aset tanah/lahan, sistem otomatis mengonversi luas m²/Hektar ke satuan tradisional Borongan (1 Hektar = 35 Borongan, 1 Borongan ≈ 285,7 m²) beserta estimasi harga per m² dan per borongan.' : '2. Borongan Unit Conversion (Kalsel): For land assets, automatically converts m²/Hectare into traditional Borongan units (1 Hectare = 35 Borongan, 1 Borongan ≈ 285.7 m²) with price per m² & per borongan.',
        isId ? '3. Histori Revaluasi & Depresiasi: Catat kenaikan nilai tanah/properti secara berkala via tombol "+ Tambah Revaluasi" atau aktifkan penyusutan harga otomatis untuk aset seperti kendaraan atau elektronik.' : '3. Revaluation History & Depreciation: Log periodic land/property appreciation via "+ Add Revaluation" or enable auto depreciation for vehicles/electronics.',
        isId ? '4. Lokasi & Koordinat GPS: Simpan nama toko/lokasi lahan dan koordinat GPS (DMS atau Desimal) yang dapat diklik langsung untuk membuka Google Maps.' : '4. Location & GPS Coordinates: Store location names and GPS coordinates (DMS or Decimal) with direct Google Maps integration.'
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
    },
    {
      menu: isId ? 'Pengaturan & Rekening (Settings)' : 'Settings & Accounts',
      icon: 'settings',
      description: isId 
        ? 'Pusat pengelolaan master data rekening bank/e-wallet, rekonsiliasi kas, anggota keluarga, kategori kustom, serta kunci keamanan PIN Passcode.'
        : 'Control center for bank account/e-wallet master data, cash reconciliation, family members, custom categories, and 6-digit PIN lock.',
      howToRead: [
        isId ? '1. Rekonsiliasi Saldo: Bandingkan saldo aplikasi dengan cetakan koran/fisik. Selisih akan disesuaikan otomatis dengan transaksi adjustment.' : '1. Balance Reconciliation: Compare app balance with bank statement. Discrepancies generate auto-adjustment transactions.',
        isId ? '2. Pengunci PIN 6-Digit: Aktifkan proteksi PIN untuk mencegah orang lain membuka data keuangan saat HP ditinggalkan.' : '2. 6-Digit PIN Lock: Enable passcode protection to restrict physical access when device is unattended.',
        isId ? '3. Kelola Anggota & Kategori: Tambah atau edit daftar anggota keluarga dan kategori pengeluaran/pemasukan kustom.' : '3. Members & Categories: Add/edit family workspace members and custom transaction categories.'
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
      q: isId ? 'Apa perbedaan Rekening Bank/E-Wallet (Kas Likuid), Aset Fisik, dan Utang/Piutang?' : 'What is the difference between Liquid Cash, Physical Assets, and Debts/Receivables?',
      a: isId 
        ? 'Rekening Kas Likuid (BCA, Mandiri, Cash, GoPay) adalah uang tunai cair untuk belanja sehari-hari. Aset & Barang (tanah, mobil, emas) adalah inventaris kekayaan fisik yang nilainya diperhitungkan ke Net Worth. Utang adalah kewajiban yang harus dibayar, sedangkan Piutang adalah tagihan klaim uang Anda di orang lain.'
        : 'Liquid Cash Accounts (BCA, Mandiri, Cash, GoPay) hold spendable funds. Physical Assets (land, vehicles, gold) contribute to Net Worth. Debts represent your financial liabilities, while Receivables represent money owed to you by others.'
    },
    {
      q: isId ? 'Bagaimana pencatatan cicilan / pelunasan Utang & Piutang mempengaruhi saldo rekening?' : 'How does debt/receivable payment logging affect bank balances?',
      a: isId 
        ? 'Saat Anda mencatat pelunasan Utang, sistem otomatis memotong saldo rekening bank/e-wallet pilihan dan mencatat transaksi Kas Keluar. Sebaliknya, saat mencatat penerimaan cicilan Piutang, saldo rekening bank akan bertambah otomatis sebagai Kas Masuk.'
        : 'When logging a debt payment, the app automatically deducts funds from your selected bank account and creates an expense record. Conversely, receiving receivable payments increases your account balance and logs an income transaction.'
    },
    {
      q: isId ? 'Bagaimana cara menggunakan filter Scope Workspace (Semua Workspace, Keluarga, Pribadi)?' : 'How does the Workspace Scope Filter work (All Workspaces, Family, Personal)?',
      a: isId 
        ? 'Di bagian atas setiap halaman (Arus Kas, Anggaran, Utang, Tagihan, Target, Aset, Laporan), Anda dapat mengeklik tombol switch filter workspace. Opsi "Semua Workspace" menggabungkan seluruh catatan data dari Dompet Pribadi dan Dompet Keluarga tanpa perlu berganti-ganti workspace.'
        : 'At the top of each view (Cash Flow, Budgeting, Debts, Bills, Goals, Assets, Reports), click the workspace scope switcher. Selecting "All Workspaces" aggregates data from both Personal and Family wallets into a unified view.'
    },
    {
      q: isId ? 'Bagaimana cara melakukan cadangan data offline (Offline Backup) & ekspor laporan?' : 'How to export offline data backups and financial statements?',
      a: isId 
        ? 'Buka menu "Laporan", lalu scroll ke bagian "Ekspor Laporan & Cadangan Data". Pilih bulan, tahun, scope workspace, serta jenis data yang ingin disertakan (Rekening Kas Likuid, Aset Fisik, Utang/Piutang, Arus Kas, Amplop Anggaran). Pilih format CSV (untuk Excel/Spreadsheet) atau JSON (cadangan aplikasi), lalu klik Unduh.'
        : 'Navigate to "Reports" -> scroll to "Export Statement & Backup". Choose month, year, workspace scope, and dataset checkboxes (Liquid Cash Accounts, Physical Assets, Debts, Cash Flow, Budget Envelopes). Download in CSV spreadsheet or full JSON format.'
    },
    {
      q: isId ? 'Bagaimana jika saya tidak sengaja menghapus data transaksi, aset, atau utang?' : 'What if I accidentally delete a transaction, asset, or debt record?',
      a: isId 
        ? 'Buka menu "Log Aktivitas". Semua tindakan seperti penambahan, pembaruan, dan penghapusan tersimpan dengan rapi. Cari catatan tindakan yang dihapus, lalu klik tombol "Urungkan / Pulihkan" untuk mengembalikan data tersebut secara instan.'
        : 'Open the "Activity Log" view. Every creation, edit, and deletion is recorded. Locate the deleted action entry and click the "Undo / Restore" button to instantly recover the record.'
    },
    {
      q: isId ? 'Apakah data transaksi saya aman dan bisa dikunci dengan PIN?' : 'Is my financial data secure and protected with a PIN lock?',
      a: isId 
        ? 'Ya. Data Anda disimpan secara terenkripsi di Firestore dan dilindungi Aturan Keamanan Server (Firestore Rules). Selain itu, Anda dapat mengaktifkan opsi "Keamanan PIN 6-Digit" di menu Pengaturan untuk mengunci layar aplikasi.'
        : 'Yes. Data is securely stored in encrypted Firestore guarded by server security rules. Furthermore, enable "6-Digit Security PIN" in Settings to lock the application screen.'
    },
    {
      q: isId ? 'Bagaimana perhitungan Satuan Borongan (Kalsel) dan Revaluasi Nilai Aset?' : 'How does traditional Borongan unit conversion and asset revaluation work?',
      a: isId 
        ? 'Untuk aset kategori Tanah/Lahan, sistem mengodekan rumus standar Kalimantan Selatan di mana 1 Hektar (10.000 m²) setara dengan 35 Borongan (1 Borongan ≈ 285,7 m²). Harga beli dan nilai efektif saat ini dikalkulasi otomatis dalam rupiah per m² serta rupiah per borongan. Anda juga dapat menambah riwayat Revaluasi harga tanah/bangunan di modal detail aset untuk melacak kenaikan nilai investasi.'
        : 'For land assets, the app converts area into traditional South Kalimantan Borongan units (1 Hectare = 35 Borongan, 1 Borongan ≈ 285.7 m²). Price per m² and per borongan are calculated automatically. You can also append revaluation records in asset details to track real estate appreciation over time.'
    },
    {
      q: isId ? 'Bagaimana cara melakukan Rekonsiliasi Saldo Kas & Rekening Bank?' : 'How does Bank Account & Cash Reconciliation work?',
      a: isId 
        ? 'Di menu Pengaturan / Rekening, klik tombol "Rekonsiliasi" pada rekening yang ingin disesuaikan. Masukkan saldo fisik riil saat ini (hasil opname kas atau cetak koran). Jika terdapat selisih, sistem akan otomatis membuat transaksi penyesuaian kas (Adjustment) sehingga saldo aplikasi dan saldo nyata selalu sinkron 100%.'
        : 'In Settings / Accounts, click the "Reconcile" button on any account. Enter the actual real balance (from bank statement or cash audit). If a gap exists, the app generates a balancing adjustment transaction to ensure 100% balance alignment.'
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