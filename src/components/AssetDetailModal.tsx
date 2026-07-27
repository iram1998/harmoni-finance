import React from 'react';
import { Asset } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { formatCurrency, getAssetEffectiveValue, calculateAssetDepreciation, decimalToDMS } from '../utils';
import { Button } from './ui/Button';

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
  const isId = language === 'id';

  if (!isOpen || !asset) return null;

  const effectiveValue = getAssetEffectiveValue(asset);
  const purchasePrice = asset.purchasePrice || 0;
  const gainLoss = effectiveValue - purchasePrice;
  const roiPercent = purchasePrice > 0 ? (gainLoss / purchasePrice) * 100 : 0;

  // Depreciation calculation if active
  const depreciationInfo = calculateAssetDepreciation(asset);

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
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] text-on-surface-variant font-medium block">
                {isId ? 'Harga Beli Awal' : 'Purchase Price'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-on-surface block mt-1">
                {formatCurrency(purchasePrice)}
              </span>
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

          {/* Location & Coordinates Section */}
          {(asset.locationName || (asset.latitude && asset.longitude) || asset.areaSize) && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-primary text-xs sm:text-sm">
                  <span className="material-symbols-outlined text-[20px]">pin_drop</span>
                  {isId ? 'Informasi Lokasi & Lahan' : 'Location & Land Info'}
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
                {asset.areaSize && (
                  <div>
                    <span className="font-bold text-on-surface">{isId ? 'Luas Area' : 'Area Size'}:</span> {asset.areaSize} m²
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
