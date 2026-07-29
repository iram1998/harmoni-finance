import React, { useState } from 'react';
import { Transaction } from '../types';
import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils';
import { Button } from './ui/Button';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (transaction: Transaction) => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
  onDelete,
}: TransactionDetailModalProps) {
  const { language } = useThemeLanguage();
  const { paymentAccounts, goals, familyMembers, deleteTransaction } = useFinance();
  const { showToast } = useToast();
  const isId = language === 'id';
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === 'income';
  const isTransfer = (transaction.category || '').toLowerCase().includes('transfer') || 
                     (transaction.category || '').toLowerCase().includes('pindah') || 
                     (transaction.category || '').toLowerCase().includes('saldo');

  // Find linked payment account
  const account = paymentAccounts?.find(a => a.id === transaction.paymentAccountId);

  // Find linked goal
  const goal = goals?.find(g => g.id === transaction.goalId);

  // Find linked family member
  const member = familyMembers?.find(m => m.id === transaction.familyMember || m.name === transaction.familyMember);

  const getCategoryIcon = (cat: string, type: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('transfer') || c.includes('pindah') || c.includes('saldo')) return 'sync_alt';
    if (type === 'income') {
      if (c.includes('gaji') || c.includes('pay')) return 'payments';
      if (c.includes('proyek') || c.includes('freelance') || c.includes('bisnis')) return 'work';
      if (c.includes('investasi') || c.includes('dividen')) return 'trending_up';
      if (c.includes('bonus')) return 'stars';
      return 'account_balance_wallet';
    } else {
      if (c.includes('makan') || c.includes('kuliner') || c.includes('restoran')) return 'restaurant';
      if (c.includes('belanja') || c.includes('dapur') || c.includes('supermarket')) return 'shopping_bag';
      if (c.includes('transport') || c.includes('bensin') || c.includes('kendaraan')) return 'directions_car';
      if (c.includes('tagihan') || c.includes('listrik') || c.includes('internet') || c.includes('utilitas')) return 'bolt';
      if (c.includes('sehat') || c.includes('obat') || c.includes('dokter')) return 'medical_services';
      if (c.includes('didik') || c.includes('sekolah') || c.includes('kuliah')) return 'school';
      if (c.includes('hobi') || c.includes('hiburan') || c.includes('game')) return 'sports_esports';
      if (c.includes('zakat') || c.includes('sedekah') || c.includes('donasi')) return 'volunteer_activism';
      if (c.includes('cicilan') || c.includes('utang')) return 'credit_score';
      return 'shopping_cart';
    }
  };

  const handleCopyId = () => {
    if (transaction?.id) {
      navigator.clipboard.writeText(transaction.id);
      setCopiedId(true);
      showToast(isId ? 'ID Transaksi berhasil disalin!' : 'Transaction ID copied!', 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    try {
      if (onDelete) {
        onDelete(transaction);
      } else {
        await deleteTransaction(transaction.id);
        showToast(isId ? 'Transaksi berhasil dihapus' : 'Transaction deleted', 'success');
      }
      setIsConfirmingDelete(false);
      onClose();
    } catch (err) {
      showToast(isId ? 'Gagal menghapus transaksi' : 'Failed to delete transaction', 'error');
    }
  };

  const formattedDate = new Date(transaction.date).toLocaleDateString(isId ? 'id-ID' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedCreatedTime = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString(isId ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header Banner */}
        <div className={`relative p-5 sm:p-6 text-white border-b border-outline-variant ${
          isTransfer
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800'
            : isIncome 
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800' 
              : 'bg-gradient-to-br from-rose-600 via-pink-600 to-rose-800'
        }`}>
          {/* Background pattern icon */}
          <span 
            className="material-symbols-outlined absolute right-4 bottom-2 text-white/10 text-[120px] pointer-events-none select-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {getCategoryIcon(transaction.category, transaction.type)}
          </span>

          {/* Top Row: Badges & Close */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                Workspace {transaction.workspaceId === 'pribadi' ? (isId ? 'Pribadi' : 'Personal') : (isId ? 'Keluarga' : 'Family')}
              </span>
              {isTransfer ? (
                <span className="bg-white text-blue-900 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">sync_alt</span>
                  {isId ? 'Pindah Saldo' : 'Internal Transfer'}
                </span>
              ) : (
                <span className="bg-white text-on-surface text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs">
                  {isIncome ? (isId ? 'Pemasukan' : 'Income') : (isId ? 'Pengeluaran' : 'Expense')}
                </span>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer"
              title={isId ? 'Tutup' : 'Close'}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Amount & Main Info */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {getCategoryIcon(transaction.category, transaction.type)}
                </span>
              </div>
              <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                {transaction.category}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </h2>

            {transaction.description && (
              <p className="text-white/90 font-medium text-sm mt-1 line-clamp-2">
                {transaction.description}
              </p>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-on-surface text-xs sm:text-sm">
          
          {/* Transfer Informational Callout */}
          {isTransfer && (
            <div className="bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                sync_alt
              </span>
              <div className="text-xs">
                <span className="font-bold text-blue-800 dark:text-blue-300 block mb-0.5">
                  {isId ? 'Pemindahan Saldo Intern' : 'Internal Balance Transfer'}
                </span>
                <p className="text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                  {isId 
                    ? 'Transaksi ini merupakan pemindahan dana antar rekening/workspace. Saldo diperbarui secara riil tanpa mempengaruhi pendapatan atau beban murni.'
                    : 'This transaction records an internal balance transfer between accounts or workspaces. Balances adjust directly without affecting net income/expenses.'}
                </p>
              </div>
            </div>
          )}
          
          {/* Key Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Payment Account */}
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-primary flex items-center justify-center shrink-0 font-bold">
                <span className="material-symbols-outlined text-xl">
                  {account?.type === 'bank' ? 'account_balance' : account?.type === 'ewallet' ? 'smartphone' : account?.type === 'investment' ? 'show_chart' : 'payments'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider block">
                  {isId ? 'Rekening / Dompet' : 'Account / Wallet'}
                </span>
                <span className="font-bold text-on-surface truncate block text-sm">
                  {account ? account.name : (isId ? 'Tidak Terhubung' : 'Not Linked')}
                </span>
                {account && (
                  <span className="text-[11px] text-on-surface-variant font-medium block uppercase">
                    {account.type} {account.accountNumber ? `• ${account.accountNumber}` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 font-bold">
                <span className="material-symbols-outlined text-xl">calendar_today</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider block">
                  {isId ? 'Tanggal Transaksi' : 'Transaction Date'}
                </span>
                <span className="font-bold text-on-surface truncate block text-xs sm:text-sm">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Details Table List */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden divide-y divide-outline-variant/60">
            
            {/* Category */}
            <div className="flex justify-between items-center p-3 sm:px-4">
              <span className="text-on-surface-variant font-medium text-xs">
                {isId ? 'Kategori' : 'Category'}
              </span>
              <span className="font-bold text-on-surface text-xs sm:text-sm bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant">
                {transaction.category}
              </span>
            </div>

            {/* Income Type */}
            {isIncome && transaction.incomeCategory && (
              <div className="flex justify-between items-center p-3 sm:px-4">
                <span className="text-on-surface-variant font-medium text-xs">
                  {isId ? 'Sifat Pemasukan' : 'Income Nature'}
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                  {transaction.incomeCategory === 'fixed' 
                    ? (isId ? 'Pemasukan Tetap (Rutinitas)' : 'Fixed Income')
                    : (isId ? 'Pemasukan Variabel (Sambilan/Bonus)' : 'Variable Income')}
                </span>
              </div>
            )}

            {/* Workspace */}
            <div className="flex justify-between items-center p-3 sm:px-4">
              <span className="text-on-surface-variant font-medium text-xs">
                Workspace
              </span>
              <span className="font-bold text-on-surface text-xs capitalize flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                {transaction.workspaceId === 'pribadi' ? (isId ? 'Pribadi' : 'Personal') : (isId ? 'Keluarga' : 'Family')}
              </span>
            </div>

            {/* Family Member */}
            {(transaction.familyMember || member) && (
              <div className="flex justify-between items-center p-3 sm:px-4">
                <span className="text-on-surface-variant font-medium text-xs">
                  {isId ? 'Anggota Keluarga' : 'Family Member'}
                </span>
                <span className="font-bold text-on-surface text-xs bg-primary-container/40 text-primary px-2.5 py-1 rounded-lg">
                  {member ? member.name : transaction.familyMember}
                </span>
              </div>
            )}

            {/* Goal Linked */}
            {goal && (
              <div className="flex justify-between items-center p-3 sm:px-4">
                <span className="text-on-surface-variant font-medium text-xs">
                  {isId ? 'Target Tabungan Terkait' : 'Linked Goal'}
                </span>
                <span className="font-bold text-secondary text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">flag</span>
                  {goal.name}
                </span>
              </div>
            )}

            {/* Created Timestamp */}
            {formattedCreatedTime && (
              <div className="flex justify-between items-center p-3 sm:px-4">
                <span className="text-on-surface-variant font-medium text-xs">
                  {isId ? 'Waktu Pencatatan' : 'Logged At'}
                </span>
                <span className="text-on-surface-variant text-xs">
                  {formattedCreatedTime}
                </span>
              </div>
            )}
          </div>

          {/* Description Box */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-1">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
              {isId ? 'Catatan / Keterangan' : 'Notes / Description'}
            </span>
            <p className="text-on-surface text-xs sm:text-sm font-medium leading-relaxed">
              {transaction.description || (isId ? 'Tidak ada catatan tambahan.' : 'No additional description.')}
            </p>
          </div>

          {/* ID Transaksi & Copy */}
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">ID Transaksi</span>
              <span className="font-mono text-on-surface text-[11px] truncate block select-all">{transaction.id}</span>
            </div>
            <button
              onClick={handleCopyId}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-surface border border-outline-variant hover:bg-surface-container-high active:scale-95 text-on-surface font-semibold text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">{copiedId ? 'check' : 'content_copy'}</span>
              <span>{copiedId ? (isId ? 'Tersalin' : 'Copied') : (isId ? 'Salin ID' : 'Copy ID')}</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-2">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 w-full justify-between bg-error-container/20 p-2 rounded-xl border border-error/30">
              <span className="text-xs font-bold text-error">
                {isId ? 'Yakin hapus transaksi ini?' : 'Delete this transaction?'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface border border-outline-variant text-on-surface hover:bg-surface-container"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-error text-white hover:bg-error/90"
                >
                  {isId ? 'Ya, Hapus' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3.5 py-2 rounded-xl border border-error/30 text-error hover:bg-error-container/20 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>{isId ? 'Hapus' : 'Delete'}</span>
              </button>

              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="px-5 font-bold"
              >
                {isId ? 'Tutup' : 'Close'}
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
