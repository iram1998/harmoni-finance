import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Asset } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { formatCurrency, getAssetEffectiveValue } from '../utils';
import { useFinance } from '../store';
import { Button } from './ui/Button';

interface AssetMapViewProps {
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

export function AssetMapView({ assets, onSelectAsset }: AssetMapViewProps) {
  const { language } = useThemeLanguage();
  const { transactions } = useFinance();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Filter assets that have valid lat/lng
  const mappedAssets = assets.filter(
    (a) => typeof a.latitude === 'number' && typeof a.longitude === 'number' && !isNaN(a.latitude) && !isNaN(a.longitude)
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Default center (Indonesia or average of assets)
    let centerLat = -6.2088;
    let centerLng = 106.8456;
    let zoomLevel = 6;

    if (mappedAssets.length > 0) {
      const sumLat = mappedAssets.reduce((sum, a) => sum + (a.latitude || 0), 0);
      const sumLng = mappedAssets.reduce((sum, a) => sum + (a.longitude || 0), 0);
      centerLat = sumLat / mappedAssets.length;
      centerLng = sumLng / mappedAssets.length;
      zoomLevel = mappedAssets.length === 1 ? 14 : 10;
    }

    if (!leafletMap.current) {
      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom: zoomLevel,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
    } else {
      leafletMap.current.invalidateSize();
    }

    const map = leafletMap.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    // Add new markers
    mappedAssets.forEach((asset) => {
      if (!asset.latitude || !asset.longitude) return;

      const isLandOrProperty = asset.category.toLowerCase().includes('properti') || asset.category.toLowerCase().includes('lahan');
      const pinColor = isLandOrProperty ? '#10b981' : '#2563eb';
      const iconName = isLandOrProperty ? 'home_work' : (asset.category.toLowerCase().includes('kendaraan') ? 'directions_car' : 'pin_drop');

      const customIcon = L.divIcon({
        className: 'asset-map-pin',
        html: `
          <div style="background-color: ${pinColor}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: 3px solid white; transition: transform 0.2s;">
            <span class="material-symbols-outlined" style="font-size: 22px;">${iconName}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([asset.latitude, asset.longitude], { icon: customIcon }).addTo(map);

      // Popup Content
      const photoHtml = asset.imageUrl
        ? `<img src="${asset.imageUrl}" alt="${asset.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px 8px 0 0; margin-bottom: 8px;" />`
        : '';

      const valueText = formatCurrency(getAssetEffectiveValue(asset, assets, transactions));
      const areaText = asset.areaSize
        ? asset.category.includes('Usaha') || asset.category.includes('Bisnis')
          ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">🤝 Kepemilikan: <b>${asset.areaSize}%</b></div>`
          : asset.category.includes('Properti') || asset.category.includes('Lahan')
          ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">📐 Luas: <b>${asset.areaSize} m²</b></div>`
          : `<div style="font-size: 11px; color: #475569; margin-top: 2px;"><b>${asset.areaSize}</b></div>`
        : '';
      const locText = asset.locationName ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">📍 ${asset.locationName}</div>` : '';

      const popupHtml = `
        <div style="width: 220px; font-family: sans-serif; padding: 2px;">
          ${photoHtml}
          <div style="padding: 2px 4px;">
            <div style="display: inline-block; background-color: #e2e8f0; color: #334155; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase;">
              ${asset.category}
            </div>
            <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">${asset.name}</h4>
            <div style="font-size: 13px; font-weight: 800; color: #059669; margin-top: 4px;">${valueText}</div>
            ${locText}
            ${areaText}
            <div style="margin-top: 10px; display: flex; gap: 4px;">
              <a href="https://www.google.com/maps?q=${asset.latitude},${asset.longitude}" target="_blank" rel="noreferrer" style="flex: 1; text-align: center; background-color: #f1f5f9; color: #2563eb; font-size: 11px; font-weight: bold; padding: 6px; border-radius: 6px; text-decoration: none;">
                Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedAssetId(asset.id);
      });

      markersRef.current[asset.id] = marker;
    });

    if (mappedAssets.length > 0 && map) {
      const group = L.featureGroup(Object.values(markersRef.current));
      if (group.getBounds().isValid()) {
        map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [assets]);

  const handleFocusAsset = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    if (leafletMap.current && asset.latitude && asset.longitude) {
      leafletMap.current.setView([asset.latitude, asset.longitude], 15, { animate: true });
      const marker = markersRef.current[asset.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[600px] w-full rounded-2xl overflow-hidden border border-outline-variant bg-surface shadow-md">
      {/* Sidebar List of Mapped Assets */}
      <div className="w-full lg:w-80 h-48 lg:h-full bg-surface-container-low border-b lg:border-b-0 lg:border-r border-outline-variant flex flex-col overflow-hidden">
        <div className="p-3 bg-surface border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">map</span>
            <span className="font-title-sm font-bold text-on-surface text-xs sm:text-sm">
              {language === 'id' ? 'Aset Terlokasi' : 'Mapped Assets'} ({mappedAssets.length})
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-outline-variant/30">
          {mappedAssets.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant text-xs flex flex-col items-center justify-center h-full">
              <span className="material-symbols-outlined text-outline text-[32px] mb-2">wrong_location</span>
              <p className="font-medium">
                {language === 'id' ? 'Belum ada aset dengan koordinat lokasi.' : 'No assets with location coordinates yet.'}
              </p>
              <p className="text-[11px] text-outline mt-1">
                {language === 'id' ? 'Tambahkan koordinat atau lokasi saat memasukkan aset baru.' : 'Add coordinates or location when adding an asset.'}
              </p>
            </div>
          ) : (
            mappedAssets.map((asset) => {
              const isSelected = selectedAssetId === asset.id;
              return (
                <div
                  key={asset.id}
                  onClick={() => handleFocusAsset(asset)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex gap-3 items-center ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/30 shadow-xs'
                      : 'hover:bg-surface-container-high border border-transparent'
                  }`}
                >
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-outline-variant"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[24px]">
                        {asset.category.toLowerCase().includes('properti') ? 'home_work' : 'pin_drop'}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="font-title-sm font-bold text-on-surface text-xs truncate">
                        {asset.name}
                      </h5>
                      <span className="text-[10px] uppercase font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded-xs">
                        {asset.workspaceId}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                      {formatCurrency(getAssetEffectiveValue(asset, assets, transactions))}
                    </p>
                    {asset.locationName && (
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                        {asset.locationName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="flex-1 h-full relative bg-surface-container-low min-h-[350px]">
        <div ref={mapRef} className="absolute inset-0 w-full h-full z-10" />

        {/* Selected Asset Floating Quick Action */}
        {selectedAssetId && (
          <div className="absolute bottom-4 right-4 z-20 bg-surface/95 backdrop-blur-md p-3 rounded-xl border border-outline-variant shadow-xl max-w-xs flex items-center justify-between gap-3 animate-fade-in">
            {(() => {
              const sel = assets.find((a) => a.id === selectedAssetId);
              if (!sel) return null;
              return (
                <>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-outline">Aset Terpilih</p>
                    <h5 className="font-bold text-xs text-on-surface truncate">{sel.name}</h5>
                  </div>
                  {onSelectAsset && (
                    <Button
                      variant="primary"
                      className="text-xs px-3 py-1 font-bold whitespace-nowrap cursor-pointer shrink-0"
                      onClick={() => onSelectAsset(sel)}
                    >
                      {language === 'id' ? 'Detail' : 'Details'}
                    </Button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
