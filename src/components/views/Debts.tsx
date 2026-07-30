import React, { useState } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { Debt } from '../../types';

export function Debts() {
  const { workspace, debts, addDebt, updateDebt, deleteDebt, payDebt, paymentAccounts } = useFinance();
  const { t, language } = useThemeLanguage();
  const isId = language === 'id';

  const [activeTab, setActiveTab] = useState<'all' | 'payable' | 'receivable' | 'paid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Add Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payAccId, setPayAccId] = useState('');

  // Filter debts by workspace
  const workspaceDebts = debts.filter(d => d.workspaceId === workspace);

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
    await addDebt(name.trim(), type, parseFloat(amount), dueDate || undefined);
    setName('');
    setAmount('');
    setDueDate('');
    setIsAddModalOpen(false);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payAmount || parseFloat(payAmount) <= 0) return;
    await payDebt(selectedDebt.id, parseFloat(payAmount), payAccId || undefined);
    setPayAmount('');
    setPayAccId('');
    setSelectedDebt(null);
    setIsPayModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">account_balance</span>
            {t('debtsAndReceivables')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('debtsAndReceivablesSubtitle')}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          {isId ? 'Catat Utang / Piutang' : 'Add Debt / Receivable'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
            <span className="material-symbols-outlined">trending_down</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isId ? 'Total Utang Saya' : 'Total Debt (Payable)'}
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            Rp {totalPayable.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isId ? 'Kewajiban harus dibayar' : 'Total amount owed'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined">trending_up</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isId ? 'Total Piutang Saya' : 'Total Receivable'}
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            Rp {totalReceivable.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isId ? 'Uang yang dipinjam orang' : 'Total amount owed to you'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
          <div className={`absolute right-3 top-3 w-10 h-10 rounded-xl flex items-center justify-center ${netBalance >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'}`}>
            <span className="material-symbols-outlined">balance</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isId ? 'Posisi Bersih (Net)' : 'Net Position'}
          </p>
          <p className={`text-2xl font-bold mt-2 ${netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
            Rp {netBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {netBalance >= 0 ? (isId ? 'Piutang lebih besar dari utang' : 'Receivables exceed debts') : (isId ? 'Utang lebih besar dari piutang' : 'Debts exceed receivables')}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'all' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {isId ? 'Semua Catatan' : 'All Records'} ({workspaceDebts.length})
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'payable' ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {isId ? 'Utang Saya' : 'My Debts'} ({workspaceDebts.filter(d => d.type === 'payable' && d.status !== 'paid').length})
        </button>
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'receivable' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {isId ? 'Piutang Saya' : 'My Receivables'} ({workspaceDebts.filter(d => d.type === 'receivable' && d.status !== 'paid').length})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'paid' ? 'border-slate-500 text-slate-700 dark:text-slate-200 font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {isId ? 'Sudah Lunas' : 'Paid Off'} ({workspaceDebts.filter(d => d.status === 'paid').length})
        </button>
      </div>

      {/* Debts List */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-4">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isId ? 'Tidak Ada Catatan Utang / Piutang' : 'No Debts or Receivables Found'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isId ? 'Semua catatan keuangan Anda terkontrol dengan sangat baik.' : 'All financial records in this workspace are up to date.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map(debt => {
            const isPayable = debt.type === 'payable';
            const paidAmount = debt.amount - debt.remainingAmount;
            const progressPct = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 100;

            return (
              <div
                key={debt.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${isPayable ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>
                        <span className="material-symbols-outlined text-xs">{isPayable ? 'call_made' : 'call_received'}</span>
                        {isPayable ? (isId ? 'Utang Saya' : 'Payable') : (isId ? 'Piutang Saya' : 'Receivable')}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white mt-2">
                        {debt.name}
                      </h3>
                    </div>
                    {debt.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        {isId ? 'Lunas' : 'Paid'}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setPayAmount(debt.remainingAmount.toString());
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                      >
                        {isPayable ? (isId ? 'Bayar Cicilan' : 'Pay Debt') : (isId ? 'Terima Pelunasan' : 'Receive Payment')}
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{isId ? 'Sisa' : 'Remaining'}: <strong className="text-slate-800 dark:text-white font-bold">Rp {debt.remainingAmount.toLocaleString('id-ID')}</strong></span>
                      <span>Total: Rp {debt.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${debt.status === 'paid' ? 'bg-slate-400' : isPayable ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>{progressPct}% {isId ? 'terbayar' : 'completed'}</span>
                      {debt.dueDate && (
                        <span>{isId ? 'Jatuh Tempo' : 'Due'}: {new Date(debt.dueDate).toLocaleDateString(isId ? 'id-ID' : 'en-US')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-2">
                  <button
                    onClick={() => deleteDebt(debt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title={isId ? 'Hapus' : 'Delete'}
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Debt */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {isId ? 'Tambah Catatan Utang / Piutang' : 'Add Debt / Receivable'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Jenis' : 'Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('payable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${type === 'payable' ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    {isId ? 'Utang Saya (Kewajiban)' : 'Payable (Debt)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('receivable')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${type === 'receivable' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                  >
                    {isId ? 'Piutang Saya (Tagihan)' : 'Receivable'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Nama / Keterangan' : 'Name / Description'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={type === 'payable' ? (isId ? 'Contoh: Pinjaman KPR Bank BCA' : 'e.g. Bank Loan') : (isId ? 'Contoh: Pinjaman ke Budi' : 'e.g. Money lent to John')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Jumlah Total (Rp)' : 'Total Amount (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Tanggal Jatuh Tempo (Opsional)' : 'Due Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {isId ? 'Simpan' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay / Receive Modal */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {selectedDebt.type === 'payable' ? (isId ? 'Catat Pembayaran Utang' : 'Record Debt Payment') : (isId ? 'Catat Penerimaan Piutang' : 'Record Receivable Received')}
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-white">{selectedDebt.name}</div>
                <div className="text-slate-500">
                  {isId ? 'Sisa yang harus dibayar' : 'Remaining balance'}: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Rp {selectedDebt.remainingAmount.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Nominal Pembayaran (Rp)' : 'Payment Amount (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedDebt.remainingAmount}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isId ? 'Rekening Pembayaran / Sumber Dana' : 'Payment Account / Source'}
                </label>
                <select
                  value={payAccId}
                  onChange={e => setPayAccId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{isId ? '-- Pilih Rekening (Opsional) --' : '-- Select Account (Optional) --'}</option>
                  {paymentAccounts
                    .filter(a => a.workspaceId === selectedDebt.workspaceId)
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isId ? 'Jika dipilih, saldo rekening ini akan otomatis disesuaikan dan transaksi baru tercatat di Arus Kas.' : 'Selected account balance will be automatically updated.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {isId ? 'Konfirmasi Pembayaran' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
