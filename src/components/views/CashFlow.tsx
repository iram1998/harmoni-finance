import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CashFlowSkeleton } from '../ui/Skeleton';
import { Transaction } from '../../types';

export function CashFlow() {
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const { workspace, transactions, deleteTransaction, openTransactionModal } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();

  // Local filter states
  const [cfWorkspaceFilter, setCfWorkspaceFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cfWorkspaceFilter]);
  
  const wsTransactions = transactions.filter(t => {
    const matchWs = cfWorkspaceFilter === 'all' ? true : (t.workspaceId || 'keluarga') === cfWorkspaceFilter;
    const matchType = typeFilter === 'all' ? true : t.type === typeFilter;
    const desc = (t.description || t.title || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchSearch = desc.includes(search) || cat.includes(search);
    return matchWs && matchType && matchSearch;
  });

  const fixedIncome = wsTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'fixed').reduce((acc, t) => acc + t.amount, 0);
  const variableIncome = wsTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'variable').reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = fixedIncome + variableIncome;
  const totalExpense = wsTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
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
              <div className="relative flex-1 sm:w-64">
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-surface border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="all">{language === 'id' ? 'Semua Tipe' : 'All Types'}</option>
                <option value="income">{language === 'id' ? 'Pemasukan' : 'Income'}</option>
                <option value="expense">{language === 'id' ? 'Pengeluaran' : 'Expense'}</option>
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
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider">{t('date')}</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider">{t('description')}</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider">{t('category')}</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider">Workspace</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider text-right">{t('amount')}</th>
                  <th className="py-3 px-4 font-label-md text-on-surface-variant uppercase tracking-wider text-center">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/50">
                {wsTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                      {t('emptyTransactions')}
                    </td>
                  </tr>
                ) : (
                  wsTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 font-medium text-on-surface flex items-center gap-3 whitespace-nowrap">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {t.type === 'income' ? 'payments' : 'shopping_cart'}
                          </span>
                        </div>
                        {t.title || t.description}
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
                      <td className="py-4 px-4 text-center whitespace-nowrap">
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
          <div className="mt-6 flex justify-between items-center">
            <span className="font-body-sm text-on-surface-variant">Menampilkan {wsTransactions.length} transaksi</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-sm font-bold text-on-surface">{t('transactionList')}</h3>
            <span className="font-body-sm text-on-surface-variant">{wsTransactions.length} items</span>
          </div>
          
          <div className="space-y-3">
            {wsTransactions.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl border border-outline-variant">
                {t('emptyTransactions')}
              </div>
            ) : (
              wsTransactions.map(t => (
                <div key={`mob-${t.id}`} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <span className="material-symbols-outlined text-[20px]">{t.type === 'income' ? 'payments' : 'shopping_cart'}</span>
                    </div>
                    <div>
                      <div className="font-body-md font-semibold text-on-surface">{t.title || t.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-medium text-on-surface-variant">{t.category}</span>
                        <span className="text-[11px] text-on-surface-variant">{new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-body-lg font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-on-surface'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                    <button
                      onClick={() => setDeleteTarget(t)}
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
          { label: 'Tanggal', value: new Date(deleteTarget.date).toLocaleDateString('id-ID') }
        ] : []}
        confirmText="Hapus Transaksi"
        isLoading={Boolean(deletingId)}
      />
    </>
  );
}
