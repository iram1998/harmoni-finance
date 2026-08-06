import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { BillsSkeleton } from '../ui/Skeleton';
import { Bill } from '../../types';

export function Bills() {
  const { workspace, bills, markBillPaid, deleteBill, openBillModal } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [billsWsFilter, setBillsWsFilter] = useState<'pribadi' | 'keluarga' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteBill = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetName = deleteTarget.name;
    try {
      await deleteBill(deleteTarget.id);
      showToast(
        `Jadwal tagihan "${targetName}" berhasil dihapus.`,
        'success',
        'Tagihan Dihapus'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete bill', err);
      showToast(
        err.message || 'Gagal menghapus tagihan.',
        'error',
        'Gagal Hapus'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    if (!bill.id) return;
    try {
      await markBillPaid(bill.id);
      showToast(
        `Tagihan "${bill.name}" (Rp ${bill.amount.toLocaleString('id-ID')}) berhasil ditandai Lunas!`,
        'success',
        'Tagihan Lunas'
      );
    } catch (err: any) {
      console.error('Failed to mark bill paid:', err);
      showToast(
        err.message || 'Gagal memperbarui status tagihan.',
        'error',
        'Gagal Pembayaran'
      );
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [billsWsFilter]);

  const wsBills = bills.filter(b => billsWsFilter === 'all' ? true : (b.workspaceId || 'keluarga') === billsWsFilter);
  const totalBillsAmount = wsBills.reduce((acc, b) => acc + b.amount, 0);
  const paidBillsAmount = wsBills.filter(b => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  const unpaidBillsAmount = wsBills.filter(b => !b.isPaid).reduce((acc, b) => acc + b.amount, 0);
  const unpaidCount = wsBills.filter(b => !b.isPaid).length;

  const filteredBills = wsBills.filter(b => {
    if (filter === 'paid') return b.isPaid;
    if (filter === 'unpaid') return !b.isPaid;
    return true;
  });

  if (isLoading) {
    return <BillsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="font-display-md text-on-surface mb-2">{t('billsTitle')}</h2>
          <p className="font-body-lg text-on-surface-variant">{t('billsSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setBillsWsFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billsWsFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Semua Workspace' : 'All Workspaces'}
            </button>
            <button
              type="button"
              onClick={() => setBillsWsFilter('keluarga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billsWsFilter === 'keluarga'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Keluarga' : 'Family'}
            </button>
            <button
              type="button"
              onClick={() => setBillsWsFilter('pribadi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                billsWsFilter === 'pribadi'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {language === 'id' ? 'Pribadi' : 'Personal'}
            </button>
          </div>

          <Button variant="primary" icon="add" onClick={() => openBillModal()} className="shadow-md">
            {t('addBill')}
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Total Tagihan</span>
            <span className="material-symbols-outlined text-primary bg-primary-container/30 p-2 rounded-xl">receipt_long</span>
          </div>
          <p className="font-headline-lg font-bold text-on-surface">{formatCurrency(totalBillsAmount)}</p>
          <p className="font-label-sm text-on-surface-variant mt-2">{wsBills.length} Tagihan Terdaftar</p>
        </Card>

        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Belum Lunas</span>
            <span className="material-symbols-outlined text-rose-600 bg-rose-100 dark:bg-rose-950/50 p-2 rounded-xl">pending_actions</span>
          </div>
          <p className="font-headline-lg font-bold text-rose-600">{formatCurrency(unpaidBillsAmount)}</p>
          <p className="font-label-sm text-rose-500 font-semibold mt-2">{unpaidCount} Perlu Dibayar Segera</p>
        </Card>

        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">Sudah Lunas</span>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 p-2 rounded-xl">task_alt</span>
          </div>
          <p className="font-headline-lg font-bold text-emerald-600">{formatCurrency(paidBillsAmount)}</p>
          <p className="font-label-sm text-emerald-600 font-medium mt-2">{wsBills.length - unpaidCount} Tagihan Terselesaikan</p>
        </Card>
      </div>

      {/* Filter Tabs & List Card */}
      <Card variant="default" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-outline-variant pb-4">
          <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">format_list_bulleted</span>
            Daftar Tagihan
          </h3>

          {/* Filter Pills */}
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant/60 self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semua ({wsBills.length})
            </button>
            <button
              onClick={() => setFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'unpaid'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Belum Lunas ({unpaidCount})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'paid'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Lunas ({wsBills.length - unpaidCount})
            </button>
          </div>
        </div>

        {/* Bills Grid / Cards */}
        {filteredBills.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">event_available</span>
            <p className="font-body-md text-on-surface-variant mb-4">
              {filter === 'unpaid' ? 'Semua tagihan bulan ini sudah lunas!' : 'Belum ada tagihan terdaftar.'}
            </p>
            <Button variant="outline" size="sm" icon="add" onClick={() => openBillModal()}>
              {t('addBill')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.map(bill => (
              <div
                key={bill.id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  bill.isPaid
                    ? 'bg-surface-container-low/40 border-outline-variant opacity-80'
                    : 'bg-surface-container-low border-outline-variant hover:border-primary/50 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      bill.isPaid
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {bill.isPaid ? t('paid') : t('unpaid')}
                    </span>

                    <div className="flex gap-1">
                      <button
                        onClick={() => openBillModal(bill)}
                        className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10 cursor-pointer"
                        title="Edit Tagihan"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(bill)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10 cursor-pointer"
                        title="Hapus Tagihan"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {bill.category && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                        {bill.category}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary-container/40 text-primary">
                      {bill.isRecurring === false ? 'Sekali Bayar' : `🔁 Rutin ${bill.recurringPeriod === 'weekly' ? 'Mingguan' : bill.recurringPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-container-high text-on-surface-variant capitalize">
                      {bill.workspaceId || 'keluarga'}
                    </span>
                  </div>

                  <h4 className="font-headline-sm font-semibold text-on-surface mb-1">{bill.name}</h4>
                  <p className="font-display-sm font-bold text-primary mb-2">{formatCurrency(bill.amount)}</p>
                </div>

                <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>Jatuh tempo: <strong>{new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</strong></span>
                  </div>

                  {!bill.isPaid && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMarkPaid(bill)}
                      className="text-xs py-1.5 px-3 cursor-pointer"
                    >
                      {t('markAsPaid')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm Delete Bill Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteBill}
        title="Konfirmasi Hapus Tagihan"
        message="Apakah Anda yakin ingin menghapus jadwal pengingat tagihan ini?"
        itemDetails={deleteTarget ? [
          { label: 'Nama Tagihan', value: deleteTarget.name },
          { label: 'Nominal Tagihan', value: formatCurrency(deleteTarget.amount) },
          { label: 'Jatuh Tempo', value: new Date(deleteTarget.dueDate).toLocaleDateString('id-ID') },
          { label: 'Status', value: deleteTarget.isPaid ? 'Lunas' : 'Belum Lunas' }
        ] : []}
        confirmText="Hapus Tagihan"
        isLoading={isDeleting}
      />
    </div>
  );
}
