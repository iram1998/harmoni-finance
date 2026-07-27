import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardTitle } from './ui/Card';
import { Goal } from '../types';

interface GoalContributionModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export function GoalContributionModal({ goal, onClose }: GoalContributionModalProps) {
  const { addGoalContribution } = useFinance();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      await addGoalContribution(goal.id, parsedAmount);
      showToast(
        `Setoran tabungan Rp ${parsedAmount.toLocaleString('id-ID')} ke target "${goal.name}" berhasil dicatat!`,
        'success',
        'Setoran Tabungan Berhasil'
      );
      setAmount('');
      onClose();
    } catch (err: any) {
      console.error("Error adding contribution:", err);
      showToast(
        err.message || 'Gagal menambahkan setoran tabungan.',
        'error',
        'Gagal Setoran'
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
            Tambah Dana Goal
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          <div className="bg-surface-container-low rounded-lg p-4 flex flex-col gap-1 border border-outline-variant">
              <span className="font-label-sm text-on-surface-variant">Target Goal</span>
              <span className="font-headline-sm text-on-surface font-semibold text-sm sm:text-base">{goal.name}</span>
          </div>

          <Input 
            label="Nominal Disimpan (Rp)"
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            icon="payments"
            required
            min="1"
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            className="mt-2 py-3" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold text-sm">
                <Check className="w-4 h-4" />
                Simpan Dana
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
