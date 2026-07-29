import React, { useState } from 'react';
import { Asset, AssetValuationHistory } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { formatCurrency, getAssetEffectiveValue, calculateAssetDepreciation, decimalToDMS } from '../utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useFinance } from '../store';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: AssetDetailModalProps) {
  const { language } = useThemeLanguage();
  const { addAssetValuation, deleteAssetValuation } = useFinance();
  const isId = language === 'id';

  const [isAddingValuation, setIsAddingValuation] = useState(false);
  const [newValDate, setNewValDate] = useState(new Date().toISOString().slice(0, 10));
  const [newValValue, setNewValValue] = useState('');
  const [newValNote, setNewValNote] = useState('');
  const [isSubmittingVal, setIsSubmittingVal] = useState(false);

  if (!isOpen || !asset) return null;

  const effectiveValue = getAssetEffectiveValue(asset);
  const purchasePrice = asset.purchasePrice || 0;
  const gainLoss = effectiveValue - purchasePrice;
  const roiPercent = purchasePrice > 0 ? (gainLoss / purchasePrice) * 100 : 0;

  // Land / Property price per m2 & Borongan calculations
  const isLandOrProperty = asset.category.toLowerCase().includes('properti') ||
                           asset.category.toLowerCase().includes('lahan') ||
                           asset.category.toLowerCase().includes('tanah') ||
                           asset.category.toLowerCase().includes('bangunan');
  const areaSizeNum = asset.areaSize && Number(asset.areaSize) > 0 ? Number(asset.areaSize) : null;
  const showPricePerM2 = isLandOrProperty && Boolean(areaSizeNum);
  const effectivePricePerM2 = areaSizeNum ? Math.round(effectiveValue / areaSizeNum) : 0;
  const purchasePricePerM2 = areaSizeNum ? Math.round(purchasePrice / areaSizeNum) : 0;

  // Borongan calculations for South Kalimantan (1 Hektar / 10.000 m² = 35 Borongan)
  const boronganCount = areaSizeNum ? (areaSizeNum * 35) / 10000 : 0;
  const effectivePricePerBorongan = boronganCount > 0 ? Math.round(effectiveValue / boronganCount) : 0;
  const purchasePricePerBorongan = boronganCount > 0 ? Math.round(purchasePrice / boronganCount) : 0;

  // Depreciation calculation if active
  const depreciationInfo = calculateAssetDepreciation(asset);

  // Valuation History timeline
  const rawHistory: AssetValuationHistory[] = asset.valuationHistory && asset.valuationHistory.length > 0
    ? asset.valuationHistory
    : [
        {
          id: 'val-init',
          date: asset.purchaseDate || new Date().toISOString().slice(0, 10),
          value: asset.purchasePrice || asset.currentValue,
          note: isId ? 'Nilai Perolehan / Pembelian Awal' : 'Initial Purchase Price'
        }
      ];

  // Sort chronologically ascending (oldest to newest) to calculate step changes
  const sortedAsc = [...rawHistory].sort((a, b) => a.date.localeCompare(b.date));

  // Compute step differences
  const historyWithDiff = sortedAsc.map((item, idx) => {
    const prevItem = idx > 0 ? sortedAsc[idx - 1] : null;
    const diff = prevItem ? item.value - prevItem.value : 0;
    const percentDiff = prevItem && prevItem.value > 0 ? (diff / prevItem.value) * 100 : 0;
    return {
      ...item,
      diff,
      percentDiff,
      isInitial: idx === 0,
      isLatest: idx === sortedAsc.length - 1
    };
  });

  // Display newest first
  const displayHistory = [...historyWithDiff].reverse();

  const handleSaveValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(newValValue.replace(/[^0-9.-]+/g, ''));
    if (isNaN(valNum) || valNum <= 0) return;

    setIsSubmittingVal(true);
    try {
      await addAssetValuation(asset.id, valNum, newValDate, newValNote);
      setIsAddingValuation(false);
      setNewValValue('');
      setNewValNote('');
    } finally {
      setIsSubmittingVal(false);
    }
  };

  const handleDeleteVal = async (valId: string) => {
    if (rawHistory.length <= 1) return;
    await deleteAssetValuation(asset.id, valId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Photo Banner */}
        <div className="relative bg-surface-container-high border-b border-outline-variant">
          {asset.imageUrl ? (
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
              <img
                src={asset.imageUrl}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="h-32 sm:h-40 w-full bg-gradient-to-br from-primary/20 via-surface-container-high to-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[64px] opacity-80">
                {asset.category.toLowerCase().includes('rekening') || asset.category.toLowerCase().includes('bank') || asset.category.toLowerCase().includes('e-wallet') ? 'account_balance_wallet' : (asset.category.toLowerCase().includes('properti') ? 'home_work' : (asset.category.toLowerCase().includes('kendaraan') ? 'directions_car' : 'home_pin'))}
              </span>
            </div>
          )}

          {/* Top Badges & Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors z-20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="absolute top-3 left-3 flex gap-2 z-20">
            <span className="bg-primary/90 text-on-primary text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shadow-xs">
              {asset.workspaceId}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shadow-xs text-white ${
              asset.status === 'owned' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {asset.status === 'owned' ? (isId ? 'Dimiliki' : 'Owned') : asset.status}
            </span>
          </div>

          {/* Title on Photo Banner */}
          <div className={`${asset.imageUrl ? 'absolute bottom-3 left-4 right-4 text-white' : 'p-4'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider block ${asset.imageUrl ? 'text-white/80' : 'text-primary'}`}>
              {asset.category}
            </span>
            <h3 className="font-title-lg font-black text-lg sm:text-2xl mt-0.5 leading-tight">
              {asset.name}
            </h3>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-on-surface text-xs sm:text-sm">
          {/* Key Value Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] text-on-surface-variant font-medium block">
                {isId ? 'Nilai Efektif Saat Ini' : 'Current Effective Value'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                {formatCurrency(effectiveValue)}
              </span>
              {showPricePerM2 && (
                <div className="space-y-0.5 mt-1">
                  <span className="text-[11px] font-bold text-primary block bg-primary/10 px-2 py-0.5 rounded-md w-fit">
                    📐 {formatCurrency(effectivePricePerM2)} / m²
                  </span>
                  {boronganCount > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
                      🌾 {formatCurrency(effectivePricePerBorongan)} / borongan
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] text-on-surface-variant font-medium block">
                {isId ? 'Harga Beli Awal' : 'Purchase Price'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-on-surface block mt-1">
                {formatCurrency(purchasePrice)}
              </span>
              {showPricePerM2 && (
                <div className="space-y-0.5 mt-1">
                  <span className="text-[11px] font-medium text-on-surface-variant block bg-surface-container-high px-2 py-0.5 rounded-md w-fit">
                    📐 {formatCurrency(purchasePricePerM2)} / m²
                  </span>
                  {boronganCount > 0 && (
                    <span className="text-[10px] font-medium text-on-surface-variant block bg-surface-container-high/80 px-2 py-0.5 rounded-md w-fit">
                      🌾 {formatCurrency(purchasePricePerBorongan)} / borongan
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Return / Value Change */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant flex items-center justify-between">
            <div>
              <span className="text-[11px] text-on-surface-variant font-medium block">
                {isId ? 'Perubahan Nilai / Imbal Hasil (ROI)' : 'Value Change / ROI'}
              </span>
              <span className={`text-sm font-black block mt-0.5 ${gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({roiPercent >= 0 ? '+' : ''}{roiPercent.toFixed(1)}%)
              </span>
            </div>
            <div className={`p-2.5 rounded-full ${gainLoss >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
              <span className="material-symbols-outlined text-[24px]">
                {gainLoss >= 0 ? 'trending_up' : 'trending_down'}
              </span>
            </div>
          </div>

          {/* HISTORI PERUBAHAN HARGA / REVALUASI SECTION */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-on-surface text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                  {isId ? 'Histori Perubahan & Revaluasi Nilai' : 'Valuation & Price History'}
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {isId ? 'Catat perkembangan nilai pasar/penilaian aset secara periodik (tanpa arus kas)' : 'Track periodic market revaluation records'}
                </p>
              </div>
              {!isAddingValuation && (
                <Button
                  variant="outline"
                  className="text-xs py-1 px-2.5 font-bold cursor-pointer text-primary border-primary/30 hover:bg-primary/5"
                  onClick={() => setIsAddingValuation(true)}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {isId ? 'Revaluasi' : 'Revalue'}
                </Button>
              )}
            </div>

            {/* Inline Form to Add Valuation */}
            {isAddingValuation && (
              <form onSubmit={handleSaveValuation} className="bg-surface p-3.5 rounded-lg border border-primary/30 space-y-3 animate-fade-in">
                <div className="font-bold text-xs text-primary flex items-center justify-between">
                  <span>{isId ? 'Catat Penilaian / Kenaikan Nilai Baru' : 'New Asset Revaluation Record'}</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingValuation(false)}
                    className="text-on-surface-variant hover:text-on-surface text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    label={isId ? 'Tanggal Penilaian' : 'Valuation Date'}
                    type="date"
                    value={newValDate}
                    onChange={(e) => setNewValDate(e.target.value)}
                    required
                  />
                  <Input
                    label={isId ? 'Nilai Baru Aset (Rp)' : 'New Asset Value (Rp)'}
                    type="number"
                    placeholder="cth. 5000000"
                    value={newValValue}
                    onChange={(e) => setNewValValue(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label={isId ? 'Catatan / Alasan Perubahan' : 'Reason / Note'}
                  placeholder={isId ? 'cth. Apresiasi harga tanah 2027 / Hasil Appraisal' : 'e.g., Market appreciation 2027'}
                  value={newValNote}
                  onChange={(e) => setNewValNote(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-3"
                    onClick={() => setIsAddingValuation(false)}
                  >
                    {isId ? 'Batal' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingVal}
                    className="text-xs py-1 px-3 font-bold"
                  >
                    {isSubmittingVal ? '...' : (isId ? 'Simpan Nilai Baru' : 'Save Revaluation')}
                  </Button>
                </div>
              </form>
            )}

            {/* Timeline List */}
            <div className="space-y-2 pt-1">
              {displayHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                    item.isLatest
                      ? 'bg-primary/5 border-primary/30 shadow-2xs'
                      : 'bg-surface border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-full mt-0.5 flex-shrink-0 ${
                      item.isInitial
                        ? 'bg-surface-container-high text-on-surface-variant'
                        : item.diff >= 0
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {item.isInitial ? 'shopping_bag' : (item.diff >= 0 ? 'trending_up' : 'trending_down')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-on-surface">{item.date}</span>
                        {item.isLatest && (
                          <span className="bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                            {isId ? 'Nilai Terbaru' : 'Current Value'}
                          </span>
                        )}
                        {item.isInitial && (
                          <span className="bg-surface-container-high text-on-surface-variant font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                            {isId ? 'Awal Beli' : 'Purchase'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                        {item.note || (item.isInitial ? 'Nilai Perolehan Awal' : 'Pembaruan Nilai')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <span className="font-black text-on-surface block text-xs sm:text-sm">
                        {formatCurrency(item.value)}
                      </span>
                      {showPricePerM2 && areaSizeNum && (
                        <span className="text-[10px] font-bold text-primary block">
                          📐 {formatCurrency(Math.round(item.value / areaSizeNum))}/m²
                          {boronganCount > 0 && ` • 🌾 ${formatCurrency(Math.round(item.value / boronganCount))}/borongan`}
                        </span>
                      )}
                      {!item.isInitial && (
                        <span className={`text-[10px] font-bold block ${item.diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {item.diff >= 0 ? '+' : ''}{formatCurrency(item.diff)} ({item.percentDiff >= 0 ? '+' : ''}{item.percentDiff.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    {!item.isInitial && displayHistory.length > 1 && (
                      <button
                        onClick={() => handleDeleteVal(item.id)}
                        className="text-on-surface-variant hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                        title={isId ? 'Hapus catatan ini' : 'Delete record'}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Coordinates Section */}
          {(asset.locationName || (asset.latitude && asset.longitude) || asset.areaSize) && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-primary text-xs sm:text-sm">
                  <span className="material-symbols-outlined text-[20px]">
                    {asset.category.includes('Usaha') || asset.category.includes('Bisnis') ? 'store' : 'pin_drop'}
                  </span>
                  {asset.category.includes('Usaha') || asset.category.includes('Bisnis')
                    ? (isId ? 'Informasi Unit Usaha & Kepemilikan' : 'Business & Ownership Info')
                    : (isId ? 'Informasi Lokasi & Lahan' : 'Location & Land Info')}
                </div>
                {asset.latitude && asset.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${asset.latitude},${asset.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Google Maps ↗
                  </a>
                )}
              </div>

              {asset.locationName && (
                <p className="text-xs text-on-surface font-medium leading-relaxed">
                  📍 {asset.locationName}
                </p>
              )}

              <div className="flex flex-col gap-1 text-xs text-on-surface-variant pt-1 border-t border-primary/10">
                {Boolean(asset.areaSize) && (
                  <div>
                    <span className="font-bold text-on-surface">
                      {asset.category.includes('Usaha') || asset.category.includes('Bisnis')
                        ? (isId ? 'Persentase Kepemilikan' : 'Ownership Share')
                        : (isId ? 'Luas Area' : 'Area Size')}
                      :
                    </span>{' '}
                    {asset.areaSize}
                    {asset.category.includes('Usaha') || asset.category.includes('Bisnis')
                      ? '%'
                      : asset.category.includes('Properti') || asset.category.includes('Lahan')
                      ? ' m²'
                      : ''}
                  </div>
                )}
                {showPricePerM2 && (
                  <div className="space-y-2 mt-1">
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface rounded-lg border border-outline-variant/60">
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">{isId ? 'Harga Beli / m²' : 'Purchase / m²'}</span>
                        <span className="font-bold text-on-surface text-xs">{formatCurrency(purchasePricePerM2)} / m²</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-on-surface-variant block">{isId ? 'Harga Saat Ini / m²' : 'Current / m²'}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(effectivePricePerM2)} / m²</span>
                      </div>
                    </div>

                    {boronganCount > 0 && (
                      <div className="p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1">
                            🌾 {isId ? 'Satuan Tradisional Kalsel (Borongan)' : 'Traditional Unit (Borongan)'}
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                            ≈ {boronganCount.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Borongan
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/10">
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">{isId ? 'Beli / Borongan' : 'Buy / Borongan'}</span>
                            <span className="font-bold text-on-surface">{formatCurrency(purchasePricePerBorongan)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">{isId ? 'Saat Ini / Borongan' : 'Current / Borongan'}</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(effectivePricePerBorongan)}</span>
                          </div>
                        </div>
                        <p className="text-[9.5px] text-on-surface-variant italic leading-tight">
                          *Konversi: 1 Hektar (10.000 m²) = 35 Borongan, 1 Borongan ≈ 285,7 m².
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {asset.latitude && asset.longitude && (
                  <div className="space-y-1 mt-1 bg-surface-container-low/60 p-2.5 rounded-lg border border-outline-variant/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{isId ? 'Koordinat Desimal' : 'Decimal Coordinates'}:</span>
                      <span className="font-mono text-primary font-bold">{asset.latitude}, {asset.longitude}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-on-surface-variant">{isId ? 'Koordinat DMS (Derajat)' : 'DMS Coordinates'}:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {decimalToDMS(asset.latitude, true)} {decimalToDMS(asset.longitude, false)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                {isId ? 'Catatan & Keterangan' : 'Notes'}
              </span>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {asset.notes}
              </p>
            </div>
          )}

          {/* Depreciation Info */}
          {asset.depreciationMethod && asset.depreciationMethod !== 'none' && depreciationInfo && (
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                {isId ? 'Penyusutan Nilai (Depresiasi)' : 'Depreciation Info'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-on-surface-variant">{isId ? 'Metode' : 'Method'}:</span>{' '}
                  <span className="font-bold">{asset.depreciationMethod}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">{isId ? 'Masa Pakai' : 'Useful Life'}:</span>{' '}
                  <span className="font-bold">{asset.depreciationUsefulLife} {isId ? 'Tahun' : 'Years'}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">{isId ? 'Nilai Sisa' : 'Salvage Value'}:</span>{' '}
                  <span className="font-bold">{formatCurrency(asset.depreciationSalvageValue || 0)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">{isId ? 'Depresiasi Terakumulasi' : 'Accumulated'}:</span>{' '}
                  <span className="font-bold text-red-500">{formatCurrency(depreciationInfo.accumulatedDepreciation)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Purchase Date */}
          <div className="text-xs text-on-surface-variant flex justify-between items-center pt-2 border-t border-outline-variant/40">
            <span>{isId ? 'Tanggal Pembelian / Perolehan' : 'Purchase Date'}</span>
            <span className="font-bold text-on-surface">{asset.purchaseDate}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-surface border-t border-outline-variant flex items-center justify-between gap-2">
          <Button
            variant="outline"
            className="text-red-500 hover:bg-red-50 border-red-200 dark:border-red-900/30 hover:text-red-600 text-xs px-3 cursor-pointer"
            onClick={() => {
              onClose();
              onDelete(asset);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {isId ? 'Hapus Aset' : 'Delete'}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs">
              {isId ? 'Tutup' : 'Close'}
            </Button>
            <Button
              variant="primary"
              className="text-xs font-bold cursor-pointer"
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              {isId ? 'Ubah Data' : 'Edit Asset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
