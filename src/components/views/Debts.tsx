import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Debt, WorkspaceType, Transaction } from '../../types';

export function Debts() {
  const { workspace, debts, addDebt, updateDebt, payDebt, deleteDebt, paymentAccounts, transactions } = useFinance();
  const { t, language } = useThemeLanguage();
  const { showToast } = useToast();
  const isId = language === 'id';

  const [debtsWsFilter, setDebtsWsFilter] = useState<WorkspaceType>(workspace);
  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable' | 'paid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync workspace filter when global workspace changes
  useEffect(() => {
    setDebtsWsFilter(workspace);
  }, [workspace]);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState('0');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [installmentDay, setInstallmentDay] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');
  const [notes, setNotes] = useState('');
  const [targetWs, setTargetWs] = useState<'pribadi' | 'keluarga'>(workspace === 'pribadi' ? 'pribadi' : 'keluarga');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payAccId, setPayAccId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState('');

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

  // Linked Transactions for a specific Debt
  const getLinkedTransactions = (debt: Debt): Transaction[] => {
    return transactions.filter(t => {
      if (t.debtId && t.debtId === debt.id) return true;
      if (t.category === 'Cicilan & Utang' && t.description.toLowerCase().includes(debt.name.toLowerCase())) return true;
      return false;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleOpenAddModal = () => {
    setName('');
    setType('payable');
    setAmount('');
    setAlreadyPaid('0');
    setRemainingAmount('');
    setStartDate('');
    setDueDate('');
    setInstallmentDay('');
    setTenorMonths('');
    setNotes('');
    setTargetWs(debtsWsFilter === 'pribadi' ? 'pribadi' : 'keluarga');
    setEditingDebt(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setType(debt.type);
    setAmount(debt.amount.toString());
    const paid = Math.max(0, debt.amount - debt.remainingAmount);
    setAlreadyPaid(paid.toString());
    setRemainingAmount(debt.remainingAmount.toString());
    setStartDate(debt.startDate || '');
    setDueDate(debt.dueDate || '');
    setInstallmentDay(debt.installmentDay ? debt.installmentDay.toString() : '');
    setTenorMonths(debt.tenorMonths ? debt.tenorMonths.toString() : '');
    setNotes(debt.notes || '');
    setTargetWs((debt.workspaceId || 'keluarga') === 'pribadi' ? 'pribadi' : 'keluarga');
    setIsEditModalOpen(true);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const total = parseFloat(val) || 0;
    const paid = parseFloat(alreadyPaid) || 0;
    setRemainingAmount(Math.max(0, total - paid).toString());
  };

  const handleAlreadyPaidChange = (val: string) => {
    setAlreadyPaid(val);
    const total = parseFloat(amount) || 0;
    const paid = parseFloat(val) || 0;
    setRemainingAmount(Math.max(0, total - paid).toString());
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || parseFloat(amount) <= 0) return;
    const totalAmt = parseFloat(amount);
    const remAmt = remainingAmount !== '' ? Math.max(0, parseFloat(remainingAmount)) : Math.max(0, totalAmt - (parseFloat(alreadyPaid) || 0));

    try {
      await addDebt(
        name.trim(),
        type,
        totalAmt,
        dueDate || undefined,
        targetWs,
        startDate || undefined,
        remAmt,
        installmentDay ? parseInt(installmentDay, 10) : undefined,
        notes.trim() || undefined,
        tenorMonths ? parseInt(tenorMonths, 10) : undefined
      );
      showToast(
        isId ? `Catatan ${type === 'payable' ? 'utang' : 'piutang'} "${name.trim()}" berhasil disimpan.` : `Debt/receivable record "${name.trim()}" saved.`,
        'success',
        isId ? 'Berhasil Menyimpan' : 'Record Saved'
      );
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err.message || (isId ? 'Gagal menyimpan catatan.' : 'Failed to save record.'), 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt || !name.trim() || !amount || parseFloat(amount) <= 0) return;
    const totalAmt = parseFloat(amount);
    const remAmt = remainingAmount !== '' ? Math.max(0, parseFloat(remainingAmount)) : Math.max(0, totalAmt - (parseFloat(alreadyPaid) || 0));

    try {
      await updateDebt(editingDebt.id, {
        name: name.trim(),
        type,
        amount: totalAmt,
        remainingAmount: remAmt,
        workspaceId: targetWs,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        installmentDay: installmentDay ? parseInt(installmentDay, 10) : undefined,
        tenorMonths: tenorMonths ? parseInt(tenorMonths, 10) : undefined,
        notes: notes.trim() || undefined,
        status: remAmt <= 0 ? 'paid' : 'active'
      });
      showToast(
        isId ? `Catatan "${name.trim()}" berhasil diperbarui.` : `Record "${name.trim()}" updated successfully.`,
        'success',
        isId ? 'Berhasil Memperbarui' : 'Record Updated'
      );
      setIsEditModalOpen(false);
      setEditingDebt(null);
    } catch (err: any) {
      showToast(err.message || (isId ? 'Gagal memperbarui catatan.' : 'Failed to update record.'), 'error');
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || parseFloat(payAmount) <= 0) return;
    try {
      await payDebt(
        selectedDebt.id,
        parseFloat(payAmount),
        payAccId || undefined,
        payDate || undefined,
        payNote.trim() || undefined
      );
      showToast(
        isId ? `Pembayaran untuk "${selectedDebt.name}" sebesar ${formatCurrency(parseFloat(payAmount))} berhasil tercatat dan masuk ke Arus Kas!` : `Payment of ${formatCurrency(parseFloat(payAmount))} for "${selectedDebt.name}" recorded in Cash Flow!`,
        'success',
        isId ? 'Pembayaran & Transaksi Berhasil' : 'Payment & Transaction Success'
      );
      setPayAmount('');
      setPayAccId('');
      setPayNote('');
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

  // Helper calculations for tenor
  const calcEstimatedMonthly = (totAmt: number, tenor?: number) => {
    if (!tenor || tenor <= 0 || totAmt <= 0) return 0;
    return Math.round(totAmt / tenor);
  };

  const calcRemainingMonths = (remAmt: number, estMonthly: number) => {
    if (!estMonthly || estMonthly <= 0 || remAmt <= 0) return 0;
    return Math.ceil(remAmt / estMonthly);
  };

  const renderDebtFormFields = () => {
    const totAmountNum = parseFloat(amount) || 0;
    const tenorNum = parseInt(tenorMonths, 10) || 0;
    const estMonthlyVal = tenorNum > 0 ? Math.round(totAmountNum / tenorNum) : 0;

    return (
      <>
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
            {isId ? 'Jenis Catatan' : 'Type'}
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
            {isId ? 'Nama / Keterangan Utang Piutang' : 'Name / Description'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={type === 'payable' ? (isId ? 'Contoh: Pinjaman KPR Bank BCA / Cicilan Motor' : 'e.g. Bank Loan') : (isId ? 'Contoh: Pinjaman ke Budi' : 'e.g. Money lent to John')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {isId ? 'Total Nominal Awal (Rp)' : 'Total Amount (Rp)'}
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
              onWheel={e => e.currentTarget.blur()}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {isId ? 'Sudah Terbayar Saat Ini (Rp)' : 'Already Paid So Far (Rp)'}
            </label>
            <input
              type="number"
              min="0"
              value={alreadyPaid}
              onChange={e => handleAlreadyPaidChange(e.target.value)}
              onWheel={e => e.currentTarget.blur()}
              placeholder="0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
          <span className="font-medium text-on-surface-variant">
            {isId ? 'Sisa Utang / Piutang Otomatis:' : 'Calculated Remaining:'}
          </span>
          <span className="font-bold text-sm text-primary">
            {formatCurrency(parseFloat(remainingAmount) || 0)}
          </span>
        </div>

        {/* Jangka Waktu / Tenor Detail */}
        <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">timelapse</span>
              {isId ? 'Jangka Waktu / Tenor (Bulan)' : 'Tenor / Duration (Months)'}
            </label>
            {estMonthlyVal > 0 && (
              <span className="text-xs font-extrabold text-primary">
                ~{formatCurrency(estMonthlyVal)} / {isId ? 'bln' : 'mo'}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                min="1"
                max="360"
                value={tenorMonths}
                onChange={e => setTenorMonths(e.target.value)}
                onWheel={e => e.currentTarget.blur()}
                placeholder={isId ? 'Contoh: 12 (12 Bulan)' : 'e.g. 12 (12 Months)'}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                {isId ? 'Isi lama cicilan dalam bulan (misal 12, 24, 36).' : 'Enter duration in months (e.g. 12, 24, 36).'}
              </p>
            </div>

            <div>
              <input
                type="number"
                min="1"
                max="31"
                value={installmentDay}
                onChange={e => setInstallmentDay(e.target.value)}
                onWheel={e => e.currentTarget.blur()}
                placeholder={isId ? 'Tgl Jatuh Tempo (1-31)' : 'Due Day (1-31)'}
                className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                {isId ? 'Tanggal cicilan per bulan (misal tgl 15).' : 'Monthly due day (e.g. 15th).'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {isId ? 'Tanggal Mulai (Opsional)' : 'Start Date (Optional)'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {isId ? 'Tanggal Jatuh Tempo Akhir (Opsional)' : 'Final Due Date (Optional)'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            {isId ? 'Catatan / Keterangan Tambahan (Opsional)' : 'Notes / Additional Details (Optional)'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isId ? 'Contoh: Bunga 0%, cicilan 12 bulan via transfer bank' : 'Notes about terms, interest, etc.'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </>
    );
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
            onClick={handleOpenAddModal}
            className="shadow-md"
          >
            {isId ? 'Catat Utang / Piutang' : 'Add Debt / Receivable'}
          </Button>
        </div>
      </div>

      {/* Info Banner on Transactions & Payments */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-on-surface">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">receipt_long</span>
          </div>
          <div>
            <strong className="font-bold block text-sm">
              {isId ? 'Sistem Pembayaran Terintegrasi ke Arus Kas' : 'Integrated Cash Flow System'}
            </strong>
            <p className="text-on-surface-variant">
              {isId 
                ? 'Setiap pembayaran cicilan yang Anda catat akan otomatis mencatatkan Transaksi resmi (Pengeluaran/Pemasukan) & memperbarui saldo rekening terikat!' 
                : 'Every installment payment automatically creates an official transaction entry in Cash Flow & updates your selected account balance!'}
            </p>
          </div>
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
      <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl w-full sm:w-fit overflow-x-auto max-w-full whitespace-nowrap">
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
            const paidAmount = Math.max(0, debt.amount - debt.remainingAmount);
            const progressPct = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 100;

            const linkedTxs = getLinkedTransactions(debt);
            const estMonthly = calcEstimatedMonthly(debt.amount, debt.tenorMonths);
            const remMonths = calcRemainingMonths(debt.remainingAmount, estMonthly);

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
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant shrink-0">
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
                          setPayDate(new Date().toISOString().slice(0, 10));
                          setPayNote('');
                          setIsPayModalOpen(true);
                        }}
                        className="shrink-0"
                      >
                        {isPayable ? (isId ? 'Bayar Cicilan' : 'Pay Debt') : (isId ? 'Terima Pelunasan' : 'Receive Payment')}
                      </Button>
                    )}
                  </div>

                  {/* Tenor / Monthly Installment Info Box */}
                  {(debt.tenorMonths || estMonthly > 0 || debt.installmentDay) && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant block text-[11px] font-medium">
                          {isId ? 'Tenor & Cicilan:' : 'Tenor & Monthly:'}
                        </span>
                        <strong className="font-bold text-on-surface text-xs block">
                          {debt.tenorMonths ? `${debt.tenorMonths} ${isId ? 'Bulan' : 'Months'}` : (isId ? 'Fleksibel' : 'Flexible')}
                          {estMonthly > 0 ? ` (~${formatCurrency(estMonthly)}/${isId ? 'bln' : 'mo'})` : ''}
                        </strong>
                      </div>

                      <div className="text-right">
                        <span className="text-on-surface-variant block text-[11px] font-medium">
                          {isId ? 'Estimasi Sisa Tenor:' : 'Est. Remaining:'}
                        </span>
                        <strong className="font-bold text-primary text-xs block">
                          {debt.status === 'paid' ? (isId ? '0 Bulan (Lunas)' : '0 Months (Paid)') : (remMonths > 0 ? `${remMonths} ${isId ? 'Bulan lagi' : 'Months left'}` : (isId ? 'Sesuai Sisa Saldo' : 'Per remaining balance'))}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Amounts Summary & Progress Bar */}
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-baseline text-xs text-on-surface-variant">
                      <span>
                        {isId ? 'Sisa:' : 'Remaining:'} <strong className="font-bold text-base text-on-surface">{formatCurrency(debt.remainingAmount)}</strong>
                      </span>
                      <span>
                        {isId ? 'Total:' : 'Total:'} <span className="font-semibold">{formatCurrency(debt.amount)}</span>
                      </span>
                    </div>

                    <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${debt.status === 'paid' ? 'bg-outline-variant' : isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                      <span>
                        {isId ? 'Terbayar:' : 'Paid:'} {formatCurrency(paidAmount)} ({progressPct}%)
                      </span>
                      {debt.installmentDay && (
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">event_repeat</span>
                          {isId ? `Tgl ${debt.installmentDay}/bln` : `On ${debt.installmentDay}th monthly`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional Dates & Notes */}
                  <div className="mt-3 pt-3 border-t border-outline-variant/40 flex flex-wrap gap-2 text-[11px] text-on-surface-variant">
                    {debt.startDate && (
                      <span className="inline-flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-md border border-outline-variant/40">
                        <span className="material-symbols-outlined text-xs text-primary">calendar_month</span>
                        {isId ? 'Mulai:' : 'Start:'} {new Date(debt.startDate).toLocaleDateString(isId ? 'id-ID' : 'en-US')}
                      </span>
                    )}

                    {debt.dueDate && (
                      <span className="inline-flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-md border border-outline-variant/40">
                        <span className="material-symbols-outlined text-xs text-amber-600 dark:text-amber-400">event</span>
                        {isId ? 'Akhir:' : 'Due:'} {new Date(debt.dueDate).toLocaleDateString(isId ? 'id-ID' : 'en-US')}
                      </span>
                    )}
                  </div>

                  {debt.notes && (
                    <p className="text-xs text-on-surface-variant italic mt-2.5 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/30">
                      "{debt.notes}"
                    </p>
                  )}
                </div>

                {/* Linked Transactions Trigger & Footer Actions */}
                <div className="pt-3 border-t border-outline-variant/50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryDebt(debt)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">history</span>
                    {isId ? 'Riwayat Transaksi Terkait' : 'Linked Transactions'} ({linkedTxs.length})
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(debt)}
                      title={isId ? 'Edit Catatan' : 'Edit Record'}
                    >
                      <span className="material-symbols-outlined text-lg text-primary">edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(debt)}
                      title={isId ? 'Hapus' : 'Delete'}
                    >
                      <span className="material-symbols-outlined text-lg text-rose-500">delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add Debt */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
              <h3 className="font-headline-sm font-bold text-on-surface">
                {isId ? 'Tambah Catatan Utang / Piutang' : 'Add Debt / Receivable'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {renderDebtFormFields()}

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

      {/* Modal Edit Debt */}
      {isEditModalOpen && editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/40">
              <h3 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                {isId ? 'Edit Catatan Utang / Piutang' : 'Edit Debt / Receivable'}
              </h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingDebt(null); }} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {renderDebtFormFields()}

              <div className="pt-3 flex justify-end gap-3 border-t border-outline-variant/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsEditModalOpen(false); setEditingDebt(null); }}
                >
                  {isId ? 'Batal' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {isId ? 'Simpan Perubahan' : 'Save Changes'}
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
                  onWheel={e => e.currentTarget.blur()}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Tanggal Pembayaran' : 'Payment Date'}
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
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
                    .filter(a => debtsWsFilter === 'all' ? true : a.workspaceId === selectedDebt.workspaceId)
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  {isId 
                    ? 'Jika dipilih, saldo rekening ini akan otomatis disesuaikan dan transaksi baru tercatat di Arus Kas.' 
                    : 'Selected account balance will be automatically updated & recorded in Cash Flow.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  {isId ? 'Catatan Pembayaran (Opsional)' : 'Payment Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder={isId ? 'Contoh: Cicilan Bulan Ke-3 via M-Banking' : 'e.g. 3rd month installment'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
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

      {/* Linked Transactions History Modal */}
      {historyDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-outline-variant/40">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isId ? 'Detail Transaksi Terikat' : 'Linked Transaction History'}
                </span>
                <h3 className="font-headline-sm font-bold text-on-surface">
                  {historyDebt.name}
                </h3>
              </div>
              <button onClick={() => setHistoryDebt(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Metrics summary inside modal */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs">
              <div>
                <span className="text-on-surface-variant block">{isId ? 'Total Awal:' : 'Total:'}</span>
                <strong className="font-bold text-on-surface text-sm">{formatCurrency(historyDebt.amount)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant block">{isId ? 'Terbayar:' : 'Paid:'}</span>
                <strong className="font-bold text-emerald-600 text-sm">{formatCurrency(historyDebt.amount - historyDebt.remainingAmount)}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant block">{isId ? 'Sisa:' : 'Remaining:'}</span>
                <strong className="font-bold text-rose-600 text-sm">{formatCurrency(historyDebt.remainingAmount)}</strong>
              </div>
            </div>

            {/* Transactions List */}
            {(() => {
              const linked = getLinkedTransactions(historyDebt);
              if (linked.length === 0) {
                return (
                  <div className="py-8 text-center bg-surface-container-lowest border border-outline-variant/40 rounded-xl">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">history</span>
                    <p className="text-sm font-medium text-on-surface">
                      {isId ? 'Belum ada transaksi pembayaran tercatat untuk utang/piutang ini.' : 'No payment transactions recorded for this debt yet.'}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {isId ? 'Gunakan tombol "Bayar Cicilan" untuk membuat transaksi pembayaran otomatis.' : 'Use the "Pay Debt" button to generate automated transactions.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {isId ? 'Daftar Transaksi Pembayaran Cicilan' : 'Payment Transaction Log'} ({linked.length})
                  </h4>
                  <div className="divide-y divide-outline-variant/40 border border-outline-variant/50 rounded-xl overflow-hidden bg-surface-container-lowest">
                    {linked.map(tx => {
                      const acc = paymentAccounts.find(a => a.id === tx.paymentAccountId);
                      const isExp = tx.type === 'expense';

                      return (
                        <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExp ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              <span className="material-symbols-outlined text-lg">
                                {isExp ? 'call_made' : 'call_received'}
                              </span>
                            </div>
                            <div>
                              <strong className="font-bold text-on-surface block text-xs">
                                {tx.description}
                              </strong>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant mt-0.5">
                                <span>{new Date(tx.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {acc && (
                                  <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {acc.name}
                                  </span>
                                )}
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {tx.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-bold text-sm ${isExp ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isExp ? '-' : '+'}{formatCurrency(tx.amount)}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              ✓ {isId ? 'Tercatat di Arus Kas' : 'In Cash Flow'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 flex justify-end border-t border-outline-variant/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setHistoryDebt(null)}
              >
                {isId ? 'Tutup' : 'Close'}
              </Button>
            </div>
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
