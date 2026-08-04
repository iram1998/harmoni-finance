export type WorkspaceType = 'pribadi' | 'keluarga' | 'all';
export type IncomeCategory = 'fixed' | 'variable';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  workspaceId: WorkspaceType;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  incomeCategory?: IncomeCategory;
  familyMember?: string;
  createdAt?: string;
  goalId?: string;
  paymentAccountId?: string;
  assetId?: string;
  isCapitalization?: boolean;
}

export interface Envelope {
  id: string;
  workspaceId: WorkspaceType;
  category: string;
  allocatedAmount: number;
}

export interface Goal {
  id: string;
  workspaceId: WorkspaceType;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  startDate?: string;
}

export interface Bill {
  id: string;
  workspaceId: WorkspaceType;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color?: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  monthlyBudget: number;
  email?: string;
}

export interface AssetValuationHistory {
  id: string;
  date: string;
  value: number;
  note?: string;
  createdAt?: string;
}

export interface Asset {
  id: string;
  userId: string;
  workspaceId: WorkspaceType;
  name: string;
  category: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  notes?: string;
  status: 'owned' | 'sold' | 'liquidated';
  depreciationMethod?: 'none' | 'straight_line' | 'declining_balance';
  depreciationUsefulLife?: number;
  depreciationSalvageValue?: number;
  useAutoDepreciation?: boolean;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  areaSize?: number;
  parentAssetId?: string;
  createdAt?: string;
  valuationHistory?: AssetValuationHistory[];
}

export interface PaymentAccount {
  id: string;
  userId: string;
  workspaceId: WorkspaceType;
  name: string;
  type: 'bank' | 'ewallet' | 'cash' | 'investment';
  accountNumber?: string;
  holderName?: string;
  balance: number;
  color?: string;
}

export interface Debt {
  id: string;
  userId: string;
  workspaceId: WorkspaceType;
  name: string;
  type: 'payable' | 'receivable';
  amount: number;
  remainingAmount: number;
  dueDate?: string;
  status: 'active' | 'paid';
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  workspaceId: WorkspaceType;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'TRANSACTION' | 'ASSET' | 'BILL' | 'ENVELOPE' | 'GOAL' | 'CATEGORY' | 'FAMILY_MEMBER' | 'PAYMENT_ACCOUNT' | 'DEBT' | 'SYSTEM';
  title: string;
  details: string;
  timestamp: string;
}

