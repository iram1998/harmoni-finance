import React, { useState, useEffect } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { WorkspaceSwitcher } from '../WorkspaceSwitcher';
import { formatCurrency, getAssetEffectiveValue } from '../../utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { DashboardSkeleton } from '../ui/Skeleton';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { X, Plus, ArrowLeftRight, Receipt, Sparkles } from 'lucide-react';

interface DashboardProps {
  setCurrentView?: (view: string) => void;
}

export function Dashboard({ setCurrentView }: DashboardProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [isFullTrendChartOpen, setIsFullTrendChartOpen] = useState(false);
  const [isFullCategoryChartOpen, setIsFullCategoryChartOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState<'this-month' | 'ytd' | 'all-time'>('this-month');
  const { workspace, transactions, envelopes, goals, bills, paymentAccounts, markBillPaid, openTransactionModal, openTransferModal, openEnvelopeModal, openGoalModal, openBillModal, assets, debts, user } = useFinance();
  const { language, t } = useThemeLanguage();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [workspace, dashboardPeriod]);

  const isTransferTx = (t: { category?: string }) => {
    const c = (t.category || '').toLowerCase();
    return c.includes('transfer') || c.includes('pindah') || c.includes('saldo');
  };

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const ytdStart = new Date(today.getFullYear(), 0, 1).getTime();

  const wsTransactions = transactions.filter(t => workspace === 'all' ? true : (t.workspaceId || 'keluarga') === workspace);
  
  // Filter transactions for Income & Expense summary cards based on period
  const periodTransactions = wsTransactions.filter(t => {
    if (dashboardPeriod === 'all-time') return true;
    const tTime = new Date(t.date).getTime();
    if (dashboardPeriod === 'this-month') return tTime >= currentMonthStart && tTime <= currentMonthEnd;
    if (dashboardPeriod === 'ytd') return tTime >= ytdStart && tTime <= currentMonthEnd;
    return true;
  });

  const fixedIncome = periodTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'fixed' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const variableIncome = periodTransactions.filter(t => t.type === 'income' && t.incomeCategory === 'variable' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = fixedIncome + variableIncome;
  const totalExpense = periodTransactions.filter(t => t.type === 'expense' && !isTransferTx(t)).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const currentMonthTransactions = wsTransactions.filter(t => {
    const tTime = new Date(t.date).getTime();
    return tTime >= currentMonthStart && tTime <= currentMonthEnd;
  });

  // Liquid Cash, Investment, Asset, and Debt values for Net Worth calculation
  const wsPaymentAccounts = (paymentAccounts || []).filter(acc => workspace === 'all' ? true : (acc.workspaceId || 'keluarga') === workspace);
  const totalLiquidCash = wsPaymentAccounts.filter(acc => acc.type !== 'investment').reduce((sum, acc) => sum + acc.balance, 0);
  const totalInvestmentAccounts = wsPaymentAccounts.filter(acc => acc.type === 'investment').reduce((sum, acc) => sum + acc.balance, 0);
  
  const wsAssets = (assets || []).filter(a => (workspace === 'all' ? true : (a.workspaceId || 'keluarga') === workspace) && a.status === 'owned' && !a.parentAssetId);
  const totalAssetsValue = wsAssets.reduce((sum, a) => sum + getAssetEffectiveValue(a, assets, transactions), 0);
  
  const totalInvestasiDanAset = totalInvestmentAccounts + totalAssetsValue;
  
  const wsDebts = (debts || []).filter(d => (workspace === 'all' ? true : (d.workspaceId || 'keluarga') === workspace) && d.status === 'active');
  const totalPayables = wsDebts.filter(d => d.type === 'payable').reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalReceivables = wsDebts.filter(d => d.type === 'receivable').reduce((sum, d) => sum + d.remainingAmount, 0);
  
  const netWorth = totalLiquidCash + totalInvestasiDanAset + totalReceivables - totalPayables;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Budi Santoso';

  // Calculate budget alerts across ALL envelopes in the workspace
  const allWorkspaceEnvelopes = envelopes.filter(e => workspace === 'all' ? true : (e.workspaceId || 'keluarga') === workspace);
  const budgetAlerts = allWorkspaceEnvelopes.map(env => {
    const spent = currentMonthTransactions
      .filter(t => t.category === env.category && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const ratio = env.allocatedAmount > 0 ? spent / env.allocatedAmount : 0;
    const remaining = env.allocatedAmount - spent;
    const isOver = remaining < 0;
    const isWarning = ratio >= 0.85 && !isOver; // 85% or more spent
    return {
      ...env,
      spent,
      ratio,
      remaining,
      isOver,
      isWarning
    };
  }).filter(alert => alert.isOver || alert.isWarning);

  const visibleAlerts = budgetAlerts.filter(alert => !dismissedAlerts.includes(alert.id));

  const wsEnvelopes = envelopes.filter(e => workspace === 'all' ? true : (e.workspaceId || 'keluarga') === workspace).slice(0, 3);
  const wsBills = bills.filter(b => (workspace === 'all' ? true : (b.workspaceId || 'keluarga') === workspace) && !b.isPaid).slice(0, 2);
  const wsGoals = goals.filter(g => workspace === 'all' ? true : (g.workspaceId || 'keluarga') === workspace).slice(0, 2);

  // Group expenses by category for pie chart (excluding internal transfers)
  const expenseByCategory = wsTransactions
    .filter(t => t.type === 'expense' && !isTransferTx(t))
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  let pieData: { name: string; value: number }[] = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const hasExpenses = pieData.length > 0;

  const CHART_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
  const totalSpend = wsTransactions.filter(t => t.type === 'expense' && !isTransferTx(t)).reduce((sum, item) => sum + item.amount, 0);

  // Group expenses by date for area trend chart (excluding internal transfers)
  const expenseTransactions = wsTransactions
    .filter(t => t.type === 'expense' && !isTransferTx(t))
    .sort((a, b) => a.date.localeCompare(b.date));

  const expenseByDate = expenseTransactions.reduce((acc, t) => {
    const dateObj = new Date(t.date);
    const label = isNaN(dateObj.getTime()) ? t.date : dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    acc[label] = (acc[label] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  let trendData = Object.entries(expenseByDate).map(([date, amount]) => ({
    date,
    Amount: amount,
  }));

  // Limit to last 7 data points to keep chart elegant and clean
  if (trendData.length > 7) {
    trendData = trendData.slice(-7);
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:mb-2">
          <div>
            <h2 className="font-display-md text-on-surface mb-1">
              {userName}
            </h2>
            <p className="font-body-lg text-on-surface-variant">
              {t('financialOverview')} {workspace === 'all' ? (language === 'id' ? 'Semua Workspace' : 'All Workspaces') : (workspace === 'keluarga' ? t('familyWorkspace') : t('personalWorkspace'))}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dashboardPeriod}
              onChange={(e) => setDashboardPeriod(e.target.value as any)}
              className="bg-surface border border-outline-variant px-3 py-2 rounded-xl font-bold text-on-surface focus:outline-none focus:border-primary cursor-pointer text-sm"
            >
              <option value="this-month">{language === 'id' ? 'Bulan Ini' : 'This Month'}</option>
              <option value="ytd">{language === 'id' ? 'Tahun Berjalan' : 'Year to Date'}</option>
              <option value="all-time">{language === 'id' ? 'Semua Waktu' : 'All Time'}</option>
            </select>
            <Button variant="secondary" icon="swap_horiz" onClick={openTransferModal} className="hidden md:flex">
              {t('transferFunds')}
            </Button>
            <div className="hidden md:block">
              <WorkspaceSwitcher />
            </div>
            <div className="md:hidden w-full">
              <WorkspaceSwitcher />
            </div>
          </div>
        </div>

        {/* Budget Limit Alerts Notification Banner */}
        {visibleAlerts.length > 0 && (
          <div className="animate-fadeIn p-5 rounded-2xl border flex flex-col gap-4 shadow-sm relative overflow-hidden bg-surface-container border-outline-variant">
            {/* Visual indicator (left accent line) */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${visibleAlerts.some(a => a.isOver) ? 'bg-error' : 'bg-amber-500'}`}></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${visibleAlerts.some(a => a.isOver) ? 'bg-error/10 text-error' : 'bg-amber-500/10 text-amber-600'}`}>
                  <span className="material-symbols-outlined font-bold animate-pulse">
                    {visibleAlerts.some(a => a.isOver) ? 'warning' : 'notifications_active'}
                  </span>
                </div>
                <div>
                  <h3 className="font-label-lg font-bold text-on-surface flex items-center gap-2 flex-wrap">
                    {t('budgetAlertTitle')}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${visibleAlerts.some(a => a.isOver) ? 'bg-error/10 text-error' : 'bg-amber-500/10 text-amber-600'}`}>
                      {visibleAlerts.length} {visibleAlerts.length === 1 ? 'Peringatan' : 'Peringatan'}
                    </span>
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    {visibleAlerts.some(a => a.isOver) 
                      ? (t('budgetAlertDanger') || 'Ada anggaran yang telah melebihi batas!') 
                      : (t('budgetAlertWarning') || 'Beberapa anggaran mendekati batas limit.')}
                  </p>
                </div>
              </div>
              
              {setCurrentView && (
                <button 
                  onClick={() => setCurrentView('budgeting')}
                  className="font-label-sm text-primary hover:underline flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all font-semibold self-start sm:self-center shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  {t('budgetingTitle')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-outline-variant/30">
              {visibleAlerts.map(alert => {
                const percentage = Math.round(alert.ratio * 100);
                const barColor = alert.isOver ? 'bg-error' : 'bg-amber-500';
                const statusColor = alert.isOver ? 'text-error' : 'text-amber-600';
                
                const rawTemplate = alert.isOver ? t('budgetAlertOver') : t('budgetAlertRemaining');
                const detailMsg = alert.isOver
                  ? (rawTemplate || 'Pengeluaran {category} melebihi anggaran {over}').replace('{category}', alert.category).replace('{over}', formatCurrency(alert.spent - alert.allocatedAmount))
                  : (rawTemplate || 'Anggaran {category} tersisa {remaining}').replace('{category}', alert.category).replace('{remaining}', formatCurrency(alert.remaining));

                return (
                  <div key={`alert-${alert.id}`} className="p-3.5 bg-surface border border-outline-variant/50 rounded-xl hover:bg-surface-container-high transition-colors flex flex-col justify-between relative group">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-lg ${statusColor}`}>
                          {alert.isOver ? 'gpp_maybe' : 'info'}
                        </span>
                        <span className="font-label-md font-bold text-on-surface truncate">{alert.category}</span>
                      </div>
                      
                      <button 
                        onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                        className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-outline-variant/20"
                        title={t('dismiss') || 'Sembunyikan'}
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    <div className="font-body-sm text-on-surface-variant mb-3 leading-relaxed">
                      {detailMsg}
                    </div>

                    <div className="space-y-1.5 mt-auto">
                      <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                        <span>{t('used')}: {formatCurrency(alert.spent)}</span>
                        <span>{percentage}% / 100%</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(alert.ratio * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Income, Expense & Net Cash Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card variant="default" className="p-6 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl transition-transform group-hover:scale-150 duration-700"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-label-lg text-on-surface-variant uppercase tracking-wider">{t('totalIncomeInflow') || 'Pemasukan'}</h3>
              <span className="material-symbols-outlined text-emerald-600 bg-emerald-100 p-2 rounded-full" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </div>
            <div className="font-display-md text-emerald-700 font-bold truncate relative z-10" title={formatCurrency(totalIncome)}>
              {formatCurrency(totalIncome)}
            </div>
          </Card>
          
          <Card variant="default" className="p-6 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl transition-transform group-hover:scale-150 duration-700"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-label-lg text-on-surface-variant uppercase tracking-wider">{t('totalExpenseOutflow') || 'Pengeluaran'}</h3>
              <span className="material-symbols-outlined text-rose-600 bg-rose-100 p-2 rounded-full" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
            </div>
            <div className="font-display-md text-rose-700 font-bold truncate relative z-10" title={formatCurrency(totalExpense)}>
              {formatCurrency(totalExpense)}
            </div>
          </Card>

          <Card variant="default" className={`p-6 flex flex-col justify-between overflow-hidden relative group ${balance >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-error/5 border-error/20'}`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-xl transition-transform group-hover:scale-150 duration-700 ${balance >= 0 ? 'bg-primary/10' : 'bg-error/10'}`}></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-label-lg text-on-surface-variant uppercase tracking-wider">{language === 'id' ? 'Arus Kas Bersih' : 'Net Cash Flow'}</h3>
              <span className={`material-symbols-outlined p-2 rounded-full ${balance >= 0 ? 'text-primary bg-primary/10' : 'text-error bg-error/10'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {balance >= 0 ? 'account_balance_wallet' : 'money_off'}
              </span>
            </div>
            <div className="flex flex-col relative z-10">
              <div className={`font-display-md font-bold truncate ${balance >= 0 ? 'text-primary' : 'text-error'}`} title={formatCurrency(balance)}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </div>
              <span className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${balance >= 0 ? 'text-primary' : 'text-error'}`}>
                {balance >= 0 ? (language === 'id' ? 'Surplus (Positif)' : 'Surplus') : (language === 'id' ? 'Defisit (Negatif)' : 'Deficit')}
              </span>
            </div>
          </Card>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Balance Card showing Net Worth (Cash + Assets) */}
          <Card variant="primary" className="p-6 lg:p-8 flex flex-col relative overflow-hidden shadow-lg border border-primary/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-label-md text-white/90 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    {t('netWorth')}
                  </h3>
                  <span className="font-label-sm bg-white/15 px-2.5 py-0.5 rounded-full text-white/90 font-medium">
                    {workspace === 'all' 
                      ? (language === 'id' ? 'Semua Workspace' : 'All Workspaces') 
                      : workspace === 'keluarga' 
                        ? (t('familyWorkspace') || 'Keluarga') 
                        : (t('personalWorkspace') || 'Pribadi')}
                  </span>
                </div>
                
                <div className="font-display-md lg:font-display-lg text-white mb-6 truncate font-black tracking-tight" title={formatCurrency(netWorth)}>
                  {formatCurrency(netWorth)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-auto border-t border-white/20 pt-4">
                <div>
                  <div className="font-label-sm text-white/80 uppercase mb-0.5 text-[10px] sm:text-xs truncate" title={t('cashBalance') || 'Total Saldo'}>{t('cashBalance') || 'Total Saldo'}</div>
                  <div className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight leading-snug" title={formatCurrency(totalLiquidCash)}>{formatCurrency(totalLiquidCash)}</div>
                </div>
                <div>
                  <div className="font-label-sm text-white/80 uppercase mb-0.5 text-[10px] sm:text-xs truncate" title={language === 'id' ? 'Total Investasi & Aset' : 'Total Investments & Assets'}>
                    {language === 'id' ? 'Investasi & Aset' : 'Investments & Assets'}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-tight leading-snug" title={formatCurrency(totalInvestasiDanAset)}>{formatCurrency(totalInvestasiDanAset)}</div>
                </div>
                <div>
                  <div className="font-label-sm text-white/80 uppercase mb-0.5 text-[10px] sm:text-xs truncate" title={language === 'id' ? 'Total Piutang' : 'Total Receivables'}>
                    {language === 'id' ? 'Piutang' : 'Receivables'}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-extrabold text-teal-200 tracking-tight leading-snug" title={formatCurrency(totalReceivables)}>{formatCurrency(totalReceivables)}</div>
                </div>
                <div>
                  <div className="font-label-sm text-white/80 uppercase mb-0.5 text-[10px] sm:text-xs truncate" title={language === 'id' ? 'Total Utang' : 'Total Debt'}>
                    {language === 'id' ? 'Utang' : 'Debt'}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-extrabold text-red-200 tracking-tight leading-snug" title={formatCurrency(totalPayables)}>{formatCurrency(totalPayables)}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tagihan Mendatang */}
          <Card variant="default" className="flex flex-col shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <CardTitle>{t('upcomingBills')}</CardTitle>
              <button 
                onClick={() => openBillModal()} 
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 bg-primary-container/30 px-2 py-1 rounded-md"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                {t('addBill')}
              </button>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-3 pt-4 overflow-y-auto max-h-[240px]">
              {wsBills.length > 0 ? wsBills.map((bill) => {
                const daysLeft = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isSoon = daysLeft <= 3;
                return (
                  <div key={bill.id} className="flex justify-between items-center p-3 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container transition-colors group shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSoon ? 'bg-error-container text-error' : 'bg-primary-container text-primary'}`}>
                        <span className="material-symbols-outlined">{isSoon ? 'bolt' : 'receipt_long'}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-on-surface truncate">{bill.name}</span>
                        <span className={`font-body-sm truncate ${isSoon ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                          {t('dueDate')}: {daysLeft}{language === 'id' ? ' hari lagi' : 'd left'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="font-label-lg text-on-surface font-semibold">{formatCurrency(bill.amount)}</span>
                      <button onClick={() => markBillPaid(bill.id)} className="font-label-sm text-primary hover:underline mt-1">
                        {t('payBill')}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant font-body-sm py-6">
                  {t('noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Goals */}
          <Card variant="default" className="flex flex-col shadow-sm">
            <CardHeader className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <CardTitle>{t('savingGoals')}</CardTitle>
              <button onClick={() => openGoalModal()} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 bg-primary-container/30 px-2 py-1 rounded-md">
                <span className="material-symbols-outlined text-[16px]">add</span>
                {language === 'id' ? 'Tambah Target' : 'Add Goal'}
              </button>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4 overflow-y-auto max-h-[240px]">
              {wsGoals.length > 0 ? wsGoals.map(goal => {
                const ratio = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
                return (
                  <div key={goal.id} className="p-3 bg-surface border border-outline-variant rounded-xl hover:bg-surface-container transition-colors shadow-2xs">
                    <div className="flex justify-between items-end mb-2">
                      <div className="min-w-0 pr-2">
                        <div className="font-label-lg text-on-surface truncate">{goal.name}</div>
                        <div className="font-body-sm text-on-surface-variant truncate">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</div>
                      </div>
                      <div className="font-label-lg text-primary shrink-0 font-bold">{Math.round(ratio * 100)}%</div>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">savings</span>
                  <p className="font-body-sm text-on-surface-variant">
                    {language === 'id' ? 'Belum ada target tabungan' : 'No savings goals yet'}
                  </p>
                  <button 
                    onClick={() => openGoalModal()} 
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1 bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {language === 'id' ? 'Buat Target Tabungan' : 'Create Goal'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions (Mobile Only) */}
        <div className="grid grid-cols-3 gap-3 md:hidden">
          <button onClick={() => openTransactionModal()} className="flex flex-col items-center justify-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shadow-2xs active:scale-95">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined">add_circle</span>
            </div>
            <span className="font-label-sm text-center text-on-surface">{t('logExpense')}</span>
          </button>
          <button onClick={openTransferModal} className="flex flex-col items-center justify-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shadow-2xs active:scale-95">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined">swap_horiz</span>
            </div>
            <span className="font-label-sm text-center text-on-surface">{t('transferFunds')}</span>
          </button>
          <button onClick={() => openBillModal()} className="flex flex-col items-center justify-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant hover:bg-surface-container transition-colors shadow-2xs active:scale-95">
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="font-label-sm text-center text-on-surface">{t('addBill')}</span>
          </button>
        </div>

        {/* Charts & Visual Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Trend Chart */}
          <Card variant="default" className="lg:col-span-2 p-6 flex flex-col shadow-sm">
            <CardHeader className="p-0 mb-4 flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-on-surface">{t('spendingTrend')}</CardTitle>
                <p className="font-body-sm text-on-surface-variant mt-0.5">{t('recentSpendingTrendDesc')}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasExpenses && (
                  <button
                    type="button"
                    onClick={() => setIsFullTrendChartOpen(true)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-all cursor-pointer active:scale-95"
                    title={language === 'id' ? 'Buka Layar Penuh Grafik' : 'Open Fullscreen Chart'}
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                    <span>{language === 'id' ? 'Lihat Semua' : 'Full View'}</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-on-surface-variant">trending_up</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[260px] relative flex flex-col justify-center">
              {hasExpenses ? (
                <div className="w-full overflow-x-auto">
                  <div style={{ minWidth: trendData.length > 7 ? `${trendData.length * 45}px` : '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => `Rp ${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), t('amount')]} 
                      contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Amount" 
                      stroke="#2563eb" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorSpend)" 
                    />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">show_chart</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg font-bold text-on-surface">
                      {language === 'id' ? 'Belum Ada Transaksi Pengeluaran' : 'No Expense Transactions Yet'}
                    </h4>
                    <p className="font-body-sm text-on-surface-variant mt-1 max-w-sm">
                      {language === 'id' ? 'Catat pengeluaran Anda untuk melihat visualisasi tren histori pengeluaran secara real-time.' : 'Log expenses to view your spending trend in real-time.'}
                    </p>
                  </div>
                  <button
                    onClick={() => openTransactionModal()}
                    className="mt-1 px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-2xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    {t('logExpense')}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category-based Expense Distribution Chart */}
          <Card variant="default" className="p-6 flex flex-col shadow-sm">
            <CardHeader className="p-0 mb-4 flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-on-surface">{t('spendingByCategory')}</CardTitle>
                <p className="font-body-sm text-on-surface-variant mt-0.5">{t('categoryDistributionDesc')}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasExpenses && (
                  <button
                    type="button"
                    onClick={() => setIsFullCategoryChartOpen(true)}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-all cursor-pointer active:scale-95"
                    title={language === 'id' ? 'Buka Layar Penuh Grafik' : 'Open Fullscreen Chart'}
                  >
                    <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                    <span>{language === 'id' ? 'Lihat Semua' : 'Full View'}</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-on-surface-variant">pie_chart</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col items-center justify-center relative min-h-[260px]">
              {hasExpenses ? (
                <>
                  <div className="w-full h-[180px] relative flex items-center justify-center animate-fadeIn">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)} 
                          contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.06)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-label-sm text-on-surface-variant uppercase text-[10px] tracking-wider">{t('totalSpend')}</span>
                      <span className="font-headline-sm text-on-surface font-bold mt-0.5">{formatCurrency(totalSpend)}</span>
                    </div>
                  </div>

                  {/* Custom Elegant Legend */}
                  <div className="w-full mt-4 flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1">
                    {pieData.map((item, index) => {
                      const percentage = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(0) : '';
                      return (
                        <div key={`legend-${index}`} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                            <span className="font-medium text-on-surface truncate">{item.name}</span>
                          </div>
                          <span className="font-semibold text-on-surface-variant shrink-0">
                            {percentage ? `${percentage}%` : formatCurrency(item.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center gap-3 bg-surface-container-lowest/50 rounded-xl border border-dashed border-outline-variant w-full h-full">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">donut_small</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg font-bold text-on-surface">
                      {language === 'id' ? 'Belum Ada Transaksi' : 'No Transactions Yet'}
                    </h4>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      {language === 'id' ? 'Grafik distribusi kategori akan otomatis muncul setelah pengeluaran dicatat.' : 'Category pie chart will appear once expenses are logged.'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Widget */}
        <div className="col-span-12">
          <Card variant="default" className="p-6 flex flex-col shadow-sm">
            <CardHeader className="p-0 mb-4 flex justify-between items-center border-b border-outline-variant pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-on-surface">{language === 'id' ? 'Transaksi Terakhir' : 'Recent Transactions'}</CardTitle>
                <p className="font-body-sm text-on-surface-variant mt-0.5">{language === 'id' ? '5 aktivitas arus kas terakhir Anda.' : 'Your 5 latest cash flow activities.'}</p>
              </div>
              {setCurrentView && (
                <button 
                  onClick={() => setCurrentView('cash_flow')}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
                >
                  {language === 'id' ? 'Lihat Semua' : 'View All'}
                </button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-outline-variant/40">
                {wsTransactions.length > 0 ? (
                  wsTransactions
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(tx => {
                      const isTransfer = (tx.category || '').toLowerCase().includes('transfer') || (tx.category || '').toLowerCase().includes('pindah') || (tx.category || '').toLowerCase().includes('saldo');
                      const iconBg = isTransfer ? 'bg-blue-100 text-blue-700' : tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                      const icon = isTransfer ? 'sync_alt' : tx.type === 'income' ? 'payments' : 'shopping_cart';
                      const sign = isTransfer ? '' : tx.type === 'income' ? '+' : '-';
                      const color = isTransfer ? 'text-on-surface' : tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600';
                      
                      return (
                        <div key={tx.id} className="flex items-center justify-between py-3 hover:bg-surface-container-lowest transition-colors px-2 rounded-lg cursor-default">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                              <span className="material-symbols-outlined text-[20px]">{icon}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-md text-on-surface font-bold truncate">
                                {tx.merchantName || tx.category}
                              </span>
                              <span className="font-body-sm text-on-surface-variant truncate text-[11px] mt-0.5">
                                {new Date(tx.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • {tx.category}
                              </span>
                            </div>
                          </div>
                          <div className={`font-label-lg font-bold shrink-0 ml-2 ${color}`}>
                            {sign}{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-8 text-center text-on-surface-variant font-body-sm bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
                    {language === 'id' ? 'Belum ada transaksi tercatat.' : 'No recent transactions logged.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Envelope Budgeting */}
        <div className="col-span-12 bg-surface border border-outline-variant rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-outline-variant pb-4">
              <div>
                <h3 className="font-headline-sm text-on-surface">{t('budgetEnvelopes')}</h3>
                <p className="font-body-sm text-on-surface-variant mt-0.5 hidden md:block">{t('budgetingSubtitle')}</p>
              </div>
              <Button variant="secondary" size="sm" icon="add" onClick={() => openEnvelopeModal()}>
                {t('addEnvelope')}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {wsEnvelopes.length > 0 ? (
                wsEnvelopes.map((env, i) => {
                  const spent = currentMonthTransactions.filter(t => t.category === env.category && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
                  const ratio = env.allocatedAmount > 0 ? spent / env.allocatedAmount : 0;
                  const remaining = env.allocatedAmount - spent;
                  const isOver = remaining < 0;
                  const isWarning = ratio >= 0.85 && !isOver;

                  let barColor = 'bg-primary';
                  let remainingColor = 'text-on-surface';
                  if (isOver) {
                    barColor = 'bg-error';
                    remainingColor = 'text-error font-bold';
                  } else if (isWarning) {
                    barColor = 'bg-amber-500';
                    remainingColor = 'text-amber-600 font-semibold';
                  }

                   return (
                    <Card key={env.id} variant="default" className={`flex flex-col gap-3 p-4 md:p-5 border bg-surface-container-lowest shadow-2xs transition-all relative overflow-hidden ${isOver ? 'border-error/30' : isWarning ? 'border-amber-500/30' : 'border-outline-variant'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${isOver ? 'bg-error-container text-error' : isWarning ? 'bg-amber-500/10 text-amber-600' : 'bg-primary-container text-on-primary-container'}`}>
                           <span className="material-symbols-outlined">
                             {isOver ? 'warning' : isWarning ? 'gpp_maybe' : (i === 0 ? 'shopping_cart' : i === 1 ? 'payments' : 'school')}
                           </span>
                        </div>
                        <div className="min-w-0 flex-1 pr-8">
                          <div className="font-label-lg text-on-surface truncate">{env.category}</div>
                          <div className="font-body-sm text-on-surface-variant truncate">{t('allocated')}: {formatCurrency(env.allocatedAmount)}</div>
                        </div>
                      </div>
                      
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => openTransactionModal(env.category)}
                          className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary border border-outline-variant text-on-surface flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                          title={language === 'id' ? 'Catat Pengeluaran' : 'Log Expense'}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-baseline pt-2">
                        <span className="font-body-sm text-on-surface-variant">{t('remaining')}</span>
                        <span className={`font-headline-sm ${remainingColor}`}>
                          {formatCurrency(remaining)}
                        </span>
                      </div>

                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center p-6 gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                  </div>
                  <div className="max-w-md">
                    <p className="font-label-lg font-bold text-on-surface">
                      {language === 'id' ? 'Belum Ada Pos Anggaran' : 'No Budget Envelopes Set'}
                    </p>
                    <p className="font-body-sm text-on-surface-variant mt-1">
                      {language === 'id' 
                        ? 'Buat pos anggaran untuk mengontrol alokasi pengeluaran bulanan Anda secara disiplin.' 
                        : 'Create budget envelopes to control your monthly spending allocation.'}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" icon="add" onClick={() => openEnvelopeModal()} className="mt-1">
                    {t('addEnvelope')}
                  </Button>
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Fullscreen Spending Trend Chart Modal */}
      {isFullTrendChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="w-full h-full flex flex-col bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-w-6xl mx-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
                <h3 className="font-headline-sm text-on-surface font-extrabold text-lg sm:text-xl">
                  {language === 'id' ? 'Tren Pengeluaran Histori (Layar Penuh)' : 'Spending Trend History (Full View)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFullTrendChartOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-x-auto overflow-y-auto min-h-[400px]">
              <div style={{ minWidth: trendData.length > 10 ? `${trendData.length * 60}px` : '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorSpendFull" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => `Rp ${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), t('amount')]} 
                      contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}
                      labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Amount" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorSpendFull)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsFullTrendChartOpen(false)} className="px-6 font-bold cursor-pointer">
                {language === 'id' ? 'Tutup Fullscreen' : 'Close Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Category Expense Chart Modal */}
      {isFullCategoryChartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in overflow-hidden">
          <div className="w-full h-full flex flex-col bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden max-w-5xl mx-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">pie_chart</span>
                <h3 className="font-headline-sm text-on-surface font-extrabold text-lg sm:text-xl">
                  {language === 'id' ? 'Distribusi Pengeluaran Kategori (Layar Penuh)' : 'Spending by Category (Full View)'}
                </h3>
              </div>
              <button
                onClick={() => setIsFullCategoryChartOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-8 overflow-y-auto">
              <div className="w-full md:w-1/2 h-[320px] sm:h-[420px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={85}
                      outerRadius={140}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-label-sm text-on-surface-variant uppercase text-xs tracking-wider">{t('totalSpend')}</span>
                  <span className="font-headline-md text-on-surface font-extrabold mt-0.5">{formatCurrency(totalSpend)}</span>
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-3 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/60 max-h-[420px] overflow-y-auto">
                <h4 className="font-bold text-on-surface text-base mb-3 pb-2 border-b border-outline-variant/60">
                  {language === 'id' ? 'Rincian Kategori Pengeluaran' : 'Category Spending Breakdown'}
                </h4>
                {pieData.map((item, index) => {
                  const percentage = totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant/40">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="font-bold text-on-surface text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-on-surface text-sm">{formatCurrency(item.value)}</div>
                        <div className="text-xs text-on-surface-variant font-medium">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsFullCategoryChartOpen(false)} className="px-6 font-bold cursor-pointer">
                {language === 'id' ? 'Tutup Fullscreen' : 'Close Fullscreen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Speed Dial - Bottom Right */}
      {isFabOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-35 animate-in fade-in duration-200" 
          onClick={() => setIsFabOpen(false)} 
        />
      )}

      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end gap-3">
        {/* Speed Dial Options Menu */}
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in slide-in-from-bottom-5 fade-in duration-200">
            
            {/* Action 1: Catat Transaksi (Pemasukan / Pengeluaran) */}
            <div className="flex items-center gap-2.5 group">
              <span className="px-3 py-1.5 bg-surface text-on-surface font-semibold text-xs rounded-xl shadow-lg border border-outline-variant/80 whitespace-nowrap animate-in fade-in duration-150">
                {language === 'id' ? 'Catat Transaksi (Pemasukan / Pengeluaran)' : 'Add Transaction (Income / Expense)'}
              </span>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  openTransactionModal();
                }}
                className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-xl hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/20"
                title={language === 'id' ? 'Tambah Transaksi' : 'Add Transaction'}
              >
                <Receipt className="w-5 h-5" />
              </button>
            </div>

            {/* Action 2: Transfer Antar Rekening */}
            <div className="flex items-center gap-2.5 group">
              <span className="px-3 py-1.5 bg-surface text-on-surface font-semibold text-xs rounded-xl shadow-lg border border-outline-variant/80 whitespace-nowrap animate-in fade-in duration-150">
                {language === 'id' ? 'Transfer Antar Rekening' : 'Inter-Account Transfer'}
              </span>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  openTransferModal();
                }}
                className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-outline-variant/60"
                title={language === 'id' ? 'Transfer Saldo' : 'Transfer Funds'}
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            </div>

            {/* Action 3: Scan Struk AI Gemini */}
            <div className="flex items-center gap-2.5 group">
              <span className="px-3 py-1.5 bg-surface text-on-surface font-semibold text-xs rounded-xl shadow-lg border border-outline-variant/80 whitespace-nowrap animate-in fade-in duration-150">
                {language === 'id' ? 'Scan Struk AI Gemini' : 'Gemini AI Receipt Scan'}
              </span>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  openTransactionModal();
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/20"
                title={language === 'id' ? 'Scan Struk AI' : 'Scan Receipt AI'}
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

          </div>
        )}

        {/* Main Trigger FAB Button */}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-on-primary shadow-2xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white/30 ${
            isFabOpen ? 'bg-error text-on-error ring-4 ring-error/20' : 'hover:ring-4 hover:ring-primary/20'
          }`}
          aria-label={language === 'id' ? 'Akses Cepat Transaksi' : 'Quick Transaction Access'}
          title={language === 'id' ? 'Akses Cepat Transaksi' : 'Quick Transaction Access'}
        >
          <Plus className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`} />
        </button>
      </div>
    </>
  );
}
