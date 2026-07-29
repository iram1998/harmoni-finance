import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TransactionModal } from './TransactionModal';
import { TransferModal } from './TransferModal';
import { EnvelopeModal } from './EnvelopeModal';
import { GoalModal } from './GoalModal';
import { BillModal } from './BillModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { GlobalSearchBar } from './GlobalSearchBar';

export function Layout({ children, currentView, setCurrentView }: { children: React.ReactNode; currentView: string; setCurrentView: (view: string) => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const { 
    workspace, transactions, envelopes, bills,
    isTransactionModalOpen, openTransactionModal, closeTransactionModal, 
    isTransferModalOpen, closeTransferModal,
    isEnvelopeModalOpen, closeEnvelopeModal, envelopeEditTarget,
    isGoalModalOpen, closeGoalModal,
    isBillModalOpen, closeBillModal,
    selectedDetailTransaction, isTransactionDetailModalOpen, closeTransactionDetailModal,
    isDemo, setShowDemoLimitModal, setDemoModalReason
  } = useFinance();
  const { language, toggleLanguage, theme, toggleTheme, t } = useThemeLanguage();

  const isId = language === 'id';

  const handleViewNavigation = (view: string) => {
    if (isDemo && (view === 'reports' || view === 'activity-logs')) {
      setDemoModalReason(view === 'reports' ? 'reports' : 'activity-logs');
      setShowDemoLimitModal(true);
      return;
    }
    setCurrentView(view);
  };

  // Generate dynamic alerts based on live database data
  const unpaidBills = bills.filter(b => b.workspaceId === workspace && !b.isPaid);
  const wsTransactions = transactions.filter(t => t.workspaceId === workspace && t.type === 'expense');
  
  const spentByCategory = wsTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const budgetAlerts = envelopes
    .filter(e => e.workspaceId === workspace && e.allocatedAmount > 0)
    .map(e => {
      const spent = spentByCategory[e.category] || 0;
      const ratio = spent / e.allocatedAmount;
      if (ratio >= 0.9) {
        return {
          id: `budget-${e.id}`,
          title: ratio >= 1.0 ? (isId ? 'Limit Anggaran Terlewati!' : 'Budget Limit Exceeded!') : (isId ? 'Anggaran Menipis' : 'Budget Running Low'),
          description: isId 
            ? `Kategori "${e.category}" telah terpakai ${Math.round(ratio * 100)}% (Rp ${spent.toLocaleString('id-ID')} dari Rp ${e.allocatedAmount.toLocaleString('id-ID')}).`
            : `Category "${e.category}" has reached ${Math.round(ratio * 100)}% utilization (${spent.toLocaleString('en-US')} of ${e.allocatedAmount.toLocaleString('en-US')}).`,
          type: 'budget' as const,
          date: isId ? 'Hari ini' : 'Today',
          read: false,
          actionView: 'budgeting'
        };
      }
      return null;
    })
    .filter((alert): alert is NonNullable<typeof alert> => alert !== null);

  const billNotifications = unpaidBills.map(b => {
    const dueDateObj = new Date(b.dueDate);
    const today = new Date();
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeLabel = '';
    if (diffDays < 0) {
      timeLabel = isId ? `Terlambat ${Math.abs(diffDays)} hari` : `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      timeLabel = isId ? 'Jatuh tempo hari ini' : 'Due today';
    } else {
      timeLabel = isId ? `${diffDays} hari lagi` : `in ${diffDays} days`;
    }

    return {
      id: `bill-${b.id}`,
      title: isId ? 'Tagihan Mendatang' : 'Upcoming Bill',
      description: isId 
        ? `Tagihan "${b.name}" sebesar Rp ${b.amount.toLocaleString('id-ID')} (${timeLabel}).`
        : `Bill "${b.name}" of Rp ${b.amount.toLocaleString('id-ID')} is due (${timeLabel}).`,
      type: 'bill' as const,
      date: b.dueDate,
      read: false,
      actionView: 'bills'
    };
  });

  const systemNotifications = [
    {
      id: 'welcome-message',
      title: isId ? 'Selamat Datang di Harmoni' : 'Welcome to Harmoni',
      description: isId 
        ? 'Kelola anggaran, tagihan, aset, dan kembangkan kebiasaan finansial sehat bersama keluarga.' 
        : 'Manage your budget, bills, assets, and grow healthy financial habits with your family.',
      type: 'system' as const,
      date: isId ? 'Baru saja' : 'Just now',
      read: false,
      actionView: undefined
    }
  ];

  const allNotifications = [...billNotifications, ...budgetAlerts, ...systemNotifications];

  return (
    <div className="bg-background text-on-background min-h-screen flex font-body-md antialiased transition-colors duration-200">
      {/* Desktop Sidebar */}
      <nav className={`fixed left-0 top-0 h-full bg-[#162442] border-r border-[#22355c] shadow-2xl hidden md:flex flex-col p-4 gap-4 z-50 transition-all duration-300 ease-in-out print:hidden ${isSidebarOpen ? 'w-[280px]' : 'w-[88px]'}`}>
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-6 mt-2 px-2 pb-4 border-b border-[#22355c]`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="material-symbols-outlined text-blue-400 text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
              <h1 className="font-headline-md font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight whitespace-nowrap">Harmoni</h1>
            </div>
          )}
          {!isSidebarOpen && (
             <span className="material-symbols-outlined text-blue-400 text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 active:scale-95"
          >
            <span className="material-symbols-outlined">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
        </div>

        <div className="flex flex-col gap-1 flex-grow overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
          {/* Kelompok 1: Utama */}
          {isSidebarOpen ? (
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 mt-2 px-3 block">
              {isId ? 'Navigasi Utama' : 'Core Navigation'}
            </span>
          ) : (
            <div className="border-t border-slate-700/50 my-1 w-full" />
          )}
          <NavItem icon="dashboard" label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} isOpen={isSidebarOpen} />
          <NavItem icon="swap_horiz" label={t('cashFlow')} active={currentView === 'cash-flow'} onClick={() => setCurrentView('cash-flow')} isOpen={isSidebarOpen} />

          {/* Kelompok 2: Perencanaan */}
          {isSidebarOpen ? (
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 mt-4 px-3 block">
              {isId ? 'Perencanaan & Target' : 'Planning & Goals'}
            </span>
          ) : (
            <div className="border-t border-slate-700/50 my-1 w-full" />
          )}
          <NavItem icon="account_balance_wallet" label={t('budgeting')} active={currentView === 'budgeting'} onClick={() => setCurrentView('budgeting')} isOpen={isSidebarOpen} />
          <NavItem icon="receipt_long" label={t('billsTitle')} active={currentView === 'bills'} onClick={() => setCurrentView('bills')} isOpen={isSidebarOpen} />
          <NavItem icon="ads_click" label={t('goals')} active={currentView === 'goals'} onClick={() => setCurrentView('goals')} isOpen={isSidebarOpen} />

          {/* Kelompok 3: Analisis & Aset */}
          {isSidebarOpen ? (
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 mt-4 px-3 block">
              {isId ? 'Kekayaan & Analisis' : 'Wealth & Analytics'}
            </span>
          ) : (
            <div className="border-t border-slate-700/50 my-1 w-full" />
          )}
          <NavItem icon="home_work" label={t('assetsAndGoods')} active={currentView === 'assets'} onClick={() => handleViewNavigation('assets')} isOpen={isSidebarOpen} />
          <NavItem icon="assessment" label={t('reports')} active={currentView === 'reports'} onClick={() => handleViewNavigation('reports')} isOpen={isSidebarOpen} />

          {/* Kelompok 4: Aplikasi */}
          {isSidebarOpen ? (
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1 mt-4 px-3 block">
              {isId ? 'Aplikasi' : 'App'}
            </span>
          ) : (
            <div className="border-t border-slate-700/50 my-1 w-full" />
          )}
          <NavItem icon="history_edu" label={isId ? 'Log Aktivitas' : 'Activity Logs'} active={currentView === 'activity-logs'} onClick={() => handleViewNavigation('activity-logs')} isOpen={isSidebarOpen} />
          <NavItem icon="settings" label={t('settings')} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} isOpen={isSidebarOpen} />
          <NavItem icon="help" label={isId ? 'Bantuan' : 'Help'} active={currentView === 'help'} onClick={() => setCurrentView('help')} isOpen={isSidebarOpen} />
        </div>
      </nav>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[88px]'}`}>
        {/* TopNavBar Desktop */}
        <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-outline-variant hidden md:flex justify-between items-center h-20 px-8 shadow-sm print:hidden">
          <div className="flex items-center gap-4 flex-1">
            <GlobalSearchBar setCurrentView={setCurrentView} className="w-80 lg:w-96" />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="primary" icon="add" onClick={openTransactionModal} className="rounded-full shadow-md hover:shadow-lg">
              {t('newTransaction')}
            </Button>
            
            <div className="flex gap-2 items-center pl-2 border-l border-outline-variant">
              {/* Language Switcher Button */}
              <button 
                onClick={toggleLanguage}
                className="h-10 px-3 flex items-center gap-1.5 rounded-full bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface font-label-md transition-all active:scale-95 shadow-sm"
                title={t('language')}
              >
                <span className="material-symbols-outlined text-lg text-primary">translate</span>
                <span className="font-bold tracking-wider">{language.toUpperCase()}</span>
              </button>

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low border border-outline-variant hover:border-primary text-on-surface transition-all active:scale-95 shadow-sm"
                title={theme === 'dark' ? t('lightMode') : t('darkMode')}
              >
                <span className="material-symbols-outlined text-primary">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>

              {/* Dynamic Notification Bell with Dropdown Popover */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors relative active:scale-95 ${isNotificationOpen ? 'bg-surface-container-high text-primary' : ''}`}
                  title={isId ? 'Notifikasi' : 'Notifications'}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {allNotifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn max-h-[480px] flex flex-col">
                      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                        <h4 className="font-headline-xs text-on-surface flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[20px]">notifications</span>
                          {isId ? 'Notifikasi' : 'Notifications'}
                        </h4>
                        <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {allNotifications.length} {isId ? 'Pesan' : 'Messages'}
                        </span>
                      </div>

                      <div className="overflow-y-auto divide-y divide-outline-variant/50 max-h-[360px] flex-1">
                        {allNotifications.length === 0 ? (
                          <div className="p-8 text-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl text-outline-variant/80 mb-2">notifications_off</span>
                            <p className="font-body-sm">{isId ? 'Tidak ada notifikasi baru' : 'No new notifications'}</p>
                          </div>
                        ) : (
                          allNotifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                if (notif.actionView) {
                                  setCurrentView(notif.actionView);
                                }
                                setIsNotificationOpen(false);
                              }}
                              className="p-4 hover:bg-surface-container-low transition-colors duration-150 text-left cursor-pointer flex gap-3"
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                notif.type === 'bill' ? 'bg-amber-500/10 text-amber-500' :
                                notif.type === 'budget' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {notif.type === 'bill' ? 'receipt_long' :
                                   notif.type === 'budget' ? 'warning' :
                                   'info'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1.5 mb-0.5">
                                  <span className="font-label-md text-on-surface font-black truncate">{notif.title}</span>
                                  <span className="text-[10px] text-on-surface-variant/80 shrink-0 font-medium">{notif.date}</span>
                                </div>
                                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{notif.description}</p>
                                {notif.actionView && (
                                  <span className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-0.5 hover:underline">
                                    {isId ? 'Lihat Detail' : 'View Details'}
                                    <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="p-3 border-t border-outline-variant bg-surface-container-low text-center">
                        <button 
                          onClick={() => {
                            setCurrentView('settings');
                            setIsNotificationOpen(false);
                          }}
                          className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                        >
                          {isId ? 'Kelola Pengaturan' : 'Manage Settings'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors active:scale-95" onClick={() => setCurrentView('settings')} title={t('settings')}>
                <span className="material-symbols-outlined">settings</span>
              </button>

              <div 
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high cursor-pointer hover:border-primary transition-colors active:scale-95 ml-1 shadow-sm"
                onClick={() => setCurrentView('profile')}
              >
                <img src="https://ui-avatars.com/api/?name=Budi+Santoso&background=2563eb&color=ffffff" alt="User Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* TopNavBar Mobile */}
        <header className="bg-surface/90 backdrop-blur-md w-full top-0 sticky border-b border-outline-variant flex flex-col md:hidden z-40 shadow-sm px-4 py-2 gap-2 print:hidden">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
              <h1 className="font-headline-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Harmoni</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleLanguage}
                className="h-8 px-2.5 flex items-center gap-1 rounded-full bg-surface-container border border-outline-variant text-on-surface font-label-sm"
              >
                <span className="material-symbols-outlined text-base text-primary">translate</span>
                <span className="font-bold">{language.toUpperCase()}</span>
              </button>

              <button 
                onClick={toggleTheme}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant text-primary"
              >
                <span className="material-symbols-outlined text-sm">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
              </button>

              {/* Mobile Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant text-on-surface-variant relative active:scale-95 ${isNotificationOpen ? 'bg-surface-container-high text-primary' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">notifications</span>
                  {allNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-error rounded-full"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn max-h-[380px] flex flex-col">
                      <div className="p-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                        <h4 className="font-label-md text-on-surface font-black flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-[16px]">notifications</span>
                          {isId ? 'Notifikasi' : 'Notifications'}
                        </h4>
                        <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          {allNotifications.length}
                        </span>
                      </div>

                      <div className="overflow-y-auto divide-y divide-outline-variant/50 max-h-[280px] flex-1">
                        {allNotifications.length === 0 ? (
                          <div className="p-6 text-center text-on-surface-variant">
                            <p className="text-xs">{isId ? 'Tidak ada notifikasi baru' : 'No new notifications'}</p>
                          </div>
                        ) : (
                          allNotifications.map((notif) => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                if (notif.actionView) {
                                  setCurrentView(notif.actionView);
                                }
                                setIsNotificationOpen(false);
                              }}
                              className="p-3 hover:bg-surface-container-low transition-colors duration-150 text-left cursor-pointer flex gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-1 mb-0.5">
                                  <span className="font-label-sm text-on-surface font-bold truncate">{notif.title}</span>
                                  <span className="text-[9px] text-on-surface-variant/80 shrink-0">{notif.date}</span>
                                </div>
                                <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">{notif.description}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div 
                className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant cursor-pointer active:scale-95 transition-transform"
                onClick={() => setCurrentView('profile')}
              >
                <img src="https://ui-avatars.com/api/?name=Budi+Santoso&background=2563eb&color=ffffff" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
          <div className="w-full">
            <GlobalSearchBar setCurrentView={setCurrentView} className="w-full" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 bg-background md:bg-surface-container-low/50 overflow-y-auto pb-28 md:pb-8 flex flex-col">
          <div className="max-w-[1440px] mx-auto w-full flex-1">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="max-w-[1440px] mx-auto w-full mt-12 pt-6 border-t border-outline-variant/50 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <p className="font-body-sm text-on-surface-variant">© 2026 Harmoni Finansial. All rights reserved.</p>
            <div className="flex gap-4">
              <button onClick={() => setCurrentView('privacy-policy')} className="font-label-sm text-on-surface-variant hover:text-primary transition-colors">{t('privacyPolicy')}</button>
              <button onClick={() => setCurrentView('terms-of-service')} className="font-label-sm text-on-surface-variant hover:text-primary transition-colors">{t('termsOfService')}</button>
            </div>
          </footer>
        </main>

        {/* BottomNavBar Mobile */}
        <nav className="bg-surface/95 backdrop-blur-md md:hidden fixed bottom-0 w-full z-50 border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex justify-between items-center h-16 px-3 pb-safe print:hidden">
           <MobileNavItem icon="home" label={t('dashboard')} active={currentView === 'dashboard' && !isMobileMenuOpen} onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} />
           <MobileNavItem icon="swap_horiz" label={t('cashFlow')} active={currentView === 'cash-flow' && !isMobileMenuOpen} onClick={() => { setCurrentView('cash-flow'); setIsMobileMenuOpen(false); }} />
           
           {/* Center FAB for fast AI Transaction Input */}
           <button 
             onClick={() => {
               setIsMobileMenuOpen(false);
               openTransactionModal();
             }}
             className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center -mt-5 border-4 border-surface active:scale-90 transition-transform cursor-pointer"
             title={t('newTransaction')}
           >
             <span className="material-symbols-outlined text-[26px]">add</span>
           </button>

           <MobileNavItem icon="home_work" label={t('assetsAndGoods')} active={currentView === 'assets' && !isMobileMenuOpen} onClick={() => { setCurrentView('assets'); setIsMobileMenuOpen(false); }} />
           <MobileNavItem icon="apps" label={t('more')} active={isMobileMenuOpen || !['dashboard', 'cash-flow', 'assets'].includes(currentView)} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </nav>
      </div>

      {/* Slide-up Bottom Sheet for Mobile Navigation */}
      {isMobileMenuOpen && (
        <>
          {/* Soft backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Bottom Sheet Modal Container */}
          <div className="fixed bottom-20 left-0 right-0 bg-surface/98 backdrop-blur-md z-50 border-t border-outline-variant rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] md:hidden p-6 pb-10 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">widgets</span>
                {language === 'id' ? 'Menu Navigasi' : 'Navigation Menu'}
              </h3>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Grid layout of navigation modules */}
            <div className="grid grid-cols-3 gap-y-5 gap-x-3">
              <MenuGridItem 
                icon="dashboard" 
                label={t('dashboard')} 
                active={currentView === 'dashboard'} 
                onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="swap_horiz" 
                label={t('cashFlow')} 
                active={currentView === 'cash-flow'} 
                onClick={() => { setCurrentView('cash-flow'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="account_balance_wallet" 
                label={t('budgeting')} 
                active={currentView === 'budgeting'} 
                onClick={() => { setCurrentView('budgeting'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="home_work" 
                label={t('assetsAndGoods')} 
                active={currentView === 'assets'} 
                onClick={() => { setCurrentView('assets'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="receipt_long" 
                label={t('billsTitle')} 
                active={currentView === 'bills'} 
                onClick={() => { setCurrentView('bills'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="ads_click" 
                label={t('goals')} 
                active={currentView === 'goals'} 
                onClick={() => { setCurrentView('goals'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="assessment" 
                label={t('reports')} 
                active={currentView === 'reports'} 
                onClick={() => { handleViewNavigation('reports'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="history_edu" 
                label={isId ? 'Log Aktivitas' : 'Activity Logs'} 
                active={currentView === 'activity-logs'} 
                onClick={() => { handleViewNavigation('activity-logs'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="settings" 
                label={t('settings')} 
                active={currentView === 'settings'} 
                onClick={() => { setCurrentView('settings'); setIsMobileMenuOpen(false); }} 
              />
              <MenuGridItem 
                icon="person" 
                label={language === 'id' ? 'Profil' : 'Profile'} 
                active={currentView === 'profile'} 
                onClick={() => { setCurrentView('profile'); setIsMobileMenuOpen(false); }} 
              />
            </div>
          </div>
        </>
      )}

      <TransactionModal isOpen={isTransactionModalOpen} onClose={closeTransactionModal} />
      <TransactionDetailModal transaction={selectedDetailTransaction} isOpen={isTransactionDetailModalOpen} onClose={closeTransactionDetailModal} />
      <TransferModal isOpen={isTransferModalOpen} onClose={closeTransferModal} />
      <EnvelopeModal isOpen={isEnvelopeModalOpen} onClose={closeEnvelopeModal} editTarget={envelopeEditTarget} />
      <GoalModal isOpen={isGoalModalOpen} onClose={closeGoalModal} />
      <BillModal isOpen={isBillModalOpen} onClose={closeBillModal} />
    </div>
  );
}

function MenuGridItem({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
        active 
          ? 'bg-primary/10 border-primary text-primary font-bold' 
          : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
        active ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
      }`}>
        <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0"}}>{icon}</span>
      </div>
      <span className="font-label-sm text-[11px] text-center leading-tight line-clamp-1 w-full font-semibold">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active, onClick, isOpen }: { icon: string; label: string; active?: boolean; onClick: () => void; isOpen: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`relative flex items-center p-3 rounded-xl transition-all duration-200 active:scale-95 group overflow-hidden ${
        active 
          ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25' 
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
      title={!isOpen ? label : undefined}
    >
      <span className="material-symbols-outlined flex-shrink-0" style={{fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0", fontSize: '24px'}}>
        {icon}
      </span>
      
      <span className={`font-label-lg whitespace-nowrap transition-all duration-300 ml-3 ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-12'
      }`}>
        {label}
      </span>
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  if (active) {
    return (
      <button onClick={onClick} className="flex flex-col items-center justify-center text-on-surface-variant active:scale-95 transition-all duration-200">
        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-full px-3.5 py-1 shadow-xs">
          <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>{icon}</span>
        </div>
        <span className="font-label-sm text-[10px] mt-0.5 text-primary font-extrabold truncate max-w-[64px]">{label}</span>
      </button>
    );
  }
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200">
      <div className="flex flex-col items-center justify-center rounded-full px-3.5 py-1 hover:bg-surface-container-high transition-colors">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <span className="font-label-sm text-[10px] mt-0.5 text-center leading-tight truncate max-w-[64px]">{label}</span>
    </button>
  );
}
