import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkspaceType, Transaction, Envelope, Goal, Bill, TransactionCategory, FamilyMember, Asset, ActivityLog, PaymentAccount } from './types';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithPopup, 
  googleProvider, 
  firebaseSignOut, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  query, 
  where,
  User 
} from './lib/firebase';

interface FinanceState {
  workspace: WorkspaceType;
  setWorkspace: (w: WorkspaceType) => void;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  envelopes: Envelope[];
  addEnvelope: (e: Omit<Envelope, 'id'>) => Promise<void>;
  updateEnvelope: (id: string, e: Partial<Envelope>) => Promise<void>;
  deleteEnvelope: (id: string) => Promise<void>;
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number) => Promise<void>;
  bills: Bill[];
  addBill: (b: Omit<Bill, 'id'>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  markBillPaid: (id: string) => Promise<void>;
  customCategories: TransactionCategory[];
  addCategory: (name: string, type: 'income' | 'expense', color?: string) => Promise<void>;
  updateCategory: (id: string, name: string, type: 'income' | 'expense', color?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  familyMembers: FamilyMember[];
  addFamilyMember: (name: string, role: string, monthlyBudget: number, email?: string) => Promise<void>;
  updateFamilyMember: (id: string, name: string, role: string, monthlyBudget: number, email?: string) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  paymentAccounts: PaymentAccount[];
  addPaymentAccount: (name: string, type: 'bank' | 'ewallet' | 'cash' | 'investment', balance: number, accountNumber?: string, holderName?: string, color?: string, wsId?: WorkspaceType) => Promise<void>;
  updatePaymentAccount: (id: string, name: string, type: 'bank' | 'ewallet' | 'cash' | 'investment', balance: number, accountNumber?: string, holderName?: string, color?: string, wsId?: WorkspaceType) => Promise<void>;
  deletePaymentAccount: (id: string) => Promise<void>;
  assets: Asset[];
  addAsset: (
    name: string,
    category: string,
    purchasePrice: number,
    currentValue: number,
    purchaseDate: string,
    notes?: string,
    workspaceId?: WorkspaceType,
    depreciationMethod?: 'none' | 'straight_line' | 'declining_balance',
    depreciationUsefulLife?: number,
    depreciationSalvageValue?: number,
    useAutoDepreciation?: boolean,
    extraFields?: {
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      areaSize?: number;
    }
  ) => Promise<void>;
  updateAsset: (
    id: string,
    name: string,
    category: string,
    purchasePrice: number,
    currentValue: number,
    purchaseDate: string,
    notes?: string,
    status?: 'owned' | 'sold' | 'liquidated',
    workspaceId?: WorkspaceType,
    depreciationMethod?: 'none' | 'straight_line' | 'declining_balance',
    depreciationUsefulLife?: number,
    depreciationSalvageValue?: number,
    useAutoDepreciation?: boolean,
    extraFields?: {
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      areaSize?: number;
    }
  ) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  activityLogs: ActivityLog[];
  logActivity: (action: 'CREATE' | 'UPDATE' | 'DELETE', entityType: ActivityLog['entityType'], title: string, details: string, wsId?: WorkspaceType) => Promise<void>;
  deleteActivityLog: (id: string) => Promise<void>;
  clearActivityLogs: () => Promise<void>;
  autoCleanActivityLogs: (daysThreshold: number) => Promise<number>;
  user: User | null;
  superAdminId: string | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isTransactionModalOpen: boolean;
  openTransactionModal: (defaultCategory?: string) => void;
  closeTransactionModal: () => void;
  transactionDefaultCategory?: string;
  isTransferModalOpen: boolean;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  isEnvelopeModalOpen: boolean;
  openEnvelopeModal: (target?: Envelope) => void;
  closeEnvelopeModal: () => void;
  envelopeEditTarget: Envelope | null;
  isGoalModalOpen: boolean;
  openGoalModal: () => void;
  closeGoalModal: () => void;
  isBillModalOpen: boolean;
  openBillModal: () => void;
  closeBillModal: () => void;
}

const FinanceContext = createContext<FinanceState | undefined>(undefined);

const DEFAULT_TRANSACTIONS = [
  // Workspace Keluarga - Pemasukan
  { workspaceId: 'keluarga', type: 'income', amount: 18000000, category: 'Gaji Bulanan', date: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Gaji Utama Suami & Istri', incomeCategory: 'fixed' },
  { workspaceId: 'keluarga', type: 'income', amount: 4500000, category: 'Bonus & Tunjangan', date: new Date(Date.now() - 86400000 * 5).toISOString(), description: 'Bonus Kinerja Proyek', incomeCategory: 'variable' },
  { workspaceId: 'keluarga', type: 'income', amount: 2500000, category: 'Proyek Freelance', date: new Date(Date.now() - 86400000 * 10).toISOString(), description: 'Hasil Usaha Sampingan Toko', incomeCategory: 'variable' },

  // Workspace Keluarga - Pengeluaran
  { workspaceId: 'keluarga', type: 'expense', amount: 2800000, category: 'Belanja Supermarket', date: new Date(Date.now() - 86400000 * 1).toISOString(), description: 'Belanja Sembako & Perlengkapan Bulanan' },
  { workspaceId: 'keluarga', type: 'expense', amount: 1100000, category: 'Tagihan & Utilitas', date: new Date(Date.now() - 86400000 * 3).toISOString(), description: 'Bayar Listrik PLN & Air PAM' },
  { workspaceId: 'keluarga', type: 'expense', amount: 450000, category: 'Tagihan & Utilitas', date: new Date(Date.now() - 86400000 * 4).toISOString(), description: 'Tagihan Internet Biznet & TV Kabel' },
  { workspaceId: 'keluarga', type: 'expense', amount: 2200000, category: 'Pendidikan', date: new Date(Date.now() - 86400000 * 6).toISOString(), description: 'SPP Sekolah Anak & Biaya Les' },
  { workspaceId: 'keluarga', type: 'expense', amount: 650000, category: 'Transportasi', date: new Date(Date.now() - 86400000 * 7).toISOString(), description: 'Isi Bensin Mobil & Saldo e-Toll' },
  { workspaceId: 'keluarga', type: 'expense', amount: 1200000, category: 'Kesehatan', date: new Date(Date.now() - 86400000 * 8).toISOString(), description: 'Asuransi Kesehatan & BPJS Keluarga' },
  { workspaceId: 'keluarga', type: 'expense', amount: 480000, category: 'Makan & Minum', date: new Date(Date.now() - 86400000 * 9).toISOString(), description: 'Makan Bersama Akhir Pekan' },
  { workspaceId: 'keluarga', type: 'expense', amount: 450000, category: 'Zakat & Sedekah', date: new Date(Date.now() - 86400000 * 11).toISOString(), description: 'Zakat Maal & Sedekah Subuh' },

  // Workspace Pribadi - Pemasukan & Pengeluaran
  { workspaceId: 'pribadi', type: 'income', amount: 6000000, category: 'Gaji Bulanan', date: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Alokasi Pengeluaran Pribadi', incomeCategory: 'fixed' },
  { workspaceId: 'pribadi', type: 'income', amount: 850000, category: 'Cashback & Dividen', date: new Date(Date.now() - 86400000 * 4).toISOString(), description: 'Hasil Reksadana & Cashback e-Wallet', incomeCategory: 'variable' },
  { workspaceId: 'pribadi', type: 'expense', amount: 186000, category: 'Streaming & Internet', date: new Date(Date.now() - 86400000 * 1).toISOString(), description: 'Langganan Spotify & Netflix' },
  { workspaceId: 'pribadi', type: 'expense', amount: 350000, category: 'Pendidikan', date: new Date(Date.now() - 86400000 * 3).toISOString(), description: 'Beli Buku & Kursus Online' },
  { workspaceId: 'pribadi', type: 'expense', amount: 210000, category: 'Makan & Minum', date: new Date(Date.now() - 86400000 * 5).toISOString(), description: 'Kopi & Nongkrong kafe' },
  { workspaceId: 'pribadi', type: 'expense', amount: 300000, category: 'Transportasi', date: new Date(Date.now() - 86400000 * 6).toISOString(), description: 'Top up GoPay & OVO' },
  { workspaceId: 'pribadi', type: 'expense', amount: 400000, category: 'Hobi & Hiburan', date: new Date(Date.now() - 86400000 * 8).toISOString(), description: 'Membership Gym & Olahraga' },
];

const DEFAULT_ENVELOPES = [
  { workspaceId: 'keluarga', category: 'Kebutuhan Dapur', allocatedAmount: 3000000 },
  { workspaceId: 'keluarga', category: 'Cicilan', allocatedAmount: 4000000 },
  { workspaceId: 'keluarga', category: 'Transportasi', allocatedAmount: 1500000 },
  { workspaceId: 'pribadi', category: 'Hobi', allocatedAmount: 500000 },
];

const DEFAULT_GOALS = [
  { workspaceId: 'keluarga', name: 'Dana Darurat', targetAmount: 50000000, currentAmount: 12500000, deadline: '2025-12-31' },
  { workspaceId: 'keluarga', name: 'Renovasi Rumah', targetAmount: 20000000, currentAmount: 18000000, deadline: '2024-10-01' },
  { workspaceId: 'pribadi', name: 'Gitar Baru', targetAmount: 5000000, currentAmount: 1000000, deadline: '2024-12-01' }
];

const DEFAULT_BILLS = [
  { workspaceId: 'keluarga', name: 'Listrik PLN', amount: 850000, dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), isPaid: false },
  { workspaceId: 'keluarga', name: 'Internet Biznet', amount: 450000, dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), isPaid: false },
  { workspaceId: 'pribadi', name: 'Langganan Spotify', amount: 54000, dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), isPaid: false }
];

const DEFAULT_CATEGORIES = [
  { name: 'Kebutuhan Dapur', type: 'expense', color: '#2563eb' },
  { name: 'Belanja Supermarket', type: 'expense', color: '#10b981' },
  { name: 'Transportasi', type: 'expense', color: '#f59e0b' },
  { name: 'Cicilan & Utang', type: 'expense', color: '#ef4444' },
  { name: 'Makan & Minum', type: 'expense', color: '#ec4899' },
  { name: 'Tagihan & Utilitas', type: 'expense', color: '#8b5cf6' },
  { name: 'Pendidikan', type: 'expense', color: '#6366f1' },
  { name: 'Kesehatan', type: 'expense', color: '#14b8a6' },
  { name: 'Hobi & Hiburan', type: 'expense', color: '#f43f5e' },
  { name: 'Zakat & Sedekah', type: 'expense', color: '#059669' },
  { name: 'Streaming & Internet', type: 'expense', color: '#06b6d4' },
  { name: 'Gaji Bulanan', type: 'income', color: '#10b981' },
  { name: 'Proyek Freelance', type: 'income', color: '#06b6d4' },
  { name: 'Bonus & Tunjangan', type: 'income', color: '#2563eb' },
  { name: 'Hasil Investasi', type: 'income', color: '#f59e0b' },
  { name: 'Penjualan & Bisnis', type: 'income', color: '#ec4899' },
  { name: 'Cashback & Dividen', type: 'income', color: '#8b5cf6' }
];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceType>('keluarga');
  const [user, setUser] = useState<User | null>(null);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customCategories, setCustomCategories] = useState<TransactionCategory[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Helper to determine which userId to use for writing based on workspace
  const getTargetUserId = (wsId?: WorkspaceType) => {
    if (!user) return '';
    return (wsId === 'keluarga' && superAdminId) ? superAdminId : user.uid;
  };

  // Activity Log Writer Helper
  const logActivity = async (
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: ActivityLog['entityType'],
    title: string,
    details: string,
    wsId?: WorkspaceType
  ) => {
    if (!user) return;
    try {
      const targetUid = getTargetUserId(wsId || workspace);
      await addDoc(collection(db, 'activity_logs'), {
        userId: targetUid,
        workspaceId: wsId || workspace,
        action,
        entityType,
        title,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error writing activity log:", err);
    }
  };

  // 1. Listen to Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Find if user is a family member to get superAdminId
        if (currentUser.email) {
          const fmQuery = query(collection(db, 'family_members'), where('email', '==', currentUser.email));
          try {
            const fmSnapshot = await getDocs(fmQuery);
            if (!fmSnapshot.empty) {
              setSuperAdminId(fmSnapshot.docs[0].data().userId);
            } else {
              setSuperAdminId(currentUser.uid);
            }
          } catch (e) {
             setSuperAdminId(currentUser.uid);
          }
        } else {
          setSuperAdminId(currentUser.uid);
        }
        setIsAuthLoading(false);
      } else {
        // Try anonymous sign-in, or fallback to guest user session if disabled on project
        try {
          const anonCred = await signInAnonymously(auth);
          setUser(anonCred.user);
          setSuperAdminId(anonCred.user.uid);
        } catch (err) {
          let guestId = localStorage.getItem('harmoni_guest_uid');
          if (!guestId) {
            guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('harmoni_guest_uid', guestId);
          }
          const guestUser = {
            uid: guestId,
            isAnonymous: true,
            displayName: 'Pengguna Tamu',
            email: null,
            photoURL: null,
          } as unknown as User;
          setUser(guestUser);
          setSuperAdminId(guestUser.uid);
        } finally {
          setIsAuthLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listeners for User Data
  useEffect(() => {
    if (!user || !superAdminId) {
      setTransactions([]);
      setEnvelopes([]);
      setGoals([]);
      setBills([]);
      return;
    }

    const userId = user.uid;
    const userIds = userId === superAdminId ? [userId] : [userId, superAdminId];
    
    // Helper to filter documents so users only see their private stuff and superadmin's family stuff
    const isDocAllowed = (docData: any) => {
       if (userId === superAdminId) return true; // Superadmin sees all their own stuff
       if (docData.userId === userId) return true; // Family member sees all their own stuff
       // Family member can see superadmin's stuff IF it is for the 'keluarga' workspace
       if (docData.userId === superAdminId) {
          if (docData.workspaceId === 'keluarga') return true;
          // For entities without workspaceId (like categories or family members), let them see it if they are family
          if (!docData.workspaceId) return true; 
       }
       return false;
    };

    // Transactions listener
    const qTx = query(collection(db, 'transactions'), where('userId', 'in', userIds));
    const unSubTx = onSnapshot(qTx, (snapshot) => {
      const seededKey = `harmoni_seeded_tx_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        // Seed default transactions for new user
        DEFAULT_TRANSACTIONS.forEach(t => {
          addDoc(collection(db, 'transactions'), { ...t, userId });
        });
      } else {
        const list: Transaction[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) }))
          .filter(isDocAllowed) as Transaction[];
        setTransactions(list);
      }
    });

    // Envelopes listener
    const qEnv = query(collection(db, 'envelopes'), where('userId', 'in', userIds));
    const unSubEnv = onSnapshot(qEnv, (snapshot) => {
      const seededKey = `harmoni_seeded_env_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_ENVELOPES.forEach(e => {
          addDoc(collection(db, 'envelopes'), { ...e, userId });
        });
      } else {
        const list: Envelope[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Envelope, 'id'>) }))
          .filter(isDocAllowed) as Envelope[];
        setEnvelopes(list);
      }
    });

    // Goals listener
    const qGoals = query(collection(db, 'goals'), where('userId', 'in', userIds));
    const unSubGoals = onSnapshot(qGoals, (snapshot) => {
      const seededKey = `harmoni_seeded_goals_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_GOALS.forEach(g => {
          addDoc(collection(db, 'goals'), { ...g, userId });
        });
      } else {
        const list: Goal[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Goal, 'id'>) }))
          .filter(isDocAllowed) as Goal[];
        setGoals(list);
      }
    });

    // Bills listener
    const qBills = query(collection(db, 'bills'), where('userId', 'in', userIds));
    const unSubBills = onSnapshot(qBills, (snapshot) => {
      const seededKey = `harmoni_seeded_bills_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_BILLS.forEach(b => {
          addDoc(collection(db, 'bills'), { ...b, userId });
        });
      } else {
        const list: Bill[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Bill, 'id'>) }))
          .filter(isDocAllowed) as Bill[];
        setBills(list);
      }
    });

    // Categories listener
    const qCat = query(collection(db, 'categories'), where('userId', 'in', userIds));
    const unSubCat = onSnapshot(qCat, (snapshot) => {
      const seededKey = `harmoni_seeded_categories_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_CATEGORIES.forEach(c => {
          addDoc(collection(db, 'categories'), { ...c, userId });
        });
      } else {
        const list: TransactionCategory[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<TransactionCategory, 'id'>) }))
          .filter(isDocAllowed) as TransactionCategory[];
        setCustomCategories(list);
      }
    });

    // Family Members listener
    const qFamily = query(collection(db, 'family_members'), where('userId', 'in', userIds));
    const unSubFamily = onSnapshot(qFamily, (snapshot) => {
      const seededKey = `harmoni_seeded_family_${userId}`;
      const DEFAULT_FAMILY_MEMBERS = [
        { name: 'Ahmad Ramli (Anda)', role: 'Kepala Keluarga', monthlyBudget: 5000000 },
        { name: 'Siti Aminah', role: 'Pasangan (Istri)', monthlyBudget: 4000000 },
        { name: 'Rizky', role: 'Anak Pertama', monthlyBudget: 1500000 },
        { name: 'Aisyah', role: 'Anak Kedua', monthlyBudget: 1000000 }
      ];
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_FAMILY_MEMBERS.forEach(m => {
          addDoc(collection(db, 'family_members'), { ...m, userId });
        });
      } else {
        const list: FamilyMember[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<FamilyMember, 'id'>) }))
          .filter(isDocAllowed) as FamilyMember[];
        setFamilyMembers(list);
      }
    });

    // Assets listener
    const qAssets = query(collection(db, 'assets'), where('userId', 'in', userIds));
    const unSubAssets = onSnapshot(qAssets, (snapshot) => {
      const seededKey = `harmoni_seeded_assets_${userId}`;
      const DEFAULT_ASSETS = [
        { 
          name: 'Tanah Kavling Bogor', 
          category: 'Properti / Lahan', 
          purchasePrice: 150000000, 
          currentValue: 175000000, 
          purchaseDate: '2024-05-12', 
          notes: 'Investasi masa depan keluarga', 
          status: 'owned', 
          workspaceId: 'keluarga',
          locationName: 'Kavling Harmoni Asri, Cijeruk, Bogor',
          areaSize: 250,
          latitude: -6.5971,
          longitude: 106.8060,
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
        },
        { 
          name: 'Mobil Honda Brio', 
          category: 'Kendaraan', 
          purchasePrice: 165000000, 
          currentValue: 145000000, 
          purchaseDate: '2025-02-20', 
          notes: 'Kendaraan harian keluarga', 
          status: 'owned', 
          workspaceId: 'keluarga',
          locationName: 'Garasi Rumah Utama, Tebet, Jakarta Selatan',
          latitude: -6.2297,
          longitude: 106.8471,
          imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'
        },
        { 
          name: 'Logam Mulia Antam 10g', 
          category: 'Emas / Logam Mulia', 
          purchasePrice: 12000000, 
          currentValue: 13500000, 
          purchaseDate: '2024-08-05', 
          notes: 'Tabungan dana darurat di SDB Bank', 
          status: 'owned', 
          workspaceId: 'keluarga',
          locationName: 'Safe Deposit Box, Bank Mandiri Cab. Thamrin',
          latitude: -6.1865,
          longitude: 106.8234,
          imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80'
        }
      ];
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_ASSETS.forEach(a => {
          addDoc(collection(db, 'assets'), { ...a, userId });
        });
      } else {
        const list: Asset[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Asset, 'id'>) }))
          .filter(isDocAllowed) as Asset[];
        setAssets(list);
      }
    });

    // Payment Accounts listener
    const qPayAcc = query(collection(db, 'payment_accounts'), where('userId', 'in', userIds));
    const unSubPayAcc = onSnapshot(qPayAcc, (snapshot) => {
      const seededKey = `harmoni_seeded_pay_acc_${userId}`;
      const DEFAULT_PAYMENT_ACCOUNTS = [
        { workspaceId: 'keluarga', name: 'Bank BCA Utama', type: 'bank', accountNumber: '8830192831', holderName: 'Ahmad Ramli', balance: 24500000, color: '#2563eb' },
        { workspaceId: 'keluarga', name: 'Bank Mandiri Tabungan', type: 'bank', accountNumber: '1370018293012', holderName: 'Siti Aminah', balance: 18200000, color: '#0284c7' },
        { workspaceId: 'keluarga', name: 'GoPay Keluarga', type: 'ewallet', accountNumber: '081298765432', holderName: 'Ahmad Ramli', balance: 1250000, color: '#059669' },
        { workspaceId: 'pribadi', name: 'OVO / ShopeePay', type: 'ewallet', accountNumber: '081298765432', holderName: 'Ahmad Ramli', balance: 650000, color: '#7c3aed' },
        { workspaceId: 'keluarga', name: 'Kas Tunai Dompet', type: 'cash', accountNumber: '-', holderName: 'Kas Rumah', balance: 850000, color: '#d97706' }
      ];
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_PAYMENT_ACCOUNTS.forEach(acc => {
          addDoc(collection(db, 'payment_accounts'), { ...acc, userId });
        });
      } else {
        const list: PaymentAccount[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<PaymentAccount, 'id'>) }))
          .filter(isDocAllowed) as PaymentAccount[];
        setPaymentAccounts(list);
      }
    });

    // 8. Activity Logs
    const qLogs = query(collection(db, 'activity_logs'), where('userId', 'in', userIds));
    const unSubLogs = onSnapshot(qLogs, (snapshot) => {
      const list: ActivityLog[] = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as Omit<ActivityLog, 'id'>) }))
        .filter(isDocAllowed)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as ActivityLog[];
      setActivityLogs(list);
    });

    return () => {
      unSubTx();
      unSubEnv();
      unSubGoals();
      unSubBills();
      unSubCat();
      unSubFamily();
      unSubAssets();
      unSubPayAcc();
      unSubLogs();
    };
  }, [user, superAdminId]);

  // Firestore Write Operations
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const targetUid = getTargetUserId(t.workspaceId);
    await addDoc(collection(db, 'transactions'), {
      ...t,
      userId: targetUid,
      createdAt: new Date().toISOString()
    });
    await logActivity(
      'CREATE', 
      'TRANSACTION', 
      `Transaksi Baru: ${t.description || t.category}`, 
      `${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${t.amount.toLocaleString('id-ID')} (${t.category})`, 
      t.workspaceId
    );
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const target = transactions.find(t => t.id === id);
    await deleteDoc(doc(db, 'transactions', id));
    if (target) {
      await logActivity(
        'DELETE', 
        'TRANSACTION', 
        `Hapus Transaksi: ${target.description || target.category}`, 
        `Nominal Rp ${target.amount.toLocaleString('id-ID')} (${target.type})`, 
        target.workspaceId
      );
    }
  };

  const addEnvelope = async (e: Omit<Envelope, 'id'>) => {
    if (!user) return;
    const targetUid = getTargetUserId(e.workspaceId);
    await addDoc(collection(db, 'envelopes'), {
      ...e,
      userId: targetUid
    });
    await logActivity('CREATE', 'ENVELOPE', `Amplop Anggaran Baru: ${e.category}`, `Alokasi Rp ${e.allocatedAmount.toLocaleString('id-ID')}`, e.workspaceId);
  };

  const updateEnvelope = async (id: string, e: Partial<Envelope>) => {
    if (!user) return;
    const target = envelopes.find(env => env.id === id);
    if (!target) return;
    const targetUid = getTargetUserId(e.workspaceId || target.workspaceId);
    
    await updateDoc(doc(db, 'envelopes', id), {
      ...e,
      ...(e.workspaceId !== undefined && { userId: targetUid })
    });
    
    if (e.allocatedAmount !== undefined && e.allocatedAmount !== target.allocatedAmount) {
      await logActivity('UPDATE', 'ENVELOPE', `Ubah Pos Anggaran: ${target.category}`, `Alokasi Rp ${e.allocatedAmount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const deleteEnvelope = async (id: string) => {
    if (!user) return;
    const target = envelopes.find(e => e.id === id);
    await deleteDoc(doc(db, 'envelopes', id));
    if (target) {
      await logActivity('DELETE', 'ENVELOPE', `Hapus Amplop Anggaran: ${target.category}`, `Alokasi Rp ${target.allocatedAmount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    if (!user) return;
    const targetUid = getTargetUserId(g.workspaceId);
    await addDoc(collection(db, 'goals'), {
      ...g,
      userId: targetUid
    });
    await logActivity('CREATE', 'GOAL', `Target Finansial Baru: ${g.name}`, `Target Rp ${g.targetAmount.toLocaleString('id-ID')} (Deadline: ${g.deadline})`, g.workspaceId);
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const target = goals.find(g => g.id === id);
    await deleteDoc(doc(db, 'goals', id));
    if (target) {
      await logActivity('DELETE', 'GOAL', `Hapus Target Finansial: ${target.name}`, `Terkumpul Rp ${target.currentAmount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addGoalContribution = async (goalId: string, amount: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    await updateDoc(doc(db, 'goals', goalId), { currentAmount: goal.currentAmount + amount });

    const targetUid = getTargetUserId(goal.workspaceId);
    // Auto-create expense transaction for the contribution
    await addDoc(collection(db, 'transactions'), {
      userId: targetUid,
      workspaceId: goal.workspaceId,
      type: 'expense',
      amount: amount,
      category: 'Investasi & Tabungan',
      date: new Date().toISOString(),
      description: `Menabung untuk: ${goal.name}`,
      createdAt: new Date().toISOString()
    });

    await logActivity('UPDATE', 'GOAL', `Setoran Tabungan: ${goal.name}`, `Setoran nominal Rp ${amount.toLocaleString('id-ID')}`, goal.workspaceId);
  };

  const addBill = async (b: Omit<Bill, 'id'>) => {
    if (!user) return;
    const targetUid = getTargetUserId(b.workspaceId);
    await addDoc(collection(db, 'bills'), {
      ...b,
      userId: targetUid
    });
    await logActivity('CREATE', 'BILL', `Tagihan Baru: ${b.name}`, `Nominal Rp ${b.amount.toLocaleString('id-ID')}`, b.workspaceId);
  };

  const deleteBill = async (id: string) => {
    if (!user) return;
    const target = bills.find(b => b.id === id);
    await deleteDoc(doc(db, 'bills', id));
    if (target) {
      await logActivity('DELETE', 'BILL', `Hapus Tagihan: ${target.name}`, `Nominal Rp ${target.amount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const markBillPaid = async (id: string) => {
    if (!user) return;
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    await updateDoc(doc(db, 'bills', id), { isPaid: true });

    const targetUid = getTargetUserId(bill.workspaceId);
    // Auto-create expense transaction for the bill
    await addDoc(collection(db, 'transactions'), {
      userId: targetUid,
      workspaceId: bill.workspaceId,
      type: 'expense',
      amount: bill.amount,
      category: bill.name,
      date: new Date().toISOString(),
      description: `Pembayaran tagihan: ${bill.name}`,
      createdAt: new Date().toISOString()
    });

    await logActivity('UPDATE', 'BILL', `Pelunasan Tagihan: ${bill.name}`, `Lunas sebesar Rp ${bill.amount.toLocaleString('id-ID')}`, bill.workspaceId);
  };

  const addCategory = async (name: string, type: 'income' | 'expense', color?: string) => {
    if (!user) return;
    const targetUid = getTargetUserId(workspace); // Categories are global, assume added for current active workspace scope
    await addDoc(collection(db, 'categories'), {
      name,
      type,
      color: color || '#2563eb',
      userId: targetUid,
      createdAt: new Date().toISOString()
    });
    await logActivity('CREATE', 'CATEGORY', `Kategori Baru: ${name}`, `Tipe: ${type}`, workspace);
  };

  const updateCategory = async (id: string, name: string, type: 'income' | 'expense', color?: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'categories', id), {
      name,
      type,
      color: color || '#2563eb'
    });
    await logActivity('UPDATE', 'CATEGORY', `Ubah Kategori: ${name}`, `Tipe: ${type}`, workspace);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const target = customCategories.find(c => c.id === id);
    await deleteDoc(doc(db, 'categories', id));
    if (target) {
      await logActivity('DELETE', 'CATEGORY', `Hapus Kategori: ${target.name}`, `Tipe: ${target.type}`, workspace);
    }
  };

  const addFamilyMember = async (name: string, role: string, monthlyBudget: number, email?: string) => {
    if (!user) return;
    const targetUid = getTargetUserId('keluarga');
    await addDoc(collection(db, 'family_members'), {
      name,
      role,
      monthlyBudget,
      email: email || '',
      userId: targetUid,
      createdAt: new Date().toISOString()
    });
    await logActivity('CREATE', 'FAMILY_MEMBER', `Anggota Keluarga Baru: ${name}`, `Peran: ${role}, Anggaran: Rp ${monthlyBudget.toLocaleString('id-ID')}`, 'keluarga');
  };

  const updateFamilyMember = async (id: string, name: string, role: string, monthlyBudget: number, email?: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'family_members', id), {
      name,
      role,
      monthlyBudget,
      email: email || ''
    });
    await logActivity('UPDATE', 'FAMILY_MEMBER', `Ubah Anggota Keluarga: ${name}`, `Peran: ${role}`, 'keluarga');
  };

  const deleteFamilyMember = async (id: string) => {
    if (!user) return;
    const target = familyMembers.find(f => f.id === id);
    await deleteDoc(doc(db, 'family_members', id));
    if (target) {
      await logActivity('DELETE', 'FAMILY_MEMBER', `Hapus Anggota Keluarga: ${target.name}`, `Peran: ${target.role}`, 'keluarga');
    }
  };

  const addAsset = async (
    name: string,
    category: string,
    purchasePrice: number,
    currentValue: number,
    purchaseDate: string,
    notes?: string,
    workspaceId?: WorkspaceType,
    depreciationMethod: 'none' | 'straight_line' | 'declining_balance' = 'none',
    depreciationUsefulLife: number = 5,
    depreciationSalvageValue: number = 0,
    useAutoDepreciation: boolean = false,
    extraFields?: {
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      areaSize?: number;
    }
  ) => {
    if (!user) return;
    const targetUid = getTargetUserId(workspaceId || workspace);
    await addDoc(collection(db, 'assets'), {
      name,
      category,
      purchasePrice,
      currentValue,
      purchaseDate,
      notes: notes || '',
      status: 'owned',
      workspaceId: workspaceId || workspace,
      userId: targetUid,
      depreciationMethod,
      depreciationUsefulLife,
      depreciationSalvageValue,
      useAutoDepreciation,
      imageUrl: extraFields?.imageUrl || '',
      latitude: extraFields?.latitude ?? null,
      longitude: extraFields?.longitude ?? null,
      locationName: extraFields?.locationName || '',
      areaSize: extraFields?.areaSize ?? null,
      createdAt: new Date().toISOString()
    });
    await logActivity('CREATE', 'ASSET', `Aset Baru: ${name}`, `Kategori ${category}, Nilai Beli Rp ${purchasePrice.toLocaleString('id-ID')}`, workspaceId || workspace);
  };

  const updateAsset = async (
    id: string,
    name: string,
    category: string,
    purchasePrice: number,
    currentValue: number,
    purchaseDate: string,
    notes?: string,
    status?: 'owned' | 'sold' | 'liquidated',
    workspaceId?: WorkspaceType,
    depreciationMethod: 'none' | 'straight_line' | 'declining_balance' = 'none',
    depreciationUsefulLife: number = 5,
    depreciationSalvageValue: number = 0,
    useAutoDepreciation: boolean = false,
    extraFields?: {
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
      locationName?: string;
      areaSize?: number;
    }
  ) => {
    if (!user) return;
    const updateData: Record<string, any> = {
      name,
      category,
      purchasePrice,
      currentValue,
      purchaseDate,
      notes: notes || '',
      status: status || 'owned',
      workspaceId: workspaceId || workspace,
      depreciationMethod,
      depreciationUsefulLife,
      depreciationSalvageValue,
      useAutoDepreciation
    };

    if (extraFields) {
      if (extraFields.imageUrl !== undefined) updateData.imageUrl = extraFields.imageUrl;
      if (extraFields.latitude !== undefined) updateData.latitude = extraFields.latitude;
      if (extraFields.longitude !== undefined) updateData.longitude = extraFields.longitude;
      if (extraFields.locationName !== undefined) updateData.locationName = extraFields.locationName;
      if (extraFields.areaSize !== undefined) updateData.areaSize = extraFields.areaSize;
    }

    await updateDoc(doc(db, 'assets', id), updateData);
    await logActivity('UPDATE', 'ASSET', `Perubahan Aset: ${name}`, `Nilai Saat Ini Rp ${currentValue.toLocaleString('id-ID')}, Status: ${status || 'owned'}`, workspaceId || workspace);
  };

  const deleteAsset = async (id: string) => {
    if (!user) return;
    const target = assets.find(a => a.id === id);
    await deleteDoc(doc(db, 'assets', id));
    if (target) {
      await logActivity('DELETE', 'ASSET', `Hapus Aset: ${target.name}`, `Nilai Rp ${target.currentValue.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addPaymentAccount = async (
    name: string,
    type: 'bank' | 'ewallet' | 'cash' | 'investment',
    balance: number,
    accountNumber?: string,
    holderName?: string,
    color?: string,
    wsId?: WorkspaceType
  ) => {
    if (!user) return;
    const targetUid = getTargetUserId(wsId || workspace);
    const newAcc = {
      userId: targetUid,
      workspaceId: wsId || workspace,
      name,
      type,
      balance,
      accountNumber: accountNumber || '',
      holderName: holderName || '',
      color: color || '#2563eb',
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'payment_accounts'), newAcc);
    await logActivity(
      'CREATE',
      'PAYMENT_ACCOUNT',
      `Rekening Baru: ${name}`,
      `Jenis: ${type.toUpperCase()}, Saldo Awal: Rp ${balance.toLocaleString('id-ID')}`,
      wsId || workspace
    );
  };

  const updatePaymentAccount = async (
    id: string,
    name: string,
    type: 'bank' | 'ewallet' | 'cash' | 'investment',
    balance: number,
    accountNumber?: string,
    holderName?: string,
    color?: string,
    wsId?: WorkspaceType
  ) => {
    if (!user) return;
    await updateDoc(doc(db, 'payment_accounts', id), {
      name,
      type,
      balance,
      accountNumber: accountNumber || '',
      holderName: holderName || '',
      color: color || '#2563eb',
      workspaceId: wsId || workspace
    });
    await logActivity(
      'UPDATE',
      'PAYMENT_ACCOUNT',
      `Perubahan Rekening: ${name}`,
      `Saldo: Rp ${balance.toLocaleString('id-ID')}`,
      wsId || workspace
    );
  };

  const deletePaymentAccount = async (id: string) => {
    if (!user) return;
    const target = paymentAccounts.find(a => a.id === id);
    await deleteDoc(doc(db, 'payment_accounts', id));
    if (target) {
      await logActivity(
        'DELETE',
        'PAYMENT_ACCOUNT',
        `Hapus Rekening: ${target.name}`,
        `Saldo: Rp ${target.balance.toLocaleString('id-ID')}`,
        target.workspaceId
      );
    }
  };

  const deleteActivityLog = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'activity_logs', id));
  };

  const clearActivityLogs = async () => {
    if (!user) return;
    const snap = await getDocs(query(collection(db, 'activity_logs'), where('userId', '==', user.uid)));
    const promises = snap.docs.map(d => deleteDoc(doc(db, 'activity_logs', d.id)));
    await Promise.all(promises);
  };

  const autoCleanActivityLogs = async (daysThreshold: number): Promise<number> => {
    if (!user || daysThreshold <= 0) return 0;
    const cutoffTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
    const snap = await getDocs(query(collection(db, 'activity_logs'), where('userId', '==', user.uid)));
    const docsToDelete = snap.docs.filter(d => {
      const data = d.data();
      if (!data.timestamp) return false;
      const logTime = new Date(data.timestamp).getTime();
      return !isNaN(logTime) && logTime < cutoffTime;
    });

    if (docsToDelete.length === 0) return 0;

    const promises = docsToDelete.map(d => deleteDoc(doc(db, 'activity_logs', d.id)));
    await Promise.all(promises);
    return docsToDelete.length;
  };

  // Run auto-clean periodically/on mount if enabled
  useEffect(() => {
    if (!user) return;
    const isAutoCleanOn = localStorage.getItem('harmoni_autoclean_enabled') === 'true';
    const daysStr = localStorage.getItem('harmoni_autoclean_days') || '30';
    const days = parseInt(daysStr, 10);
    if (isAutoCleanOn && days > 0) {
      const lastRun = localStorage.getItem(`harmoni_autoclean_last_${user.uid}`);
      const todayStr = new Date().toISOString().split('T')[0];
      if (lastRun !== todayStr) {
        autoCleanActivityLogs(days).then(cleanedCount => {
          localStorage.setItem(`harmoni_autoclean_last_${user.uid}`, todayStr);
          if (cleanedCount > 0) {
            console.log(`Auto clean removed ${cleanedCount} audit logs older than ${days} days.`);
          }
        }).catch(err => console.error("Auto clean failed:", err));
      }
    }
  }, [user]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      try {
        await signInAnonymously(auth);
      } catch (err) {
        let guestId = localStorage.getItem('harmoni_guest_uid');
        if (!guestId) {
          guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
          localStorage.setItem('harmoni_guest_uid', guestId);
        }
        setUser({
          uid: guestId,
          isAnonymous: true,
          displayName: 'Pengguna Tamu',
          email: null,
          photoURL: null,
        } as unknown as User);
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionDefaultCategory, setTransactionDefaultCategory] = useState<string | undefined>(undefined);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [envelopeEditTarget, setEnvelopeEditTarget] = useState<Envelope | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const openTransactionModal = (defaultCategory?: string) => {
    setTransactionDefaultCategory(defaultCategory);
    setIsTransactionModalOpen(true);
  };
  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setTimeout(() => setTransactionDefaultCategory(undefined), 300);
  };

  const openTransferModal = () => setIsTransferModalOpen(true);
  const closeTransferModal = () => setIsTransferModalOpen(false);

  const openEnvelopeModal = (target?: Envelope) => {
    setEnvelopeEditTarget(target || null);
    setIsEnvelopeModalOpen(true);
  };
  const closeEnvelopeModal = () => {
    setIsEnvelopeModalOpen(false);
    setTimeout(() => setEnvelopeEditTarget(null), 300);
  };

  const openGoalModal = () => setIsGoalModalOpen(true);
  const closeGoalModal = () => setIsGoalModalOpen(false);

  const openBillModal = () => setIsBillModalOpen(true);
  const closeBillModal = () => setIsBillModalOpen(false);

  return (
    <FinanceContext.Provider value={{
      workspace, setWorkspace,
      transactions, addTransaction, deleteTransaction,
      envelopes, addEnvelope, updateEnvelope, deleteEnvelope,
      goals, addGoal, deleteGoal, addGoalContribution,
      bills, addBill, deleteBill, markBillPaid,
      customCategories, addCategory, updateCategory, deleteCategory,
      familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember,
      paymentAccounts, addPaymentAccount, updatePaymentAccount, deletePaymentAccount,
      assets, addAsset, updateAsset, deleteAsset,
      activityLogs, logActivity, deleteActivityLog, clearActivityLogs, autoCleanActivityLogs,
      user, superAdminId, isAuthLoading,
      loginWithGoogle, logout,
      isTransactionModalOpen, openTransactionModal, closeTransactionModal, transactionDefaultCategory,
      isTransferModalOpen, openTransferModal, closeTransferModal,
      isEnvelopeModalOpen, openEnvelopeModal, closeEnvelopeModal, envelopeEditTarget,
      isGoalModalOpen, openGoalModal, closeGoalModal,
      isBillModalOpen, openBillModal, closeBillModal
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
}
