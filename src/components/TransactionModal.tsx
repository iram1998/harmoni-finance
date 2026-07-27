import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { useToast } from '../context/ToastContext';
import { TransactionType, IncomeCategory } from '../types';
import { X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardTitle } from './ui/Card';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  'Kebutuhan Dapur',
  'Belanja Supermarket',
  'Transportasi',
  'Cicilan & Utang',
  'Makan & Minum',
  'Tagihan & Utilitas',
  'Pendidikan',
  'Kesehatan',
  'Hobi & Hiburan',
  'Zakat & Sedekah',
  'Streaming & Internet'
];

const INCOME_CATEGORIES = [
  'Gaji Bulanan',
  'Proyek Freelance',
  'Bonus & Tunjangan',
  'Hasil Investasi',
  'Penjualan & Bisnis',
  'Cashback & Dividen'
];

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { workspace, addTransaction, customCategories, familyMembers, transactionDefaultCategory } = useFinance();
  const { language, t } = useThemeLanguage();
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('fixed');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto select budget category if opened from budget section
  useEffect(() => {
    if (isOpen) {
      if (transactionDefaultCategory) {
        setType('expense');
        setCategory(transactionDefaultCategory);
      } else {
        // Reset category/type if not coming from budget selection so it doesn't carry over
        setCategory('');
      }
    }
  }, [isOpen, transactionDefaultCategory]);

  // Scanner State Variables
  const [scanState, setScanState] = useState<'idle' | 'camera_active' | 'analyzing' | 'success' | 'error'>('idle');
  const [scannerError, setScannerError] = useState('');
  const [scannedSummary, setScannedSummary] = useState<{ amount: number; category: string; description: string; date: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const isId = language === 'id';

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Clean up when isOpen changes to false
  useEffect(() => {
    if (!isOpen) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setScanState('idle');
      setScannerError('');
      setScannedSummary(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setScannerError('');
    setScanState('camera_active');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setScannerError(isId ? 'Gagal mengakses kamera. Silakan pilih dari galeri atau izinkan kamera di browser.' : 'Failed to access camera. Please choose from gallery or allow camera in browser.');
      setScanState('error');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (scanState === 'camera_active') {
      setScanState('idle');
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setScanState('analyzing');
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        
        // Stop camera tracks immediately
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
        
        await sendToScanAPI(base64Image, 'image/jpeg');
      }
    } catch (err: any) {
      console.error("Capture error:", err);
      setScannerError(isId ? 'Gagal menangkap foto struk.' : 'Failed to capture receipt photo.');
      setScanState('error');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerError('');
    setScanState('analyzing');
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      await sendToScanAPI(base64String, file.type);
    };
    reader.onerror = () => {
      setScannerError(isId ? 'Gagal membaca file gambar.' : 'Failed to read image file.');
      setScanState('error');
    };
    reader.readAsDataURL(file);
  };

  const sendToScanAPI = async (base64Image: string, mimeType: string) => {
    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: base64Image, mimeType })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (isId ? "Gagal memproses gambar struk." : "Failed to process receipt image."));
      }

      const { data } = await res.json();
      if (data) {
        setType('expense'); // Receipt scanning maps to an expense
        if (data.amount) setAmount(String(data.amount));
        if (data.category) setCategory(data.category);
        if (data.description) setDescription(data.description);
        if (data.date) setDate(data.date);
        
        setScannedSummary({
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date
        });
        setScanState('success');
        showToast(
          isId 
            ? `Struk berhasil dipindai AI! Rp ${Number(data.amount).toLocaleString('id-ID')} (${data.category})`
            : `Receipt successfully scanned by AI!`,
          'info',
          'Pemindaian AI Struk'
        );
        setTimeout(() => {
          setScanState('idle');
          setScannedSummary(null);
        }, 5000);
      } else {
        throw new Error(isId ? "Hasil pemindaian kosong." : "Scan output is empty.");
      }
    } catch (err: any) {
      console.error("Scanning failed:", err);
      setScannerError(err.message || (isId ? 'Gagal membaca struk dengan AI.' : 'Failed to scan receipt with AI.'));
      setScanState('error');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      await addTransaction({
        workspaceId: workspace,
        type,
        amount: parsedAmount,
        category,
        description,
        date: new Date(date).toISOString(),
        ...(type === 'income' ? { incomeCategory } : {}),
        ...(selectedFamilyMember ? { familyMember: selectedFamilyMember } : {})
      });
      
      showToast(
        isId 
          ? `Transaksi ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${parsedAmount.toLocaleString('id-ID')} (${category}) berhasil dicatat!` 
          : `Transaction Rp ${parsedAmount.toLocaleString('id-ID')} successfully saved!`,
        'success',
        'Transaksi Berhasil'
      );

      // reset
      setAmount('');
      setCategory('');
      setDescription('');
      setSelectedFamilyMember('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (err: any) {
      console.error("Error adding transaction:", err);
      showToast(
        err.message || (isId ? 'Gagal menyimpan transaksi. Periksa koneksi internet Anda.' : 'Failed to save transaction.'),
        'error',
        'Gagal Menyimpan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = customCategories
    .filter(c => c.type === type)
    .map(c => c.name);

  const presetCategories = filteredCategories.length > 0 
    ? filteredCategories 
    : (type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-surface rounded-t-[28px] sm:rounded-2xl border-t sm:border border-outline-variant shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-none sm:zoom-in-95 duration-300">
        {/* Mobile Swipe/Drag Indicator */}
        <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto my-3 sm:hidden shrink-0" />

        <div className="flex justify-between items-center px-5 py-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <CardTitle className="flex items-center gap-2 text-on-surface text-base sm:text-lg font-bold">
            <span className="material-symbols-outlined text-primary font-bold">add_card</span>
            {t('addTransactionModal')}
          </CardTitle>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto flex-1 pb-10 sm:pb-6">
          {/* Type Selector */}
          <div className="flex bg-surface-container-low rounded-xl p-1.5 border border-outline-variant shadow-inner shrink-0">
            <button 
              type="button" 
              onClick={() => { setType('expense'); setCategory(''); }} 
              className={`flex-1 py-2 font-label-caps rounded-lg font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense' ? 'bg-red-600 text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_downward</span>
              {t('expense')}
            </button>
            <button 
              type="button" 
              onClick={() => { setType('income'); setCategory(''); }} 
              className={`flex-1 py-2 font-label-caps rounded-lg font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              {t('income')}
            </button>
          </div>

          {/* AI Receipt Scanning Center */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 flex flex-col gap-3 shrink-0">
            <style>{`
              @keyframes scanLineAnim {
                0% { top: 0%; }
                50% { top: 95%; }
                100% { top: 0%; }
              }
              .animate-scan-line {
                animation: scanLineAnim 2s infinite linear;
              }
            `}</style>

            {scanState === 'idle' && (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2.5">
                  <span className="material-symbols-outlined text-2xl font-bold">photo_camera</span>
                </div>
                <h4 className="font-label-md text-on-surface font-extrabold tracking-wide mb-1">
                  {isId ? 'Input Transaksi Otomatis (AI)' : 'AI Automatic Transaction Input'}
                </h4>
                <p className="text-[11px] text-on-surface-variant max-w-[280px] leading-relaxed mb-3">
                  {isId 
                    ? 'Cukup foto struk belanja Anda. AI akan mengisi nominal, kategori, dan deskripsi secara instan.' 
                    : 'Simply take a photo of your receipt. AI will instantly auto-fill amount, category, and description.'}
                </p>
                
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 bg-primary text-on-primary font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">camera</span>
                    {isId ? 'Gunakan Kamera' : 'Use Camera'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest text-on-surface font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    {isId ? 'Upload Foto' : 'Upload Photo'}
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                <span className="text-[9px] text-on-surface-variant/70 mt-2 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] text-primary">verified_user</span>
                  Powered by Gemini 3.6 Flash
                </span>
              </div>
            )}

            {scanState === 'camera_active' && (
              <div className="relative w-full h-[220px] rounded-lg overflow-hidden border border-primary/30 shadow-md bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Reticle Target Overlay */}
                <div className="absolute inset-0 border-2 border-black/40 flex items-center justify-center pointer-events-none">
                  <div className="w-[180px] h-[130px] border-2 border-dashed border-white rounded-lg shadow-[0_0_0_100vw_rgba(0,0,0,0.4)] flex items-center justify-center">
                    <span className="text-[9px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {isId ? 'Posisikan Struk di Sini' : 'Place Receipt Here'}
                    </span>
                  </div>
                </div>
                
                {/* Controls inside camera */}
                <div className="absolute bottom-2 inset-x-0 flex items-center justify-between px-4 z-10">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                    title={isId ? 'Batal' : 'Cancel'}
                  >
                    <span className="material-symbols-outlined text-[20px] block">close</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:scale-105 transition-transform cursor-pointer border-4 border-slate-300"
                    title={isId ? 'Ambil Foto' : 'Take Photo'}
                  >
                    <div className="w-8 h-8 bg-primary rounded-full" />
                  </button>
                  
                  <div className="w-8" /> {/* Spacer */}
                </div>
              </div>
            )}

            {scanState === 'analyzing' && (
              <div className="relative flex flex-col items-center justify-center py-6 text-center bg-surface-container-high/60 rounded-lg overflow-hidden border border-outline-variant">
                {/* Simulated Scanner Laser Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line shadow-[0_0_8px_var(--primary)] pointer-events-none z-10" />

                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-3" />
                <h4 className="font-label-md text-on-surface font-extrabold tracking-wide mb-1 animate-pulse">
                  {isId ? 'Menganalisis Struk...' : 'Analyzing Receipt...'}
                </h4>
                <p className="text-[10px] text-on-surface-variant max-w-[220px] leading-relaxed">
                  {isId 
                    ? 'AI Gemini sedang membaca nominal akhir, toko, barang belanjaan, dan mencocokkan kategori.' 
                    : 'AI Gemini is reading the purchase total, store, items, and mapping the budget category.'}
                </p>
              </div>
            )}

            {scanState === 'success' && (
              <div className="flex flex-col items-center justify-center py-4 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <span className="material-symbols-outlined text-2xl font-bold">check</span>
                </div>
                <h4 className="font-label-md text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wide mb-1">
                  {isId ? 'Struk Berhasil Terbaca!' : 'Receipt Scanned Successfully!'}
                </h4>
                <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400/90 max-w-[260px] leading-relaxed">
                  {isId 
                    ? 'Form di bawah telah terisi otomatis. Silakan periksa kembali sebelum menyimpan.' 
                    : 'The form below has been auto-filled. Please review the details before saving.'}
                </p>
                
                {scannedSummary && (
                  <div className="mt-3.5 bg-white/70 dark:bg-black/30 px-4 py-2 rounded-lg text-left text-[11px] space-y-1 border border-emerald-500/20 font-medium w-full max-w-[280px]">
                    <div><strong className="text-on-surface-variant">{isId ? 'Nominal:' : 'Amount:'}</strong> <span className="font-bold text-on-surface">Rp {scannedSummary.amount.toLocaleString('id-ID')}</span></div>
                    <div><strong className="text-on-surface-variant">{isId ? 'Kategori:' : 'Category:'}</strong> <span className="text-on-surface font-semibold">{scannedSummary.category}</span></div>
                    <div className="truncate"><strong className="text-on-surface-variant">{isId ? 'Deskripsi:' : 'Description:'}</strong> <span className="text-on-surface">{scannedSummary.description}</span></div>
                  </div>
                )}
              </div>
            )}

            {scanState === 'error' && (
              <div className="flex flex-col items-center justify-center py-4 text-center bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="w-10 h-10 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-2xl font-bold">error</span>
                </div>
                <h4 className="font-label-md text-red-700 dark:text-red-400 font-extrabold tracking-wide mb-1">
                  {isId ? 'Pemindaian Gagal' : 'Scanning Failed'}
                </h4>
                <p className="text-[10px] text-red-600/90 dark:text-red-400/90 max-w-[260px] leading-relaxed mb-3">
                  {scannerError}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScanState('idle')}
                    className="bg-surface hover:bg-surface-container-high border border-outline-variant text-on-surface font-bold text-xs py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {isId ? 'Tutup' : 'Dismiss'}
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-primary text-on-primary font-bold text-xs py-1.5 px-3.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    {isId ? 'Coba Kamera' : 'Try Camera'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nominal */}
          <Input 
            label={t('amount')}
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            icon="payments"
            required
            min="1"
          />

          {/* Preset Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">
              {t('category')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto pr-1">
              {presetCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    category === cat 
                      ? 'bg-primary text-on-primary border-primary shadow-sm' 
                      : 'bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              placeholder="..."
              icon="category"
              required
            />
          </div>

          {type === 'income' && (
            <Select 
              label={t('income')}
              value={incomeCategory} 
              onChange={e => setIncomeCategory(e.target.value as IncomeCategory)}
              icon="account_balance_wallet"
            >
              <option value="fixed">{t('fixedIncome')}</option>
              <option value="variable">{t('variableIncome')}</option>
            </Select>
          )}

          {familyMembers && familyMembers.length > 0 && (
            <Select
              label={isId ? 'Anggota Keluarga (Opsional)' : 'Family Member (Optional)'}
              value={selectedFamilyMember}
              onChange={e => setSelectedFamilyMember(e.target.value)}
              icon="group"
            >
              <option value="">{isId ? '-- Tidak Ditentukan / Umum --' : '-- General / Unspecified --'}</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.role})
                </option>
              ))}
            </Select>
          )}

          {/* Date Input */}
          <Input 
            label={t('date')}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            icon="calendar_today"
            required
          />

          {/* Description */}
          <Input 
            label={t('description')}
            type="text" 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            placeholder="..."
            icon="description"
            required
          />

          <Button type="submit" variant="primary" fullWidth className="mt-2 py-3" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center font-semibold text-sm">
                <Check className="w-4 h-4" />
                {t('save')} ({workspace.toUpperCase()})
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
