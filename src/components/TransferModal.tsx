import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardTitle } from './ui/Card';
import { WorkspaceType } from '../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { paymentAccounts, addTransaction } = useFinance();
  const { showToast } = useToast();
  const [fromWorkspace, setFromWorkspace] = useState<WorkspaceType>('pribadi');
  const [toWorkspace, setToWorkspace] = useState<WorkspaceType>('keluarga');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available accounts filtered by chosen workspace
  const fromAccounts = (paymentAccounts || []).filter(a => (a.workspaceId || 'keluarga') === fromWorkspace);
  const toAccounts = (paymentAccounts || []).filter(a => (a.workspaceId || 'keluarga') === toWorkspace);

  const isSameAccount = Boolean(fromAccountId && toAccountId && fromAccountId === toAccountId);
  const isSameWorkspaceWithoutAccounts = Boolean((!fromAccountId || !toAccountId) && fromWorkspace === toWorkspace);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
      showToast('Rekening asal dan tujuan tidak boleh sama.', 'error', 'Validasi Gagal');
      return;
    }

    setIsSubmitting(true);
    try {
      const transferAmount = parseFloat(amount);
      const fromAcc = paymentAccounts.find(a => a.id === fromAccountId);
      const toAcc = paymentAccounts.find(a => a.id === toAccountId);
      
      const sourceDetail = fromAcc ? `${fromAcc.name} (${fromAcc.type.toUpperCase()})` : `Workspace ${fromWorkspace.toUpperCase()}`;
      const destDetail = toAcc ? `${toAcc.name} (${toAcc.type.toUpperCase()})` : `Workspace ${toWorkspace.toUpperCase()}`;
      const userNote = description.trim() ? ` • Catatan: ${description.trim()}` : '';

      const defaultOutDesc = `Pindah Saldo ke: ${destDetail}${userNote}`;
      const defaultInDesc = `Pindah Saldo dari: ${sourceDetail}${userNote}`;

      // Expense from source account / workspace
      await addTransaction({
        workspaceId: fromWorkspace,
        type: 'expense',
        amount: transferAmount,
        category: 'Pindah Saldo (Keluar)',
        description: defaultOutDesc,
        date: new Date(date).toISOString(),
        paymentAccountId: fromAccountId || undefined,
      });

      // Income to destination account / workspace
      await addTransaction({
        workspaceId: toWorkspace,
        type: 'income',
        amount: transferAmount,
        category: 'Pindah Saldo (Masuk)',
        description: defaultInDesc,
        date: new Date(date).toISOString(),
        incomeCategory: 'variable',
        paymentAccountId: toAccountId || undefined,
      });
      
      const sourceName = fromAcc ? fromAcc.name : fromWorkspace.toUpperCase();
      const destName = toAcc ? toAcc.name : toWorkspace.toUpperCase();

      showToast(
        `Transfer Rp ${transferAmount.toLocaleString('id-ID')} dari ${sourceName} ke ${destName} berhasil!`,
        'success',
        'Transfer Berhasil'
      );

      // reset
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err: any) {
      console.error("Error performing transfer:", err);
      showToast(
        err.message || 'Gagal memproses transfer dana.',
        'error',
        'Transfer Gagal'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-surface rounded-t-[28px] sm:rounded-2xl border-t sm:border border-outline-variant shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-none sm:zoom-in-95 duration-300">
        {/* Mobile Swipe/Drag Indicator */}
        <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-3 sm:hidden shrink-0" />

        <div className="flex justify-between items-center px-5 py-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <CardTitle className="flex items-center gap-2 text-on-surface text-base sm:text-lg font-bold">
            <span className="material-symbols-outlined text-primary font-bold">swap_horiz</span>
            Pindahkan Dana
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select 
                label="Dari Workspace"
                value={fromWorkspace} 
                onChange={e => setFromWorkspace(e.target.value as WorkspaceType)}
                icon="account_balance_wallet"
              >
                <option value="pribadi">Pribadi</option>
                <option value="keluarga">Keluarga</option>
              </Select>
            </div>
            <div className="pt-6 shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-base sm:text-lg">arrow_forward</span>
            </div>
            <div className="flex-1">
              <Select 
                label="Ke Workspace"
                value={toWorkspace} 
                onChange={e => setToWorkspace(e.target.value as WorkspaceType)}
                icon="account_balance_wallet"
              >
                <option value="keluarga">Keluarga</option>
                <option value="pribadi">Pribadi</option>
              </Select>
            </div>
          </div>

          {isSameAccount && (
            <p className="text-error font-label-sm">Rekening sumber dan rekening tujuan tidak boleh sama.</p>
          )}

          {isSameWorkspaceWithoutAccounts && (
            <p className="text-error font-label-sm">Pilih rekening asal dan tujuan, atau pilih workspace tujuan yang berbeda.</p>
          )}

          {/* Account Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Rekening Sumber"
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
              icon="account_balance_wallet"
            >
              <option value="">-- Pilih Rekening asal --</option>
              {fromAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Rp {a.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </Select>

            <Select
              label="Rekening Tujuan"
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              icon="account_balance_wallet"
            >
              <option value="">-- Pilih Rekening tujuan --</option>
              {toAccounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} (Rp {a.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </Select>
          </div>

          <Input 
            label="Nominal Transfer (Rp)"
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            icon="payments"
            required
            min="1"
          />

          <Input 
            label="Tanggal Transfer"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            icon="calendar_today"
            required
          />

          <Input 
            label="Catatan (Opsional)"
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="Contoh: Tambahan tabungan..."
            icon="description"
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            className="mt-2 py-3 shrink-0" 
            disabled={isSubmitting || isSameAccount || isSameWorkspaceWithoutAccounts}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold text-sm">
                <Check className="w-4 h-4" />
                Konfirmasi Transfer
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
