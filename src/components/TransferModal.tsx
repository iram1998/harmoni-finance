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
  const { addTransaction } = useFinance();
  const { showToast } = useToast();
  const [fromWorkspace, setFromWorkspace] = useState<WorkspaceType>('pribadi');
  const [toWorkspace, setToWorkspace] = useState<WorkspaceType>('keluarga');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || fromWorkspace === toWorkspace) return;

    setIsSubmitting(true);
    try {
      const transferAmount = parseFloat(amount);
      const sharedId = `transfer-${Date.now()}`;
      
      // Expense from source workspace
      await addTransaction({
        workspaceId: fromWorkspace,
        type: 'expense',
        amount: transferAmount,
        category: 'Transfer Keluar',
        description: description || `Transfer ke ${toWorkspace}`,
        date: new Date(date).toISOString(),
      });

      // Income to destination workspace
      await addTransaction({
        workspaceId: toWorkspace,
        type: 'income',
        amount: transferAmount,
        category: 'Transfer Masuk',
        description: description || `Transfer dari ${fromWorkspace}`,
        date: new Date(date).toISOString(),
        incomeCategory: 'variable'
      });
      
      showToast(
        `Transfer dana Rp ${transferAmount.toLocaleString('id-ID')} dari ${fromWorkspace.toUpperCase()} ke ${toWorkspace.toUpperCase()} berhasil!`,
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

          {fromWorkspace === toWorkspace && (
            <p className="text-error font-label-sm">Pilih workspace tujuan yang berbeda.</p>
          )}

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
            disabled={isSubmitting || fromWorkspace === toWorkspace}
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
