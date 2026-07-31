import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WorkspaceType, Transaction, Envelope, Goal, Bill, TransactionCategory, FamilyMember, Asset, ActivityLog, PaymentAccount, Debt } from './types';
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
  deleteTransactions: (ids: string[]) => Promise<void>;
  envelopes: Envelope[];
  addEnvelope: (e: Omit<Envelope, 'id'>) => Promise<void>;
  updateEnvelope: (id: string, e: Partial<Envelope>) => Promise<void>;
  deleteEnvelope: (id: string) => Promise<void>;
  goals: Goal[];
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number, isWithdraw?: boolean) => Promise<void>;
  bills: Bill[];
  addBill: (b: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: string, b: Partial<Bill>) => Promise<void>;
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
  reconcilePaymentAccount: (id: string, realBalance: number, reason: string) => Promise<void>;
  debts: Debt[];
  addDebt: (name: string, type: 'payable' | 'receivable', amount: number, dueDate?: string, wsId?: WorkspaceType) => Promise<void>;
  updateDebt: (id: string, d: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebt: (debtId: string, paymentAmount: number, paymentAccountId?: string) => Promise<void>;
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
  addAssetValuation: (assetId: string, newValue: number, date: string, note?: string) => Promise<void>;
  deleteAssetValuation: (assetId: string, valuationId: string) => Promise<void>;
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
  selectedDetailTransaction: Transaction | null;
  isTransactionDetailModalOpen: boolean;
  openTransactionDetailModal: (transaction: Transaction) => void;
  closeTransactionDetailModal: () => void;
  isTransferModalOpen: boolean;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  isEnvelopeModalOpen: boolean;
  openEnvelopeModal: (target?: Envelope) => void;
  closeEnvelopeModal: () => void;
  envelopeEditTarget: Envelope | null;
  isGoalModalOpen: boolean;
  openGoalModal: (target?: Goal) => void;
  closeGoalModal: () => void;
  goalEditTarget: Goal | null;
  isBillModalOpen: boolean;
  openBillModal: (target?: Bill) => void;
  closeBillModal: () => void;
  billEditTarget: Bill | null;
  isDemo: boolean;
  showDemoLimitModal: boolean;
  setShowDemoLimitModal: (show: boolean) => void;
  demoModalReason: 'timeout' | 'assets' | 'reports' | 'activity-logs' | null;
  setDemoModalReason: (reason: 'timeout' | 'assets' | 'reports' | 'activity-logs' | null) => void;
  resetDemoTimer: () => void;
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

const DEFAULT_FAMILY_MEMBERS = [
  { name: 'Ahmad Ramli (Anda)', role: 'Kepala Keluarga', monthlyBudget: 5000000 },
  { name: 'Siti Aminah', role: 'Pasangan (Istri)', monthlyBudget: 4000000 },
  { name: 'Rizky', role: 'Anak Pertama', monthlyBudget: 1500000 },
  { name: 'Aisyah', role: 'Anak Kedua', monthlyBudget: 1000000 }
];

const DEFAULT_ASSETS = [
  { 
    name: 'Tanah Kavling Bogor', 
    category: 'Properti / Lahan', 
    purchasePrice: 150000000, 
    currentValue: 175000000, 
    purchaseDate: '2024-05-12', 
    notes: 'Investasi masa depan keluarga', 
    status: 'owned' as const, 
    workspaceId: 'keluarga' as const,
    locationName: 'Kavling Harmoni Asri, Cijeruk, Bogor',
    areaSize: 250,
    latitude: -6.5971,
    longitude: 106.8060,
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    depreciationMethod: 'none' as const,
    depreciationUsefulLife: 5,
    depreciationSalvageValue: 0,
    useAutoDepreciation: false
  },
  { 
    name: 'Mobil Honda Brio', 
    category: 'Kendaraan', 
    purchasePrice: 165000000, 
    currentValue: 145000000, 
    purchaseDate: '2025-02-20', 
    notes: 'Kendaraan harian keluarga', 
    status: 'owned' as const, 
    workspaceId: 'keluarga' as const,
    locationName: 'Garasi Rumah Utama, Tebet, Jakarta Selatan',
    latitude: -6.2297,
    longitude: 106.8471,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    depreciationMethod: 'none' as const,
    depreciationUsefulLife: 5,
    depreciationSalvageValue: 0,
    useAutoDepreciation: false
  },
  { 
    name: 'Logam Mulia Antam 10g', 
    category: 'Emas / Logam Mulia', 
    purchasePrice: 12000000, 
    currentValue: 13500000, 
    purchaseDate: '2024-08-05', 
    notes: 'Tabungan dana darurat di SDB Bank', 
    status: 'owned' as const, 
    workspaceId: 'keluarga' as const,
    locationName: 'Safe Deposit Box, Bank Mandiri Cab. Thamrin',
    latitude: -6.1865,
    longitude: 106.8234,
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80',
    depreciationMethod: 'none' as const,
    depreciationUsefulLife: 5,
    depreciationSalvageValue: 0,
    useAutoDepreciation: false
  }
];

const DEFAULT_PAYMENT_ACCOUNTS = [
  { workspaceId: 'keluarga' as const, name: 'Bank BCA Utama', type: 'bank' as const, accountNumber: '8830192831', holderName: 'Ahmad Ramli', balance: 24500000, color: '#2563eb' },
  { workspaceId: 'keluarga' as const, name: 'Bank Mandiri Tabungan', type: 'bank' as const, accountNumber: '1370018293012', holderName: 'Siti Aminah', balance: 18200000, color: '#0284c7' },
  { workspaceId: 'keluarga' as const, name: 'GoPay Keluarga', type: 'ewallet' as const, accountNumber: '081298765432', holderName: 'Ahmad Ramli', balance: 1250000, color: '#059669' },
  { workspaceId: 'pribadi' as const, name: 'OVO / ShopeePay', type: 'ewallet' as const, accountNumber: '081298765432', holderName: 'Ahmad Ramli', balance: 650000, color: '#7c3aed' },
  { workspaceId: 'keluarga' as const, name: 'Kas Tunai Dompet', type: 'cash' as const, accountNumber: '-', holderName: 'Kas Rumah', balance: 850000, color: '#d97706' }
];

const DEFAULT_DEBTS = [
  { workspaceId: 'keluarga' as const, name: 'Pinjaman Renovasi Rumah (KPR)', type: 'payable' as const, amount: 15000000, remainingAmount: 10000000, dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), status: 'active' as const },
  { workspaceId: 'pribadi' as const, name: 'Piutang ke Budi (Pinjam Uang Usaha)', type: 'receivable' as const, amount: 2500000, remainingAmount: 1500000, dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), status: 'active' as const }
];

const seedDemoTransactions = () => DEFAULT_TRANSACTIONS.map((t, idx) => ({ id: `demo-tx-${idx}`, ...t } as Transaction));
const seedDemoEnvelopes = () => DEFAULT_ENVELOPES.map((e, idx) => ({ id: `demo-env-${idx}`, ...e } as Envelope));
const seedDemoGoals = () => DEFAULT_GOALS.map((g, idx) => ({ id: `demo-goal-${idx}`, ...g } as Goal));
const seedDemoBills = () => DEFAULT_BILLS.map((b, idx) => ({ id: `demo-bill-${idx}`, ...b } as Bill));
const seedDemoCategories = () => DEFAULT_CATEGORIES.map((c, idx) => ({ id: `demo-cat-${idx}`, ...c } as TransactionCategory));
const seedDemoFamilyMembers = () => DEFAULT_FAMILY_MEMBERS.map((m, idx) => ({ id: `demo-fm-${idx}`, ...m } as FamilyMember));
const seedDemoAssets = () => DEFAULT_ASSETS.map((a, idx) => ({ id: `demo-asset-${idx}`, ...a } as Asset));
const seedDemoPaymentAccounts = () => DEFAULT_PAYMENT_ACCOUNTS.map((p, idx) => ({ id: `demo-pa-${idx}`, ...p } as PaymentAccount));
const seedDemoDebts = () => DEFAULT_DEBTS.map((d, idx) => ({ id: `demo-debt-${idx}`, ...d } as Debt));
const seedDemoActivityLogs = () => [
  {
    id: 'demo-log-0',
    userId: 'demo-user',
    workspaceId: 'keluarga' as const,
    action: 'CREATE' as const,
    entityType: 'SYSTEM' as const,
    title: 'Sesi Demo Dimulai',
    details: 'Anda sedang berada dalam mode demo. Data disimpan secara lokal di memori browser Anda.',
    timestamp: new Date().toISOString()
  } as ActivityLog
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
  const [debts, setDebts] = useState<Debt[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);
  const [demoModalReason, setDemoModalReason] = useState<'timeout' | 'assets' | 'reports' | 'activity-logs' | null>(null);

  const isDemo = !user || user.isAnonymous;

  const resetDemoTimer = () => {
    sessionStorage.setItem('harmoni_demo_start_time', Date.now().toString());
  };

  const addDemoActivity = (
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: ActivityLog['entityType'],
    title: string,
    details: string,
    wsId?: WorkspaceType
  ) => {
    const newLog: ActivityLog = {
      id: 'demo-log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      userId: user?.uid || 'guest',
      workspaceId: wsId || workspace,
      action,
      entityType,
      title,
      details,
      timestamp: new Date().toISOString()
    };
    const updated = [newLog, ...activityLogs];
    setActivityLogs(updated);
    sessionStorage.setItem(`demo_logs_${user?.uid || 'guest'}`, JSON.stringify(updated));
  };

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

  // 1b. Timer for demo mode limits
  useEffect(() => {
    if (isAuthLoading || !isDemo) {
      setShowDemoLimitModal(false);
      return;
    }

    let start = sessionStorage.getItem('harmoni_demo_start_time');
    if (!start) {
      sessionStorage.setItem('harmoni_demo_start_time', Date.now().toString());
    }

    const interval = setInterval(() => {
      const startTimeStr = sessionStorage.getItem('harmoni_demo_start_time');
      if (!startTimeStr) return;
      const startTime = parseInt(startTimeStr, 10);
      if (startTime > 0) {
        const elapsedMs = Date.now() - startTime;
        const limitMs = 2 * 60 * 1000; // 2 minutes demo limit
        if (elapsedMs >= limitMs) {
          setDemoModalReason('timeout');
          setShowDemoLimitModal(true);
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isAuthLoading, isDemo]);

  // 2. Real-time Firestore Listeners for User Data
  useEffect(() => {
    if (isAuthLoading) return;

    if (isDemo) {
      const loadFromSession = (key: string, defaultSeeder: () => any) => {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch (e) {
            return defaultSeeder();
          }
        }
        const seeded = defaultSeeder();
        sessionStorage.setItem(key, JSON.stringify(seeded));
        return seeded;
      };

      const uid = user?.uid || 'guest';
      setTransactions(loadFromSession(`demo_tx_${uid}`, seedDemoTransactions));
      setEnvelopes(loadFromSession(`demo_env_${uid}`, seedDemoEnvelopes));
      setGoals(loadFromSession(`demo_goals_${uid}`, seedDemoGoals));
      setBills(loadFromSession(`demo_bills_${uid}`, seedDemoBills));
      setCustomCategories(loadFromSession(`demo_cat_${uid}`, seedDemoCategories));
      setFamilyMembers(loadFromSession(`demo_fm_${uid}`, seedDemoFamilyMembers));
      setAssets(loadFromSession(`demo_assets_${uid}`, seedDemoAssets));
      setPaymentAccounts(loadFromSession(`demo_pa_${uid}`, seedDemoPaymentAccounts));
      setDebts(loadFromSession(`demo_debts_${uid}`, seedDemoDebts));
      setActivityLogs(loadFromSession(`demo_logs_${uid}`, seedDemoActivityLogs));
      return; // Do NOT setup Firestore listeners
    }

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

    // Debts listener
    const qDebts = query(collection(db, 'debts'), where('userId', 'in', userIds));
    const unSubDebts = onSnapshot(qDebts, (snapshot) => {
      const seededKey = `harmoni_seeded_debts_${userId}`;
      if (snapshot.empty && !localStorage.getItem(seededKey)) {
        localStorage.setItem(seededKey, 'true');
        DEFAULT_DEBTS.forEach(d => {
          addDoc(collection(db, 'debts'), { ...d, userId });
        });
      } else {
        const list: Debt[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Debt, 'id'>) }))
          .filter(isDocAllowed) as Debt[];
        setDebts(list);
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
      unSubDebts();
      unSubLogs();
    };
  }, [user, superAdminId]);

  // Firestore Write Operations
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (isDemo) {
      const newId = 'demo-tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newT: Transaction = { id: newId, ...t, createdAt: new Date().toISOString() };
      const updated = [newT, ...transactions];
      setTransactions(updated);
      sessionStorage.setItem(`demo_tx_${user?.uid || 'guest'}`, JSON.stringify(updated));

      // Handle linked goal update
      if (t.goalId) {
        const goal = goals.find(g => g.id === t.goalId);
        if (goal) {
          const isDeposit = (t.type === 'expense' && t.category === 'Investasi & Tabungan') || t.type === 'income';
          const adjustment = isDeposit ? t.amount : -t.amount;
          const updatedGoals = goals.map(g => g.id === t.goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount + adjustment) } : g);
          setGoals(updatedGoals);
          sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updatedGoals));
        }
      }

      // Handle linked payment account balance update
      if (t.paymentAccountId) {
        const acc = paymentAccounts.find(a => a.id === t.paymentAccountId);
        if (acc) {
          const adjustment = t.type === 'income' ? t.amount : -t.amount;
          const updatedAccs = paymentAccounts.map(a => a.id === t.paymentAccountId ? { ...a, balance: a.balance + adjustment } : a);
          setPaymentAccounts(updatedAccs);
          sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updatedAccs));
        }
      }

      addDemoActivity(
        'CREATE', 
        'TRANSACTION', 
        `Transaksi Baru: ${t.description || t.category}`, 
        `${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${t.amount.toLocaleString('id-ID')} (${t.category})`, 
        t.workspaceId
      );
      return;
    }
    if (!user) return;
    const targetUid = getTargetUserId(t.workspaceId);
    await addDoc(collection(db, 'transactions'), {
      ...t,
      userId: targetUid,
      createdAt: new Date().toISOString()
    });

    // Handle linked goal update in DB
    if (t.goalId) {
      const goal = goals.find(g => g.id === t.goalId);
      if (goal) {
        const isDeposit = (t.type === 'expense' && t.category === 'Investasi & Tabungan') || t.type === 'income';
        const adjustment = isDeposit ? t.amount : -t.amount;
        await updateDoc(doc(db, 'goals', t.goalId), {
          currentAmount: Math.max(0, goal.currentAmount + adjustment)
        });
      }
    }

    // Handle linked payment account balance update in DB
    if (t.paymentAccountId) {
      const acc = paymentAccounts.find(a => a.id === t.paymentAccountId);
      if (acc) {
        const adjustment = t.type === 'income' ? t.amount : -t.amount;
        await updateDoc(doc(db, 'payment_accounts', t.paymentAccountId), {
          balance: acc.balance + adjustment
        });
      }
    }

    await logActivity(
      'CREATE', 
      'TRANSACTION', 
      `Transaksi Baru: ${t.description || t.category}`, 
      `${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp ${t.amount.toLocaleString('id-ID')} (${t.category})`, 
      t.workspaceId
    );
  };

  const deleteTransaction = async (id: string) => {
    if (isDemo) {
      const target = transactions.find(t => t.id === id);
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      sessionStorage.setItem(`demo_tx_${user?.uid || 'guest'}`, JSON.stringify(updated));

      if (target) {
        // Adjust linked goal amount
        if (target.goalId) {
          const goal = goals.find(g => g.id === target.goalId);
          if (goal) {
            const isDeposit = (target.type === 'expense' && target.category === 'Investasi & Tabungan') || target.type === 'income';
            const adjustment = isDeposit ? -target.amount : target.amount;
            const updatedGoals = goals.map(g => g.id === target.goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount + adjustment) } : g);
            setGoals(updatedGoals);
            sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updatedGoals));
          }
        }

        // Adjust linked payment account balance
        if (target.paymentAccountId) {
          const acc = paymentAccounts.find(a => a.id === target.paymentAccountId);
          if (acc) {
            const adjustment = target.type === 'income' ? -target.amount : target.amount;
            const updatedAccs = paymentAccounts.map(a => a.id === target.paymentAccountId ? { ...a, balance: a.balance + adjustment } : a);
            setPaymentAccounts(updatedAccs);
            sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updatedAccs));
          }
        }

        addDemoActivity(
          'DELETE', 
          'TRANSACTION', 
          `Hapus Transaksi: ${target.description || target.category}`, 
          `Nominal Rp ${target.amount.toLocaleString('id-ID')} (${target.type})`, 
          target.workspaceId
        );
      }
      return;
    }
    if (!user) return;
    const target = transactions.find(t => t.id === id);
    await deleteDoc(doc(db, 'transactions', id));
    if (target) {
      // Adjust linked goal amount in DB
      if (target.goalId) {
        const goal = goals.find(g => g.id === target.goalId);
        if (goal) {
          const isDeposit = (target.type === 'expense' && target.category === 'Investasi & Tabungan') || target.type === 'income';
          const adjustment = isDeposit ? -target.amount : target.amount;
          await updateDoc(doc(db, 'goals', target.goalId), {
            currentAmount: Math.max(0, goal.currentAmount + adjustment)
          });
        }
      }

      // Adjust linked payment account balance in DB
      if (target.paymentAccountId) {
        const acc = paymentAccounts.find(a => a.id === target.paymentAccountId);
        if (acc) {
          const adjustment = target.type === 'income' ? -target.amount : target.amount;
          await updateDoc(doc(db, 'payment_accounts', target.paymentAccountId), {
            balance: acc.balance + adjustment
          });
        }
      }

      await logActivity(
        'DELETE', 
        'TRANSACTION', 
        `Hapus Transaksi: ${target.description || target.category}`, 
        `Nominal Rp ${target.amount.toLocaleString('id-ID')} (${target.type})`, 
        target.workspaceId
      );
    }
  };

  const deleteTransactions = async (ids: string[]) => {
    if (isDemo) {
      const targets = transactions.filter(t => ids.includes(t.id));
      const updated = transactions.filter(t => !ids.includes(t.id));
      setTransactions(updated);
      sessionStorage.setItem(`demo_tx_${user?.uid || 'guest'}`, JSON.stringify(updated));

      // Group adjustments by goalId to apply them efficiently
      const goalAdjustments: Record<string, number> = {};
      // Group adjustments by paymentAccountId to apply them efficiently
      const payAccAdjustments: Record<string, number> = {};

      targets.forEach(target => {
        if (target.goalId) {
          const isDeposit = (target.type === 'expense' && target.category === 'Investasi & Tabungan') || target.type === 'income';
          const adjustment = isDeposit ? -target.amount : target.amount;
          goalAdjustments[target.goalId] = (goalAdjustments[target.goalId] || 0) + adjustment;
        }

        if (target.paymentAccountId) {
          const adjustment = target.type === 'income' ? -target.amount : target.amount;
          payAccAdjustments[target.paymentAccountId] = (payAccAdjustments[target.paymentAccountId] || 0) + adjustment;
        }
      });

      let updatedGoals = [...goals];
      Object.entries(goalAdjustments).forEach(([goalId, adj]) => {
        updatedGoals = updatedGoals.map(g => g.id === goalId ? { ...g, currentAmount: Math.max(0, g.currentAmount + adj) } : g);
      });
      setGoals(updatedGoals);
      sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updatedGoals));

      let updatedAccs = [...paymentAccounts];
      Object.entries(payAccAdjustments).forEach(([accId, adj]) => {
        updatedAccs = updatedAccs.map(a => a.id === accId ? { ...a, balance: a.balance + adj } : a);
      });
      setPaymentAccounts(updatedAccs);
      sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updatedAccs));

      if (targets.length > 0) {
        addDemoActivity(
          'DELETE', 
          'TRANSACTION', 
          `Hapus ${targets.length} Transaksi`, 
          `Berhasil menghapus ${targets.length} catatan transaksi secara massal.`, 
          targets[0].workspaceId
        );
      }
      return;
    }

    if (!user) return;
    const targets = transactions.filter(t => ids.includes(t.id));

    // Delete in Firestore
    await Promise.all(ids.map(id => deleteDoc(doc(db, 'transactions', id))));

    // Group adjustments by goalId to apply them efficiently
    const goalAdjustments: Record<string, number> = {};
    // Group adjustments by paymentAccountId to apply them efficiently
    const payAccAdjustments: Record<string, number> = {};

    targets.forEach(target => {
      if (target.goalId) {
        const isDeposit = (target.type === 'expense' && target.category === 'Investasi & Tabungan') || target.type === 'income';
        const adjustment = isDeposit ? -target.amount : target.amount;
        goalAdjustments[target.goalId] = (goalAdjustments[target.goalId] || 0) + adjustment;
      }

      if (target.paymentAccountId) {
        const adjustment = target.type === 'income' ? -target.amount : target.amount;
        payAccAdjustments[target.paymentAccountId] = (payAccAdjustments[target.paymentAccountId] || 0) + adjustment;
      }
    });

    // Update goals in DB
    await Promise.all(
      Object.entries(goalAdjustments).map(async ([goalId, adj]) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          await updateDoc(doc(db, 'goals', goalId), {
            currentAmount: Math.max(0, goal.currentAmount + adj)
          });
        }
      })
    );

    // Update payment accounts in DB
    await Promise.all(
      Object.entries(payAccAdjustments).map(async ([accId, adj]) => {
        const acc = paymentAccounts.find(a => a.id === accId);
        if (acc) {
          await updateDoc(doc(db, 'payment_accounts', accId), {
            balance: acc.balance + adj
          });
        }
      })
    );

    if (targets.length > 0) {
      await logActivity(
        'DELETE', 
        'TRANSACTION', 
        `Hapus ${targets.length} Transaksi`, 
        `Berhasil menghapus ${targets.length} catatan transaksi secara massal.`, 
        targets[0].workspaceId
      );
    }
  };

  const addEnvelope = async (e: Omit<Envelope, 'id'>) => {
    if (isDemo) {
      const newId = 'demo-env-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newE: Envelope = { id: newId, ...e };
      const updated = [...envelopes, newE];
      setEnvelopes(updated);
      sessionStorage.setItem(`demo_env_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'ENVELOPE', `Amplop Anggaran Baru: ${e.category}`, `Alokasi Rp ${e.allocatedAmount.toLocaleString('id-ID')}`, e.workspaceId);
      return;
    }
    if (!user) return;
    const targetUid = getTargetUserId(e.workspaceId);
    await addDoc(collection(db, 'envelopes'), {
      ...e,
      userId: targetUid
    });
    await logActivity('CREATE', 'ENVELOPE', `Amplop Anggaran Baru: ${e.category}`, `Alokasi Rp ${e.allocatedAmount.toLocaleString('id-ID')}`, e.workspaceId);
  };

  const updateEnvelope = async (id: string, e: Partial<Envelope>) => {
    if (isDemo) {
      const target = envelopes.find(env => env.id === id);
      if (!target) return;
      const updated = envelopes.map(env => env.id === id ? { ...env, ...e } as Envelope : env);
      setEnvelopes(updated);
      sessionStorage.setItem(`demo_env_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (e.allocatedAmount !== undefined && e.allocatedAmount !== target.allocatedAmount) {
        addDemoActivity('UPDATE', 'ENVELOPE', `Ubah Pos Anggaran: ${target.category}`, `Alokasi Rp ${e.allocatedAmount.toLocaleString('id-ID')}`, target.workspaceId);
      }
      return;
    }
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
    if (isDemo) {
      const target = envelopes.find(e => e.id === id);
      const updated = envelopes.filter(e => e.id !== id);
      setEnvelopes(updated);
      sessionStorage.setItem(`demo_env_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'ENVELOPE', `Hapus Amplop Anggaran: ${target.category}`, `Alokasi Rp ${target.allocatedAmount.toLocaleString('id-ID')}`, target.workspaceId);
      }
      return;
    }
    if (!user) return;
    const target = envelopes.find(e => e.id === id);
    await deleteDoc(doc(db, 'envelopes', id));
    if (target) {
      await logActivity('DELETE', 'ENVELOPE', `Hapus Amplop Anggaran: ${target.category}`, `Alokasi Rp ${target.allocatedAmount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    if (isDemo) {
      const newId = 'demo-goal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newG: Goal = { id: newId, ...g };
      const updated = [...goals, newG];
      setGoals(updated);
      sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'GOAL', `Target Finansial Baru: ${g.name}`, `Target Rp ${g.targetAmount.toLocaleString('id-ID')} (Deadline: ${g.deadline})`, g.workspaceId);
      return;
    }
    if (!user) return;
    const targetUid = getTargetUserId(g.workspaceId);
    await addDoc(collection(db, 'goals'), {
      ...g,
      userId: targetUid
    });
    await logActivity('CREATE', 'GOAL', `Target Finansial Baru: ${g.name}`, `Target Rp ${g.targetAmount.toLocaleString('id-ID')} (Deadline: ${g.deadline})`, g.workspaceId);
  };

  const updateGoal = async (id: string, g: Partial<Goal>) => {
    if (isDemo) {
      const target = goals.find(goal => goal.id === id);
      if (!target) return;
      const updated = goals.map(goal => goal.id === id ? { ...goal, ...g } as Goal : goal);
      setGoals(updated);
      sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'GOAL', `Ubah Target Finansial: ${g.name || target.name}`, `Workspace: ${g.workspaceId || target.workspaceId}`, g.workspaceId || target.workspaceId || workspace);
      return;
    }
    if (!user) return;
    const updatePayload: any = { ...g };
    if (g.workspaceId) {
      updatePayload.userId = getTargetUserId(g.workspaceId);
    }
    await updateDoc(doc(db, 'goals', id), updatePayload);
    await logActivity('UPDATE', 'GOAL', `Ubah Target Finansial: ${g.name || ''}`, `Workspace: ${g.workspaceId || ''}`, g.workspaceId || workspace);
  };

  const deleteGoal = async (id: string) => {
    if (isDemo) {
      const target = goals.find(g => g.id === id);
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'GOAL', `Hapus Target Finansial: ${target.name}`, `Terkumpul Rp ${target.currentAmount.toLocaleString('id-ID')}`, target.workspaceId);
      }
      return;
    }
    if (!user) return;
    const target = goals.find(g => g.id === id);
    await deleteDoc(doc(db, 'goals', id));
    if (target) {
      await logActivity('DELETE', 'GOAL', `Hapus Target Finansial: ${target.name}`, `Terkumpul Rp ${target.currentAmount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addGoalContribution = async (goalId: string, amount: number, isWithdraw = false) => {
    if (isDemo) {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      
      const finalAmount = isWithdraw ? -amount : amount;
      const newAmount = Math.max(0, goal.currentAmount + finalAmount);
      const updatedGoals = goals.map(g => g.id === goalId ? { ...g, currentAmount: newAmount } : g);
      setGoals(updatedGoals);
      sessionStorage.setItem(`demo_goals_${user?.uid || 'guest'}`, JSON.stringify(updatedGoals));

      const newTxId = 'demo-tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newTx: Transaction = {
        id: newTxId,
        workspaceId: goal.workspaceId,
        type: isWithdraw ? 'income' : 'expense',
        amount: amount,
        category: 'Investasi & Tabungan',
        date: new Date().toISOString(),
        description: isWithdraw ? `Tarik/Pakai dana: ${goal.name}` : `Menabung untuk: ${goal.name}`,
        createdAt: new Date().toISOString(),
        goalId: goalId
      };
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      sessionStorage.setItem(`demo_tx_${user?.uid || 'guest'}`, JSON.stringify(updatedTx));

      addDemoActivity(
        isWithdraw ? 'DELETE' : 'UPDATE', 
        'GOAL', 
        isWithdraw ? `Tarik Tabungan: ${goal.name}` : `Setoran Tabungan: ${goal.name}`, 
        isWithdraw ? `Penarikan nominal Rp ${amount.toLocaleString('id-ID')}` : `Setoran nominal Rp ${amount.toLocaleString('id-ID')}`, 
        goal.workspaceId
      );
      return;
    }
    if (!user) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const finalAmount = isWithdraw ? -amount : amount;
    const newAmount = Math.max(0, goal.currentAmount + finalAmount);
    await updateDoc(doc(db, 'goals', goalId), { currentAmount: newAmount });

    const targetUid = getTargetUserId(goal.workspaceId);
    await addDoc(collection(db, 'transactions'), {
      userId: targetUid,
      workspaceId: goal.workspaceId,
      type: isWithdraw ? 'income' : 'expense',
      amount: amount,
      category: 'Investasi & Tabungan',
      date: new Date().toISOString(),
      description: isWithdraw ? `Tarik/Pakai dana: ${goal.name}` : `Menabung untuk: ${goal.name}`,
      createdAt: new Date().toISOString(),
      goalId: goalId
    });

    await logActivity(
      isWithdraw ? 'DELETE' : 'UPDATE', 
      'GOAL', 
      isWithdraw ? `Tarik Tabungan: ${goal.name}` : `Setoran Tabungan: ${goal.name}`, 
      isWithdraw ? `Penarikan nominal Rp ${amount.toLocaleString('id-ID')}` : `Setoran nominal Rp ${amount.toLocaleString('id-ID')}`, 
      goal.workspaceId
    );
  };

  const addBill = async (b: Omit<Bill, 'id'>) => {
    if (isDemo) {
      const newId = 'demo-bill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newB: Bill = { id: newId, ...b };
      const updated = [...bills, newB];
      setBills(updated);
      sessionStorage.setItem(`demo_bills_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'BILL', `Tagihan Baru: ${b.name}`, `Nominal Rp ${b.amount.toLocaleString('id-ID')}`, b.workspaceId);
      return;
    }
    if (!user) return;
    const targetUid = getTargetUserId(b.workspaceId);
    await addDoc(collection(db, 'bills'), {
      ...b,
      userId: targetUid
    });
    await logActivity('CREATE', 'BILL', `Tagihan Baru: ${b.name}`, `Nominal Rp ${b.amount.toLocaleString('id-ID')}`, b.workspaceId);
  };

  const updateBill = async (id: string, b: Partial<Bill>) => {
    if (isDemo) {
      const target = bills.find(bill => bill.id === id);
      if (!target) return;
      const updated = bills.map(bill => bill.id === id ? { ...bill, ...b } as Bill : bill);
      setBills(updated);
      sessionStorage.setItem(`demo_bills_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'BILL', `Ubah Tagihan: ${b.name || target.name}`, `Workspace: ${b.workspaceId || target.workspaceId}`, b.workspaceId || target.workspaceId || workspace);
      return;
    }
    if (!user) return;
    const updatePayload: any = { ...b };
    if (b.workspaceId) {
      updatePayload.userId = getTargetUserId(b.workspaceId);
    }
    await updateDoc(doc(db, 'bills', id), updatePayload);
    await logActivity('UPDATE', 'BILL', `Ubah Tagihan: ${b.name || ''}`, `Workspace: ${b.workspaceId || ''}`, b.workspaceId || workspace);
  };

  const deleteBill = async (id: string) => {
    if (isDemo) {
      const target = bills.find(b => b.id === id);
      const updated = bills.filter(b => b.id !== id);
      setBills(updated);
      sessionStorage.setItem(`demo_bills_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'BILL', `Hapus Tagihan: ${target.name}`, `Nominal Rp ${target.amount.toLocaleString('id-ID')}`, target.workspaceId);
      }
      return;
    }
    if (!user) return;
    const target = bills.find(b => b.id === id);
    await deleteDoc(doc(db, 'bills', id));
    if (target) {
      await logActivity('DELETE', 'BILL', `Hapus Tagihan: ${target.name}`, `Nominal Rp ${target.amount.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const markBillPaid = async (id: string) => {
    if (isDemo) {
      const bill = bills.find(b => b.id === id);
      if (!bill) return;
      const updatedBills = bills.map(b => b.id === id ? { ...b, isPaid: true } : b);
      setBills(updatedBills);
      sessionStorage.setItem(`demo_bills_${user?.uid || 'guest'}`, JSON.stringify(updatedBills));

      const newTxId = 'demo-tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newTx: Transaction = {
        id: newTxId,
        workspaceId: bill.workspaceId,
        type: 'expense',
        amount: bill.amount,
        category: bill.name,
        date: new Date().toISOString(),
        description: `Pembayaran tagihan: ${bill.name}`,
        createdAt: new Date().toISOString()
      };
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      sessionStorage.setItem(`demo_tx_${user?.uid || 'guest'}`, JSON.stringify(updatedTx));

      addDemoActivity('UPDATE', 'BILL', `Pelunasan Tagihan: ${bill.name}`, `Lunas sebesar Rp ${bill.amount.toLocaleString('id-ID')}`, bill.workspaceId);
      return;
    }
    if (!user) return;
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    await updateDoc(doc(db, 'bills', id), { isPaid: true });

    const targetUid = getTargetUserId(bill.workspaceId);
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
    if (isDemo) {
      const newId = 'demo-cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newC: TransactionCategory = { id: newId, userId: user?.uid || 'guest', name, type, color: color || '#2563eb' };
      const updated = [...customCategories, newC];
      setCustomCategories(updated);
      sessionStorage.setItem(`demo_cat_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'CATEGORY', `Kategori Baru: ${name}`, `Tipe: ${type}`, workspace);
      return;
    }
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
    if (isDemo) {
      const updated = customCategories.map(c => c.id === id ? { ...c, name, type, color: color || '#2563eb' } : c);
      setCustomCategories(updated);
      sessionStorage.setItem(`demo_cat_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'CATEGORY', `Ubah Kategori: ${name}`, `Tipe: ${type}`, workspace);
      return;
    }
    if (!user) return;
    await updateDoc(doc(db, 'categories', id), {
      name,
      type,
      color: color || '#2563eb'
    });
    await logActivity('UPDATE', 'CATEGORY', `Ubah Kategori: ${name}`, `Tipe: ${type}`, workspace);
  };

  const deleteCategory = async (id: string) => {
    if (isDemo) {
      const target = customCategories.find(c => c.id === id);
      const updated = customCategories.filter(c => c.id !== id);
      setCustomCategories(updated);
      sessionStorage.setItem(`demo_cat_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'CATEGORY', `Hapus Kategori: ${target.name}`, `Tipe: ${target.type}`, workspace);
      }
      return;
    }
    if (!user) return;
    const target = customCategories.find(c => c.id === id);
    await deleteDoc(doc(db, 'categories', id));
    if (target) {
      await logActivity('DELETE', 'CATEGORY', `Hapus Kategori: ${target.name}`, `Tipe: ${target.type}`, workspace);
    }
  };

  const addFamilyMember = async (name: string, role: string, monthlyBudget: number, email?: string) => {
    if (isDemo) {
      const newId = 'demo-fm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newF: FamilyMember = { id: newId, userId: user?.uid || 'guest', name, role, monthlyBudget, email: email || '' };
      const updated = [...familyMembers, newF];
      setFamilyMembers(updated);
      sessionStorage.setItem(`demo_fm_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'FAMILY_MEMBER', `Anggota Keluarga Baru: ${name}`, `Peran: ${role}, Anggaran: Rp ${monthlyBudget.toLocaleString('id-ID')}`, 'keluarga');
      return;
    }
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
    if (isDemo) {
      const updated = familyMembers.map(f => f.id === id ? { ...f, name, role, monthlyBudget, email: email || '' } : f);
      setFamilyMembers(updated);
      sessionStorage.setItem(`demo_fm_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'FAMILY_MEMBER', `Ubah Anggota Keluarga: ${name}`, `Peran: ${role}`, 'keluarga');
      return;
    }
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
    if (isDemo) {
      const target = familyMembers.find(f => f.id === id);
      const updated = familyMembers.filter(f => f.id !== id);
      setFamilyMembers(updated);
      sessionStorage.setItem(`demo_fm_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'FAMILY_MEMBER', `Hapus Anggota Keluarga: ${target.name}`, `Peran: ${target.role}`, 'keluarga');
      }
      return;
    }
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
    if (isDemo) {
      const newId = 'demo-asset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const initialValuationHistory = [
        {
          id: 'val-init-' + Date.now(),
          date: purchaseDate || new Date().toISOString().slice(0, 10),
          value: currentValue || purchasePrice,
          note: 'Nilai Perolehan / Pembelian Awal',
          createdAt: new Date().toISOString()
        }
      ];
      const newA: Asset = {
        id: newId,
        userId: user?.uid || 'guest',
        workspaceId: workspaceId || workspace,
        name,
        category,
        purchasePrice,
        currentValue,
        purchaseDate,
        notes: notes || '',
        status: 'owned',
        depreciationMethod,
        depreciationUsefulLife,
        depreciationSalvageValue,
        useAutoDepreciation,
        imageUrl: extraFields?.imageUrl || '',
        latitude: extraFields?.latitude ?? null,
        longitude: extraFields?.longitude ?? null,
        locationName: extraFields?.locationName || '',
        areaSize: extraFields?.areaSize ?? null,
        createdAt: new Date().toISOString(),
        valuationHistory: initialValuationHistory
      };
      const updated = [...assets, newA];
      setAssets(updated);
      sessionStorage.setItem(`demo_assets_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'ASSET', `Aset Baru: ${name}`, `Kategori ${category}, Nilai Beli Rp ${purchasePrice.toLocaleString('id-ID')}`, workspaceId || workspace);
      return;
    }
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
      createdAt: new Date().toISOString(),
      valuationHistory: [
        {
          id: 'val-init-' + Date.now(),
          date: purchaseDate || new Date().toISOString().slice(0, 10),
          value: currentValue || purchasePrice,
          note: 'Nilai Perolehan / Pembelian Awal',
          createdAt: new Date().toISOString()
        }
      ]
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
    if (isDemo) {
      const updated = assets.map(a => {
        if (a.id !== id) return a;
        const extraPayload: any = {};
        if (extraFields) {
          if (extraFields.imageUrl !== undefined) extraPayload.imageUrl = extraFields.imageUrl;
          if (extraFields.latitude !== undefined) extraPayload.latitude = extraFields.latitude;
          if (extraFields.longitude !== undefined) extraPayload.longitude = extraFields.longitude;
          if (extraFields.locationName !== undefined) extraPayload.locationName = extraFields.locationName;
          if (extraFields.areaSize !== undefined) extraPayload.areaSize = extraFields.areaSize;
        }
        return {
          ...a,
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
          useAutoDepreciation,
          ...extraPayload
        } as Asset;
      });
      setAssets(updated);
      sessionStorage.setItem(`demo_assets_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'ASSET', `Perubahan Aset: ${name}`, `Nilai Saat Ini Rp ${currentValue.toLocaleString('id-ID')}, Status: ${status || 'owned'}`, workspaceId || workspace);
      return;
    }
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
    if (isDemo) {
      const target = assets.find(a => a.id === id);
      const updated = assets.filter(a => a.id !== id);
      setAssets(updated);
      sessionStorage.setItem(`demo_assets_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'ASSET', `Hapus Aset: ${target.name}`, `Nilai Rp ${target.currentValue.toLocaleString('id-ID')}`, target.workspaceId);
      }
      return;
    }
    if (!user) return;
    const target = assets.find(a => a.id === id);
    await deleteDoc(doc(db, 'assets', id));
    if (target) {
      await logActivity('DELETE', 'ASSET', `Hapus Aset: ${target.name}`, `Nilai Rp ${target.currentValue.toLocaleString('id-ID')}`, target.workspaceId);
    }
  };

  const addAssetValuation = async (
    assetId: string,
    newValue: number,
    date: string,
    note?: string
  ) => {
    const target = assets.find(a => a.id === assetId);
    if (!target) return;

    const currentHistory = target.valuationHistory && target.valuationHistory.length > 0
      ? target.valuationHistory
      : [
          {
            id: 'val-init-' + (target.createdAt || Date.now()),
            date: target.purchaseDate || new Date().toISOString().slice(0, 10),
            value: target.purchasePrice || target.currentValue,
            note: 'Nilai Perolehan / Pembelian Awal',
            createdAt: target.createdAt || new Date().toISOString()
          }
        ];

    const newEntry = {
      id: 'val-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      date: date || new Date().toISOString().slice(0, 10),
      value: newValue,
      note: note || 'Penilaian Ulang / Revaluasi',
      createdAt: new Date().toISOString()
    };

    const updatedHistory = [...currentHistory, newEntry].sort((a, b) => a.date.localeCompare(b.date));

    if (isDemo) {
      const updated = assets.map(a => {
        if (a.id !== assetId) return a;
        return {
          ...a,
          currentValue: newValue,
          valuationHistory: updatedHistory
        };
      });
      setAssets(updated);
      sessionStorage.setItem(`demo_assets_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('UPDATE', 'ASSET', `Revaluasi Aset: ${target.name}`, `Nilai Baru: Rp ${newValue.toLocaleString('id-ID')} (${note || 'Pembaruan Nilai'})`, target.workspaceId);
      return;
    }

    if (!user) return;
    await updateDoc(doc(db, 'assets', assetId), {
      currentValue: newValue,
      valuationHistory: updatedHistory
    });
    await logActivity('UPDATE', 'ASSET', `Revaluasi Aset: ${target.name}`, `Nilai Baru: Rp ${newValue.toLocaleString('id-ID')} (${note || 'Pembaruan Nilai'})`, target.workspaceId);
  };

  const deleteAssetValuation = async (assetId: string, valuationId: string) => {
    const target = assets.find(a => a.id === assetId);
    if (!target || !target.valuationHistory) return;

    const updatedHistory = target.valuationHistory.filter(v => v.id !== valuationId);
    const latestEntry = updatedHistory[updatedHistory.length - 1];
    const newCurrentValue = latestEntry ? latestEntry.value : target.purchasePrice;

    if (isDemo) {
      const updated = assets.map(a => {
        if (a.id !== assetId) return a;
        return {
          ...a,
          currentValue: newCurrentValue,
          valuationHistory: updatedHistory
        };
      });
      setAssets(updated);
      sessionStorage.setItem(`demo_assets_${user?.uid || 'guest'}`, JSON.stringify(updated));
      return;
    }

    if (!user) return;
    await updateDoc(doc(db, 'assets', assetId), {
      currentValue: newCurrentValue,
      valuationHistory: updatedHistory
    });
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
    if (isDemo) {
      const newId = 'demo-pa-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const newAcc: PaymentAccount = {
        id: newId,
        userId: user?.uid || 'guest',
        workspaceId: wsId || workspace,
        name,
        type,
        balance,
        accountNumber: accountNumber || '',
        holderName: holderName || '',
        color: color || '#2563eb'
      };
      const updated = [...paymentAccounts, newAcc];
      setPaymentAccounts(updated);
      sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity(
        'CREATE',
        'PAYMENT_ACCOUNT',
        `Rekening Baru: ${name}`,
        `Jenis: ${type.toUpperCase()}, Saldo Awal: Rp ${balance.toLocaleString('id-ID')}`,
        wsId || workspace
      );
      return;
    }
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
    if (isDemo) {
      const updated = paymentAccounts.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          name,
          type,
          balance,
          accountNumber: accountNumber || '',
          holderName: holderName || '',
          color: color || '#2563eb',
          workspaceId: wsId || workspace
        };
      });
      setPaymentAccounts(updated);
      sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity(
        'UPDATE',
        'PAYMENT_ACCOUNT',
        `Perubahan Rekening: ${name}`,
        `Saldo: Rp ${balance.toLocaleString('id-ID')}`,
        wsId || workspace
      );
      return;
    }
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
    if (isDemo) {
      const target = paymentAccounts.find(a => a.id === id);
      const updated = paymentAccounts.filter(a => a.id !== id);
      setPaymentAccounts(updated);
      sessionStorage.setItem(`demo_pa_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity(
          'DELETE',
          'PAYMENT_ACCOUNT',
          `Hapus Rekening: ${target.name}`,
          `Saldo: Rp ${target.balance.toLocaleString('id-ID')}`,
          target.workspaceId
        );
      }
      return;
    }
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

  const reconcilePaymentAccount = async (id: string, realBalance: number, reason: string) => {
    const acc = paymentAccounts.find(a => a.id === id);
    if (!acc) return;
    
    const difference = realBalance - acc.balance;
    if (difference === 0) return; // already matches

    const adjustmentType = difference > 0 ? 'income' : 'expense';
    const absDiff = Math.abs(difference);

    await addTransaction({
      workspaceId: acc.workspaceId || workspace,
      type: adjustmentType,
      amount: absDiff,
      category: 'Penyesuaian Saldo',
      date: new Date().toISOString(),
      description: `[Rekonsiliasi] ${reason}`,
      paymentAccountId: id
    });
  };

  const addDebt = async (name: string, type: 'payable' | 'receivable', amount: number, dueDate?: string, wsId?: WorkspaceType) => {
    const targetWs = wsId || workspace;
    const targetUid = user ? getTargetUserId(targetWs) : (user?.uid || 'guest');
    const newD: Omit<Debt, 'id'> = {
      userId: targetUid,
      workspaceId: targetWs,
      name,
      type,
      amount,
      remainingAmount: amount,
      dueDate,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    if (isDemo) {
      const created: Debt = { id: `demo-debt-${Date.now()}`, ...newD };
      const updated = [created, ...debts];
      setDebts(updated);
      sessionStorage.setItem(`demo_debts_${user?.uid || 'guest'}`, JSON.stringify(updated));
      addDemoActivity('CREATE', 'DEBT', `Tambah ${type === 'payable' ? 'Utang' : 'Piutang'}: ${name}`, `Nominal Rp ${amount.toLocaleString('id-ID')}`, targetWs);
      return;
    }
    if (!user) return;
    await addDoc(collection(db, 'debts'), { ...newD, userId: targetUid });
    await logActivity('CREATE', 'DEBT', `Tambah ${type === 'payable' ? 'Utang' : 'Piutang'}: ${name}`, `Nominal Rp ${amount.toLocaleString('id-ID')}`, targetWs);
  };

  const updateDebt = async (id: string, d: Partial<Debt>) => {
    if (isDemo) {
      const updated = debts.map(item => item.id === id ? { ...item, ...d } : item);
      setDebts(updated);
      sessionStorage.setItem(`demo_debts_${user?.uid || 'guest'}`, JSON.stringify(updated));
      return;
    }
    if (!user) return;
    await updateDoc(doc(db, 'debts', id), d);
  };

  const deleteDebt = async (id: string) => {
    const target = debts.find(d => d.id === id);
    if (isDemo) {
      const updated = debts.filter(d => d.id !== id);
      setDebts(updated);
      sessionStorage.setItem(`demo_debts_${user?.uid || 'guest'}`, JSON.stringify(updated));
      if (target) {
        addDemoActivity('DELETE', 'DEBT', `Hapus ${target.type === 'payable' ? 'Utang' : 'Piutang'}: ${target.name}`, `Terhapus dari sistem.`, target.workspaceId);
      }
      return;
    }
    if (!user) return;
    await deleteDoc(doc(db, 'debts', id));
    if (target) {
      await logActivity('DELETE', 'DEBT', `Hapus ${target.type === 'payable' ? 'Utang' : 'Piutang'}: ${target.name}`, `Terhapus dari sistem.`, target.workspaceId);
    }
  };

  const payDebt = async (debtId: string, paymentAmount: number, paymentAccountId?: string) => {
    const target = debts.find(d => d.id === debtId);
    if (!target || paymentAmount <= 0) return;
    const newRemaining = Math.max(0, target.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'paid' : 'active';

    if (isDemo) {
      const updated = debts.map(d => d.id === debtId ? { ...d, remainingAmount: newRemaining, status: newStatus as 'active' | 'paid' } : d);
      setDebts(updated);
      sessionStorage.setItem(`demo_debts_${user?.uid || 'guest'}`, JSON.stringify(updated));
      
      const isPayable = target.type === 'payable';
      await addTransaction({
        workspaceId: target.workspaceId,
        type: isPayable ? 'expense' : 'income',
        amount: paymentAmount,
        category: 'Cicilan & Utang',
        date: new Date().toISOString(),
        description: isPayable ? `Pembayaran Cicilan Utang: ${target.name}` : `Penerimaan Pelunasan Piutang: ${target.name}`,
        paymentAccountId
      });
      addDemoActivity('UPDATE', 'DEBT', `Pembayaran ${isPayable ? 'Utang' : 'Piutang'}: ${target.name}`, `Pembayaran sebesar Rp ${paymentAmount.toLocaleString('id-ID')}`, target.workspaceId);
      return;
    }

    if (!user) return;
    await updateDoc(doc(db, 'debts', debtId), {
      remainingAmount: newRemaining,
      status: newStatus
    });

    const isPayable = target.type === 'payable';
    await addTransaction({
      workspaceId: target.workspaceId,
      type: isPayable ? 'expense' : 'income',
      amount: paymentAmount,
      category: 'Cicilan & Utang',
      date: new Date().toISOString(),
      description: isPayable ? `Pembayaran Cicilan Utang: ${target.name}` : `Penerimaan Pelunasan Piutang: ${target.name}`,
      paymentAccountId
    });

    await logActivity('UPDATE', 'DEBT', `Pembayaran ${isPayable ? 'Utang' : 'Piutang'}: ${target.name}`, `Pembayaran sebesar Rp ${paymentAmount.toLocaleString('id-ID')}`, target.workspaceId);
  };

  const deleteActivityLog = async (id: string) => {
    if (isDemo) {
      const updated = activityLogs.filter(log => log.id !== id);
      setActivityLogs(updated);
      sessionStorage.setItem(`demo_logs_${user?.uid || 'guest'}`, JSON.stringify(updated));
      return;
    }
    if (!user) return;
    await deleteDoc(doc(db, 'activity_logs', id));
  };

  const clearActivityLogs = async () => {
    if (isDemo) {
      setActivityLogs([]);
      sessionStorage.setItem(`demo_logs_${user?.uid || 'guest'}`, JSON.stringify([]));
      return;
    }
    if (!user) return;
    const snap = await getDocs(query(collection(db, 'activity_logs'), where('userId', '==', user.uid)));
    const promises = snap.docs.map(d => deleteDoc(doc(db, 'activity_logs', d.id)));
    await Promise.all(promises);
  };

  const autoCleanActivityLogs = async (daysThreshold: number): Promise<number> => {
    if (isDemo) {
      if (daysThreshold <= 0) return 0;
      const cutoffTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
      const docsToDelete = activityLogs.filter(log => {
        if (!log.timestamp) return false;
        const logTime = new Date(log.timestamp).getTime();
        return !isNaN(logTime) && logTime < cutoffTime;
      });
      if (docsToDelete.length === 0) return 0;
      const updated = activityLogs.filter(log => {
        if (!log.timestamp) return true;
        const logTime = new Date(log.timestamp).getTime();
        return isNaN(logTime) || logTime >= cutoffTime;
      });
      setActivityLogs(updated);
      sessionStorage.setItem(`demo_logs_${user?.uid || 'guest'}`, JSON.stringify(updated));
      return docsToDelete.length;
    }
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

  const isLoggingInRef = useRef(false);

  const loginWithGoogle = async () => {
    if (isLoggingInRef.current) return;
    isLoggingInRef.current = true;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-closed-by-user'
      ) {
        console.log("Google Login popup closed or cancelled by user.");
      } else {
        console.error("Google Login Error:", error);
      }
    } finally {
      isLoggingInRef.current = false;
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
  const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<Transaction | null>(null);
  const [isTransactionDetailModalOpen, setIsTransactionDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [envelopeEditTarget, setEnvelopeEditTarget] = useState<Envelope | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalEditTarget, setGoalEditTarget] = useState<Goal | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billEditTarget, setBillEditTarget] = useState<Bill | null>(null);

  const openTransactionModal = (defaultCategory?: string) => {
    const validCategory = typeof defaultCategory === 'string' ? defaultCategory : undefined;
    setTransactionDefaultCategory(validCategory);
    setIsTransactionModalOpen(true);
  };
  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setTimeout(() => setTransactionDefaultCategory(undefined), 300);
  };

  const openTransactionDetailModal = (t: Transaction) => {
    setSelectedDetailTransaction(t);
    setIsTransactionDetailModalOpen(true);
  };
  const closeTransactionDetailModal = () => {
    setIsTransactionDetailModalOpen(false);
    setTimeout(() => setSelectedDetailTransaction(null), 300);
  };

  const openTransferModal = () => setIsTransferModalOpen(true);
  const closeTransferModal = () => setIsTransferModalOpen(false);

  const openEnvelopeModal = (target?: Envelope) => {
    const isEnvelope = target && typeof target === 'object' && 'allocatedAmount' in target;
    setEnvelopeEditTarget(isEnvelope ? target : null);
    setIsEnvelopeModalOpen(true);
  };
  const closeEnvelopeModal = () => {
    setIsEnvelopeModalOpen(false);
    setTimeout(() => setEnvelopeEditTarget(null), 300);
  };

  const openGoalModal = (target?: Goal) => {
    const isGoal = target && typeof target === 'object' && 'targetAmount' in target;
    setGoalEditTarget(isGoal ? target : null);
    setIsGoalModalOpen(true);
  };
  const closeGoalModal = () => {
    setIsGoalModalOpen(false);
    setTimeout(() => setGoalEditTarget(null), 300);
  };

  const openBillModal = (target?: Bill) => {
    const isBill = target && typeof target === 'object' && 'amount' in target;
    setBillEditTarget(isBill ? target : null);
    setIsBillModalOpen(true);
  };
  const closeBillModal = () => {
    setIsBillModalOpen(false);
    setTimeout(() => setBillEditTarget(null), 300);
  };

  return (
    <FinanceContext.Provider value={{
      workspace, setWorkspace,
      transactions, addTransaction, deleteTransaction, deleteTransactions,
      envelopes, addEnvelope, updateEnvelope, deleteEnvelope,
      goals, addGoal, updateGoal, deleteGoal, addGoalContribution,
      bills, addBill, updateBill, deleteBill, markBillPaid,
      customCategories, addCategory, updateCategory, deleteCategory,
      familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember,
      paymentAccounts, addPaymentAccount, updatePaymentAccount, deletePaymentAccount, reconcilePaymentAccount,
      debts, addDebt, updateDebt, deleteDebt, payDebt,
      assets, addAsset, updateAsset, deleteAsset, addAssetValuation, deleteAssetValuation,
      activityLogs, logActivity, deleteActivityLog, clearActivityLogs, autoCleanActivityLogs,
      user, superAdminId, isAuthLoading,
      loginWithGoogle, logout,
      isTransactionModalOpen, openTransactionModal, closeTransactionModal, transactionDefaultCategory,
      selectedDetailTransaction, isTransactionDetailModalOpen, openTransactionDetailModal, closeTransactionDetailModal,
      isTransferModalOpen, openTransferModal, closeTransferModal,
      isEnvelopeModalOpen, openEnvelopeModal, closeEnvelopeModal, envelopeEditTarget,
      isGoalModalOpen, openGoalModal, closeGoalModal, goalEditTarget,
      isBillModalOpen, openBillModal, closeBillModal, billEditTarget,
      isDemo, showDemoLimitModal, setShowDemoLimitModal, demoModalReason, setDemoModalReason, resetDemoTimer
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
