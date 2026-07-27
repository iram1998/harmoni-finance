import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardTitle } from './ui/Card';

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ENVELOPES = [
  'Belanja Supermarket',
  'Makan & Minum',
  'Tagihan & Utilitas',
  'Transportasi',
  'Cicilan & Utang',
  'Pendidikan',
  'Kesehatan',
  'Hobi & Hiburan',
  'Zakat & Sedekah',
  'Tabungan & Investasi'
];

export function EnvelopeModal({ isOpen, onClose }: EnvelopeModalProps) {
  const { workspace, addEnvelope, customCategories } = useFinance();
  const { showToast } = useToast();
  const [category, setCategory] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !allocatedAmount) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(allocatedAmount);
      await addEnvelope({
        workspaceId: workspace,
        category: category.trim(),
        allocatedAmount: parsedAmount
      });
      showToast(
        `Amplop Anggaran "${category.trim()}" (Rp ${parsedAmount.toLocaleString('id-ID')}) berhasil dibuat!`,
        'success',
        'Amplop Berhasil Ditambahkan'
      );
      setCategory('');
      setAllocatedAmount('');
      onClose();
    } catch (err: any) {
      console.error("Error adding budget envelope:", err);
      showToast(
        err.message || 'Gagal menambahkan amplop anggaran.',
        'error',
        'Gagal Menyimpan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = customCategories
    .filter(c => c.type === 'expense')
    .map(c => c.name);

  const envelopeOptions = expenseCategories.length > 0 
    ? expenseCategories 
    : PRESET_ENVELOPES;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-surface rounded-t-[28px] sm:rounded-2xl border-t sm:border border-outline-variant shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-none sm:zoom-in-95 duration-300">
        {/* Mobile Swipe/Drag Indicator */}
        <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-3 sm:hidden shrink-0" />

        <div className="flex justify-between items-center px-5 py-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <CardTitle className="flex items-center gap-2 text-on-surface text-base sm:text-lg font-bold">
            <span className="material-symbols-outlined text-primary font-bold">mail</span>
            Tambah Pos Anggaran (Envelope)
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              Nama Pos / Kategori Anggaran
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto pr-1">
              {envelopeOptions.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCategory(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    category === preset 
                      ? 'bg-primary text-on-primary border-primary shadow-sm' 
                      : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <Input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              placeholder="Contoh: Dana Kedaruratan Dapur..."
              icon="category"
              required
            />
          </div>

          {/* Allocated Amount */}
          <Input 
            label="Batas Anggaran Bulanan (Rp)"
            type="number" 
            value={allocatedAmount} 
            onChange={e => setAllocatedAmount(e.target.value)}
            placeholder="Contoh: 2500000"
            icon="payments"
            required
            min="1"
          />

          <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-lg">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Pos anggaran ini akan diterapkan pada workspace <strong className="text-primary capitalize">{workspace}</strong>.
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
                Simpan Pos Anggaran
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
