export type WalletType = 'cash' | 'ewallet' | 'bank';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  icon?: string;
  color?: string;
  accountNumber?: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string; // used for transfer between wallets
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  receiptImageUrl?: string;
  merchant?: string;
  createdAt: string;
}

export type GoalPriority = 'urgent' | 'biasa' | 'santai';

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  type: 'deposit' | 'withdraw';
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  priority: GoalPriority;
  deadline?: string; // YYYY-MM-DD
  imageUrl?: string;
  color?: string;
  notes?: string;
  createdAt: string;
}

export interface WealthBreakdown {
  cashTotal: number;
  ewalletTotal: number;
  bankTotal: number;
  goalsTotal: number;
  grandTotal: number;
  cashPercentage: number;
  ewalletPercentage: number;
  bankPercentage: number;
  goalsPercentage: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  userName: string;
  // Free Cloud Sync config (e.g. Supabase free tier or Google Drive)
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  syncEnabled: boolean;
  lastSyncedAt?: string;
}

export interface OCRResult {
  merchant?: string;
  amount?: number;
  date?: string;
  rawText: string;
  category?: string;
  detectedType?: 'receipt' | 'ewallet';
  sourceWalletType?: WalletType;
}

