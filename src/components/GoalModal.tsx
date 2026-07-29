import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardTitle } from './ui/Card';
import { formatCurrency, getRemainingTimeAndSavings, formatRemainingTime, formatDateFriendly } from '../utils';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalModal({ isOpen, onClose }: GoalModalProps) {
  const { workspace, addGoal, updateGoal, goalEditTarget } = useFinance();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]);
  const [targetWorkspace, setTargetWorkspace] = useState<'pribadi' | 'keluarga'>('pribadi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedTarget = parseFloat(targetAmount) || 0;
  const parsedCurrent = currentAmount ? parseFloat(currentAmount) : 0;
  const timeAndSavings = getRemainingTimeAndSavings(parsedTarget, parsedCurrent, deadline);
  const durationText = formatRemainingTime(timeAndSavings.years, timeAndSavings.months, timeAndSavings.days, 'id');

  React.useEffect(() => {
    if (isOpen) {
      if (goalEditTarget) {
        setName(goalEditTarget.name || '');
        setTargetAmount(goalEditTarget.targetAmount !== undefined && goalEditTarget.targetAmount !== null ? goalEditTarget.targetAmount.toString() : '');
        setCurrentAmount(goalEditTarget.currentAmount !== undefined && goalEditTarget.currentAmount !== null ? goalEditTarget.currentAmount.toString() : '');
        setStartDate(goalEditTarget.startDate || new Date().toISOString().split('T')[0]);
        setDeadline(goalEditTarget.deadline || new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]);
        setTargetWorkspace(goalEditTarget.workspaceId || 'keluarga');
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDeadline(new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]);
        setTargetWorkspace(workspace === 'all' ? 'keluarga' : workspace);
      }
    }
  }, [isOpen, goalEditTarget, workspace]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) return;

    setIsSubmitting(true);
    try {
      const parsedTarget = parseFloat(targetAmount);
      const parsedCurrent = currentAmount ? parseFloat(currentAmount) : 0;
      
      if (goalEditTarget) {
        await updateGoal(goalEditTarget.id, {
          workspaceId: targetWorkspace,
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          startDate,
          deadline
        });
        showToast(
          `Target tabungan "${name.trim()}" berhasil diperbarui!`,
          'success',
          'Target Finansial Diperbarui'
        );
      } else {
        await addGoal({
          workspaceId: targetWorkspace,
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          startDate,
          deadline
        });
        showToast(
          `Target tabungan "${name.trim()}" (Target: Rp ${parsedTarget.toLocaleString('id-ID')}) berhasil dibuat!`,
          'success',
          'Target Finansial Dibuat'
        );
      }
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      onClose();
    } catch (err: any) {
      console.error("Error saving goal:", err);
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
            {goalEditTarget ? 'Ubah Target Tabungan' : 'Tambah Target Tabungan Baru'}
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
            label="Saldo Terkumpul Saat Ini (Rp) - Opsional"
            type="number" 
            value={currentAmount} 
            onChange={e => setCurrentAmount(e.target.value)}
            placeholder="0"
            icon="account_balance_wallet"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Tanggal Mulai"
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              icon="calendar_today"
              required
            />
            <Input 
              label="Tenggat Target"
              type="date" 
              value={deadline} 
              onChange={e => setDeadline(e.target.value)}
              icon="event"
              required
            />
          </div>

          {/* Dynamic Saving Estimate Preview Box */}
          {parsedTarget > 0 && (
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                Estimasi Detail Tabungan
              </span>

              {/* Timeline Display */}
              <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant bg-primary/10 p-2 rounded-lg mb-1">
                <span className="material-symbols-outlined text-[14px] text-primary">timeline</span>
                <span className="font-medium">Timeline:</span>
                <span className="font-semibold text-on-surface ml-auto flex items-center gap-1">
                  <span>{formatDateFriendly(startDate)}</span>
                  <span className="material-symbols-outlined text-[12px] text-outline">arrow_right_alt</span>
                  <span>{formatDateFriendly(deadline)}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[11px]">Sisa Waktu:</span>
                  <span className="font-semibold text-tertiary mt-0.5">{durationText}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[11px]">Kekurangan Dana:</span>
                  <span className="font-semibold text-on-surface mt-0.5">{formatCurrency(timeAndSavings.amountToSave)}</span>
                </div>
              </div>

              <div className="border-t border-primary/10 my-0.5" />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col bg-surface/80 p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-on-surface-variant text-[10px]">Wajib Ditabung / Bulan:</span>
                  <span className="font-bold text-primary text-sm mt-0.5">{formatCurrency(timeAndSavings.monthlyNeed)}</span>
                </div>
                <div className="flex flex-col bg-surface/80 p-2 rounded-lg border border-outline-variant/30">
                  <span className="text-on-surface-variant text-[10px]">Wajib Ditabung / Hari:</span>
                  <span className="font-bold text-on-surface text-sm mt-0.5">{formatCurrency(timeAndSavings.dailyNeed)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Workspace Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Workspace Target (Pribadi / Keluarga)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant">
              <button
                type="button"
                onClick={() => setTargetWorkspace('pribadi')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  targetWorkspace === 'pribadi'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Pribadi
              </button>
              <button
                type="button"
                onClick={() => setTargetWorkspace('keluarga')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  targetWorkspace === 'keluarga'
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">groups</span>
                Keluarga
              </button>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-lg">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Target finansial ini akan disimpan pada workspace <strong className="text-primary capitalize">{targetWorkspace}</strong>.
            </p>
          </div>

          <Button type="submit" variant="primary" fullWidth className="mt-2 py-3" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold text-sm">
                <Check className="w-4 h-4" />
                {goalEditTarget ? 'Simpan Perubahan Target' : 'Simpan Target Tabungan'}
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
