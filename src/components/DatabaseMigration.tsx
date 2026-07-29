import React, { useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db as dbDev } from '../lib/firebase';

export function DatabaseMigration() {
  const [configStr, setConfigStr] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState('');

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setStatus('Parsing configuration...');
      
      let prodConfig;
      try {
        // Strip out the variable assignment if they pasted the whole const ... = { ... }
        let cleanStr = configStr;
        if (cleanStr.includes('const firebaseConfig =')) {
          cleanStr = cleanStr.split('const firebaseConfig =')[1].trim();
          if (cleanStr.endsWith(';')) cleanStr = cleanStr.slice(0, -1);
        }
        // Use Function to evaluate the object literal
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

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant mt-6">
      <h3 className="font-headline-sm font-bold text-on-surface mb-2">Migrasi Database ke Production (Vercel)</h3>
      <p className="text-sm text-on-surface-variant mb-4">
        Tempelkan <code>firebaseConfig</code> dari project baru (Production) Anda di bawah ini untuk menyalin semua data transaksi dari database Sandbox/Dev ke database Production.
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
  );
}
