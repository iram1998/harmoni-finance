import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/Button';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { parseCombinedCoordinates, decimalToDMS } from '../utils';

interface AssetMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  onSelectLocation: (lat: number, lng: number, addressName?: string) => void;
}

export function AssetMapPickerModal({
  isOpen,
  onClose,
  initialLat = -6.2088, // Default Jakarta
  initialLng = 106.8456,
  onSelectLocation,
}: AssetMapPickerModalProps) {
  const { language } = useThemeLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [address, setAddress] = useState<string>('');
  const [isLoadingGPS, setIsLoadingGPS] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [initialLat, initialLng, isOpen]);

  // Initialize map when modal is open
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Small delay to ensure modal DOM container is fully sized
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      if (!leafletMap.current) {
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 14,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom Marker Icon
        const customIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `
            <div style="background-color: #2563eb; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
              <span class="material-symbols-outlined" style="font-size: 20px;">location_on</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        markerRef.current = marker;

        // On marker drag
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          setLat(Number(position.lat.toFixed(6)));
          setLng(Number(position.lng.toFixed(6)));
          fetchAddress(position.lat, position.lng);
        });

        // On map click
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          setLat(Number(clickLat.toFixed(6)));
          setLng(Number(clickLng.toFixed(6)));
          marker.setLatLng([clickLat, clickLng]);
          fetchAddress(clickLat, clickLng);
        });

        leafletMap.current = map;
      } else {
        leafletMap.current.invalidateSize();
        leafletMap.current.setView([lat, lng], 14);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Clean up map on unmount/close
  useEffect(() => {
    if (!isOpen && leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
      markerRef.current = null;
    }
  }, [isOpen]);

  // Reverse Geocode
  const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch {
      // Ignore geocode failure
    }
  };

  // Get current GPS
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert(language === 'id' ? 'Browser tidak mendukung GPS' : 'Browser does not support GPS');
      return;
    }
    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLoadingGPS(false);
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);

        if (leafletMap.current) {
          leafletMap.current.setView([newLat, newLng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        }
        fetchAddress(newLat, newLng);
      },
      (err) => {
        setIsLoadingGPS(false);
        console.error("GPS error:", err);
        alert(language === 'id' ? 'Gagal mendeteksi lokasi GPS' : 'Failed to get GPS location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address or DMS Coordinates
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // 1. Check if user pasted/entered combined DMS or Decimal coordinates (e.g. 2°51'34.52"S 114°54'5.49"E)
    const parsedCoords = parseCombinedCoordinates(searchQuery);
    if (parsedCoords) {
      const newLat = Number(parsedCoords.lat.toFixed(6));
      const newLng = Number(parsedCoords.lng.toFixed(6));
      setLat(newLat);
      setLng(newLng);

      if (leafletMap.current) {
        leafletMap.current.setView([newLat, newLng], 16);
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      }
      fetchAddress(newLat, newLng);
      setIsSearching(false);
      return;
    }

    // 2. Otherwise query Nominatim geocoder
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const result = data[0];
          const newLat = Number(parseFloat(result.lat).toFixed(6));
          const newLng = Number(parseFloat(result.lon).toFixed(6));

          setLat(newLat);
          setLng(newLng);
          setAddress(result.display_name || searchQuery);

          if (leafletMap.current) {
            leafletMap.current.setView([newLat, newLng], 15);
          }
          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
          }
        } else {
          alert(language === 'id' ? 'Lokasi atau koordinat tidak ditemukan' : 'Location or coordinates not found');
        }
      }
    } catch (err) {
      console.error("Search location error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(lat, lng, address);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">pin_drop</span>
            <div>
              <h3 className="font-title-md font-bold text-on-surface text-base sm:text-lg">
                {language === 'id' ? 'Pilih Lokasi Aset di Peta' : 'Select Asset Location on Map'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {language === 'id' ? 'Klik pada peta atau geser pin ke posisi tanah/aset' : 'Click on map or drag pin to property location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search & GPS Bar */}
        <div className="p-3 bg-surface border-b border-outline-variant flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearchAddress} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder={language === 'id' ? 'Cari alamat, nama tempat, atau koordinat DMS (misal: 2°51\'34.52"S 114°54\'5.49"E)...' : 'Search address or DMS coordinates (e.g. 2°51\'34.52"S 114°54\'5.49"E)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs sm:text-sm focus:outline-hidden focus:border-primary"
            />
            <Button type="submit" variant="secondary" className="whitespace-nowrap px-3 text-xs font-bold" disabled={isSearching}>
              {isSearching ? '...' : (language === 'id' ? 'Cari / Go' : 'Search')}
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetGPS}
            disabled={isLoadingGPS}
            className="text-xs flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            {isLoadingGPS ? 'GPS...' : (language === 'id' ? 'Lokasi Saya' : 'My Location')}
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[380px] bg-surface-container-low">
          <div ref={mapRef} className="absolute inset-0 z-10 w-full h-full" />
        </div>

        {/* Selected Coordinates & Address Footer */}
        <div className="p-4 bg-surface border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto text-xs text-on-surface-variant flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 font-medium text-on-surface">
              <span><strong className="text-primary">Desimal:</strong> {lat}, {lng}</span>
              <span className="text-outline">|</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                <strong>DMS:</strong> {decimalToDMS(lat, true)} {decimalToDMS(lng, false)}
              </span>
            </div>
            {address && (
              <p className="line-clamp-1 text-[11px] text-on-surface-variant max-w-md">
                📍 {address}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs">
              {language === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button variant="primary" onClick={handleConfirm} className="flex-1 sm:flex-none text-xs font-bold">
              {language === 'id' ? 'Gunakan Lokasi Ini' : 'Use This Location'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
