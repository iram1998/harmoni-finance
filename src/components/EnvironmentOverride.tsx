import React, { useState, useEffect } from 'react';
import { isAIStudio, isVercel } from '../lib/firebase';
import { Card } from './ui/Card';

export function EnvironmentOverride() {
  const [isOverride, setIsOverride] = useState(false);
  const [configStr, setConfigStr] = useState('');
  
  useEffect(() => {
    setIsOverride(localStorage.getItem('override_sandbox_db') === 'true');
    setConfigStr(localStorage.getItem('sandbox_override_config') || '');
  }, []);

  const handleSave = () => {
    if (isOverride && !configStr.trim()) {
      alert("Config tidak boleh kosong jika override diaktifkan");
      return;
    }
    
    // validate JSON
    if (isOverride) {
      try {
        JSON.parse(configStr);
      } catch(e) {
        alert("Config harus berupa format JSON yang valid. Silakan hapus nama variabel dan pastikan properti dikutip ganda.");
        return;
      }
    }
    
    localStorage.setItem('override_sandbox_db', isOverride ? 'true' : 'false');
    localStorage.setItem('sandbox_override_config', configStr);
    
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
          Developer: Override Database (Sandbox Only)
        </h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Gunakan fitur ini untuk mengetes aplikasi dengan <strong>Database Production</strong> Anda, langsung dari dalam Sandbox AI Studio, tanpa harus deploy ke Vercel.
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => setIsOverride(e.target.checked)}
              className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
            />
            <span className="font-medium text-sm">Gunakan Database Override (Production)</span>
          </label>

          {isOverride && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="font-label-sm text-on-surface-variant mb-1 block">Konfigurasi Firebase Production (Format JSON Valid)</label>
              <textarea
                value={configStr}
                onChange={(e) => setConfigStr(e.target.value)}
                placeholder='{\n  "projectId": "...", \n  "appId": "...", \n  "apiKey": "...", \n  "authDomain": "...", \n  "firestoreDatabaseId": "...", \n  "storageBucket": "...", \n  "messagingSenderId": "..."\n}'
                className="w-full h-48 p-3 bg-surface border border-outline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-error mt-2">
                Pastikan formatnya JSON valid (gunakan tanda kutip ganda <code>"</code> untuk key).
              </p>
            </div>
          )}

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
