import React, { useState, useEffect } from 'react';
import { isAIStudio } from '../lib/firebase';
import { Card } from './ui/Card';

export function EnvironmentOverride() {
  const [isOverride, setIsOverride] = useState(false);
  
  useEffect(() => {
    setIsOverride(localStorage.getItem('override_sandbox_db') === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('override_sandbox_db', isOverride ? 'true' : 'false');
    
    alert("Berhasil disimpan! Aplikasi akan dimuat ulang.");
    window.location.reload();
  };

  if (!isAIStudio) {
    return null; // Only show in AI Studio
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Card variant="elevated" className="p-6 border border-primary/20 bg-primary/5">
        <h3 className="font-headline-sm font-bold text-primary mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">api</span>
          Developer: Switch ke Database Production
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Karena Anda sudah menyimpan <code>VITE_FIREBASE_*</code> di Secret AI Studio, Anda dapat langsung beralih ke Database Production tanpa menginput konfigurasi manual.
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => setIsOverride(e.target.checked)}
              className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
            />
            <span className="font-medium text-sm">Gunakan Database Production (Baca dari Secret)</span>
          </label>

          <div className="pt-4 border-t border-outline-variant">
            <button
              onClick={handleSave}
              className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Simpan & Muat Ulang
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
