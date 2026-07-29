import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db as dbDev } from '../lib/firebase';

export function DatabaseMigration() {
  const [configStr, setConfigStr] = useState('');
  const [uidMappingStr, setUidMappingStr] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearStatus, setClearStatus] = useState('');

  const parseConfig = () => {
    let cleanStr = configStr;
    if (cleanStr.includes('const firebaseConfig =')) {
      cleanStr = cleanStr.split('const firebaseConfig =')[1].trim();
      if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
    }
    return new Function('return ' + cleanStr)();
  };

  const COLLECTIONS = [
    'activity_logs', 
    'family_members', 
    'transactions', 
    'envelopes', 
    'goals', 
    'bills', 
    'categories', 
    'assets', 
    'payment_accounts'
  ];

  const handleClearProd = async () => {
    try {
      if (!confirm('AWAS! Ini akan MENGHAPUS SEMUA DATA di database Production Anda. Anda yakin?')) return;
      
      setIsClearing(true);
      setClearStatus('Menghubungkan ke Production...');
      const prodConfig = parseConfig();
      const appProd = initializeApp(prodConfig, 'prod_clear_' + Date.now());
      const dbProd = getFirestore(appProd);

      let totalDeleted = 0;
      for (const collName of COLLECTIONS) {
        setClearStatus(`Menghapus koleksi ${collName}...`);
        const snapshot = await getDocs(collection(dbProd, collName));
        for (const document of snapshot.docs) {
          await deleteDoc(doc(dbProd, collName, document.id));
          totalDeleted++;
        }
      }
      setClearStatus(`Selesai! Berhasil menghapus ${totalDeleted} dokumen di Production.`);
    } catch (err: any) {
      console.error(err);
      setClearStatus(`Error: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setStatus('Menyiapkan migrasi...');
      
      const prodConfig = parseConfig();
      const appProd = initializeApp(prodConfig, 'prod_migration_' + Date.now());
      const dbProd = getFirestore(appProd);

      let totalMigrated = 0;

      for (const collName of COLLECTIONS) {
        setStatus(`Migrasi ${collName}...`);
        const snapshot = await getDocs(collection(dbDev, collName));
        for (const document of snapshot.docs) {
          const data = document.data();
          
          // Ganti userId berdasarkan mapping JSON
          let updatedData = { ...data };
          if (uidMappingStr && updatedData.userId) {
            try {
              const mapping = JSON.parse(uidMappingStr);
              if (mapping[updatedData.userId]) {
                updatedData.userId = mapping[updatedData.userId];
              }
            } catch (e) {
              // Abaikan jika bukan JSON valid, biarkan apa adanya
            }
          }

          await setDoc(doc(dbProd, collName, document.id), updatedData);
          totalMigrated++;
        }
      }

      setStatus(`Migrasi selesai! ${totalMigrated} data berhasil dipindahkan ke Production.`);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant">
        <h3 className="font-headline-sm font-bold text-on-surface mb-2">Alat Migrasi Database Cerdas</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Jalankan alat ini di <strong>versi Sandbox (AI Studio)</strong>. Alat ini memungkinkan Anda menghapus data lama di Production dan menyalin ulang dari Sandbox dengan pemetaan ID User (UID).
        </p>

        <div className="space-y-4">
          <div>
            <label className="font-label-sm text-on-surface-variant mb-1 block">1. Config Firebase Production (Vercel)</label>
            <textarea
              value={configStr}
              onChange={(e) => setConfigStr(e.target.value)}
              placeholder="{\n  apiKey: '...', \n  authDomain: '...', \n  ...\n}"
              className="w-full h-32 p-3 bg-surface border border-outline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 border-t border-outline-variant">
            <button
              onClick={handleClearProd}
              disabled={isClearing || !configStr.trim()}
              className="bg-error/10 text-error hover:bg-error/20 px-4 py-2 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              {isClearing ? 'Menghapus...' : 'Kosongkan Database Production (Reset)'}
            </button>
            {clearStatus && <p className="text-sm mt-2 font-medium text-on-surface-variant">{clearStatus}</p>}
          </div>

          <div className="pt-2 border-t border-outline-variant">
            <label className="font-label-sm text-on-surface-variant mb-1 block">2. Pemetaan UID (Opsional, Format JSON)</label>
            <p className="text-xs text-on-surface-variant mb-2">Gunakan format JSON untuk mengganti UID lama dari Sandbox dengan UID baru di Production (Hanya untuk dokumen yang cocok).</p>
            <textarea
              value={uidMappingStr}
              onChange={(e) => setUidMappingStr(e.target.value)}
              placeholder="{\n  &#34;UID_LAMA_SANDBOX_1&#34;: &#34;UID_BARU_PRODUCTION_1&#34;,\n  &#34;UID_LAMA_SANDBOX_2&#34;: &#34;UID_BARU_PRODUCTION_2&#34;\n}"
              className="w-full h-32 p-3 bg-surface border border-outline rounded-xl font-mono text-xs focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleMigrate}
              disabled={isMigrating || !configStr.trim()}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {isMigrating ? 'Memigrasi Data...' : 'Mulai Migrasi Data & Replace UID'}
            </button>
            {status && (
              <p className={`text-sm mt-2 font-bold ${status.includes('Error') ? 'text-error' : 'text-primary'}`}>
                {status}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
