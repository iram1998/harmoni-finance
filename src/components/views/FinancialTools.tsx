import React, { useState, useMemo } from 'react';
import { useFinance } from '../../store';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';

interface FinancialToolsProps {
  setCurrentView?: (view: string) => void;
}

export function FinancialTools({ setCurrentView }: FinancialToolsProps) {
  const { workspace, accounts, transactions, assets, openGoalModal } = useFinance();
  const { language } = useThemeLanguage();
  const { showToast } = useToast();
  const isId = language === 'id';

  // Active Tool Tab: 'emergency' | 'zakat' | 'dti' | 'pension' | 'education'
  const [activeTab, setActiveTab] = useState<'emergency' | 'zakat' | 'dti' | 'pension' | 'education'>('emergency');

  // --- 1. EMERGENCY FUND STATE ---
  // Calculate average monthly expense automatically from transactions
  const defaultMonthlyExpense = useMemo(() => {
    const wsExpenses = (transactions || []).filter(t => t.workspaceId === workspace && t.type === 'expense');
    if (wsExpenses.length === 0) return 5000000;
    const totalSpent = wsExpenses.reduce((sum, t) => sum + t.amount, 0);
    // Rough estimate based on average or min 3jt
    return Math.max(3000000, Math.round((totalSpent / Math.max(1, Math.min(3, wsExpenses.length / 5))) / 100000) * 100000);
  }, [transactions, workspace]);

  const [monthlyExpense, setMonthlyExpense] = useState<number>(defaultMonthlyExpense);
  const [dependents, setDependents] = useState<number>(1); // 0: Single, 1: Menikah (0 anak), 2: Menikah + 1-2 anak, 3: Menikah + 3+ anak
  const [jobType, setJobType] = useState<'fixed' | 'freelance'>('fixed');

  // Liquid Cash Balance from active accounts
  const totalLiquidCash = useMemo(() => {
    return (accounts || [])
      .filter(a => a.workspaceId === workspace)
      .reduce((sum, a) => sum + a.balance, 0);
  }, [accounts, workspace]);

  // Target Months calculation
  const recommendedMonths = useMemo(() => {
    let months = 3;
    if (dependents === 1) months = 6;
    else if (dependents === 2) months = 9;
    else if (dependents === 3) months = 12;

    if (jobType === 'freelance') months += 3;
    return months;
  }, [dependents, jobType]);

  const targetEmergencyFund = monthlyExpense * recommendedMonths;
  const emergencyFundGap = Math.max(0, targetEmergencyFund - totalLiquidCash);
  const emergencyCoveragePercent = targetEmergencyFund > 0 ? Math.min(100, Math.round((totalLiquidCash / targetEmergencyFund) * 100)) : 100;

  // --- 2. ZAKAT CALCULATOR STATE ---
  const [zakatMode, setZakatMode] = useState<'mal' | 'income'>('mal');
  const [goldPricePerGram, setGoldPricePerGram] = useState<number>(1400000); // Rp 1.400.000 / gram preset
  const nisabGoldGrams = 85;
  const nisabThresholdAnnual = nisabGoldGrams * goldPricePerGram; // ~ Rp 119.000.000
  const nisabThresholdMonthly = Math.round(nisabThresholdAnnual / 12); // ~ Rp 9.916.000 / bln

  // Zakat Mal custom add-ons
  const [customInvestments, setCustomInvestments] = useState<number>(0);
  const [shortTermDebts, setShortTermDebts] = useState<number>(0);

  // Zakat Income custom
  const [monthlyGrossIncome, setMonthlyGrossIncome] = useState<number>(10000000);
  const [monthlySideIncome, setMonthlySideIncome] = useState<number>(0);

  // Total Assets eligible for Zakat Mal
  const totalGoldValuation = useMemo(() => {
    return (assets || [])
      .filter(a => a.workspaceId === workspace && (a.category.toLowerCase().includes('emas') || a.category.toLowerCase().includes('gold') || a.category.toLowerCase().includes('investasi')))
      .reduce((sum, a) => sum + (a.currentValue || a.purchasePrice || 0), 0);
  }, [assets, workspace]);

  const zakatMalTotalAssets = totalLiquidCash + totalGoldValuation + customInvestments - shortTermDebts;
  const isZakatMalEligible = zakatMalTotalAssets >= nisabThresholdAnnual;
  const zakatMalAmount = isZakatMalEligible ? Math.round(zakatMalTotalAssets * 0.025) : 0;

  const totalMonthlyIncome = monthlyGrossIncome + monthlySideIncome;
  const isZakatIncomeEligible = totalMonthlyIncome >= nisabThresholdMonthly;
  const zakatIncomeAmount = isZakatIncomeEligible ? Math.round(totalMonthlyIncome * 0.025) : 0;

  // --- 3. DTI & MORTGAGE (KPR) STATE ---
  const [dtiIncome, setDtiIncome] = useState<number>(15000000);
  const [existingMonthlyDebts, setExistingMonthlyDebts] = useState<number>(2000000);
  const [loanPlafond, setLoanPlafond] = useState<number>(400000000); // 400 jt
  const [interestRate, setInterestRate] = useState<number>(7.5); // 7.5% per annum
  const [tenureYears, setTenureYears] = useState<number>(15); // 15 thn

  // Monthly mortgage calculation (Annuity formula)
  const estimatedNewMortgage = useMemo(() => {
    if (loanPlafond <= 0 || tenureYears <= 0) return 0;
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = tenureYears * 12;
    if (monthlyRate === 0) return Math.round(loanPlafond / totalMonths);
    const emi = (loanPlafond * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(emi);
  }, [loanPlafond, interestRate, tenureYears]);

  const totalNewMonthlyObligations = existingMonthlyDebts + estimatedNewMortgage;
  const dtiRatio = dtiIncome > 0 ? Math.round((totalNewMonthlyObligations / dtiIncome) * 100) : 0;
  const maxSafeMonthlyDebt = Math.round(dtiIncome * 0.30); // 30% rule
  const remainingDebtCapacity = Math.max(0, maxSafeMonthlyDebt - existingMonthlyDebts);

  // --- 4. FIRE & RETIREMENT PLANNER ---
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(55);
  const [desiredMonthlyRetirement, setDesiredMonthlyRetirement] = useState<number>(10000000);
  const [pensionInflation, setPensionInflation] = useState<number>(3.5);
  const [investmentReturn, setInvestmentReturn] = useState<number>(8.0);

  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  
  // Future monthly expense adjusting for inflation: FV = PV * (1 + i)^n
  const futureMonthlyExpense = useMemo(() => {
    return Math.round(desiredMonthlyRetirement * Math.pow(1 + (pensionInflation / 100), yearsToRetirement));
  }, [desiredMonthlyRetirement, pensionInflation, yearsToRetirement]);

  // Target pension fund using 4% Rule (Trinity Study 25x annual expense)
  const targetPensionFund = futureMonthlyExpense * 12 * 25;

  // Monthly investment required starting today
  const requiredMonthlyInvestment = useMemo(() => {
    const monthlyRate = (investmentReturn / 100) / 12;
    const totalMonths = yearsToRetirement * 12;
    if (monthlyRate === 0) return Math.round(targetPensionFund / totalMonths);
    // FV = PMT * [((1 + r)^n - 1) / r]
    const pmt = (targetPensionFund * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    return Math.round(pmt);
  }, [targetPensionFund, investmentReturn, yearsToRetirement]);

  // --- 5. EDUCATION & INFLATION SIMULATOR ---
  const [eduCostToday, setEduCostToday] = useState<number>(100000000); // 100 jt
  const [yearsUntilEdu, setYearsUntilEdu] = useState<number>(12); // 12 tahun lagi
  const [eduInflationRate, setEduInflationRate] = useState<number>(8.0); // 8% per tahun

  const eduFutureCost = useMemo(() => {
    return Math.round(eduCostToday * Math.pow(1 + (eduInflationRate / 100), yearsUntilEdu));
  }, [eduCostToday, eduInflationRate, yearsUntilEdu]);

  const eduMonthlySaving = useMemo(() => {
    const totalMonths = yearsUntilEdu * 12;
    if (totalMonths <= 0) return eduFutureCost;
    return Math.round(eduFutureCost / totalMonths);
  }, [eduFutureCost, yearsUntilEdu]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md border border-blue-400/30">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              {isId ? 'Lab Keuangan & Simulasi Interaktif' : 'Interactive Financial Lab & Tools'}
            </div>
            <h1 className="font-headline-lg font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
              {isId ? 'Kalkulator & Simulator Keputusan Finansial' : 'Financial Calculators & Decision Simulators'}
            </h1>
            <p className="text-slate-300 font-body-md text-sm sm:text-base mt-2 leading-relaxed">
              {isId 
                ? 'Gunakan modul simulasi interaktif ini untuk menguji kesehatan dana darurat, menghitung zakat mal & profesi, menguji rasio utang KPR, hingga merencanakan dana pensiun dan pendidikan anak secara realistis.'
                : 'Use these interactive simulation modules to test emergency funds, calculate zakat, verify DTI debt ratios, and plan retirement & education funds.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium">{isId ? 'Saldo Kas Likuid Anda' : 'Your Liquid Cash'}</div>
              <div className="text-lg font-bold text-white">
                Rp {totalLiquidCash.toLocaleString(isId ? 'id-ID' : 'en-US')}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-white/10 scrollbar-none">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'emergency'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
            {isId ? 'Dana Darurat' : 'Emergency Fund'}
          </button>

          <button
            onClick={() => setActiveTab('zakat')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'zakat'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
            {isId ? 'Zakat & Sedekah' : 'Zakat Calculator'}
          </button>

          <button
            onClick={() => setActiveTab('dti')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dti'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-105'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">credit_score</span>
            {isId ? 'Rasio Utang & KPR' : 'Debt & Mortgage (DTI)'}
          </button>

          <button
            onClick={() => setActiveTab('pension')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pension'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">beach_access</span>
            {isId ? 'Dana Pensiun (FIRE)' : 'FIRE & Retirement'}
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'education'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            {isId ? 'Inflasi Pendidikan' : 'Education Inflation'}
          </button>
        </div>
      </section>

      {/* TAB 1: EMERGENCY FUND CALCULATOR */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">health_and_safety</span>
              </div>
              <div>
                <h3 className="font-headline-sm font-extrabold text-on-surface text-lg">
                  {isId ? 'Kalkulator Kecukupan Dana Darurat' : 'Emergency Fund Assessment'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isId ? 'Atur profil keluarga dan pengeluaran bulanan untuk menghitung bantalan aman.' : 'Adjust family profile and monthly expenses to calculate safety buffer.'}
                </p>
              </div>
            </div>

            {/* Input 1: Monthly Expense */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {isId ? 'Pengeluaran Bulanan Rutin' : 'Monthly Routine Expense'}
                </label>
                <span className="text-sm font-extrabold text-primary">
                  Rp {monthlyExpense.toLocaleString(isId ? 'id-ID' : 'en-US')}
                </span>
              </div>
              <input 
                type="range"
                min={1000000}
                max={50000000}
                step={500000}
                value={monthlyExpense}
                onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>Rp 1.000.000</span>
                <span>Rp 25.000.000</span>
                <span>Rp 50.000.000</span>
              </div>
            </div>

            {/* Input 2: Dependents */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {isId ? 'Status Pernikahan & Tanggungan' : 'Marital & Dependents Status'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 0, label: isId ? 'Single (0)' : 'Single', months: 3 },
                  { id: 1, label: isId ? 'Menikah (0)' : 'Married (0)', months: 6 },
                  { id: 2, label: isId ? 'Menikah (1-2)' : 'Married (1-2)', months: 9 },
                  { id: 3, label: isId ? 'Menikah (3+)' : 'Married (3+)', months: 12 },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDependents(item.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      dependents === item.id 
                        ? 'border-primary bg-primary/10 text-primary shadow-sm' 
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-on-surface-variant opacity-80">
                      {item.months} {isId ? 'Bulan' : 'Months'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input 3: Job Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {isId ? 'Stabilitas Pekerjaan / Penghasilan' : 'Job / Income Stability'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJobType('fixed')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    jobType === 'fixed'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                  <span>{isId ? 'Karyawan Tetap' : 'Fixed Employee'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setJobType('freelance')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    jobType === 'freelance'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">work_history</span>
                  <span>{isId ? 'Freelance / Bisnis (+3 Bln)' : 'Freelance / Business (+3 Mo)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-surface-container-low to-surface-container border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <h4 className="font-headline-xs font-extrabold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">analytics</span>
              {isId ? 'Hasil Analisis Dana Darurat' : 'Emergency Fund Assessment'}
            </h4>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-medium">
                <span>{isId ? 'Rekomendasi Ideal' : 'Recommended Buffer'}</span>
                <span className="font-extrabold text-primary">{recommendedMonths} {isId ? 'Bulan Pengeluaran' : 'Months Expense'}</span>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-on-surface">
                Rp {targetEmergencyFund.toLocaleString(isId ? 'id-ID' : 'en-US')}
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface-variant">{isId ? 'Cakupan Kas Saat Ini' : 'Current Cash Coverage'}</span>
                  <span className={emergencyCoveragePercent >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-extrabold'}>
                    {emergencyCoveragePercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden p-0.5 border border-outline-variant">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      emergencyCoveragePercent >= 100 ? 'bg-emerald-500' : emergencyCoveragePercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${emergencyCoveragePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">{isId ? 'Saldo Kas Likuid Anda:' : 'Your Liquid Cash:'}</span>
                <span className="font-bold text-on-surface">Rp {totalLiquidCash.toLocaleString(isId ? 'id-ID' : 'en-US')}</span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-outline-variant">
                <span className="text-on-surface-variant">{isId ? 'Kekurangan Dana (Gap):' : 'Remaining Gap:'}</span>
                <span className={`font-extrabold ${emergencyFundGap > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {emergencyFundGap > 0 ? `Rp ${emergencyFundGap.toLocaleString(isId ? 'id-ID' : 'en-US')}` : (isId ? 'Sangat Aman! 🎉' : 'Fully Covered! 🎉')}
                </span>
              </div>
            </div>

            {emergencyFundGap > 0 && (
              <Button
                variant="primary"
                icon="add_task"
                onClick={() => {
                  openGoalModal();
                  showToast(
                    isId ? 'Membuka modal Tambah Target Tabungan untuk Dana Darurat.' : 'Opening Savings Goal modal for Emergency Fund.',
                    'info',
                    isId ? 'Buat Target' : 'Create Goal'
                  );
                }}
                className="w-full py-3.5 rounded-2xl shadow-md"
              >
                {isId ? 'Buat Target Tabungan Dana Darurat' : 'Create Emergency Savings Goal'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ZAKAT CALCULATOR */}
      {activeTab === 'zakat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                </div>
                <div>
                  <h3 className="font-headline-sm font-extrabold text-on-surface text-lg">
                    {isId ? 'Kalkulator Zakat Mal & Penghasilan' : 'Zakat Calculator'}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {isId ? 'Perhitungan zakat berdasarkan acuan Nisab 85 Gram Emas.' : 'Calculate zakat based on 85g Gold Nisab threshold.'}
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-surface-container-high p-1 rounded-2xl border border-outline-variant">
                <button
                  type="button"
                  onClick={() => setZakatMode('mal')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zakatMode === 'mal' ? 'bg-emerald-600 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isId ? 'Zakat Mal' : 'Wealth Zakat'}
                </button>
                <button
                  type="button"
                  onClick={() => setZakatMode('income')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    zakatMode === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isId ? 'Zakat Profesi' : 'Income Zakat'}
                </button>
              </div>
            </div>

            {/* Gold Benchmark Price */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {isId ? 'Acuan Harga Emas per Gram' : 'Gold Benchmark Price / Gram'}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Nisab = 85g = Rp {nisabThresholdAnnual.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'tahun' : 'yr'} (Rp {nisabThresholdMonthly.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'bln' : 'mo'})
                </div>
              </div>
              <input 
                type="number"
                value={goldPricePerGram}
                onChange={(e) => setGoldPricePerGram(Number(e.target.value) || 0)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-32 bg-surface border border-outline-variant rounded-xl px-3 py-1.5 text-xs text-right font-extrabold text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {zakatMode === 'mal' ? (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-on-surface-variant font-medium">{isId ? 'Total Kas & Emas Terdaftar di App' : 'Total App Cash & Gold Assets'}</div>
                    <div className="text-sm font-bold text-on-surface mt-0.5">
                      Rp {(totalLiquidCash + totalGoldValuation).toLocaleString(isId ? 'id-ID' : 'en-US')}
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full">
                    {isId ? 'Otomatis' : 'Auto'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {isId ? 'Investasi & Tabungan Tambahan Lainnya' : 'Other Investments & Savings'}
                  </label>
                  <input 
                    type="number"
                    value={customInvestments || ''}
                    placeholder="0"
                    onChange={(e) => setCustomInvestments(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {isId ? 'Utang Jatuh Tempo (Pengurang Harta)' : 'Short-term Debts Due (Deductions)'}
                  </label>
                  <input 
                    type="number"
                    value={shortTermDebts || ''}
                    placeholder="0"
                    onChange={(e) => setShortTermDebts(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {isId ? 'Penghasilan Rutin Bulanan' : 'Monthly Gross Salary / Income'}
                  </label>
                  <input 
                    type="number"
                    value={monthlyGrossIncome || ''}
                    onChange={(e) => setMonthlyGrossIncome(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">
                    {isId ? 'Penghasilan Sampingan / Bonus Bulanan' : 'Side Income / Monthly Bonus'}
                  </label>
                  <input 
                    type="number"
                    value={monthlySideIncome || ''}
                    onChange={(e) => setMonthlySideIncome(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Zakat Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-emerald-950/20 to-surface-container border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <h4 className="font-headline-xs font-extrabold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">verified</span>
              {isId ? 'Hasil Perhitungan Zakat' : 'Zakat Calculation Summary'}
            </h4>

            {zakatMode === 'mal' ? (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-2">
                  <div className="text-xs text-on-surface-variant">{isId ? 'Total Harta Bersih Terhitung:' : 'Calculated Net Wealth:'}</div>
                  <div className="text-2xl font-black text-on-surface">
                    Rp {zakatMalTotalAssets.toLocaleString(isId ? 'id-ID' : 'en-US')}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Nisab Minimal: Rp {nisabThresholdAnnual.toLocaleString(isId ? 'id-ID' : 'en-US')}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isZakatMalEligible 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                }`}>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider">{isId ? 'Kewajiban Zakat Mal (2.5%)' : 'Wealth Zakat Due (2.5%)'}</div>
                    <div className="text-xl font-black mt-1">
                      {isZakatMalEligible ? `Rp ${zakatMalAmount.toLocaleString(isId ? 'id-ID' : 'en-US')}` : (isId ? 'Belum Wajib Zakat' : 'Below Nisab Threshold')}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-3xl">
                    {isZakatMalEligible ? 'check_circle' : 'info'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-2">
                  <div className="text-xs text-on-surface-variant">{isId ? 'Total Income Bulanan:' : 'Total Monthly Income:'}</div>
                  <div className="text-2xl font-black text-on-surface">
                    Rp {totalMonthlyIncome.toLocaleString(isId ? 'id-ID' : 'en-US')}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">
                    Nisab Bulanan: Rp {nisabThresholdMonthly.toLocaleString(isId ? 'id-ID' : 'en-US')}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isZakatIncomeEligible 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                }`}>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider">{isId ? 'Zakat Profesi Per Bulan (2.5%)' : 'Monthly Income Zakat (2.5%)'}</div>
                    <div className="text-xl font-black mt-1">
                      {isZakatIncomeEligible ? `Rp ${zakatIncomeAmount.toLocaleString(isId ? 'id-ID' : 'en-US')}` : (isId ? 'Belum Wajib Zakat' : 'Below Monthly Nisab')}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-3xl">
                    {isZakatIncomeEligible ? 'check_circle' : 'info'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DTI & MORTGAGE SIMULATOR */}
      {activeTab === 'dti' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">credit_score</span>
              </div>
              <div>
                <h3 className="font-headline-sm font-extrabold text-on-surface text-lg">
                  {isId ? 'Uji Kelayakan KPR & Rasio Utang (DTI)' : 'Debt-to-Income & Mortgage Simulator'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isId ? 'Pastikan total cicilan Anda tidak melebihi 30% dari penghasilan bersih.' : 'Ensure your total monthly debt does not exceed 30% of net income.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Penghasilan Bersih Bulanan' : 'Monthly Net Income'}</label>
                <input 
                  type="number"
                  value={dtiIncome}
                  onChange={(e) => setDtiIncome(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Cicilan Rutin Existing' : 'Existing Monthly Debts'}</label>
                <input 
                  type="number"
                  value={existingMonthlyDebts}
                  onChange={(e) => setExistingMonthlyDebts(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="border-t border-outline-variant pt-4 flex flex-col gap-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {isId ? 'Simulasi Pinjaman Baru (KPR / Kendaraan)' : 'New Loan Simulation (Mortgage / Auto)'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Plafond Pinjaman' : 'Loan Amount'}</label>
                  <input 
                    type="number"
                    value={loanPlafond}
                    onChange={(e) => setLoanPlafond(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Bunga per Tahun (%)' : 'Interest Rate (%)'}</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Tenor (Tahun)' : 'Tenure (Years)'}</label>
                  <input 
                    type="number"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value) || 0)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DTI Result */}
          <div className="lg:col-span-5 bg-gradient-to-b from-amber-950/20 to-surface-container border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <h4 className="font-headline-xs font-extrabold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px]">speed</span>
              {isId ? 'Analisis Rasio Beban Utang (DTI)' : 'Debt-to-Income Analysis'}
            </h4>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-on-surface-variant">
                <span>{isId ? 'Estimasi Cicilan Baru:' : 'New Loan Payment:'}</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Rp {estimatedNewMortgage.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'bln' : 'mo'}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant">
                <span>{isId ? 'Total Cicilan Bulanan:' : 'Total Monthly Debts:'}</span>
                <span className="font-black text-on-surface text-base">Rp {totalNewMonthlyObligations.toLocaleString(isId ? 'id-ID' : 'en-US')}</span>
              </div>

              {/* DTI Gauge */}
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Rasio DTI</span>
                  <span className={dtiRatio <= 30 ? 'text-emerald-600 font-black' : dtiRatio <= 40 ? 'text-amber-600 font-black' : 'text-rose-600 font-black'}>
                    {dtiRatio}% {dtiRatio <= 30 ? ' (Sangat Aman)' : dtiRatio <= 40 ? ' (Waspada)' : ' (Risiko Tinggi)'}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-surface-container-highest rounded-full overflow-hidden p-0.5 border border-outline-variant">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      dtiRatio <= 30 ? 'bg-emerald-500' : dtiRatio <= 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, dtiRatio)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{isId ? 'Batas Cicilan Aman (30%):' : 'Max Safe Limit (30%):'}</span>
                <span className="font-bold text-on-surface">Rp {maxSafeMonthlyDebt.toLocaleString(isId ? 'id-ID' : 'en-US')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">{isId ? 'Sisa Kapasitas Cicilan:' : 'Remaining Capacity:'}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Rp {remainingDebtCapacity.toLocaleString(isId ? 'id-ID' : 'en-US')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FIRE & RETIREMENT PLANNER */}
      {activeTab === 'pension' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">beach_access</span>
              </div>
              <div>
                <h3 className="font-headline-sm font-extrabold text-on-surface text-lg">
                  {isId ? 'Kalkulator Dana Pensiun Mandiri (FIRE)' : 'Retirement & FIRE Planner'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isId ? 'Proyeksi nilai dana pensiun ideal berdasarkan Aturan 4% (Trinity Study).' : 'Project ideal pension fund using the 4% Rule (Trinity Study).' }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Usia Anda Sekarang' : 'Current Age'}</label>
                <input 
                  type="number"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Target Usia Pensiun' : 'Target Retirement Age'}</label>
                <input 
                  type="number"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">
                {isId ? 'Target Gaya Hidup / Pengeluaran Bulanan di Masa Pensiun (Nilai Hari Ini)' : 'Desired Monthly Lifestyle Cost (Today\'s Value)'}
              </label>
              <input 
                type="number"
                value={desiredMonthlyRetirement}
                onChange={(e) => setDesiredMonthlyRetirement(Number(e.target.value) || 0)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Ekspektasi Inflasi (%)' : 'Inflation Rate (%)'}</label>
                <input 
                  type="number"
                  step="0.1"
                  value={pensionInflation}
                  onChange={(e) => setPensionInflation(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Return Investasi Tahunan (%)' : 'Annual Investment Return (%)'}</label>
                <input 
                  type="number"
                  step="0.1"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Pension Results */}
          <div className="lg:col-span-5 bg-gradient-to-b from-purple-950/20 to-surface-container border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <h4 className="font-headline-xs font-extrabold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[22px]">savings</span>
              {isId ? 'Target Dana Pensiun Mandiri' : 'Retirement Target Summary'}
            </h4>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-xs text-on-surface-variant">{isId ? 'Pengeluaran Mendidih (Sesuai Inflasi) usia ' + retirementAge + ':' : 'Adjusted Future Expense at age ' + retirementAge + ':'}</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                Rp {futureMonthlyExpense.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'bln' : 'mo'}
              </div>

              <div className="pt-3 border-t border-outline-variant">
                <div className="text-xs text-on-surface-variant font-medium">{isId ? 'Total Dana Pensiun yang Harus Terkumpul:' : 'Total Retirement Nest Egg Required:'}</div>
                <div className="text-2xl font-black text-on-surface mt-1">
                  Rp {targetPensionFund.toLocaleString(isId ? 'id-ID' : 'en-US')}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs font-extrabold text-purple-800 dark:text-purple-300">{isId ? 'Investasi Bulanan Mulai Hari Ini' : 'Monthly Investment Required Today'}</div>
                <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  Rp {requiredMonthlyInvestment.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'bln' : 'mo'}
                </div>
              </div>
              <span className="material-symbols-outlined text-purple-500 text-3xl">trending_up</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EDUCATION INFLATION SIMULATOR */}
      {activeTab === 'education' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-surface border border-outline-variant rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div>
                <h3 className="font-headline-sm font-extrabold text-on-surface text-lg">
                  {isId ? 'Simulasi Inflasi Pendidikan Anak' : 'Education Fund & Inflation Calculator'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isId ? 'Hitung kenaikan biaya kuliah/sekolah di masa depan akibat inflasi pendidikan.' : 'Calculate future education fees adjusted for education inflation.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Biaya Pendidikan Saat Ini' : 'Current Education Cost'}</label>
              <input 
                type="number"
                value={eduCostToday}
                onChange={(e) => setEduCostToday(Number(e.target.value) || 0)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Jangka Waktu (Tahun)' : 'Years Until School'}</label>
                <input 
                  type="number"
                  value={yearsUntilEdu}
                  onChange={(e) => setYearsUntilEdu(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface-variant">{isId ? 'Inflasi Pendidikan (%/Thn)' : 'Edu Inflation (%/Yr)'}</label>
                <input 
                  type="number"
                  step="0.5"
                  value={eduInflationRate}
                  onChange={(e) => setEduInflationRate(Number(e.target.value) || 0)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className="h-11 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Edu Result */}
          <div className="lg:col-span-5 bg-gradient-to-b from-rose-950/20 to-surface-container border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <h4 className="font-headline-xs font-extrabold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[22px]">auto_graph</span>
              {isId ? 'Estimasi Biaya Pendidikan Masa Depan' : 'Future Education Projection'}
            </h4>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-3">
              <div className="text-xs text-on-surface-variant">{isId ? 'Estimasi Biaya ' + yearsUntilEdu + ' Tahun Lagi:' : 'Estimated Cost in ' + yearsUntilEdu + ' Years:'}</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                Rp {eduFutureCost.toLocaleString(isId ? 'id-ID' : 'en-US')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs font-extrabold text-rose-800 dark:text-rose-300">{isId ? 'Saran Alokasi Tabungan Bulanan' : 'Suggested Monthly Savings'}</div>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                  Rp {eduMonthlySaving.toLocaleString(isId ? 'id-ID' : 'en-US')} / {isId ? 'bln' : 'mo'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
