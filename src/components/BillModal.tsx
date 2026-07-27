import React, { useState } from 'react';
import { useFinance } from '../store';
import { useToast } from '../context/ToastContext';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardTitle } from './ui/Card';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillModal({ isOpen, onClose }: BillModalProps) {
  const { workspace, addBill, updateBill, billEditTarget } = useFinance();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [targetWorkspace, setTargetWorkspace] = useState<'pribadi' | 'keluarga'>('pribadi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (billEditTarget) {
        setName(billEditTarget.name || '');
        setAmount(billEditTarget.amount !== undefined && billEditTarget.amount !== null ? billEditTarget.amount.toString() : '');
        setDueDate(billEditTarget.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        setTargetWorkspace(billEditTarget.workspaceId || 'keluarga');
      } else {
        setName('');
        setAmount('');
        setDueDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        setTargetWorkspace(workspace);
      }
    }
  }, [isOpen, billEditTarget, workspace]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (billEditTarget) {
        await updateBill(billEditTarget.id, {
          workspaceId: targetWorkspace,
          name: name.trim(),
          amount: parsedAmount,
          dueDate,
        });
        showToast(
          `Jadwal tagihan "${name.trim()}" berhasil diperbarui!`,
          'success',
          'Tagihan Diperbarui'
        );
      } else {
        await addBill({
          workspaceId: targetWorkspace,
          name: name.trim(),
          amount: parsedAmount,
          dueDate,
          isPaid: false
        });
        showToast(
          `Jadwal tagihan "${name.trim()}" (Rp ${parsedAmount.toLocaleString('id-ID')}) berhasil disimpan!`,
          'success',
          'Tagihan Ditambahkan'
        );
      }
      setName('');
      setAmount('');
      onClose();
    } catch (err: any) {
      console.error("Error saving bill:", err);
      showToast(
        err.message || 'Gagal menyimpan tagihan.',
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
            <span className="material-symbols-outlined text-primary font-bold">receipt_long</span>
            {billEditTarget ? 'Ubah Tagihan Bulanan' : 'Tambah Tagihan Bulanan'}
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          <Input 
            label="Nama Tagihan / Layanan"
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            placeholder="Contoh: Tagihan PLN, Wi-Fi Biznet, BPJS..."
            icon="label"
            required
          />

          <Input 
            label="Nominal Tagihan (Rp)"
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="Contoh: 850000"
            icon="payments"
            required
            min="1"
          />

          <Input 
            label="Jatuh Tempo Pembayaran"
            type="date" 
            value={dueDate} 
            onChange={e => setDueDate(e.target.value)}
            icon="calendar_month"
            required
          />

          {/* Workspace Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Workspace Tagihan (Pribadi / Keluarga)
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
              Tagihan ini akan disimpan pada workspace <strong className="text-primary capitalize">{targetWorkspace}</strong>.
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
                {billEditTarget ? 'Simpan Perubahan Tagihan' : 'Simpan Tagihan'}
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
