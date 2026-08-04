import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateDDMMYYYY } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CashFlowSkeleton } from '../ui/Skeleton';
import { Transaction } from '../../types';

export function CashFlow() {
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const { workspace, transactions, assets, deleteTransaction, deleteTransactions, openTransactionModal, openTransactionDetailModal } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();

  // Selection states for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  // Local filter & sort states
  type SortField = 'date' | 'description' | 'category' | 'workspace' | 'amount';
  type SortDirection = 'asc' | 'desc';

  const [cfWorkspaceFilter, setCfWorkspaceFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');
  const [cfPeriodFilter, setCfPeriodFilter] = useState<'this-month' | 'last-month' | 'this-year' | 'all-time'>('this-month');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination states
  const [pageSize, setPageSize] = useState<number | 'all'>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
  };

  const handleSelectSort = (val: string) => {
    const [field, dir] = val.split('-') as [SortField, SortDirection];
    setSortField(field);
    setSortDirection(dir);
  };

  // Clear selected ids when workspace, type, search, sort, or page size changes
  useEffect(() => {
    setSelectedIds([]);
  }, [cfWorkspaceFilter, cfPeriodFilter, typeFilter, searchTerm, sortField, sortDirection, pageSize, currentPage]);

  // Reset page to 1 whenever filters, search, sort, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [cfWorkspaceFilter, cfPeriodFilter, searchTerm, typeFilter, sortField, sortDirection, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPaginatedIds = paginatedTransactions.map(t => t.id);
      setSelectedIds(allPaginatedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await deleteTransactions(selectedIds);
      showToast(
        language === 'id' 
          ? `Berhasil menghapus ${selectedIds.length} transaksi.` 
          : `Successfully deleted ${selectedIds.length} transactions.`,
        'success',
        language === 'id' ? 'Transaksi Dihapus' : 'Transactions Deleted'
      );
      setSelectedIds([]);
      setIsBulkConfirmOpen(false);
    } catch (err: any) {
      console.error("Failed to delete transactions in bulk:", err);
      showToast(
        err.message || (language === 'id' ? 'Gagal menghapus transaksi massal.' : 'Failed to delete transactions.'),
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cfWorkspaceFilter, cfPeriodFilter]);
  
  // Date boundaries
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999).getTime();
  const thisYearStart = new Date(today.getFullYear(), 0, 1).getTime();
  
  // 1. Filtered list
  const filteredTransactions = transactions.filter(t => {
    const matchWs = cfWorkspaceFilter === 'all' ? true : (t.workspaceId || 'keluarga') === cfWorkspaceFilter;
    const matchType = typeFilter === 'all' ? true : t.type === typeFilter;
    const desc = (t.description || t.title || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchSearch = desc.includes(search) || cat.includes(search);
    
    let matchPeriod = true;
    if (cfPeriodFilter !== 'all-time') {
      const tTime = new Date(t.date).getTime();
      if (cfPeriodFilter === 'this-month') matchPeriod = tTime >= currentMonthStart && tTime <= currentMonthEnd;
      else if (cfPeriodFilter === 'last-month') matchPeriod = tTime >= lastMonthStart && tTime <= lastMonthEnd;
      else if (cfPeriodFilter === 'this-year') matchPeriod = tTime >= thisYearStart && tTime <= currentMonthEnd;
    }
    
    return matchWs && matchType && matchSearch && matchPeriod;
  });

  // Helper to extract timestamp for entry/input time sorting
  const getCreatedTimestamp = (t: Transaction): number => {
    if (t.createdAt) {
      const time = new Date(t.createdAt).getTime();
      if (!isNaN(time) && time > 0) return time;
    }
    if (t.id && typeof t.id === 'string' && t.id.includes('-')) {
      const parts = t.id.split('-');
      for (const part of parts) {
        if (/^\d{12,14}$/.test(part)) {
          const num = parseInt(part, 10);
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }
    return 0;
  };

  // 2. Sorted list
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let result = 0;
    if (sortField === 'date') {
      const dayA = a.date ? a.date.slice(0, 10) : '';
      const dayB = b.date ? b.date.slice(0, 10) : '';
      result = dayA.localeCompare(dayB);
      if (result === 0) {
        result = getCreatedTimestamp(a) - getCreatedTimestamp(b);
      }
    } else if (sortField === 'description') {
      const descA = a.description || a.title || '';
      const descB = b.description || b.title || '';
      result = descA.localeCompare(descB, language === 'id' ? 'id' : 'en', { sensitivity: 'base' });
      if (result === 0) {
        const dayA = a.date ? a.date.slice(0, 10) : '';
        const dayB = b.date ? b.date.slice(0, 10) : '';
        result = dayA.localeCompare(dayB);
        if (result === 0) {
          result = getCreatedTimestamp(a) - getCreatedTimestamp(b);
        }
      }
    } else if (sortField === 'category') {
      const catA = a.category || '';
      const catB = b.category || '';
      result = catA.localeCompare(catB, language === 'id' ? 'id' : 'en', { sensitivity: 'base' });
      if (result === 0) {
        const dayA = a.date ? a.date.slice(0, 10) : '';
        const dayB = b.date ? b.date.slice(0, 10) : '';
        result = dayA.localeCompare(dayB);
        if (result === 0) {
          result = getCreatedTimestamp(a) - getCreatedTimestamp(b);
        }
      }
    } else if (sortField === 'workspace') {
      const wsA = a.workspaceId || 'keluarga';
      const wsB = b.workspaceId || 'keluarga';
      result = wsA.localeCompare(wsB, language === 'id' ? 'id' : 'en', { sensitivity: 'base' });
      if (result === 0) {
        const dayA = a.date ? a.date.slice(0, 10) : '';
        const dayB = b.date ? b.date.slice(0, 10) : '';
        result = dayA.localeCompare(dayB);
        if (result === 0) {
          result = getCreatedTimestamp(a) - getCreatedTimestamp(b);
        }
      }
    } else if (sortField === 'amount') {
      result = a.amount - b.amount;
      if (result === 0) {
        const dayA = a.date ? a.date.slice(0, 10) : '';
        const dayB = b.date ? b.date.slice(0, 10) : '';
        result = dayA.localeCompare(dayB);
        if (result === 0) {
          result = getCreatedTimestamp(a) - getCreatedTimestamp(b);
        }
      }
    }

    if (result === 0) {
      result = (a.id || '').localeCompare(b.id || '');
    }

    return sortDirection === 'asc' ? result : -result;
  });

  // 3. Paginated list
  const totalItems = sortedTransactions.length;
  const effectivePageSize = pageSize === 'all' ? totalItems || 1 : Number(pageSize);
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedTransactions = pageSize === 'all' ? sortedTransactions : sortedTransactions.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const isTransferTx = (t: { category?: string }) => {
    const c = (t.category || '').toLowerCase();
    return c.includes('transfer') || c.includes('pindah') || c.includes('saldo');
  };

  const fixedIncome = filteredTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'fixed' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const variableIncome = filteredTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'variable' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = fixedIncome + variableIncome;
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const targetDesc = deleteTarget.description || deleteTarget.category;
    try {
      await deleteTransaction(deleteTarget.id);
      showToast(
        language === 'id' 
          ? `Transaksi "${targetDesc}" (Rp ${deleteTarget.amount.toLocaleString('id-ID')}) berhasil dihapus.` 
          : `Transaction deleted successfully.`,
        'success',
        'Transaksi Dihapus'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete transaction:", err);
      showToast(
        err.message || (language === 'id' ? 'Gagal menghapus transaksi.' : 'Failed to delete transaction.'),
        'error',
        'Gagal Hapus'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <CashFlowSkeleton />;
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
          <div>
            <h2 className="font-display-md text-on-surface mb-2">{t('cashFlowTitle')}</h2>
            <p className="font-body-lg text-on-surface-variant">
              {language === 'id' ? 'Catatan ringkasan & riwayat arus kas transaksi secara lengkap' : 'Overview and complete history of cash flow transactions'}
            </p>
          </div>

          {/* Workspace Filter Switcher */}
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCfWorkspaceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cfWorkspaceFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Semua Workspace' : 'All Workspaces'}
            </button>
            <button
              type="button"
              onClick={() => setCfWorkspaceFilter('keluarga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cfWorkspaceFilter === 'keluarga'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Keluarga' : 'Family'}
            </button>
            <button
              type="button"
              onClick={() => setCfWorkspaceFilter('pribadi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                cfWorkspaceFilter === 'pribadi'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Pribadi' : 'Personal'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated" className="p-6 flex flex-col justify-between overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex justify-between items-center mb-4 min-w-0">
                <h3 className="font-label-lg text-on-surface-variant uppercase tracking-wider truncate">{t('totalIncomeInflow')}</h3>
                <span className="material-symbols-outlined text-green-600 bg-green-100 p-1.5 rounded-full shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
              </div>
              <p className="font-headline-lg md:font-display-lg text-emerald-700 font-bold truncate" title={formatCurrency(totalIncome)}>{formatCurrency(totalIncome)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant flex justify-between min-w-0">
              <div className="min-w-0 pr-2 flex-1">
                <p className="font-label-sm text-on-surface-variant truncate">{t('fixedIncome')}</p>
                <p className="font-body-md font-semibold text-on-surface truncate" title={formatCurrency(fixedIncome)}>{formatCurrency(fixedIncome)}</p>
              </div>
              <div className="text-right min-w-0 pl-2 flex-1">
                <p className="font-label-sm text-on-surface-variant truncate">{t('variableIncome')}</p>
                <p className="font-body-md font-semibold text-on-surface truncate" title={formatCurrency(variableIncome)}>{formatCurrency(variableIncome)}</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-6 flex flex-col justify-between overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex justify-between items-center mb-4 min-w-0">
                <h3 className="font-label-lg text-on-surface-variant uppercase tracking-wider truncate">{t('totalExpenseOutflow')}</h3>
                <span className="material-symbols-outlined text-red-600 bg-red-100 p-1.5 rounded-full shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
              </div>
              <p className="font-headline-lg md:font-display-lg text-rose-700 font-bold truncate" title={formatCurrency(totalExpense)}>{formatCurrency(totalExpense)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-outline-variant flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              <span className="font-label-sm text-on-surface-variant truncate">{t('realtimeCloud')}</span>
            </div>
          </Card>

          <Card variant="primary" className="p-6 flex flex-col justify-between !bg-primary text-white border-transparent overflow-hidden min-w-0">
            <div className="min-w-0">
              <div className="flex justify-between items-center mb-4 min-w-0">
                <h3 className="font-label-lg text-primary-fixed-dim uppercase tracking-wider truncate">{t('netCashFlow')}</h3>
                <span className="material-symbols-outlined text-white shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              </div>
              <p className="font-headline-lg md:font-display-lg text-white mb-2 font-bold truncate" title={formatCurrency(netCashFlow)}>{netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}</p>
            </div>
            <div className="mt-auto min-w-0">
              <div className="w-full bg-primary-fixed/30 rounded-full h-2 mb-2 overflow-hidden shrink-0">
                <div className="bg-white h-2 rounded-full" style={{ width: `${totalIncome > 0 ? Math.min(Math.max((netCashFlow / totalIncome) * 100, 0), 100) : 0}%` }}></div>
              </div>
              <p className="font-label-sm text-primary-fixed-dim truncate">
                {t('savingsRatio')}: {totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0}%
              </p>
            </div>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card variant="elevated" className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="font-headline-sm font-bold text-on-surface">{t('transactionList')}</h3>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBulkConfirmOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-label-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span>{language === 'id' ? `Hapus Terpilih (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`}</span>
                </button>
              )}
              <div className="relative flex-1 sm:w-56">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Cari deskripsi / kategori...' : 'Search description / category...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-outline-variant pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <select
                value={cfPeriodFilter}
                onChange={(e) => setCfPeriodFilter(e.target.value as any)}
                className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="this-month">{language === 'id' ? 'Bulan Ini' : 'This Month'}</option>
                <option value="last-month">{language === 'id' ? 'Bulan Lalu' : 'Last Month'}</option>
                <option value="this-year">{language === 'id' ? 'Tahun Ini' : 'This Year'}</option>
                <option value="all-time">{language === 'id' ? 'Semua Waktu' : 'All Time'}</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">{language === 'id' ? 'Semua Tipe' : 'All Types'}</option>
                <option value="income">{language === 'id' ? 'Pemasukan' : 'Income'}</option>
                <option value="expense">{language === 'id' ? 'Pengeluaran' : 'Expense'}</option>
              </select>
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => handleSelectSort(e.target.value)}
                className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="date-desc">{language === 'id' ? 'Tanggal: Terbaru' : 'Date: Newest'}</option>
                <option value="date-asc">{language === 'id' ? 'Tanggal: Terlama' : 'Date: Oldest'}</option>
                <option value="amount-desc">{language === 'id' ? 'Nominal: Terbesar' : 'Amount: Highest'}</option>
                <option value="amount-asc">{language === 'id' ? 'Nominal: Terkecil' : 'Amount: Lowest'}</option>
                <option value="description-asc">{language === 'id' ? 'Deskripsi: A-Z' : 'Description: A-Z'}</option>
                <option value="description-desc">{language === 'id' ? 'Deskripsi: Z-A' : 'Description: Z-A'}</option>
                <option value="category-asc">{language === 'id' ? 'Kategori: A-Z' : 'Category: A-Z'}</option>
                <option value="category-desc">{language === 'id' ? 'Kategori: Z-A' : 'Category: Z-A'}</option>
                <option value="workspace-asc">{language === 'id' ? 'Workspace: A-Z' : 'Workspace: A-Z'}</option>
                <option value="workspace-desc">{language === 'id' ? 'Workspace: Z-A' : 'Workspace: Z-A'}</option>
              </select>
              <Button variant="primary" size="sm" icon="add" onClick={openTransactionModal}>
                {t('addTransaction')}
              </Button>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="py-3 px-4 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedIds.includes(t.id))}
                      ref={input => {
                        if (input) {
                          input.indeterminate = paginatedTransactions.some(t => selectedIds.includes(t.id)) && !paginatedTransactions.every(t => selectedIds.includes(t.id));
                        }
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                  <th 
                    onClick={() => handleHeaderSort('date')}
                    className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container/80 transition-colors select-none group"
                    title={language === 'id' ? 'Klik untuk mengurutkan berdasarkan tanggal' : 'Click to sort by date'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t('date')}</span>
                      <span className={`material-symbols-outlined text-sm transition-opacity ${sortField === 'date' ? 'text-primary opacity-100 font-bold' : 'text-on-surface-variant/40 opacity-0 group-hover:opacity-100'}`}>
                        {sortField === 'date' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleHeaderSort('description')}
                    className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container/80 transition-colors select-none group"
                    title={language === 'id' ? 'Klik untuk mengurutkan berdasarkan deskripsi' : 'Click to sort by description'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t('description')}</span>
                      <span className={`material-symbols-outlined text-sm transition-opacity ${sortField === 'description' ? 'text-primary opacity-100 font-bold' : 'text-on-surface-variant/40 opacity-0 group-hover:opacity-100'}`}>
                        {sortField === 'description' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleHeaderSort('category')}
                    className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container/80 transition-colors select-none group"
                    title={language === 'id' ? 'Klik untuk mengurutkan berdasarkan kategori' : 'Click to sort by category'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t('category')}</span>
                      <span className={`material-symbols-outlined text-sm transition-opacity ${sortField === 'category' ? 'text-primary opacity-100 font-bold' : 'text-on-surface-variant/40 opacity-0 group-hover:opacity-100'}`}>
                        {sortField === 'category' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleHeaderSort('workspace')}
                    className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container/80 transition-colors select-none group"
                    title={language === 'id' ? 'Klik untuk mengurutkan berdasarkan workspace' : 'Click to sort by workspace'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Workspace</span>
                      <span className={`material-symbols-outlined text-sm transition-opacity ${sortField === 'workspace' ? 'text-primary opacity-100 font-bold' : 'text-on-surface-variant/40 opacity-0 group-hover:opacity-100'}`}>
                        {sortField === 'workspace' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleHeaderSort('amount')}
                    className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container/80 transition-colors select-none group text-right"
                    title={language === 'id' ? 'Klik untuk mengurutkan berdasarkan nominal' : 'Click to sort by amount'}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{t('amount')}</span>
                      <span className={`material-symbols-outlined text-sm transition-opacity ${sortField === 'amount' ? 'text-primary opacity-100 font-bold' : 'text-on-surface-variant/40 opacity-0 group-hover:opacity-100'}`}>
                        {sortField === 'amount' ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider text-center">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/50">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                      {t('emptyTransactions')}
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => openTransactionDetailModal(t)}
                      className={`hover:bg-surface-container-low transition-colors group cursor-pointer ${selectedIds.includes(t.id) ? 'bg-primary-container/10' : ''}`}
                    >
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(t.id)}
                          onChange={(e) => handleSelectOne(t.id, e.target.checked)}
                          className="w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap">
                        {formatDateDDMMYYYY(t.date)}
                      </td>
                      <td className="py-4 px-4 font-medium text-on-surface flex items-center gap-3 whitespace-nowrap">
                        {(() => {
                          const isTransfer = (t.category || '').toLowerCase().includes('transfer') || (t.category || '').toLowerCase().includes('pindah') || (t.category || '').toLowerCase().includes('saldo');
                          return (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isTransfer ? 'bg-blue-100 text-blue-700' : t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {isTransfer ? 'sync_alt' : t.type === 'income' ? 'payments' : 'shopping_cart'}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="flex flex-col">
                          <span className="group-hover:text-primary transition-colors font-semibold">{t.title || t.description}</span>
                          {t.assetId && (() => {
                            const linked = (assets || []).find(a => a.id === t.assetId);
                            if (!linked) return null;
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md mt-0.5 w-fit">
                                <span className="material-symbols-outlined text-[12px]">domain</span>
                                {linked.name} {t.isCapitalization ? '• Capex' : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-surface-container rounded-lg text-xs font-medium text-on-surface border border-outline-variant">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 capitalize whitespace-nowrap font-medium text-on-surface-variant">{t.workspaceId}</td>
                      <td className={`py-4 px-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-on-surface'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openTransactionDetailModal(t)}
                          className="text-on-surface-variant hover:text-primary hover:bg-primary-container/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title={language === 'id' ? 'Detail Transaksi' : 'Transaction Detail'}
                        >
                          <span className="material-symbols-outlined text-lg">info</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          disabled={deletingId === t.id}
                          className="text-on-surface-variant hover:text-error hover:bg-error-container/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus transaksi"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant/60">
            <div className="font-body-sm text-on-surface-variant">
              {totalItems === 0
                ? (language === 'id' ? 'Menampilkan 0 transaksi' : 'Showing 0 transactions')
                : (language === 'id' 
                    ? `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalItems} transaksi` 
                    : `Showing ${startIndex + 1} - ${endIndex} of ${totalItems} transactions`)}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
                <span>{language === 'id' ? 'Per halaman:' : 'Per page:'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-surface border border-outline-variant px-2.5 py-1 rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">{language === 'id' ? 'Semua' : 'All'}</option>
                </select>
              </div>

              {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-outline-variant text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors cursor-pointer"
                    title={language === 'id' ? 'Halaman Sebelumnya' : 'Previous Page'}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>

                  {getPageNumbers().map((p, idx) => (
                    typeof p === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === p
                            ? 'bg-primary text-on-primary shadow-2xs'
                            : 'border border-outline-variant hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-xs text-on-surface-variant">...</span>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-outline-variant text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors cursor-pointer"
                    title={language === 'id' ? 'Halaman Berikutnya' : 'Next Page'}
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Mobile View */}
      <div className="flex-1 overflow-y-auto pb-24 md:hidden w-full mt-2">
        {/* Screen Title */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm font-bold text-on-surface">{t('cashFlow')}</h2>
            <p className="font-body-sm text-on-surface-variant">{workspace.toUpperCase()} Workspace</p>
          </div>
          <Button variant="primary" size="sm" icon="add" onClick={openTransactionModal}>
            {t('addTransaction')}
          </Button>
        </div>

        {/* Summary Card */}
        <section className="mb-6">
          <Card variant="default" className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-on-surface-variant uppercase tracking-wider">{t('financialOverview')}</span>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-label-sm capitalize">{workspace} Workspace</span>
            </div>
            <div className="flex justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">{t('income')}</p>
                <p className="font-headline-sm text-emerald-600 font-bold truncate">+{formatCurrency(totalIncome)}</p>
              </div>
              <div className="w-px bg-outline-variant shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-on-surface-variant mb-1 uppercase tracking-wider">{t('expense')}</p>
                <p className="font-headline-sm text-rose-600 font-bold truncate">-{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Transaction Feed */}
        <section>
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-3.5 mb-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <span className="font-label-md font-bold text-rose-700 text-xs shrink-0">
                {selectedIds.length} {language === 'id' ? 'Terpilih' : 'Selected'}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedIds([])} 
                  className="px-3 py-1.5 bg-surface border border-outline-variant hover:bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button 
                  onClick={() => setIsBulkConfirmOpen(true)} 
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  {language === 'id' ? 'Hapus' : 'Delete'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline-sm font-bold text-on-surface">{t('transactionList')}</h3>
            <span className="font-body-sm text-on-surface-variant">{totalItems} {language === 'id' ? 'transaksi' : 'items'}</span>
          </div>

          {/* Mobile Search, Filters, Sort & PageSize */}
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder={language === 'id' ? 'Cari deskripsi / kategori...' : 'Search description / category...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-outline-variant pl-9 pr-3 py-2 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <select
                value={cfPeriodFilter}
                onChange={(e) => setCfPeriodFilter(e.target.value as any)}
                className="bg-surface border border-outline-variant px-2.5 py-1.5 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary shrink-0 cursor-pointer"
              >
                <option value="this-month">{language === 'id' ? 'Bulan Ini' : 'This Month'}</option>
                <option value="last-month">{language === 'id' ? 'Bulan Lalu' : 'Last Month'}</option>
                <option value="this-year">{language === 'id' ? 'Tahun Ini' : 'This Year'}</option>
                <option value="all-time">{language === 'id' ? 'Semua Waktu' : 'All Time'}</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-surface border border-outline-variant px-2.5 py-1.5 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary shrink-0 cursor-pointer"
              >
                <option value="all">{language === 'id' ? 'Semua Tipe' : 'All Types'}</option>
                <option value="income">{language === 'id' ? 'Pemasukan' : 'Income'}</option>
                <option value="expense">{language === 'id' ? 'Pengeluaran' : 'Expense'}</option>
              </select>

              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => handleSelectSort(e.target.value)}
                className="bg-surface border border-outline-variant px-2.5 py-1.5 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary shrink-0 cursor-pointer"
              >
                <option value="date-desc">{language === 'id' ? 'Tanggal (Terbaru)' : 'Date (Newest)'}</option>
                <option value="date-asc">{language === 'id' ? 'Tanggal (Terlama)' : 'Date (Oldest)'}</option>
                <option value="amount-desc">{language === 'id' ? 'Nominal (Terbesar)' : 'Amount (Highest)'}</option>
                <option value="amount-asc">{language === 'id' ? 'Nominal (Terkecil)' : 'Amount (Lowest)'}</option>
                <option value="description-asc">{language === 'id' ? 'Deskripsi (A-Z)' : 'Description (A-Z)'}</option>
                <option value="description-desc">{language === 'id' ? 'Deskripsi (Z-A)' : 'Description (Z-A)'}</option>
                <option value="category-asc">{language === 'id' ? 'Kategori (A-Z)' : 'Category (A-Z)'}</option>
                <option value="category-desc">{language === 'id' ? 'Kategori (Z-A)' : 'Category (Z-A)'}</option>
                <option value="workspace-asc">{language === 'id' ? 'Workspace (A-Z)' : 'Workspace (A-Z)'}</option>
                <option value="workspace-desc">{language === 'id' ? 'Workspace (Z-A)' : 'Workspace (Z-A)'}</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-surface border border-outline-variant px-2.5 py-1.5 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:border-primary shrink-0 cursor-pointer"
              >
                <option value={15}>15 / hal</option>
                <option value={30}>30 / hal</option>
                <option value={50}>50 / hal</option>
                <option value={100}>100 / hal</option>
                <option value="all">{language === 'id' ? 'Semua' : 'All'}</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {paginatedTransactions.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
                {t('emptyTransactions')}
              </div>
            ) : (
              paginatedTransactions.map(t => (
                <div 
                  key={`mob-${t.id}`} 
                  onClick={() => openTransactionDetailModal(t)}
                  className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${selectedIds.includes(t.id) ? 'border-primary bg-primary-container/10' : 'border-outline-variant shadow-sm'}`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={(e) => handleSelectOne(t.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                    />
                    <div className="flex items-center gap-3">
                      {(() => {
                        const isTransfer = (t.category || '').toLowerCase().includes('transfer') || (t.category || '').toLowerCase().includes('pindah') || (t.category || '').toLowerCase().includes('saldo');
                        return (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            isTransfer ? 'bg-blue-100 text-blue-700' : t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {isTransfer ? 'sync_alt' : t.type === 'income' ? 'payments' : 'shopping_cart'}
                            </span>
                          </div>
                        );
                      })()}
                      <div>
                        <div className="font-body-md font-semibold text-on-surface truncate max-w-[150px]">{t.title || t.description}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface-variant">{t.category}</span>
                          {t.assetId && (() => {
                            const linked = (assets || []).find(a => a.id === t.assetId);
                            if (!linked) return null;
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                <span className="material-symbols-outlined text-[10px]">domain</span>
                                {linked.name}
                              </span>
                            );
                          })()}
                          <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{formatDateDDMMYYYY(t.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`font-body-lg font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-on-surface'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(t);
                      }}
                      disabled={deletingId === t.id}
                      className="text-on-surface-variant hover:text-error p-1 rounded transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Pagination Controls */}
          {totalItems > 0 && (
            <div className="mt-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
              <div className="text-center text-xs text-on-surface-variant font-medium">
                {language === 'id' 
                  ? `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalItems} transaksi` 
                  : `Showing ${startIndex + 1} - ${endIndex} of ${totalItems} transactions`}
              </div>
              {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    {language === 'id' ? 'Prev' : 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-on-surface px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container cursor-pointer flex items-center gap-1"
                  >
                    {language === 'id' ? 'Next' : 'Next'}
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={openTransactionModal}
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Transaksi"
        message="Apakah Anda yakin ingin menghapus catatan transaksi ini? Tindakan ini tidak dapat dibatalkan."
        itemDetails={deleteTarget ? [
          { label: 'Kategori', value: deleteTarget.category },
          { label: 'Deskripsi', value: deleteTarget.description || deleteTarget.title || '-' },
          { label: 'Nominal', value: formatCurrency(deleteTarget.amount) },
          { label: 'Tanggal', value: formatDateDDMMYYYY(deleteTarget.date) }
        ] : []}
        confirmText="Hapus Transaksi"
        isLoading={Boolean(deletingId)}
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title={language === 'id' ? 'Konfirmasi Hapus Banyak Transaksi' : 'Confirm Bulk Transaction Deletion'}
        message={language === 'id' 
          ? `Apakah Anda yakin ingin menghapus ${selectedIds.length} catatan transaksi yang dipilih secara massal? Tindakan ini tidak dapat dibatalkan.`
          : `Are you sure you want to delete ${selectedIds.length} selected transactions in bulk? This action cannot be undone.`}
        confirmText={language === 'id' ? 'Hapus Semua Terpilih' : 'Delete All Selected'}
        isLoading={isBulkDeleting}
      />
    </>
  );
}
