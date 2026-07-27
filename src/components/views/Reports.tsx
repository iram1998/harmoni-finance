import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { formatCurrency } from '../../utils';
import { ReportsSkeleton } from '../ui/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

export function Reports() {
  const { workspace, transactions, assets, envelopes, paymentAccounts } = useFinance();
  const { language, theme, t } = useThemeLanguage();
  const [isLoading, setIsLoading] = useState(true);

  // Filter modes: 'pribadi' | 'keluarga' | 'all'
  const [reportWorkspaceFilter, setReportWorkspaceFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');

  // Export State Variables
  const currentDate = new Date();
  const defaultMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const defaultYear = String(currentDate.getFullYear());

  const [exportMonth, setExportMonth] = useState(defaultMonth);
  const [exportYear, setExportYear] = useState(defaultYear);
  const [exportIncludeAssets, setExportIncludeAssets] = useState(true);
  const [exportIncludePaymentAccs, setExportIncludePaymentAccs] = useState(true);
  const [exportIncludeCashFlow, setExportIncludeCashFlow] = useState(true);
  const [exportIncludeBudget, setExportIncludeBudget] = useState(true);
  
  const [isPreviewingPDF, setIsPreviewingPDF] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [reportWorkspaceFilter]);

  const isId = language === 'id';

  // Helper lists
  const monthsList = [
    { code: '01', name: isId ? 'Januari' : 'January' },
    { code: '02', name: isId ? 'Februari' : 'February' },
    { code: '03', name: isId ? 'Maret' : 'March' },
    { code: '04', name: isId ? 'April' : 'April' },
    { code: '05', name: isId ? 'Mei' : 'May' },
    { code: '06', name: isId ? 'Juni' : 'June' },
    { code: '07', name: isId ? 'Juli' : 'July' },
    { code: '08', name: isId ? 'Agustus' : 'August' },
    { code: '09', name: isId ? 'September' : 'September' },
    { code: '10', name: isId ? 'Oktober' : 'October' },
    { code: '11', name: isId ? 'November' : 'November' },
    { code: '12', name: isId ? 'Desember' : 'December' }
  ];

  const yearsList = ['2024', '2025', '2026', '2027'];

  // Data Filtering Utilities
  const filterTransactionsForPeriod = (m: string, y: string) => {
    return transactions.filter(t => {
      const matchWs = reportWorkspaceFilter === 'all' ? true : (t.workspaceId || 'keluarga') === reportWorkspaceFilter;
      const matchPeriod = t.date.startsWith(`${y}-${m}`);
      return matchWs && matchPeriod;
    });
  };

  const filterAssetsForPeriod = () => {
    return assets.filter(a => {
      const matchWs = reportWorkspaceFilter === 'all' ? true : (a.workspaceId || 'keluarga') === reportWorkspaceFilter;
      return matchWs && a.status === 'owned';
    });
  };

  const filterPaymentAccountsForPeriod = () => {
    return paymentAccounts.filter(acc => {
      const matchWs = reportWorkspaceFilter === 'all' ? true : (acc.workspaceId || 'keluarga') === reportWorkspaceFilter;
      return matchWs;
    });
  };

  const getBudgetDataForPeriod = (m: string, y: string) => {
    const periodTrs = filterTransactionsForPeriod(m, y);
    const categoryExpenses = periodTrs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return envelopes
      .filter(e => reportWorkspaceFilter === 'all' ? true : (e.workspaceId || 'keluarga') === reportWorkspaceFilter)
      .map(e => {
        const spent = categoryExpenses[e.category] || 0;
        return {
          category: e.category,
          allocatedAmount: e.allocatedAmount,
          spent,
          remaining: e.allocatedAmount - spent,
          pct: e.allocatedAmount > 0 ? Math.round((spent / e.allocatedAmount) * 100) : 0
        };
      });
  };

  // 1. Export Combined CSV Backup
  const handleExportCombinedCSV = () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!exportIncludeAssets && !exportIncludePaymentAccs && !exportIncludeCashFlow && !exportIncludeBudget) {
      setErrorMsg(isId ? 'Silakan pilih setidaknya satu data untuk diekspor.' : 'Please select at least one data type to export.');
      return;
    }

    const periodTrs = filterTransactionsForPeriod(exportMonth, exportYear);
    const periodAssets = filterAssetsForPeriod();
    const periodPayAccs = filterPaymentAccountsForPeriod();
    const periodBudget = getBudgetDataForPeriod(exportMonth, exportYear);

    const monthName = monthsList.find(m => m.code === exportMonth)?.name || exportMonth;

    let csvContent = `==================================================\n`;
    csvContent += `HARMONI FINANSIAL - ${isId ? 'EKSPOR CADANGAN KEUANGAN OFFLINE' : 'OFFLINE FINANCIAL BACKUP EXPORT'}\n`;
    csvContent += `==================================================\n`;
    csvContent += `${isId ? 'Workspace Filter' : 'Workspace Filter'}: ${reportWorkspaceFilter.toUpperCase()}\n`;
    csvContent += `${isId ? 'Periode' : 'Period'}: ${monthName} ${exportYear}\n`;
    csvContent += `${isId ? 'Tanggal Ekspor' : 'Export Date'}: ${new Date().toLocaleString()}\n\n`;

    if (exportIncludePaymentAccs) {
      csvContent += `--------------------------------------------------\n`;
      csvContent += `1. ${isId ? 'DAFTAR REKENING BANK & E-WALLET (ASET LIKUID KAS)' : 'BANK & E-WALLET ACCOUNTS (LIQUID CASH)'}\n`;
      csvContent += `--------------------------------------------------\n`;
      csvContent += `${isId ? 'Nama Rekening,Tipe,Workspace,Nomor Rekening,Pemilik,Saldo (Rp)' : 'Account Name,Type,Workspace,Account Number,Holder,Balance (IDR)'}\n`;
      if (periodPayAccs.length === 0) {
        csvContent += `${isId ? '(Tidak ada data rekening bank/e-wallet)' : '(No payment accounts recorded)'}\n`;
      } else {
        periodPayAccs.forEach(acc => {
          csvContent += `"${acc.name}","${acc.type}","${acc.workspaceId || 'keluarga'}","${acc.accountNumber || '-'}","${acc.holderName || '-'}",${acc.balance}\n`;
        });
      }
      csvContent += `\n`;
    }

    if (exportIncludeAssets) {
      csvContent += `--------------------------------------------------\n`;
      csvContent += `2. ${isId ? 'DATA KEPEMILIKAN ASET FISIK (PHYSICAL ASSETS)' : 'ACTIVE PHYSICAL ASSETS REPORT'}\n`;
      csvContent += `--------------------------------------------------\n`;
      csvContent += `${isId ? 'Nama Aset,Kategori,Workspace,Harga Beli (Rp),Nilai Saat Ini (Rp),Tanggal Pembelian,Catatan' : 'Asset Name,Category,Workspace,Purchase Price (IDR),Current Value (IDR),Purchase Date,Notes'}\n`;
      if (periodAssets.length === 0) {
        csvContent += `${isId ? '(Tidak ada data aset)' : '(No assets data recorded)'}\n`;
      } else {
        periodAssets.forEach(a => {
          csvContent += `"${a.name}","${a.category}","${a.workspaceId || 'keluarga'}",${a.purchasePrice},${a.currentValue},"${a.purchaseDate}","${(a.notes || '').replace(/"/g, '""')}"\n`;
        });
      }
      csvContent += `\n`;
    }

    if (exportIncludeCashFlow) {
      csvContent += `--------------------------------------------------\n`;
      csvContent += `3. ${isId ? 'DAFTAR ARUS KAS & TRANSAKSI (CASH FLOW)' : 'CASH FLOW TRANSACTIONS LIST'}\n`;
      csvContent += `--------------------------------------------------\n`;
      csvContent += `${isId ? 'Tanggal,Kategori,Workspace,Deskripsi,Tipe,Jumlah (Rp)' : 'Date,Category,Workspace,Description,Type,Amount (IDR)'}\n`;
      if (periodTrs.length === 0) {
        csvContent += `${isId ? '(Tidak ada data transaksi pada periode ini)' : '(No transaction data in this period)'}\n`;
      } else {
        periodTrs.forEach(t => {
          csvContent += `"${t.date}","${t.category}","${t.workspaceId || 'keluarga'}","${(t.description || '').replace(/"/g, '""')}",${t.type},${t.amount}\n`;
        });
      }
      csvContent += `\n`;
    }

    if (exportIncludeBudget) {
      csvContent += `--------------------------------------------------\n`;
      csvContent += `4. ${isId ? 'POS ANGGARAN ENVELOPE (BUDGETING)' : 'ENVELOPE BUDGETING TARGETS'}\n`;
      csvContent += `--------------------------------------------------\n`;
      csvContent += `${isId ? 'Kategori Anggaran,Anggaran Alokasi (Rp),Realisasi Belanja (Rp),Sisa Anggaran (Rp),Tingkat Penyerapan (%)' : 'Budget Category,Allocated Budget (IDR),Actual Spent (IDR),Remaining (IDR),Absorption Rate (%)'}\n`;
      if (periodBudget.length === 0) {
        csvContent += `${isId ? '(Tidak ada data pos anggaran)' : '(No budgeting envelope data)'}\n`;
      } else {
        periodBudget.forEach(b => {
          csvContent += `"${b.category}",${b.allocatedAmount},${b.spent},${b.remaining},${b.pct}%\n`;
        });
      }
      csvContent += `\n`;
    }

    // Download CSV trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Harmoni_Laporan_${reportWorkspaceFilter}_${exportYear}_${exportMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(isId ? 'Laporan backup CSV gabungan berhasil disimpan!' : 'Combined CSV backup report saved successfully!');
  };

  // 2. Export Database JSON Backup
  const handleExportJSON = () => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!exportIncludeAssets && !exportIncludePaymentAccs && !exportIncludeCashFlow && !exportIncludeBudget) {
      setErrorMsg(isId ? 'Silakan pilih setidaknya satu data untuk diekspor.' : 'Please select at least one data type to export.');
      return;
    }

    const periodTrs = filterTransactionsForPeriod(exportMonth, exportYear);
    const periodAssets = filterAssetsForPeriod();
    const periodPayAccs = filterPaymentAccountsForPeriod();
    const periodBudget = getBudgetDataForPeriod(exportMonth, exportYear);

    const totalLiquidCash = periodPayAccs.reduce((sum, acc) => sum + acc.balance, 0);
    const totalPhysicalAssets = periodAssets.reduce((sum, a) => sum + a.currentValue, 0);

    const backupData = {
      appName: "Harmoni Finansial",
      exportedAt: new Date().toISOString(),
      workspaceFilter: reportWorkspaceFilter,
      period: `${exportYear}-${exportMonth}`,
      backupVersion: "1.3.0",
      summary: {
        totalLiquidCash,
        totalPhysicalAssets,
        totalAssets: totalLiquidCash + totalPhysicalAssets,
        totalIncome: periodTrs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpense: periodTrs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      },
      paymentAccounts: exportIncludePaymentAccs ? periodPayAccs : [],
      assets: exportIncludeAssets ? periodAssets : [],
      transactions: exportIncludeCashFlow ? periodTrs : [],
      budgets: exportIncludeBudget ? periodBudget : []
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Harmoni_Backup_${reportWorkspaceFilter}_${exportYear}_${exportMonth}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess(isId ? 'Cadangan basis data JSON berhasil diunduh!' : 'JSON database backup downloaded successfully!');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredTransactions = transactions.filter(t => 
    reportWorkspaceFilter === 'all' ? true : (t.workspaceId || 'keluarga') === reportWorkspaceFilter
  );

  // Prepare data for Pie Chart (Expenses by Category)
  const expenseByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  let pieData: { name: string; value: number }[] = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
    
  if (pieData.length === 0) {
    pieData = [
      { name: 'Perumahan & Tagihan', value: 3500000 },
      { name: 'Konsumsi & Pangan', value: 2400000 },
      { name: 'Transportasi', value: 1200000 },
    ];
  }

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];
  const totalSpend = pieData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  // Dynamic Income vs Expense Area Chart Data from transactions
  const areaData = ['01', '02', '03', '04', '05', '06']
    .map(mCode => {
      const monthTrs = transactions.filter(t => {
        const matchWs = reportWorkspaceFilter === 'all' ? true : (t.workspaceId || 'keluarga') === reportWorkspaceFilter;
        return matchWs && t.date.startsWith(`${exportYear}-${mCode}`);
      });
      const income = monthTrs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTrs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const monthObj = monthsList.find(m => m.code === mCode);
      return {
        name: monthObj ? monthObj.name.slice(0, 3) : mCode,
        Income: income,
        Expense: expense
      };
    });

  // Check if areaData has all zeroes, if so provide realistic guidance data
  const hasChartData = areaData.some(d => d.Income > 0 || d.Expense > 0);
  const chartDisplayData = hasChartData ? areaData : [
    { name: 'Jan', Income: 8500000, Expense: 6200000 },
    { name: 'Feb', Income: 9200000, Expense: 6500000 },
    { name: 'Mar', Income: 8900000, Expense: 7800000 },
    { name: 'Apr', Income: 11000000, Expense: 7100000 },
    { name: 'May', Income: 10500000, Expense: 6800000 },
    { name: 'Jun', Income: 12000000, Expense: 7500000 },
  ];

  // Calculations for PDF Preview Paper
  const periodTrs = filterTransactionsForPeriod(exportMonth, exportYear);
  const periodAssets = filterAssetsForPeriod();
  const periodPayAccs = filterPaymentAccountsForPeriod();
  const periodBudget = getBudgetDataForPeriod(exportMonth, exportYear);

  const pdfTotalLiquidCash = periodPayAccs.reduce((sum, acc) => sum + acc.balance, 0);
  const pdfTotalPhysicalAssets = periodAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const pdfTotalNetWorth = pdfTotalLiquidCash + pdfTotalPhysicalAssets;

  const pdfTotalIncome = periodTrs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const pdfTotalExpense = periodTrs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const pdfNetSavings = pdfTotalIncome - pdfTotalExpense;
  const pdfMonthName = monthsList.find(m => m.code === exportMonth)?.name || exportMonth;

  return (
    <>
      {/* 1. PDF PRINT PREVIEW OVERLAY (Triggered when user hits PDF) */}
      {isPreviewingPDF && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 md:p-10 print:p-0 print:bg-white animate-fadeIn">
          {/* Controls bar */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl z-[100000] print:hidden items-center border border-slate-700/80">
            <span className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <span className="material-symbols-outlined text-red-500 animate-pulse text-[18px]">picture_as_pdf</span>
              {isId ? 'Tinjauan Cetak PDF' : 'PDF Report Preview'}
            </span>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <button 
              onClick={() => window.print()} 
              className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              {isId ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}
            </button>
            <button 
              onClick={() => setIsPreviewingPDF(false)} 
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer"
            >
              {isId ? 'Tutup' : 'Close'}
            </button>
          </div>

          {/* Paper Document Representation */}
          <div className="bg-white text-[#1e293b] w-full max-w-[800px] min-h-[1128px] my-6 sm:my-16 p-5 sm:p-12 shadow-2xl rounded-xs print:shadow-none print:my-0 print:p-0 print:max-w-none print:w-full font-sans leading-relaxed">
            
            {/* Document Header Logo */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start border-b-2 border-slate-900 pb-5 gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">HARMONI FINANSIAL</h1>
                <p className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-primary mt-0.5">
                  {isId ? 'Laporan Analisis & Backup Keuangan Bulanan' : 'Monthly Financial Analysis & Backup'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isId ? 'Generasi Otomatis Aplikasi Harmoni Finansial' : 'Automatically Generated by Harmoni Finansial'}
                </p>
              </div>
              <div className="text-left sm:text-right text-xs">
                <span className="font-bold text-slate-900 block">
                  {isId ? 'Scope Workspace' : 'Workspace Scope'}: {reportWorkspaceFilter === 'all' ? (isId ? 'SEMUA (PRIBADI & KELUARGA)' : 'ALL (PERSONAL & FAMILY)') : reportWorkspaceFilter.toUpperCase()}
                </span>
                <span className="text-slate-500 block mt-0.5">{isId ? 'Periode' : 'Period'}: {pdfMonthName} {exportYear}</span>
                <span className="text-slate-500 block">{isId ? 'Dibuat Pada' : 'Exported At'}: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Document Executive Summary Blocks */}
            <div className="my-6">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 mb-3.5 pb-1 border-b border-slate-200">
                {isId ? 'I. Ringkasan Eksekutif Finansial' : 'I. Executive Financial Summary'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">{isId ? 'Total Arus Masuk' : 'Total Inflow'}</span>
                  <span className="text-xs font-extrabold text-emerald-600 block mt-1">{formatCurrency(pdfTotalIncome)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">{isId ? 'Total Arus Keluar' : 'Total Outflow'}</span>
                  <span className="text-xs font-extrabold text-rose-600 block mt-1">{formatCurrency(pdfTotalExpense)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">{isId ? 'Tabungan Bersih' : 'Net Savings'}</span>
                  <span className={`text-xs font-extrabold block mt-1 ${pdfNetSavings >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {formatCurrency(pdfNetSavings)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">{isId ? 'Kas Likuid Bank' : 'Liquid Cash'}</span>
                  <span className="text-xs font-extrabold text-indigo-600 block mt-1">{formatCurrency(pdfTotalLiquidCash)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wide">{isId ? 'Aset Fisik' : 'Physical Assets'}</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-1">{formatCurrency(pdfTotalPhysicalAssets)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 bg-primary/5">
                  <span className="text-[9px] font-bold text-slate-600 block uppercase tracking-wide">{isId ? 'Total Kekayaan' : 'Total Net Worth'}</span>
                  <span className="text-xs font-extrabold text-primary block mt-1">{formatCurrency(pdfTotalNetWorth)}</span>
                </div>
              </div>
            </div>

            {/* Document Section: Payment Accounts (Liquid Cash) */}
            {exportIncludePaymentAccs && (
              <div className="my-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-200">
                  {isId ? 'II. Rekening Bank & E-Wallet (Aset Likuid Kas)' : 'II. Bank & E-Wallet Accounts (Liquid Cash)'}
                </h2>
                {periodPayAccs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">{isId ? 'Tidak ada rekening bank / e-wallet tercatat.' : 'No payment accounts found.'}</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Nama Rekening' : 'Account Name'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Kategori Tipe' : 'Type'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Nomor / ID' : 'Account Number'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Scope' : 'Scope'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Saldo Current' : 'Current Balance'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodPayAccs.map((acc, i) => (
                        <tr key={acc.id || i} className="border-b border-slate-200">
                          <td className="p-2 font-medium">{acc.name}</td>
                          <td className="p-2 text-slate-500 uppercase text-[10px] font-bold">{acc.type}</td>
                          <td className="p-2 text-slate-500 font-mono">{acc.accountNumber || '-'}</td>
                          <td className="p-2 text-slate-500 capitalize">{acc.workspaceId || 'keluarga'}</td>
                          <td className="p-2 text-right font-semibold text-emerald-700">{formatCurrency(acc.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Document Section: Assets */}
            {exportIncludeAssets && (
              <div className="my-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-200">
                  {isId ? 'III. Portofolio Kepemilikan Aset Fisik' : 'III. Physical Assets Portfolio'}
                </h2>
                {periodAssets.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">{isId ? 'Tidak ada kepemilikan aset aktif tercatat.' : 'No active assets found.'}</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Nama Aset' : 'Asset Name'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Kategori' : 'Category'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Scope' : 'Scope'}</th>
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Tgl Pembelian' : 'Purchase Date'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Nilai Sekarang' : 'Current Value'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodAssets.map((a, i) => (
                        <tr key={a.id || i} className="border-b border-slate-200">
                          <td className="p-2 font-medium">{a.name}</td>
                          <td className="p-2 text-slate-500">{a.category}</td>
                          <td className="p-2 text-slate-500 capitalize">{a.workspaceId || 'keluarga'}</td>
                          <td className="p-2 text-slate-500">{a.purchaseDate}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(a.currentValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Document Section: Budgeting Envelopes */}
            {exportIncludeBudget && (
              <div className="my-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-200">
                  {isId ? 'IV. Realisasi Pos Anggaran Amplop' : 'IV. Envelope Budgeting Realization'}
                </h2>
                {periodBudget.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">{isId ? 'Tidak ada pos anggaran aktif dikonfigurasi.' : 'No envelope budgets configured.'}</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300">
                        <th className="p-2 font-bold text-slate-700">{isId ? 'Kategori Amplop' : 'Envelope Category'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Alokasi Target' : 'Target Allocated'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Realisasi Belanja' : 'Actual Spent'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Sisa Anggaran' : 'Remaining'}</th>
                        <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Penyerapan' : 'Usage'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodBudget.map((b, i) => (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="p-2 font-medium">{b.category}</td>
                          <td className="p-2 text-right text-slate-600">{formatCurrency(b.allocatedAmount)}</td>
                          <td className="p-2 text-right text-rose-600 font-medium">{formatCurrency(b.spent)}</td>
                          <td className="p-2 text-right text-slate-600">{formatCurrency(b.remaining)}</td>
                          <td className="p-2 text-right font-bold text-slate-800">{b.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Document Section: Transactions */}
            {exportIncludeCashFlow && (
              <div className="my-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-200">
                  {isId ? 'V. Riwayat Arus Kas & Transaksi Terpilih' : 'V. Cash Flow & Selected Transactions'}
                </h2>
                {periodTrs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">{isId ? 'Tidak ada data transaksi pada periode ini.' : 'No transactions recorded for this period.'}</p>
                ) : (
                  <div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                          <th className="p-2 font-bold text-slate-700">{isId ? 'Tanggal' : 'Date'}</th>
                          <th className="p-2 font-bold text-slate-700">{isId ? 'Deskripsi' : 'Description'}</th>
                          <th className="p-2 font-bold text-slate-700">{isId ? 'Kategori' : 'Category'}</th>
                          <th className="p-2 font-bold text-slate-700">{isId ? 'Scope' : 'Scope'}</th>
                          <th className="p-2 font-bold text-slate-700">{isId ? 'Tipe' : 'Type'}</th>
                          <th className="p-2 font-bold text-slate-700 text-right">{isId ? 'Jumlah' : 'Amount'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodTrs.slice(0, 18).map((t, i) => (
                          <tr key={t.id || i} className="border-b border-slate-200">
                            <td className="p-2 text-slate-500">{t.date}</td>
                            <td className="p-2 font-medium">{t.description}</td>
                            <td className="p-2 text-slate-500">{t.category}</td>
                            <td className="p-2 text-slate-500 capitalize">{t.workspaceId || 'keluarga'}</td>
                            <td className="p-2 font-bold text-xs uppercase">
                              <span className={t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                                {t.type}
                              </span>
                            </td>
                            <td className={`p-2 text-right font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {formatCurrency(t.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {periodTrs.length > 18 && (
                      <p className="text-[10px] text-slate-400 italic mt-2 text-center">
                        {isId 
                          ? `* Menampilkan 18 dari ${periodTrs.length} transaksi. Ekspor ke CSV untuk cadangan lengkap.` 
                          : `* Showing 18 of ${periodTrs.length} transactions. Export to CSV for full history backup.`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Signature Block for review */}
            <div className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-2 gap-8">
              <div>
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-8">
                  {isId ? 'Ditinjau & Disetujui Oleh:' : 'Reviewed & Approved By:'}
                </span>
                <div className="w-48 h-[1px] bg-slate-400 mb-1"></div>
                <span className="text-xs font-semibold text-slate-800 block">{isId ? 'Kepala Keluarga / Pengelola' : 'Family Head / Manager'}</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide mb-8">
                  Harmoni Finansial Backup System
                </span>
                <div className="w-48 h-[1px] bg-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500 block">{isId ? 'Kredensial Digital Terverifikasi' : 'Verified Digital Credentials'}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. REGULAR REPORTS INTERFACE */}
      <div className="flex flex-col">
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
          <div>
            <h1 className="font-display-md text-on-background">{t('reportsTitle')}</h1>
            <p className="font-body-md text-on-surface-variant mt-2">{t('reportsSubtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Workspace Filter Switcher */}
            <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReportWorkspaceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reportWorkspaceFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {isId ? 'Semua Workspace' : 'All Workspaces'}
              </button>
              <button
                type="button"
                onClick={() => setReportWorkspaceFilter('keluarga')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reportWorkspaceFilter === 'keluarga'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {isId ? 'Keluarga' : 'Family'}
              </button>
              <button
                type="button"
                onClick={() => setReportWorkspaceFilter('pribadi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  reportWorkspaceFilter === 'pribadi'
                    ? 'bg-primary text-on-primary shadow-2xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {isId ? 'Pribadi' : 'Personal'}
              </button>
            </div>
          </div>
        </div>

        {/* 3. EXPORT & OFFLINE BACKUP CENTER CARD */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 md:p-6 mb-8 shadow-xs print:hidden animate-fadeIn">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-outline-variant/60">
            <span className="material-symbols-outlined text-primary text-[28px]">cloud_sync</span>
            <div>
              <h3 className="font-headline-sm text-on-surface">
                {isId ? 'Pusat Ekspor & Cadangan Offline' : 'Export & Offline Backup Center'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isId 
                  ? 'Simpan riwayat finansial bulanan Anda secara mandiri dalam format CSV, JSON, atau dokumen PDF resmi.' 
                  : 'Independently download your monthly financial history into spreadsheet CSV, JSON, or formal PDF document.'}
              </p>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Period selection */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="font-label-md text-on-surface font-extrabold uppercase tracking-wide">
                {isId ? '1. Pilih Periode Laporan' : '1. Choose Report Period'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant">
                    {isId ? 'Bulan' : 'Month'}
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {monthsList.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant">
                    {isId ? 'Tahun' : 'Year'}
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
                    className="bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Include elements selection */}
            <div className="lg:col-span-5 space-y-3.5">
              <h4 className="font-label-md text-on-surface font-extrabold uppercase tracking-wide">
                {isId ? '2. Pilih Komponen Laporan' : '2. Select Report Components'}
              </h4>
              <div className="flex flex-wrap gap-x-5 gap-y-3.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={exportIncludePaymentAccs}
                    onChange={(e) => setExportIncludePaymentAccs(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                  <span>{isId ? 'Rekening Bank & E-Wallet' : 'Bank & E-Wallets'}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={exportIncludeAssets}
                    onChange={(e) => setExportIncludeAssets(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                  <span>{isId ? 'Aset Fisik' : 'Physical Assets'}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={exportIncludeCashFlow}
                    onChange={(e) => setExportIncludeCashFlow(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                  <span>{isId ? 'Arus Kas (Transaksi)' : 'Cash Flow (Transactions)'}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-on-surface select-none">
                  <input
                    type="checkbox"
                    checked={exportIncludeBudget}
                    onChange={(e) => setExportIncludeBudget(e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-outline-variant bg-surface"
                  />
                  <span>{isId ? 'Pos Anggaran Amplop' : 'Envelope Budgets'}</span>
                </label>
              </div>
            </div>

            {/* Export buttons block */}
            <div className="lg:col-span-3 flex flex-col justify-end gap-2.5">
              <button
                onClick={handleExportCombinedCSV}
                className="w-full bg-primary text-on-primary font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-98 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                {isId ? 'Ekspor Gabungan CSV' : 'Export Combined CSV'}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExportJSON}
                  className="bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface font-bold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                  title={isId ? 'Backup Database JSON' : 'JSON Database Backup'}
                >
                  <span className="material-symbols-outlined text-[16px]">database</span>
                  JSON
                </button>
                <button
                  onClick={() => setIsPreviewingPDF(true)}
                  className="bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface font-bold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                  title={isId ? 'Cetak PDF Resmi' : 'Print Official PDF'}
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              {isId ? 'Kas Likuid Bank / E-Wallet' : 'Liquid Cash Accounts'}
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">
              {formatCurrency(pdfTotalLiquidCash)}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
              {filterPaymentAccountsForPeriod().length} {isId ? 'rekening aktif' : 'active accounts'}
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              {isId ? 'Nilai Aset Fisik' : 'Physical Assets Value'}
            </span>
            <span className="text-lg font-extrabold text-on-surface block mt-1">
              {formatCurrency(pdfTotalPhysicalAssets)}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
              {filterAssetsForPeriod().length} {isId ? 'unit aset fisik' : 'physical items'}
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              {isId ? 'Total Portofolio Aset' : 'Total Portfolio Worth'}
            </span>
            <span className="text-lg font-extrabold text-primary block mt-1">
              {formatCurrency(pdfTotalNetWorth)}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
              {isId ? 'Gabungan kas & barang' : 'Combined cash & assets'}
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              {isId ? 'Tabungan Bersih Periode' : 'Period Net Savings'}
            </span>
            <span className={`text-lg font-extrabold block mt-1 ${pdfNetSavings >= 0 ? 'text-primary' : 'text-rose-600'}`}>
              {formatCurrency(pdfNetSavings)}
            </span>
            <span className="text-[10px] text-on-surface-variant/80 mt-1 block">
              {monthsList.find(m => m.code === exportMonth)?.name} {exportYear}
            </span>
          </div>
        </div>

        {/* Regular Analytics Widgets below */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:hidden">
          {/* Spending by Category Pie Chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col h-full shadow-2xs">
            <h3 className="font-headline-sm text-on-surface mb-6">{t('spendingByCategory')}</h3>
            
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-outline-variant)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-on-surface)' }}
                    itemStyle={{ color: 'var(--text-on-surface)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-label-sm text-on-surface-variant uppercase">{t('totalSpend')}</span>
                <span className="font-headline-md text-on-surface mt-1">{formatCurrency(totalSpend)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pieData.slice(0, 3).map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="font-body-sm text-on-surface-variant">{item.name}</span>
                  </div>
                  <span className="font-label-md text-on-surface">
                    {totalSpend > 0 ? Math.round((item.value / totalSpend) * 100) : item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Income vs Expenses Area Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-2xs">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm text-on-surface">{t('incomeVsExpense')}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="font-label-sm text-on-surface-variant uppercase">{t('income')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="font-label-sm text-on-surface-variant uppercase">{t('expense')}</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDisplayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-outline-variant)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => `Rp${val / 1000000}M`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-outline-variant)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-on-surface)' }}
                    itemStyle={{ color: 'var(--text-on-surface)' }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Financial Health Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg shadow-2xs overflow-hidden print:hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="font-headline-sm text-on-surface">{t('financialHealthScore')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="p-4 font-label-md text-on-surface-variant uppercase">{t('date')}</th>
                  <th className="p-4 font-label-md text-on-surface-variant uppercase">{t('savingsRatio')}</th>
                  <th className="p-4 font-label-md text-on-surface-variant uppercase">{isId ? 'Rasio Utang' : 'Debt Ratio'}</th>
                  <th className="p-4 font-label-md text-on-surface-variant uppercase">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface">
                <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[56px]">
                  <td className="p-4 font-medium">Juni 2026</td>
                  <td className="p-4 text-primary font-bold">22%</td>
                  <td className="p-4">15%</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs">
                      {t('excellentCondition')}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-[56px]">
                  <td className="p-4 font-medium">Mei 2026</td>
                  <td className="p-4 text-primary font-bold">20%</td>
                  <td className="p-4">16%</td>
                  <td className="p-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs">
                      {t('excellentCondition')}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
