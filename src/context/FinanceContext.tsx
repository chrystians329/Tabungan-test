import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import {
  Wallet,
  Transaction,
  TransactionType,
  Goal,
  WealthBreakdown,
  AppSettings,
  ScanHistoryItem,
  IncomeTemplate,
  ExpenseTemplate,
} from '../types';
import {
  initSupabase,
  syncUpToSupabase,
  syncDownFromSupabase,
  subscribeToUserFinances,
  SyncPayload,
} from '../utils/cloudSync';
import { getLocalDateString } from '../utils/formatters';

interface FinanceContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  goals: Goal[];
  scanHistory: ScanHistoryItem[];
  settings: AppSettings;
  breakdown: WealthBreakdown;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Transactions CRUD
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Wallets CRUD
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;

  // Goals CRUD (Strictly Isolated from Main Wallets)
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  depositToGoal: (goalId: string, amount: number) => void;
  withdrawFromGoal: (goalId: string, amount: number) => void;

  // Scan History (Riwayat Scan Struk / E-Wallet)
  addScanHistory: (item: Omit<ScanHistoryItem, 'id' | 'createdAt'>) => void;
  deleteScanHistory: (id: string) => void;
  clearScanHistory: () => void;

  // Income Templates (Template Pemasukan)
  addIncomeTemplate: (tpl: Omit<IncomeTemplate, 'id' | 'createdAt'>) => void;
  updateIncomeTemplate: (id: string, tpl: Partial<IncomeTemplate>) => void;
  deleteIncomeTemplate: (id: string) => void;

  // Expense Templates (Template Pengeluaran)
  addExpenseTemplate: (tpl: Omit<ExpenseTemplate, 'id' | 'createdAt'>) => void;
  updateExpenseTemplate: (id: string, tpl: Partial<ExpenseTemplate>) => void;
  deleteExpenseTemplate: (id: string) => void;

  // Settings & Cloud Sync
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  syncWithCloud: () => Promise<boolean>;
  lastRemoteSyncAt: string | null;

  // Export / Import & Reset
  importAllData: (data: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    goals?: Goal[];
    scanHistory?: ScanHistoryItem[];
  }) => void;
  resetTotalProgress: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Default Wallets (All Balance: 0)
const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'w_cash_1',
    name: 'Dompet Tunai',
    type: 'cash',
    balance: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_ewallet_gopay',
    name: 'GoPay',
    type: 'ewallet',
    balance: 0,
    accountNumber: '0812-xxxx-xxxx',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_bank_bca',
    name: 'BCA Tahapan',
    type: 'bank',
    balance: 0,
    accountNumber: '8210-xxx-xxx',
    createdAt: new Date().toISOString(),
  },
];

// Initial Default Goals (All Current Saved: 0)
const DEFAULT_GOALS: Goal[] = [
  {
    id: 'g_dana_darurat',
    name: 'Dana Darurat',
    targetAmount: 10000000,
    currentAmount: 0,
    priority: 'urgent',
    deadline: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
    color: '#EF4444',
    notes: 'Prioritas tertinggi untuk dana cadangan darurat keluarga.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'g_laptop_kerja',
    name: 'Laptop Impian',
    targetAmount: 15000000,
    currentAmount: 0,
    priority: 'biasa',
    deadline: '2027-06-30',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
    color: '#3B82F6',
    notes: 'Target perangkat kerja baru.',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TEMPLATES: IncomeTemplate[] = [
  {
    id: 'tpl_gaji',
    name: 'Gaji Bulanan',
    amount: 5000000,
    category: 'Gaji Pokok',
    merchant: 'Gaji PT',
    note: 'Gaji bulanan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_freelance',
    name: 'Project Freelance',
    amount: 1000000,
    category: 'Freelance / Proyek',
    merchant: 'Klien Freelance',
    note: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_jajan',
    name: 'Uang Jajan',
    amount: 250000,
    category: 'Hadiah & Hibah',
    merchant: 'Dari Orang Tua',
    note: '',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  {
    id: 'tpl_exp_makan_siang',
    name: 'Makan Siang',
    amount: 25000,
    category: 'Makanan & Minuman',
    merchant: '',
    note: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_exp_bensin',
    name: 'Bensin / Transport',
    amount: 50000,
    category: 'Transportasi',
    merchant: '',
    note: '',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl_exp_kopi',
    name: 'Kopi / Jajan',
    amount: 20000,
    category: 'Makanan & Minuman',
    merchant: '',
    note: '',
    createdAt: new Date().toISOString(),
  },
];

// Initial Transactions (Empty clean list)
const DEFAULT_TRANSACTIONS: Transaction[] = [];
const DEFAULT_SCAN_HISTORY: ScanHistoryItem[] = [];

// Migration Flag to ensure existing browsers immediately reset to zero
const ZERO_RESET_KEY = 'kayaku_reset_zero_v3';
if (typeof window !== 'undefined') {
  if (localStorage.getItem(ZERO_RESET_KEY) !== 'true') {
    localStorage.setItem('kayaku_wallets', JSON.stringify(DEFAULT_WALLETS));
    localStorage.setItem('kayaku_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem('kayaku_goals', JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem('kayaku_scan_history', JSON.stringify(DEFAULT_SCAN_HISTORY));
    localStorage.setItem(ZERO_RESET_KEY, 'true');
  }
}

const BROADCAST_CHANNEL_NAME = 'kayaku_sync_channel';

/** Parse localStorage dengan aman (mencegah crash data korup). */
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kayaku_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('kayaku_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // State with LocalStorage persistence
  const [wallets, setWallets] = useState<Wallet[]>(() => safeParse('kayaku_wallets', DEFAULT_WALLETS));

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    safeParse('kayaku_transactions', DEFAULT_TRANSACTIONS)
  );

  const [goals, setGoals] = useState<Goal[]>(() => safeParse('kayaku_goals', DEFAULT_GOALS));

  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>(() =>
    safeParse('kayaku_scan_history', DEFAULT_SCAN_HISTORY)
  );

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = safeParse<Partial<AppSettings> | null>('kayaku_settings', null);
    return {
      userName: 'Pengguna Pintar',
      syncEnabled: false,
      syncIntervalMs: 4000,
      ...(saved || {}),
      incomeTemplates:
        saved?.incomeTemplates && Array.isArray(saved.incomeTemplates)
          ? saved.incomeTemplates
          : DEFAULT_TEMPLATES,
      expenseTemplates:
        saved?.expenseTemplates && Array.isArray(saved.expenseTemplates)
          ? saved.expenseTemplates
          : DEFAULT_EXPENSE_TEMPLATES,
    };
  });

  const [lastRemoteSyncAt, setLastRemoteSyncAt] = useState<string | null>(null);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('kayaku_wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem('kayaku_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('kayaku_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('kayaku_scan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  useEffect(() => {
    localStorage.setItem('kayaku_settings', JSON.stringify(settings));
  }, [settings]);

  // Real-time Cross-tab Sync via BroadcastChannel
  const broadcastChange = useCallback(
    (
      newWallets: Wallet[],
      newTxs: Transaction[],
      newGoals: Goal[],
      newScans: ScanHistoryItem[],
      newSettings?: AppSettings
    ) => {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({
          type: 'SYNC_STATE',
          payload: {
            wallets: newWallets,
            transactions: newTxs,
            goals: newGoals,
            scanHistory: newScans,
            settings: newSettings,
          },
        });
        channel.close();
      }
    },
    []
  );

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          const {
            wallets: w,
            transactions: t,
            goals: g,
            scanHistory: s,
            settings: st,
          } = event.data.payload;
          if (w) setWallets(w);
          if (t) setTransactions(t);
          if (g) setGoals(g);
          if (s) setScanHistory(s);
          if (st) setSettings((prev) => ({ ...prev, ...st }));
        }
      };
    }
    return () => {
      channel?.close();
    };
  }, []);

  // 5. Total Uang & Percentage Breakdown Calculation
  const breakdown: WealthBreakdown = useMemo(() => {
    const cashTotal = wallets
      .filter((w) => w.type === 'cash')
      .reduce((sum, w) => sum + (w.balance || 0), 0);

    const ewalletTotal = wallets
      .filter((w) => w.type === 'ewallet')
      .reduce((sum, w) => sum + (w.balance || 0), 0);

    const bankTotal = wallets
      .filter((w) => w.type === 'bank')
      .reduce((sum, w) => sum + (w.balance || 0), 0);

    const goalsTotal = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

    const grandTotal = cashTotal + ewalletTotal + bankTotal + goalsTotal;

    // Pakai abs agar persentase tetap valid saat grand total negatif (saldo minus)
    const denom = Math.abs(grandTotal);
    const cashPercentage = denom > 0 ? (cashTotal / denom) * 100 : 0;
    const ewalletPercentage = denom > 0 ? (ewalletTotal / denom) * 100 : 0;
    const bankPercentage = denom > 0 ? (bankTotal / denom) * 100 : 0;
    const goalsPercentage = denom > 0 ? (goalsTotal / denom) * 100 : 0;

    return {
      cashTotal,
      ewalletTotal,
      bankTotal,
      goalsTotal,
      grandTotal,
      cashPercentage,
      ewalletPercentage,
      bankPercentage,
      goalsPercentage,
    };
  }, [wallets, goals]);

  // ================= Transactions CRUD =================
  const adjustWalletBalances = (
    list: Wallet[],
    tx: { type: TransactionType; amount: number; walletId: string; toWalletId?: string },
    multiplier: 1 | -1
  ): Wallet[] => {
    return list.map((w) => {
      if (tx.type === 'income' && w.id === tx.walletId) {
        return { ...w, balance: w.balance + tx.amount * multiplier };
      }
      if (tx.type === 'expense' && w.id === tx.walletId) {
        return { ...w, balance: w.balance - tx.amount * multiplier };
      }
      if (tx.type === 'transfer') {
        if (w.id === tx.walletId) return { ...w, balance: w.balance - tx.amount * multiplier };
        if (w.id === tx.toWalletId) return { ...w, balance: w.balance + tx.amount * multiplier };
      }
      return w;
    });
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updatedWallets = adjustWalletBalances(wallets, txData, 1);
    const updatedTxs = [newTx, ...transactions];
    setWallets(updatedWallets);
    setTransactions(updatedTxs);
    broadcastChange(updatedWallets, updatedTxs, goals, scanHistory);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const newTx = { ...oldTx, ...updatedFields };
    let tempWallets = adjustWalletBalances(wallets, oldTx, -1);
    tempWallets = adjustWalletBalances(tempWallets, newTx, 1);

    const updatedTxs = transactions.map((t) => (t.id === id ? newTx : t));
    setWallets(tempWallets);
    setTransactions(updatedTxs);
    broadcastChange(tempWallets, updatedTxs, goals, scanHistory);
  };

  const deleteTransaction = (id: string) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const updatedWallets = adjustWalletBalances(wallets, oldTx, -1);
    const updatedTxs = transactions.filter((t) => t.id !== id);
    setWallets(updatedWallets);
    setTransactions(updatedTxs);
    broadcastChange(updatedWallets, updatedTxs, goals, scanHistory);
  };

  // ================= Wallets CRUD =================
  const addWallet = (walletData: Omit<Wallet, 'id' | 'createdAt'>) => {
    const newWallet: Wallet = {
      ...walletData,
      id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...wallets, newWallet];
    setWallets(updated);
    broadcastChange(updated, transactions, goals, scanHistory);
  };

  const updateWallet = (id: string, updatedFields: Partial<Wallet>) => {
    const updated = wallets.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
    setWallets(updated);
    broadcastChange(updated, transactions, goals, scanHistory);
  };

  const deleteWallet = (id: string) => {
    const remaining = wallets.filter((w) => w.id !== id);
    // Hindari wallet yatim (transaksi menunjuk dompet yang sudah tidak ada)
    const fallbackId =
      remaining.find((w) => w.type === wallets.find((x) => x.id === id)?.type)?.id ||
      remaining[0]?.id;

    const updatedTxs = fallbackId
      ? transactions.map((t) =>
          t.walletId === id || t.toWalletId === id
            ? {
                ...t,
                walletId: t.walletId === id ? fallbackId : t.walletId,
                toWalletId: t.toWalletId === id ? fallbackId : t.toWalletId,
              }
            : t
        )
      : transactions.filter((t) => t.walletId !== id && t.toWalletId !== id);

    setWallets(remaining);
    setTransactions(updatedTxs);
    broadcastChange(remaining, updatedTxs, goals, scanHistory);
  };

  // ================= Goals CRUD (Isolated) =================
  // Rule: Goals are strictly isolated from the main wallets.
  // Changes to main wallets do not affect goals, and changes in goals do not affect wallets.
  const addGoal = (goalData: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    broadcastChange(wallets, transactions, updated, scanHistory);
  };

  const updateGoal = (id: string, updatedFields: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g));
    setGoals(updated);
    broadcastChange(wallets, transactions, updated, scanHistory);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    broadcastChange(wallets, transactions, updated, scanHistory);
  };

  const depositToGoal = (goalId: string, amount: number) => {
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
    );
    setGoals(updated);
    broadcastChange(wallets, transactions, updated, scanHistory);
  };

  const withdrawFromGoal = (goalId: string, amount: number) => {
    const updated = goals.map((g) =>
      g.id === goalId
        ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) }
        : g
    );
    setGoals(updated);
    broadcastChange(wallets, transactions, updated, scanHistory);
  };

  // ================= Scan History =================
  const addScanHistory = (item: Omit<ScanHistoryItem, 'id' | 'createdAt'>) => {
    const newItem: ScanHistoryItem = {
      ...item,
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...scanHistory].slice(0, 200);
    setScanHistory(updated);
    broadcastChange(wallets, transactions, goals, updated);
  };

  const deleteScanHistory = (id: string) => {
    const updated = scanHistory.filter((s) => s.id !== id);
    setScanHistory(updated);
    broadcastChange(wallets, transactions, goals, updated);
  };

  const clearScanHistory = () => {
    setScanHistory([]);
    broadcastChange(wallets, transactions, goals, []);
  };

  // ================= Templates & Settings =================
  /** Simpan settings baru + broadcast ke tab lain agar template ikut sinkron. */
  const applySettings = (next: AppSettings) => {
    setSettings(next);
    broadcastChange(wallets, transactions, goals, scanHistory, next);
  };

  // ================= Templates CRUD =================
  const mutateTemplate = (
    key: 'incomeTemplates' | 'expenseTemplates',
    action: 'add' | 'update' | 'delete',
    data: any
  ) => {
    const current = settings[key] || [];
    let updated: (IncomeTemplate | ExpenseTemplate)[];
    if (action === 'add') {
      const newTpl: IncomeTemplate = {
        ...data,
        id: `${key === 'incomeTemplates' ? 'tpl' : 'tplexp'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      updated = [...current, newTpl];
    } else if (action === 'update') {
      updated = current.map((t) => (t.id === data.id ? { ...t, ...data.tpl } : t));
    } else {
      updated = current.filter((t) => t.id !== data.id);
    }
    applySettings({ ...settings, [key]: updated });
  };

  const addIncomeTemplate = (tpl: Omit<IncomeTemplate, 'id' | 'createdAt'>) =>
    mutateTemplate('incomeTemplates', 'add', tpl);
  const updateIncomeTemplate = (id: string, tpl: Partial<IncomeTemplate>) =>
    mutateTemplate('incomeTemplates', 'update', { id, tpl });
  const deleteIncomeTemplate = (id: string) =>
    mutateTemplate('incomeTemplates', 'delete', { id });

  const addExpenseTemplate = (tpl: Omit<ExpenseTemplate, 'id' | 'createdAt'>) =>
    mutateTemplate('expenseTemplates', 'add', tpl);
  const updateExpenseTemplate = (id: string, tpl: Partial<ExpenseTemplate>) =>
    mutateTemplate('expenseTemplates', 'update', { id, tpl });
  const deleteExpenseTemplate = (id: string) =>
    mutateTemplate('expenseTemplates', 'delete', { id });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    applySettings({ ...settings, ...newSettings });
  };

  const syncUserId = settings.userName?.trim() || 'default_user';

  const buildPayload = useCallback(
    (): SyncPayload => ({
      wallets,
      transactions,
      goals,
      scanHistory,
      incomeTemplates: settings.incomeTemplates || [],
      expenseTemplates: settings.expenseTemplates || [],
      updatedAt: new Date().toISOString(),
    }),
    [wallets, transactions, goals, scanHistory, settings.incomeTemplates, settings.expenseTemplates]
  );

  // Refs untuk mengatur lalu lintas sinkronisasi (mencegah loop & echo)
  const lastRemoteUpdatedAtRef = useRef<string>('');
  const skipPushUntilRef = useRef<number>(0);
  const pushTimerRef = useRef<number | null>(null);

  const applyRemotePayload = useCallback((payload: SyncPayload | null) => {
    if (!payload || !payload.updatedAt) return;
    if (payload.updatedAt <= lastRemoteUpdatedAtRef.current) return;
    lastRemoteUpdatedAtRef.current = payload.updatedAt;

    // Jangan push kembali perubahan yang barusan kita terima
    skipPushUntilRef.current = Date.now() + 3000;
    setLastRemoteSyncAt(payload.updatedAt);

    if (Array.isArray(payload.wallets)) setWallets(payload.wallets);
    if (Array.isArray(payload.transactions)) setTransactions(payload.transactions);
    if (Array.isArray(payload.goals)) setGoals(payload.goals);
    if (Array.isArray(payload.scanHistory)) setScanHistory(payload.scanHistory);
    if (Array.isArray(payload.incomeTemplates)) {
      setSettings((prev) => ({ ...prev, incomeTemplates: payload.incomeTemplates }));
    }
    if (Array.isArray(payload.expenseTemplates)) {
      setSettings((prev) => ({ ...prev, expenseTemplates: payload.expenseTemplates }));
    }
  }, []);

  const syncWithCloud = async (): Promise<boolean> => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      return false;
    }
    const client = initSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    if (!client) return false;

    const payload = buildPayload();
    const success = await syncUpToSupabase(syncUserId, payload);
    if (success) {
      lastRemoteUpdatedAtRef.current = payload.updatedAt;
      const remote = await syncDownFromSupabase(syncUserId);
      if (remote) applyRemotePayload(remote);
    }
    return success;
  };

  // --- Auto realtime sync: HP <-> Desktop (push saat berubah + realtime + polling) ---
  const isSyncReady =
    settings.syncEnabled && Boolean(settings.supabaseUrl) && Boolean(settings.supabaseAnonKey);

  useEffect(() => {
    if (!isSyncReady) return;
    initSupabase(settings.supabaseUrl!, settings.supabaseAnonKey!);
  }, [isSyncReady, settings.supabaseUrl, settings.supabaseAnonKey]);

  // Push perubahan lokal (debounced)
  useEffect(() => {
    if (!isSyncReady) return;
    if (Date.now() < skipPushUntilRef.current) return;

    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(async () => {
      if (Date.now() < skipPushUntilRef.current) return;
      const payload = buildPayload();
      const ok = await syncUpToSupabase(syncUserId, payload);
      if (ok) lastRemoteUpdatedAtRef.current = payload.updatedAt;
    }, 700);

    return () => {
      if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    };
  }, [
    isSyncReady,
    syncUserId,
    wallets,
    transactions,
    goals,
    scanHistory,
    settings.incomeTemplates,
    settings.expenseTemplates,
    buildPayload,
  ]);

  // Terima perubahan dari perangkat lain: Supabase Realtime + polling cadangan
  useEffect(() => {
    if (!isSyncReady) return;
    initSupabase(settings.supabaseUrl!, settings.supabaseAnonKey!);

    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToUserFinances(syncUserId, (payload) => applyRemotePayload(payload));
    } catch {
      unsubscribe = () => {};
    }

    const interval = window.setInterval(
      async () => {
        const remote = await syncDownFromSupabase(syncUserId);
        if (remote) applyRemotePayload(remote);
      },
      Math.max(2000, settings.syncIntervalMs || 4000)
    );

    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [isSyncReady, syncUserId, settings.syncIntervalMs, applyRemotePayload]);

  // ================= Import / Reset Data =================
  const txSignature = (t: Transaction) =>
    `${t.date}|${t.type}|${t.amount}|${t.walletId}|${t.toWalletId || ''}|${t.category}|${
      t.merchant || ''
    }`;

  const importAllData = (data: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    goals?: Goal[];
    scanHistory?: ScanHistoryItem[];
  }) => {
    // 1. Wallet: cocokkan berdasarkan nama+tipe agar tidak duplikat
    const walletIdMap = new Map<string, string>();
    let nextWallets = [...wallets];
    const normalize = (s?: string) => (s || '').trim().toLowerCase();

    (data.wallets || []).forEach((incoming, index) => {
      if (!incoming) return;
      const matched = nextWallets.find(
        (w) => normalize(w.name) === normalize(incoming.name) && w.type === incoming.type
      );
      if (matched) {
        if (incoming.id) walletIdMap.set(incoming.id, matched.id);
        return;
      }
      const id = incoming.id || `w_import_${Date.now()}_${index}`;
      walletIdMap.set(incoming.id || id, id);
      nextWallets.push({ ...incoming, id });
    });

    const resolveWalletId = (raw?: string): string => {
      if (!raw) return nextWallets[0]?.id || '';
      if (raw.startsWith('name:')) {
        const name = normalize(raw.slice(5));
        return nextWallets.find((w) => normalize(w.name) === name)?.id || nextWallets[0]?.id || '';
      }
      if (walletIdMap.has(raw)) return walletIdMap.get(raw)!;
      if (nextWallets.some((w) => w.id === raw)) return raw;
      return nextWallets[0]?.id || '';
    };

    // 2. Transactions: dedupe by id + signature, lalu relasikan ke dompet yang benar
    const existingIds = new Set(transactions.map((t) => t.id));
    const existingSigs = new Set(transactions.map(txSignature));
    const incomingTxs: Transaction[] = [];

    (data.transactions || []).forEach((incoming, index) => {
      if (!incoming || typeof incoming.amount !== 'number') return;
      const walletId = resolveWalletId(incoming.walletId);
      const toWalletId = incoming.toWalletId ? resolveWalletId(incoming.toWalletId) : undefined;
      if (!walletId) return;

      const normalizedTx: Transaction = {
        ...incoming,
        id: incoming.id || `tx_import_${Date.now()}_${index}`,
        walletId,
        toWalletId: toWalletId && toWalletId !== walletId ? toWalletId : undefined,
        date: incoming.date || getLocalDateString(),
        note: incoming.note || '',
        category: incoming.category || 'Lain-lain',
      };

      if (existingIds.has(normalizedTx.id)) return;
      const sig = txSignature(normalizedTx);
      if (existingSigs.has(sig)) return;

      existingIds.add(normalizedTx.id);
      existingSigs.add(sig);
      incomingTxs.push(normalizedTx);
    });

    // 3. Goals: dedupe by id + (nama + target)
    const existingGoalKeys = new Set(goals.map((g) => `${normalize(g.name)}|${g.targetAmount}`));
    const existingGoalIds = new Set(goals.map((g) => g.id));
    const incomingGoals: Goal[] = [];

    (data.goals || []).forEach((incoming, index) => {
      if (!incoming || !incoming.name) return;
      const id = incoming.id || `g_import_${Date.now()}_${index}`;
      const key = `${normalize(incoming.name)}|${incoming.targetAmount}`;
      if (existingGoalIds.has(id) || existingGoalKeys.has(key)) return;
      existingGoalIds.add(id);
      existingGoalKeys.add(key);
      incomingGoals.push({
        ...incoming,
        id,
        currentAmount: Number(incoming.currentAmount) || 0,
        targetAmount: Number(incoming.targetAmount) || 1,
        priority: incoming.priority || 'biasa',
      });
    });

    // 4. Riwayat scan: dedupe by id saja
    const existingScanIds = new Set(scanHistory.map((s) => s.id));
    const incomingScans = (data.scanHistory || []).filter(
      (s) => s && s.id && !existingScanIds.has(s.id)
    );

    const hasChange =
      nextWallets.length !== wallets.length ||
      incomingTxs.length > 0 ||
      incomingGoals.length > 0 ||
      incomingScans.length > 0;

    if (!hasChange) return;

    const nextTxs = [...incomingTxs, ...transactions];
    const nextGoals = [...goals, ...incomingGoals];
    const nextScans = [...incomingScans, ...scanHistory];

    setWallets(nextWallets);
    setTransactions(nextTxs);
    setGoals(nextGoals);
    setScanHistory(nextScans);
    broadcastChange(nextWallets, nextTxs, nextGoals, nextScans);
  };

  /**
   * Reset Total Progress: menghapus semua record transaksi, riwayat scan,
   * dan menyetel seluruh saldo dompet + tabungan goals kembali ke 0.
   */
  const resetTotalProgress = () => {
    const zeroWallets = wallets.map((w) => ({ ...w, balance: 0 }));
    const zeroGoals = goals.map((g) => ({ ...g, currentAmount: 0 }));
    setWallets(zeroWallets);
    setTransactions([]);
    setGoals(zeroGoals);
    setScanHistory([]);
    broadcastChange(zeroWallets, [], zeroGoals, []);

    if (isSyncReady) {
      const payload: SyncPayload = {
        wallets: zeroWallets,
        transactions: [],
        goals: zeroGoals,
        scanHistory: [],
        incomeTemplates: settings.incomeTemplates || [],
        expenseTemplates: settings.expenseTemplates || [],
        updatedAt: new Date().toISOString(),
      };
      syncUpToSupabase(syncUserId, payload).then((ok) => {
        if (ok) lastRemoteUpdatedAtRef.current = payload.updatedAt;
      });
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        wallets,
        transactions,
        goals,
        scanHistory,
        settings,
        breakdown,
        theme,
        setTheme,
        toggleTheme,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        addGoal,
        updateGoal,
        deleteGoal,
        depositToGoal,
        withdrawFromGoal,
        addScanHistory,
        deleteScanHistory,
        clearScanHistory,
        addIncomeTemplate,
        updateIncomeTemplate,
        deleteIncomeTemplate,
        addExpenseTemplate,
        updateExpenseTemplate,
        deleteExpenseTemplate,
        updateSettings,
        syncWithCloud,
        lastRemoteSyncAt,
        importAllData,
        resetTotalProgress,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
