import React, { useState, useMemo } from 'react';
import { Asset } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { formatCurrency, getAssetEffectiveValue } from '../utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import {
  TrendingUp,
  Calculator,
  Sliders,
  Sparkles,
  Info,
  Calendar,
  X,
  RotateCcw,
  Building,
  Car,
  Coins,
  LineChart as LineChartIcon,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface AssetSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onApplyUpdatedValue?: (assetId: string, newValue: number) => void;
}

// Preset Growth Rates based on asset category or market trends
const ASSET_GROWTH_PRESETS = [
  {
    category: 'Rekening Bank / E-Wallet',
    categoryEn: 'Bank & E-Wallet Accounts',
    icon: Coins,
    annualRate: 2.5,
    variance: 1,
    descriptionId: 'Imbal hasil atau bunga saldo tabungan bank & e-wallet rata-rata 1% - 3% per tahun.',
    descriptionEn: 'Average interest or return on bank and e-wallet balances of 1% - 3% per year.'
  },
  {
    category: 'Properti / Lahan',
    categoryEn: 'Property & Land',
    icon: Building,
    annualRate: 10,
    variance: 3,
    descriptionId: 'Pertumbuhan harga tanah & bangunan rata-rata 8% - 12% per tahun di daerah berkembang.',
    descriptionEn: 'Average property and land growth rate of 8% - 12% per year in developing regions.'
  },
  {
    category: 'Emas / Logam Mulia',
    categoryEn: 'Gold & Precious Metals',
    icon: Coins,
    annualRate: 8.5,
    variance: 2.5,
    descriptionId: 'Emas cenderung menjaga nilai aset terhadap inflasi dengan imbal hasil rata-rata 7% - 10% per tahun.',
    descriptionEn: 'Gold hedges against inflation with average long-term returns of 7% - 10% per year.'
  },
  {
    category: 'Surat Berharga / Investasi',
    categoryEn: 'Securities & Investments',
    icon: LineChartIcon,
    annualRate: 12,
    variance: 4,
    descriptionId: 'Reksadana/saham dengan potensi return tinggi (10% - 15%), namun memiliki volatilitas sedang-tinggi.',
    descriptionEn: 'Mutual funds/stocks offer higher growth potential (10% - 15%), with moderate to high volatility.'
  },
  {
    category: 'Kendaraan',
    categoryEn: 'Vehicles',
    icon: Car,
    annualRate: -10,
    variance: 2,
    descriptionId: 'Depresiasi nilai kendaraan umum menyusut 8% - 15% setiap tahunnya.',
    descriptionEn: 'General vehicles depreciate around 8% - 15% each year.'
  },
  {
    category: 'Lainnya / Cust' ,
    categoryEn: 'Custom / Savings',
    icon: Sliders,
    annualRate: 5,
    variance: 2,
    descriptionId: 'Simulasi kustom dengan tingkat imbal hasil disesuaikan.',
    descriptionEn: 'Custom simulation with personalized rate of return.'
  }
];

export const AssetSimulationModal: React.FC<AssetSimulationModalProps> = ({
  isOpen,
  onClose,
  assets,
  onApplyUpdatedValue
}) => {
  const { language } = useThemeLanguage();
  const isId = language === 'id';

  // Selection state
  const [selectedAssetId, setSelectedAssetId] = useState<string>('custom');

  // Parameters
  const [initialValue, setInitialValue] = useState<number>(100000000); // Rp 100 Juta
  const [annualGrowthRate, setAnnualGrowthRate] = useState<number>(10); // 10% per year
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000000); // Rp 1 Juta / bulan
  const [durationYears, setDurationYears] = useState<number>(10); // 10 years
  const [inflationRate, setInflationRate] = useState<number>(3.5); // 3.5% inflation
  const [adjustForInflation, setAdjustForInflation] = useState<boolean>(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>('Properti / Lahan');
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'insights'>('chart');
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // When selectedAssetId changes, populate initial value and category if valid asset
  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    if (assetId !== 'custom') {
      const asset = assets.find((a) => a.id === assetId);
      if (asset) {
        const effValue = getAssetEffectiveValue(asset);
        setInitialValue(effValue > 0 ? effValue : asset.purchasePrice || 10000000);

        // Auto match preset category
        const matchedPreset = ASSET_GROWTH_PRESETS.find((p) => p.category === asset.category);
        if (matchedPreset) {
          setAnnualGrowthRate(matchedPreset.annualRate);
          setSelectedPresetCategory(matchedPreset.category);
        }
      }
    }
  };

  // Preset selector handler
  const handlePresetSelect = (preset: typeof ASSET_GROWTH_PRESETS[0]) => {
    setSelectedPresetCategory(preset.category);
    setAnnualGrowthRate(preset.annualRate);
  };

  // Reset parameters to defaults
  const handleReset = () => {
    setSelectedAssetId('custom');
    setInitialValue(100000000);
    setAnnualGrowthRate(10);
    setMonthlyContribution(1000000);
    setDurationYears(10);
    setInflationRate(3.5);
    setAdjustForInflation(false);
    setSelectedPresetCategory('Properti / Lahan');
    setAppliedSuccess(false);
  };

  // Forecast Engine Calculation
  const simulationData = useMemo(() => {
    const data = [];
    const variance = 2.5;

    let currentRealistic = initialValue;
    let currentOptimistic = initialValue;
    let currentConservative = initialValue;
    let totalInvestedCapital = initialValue;

    const rateRealistic = annualGrowthRate / 100;
    const rateOptimistic = (annualGrowthRate + variance) / 100;
    const rateConservative = (annualGrowthRate - variance) / 100;
    const inflRate = inflationRate / 100;

    // Initial Year 0
    data.push({
      year: 0,
      label: isId ? 'Sekarang' : 'Now',
      realistic: Math.round(initialValue),
      optimistic: Math.round(initialValue),
      conservative: Math.round(initialValue),
      totalInvested: Math.round(initialValue),
      realValue: Math.round(initialValue),
      gain: 0
    });

    for (let yr = 1; yr <= durationYears; yr++) {
      const annualContrib = monthlyContribution * 12;
      totalInvestedCapital += annualContrib;

      // Compound growth formula applied year-end
      currentRealistic = (currentRealistic + annualContrib) * (1 + rateRealistic);
      currentOptimistic = (currentOptimistic + annualContrib) * (1 + rateOptimistic);
      currentConservative = (currentConservative + annualContrib) * (1 + rateConservative);

      // Prevent negative asset value for depreciating assets
      if (currentRealistic < 0) currentRealistic = 0;
      if (currentOptimistic < 0) currentOptimistic = 0;
      if (currentConservative < 0) currentConservative = 0;

      // Purchasing power adjusted for inflation
      const inflationDiscount = Math.pow(1 + inflRate, yr);
      const realPurchasingPower = adjustForInflation
        ? currentRealistic / inflationDiscount
        : currentRealistic;

      data.push({
        year: yr,
        label: isId ? `Thn ${yr}` : `Yr ${yr}`,
        realistic: Math.round(currentRealistic),
        optimistic: Math.round(currentOptimistic),
        conservative: Math.round(currentConservative),
        totalInvested: Math.round(totalInvestedCapital),
        realValue: Math.round(realPurchasingPower),
        gain: Math.round(currentRealistic - totalInvestedCapital)
      });
    }

    return data;
  }, [initialValue, annualGrowthRate, monthlyContribution, durationYears, inflationRate, adjustForInflation, isId]);

  // Final Metrics
  const finalResult = simulationData[simulationData.length - 1];
  const netGain = finalResult.realistic - finalResult.totalInvested;
  const roiPercentage =
    finalResult.totalInvested > 0 ? (netGain / finalResult.totalInvested) * 100 : 0;

  // Apply project value to chosen asset
  const handleApplyToAsset = () => {
    if (selectedAssetId !== 'custom' && onApplyUpdatedValue) {
      onApplyUpdatedValue(selectedAssetId, finalResult.realistic);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                {isId ? 'Simulasi & Proyeksi Nilai Aset' : 'Asset Value Forecasting & Simulation'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isId
                  ? 'Hitung estimasi nilai investasi/properti di masa depan berdasarkan tren pertumbuhan & inflasi'
                  : 'Project future investment or property values based on historical trends & inflation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content - Grid Layout */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls & Parameters (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 border-b lg:border-b-0 lg:border-r border-outline-variant/60 pb-6 lg:pb-0 lg:pr-6">
            {/* Asset Selector */}
            <div>
              <label className="text-xs font-bold text-on-surface mb-1.5 flex items-center justify-between">
                <span>{isId ? 'Pilih Aset untuk Disimulasikan' : 'Select Asset for Simulation'}</span>
                <span className="text-[10px] text-primary font-normal">
                  {assets.length} {isId ? 'Aset Tersedia' : 'Assets Available'}
                </span>
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => handleAssetSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-outline-variant bg-surface text-on-surface font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              >
                <option value="custom">💡 {isId ? '-- Simulasi Kustom / Bebas --' : '-- Custom / Manual Input --'}</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.category}) - {formatCurrency(getAssetEffectiveValue(asset))}
                  </option>
                ))}
              </select>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="text-xs font-bold text-on-surface mb-2 block">
                {isId ? 'Preset Kategori & Tren Historis' : 'Category Presets & Market Trends'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ASSET_GROWTH_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPresetCategory === preset.category;
                  return (
                    <button
                      key={preset.category}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                          : 'border-outline-variant/80 bg-surface-container-low/50 hover:bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${preset.annualRate >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'}`}>
                          {preset.annualRate > 0 ? `+${preset.annualRate}%` : `${preset.annualRate}%`}/thn
                        </span>
                      </div>
                      <span className="font-semibold line-clamp-1 text-[11px] text-on-surface">
                        {isId ? preset.category : preset.categoryEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Inputs */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/40">
              {/* Initial Asset Value */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-on-surface">
                    {isId ? 'Nilai Aset Awal / Modal Beli' : 'Initial Asset Value / Purchase Price'}
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {formatCurrency(initialValue)}
                  </span>
                </div>
                <input
                  type="number"
                  value={initialValue}
                  onChange={(e) => setInitialValue(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-outline-variant bg-surface text-on-surface font-mono"
                  step="1000000"
                />
              </div>

              {/* Annual Growth Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                    <span>{isId ? 'Asumsi Pertumbuhan Per Tahun' : 'Annual Growth Rate (%)'}</span>
                  </label>
                  <span className={`text-xs font-mono font-bold ${annualGrowthRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {annualGrowthRate > 0 ? `+${annualGrowthRate}%` : `${annualGrowthRate}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="0.5"
                  value={annualGrowthRate}
                  onChange={(e) => setAnnualGrowthRate(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-mono mt-0.5">
                  <span>-20% (Depresiasi)</span>
                  <span>0%</span>
                  <span>+15% (Pasar)</span>
                  <span>+30% (Agresif)</span>
                </div>
              </div>

              {/* Monthly Contribution */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-on-surface">
                    {isId ? 'Top Up / Investasi Rutin Bulanan' : 'Monthly Contribution'}
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {formatCurrency(monthlyContribution)}
                  </span>
                </div>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-outline-variant bg-surface text-on-surface font-mono"
                  step="100000"
                />
              </div>

              {/* Duration Years */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-on-surface">
                    {isId ? 'Jangka Waktu Simulasi' : 'Duration (Years)'}
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {durationYears} {isId ? 'Tahun' : 'Years'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={durationYears}
                  onChange={(e) => setDurationYears(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-mono mt-0.5">
                  <span>1 Thn</span>
                  <span>5 Thn</span>
                  <span>10 Thn</span>
                  <span>20 Thn</span>
                  <span>30 Thn</span>
                </div>
              </div>

              {/* Inflation Adjustment Switch */}
              <div className="p-3 bg-surface-container-low/70 rounded-xl border border-outline-variant/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold text-on-surface">
                      {isId ? 'Disesuaikan Inflasi (Nilai Riil)' : 'Inflation Adjusted (Real Value)'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={adjustForInflation}
                    onChange={(e) => setAdjustForInflation(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                {adjustForInflation && (
                  <div className="pt-2 border-t border-outline-variant/40 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-on-surface-variant">
                      {isId ? 'Tingkat Inflasi Tahunan:' : 'Annual Inflation Rate:'}
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold text-primary">
                      <input
                        type="number"
                        value={inflationRate}
                        onChange={(e) => setInflationRate(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 text-xs text-right border border-outline-variant rounded bg-surface"
                        step="0.1"
                      />
                      %
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors border border-outline-variant/60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isId ? 'Reset Parameter Simulasi' : 'Reset Simulation Parameters'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Results, Interactive Chart & Schedule (7 Cols) */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card className="p-3 bg-primary/5 border-primary/20 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {isId ? `Nilai Thn ke-${durationYears}` : `Value Year ${durationYears}`}
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-primary mt-1">
                  {formatCurrency(adjustForInflation ? finalResult.realValue : finalResult.realistic)}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  {adjustForInflation ? (isId ? 'Daya beli riil' : 'Real purchasing power') : (isId ? 'Nilai nominal' : 'Nominal value')}
                </span>
              </Card>

              <Card className="p-3 bg-emerald-500/5 border-emerald-500/20 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {isId ? 'Estimasi Gain / Keuntungan' : 'Net Capital Gain'}
                </span>
                <span className={`text-base sm:text-lg font-bold font-mono mt-1 ${netGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {formatCurrency(netGain)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  ROI: {roiPercentage >= 0 ? `+${roiPercentage.toFixed(1)}%` : `${roiPercentage.toFixed(1)}%`}
                </span>
              </Card>

              <Card className="p-3 bg-surface-container-low border-outline-variant/60 col-span-2 sm:col-span-1 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {isId ? 'Total Modal Disetor' : 'Total Capital Invested'}
                </span>
                <span className="text-base sm:text-lg font-bold font-mono text-on-surface mt-1">
                  {formatCurrency(finalResult.totalInvested)}
                </span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  {formatCurrency(initialValue)} + ({durationYears * 12}x {formatCurrency(monthlyContribution)})
                </span>
              </Card>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chart'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                {isId ? 'Grafik Proyeksi' : 'Projection Chart'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'table'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Layers className="w-4 h-4" />
                {isId ? 'Jadwal Pertumbuhan' : 'Growth Schedule'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'insights'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isId ? 'Analisis & Tips Pasar' : 'Market Insights'}
              </button>
            </div>

            {/* TAB 1: CHART */}
            {activeTab === 'chart' && (
              <div className="space-y-3">
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={simulationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRealistic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                      <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(val) => {
                          if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                          if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                          return val;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                      {/* Area for Expected Realistic Growth */}
                      <Area
                        type="monotone"
                        dataKey="realistic"
                        name={isId ? 'Proyeksi Realistis' : 'Realistic Projection'}
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRealistic)"
                      />

                      {/* Line for Optimistic Scenario */}
                      <Line
                        type="monotone"
                        dataKey="optimistic"
                        name={isId ? 'Skenario Optimis' : 'Optimistic (+2.5%)'}
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />

                      {/* Line for Conservative Scenario */}
                      <Line
                        type="monotone"
                        dataKey="conservative"
                        name={isId ? 'Skenario Konservatif' : 'Conservative (-2.5%)'}
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        dot={false}
                      />

                      {/* Line for Invested Capital */}
                      <Line
                        type="monotone"
                        dataKey="totalInvested"
                        name={isId ? 'Total Capital' : 'Total Capital'}
                        stroke="#64748b"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant p-2.5 bg-surface-container-low/80 rounded-xl border border-outline-variant/50">
                  <span className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    {isId ? 'Area biru menunjukkan simulasi pertumbuhan aset realistis.' : 'Blue area represents expected realistic compound growth.'}
                  </span>
                  <span className="font-mono text-primary font-bold">CAGR: ~{annualGrowthRate}%</span>
                </div>
              </div>
            )}

            {/* TAB 2: SCHEDULE TABLE */}
            {activeTab === 'table' && (
              <div className="overflow-x-auto max-h-72 rounded-xl border border-outline-variant/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-container-low text-on-surface-variant font-sans font-bold border-b border-outline-variant">
                    <tr>
                      <th className="p-2.5">{isId ? 'Tahun' : 'Year'}</th>
                      <th className="p-2.5">{isId ? 'Modal Disetor' : 'Capital'}</th>
                      <th className="p-2.5">{isId ? 'Nilai Nominal' : 'Nominal Value'}</th>
                      <th className="p-2.5">{isId ? 'Nilai Riil' : 'Real Value'}</th>
                      <th className="p-2.5 text-right">{isId ? 'Gain / Profit' : 'Gain'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {simulationData.map((row) => (
                      <tr key={row.year} className="hover:bg-surface-container-low/40">
                        <td className="p-2.5 font-bold font-sans">{row.label}</td>
                        <td className="p-2.5 text-on-surface-variant">{formatCurrency(row.totalInvested)}</td>
                        <td className="p-2.5 font-bold text-primary">{formatCurrency(row.realistic)}</td>
                        <td className="p-2.5 text-on-surface">{formatCurrency(row.realValue)}</td>
                        <td className={`p-2.5 text-right font-bold ${row.gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                          {row.gain >= 0 ? `+${formatCurrency(row.gain)}` : formatCurrency(row.gain)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: INSIGHTS & MARKET TRENDS */}
            {activeTab === 'insights' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-primary/10 rounded-xl border border-primary/20 text-on-surface space-y-2">
                  <h4 className="font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    {isId ? 'Wawasan & Karakteristik Aset' : 'Asset Dynamics & Insights'}
                  </h4>
                  <p className="text-on-surface-variant leading-relaxed">
                    {ASSET_GROWTH_PRESETS.find((p) => p.category === selectedPresetCategory)?.descriptionId ||
                      (isId
                        ? 'Setiap aset memiliki dinamika pasar tersendiri. Properti cenderung memiliki pertumbuhan modal jangka panjang & arus kas sewa, sedangkan kendaraan memiliki tingkat susut nilai alami.'
                        : 'Different assets carry unique risk-return profiles. Properties deliver long-term appreciation & rental yield, whereas vehicles depreciate systematically.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 space-y-1">
                    <span className="font-bold text-on-surface block flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      {isId ? 'Kekuatan Bunga Bergulir (Compounding)' : 'Power of Compounding'}
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      {isId
                        ? 'Investasi rutin bulanan melipatgandakan efek pertumbuhan compounding secara signifikan dalam jangka waktu >5 tahun.'
                        : 'Regular monthly top-ups compound significantly over horizons >5 years.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 space-y-1">
                    <span className="font-bold text-on-surface block flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      {isId ? 'Risiko Inflasi' : 'Inflation Risk'}
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      {isId
                        ? 'Inflasi rata-rata 3-4% menurunkan daya beli uang tunai. Aset produktif membantu menjaga nilai riil kekayaan Anda.'
                        : 'Inflation at ~3-4% erodes cash purchasing power. Tangible/productive assets protect real wealth.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              {selectedAssetId !== 'custom' ? (
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <Button
                    onClick={handleApplyToAsset}
                    variant="primary"
                    className="w-full sm:w-auto text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isId ? 'Terapkan Hasil ke Nilai Aset' : 'Apply Projection to Asset Value'}
                  </Button>
                  {appliedSuccess && (
                    <span className="text-xs text-emerald-600 font-bold animate-fade-in">
                      ✓ {isId ? 'Nilai aset diperbarui!' : 'Asset value updated!'}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-on-surface-variant italic">
                  💡 {isId ? 'Pilih aset dari daftar di sebelah kiri jika ingin memperbarui nilainya.' : 'Select a saved asset on the left to apply projected values.'}
                </span>
              )}

              <Button onClick={onClose} variant="outline" className="w-full sm:w-auto text-xs py-2 px-4">
                {isId ? 'Tutup Simulasi' : 'Close Simulation'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
