import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db as dbDev, auth } from '../lib/firebase';

export function DatabaseMigration() {
  const [configStr, setConfigStr] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState('');
  const [isFixingUid, setIsFixingUid] = useState(false);
  const [fixStatus, setFixStatus] = useState('');

  const parseConfig = () => {
    let cleanStr = configStr;
    if (cleanStr.includes('const firebaseConfig =')) {
      cleanStr = cleanStr.split('const firebaseConfig =')[1].trim();
      if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
    }
    return new Function('return ' + cleanStr)();
  };

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setStatus('Parsing configuration...');
      
      let prodConfig;
      try {
        prodConfig = parseConfig();
      } catch (err) {
        throw new Error('Format config Firebase tidak valid. Pastikan Anda menempelkan object JSON dengan benar.');
      }

      setStatus('Menghubungkan ke Database Production...');
      const appProd = initializeApp(prodConfig, 'prod_migration_' + Date.now());
      const dbProd = getFirestore(appProd);

      const collections = [
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

      for (const collName of collections) {
        setStatus(`Migrasi ${collName}...`);
        const snapshot = await getDocs(collection(dbDev, collName));
        let count = 0;
        for (const document of snapshot.docs) {
          await setDoc(doc(dbProd, collName, document.id), document.data());
          count++;
        }
        console.log(`Migrated ${count} documents in ${collName}`);
      }

      setStatus('Migrasi selesai dengan sukses!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFixUid = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Anda harus login terlebih dahulu.');
      }
      
      let prodConfig;
      try {
        prodConfig = parseConfig();
      } catch (err) {
        throw new Error('Format config Firebase tidak valid. Tempelkan config dari project Production Anda terlebih dahulu.');
      }

      const newUid = auth.currentUser.uid;

      setIsFixingUid(true);
      setFixStatus('Menghubungkan ke Database Production...');
      
      const appProd = initializeApp(prodConfig, 'prod_fixuid_' + Date.now());
      const dbProd = getFirestore(appProd);
      
      const collections = [
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

      let totalUpdated = 0;
      let totalFound = 0;

      for (const collName of collections) {
        setFixStatus(`Memproses ${collName}...`);
        const snapshot = await getDocs(collection(dbProd, collName));
        totalFound += snapshot.docs.length;
        
        let count = 0;
        for (const document of snapshot.docs) {
          const data = document.data();
          if (data.userId && data.userId !== newUid) {
            await updateDoc(doc(dbProd, collName, document.id), {
              userId: newUid
            });
            count++;
            totalUpdated++;
          }
        }
        console.log(`Updated ${count} documents in ${collName}`);
      }

      setFixStatus(`Selesai! Dari total ${totalFound} data di DB, berhasil memperbarui UID pada ${totalUpdated} data.`);
    } catch (err: any) {
      console.error(err);
      setFixStatus(`Error: ${err.message}`);
    } finally {
      setIsFixingUid(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant">
        <h3 className="font-headline-sm font-bold text-on-surface mb-2">Migrasi Database ke Production (Vercel)</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Tempelkan <code>firebaseConfig</code> dari project baru (Production) Anda di bawah ini untuk menyalin semua data dari database Sandbox/Dev ke database Production.
        </p>
        
        <textarea
          value={configStr}
          onChange={(e) => setConfigStr(e.target.value)}
          placeholder="{\n  apiKey: '...', \n  authDomain: '...', \n  ...\n}"
          className="w-full h-40 p-3 bg-surface border border-outline rounded-xl font-mono text-xs mb-4 focus:outline-none focus:border-primary"
        />
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleMigrate}
            disabled={isMigrating || !configStr.trim()}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {isMigrating ? 'Memigrasi Data...' : 'Mulai Migrasi Data'}
          </button>
          {status && (
            <span className={`text-sm font-bold ${status.includes('Error') ? 'text-error' : 'text-primary'}`}>
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="bg-primary-container/20 p-6 rounded-2xl border border-primary/30">
        <h3 className="font-headline-sm font-bold text-on-surface mb-2">Ambil Alih Data Hasil Migrasi (Fix UID)</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          PENTING: Pastikan Anda sudah login ke akun Google Anda, lalu tempelkan <code>firebaseConfig</code> Production di kotak teks atas, kemudian klik tombol di bawah ini.
        </p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleFixUid}
            disabled={isFixingUid || !configStr.trim()}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {isFixingUid ? 'Memproses...' : 'Ambil Alih Data Sekarang'}
          </button>
          {fixStatus && (
            <span className={`text-sm font-bold ${fixStatus.includes('Error') ? 'text-error' : 'text-primary'}`}>
              {fixStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
