import React from 'react';
import { useFinance } from '../store';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

export function DemoLimitModal() {
  const { 
    showDemoLimitModal, 
    setShowDemoLimitModal, 
    demoModalReason, 
    setDemoModalReason, 
    resetDemoTimer, 
    loginWithGoogle 
  } = useFinance();

  if (!showDemoLimitModal) return null;

  const handleClose = () => {
    resetDemoTimer();
    setShowDemoLimitModal(false);
    setDemoModalReason(null);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowDemoLimitModal(false);
      setDemoModalReason(null);
    } catch (err) {
      console.error("Gagal login Google:", err);
    }
  };

  const isTimeout = demoModalReason === 'timeout' || !demoModalReason;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2 text-on-surface text-base sm:text-lg font-bold">
            <span className="material-symbols-outlined text-warning font-bold">
              {isTimeout ? 'timer' : 'lock'}
            </span>
            <span>{isTimeout ? 'Waktu Demo Habis' : 'Fitur Terbatas'}</span>
          </div>
          <button 
            onClick={handleClose} 
            className="text-on-surface-variant hover:text-on-surface bg-surface-container-highest p-1.5 rounded-full transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">
              {isTimeout ? 'hourglass_disabled' : 'security_update_warning'}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-on-surface mb-2">
            {isTimeout ? 'Masa uji coba gratis telah mencapai batas' : 'Masuk untuk Akses Penuh'}
          </h3>
          
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            {isTimeout 
              ? 'Anda sudah menggunakan mode demo selama 2 menit. Daftarkan akun Anda sekarang via Google untuk mengaktifkan sinkronisasi otomatis cloud dan menyimpan data secara permanen.'
              : 'Fitur Laporan Analisis, Riwayat Lengkap, dan Log Aktivitas hanya tersedia bagi pengguna terdaftar untuk menjaga performa server. Daftarkan akun Anda secara gratis sekarang.'
            }
          </p>

          <div className="flex flex-col gap-2.5">
            <Button 
              onClick={handleGoogleLogin} 
              className="w-full py-3 bg-primary hover:bg-primary/95 text-on-primary font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 mr-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Masuk / Daftar dengan Google
            </Button>
            
            <button 
              onClick={handleClose}
              className="w-full py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
            >
              Tetap Lanjutkan Demo (2 Menit Lagi)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
