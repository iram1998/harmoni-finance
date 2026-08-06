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
  const { workspace, addBill, updateBill, billEditTarget, paymentAccounts } = useFinance();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [targetWorkspace, setTargetWorkspace] = useState<'pribadi' | 'keluarga'>('pribadi');
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurringPeriod, setRecurringPeriod] = useState<'monthly' | 'weekly' | 'yearly' | 'once'>('monthly');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [category, setCategory] = useState('Utilitas & Tagihan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (billEditTarget) {
        setName(billEditTarget.name || '');
        setAmount(billEditTarget.amount !== undefined && billEditTarget.amount !== null ? billEditTarget.amount.toString() : '');
        setDueDate(billEditTarget.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        setTargetWorkspace(billEditTarget.workspaceId || 'keluarga');
        setIsRecurring(billEditTarget.isRecurring !== undefined ? billEditTarget.isRecurring : true);
        setRecurringPeriod(billEditTarget.recurringPeriod || 'monthly');
        setPaymentAccountId(billEditTarget.paymentAccountId || '');
        setCategory(billEditTarget.category || 'Utilitas & Tagihan');
      } else {
        setName('');
        setAmount('');
        setDueDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
        setTargetWorkspace(workspace === 'all' ? 'keluarga' : workspace);
        setIsRecurring(true);
        setRecurringPeriod('monthly');
        setPaymentAccountId('');
        setCategory('Utilitas & Tagihan');
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
          isRecurring,
          recurringPeriod: isRecurring ? recurringPeriod : 'once',
          paymentAccountId: paymentAccountId || undefined,
          category,
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
          isPaid: false,
          isRecurring,
          recurringPeriod: isRecurring ? recurringPeriod : 'once',
          paymentAccountId: paymentAccountId || undefined,
          category,
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
            placeholder="Contoh: Sewa Toko, Wi-Fi Indihome, Kontrakan, Listrik PLN..."
            icon="label"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Nominal Tagihan (Rp)"
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              onWheel={e => e.currentTarget.blur()}
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
          </div>

          {/* Kategori Tagihan */}
          <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Kategori Tagihan
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="Sewa Tempat & Kontrakan">🏠 Sewa Tempat & Kontrakan / Toko</option>
              <option value="Wi-Fi & Internet">📶 Wi-Fi & Internet</option>
              <option value="Listrik & PDAM">⚡ Listrik & Air (PDAM)</option>
              <option value="BPJS & Asuransi">🏥 BPJS & Asuransi</option>
              <option value="Cicilan & Pinjaman">💳 Cicilan & Pinjaman</option>
              <option value="Utilitas & Tagihan">🧾 Utilitas & Tagihan Rutin</option>
              <option value="Lainnya">📦 Lainnya</option>
            </select>
          </div>

          {/* Sifat Tagihan (Rutin vs Sekali) */}
          <div className="flex flex-col gap-1.5 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface">Tagihan Rutin / Berulang?</p>
                <p className="text-[11px] text-on-surface-variant">Otomatis buat pengingat periode berikutnya saat dilunasi</p>
              </div>
              <input 
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="mt-2 pt-2 border-t border-outline-variant/60 flex flex-col gap-1.5">
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase">
                  Frekuensi Pengulangan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurringPeriod('monthly')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      recurringPeriod === 'monthly'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringPeriod('weekly')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      recurringPeriod === 'weekly'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    Mingguan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringPeriod('yearly')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      recurringPeriod === 'yearly'
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    Tahunan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sumber Dana / Rekening Default */}
          {paymentAccounts && paymentAccounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Sumber Dana / Rekening Pembayaran (Opsional)
              </label>
              <select
                value={paymentAccountId}
                onChange={e => setPaymentAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Otomatis / Pilih Saat Pelunasan --</option>
                {paymentAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    💳 {acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          )}

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
