import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardTitle } from './ui/Card';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const { workspace, addGoal } = useFinance();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    setIsSubmitting(true);
    try {
      const parsedTarget = parseFloat(targetAmount);
      await addGoal({
        workspaceId: workspace,
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline
      });
      showToast(
        `Target tabungan "${name.trim()}" (Target: Rp ${parsedTarget.toLocaleString('id-ID')}) berhasil dibuat!`,
        'success',
        'Target Finansial Dibuat'
      );
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      onClose();
    } catch (err: any) {
      console.error("Error adding goal:", err);
      showToast(
        err.message || 'Gagal menyimpan target tabungan.',
        'error',
        'Gagal Menyimpan'
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
            <span className="material-symbols-outlined text-primary font-bold">savings</span>
            Tambah Target Tabungan Baru
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          <Input 
            label="Nama Target Impian"
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Dana Pendidikan Anak, Liburan..."
            icon="ads_click"
            required
          />

          <Input 
            label="Target Total Nominal (Rp)"
            type="number" 
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value)}
            placeholder="Contoh: 15000000"
            icon="payments"
            required
            min="1"
          />

          <Input 
            label="Saldo Awal Saat Ini (Rp) - Opsional"
            type="number" 
            value={currentAmount} 
            onChange={e => setCurrentAmount(e.target.value)}
            placeholder="0"
            icon="account_balance_wallet"
          />

          <Input 
            label="Tenggat Waktu / Target Selesai"
            type="date" 
            value={deadline} 
            onChange={e => setDeadline(e.target.value)}
            icon="calendar_today"
            required
          />

          <Button type="submit" variant="primary" fullWidth className="mt-2 py-3" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold text-sm">
                <Check className="w-4 h-4" />
                Simpan Target Tabungan
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
