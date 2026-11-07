export type WalletType = 'cash' | 'ewallet' | 'bank';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
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
  merchant?: string;
  createdAt: string;
}

export type GoalPriority = 'urgent' | 'biasa' | 'santai';

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
  userName: string;
  // Free Cloud Sync config (e.g. Supabase free tier or Google Drive)
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  syncEnabled: boolean;
  // Interval auto sinkron (ms). Default 4 detik.
  syncIntervalMs?: number;
  incomeTemplates?: IncomeTemplate[];
  expenseTemplates?: ExpenseTemplate[];
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

export interface IncomeTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  merchant?: string;
  note?: string;
  walletId?: string;
  createdAt: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  merchant?: string;
  note?: string;
  walletId?: string;
  createdAt: string;
}

export interface ScanHistoryItem {
  id: string;
  mode: 'receipt' | 'ewallet';
  amount: number;
  merchant: string;
  date: string;
  category: string;
  sourceType?: WalletType;
  rawText?: string;
  status: 'saved' | 'discarded';
  createdAt: string;
}

