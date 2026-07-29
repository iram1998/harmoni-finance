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

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setStatus('Parsing configuration...');
      
      let prodConfig;
      try {
        let cleanStr = configStr;
        if (cleanStr.includes('const firebaseConfig =')) {
          cleanStr = cleanStr.split('const firebaseConfig =')[1].trim();
          if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
        }
        prodConfig = new Function('return ' + cleanStr)();
      } catch (err) {
        throw new Error('Invalid Firebase config format. Please paste the JSON-like object.');
      }

      setStatus('Connecting to Production Database...');
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
        setStatus(`Migrating ${collName}...`);
        const snapshot = await getDocs(collection(dbDev, collName));
        let count = 0;
        for (const document of snapshot.docs) {
          await setDoc(doc(dbProd, collName, document.id), document.data());
          count++;
        }
        console.log(`Migrated ${count} documents in ${collName}`);
      }

      setStatus('Migration completed successfully!');
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
      const newUid = auth.currentUser.uid;

      setIsFixingUid(true);
      setFixStatus('Mencari data...');
      
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

      for (const collName of collections) {
        setFixStatus(`Memproses ${collName}...`);
        const snapshot = await getDocs(collection(dbDev, collName));
        let count = 0;
        for (const document of snapshot.docs) {
          const data = document.data();
          if (data.userId && data.userId !== newUid) {
            await updateDoc(doc(dbDev, collName, document.id), {
              userId: newUid
            });
            count++;
            totalUpdated++;
          }
        }
        console.log(`Updated ${count} documents in ${collName}`);
      }

      setFixStatus(`Selesai! Berhasil mengambil alih ${totalUpdated} data.`);
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
          Jika data sudah berhasil dimigrasi namun tidak muncul karena ID Pengguna (UID) berubah, gunakan tombol ini untuk menghubungkan semua data ke akun yang sedang login saat ini.
        </p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleFixUid}
            disabled={isFixingUid}
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
