import React, { useEffect, useState } from 'react';
import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { X, Sparkles, BookOpen, ArrowRight, ShieldCheck, Wallet, Receipt, PieChart, Layers } from 'lucide-react';

interface WelcomeGuideModalProps {
  onNavigateHelp: (view: string) => void;
}

export function WelcomeGuideModal({ onNavigateHelp }: WelcomeGuideModalProps) {
  const { user, isAuthLoading } = useFinance();
  const { language } = useThemeLanguage();
  const isId = language === 'id';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    // Tentukan ID unik pengguna (UID Firebase jika login, atau 'guest' jika mode demo)
    const userIdKey = user?.uid ? `user_${user.uid}` : 'guest_demo';
    const storageKey = `harmoni_welcome_seen_${userIdKey}`;

    // Cek apakah status 'welcome_seen' sudah ada di localStorage
    const hasSeenWelcome = localStorage.getItem(storageKey);

    // Kriteria Pengguna Baru / Pertama Kali Buka:
    // 1. Belum ada flag 'harmoni_welcome_seen' di localStorage
    // 2. Jika login dengan Firebase, bisa dicek pembuatan akun baru (misal: creationTime)
    if (!hasSeenWelcome) {
      // Tampilkan popup secara halus dengan sedikit delay agar UI siap
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthLoading]);

  if (!isOpen) return null;

  const handleMarkSeenAndClose = () => {
    const userIdKey = user?.uid ? `user_${user.uid}` : 'guest_demo';
    localStorage.setItem(`harmoni_welcome_seen_${userIdKey}`, 'true');
    setIsOpen(false);
  };

  const handleGoToHelp = () => {
    handleMarkSeenAndClose();
    onNavigateHelp('help');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-surface rounded-3xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Banner Gradient */}
        <div className="relative bg-gradient-to-r from-primary-container via-surface-container-high to-secondary-container p-6 border-b border-outline-variant/60">
          <button 
            onClick={handleMarkSeenAndClose} 
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface bg-surface/80 backdrop-blur-md p-2 rounded-full transition-all hover:scale-105 active:scale-95 border border-outline-variant"
            title={isId ? 'Tutup' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-2xl text-primary flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <span className="px-3 py-1 bg-primary/15 text-primary font-bold text-xs rounded-full border border-primary/20 uppercase tracking-wider">
              {isId ? 'Selamat Datang 🎉' : 'Welcome 🎉'}
            </span>
          </div>

          <h2 className="font-headline-sm sm:font-headline-md font-bold text-on-surface">
            {isId ? 'Selamat Datang di Harmoni Finansial!' : 'Welcome to Harmoni Finansial!'}
          </h2>
          <p className="font-body-sm text-on-surface-variant mt-1 leading-relaxed">
            {isId 
              ? 'Platform manajemen keuangan keluarga & pribadi pintar dengan teknologi AI dan isolasi ruang kerja aman.'
              : 'Smart personal & family financial management platform with AI scanning and secure workspace isolation.'}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl space-y-3">
            <h3 className="font-title-sm font-bold text-on-surface flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {isId ? 'Rekomendasi Awal Pengguna Baru' : 'Getting Started Recommendation'}
            </h3>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              {isId 
                ? 'Sangat disarankan untuk membuka Pusat Bantuan & Edukasi terlebih dahulu agar Anda dapat memahami alur kerja sistem, pemisahan Workspace (Pribadi vs Keluarga), pencatatan Utang, Amplop Anggaran, dan Scan Struk AI.'
                : 'We highly recommend visiting the Help Center first to understand the system workflows, Workspace isolation (Personal vs Family), Debt tracking, Envelope Budgeting, and AI Receipt Scanning.'}
            </p>
          </div>

          {/* Quick Highlight Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-label-md font-bold text-on-surface">{isId ? 'Workspace' : 'Workspace'}</h4>
                <p className="font-label-sm text-on-surface-variant line-clamp-2">{isId ? 'Isolasi data Pribadi vs Dompet Keluarga.' : 'Isolate Personal vs Family wallets.'}</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-label-md font-bold text-on-surface">{isId ? 'Scan Struk AI' : 'AI Receipt'}</h4>
                <p className="font-label-sm text-on-surface-variant line-clamp-2">{isId ? 'Input transaksi dari foto struk otomatis.' : 'Auto-extract transaction from receipts.'}</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0 mt-0.5">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-label-md font-bold text-on-surface">{isId ? 'Utang & Aset' : 'Debts & Assets'}</h4>
                <p className="font-label-sm text-on-surface-variant line-clamp-2">{isId ? 'Catat cicilan, depresiasi, & GPS lokasi.' : 'Track installments & asset location.'}</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start gap-2.5">
              <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg shrink-0 mt-0.5">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-label-md font-bold text-on-surface">{isId ? 'Anggaran' : 'Budgeting'}</h4>
                <p className="font-label-sm text-on-surface-variant line-clamp-2">{isId ? 'Envelope budgeting & Daily Safe Spend.' : 'Envelope budgeting & Daily Safe Spend.'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleGoToHelp}
              className="flex-1 py-3 px-5 bg-primary hover:bg-primary/95 text-on-primary font-bold text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isId ? 'Buka Panduan & Pusat Bantuan' : 'Open User Guide & Help'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={handleMarkSeenAndClose}
              className="py-3 px-5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-sm rounded-xl transition-all border border-outline-variant cursor-pointer active:scale-98"
            >
              {isId ? 'Jelajahi Sendiri' : 'Explore On My Own'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/80 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isId ? 'Panduan ini dapat dibuka kembali kapan saja melalui menu Bantuan.' : 'You can revisit this guide anytime via the Help menu.'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
