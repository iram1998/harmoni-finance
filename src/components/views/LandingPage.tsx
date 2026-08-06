import React, { useState } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useFinance } from '../../store';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { language, toggleLanguage, theme, toggleTheme } = useThemeLanguage();
  const { isDemo, user } = useFinance();
  const isId = language === 'id';

  // Mascot state
  const [mascotMood, setMascotMood] = useState<'happy' | 'cheer' | 'excited' | 'love'>('happy');
  const [mascotQuoteIndex, setMascotQuoteIndex] = useState(0);

  // Piggy bank mini game state
  const [coins, setCoins] = useState(350000);
  const [coinCount, setCoinCount] = useState(7);
  const [piggyShake, setPiggyShake] = useState(false);
  const [lastCoinAdded, setLastCoinAdded] = useState<number | null>(null);

  // Financial Personality Quiz state
  const [savingsRatio, setSavingsRatio] = useState(20);
  const [coffeeTimes, setCoffeeTimes] = useState(2);

  // Random tips state
  const [tipIndex, setTipIndex] = useState(0);

  const mascotQuotes = isId ? [
    'Hai Kak! Aku Noora 🐱, maskot kucing hijau NOHARFIN! Siap bantu catat uang jajan & tabungan kamu!',
    'Keuangan yang sehat bikin tidur makin nyenyak dan hati makin tenang! ✨',
    'Ingat ya, NOHARFIN ini 100% GRATIS selamanya tanpa iklan atau biaya tersembunyi! 💖',
    'Yuk biasakan sisihkan tabungan di awal gajian, bukan dari sisanya! 🪙',
    'Catat utang piutang dengan rapi agar silaturahmi tetap terjaga! 🤝'
  ] : [
    'Hi there! I am Noora 🐱, NOHARFIN\'s light green cat mascot! Ready to help manage your money & savings!',
    'Healthy finances mean better sleep and a happier heart! ✨',
    'Remember, NOHARFIN is 100% FREE forever with zero ads or hidden fees! 💖',
    'Pro tip: Save at the beginning of payday, not from what is left over! 🪙',
    'Keep your debts & receivables clear to protect great relationships! 🤝'
  ];

  const funnyTips = isId ? [
    ' Diskon 50% untuk barang yang tidak kamu butuhkan = Tetap rugi 100%! 🛍️',
    ' Jangan pernah mengecek saldo rekening saat lapar, nanti semua jadi jajanan online! 🛵',
    ' Menabung Rp 10.000 sehari = Rp 3,65 Juta setahun. Cukup buat beli kuota & kopi setahun! ☕',
    ' Utang ke teman harus dibayar cepat, sebelum hubungan berubah jadi stranger dengan kenangan! 😅',
    ' Budgeting bukan membatasi kebahagiaan, tapi memastikan kebahagiaan kamu berlanjut bulan depan! 🌈'
  ] : [
    ' 50% discount on things you don\'t need = Still 100% money wasted! 🛍️',
    ' Never check your bank balance when hungry, or everything becomes food delivery! 🛵',
    ' Saving $1 a day = $365 a year. Small steps build big financial peace! ☕',
    ' Pay debts back promptly before friends turn into strangers with memories! 😅',
    ' Budgeting isn\'t limiting fun, it\'s making sure your fun continues next month! 🌈'
  ];

  const handleMascotClick = () => {
    const moods: ('happy' | 'cheer' | 'excited' | 'love')[] = ['happy', 'cheer', 'excited', 'love'];
    const nextMood = moods[(moods.indexOf(mascotMood) + 1) % moods.length];
    setMascotMood(nextMood);
    setMascotQuoteIndex((prev) => (prev + 1) % mascotQuotes.length);
  };

  const handleAddCoin = () => {
    setCoins(prev => prev + 50000);
    setCoinCount(prev => prev + 1);
    setLastCoinAdded(50000);
    setPiggyShake(true);
    setTimeout(() => setPiggyShake(false), 500);
    setTimeout(() => setLastCoinAdded(null), 1500);
  };

  const getPersonalityVerdict = () => {
    if (savingsRatio >= 30 && coffeeTimes <= 2) {
      return {
        title: isId ? '🏆 Sultan Penghemat Harmonis' : '🏆 Harmonic Savings Master',
        desc: isId ? 'Luar biasa! Manajemen keuanganmu sangat disiplin. Masa depan finansialmu sangat cerah!' : 'Awesome! Your financial discipline is top notch. Your future looks bright!',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        emoji: '🌟'
      };
    } else if (savingsRatio >= 15) {
      return {
        title: isId ? '⚖️ Pejuang Finansial Seimbang' : '⚖️ Balanced Financial Fighter',
        desc: isId ? 'Sudah bagus! Kamu tahu cara menikmati hidup tanpa mengorbankan tabungan harian.' : 'Great job! You know how to enjoy life while consistently growing savings.',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        emoji: '🎯'
      };
    } else {
      return {
        title: isId ? '🚀 Calon Pengelola Ulung' : '🚀 Future Finance Champ',
        desc: isId ? 'Ayo mulai catat rutin di NOHARFIN! Sedikit demi sedikit lama-lama menjadi bukit.' : 'Start tracking with NOHARFIN today! Small steps lead to giant milestones.',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        emoji: '✨'
      };
    }
  };

  const verdict = getPersonalityVerdict();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface-container-lowest text-on-surface flex flex-col font-sans antialiased selection:bg-pink-500 selection:text-white">
      
      {/* Landing Page Sticky Top Navbar */}
      <header className="sticky top-0 z-50 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-outline-variant shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <span className="material-symbols-outlined text-xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance_wallet
              </span>
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 tracking-tight">
                  NOHARFIN
                </span>
                <span className="bg-pink-500/10 text-pink-600 dark:text-pink-300 border border-pink-500/20 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                  FREE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-semibold hidden sm:block">
                Noora Harmony Finance
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-on-surface-variant">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {isId ? 'Fitur Unggulan' : 'Features'}
            </button>
            <button 
              onClick={() => document.getElementById('interactive-tools')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isId ? 'Celengan & Quiz' : 'Piggy & Quiz'}</span>
              <span className="material-symbols-outlined text-sm text-amber-500">sports_esports</span>
            </button>
            <button 
              onClick={() => document.getElementById('dedication')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {isId ? 'Tentang Kami' : 'About Free App'}
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              type="button"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title={isId ? 'Ganti Bahasa (English)' : 'Switch Language (Indonesian)'}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">translate</span>
              <span className="hidden sm:inline uppercase">{language}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface transition-all cursor-pointer shrink-0"
              title={isId ? 'Beralih Mode Terang / Gelap' : 'Toggle Dark / Light Theme'}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Enter App CTA Button */}
            <button
              onClick={() => onNavigate('dashboard')}
              type="button"
              className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl active:scale-95 transition-all flex items-center gap-1 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">{isId ? 'Masuk' : 'Enter'}</span>
              <span className="hidden sm:inline">{isId ? 'Masuk Aplikasi' : 'Enter Application'}</span>
              <span className="material-symbols-outlined text-xs sm:text-base">arrow_forward</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* Dedication Banner Top Ribbon */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-xl animate-fade-in">
          <div className="bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[14px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl animate-bounce">💖</span>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    100% Dedicated Free
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {isId ? 'Tanpa Iklan • Tanpa Biaya Tersembunyi' : 'No Ads • No Hidden Fees'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-on-surface mt-1">
                  {isId 
                    ? 'Aplikasi NOHARFIN Didedikasikan Bebas & Gratis untuk Semua Orang' 
                    : 'NOHARFIN App is Dedicated 100% Free for Everyone'}
                </h2>
              </div>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{isId ? 'Mulai Coba Demo' : 'Try Free Demo'}</span>
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </button>
          </div>
        </div>

        {/* Hero Section with Interactive Mascot */}
        <section className="relative rounded-3xl bg-surface p-6 sm:p-12 border border-outline-variant shadow-xl overflow-hidden">
          {/* Background Decorative Circles */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold tracking-wide">
                <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                <span>NOHARFIN • Noora Harmony Finance</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-on-surface tracking-tight leading-tight">
                {isId ? (
                  <>Kelola Keuangan <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500">Tanpa Pusing</span>, Harmonis & Menyenangkan!</>
                ) : (
                  <>Manage Money <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500">Stress-Free</span>, Harmonious & Fun!</>
                )}
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-xl mx-auto lg:mx-0">
                {isId 
                  ? 'NOHARFIN dirancang khusus untuk membantu pencatatan arus kas pribadi, anggaran keluarga, aset & capex, serta utang piutang secara otomatis, akurat, dan 100% interaktif.'
                  : 'NOHARFIN is lovingly crafted to automate personal cash flows, family budgeting, asset tracking, and receivables effortlessly with an intuitive, 100% free interface.'}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  type="button"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                  <span>{isId ? 'Masuk ke Aplikasi Langsung' : 'Launch Application'}</span>
                </button>

                <button
                  onClick={() => {
                    const elem = document.getElementById('interactive-tools');
                    elem?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  type="button"
                  className="w-full sm:w-auto px-6 py-4 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-bold text-sm rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl text-amber-500">sports_esports</span>
                  <span>{isId ? 'Coba Mini Game' : 'Play Mini Game'}</span>
                </button>
              </div>

              {/* Quick Feature Pill Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-on-surface-variant">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {isId ? 'Multi Workspace' : 'Multi Workspace'}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  {isId ? 'Keamanan PIN' : 'PIN Protection'}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">restore</span>
                  {isId ? 'Pemulihan Utang' : 'Debt Recovery'}
                </span>
              </div>

            </div>

            {/* Hero Right: Cute Light Green Cat Interactive Mascot Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div 
                onClick={handleMascotClick}
                className={`relative bg-gradient-to-b from-emerald-500/10 via-teal-500/10 to-lime-500/10 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 text-center shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group w-full max-w-sm ${piggyShake ? 'animate-shake' : ''}`}
              >
                {/* Floating Heart / Sparkle Badges */}
                <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 p-1.5 rounded-full animate-bounce">
                  <span className="material-symbols-outlined text-lg">pets</span>
                </div>
                <div className="absolute top-3 left-3 bg-lime-500/20 text-lime-600 dark:text-lime-300 p-1.5 rounded-full">
                  <span className="material-symbols-outlined text-lg">savings</span>
                </div>

                {/* Mascot Face Icon - Light Green Cat */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto bg-gradient-to-tr from-emerald-400 via-teal-300 to-lime-400 rounded-full flex items-center justify-center shadow-xl ring-4 ring-emerald-300/50 relative">
                  <span className="text-6xl sm:text-7xl select-none transform transition-transform group-hover:scale-110">
                    {mascotMood === 'happy' && '🐱'}
                    {mascotMood === 'cheer' && '😸'}
                    {mascotMood === 'excited' && '😻'}
                    {mascotMood === 'love' && '😽'}
                  </span>
                  
                  {/* Mood Tag */}
                  <span className="absolute -bottom-2 bg-surface text-on-surface border border-emerald-500/30 text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-md uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {mascotMood === 'happy' && 'Noora Kucing Hijau'}
                    {mascotMood === 'cheer' && 'Semangat Meow!'}
                    {mascotMood === 'excited' && 'Hemat Maksimal'}
                    {mascotMood === 'love' && 'Sayang Keluarga'}
                  </span>
                </div>

                {/* Dialog Bubble */}
                <div className="mt-5 bg-surface p-4 rounded-2xl border border-outline-variant shadow-md text-xs sm:text-sm text-on-surface font-semibold relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface border-t border-l border-outline-variant rotate-45" />
                  <p className="relative z-10 italic">
                    "{mascotQuotes[mascotQuoteIndex]}"
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-sm">touch_app</span>
                  <span>{isId ? 'Sapa Noora si Kucing Hijau!' : 'Click Noora the Green Cat!'}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Interactive Mini Game & Quiz Tools */}
        <div id="interactive-tools" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-24">
          
          {/* Widget 1: Celengan Interaktif NOHARFIN */}
          <div className="bg-surface p-6 rounded-3xl border border-outline-variant shadow-md flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">savings</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">
                    {isId ? 'Celengan Interaktif NOHARFIN' : 'Interactive NOHARFIN Piggy Bank'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isId ? 'Simulasi menabung koin untuk latih kebiasaan hemat' : 'Interactive coin savings simulation'}
                  </p>
                </div>
              </div>
              <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Mini Game
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/10 p-5 rounded-2xl border border-amber-500/30 text-center space-y-3 relative overflow-hidden">
              {lastCoinAdded && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg animate-bounce">
                  +{isId ? 'Rp 50.000 Terkumpul!' : '$50 Saved!'} 🪙
                </div>
              )}

              <div className="text-4xl">
                <span className={`inline-block ${piggyShake ? 'animate-bounce' : ''}`}>
                  🐱
                </span>
              </div>

              <div>
                <span className="text-xs text-on-surface-variant font-semibold block">
                  {isId ? 'Total Saldo Celengan Digital:' : 'Total Piggy Balance:'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  Rp {coins.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="w-full bg-surface-container rounded-full h-3 border border-outline-variant overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (coinCount / 20) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                <span>{coinCount} {isId ? 'Koin Terkumpul' : 'Coins Collected'}</span>
                <span>Target: 20 Koin</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAddCoin}
                type="button"
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">monetization_on</span>
                <span>{isId ? 'Masukkan Koin (+Rp 50rb)' : 'Add Coin (+$50)'}</span>
              </button>
              <button
                onClick={() => {
                  setCoins(350000);
                  setCoinCount(7);
                }}
                type="button"
                className="px-3 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded-xl border border-outline-variant text-xs font-semibold cursor-pointer"
                title={isId ? 'Reset Celengan' : 'Reset'}
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          </div>

          {/* Widget 2: Tes Kepribadian Finansial */}
          <div className="bg-surface p-6 rounded-3xl border border-outline-variant shadow-md flex flex-col justify-between space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">
                    {isId ? 'Kalkulator Tipe Finansial' : 'Financial Health Quiz'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isId ? 'Geser slider untuk cek skor kebiasaan keuanganmu!' : 'Adjust sliders to calculate your financial score!'}
                  </p>
                </div>
              </div>
              <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                Interaktif
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Slider 1: Porsi Tabungan */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>{isId ? 'Porsi Tabungan Bulanan (% gaji):' : 'Monthly Savings (% income):'}</span>
                  <span className="text-primary font-black">{savingsRatio}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="5"
                  value={savingsRatio}
                  onChange={(e) => setSavingsRatio(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Slider 2: Frekuensi Jajan */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-on-surface">
                  <span>{isId ? 'Frekuensi Jajan/Kopi Seminggu:' : 'Coffee/Snack times per week:'}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">{coffeeTimes}x</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="14" 
                  step="1"
                  value={coffeeTimes}
                  onChange={(e) => setCoffeeTimes(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Verdict Box */}
              <div className={`p-3.5 rounded-xl border ${verdict.badge} flex items-start gap-3 transition-all`}>
                <span className="text-2xl">{verdict.emoji}</span>
                <div>
                  <h4 className="font-extrabold text-sm">{verdict.title}</h4>
                  <p className="text-[11px] leading-relaxed mt-0.5 opacity-90">{verdict.desc}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              type="button"
              className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl border border-outline-variant transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isId ? 'Buka Aplikasi NOHARFIN' : 'Open NOHARFIN App'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

        </div>

        {/* Random Funny Financial Tip Card */}
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 p-5 rounded-2xl border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">💡</span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full">
                {isId ? 'Trik Hari Ini' : 'Today\'s Witty Tip'}
              </span>
              <p className="text-xs sm:text-sm font-semibold text-on-surface mt-1">
                "{funnyTips[tipIndex]}"
              </p>
            </div>
          </div>

          <button
            onClick={() => setTipIndex((prev) => (prev + 1) % funnyTips.length)}
            type="button"
            className="px-4 py-2 bg-surface hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl border border-outline-variant shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">casino</span>
            <span>{isId ? 'Acak Trik Lain' : 'Next Tip'}</span>
          </button>
        </div>

        {/* Feature Cards Showcase Section */}
        <section id="features" className="space-y-6 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {isId ? 'Fitur Unggulan NOHARFIN' : 'NOHARFIN Highlights'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {isId ? 'Mengapa Harus NOHARFIN?' : 'Why Choose NOHARFIN?'}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {isId 
                ? 'Satu aplikasi lengkap untuk seluruh kebutuhan manajemen keuangan keluarga dan bisnis kecil Anda.'
                : 'All-in-one financial app built to serve personal, family, and small business needs effortlessly.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Card 1 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">swap_horiz</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '1. Arus Kas & Multi Workspace' : '1. Cash Flow & Multi Workspace'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Catat pemasukan, pengeluaran, dan transfer antar rekening. Bebas beralih antara Workspace Pribadi dan Keluarga.'
                  : 'Record incomes, expenses, and inter-account transfers easily. Switch between Personal & Family workspaces.'}
              </p>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">home_work</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '2. Aset, Sub-Aset & Capex' : '2. Assets & Capex Tracking'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Kelola aset fisik (rumah, kendaraan, emas, toko), catat sub-komponen, dan otomatis tambahkan nilai lewat transaksi Capex.'
                  : 'Track real assets (property, vehicles, gold, store), add sub-components, and update value automatically via Capex.'}
              </p>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">account_balance</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '3. Utang & Piutang Cerdas' : '3. Debts & Receivables'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Pantau sisa pinjaman & tagihan. Apabila transaksi cicilan dihapus di Arus Kas, sisa utang otomatis dipulihkan secara aman!'
                  : 'Manage loans & receivables. Deleting payment transactions in Cash Flow automatically restores remaining debt balances!'}
              </p>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '4. Tagihan Rutin Repetitif' : '4. Recurring Bill Reminders'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Sewa toko, PLN, BPJS, dan Wi-Fi. Sekali klik "Bayar Sekarang", memotong rekening bank dan memajukan jatuh tempo ke periode berikutnya.'
                  : 'Store rent, utilities, Wi-Fi, and insurance. One-click "Pay Now" deducts bank balance and rolls due dates forward.'}
              </p>
            </div>

            {/* Card 5 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-pink-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">savings</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '5. Amplop Anggaran & Safe Spend' : '5. Envelope Budgeting'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Tetapkan limit belanja per kategori dan hitung Safe Spend harian secara otomatis agar terhindar dari pemborosan bulanan.'
                  : 'Set category monthly spending caps and calculate daily safe spend limits to keep household budgets on track.'}
              </p>
            </div>

            {/* Card 6 */}
            <div 
              onClick={() => onNavigate('dashboard')}
              className="bg-surface p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">security</span>
              </div>
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{isId ? '6. Keamanan PIN & Enkripsi Data' : '6. Security PIN & Encryption'}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {isId 
                  ? 'Proteksi PIN keamanan lokal 4-6 digit, fitur rekonsiliasi saldo bank, serta sinkronisasi aman Firebase Cloud.'
                  : 'Local 4-6 digit security PIN lock, bank balance reconciliation, and real-time Firebase Cloud sync.'}
              </p>
            </div>

          </div>
        </section>

        {/* Dedication Statement Banner */}
        <div id="dedication" className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden text-center space-y-4 scroll-mt-24">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <span className="inline-block bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
            💖 Dedicated 100% Free
          </span>

          <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
            NOHARFIN (Noora Harmony Finance)
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isId 
              ? 'Aplikasi ini didedikasikan secara 100% GRATIS untuk membantu setiap individu dan keluarga Indonesia mengelola keuangan dengan transparan, harmonis, dan penuh keberkahan.'
              : 'Dedicated 100% FREE to empower every individual and family to manage finances transparently, harmoniously, and effectively.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              type="button"
              className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-xl active:scale-95 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>{isId ? 'Buka Aplikasi Sekarang' : 'Open Application Now'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

      </main>

      {/* Standalone Landing Page Footer */}
      <footer className="border-t border-outline-variant bg-surface text-on-surface-variant py-8 px-4 text-center text-xs space-y-2 pb-24 md:pb-8">
        <div className="flex items-center justify-center gap-2 font-extrabold text-on-surface">
          <span className="material-symbols-outlined text-primary text-sm">account_balance_wallet</span>
          <span>NOHARFIN (Noora Harmony Finance)</span>
        </div>
        <p className="max-w-md mx-auto text-[11px] text-on-surface-variant/80">
          {isId 
            ? 'Didedikasikan 100% Gratis tanpa iklan, tanpa langganan, dan aman digunakan oleh siapa saja.' 
            : 'Dedicated 100% Free with no ads, no subscriptions, and safe for everyone.'}
        </p>
        <p className="text-[10px] text-on-surface-variant/60">
          © 2026 NOHARFIN. All rights reserved.
        </p>
      </footer>

      {/* Mobile Bottom Dock Navigation for Landing Page */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full overflow-hidden bg-surface/95 backdrop-blur-md border-t border-outline-variant z-50 px-3 py-2 flex items-center justify-between gap-1 shadow-2xl">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-on-surface-variant hover:text-emerald-500 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          <span>{isId ? 'Atas' : 'Top'}</span>
        </button>

        <button
          onClick={() => document.getElementById('interactive-tools')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-on-surface-variant hover:text-emerald-500 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-lg text-emerald-500">pets</span>
          <span>Noora</span>
        </button>

        <button
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-on-surface-variant hover:text-emerald-500 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-lg">star</span>
          <span>{isId ? 'Fitur' : 'Features'}</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          type="button"
          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white font-extrabold text-[11px] rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>{isId ? 'Masuk App' : 'Enter'}</span>
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </nav>

    </div>
  );
}
