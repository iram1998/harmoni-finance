import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Debt, WorkspaceType } from '../../types';

export function Debts() {
  const { workspace, debts, addDebt, payDebt, deleteDebt, paymentAccounts } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();
  const isId = language === 'id';

  const [debtsWsFilter, setDebtsWsFilter] = useState<WorkspaceType>(workspace);
  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable' | 'paid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync workspace filter when global workspace changes
  useEffect(() => {
    setDebtsWsFilter(workspace);
  }, [workspace]);

  // Add Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetWs, setTargetWs] = useState<'pribadi' | 'keluarga'>(workspace === 'pribadi' ? 'pribadi' : 'keluarga');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payAccId, setPayAccId] = useState('');

  // Filter debts by workspace
  const workspaceDebts = debts.filter(d => debtsWsFilter === 'all' ? true : (d.workspaceId || 'keluarga') === debtsWsFilter);

  // Filtered list by tab
  const filteredDebts = workspaceDebts.filter(d => {
    if (activeTab === 'payable') return d.type === 'payable' && d.status !== 'paid';
    if (activeTab === 'receivable') return d.type === 'receivable' && d.status !== 'paid';
    if (activeTab === 'paid') return d.status === 'paid';
    return true;
  });

  // Calculate Summaries
  const totalPayable = workspaceDebts
    .filter(d => d.type === 'payable' && d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const totalReceivable = workspaceDebts
    .filter(d => d.type === 'receivable' && d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  const netBalance = totalReceivable - totalPayable;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
    try {
      await addDebt(name.trim(), type, parseFloat(amount), dueDate || undefined, targetWs);
      showToast(
        isId ? `Catatan ${type === 'payable' ? 'utang' : 'piutang'} "${name.trim()}" berhasil disimpan.` : `Debt/receivable record "${name.trim()}" saved.`,
        'success',
        isId ? 'Berhasil Menyimpan' : 'Record Saved'
      );
      setName('');
      setAmount('');
      setDueDate('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err.message || (isId ? 'Gagal menyimpan catatan.' : 'Failed to save record.'), 'error');
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || parseFloat(payAmount) <= 0) return;
    try {
      await payDebt(selectedDebt.id, parseFloat(payAmount), payAccId || undefined);
      showToast(
        isId ? `Pembayaran untuk "${selectedDebt.name}" sebesar ${formatCurrency(parseFloat(payAmount))} berhasil dicatat!` : `Payment of ${formatCurrency(parseFloat(payAmount))} for "${selectedDebt.name}" recorded!`,
        'success',
        isId ? 'Pembayaran Berhasil' : 'Payment Success'
      );
      setPayAmount('');
      setPayAccId('');
      setSelectedDebt(null);
      setIsPayModalOpen(false);
    } catch (err: any) {
      showToast(err.message || (isId ? 'Gagal mencatat pembayaran.' : 'Failed to record payment.'), 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetName = deleteTarget.name;
    try {
      await deleteDebt(deleteTarget.id);
      showToast(
        isId ? `Catatan "${targetName}" berhasil dihapus.` : `Record "${targetName}" deleted successfully.`,
        'success',
        isId ? 'Catatan Dihapus' : 'Record Deleted'
      );
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err.message || (isId ? 'Gagal menghapus catatan.' : 'Failed to delete record.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="font-display-md text-on-surface mb-2">{t('debtsAndReceivables')}</h2>
          <p className="font-body-lg text-on-surface-variant">{t('debtsAndReceivablesSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Workspace Filter Buttons */}
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDebtsWsFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                debtsWsFilter === 'all'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isId ? 'Semua Workspace' : 'All Workspaces'}
            </button>
            <button
              type="button"
              onClick={() => setDebtsWsFilter('keluarga')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                debtsWsFilter === 'keluarga'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isId ? 'Keluarga' : 'Family'}
            </button>
            <button
              type="button"
              onClick={() => setDebtsWsFilter('pribadi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                debtsWsFilter === 'pribadi'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {isId ? 'Pribadi' : 'Personal'}
            </button>
          </div>

          <Button
            variant="primary"
            icon="add"
            onClick={() => {
              setTargetWs(debtsWsFilter === 'pribadi' ? 'pribadi' : 'keluarga');
              setIsAddModalOpen(true);
            }}
            className="shadow-md"
          >
            {isId ? 'Catat Utang / Piutang' : 'Add Debt / Receivable'}
          </Button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">
              {isId ? 'Total Utang Saya' : 'Total Debt (Payable)'}
            </span>
            <span className="material-symbols-outlined text-rose-600 bg-rose-500/10 p-2 rounded-xl">
              trending_down
            </span>
          </div>
          <p className="font-headline-lg font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(totalPayable)}
          </p>
          <p className="font-label-sm text-on-surface-variant mt-2">
            {isId ? 'Kewajiban harus dibayar' : 'Total amount owed'}
          </p>
        </Card>

        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">
              {isId ? 'Total Piutang Saya' : 'Total Receivable'}
            </span>
            <span className="material-symbols-outlined text-emerald-600 bg-emerald-500/10 p-2 rounded-xl">
              trending_up
            </span>
          </div>
          <p className="font-headline-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalReceivable)}
          </p>
          <p className="font-label-sm text-on-surface-variant mt-2">
            {isId ? 'Uang yang dipinjamkan ke pihak lain' : 'Total amount owed to you'}
          </p>
        </Card>

        <Card variant="elevated" className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-on-surface-variant uppercase tracking-wider">
              {isId ? 'Posisi Bersih (Net)' : 'Net Position'}
            </span>
            <span className={`material-symbols-outlined p-2 rounded-xl ${netBalance >= 0 ? 'text-primary bg-primary/10' : 'text-amber-600 bg-amber-500/10'}`}>
              balance
            </span>
          </div>
          <p className={`font-headline-lg font-bold ${netBalance >= 0 ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}>
            {formatCurrency(netBalance)}
          </p>
          <p className="font-label-sm text-on-surface-variant mt-2">
            {netBalance >= 0 ? (isId ? 'Piutang lebih besar dari utang' : 'Receivables exceed debts') : (isId ? 'Utang lebih besar dari piutang' : 'Debts exceed receivables')}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {isId ? 'Semua Catatan' : 'All Records'} ({workspaceDebts.length})
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payable'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {isId ? 'Utang Saya' : 'My Debts'} ({workspaceDebts.filter(d => d.type === 'payable' && d.status !== 'paid').length})
        </button>
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'receivable'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {isId ? 'Piutang Saya' : 'My Receivables'} ({workspaceDebts.filter(d => d.type === 'receivable' && d.status !== 'paid').length})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'paid'
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {isId ? 'Sudah Lunas' : 'Paid Off'} ({workspaceDebts.filter(d => d.status === 'paid').length})
        </button>
      </div>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <Card variant="default" className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="font-headline-sm font-bold text-on-surface">
            {isId ? 'Tidak Ada Catatan Utang / Piutang' : 'No Debts or Receivables Found'}
          </h3>
          <p className="font-body-md text-on-surface-variant mt-1 max-w-sm mx-auto">
            {isId ? 'Semua catatan keuangan Anda di workspace ini terkontrol dengan sangat baik.' : 'All financial records in this workspace are up to date.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDebts.map(debt => {
            const isPayable = debt.type === 'payable';
            const paidAmount = debt.amount - debt.remainingAmount;
            const progressPct = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 100;

            return (
              <Card
                key={debt.id}
                variant="default"
                className="p-6 flex flex-col justify-between gap-4 hover:border-outline transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isPayable
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <span className="material-symbols-outlined text-xs">{isPayable ? 'call_made' : 'call_received'}</span>
                          {isPayable ? (isId ? 'Utang Saya' : 'Payable') : (isId ? 'Piutang Saya' : 'Receivable')}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          (debt.workspaceId || 'keluarga') === 'pribadi' || (debt.workspaceId || 'keluarga') === 'personal'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {(debt.workspaceId || 'keluarga') === 'pribadi' || (debt.workspaceId || 'keluarga') === 'personal' ? (isId ? 'Pribadi' : 'Personal') : (isId ? 'Keluarga' : 'Family')}
                        </span>
                      </div>
                      <h3 className="font-headline-sm font-bold text-on-surface">
                        {debt.name}
                      </h3>
                    </div>

                    {debt.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        {isId ? 'Lunas' : 'Paid'}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDebt(debt);
                          setPayAmount(debt.remainingAmount.toString());
                          setIsPayModalOpen(true);
                        }}
                      >
                        {isPayable ? (isId ? 'Bayar Cicilan' : 'Pay Debt') : (isId ? 'Terima Pelunasan' : 'Receive Payment')}
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>{isId ? 'Sisa' : 'Remaining'}: <strong className="font-bold text-on-surface">{formatCurrency(debt.remainingAmount)}</strong></span>
                      <span>Total: {formatCurrency(debt.amount)}</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${debt.status === 'paid' ? 'bg-outline-variant' : isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                      <span>{progressPct}% {isId ? 'terbayar' : 'completed'}</span>
                      {debt.dueDate && (
                        <span>{isId ? 'Jatuh Tempo' : 'Due'}: {new Date(debt.dueDate).toLocaleDateString(isId ? 'id-ID' : 'en-US')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-outline-variant/50 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(debt)}
                    title={isId ? 'Hapus' : 'Delete'}
                  >
                    <span className="material-symbols-outlined text-lg text-rose-500">delete</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add Debt */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm font-bold text-on-surface">
                {isId ? 'Tambah Catatan Utang / Piutang' : 'Add Debt / Receivable'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Workspace
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetWs('keluarga')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      targetWs === 'keluarga'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {isId ? 'Keluarga' : 'Family'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetWs('pribadi')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      targetWs === 'pribadi'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {isId ? 'Pribadi' : 'Personal'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Jenis' : 'Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('payable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      type === 'payable'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {isId ? 'Utang Saya (Kewajiban)' : 'Payable (Debt)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('receivable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      type === 'receivable'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {isId ? 'Piutang Saya (Tagihan)' : 'Receivable'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Nama / Keterangan' : 'Name / Description'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={type === 'payable' ? (isId ? 'Contoh: Pinjaman KPR Bank BCA' : 'e.g. Bank Loan') : (isId ? 'Contoh: Pinjaman ke Budi' : 'e.g. Money lent to John')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Jumlah Total (Rp)' : 'Total Amount (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Tanggal Jatuh Tempo (Opsional)' : 'Due Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-outline-variant/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {isId ? 'Batal' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {isId ? 'Simpan' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay / Receive Modal */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm font-bold text-on-surface">
                {selectedDebt.type === 'payable' ? (isId ? 'Catat Pembayaran Utang' : 'Record Debt Payment') : (isId ? 'Catat Penerimaan Piutang' : 'Record Receivable Received')}
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs space-y-1">
                <div className="font-bold text-on-surface text-sm">{selectedDebt.name}</div>
                <div className="text-on-surface-variant">
                  {isId ? 'Sisa yang harus dibayar' : 'Remaining balance'}: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(selectedDebt.remainingAmount)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Nominal Pembayaran (Rp)' : 'Payment Amount (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDebt.remainingAmount}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Rekening Pembayaran / Sumber Dana' : 'Payment Account / Source'}
                </label>
                <select
                  value={payAccId}
                  onChange={e => setPayAccId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">{isId ? '-- Pilih Rekening (Opsional) --' : '-- Select Account (Optional) --'}</option>
                  {paymentAccounts
                    .filter(a => a.workspaceId === selectedDebt.workspaceId)
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  {isId ? 'Jika dipilih, saldo rekening ini akan otomatis disesuaikan dan transaksi baru tercatat di Arus Kas.' : 'Selected account balance will be automatically updated.'}
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-outline-variant/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  {isId ? 'Batal' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {isId ? 'Konfirmasi Pembayaran' : 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={isId ? 'Hapus Catatan' : 'Delete Record'}
        message={isId ? 'Apakah Anda yakin ingin menghapus catatan utang/piutang ini?' : 'Are you sure you want to delete this record?'}
        itemDetails={deleteTarget ? [
          { label: isId ? 'Nama Catatan' : 'Name', value: deleteTarget.name },
          { label: isId ? 'Sisa Nominal' : 'Remaining', value: formatCurrency(deleteTarget.remainingAmount) }
        ] : []}
        confirmText={isId ? 'Hapus' : 'Delete'}
        cancelText={isId ? 'Batal' : 'Cancel'}
      />
    </div>
  );
}
