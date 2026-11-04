import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Transaction,
  Goal,
  WealthBreakdown,
  AppSettings,
  GoalPriority,
} from '../types';
import { initSupabase, syncUpToSupabase, syncDownFromSupabase } from '../utils/cloudSync';

interface FinanceContextType {
  wallets: Wallet[];
  transactions: Transaction[];
  goals: Goal[];
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
  depositToGoal: (goalId: string, amount: number, note?: string) => void;
  withdrawFromGoal: (goalId: string, amount: number, note?: string) => void;

  // Settings & Cloud Sync
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  syncWithCloud: () => Promise<boolean>;

  // Export / Import & Reset
  importAllData: (data: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    goals?: Goal[];
  }) => void;
  resetAllData: () => void;
  resetToZero: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Default Wallets (All Balance: 0)
const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'w_cash_1',
    name: 'Dompet Tunai',
    type: 'cash',
    balance: 0,
    icon: 'Wallet',
    color: '#10B981',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_ewallet_gopay',
    name: 'GoPay',
    type: 'ewallet',
    balance: 0,
    icon: 'Smartphone',
    color: '#00AED6',
    accountNumber: '0812-xxxx-xxxx',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'w_bank_bca',
    name: 'BCA Tahapan',
    type: 'bank',
    balance: 0,
    icon: 'Landmark',
    color: '#005E9E',
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

// Initial Transactions (Empty clean list)
const DEFAULT_TRANSACTIONS: Transaction[] = [];

// Migration Flag to ensure existing browsers immediately reset to zero
const ZERO_RESET_KEY = 'kayaku_reset_zero_v3';
if (typeof window !== 'undefined') {
  if (localStorage.getItem(ZERO_RESET_KEY) !== 'true') {
    localStorage.setItem('kayaku_wallets', JSON.stringify(DEFAULT_WALLETS));
    localStorage.setItem('kayaku_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
    localStorage.setItem('kayaku_goals', JSON.stringify(DEFAULT_GOALS));
    localStorage.setItem(ZERO_RESET_KEY, 'true');
  }
}

const BROADCAST_CHANNEL_NAME = 'kayaku_sync_channel';

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
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('kayaku_wallets');
    return saved ? JSON.parse(saved) : DEFAULT_WALLETS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kayaku_transactions');
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('kayaku_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('kayaku_settings');
    return saved
      ? JSON.parse(saved)
      : {
          theme: 'light',
          currency: 'IDR',
          userName: 'Pengguna Pintar',
          syncEnabled: false,
        };
  });

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
    localStorage.setItem('kayaku_settings', JSON.stringify(settings));
  }, [settings]);

  // Real-time Cross-tab Sync via BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          const { wallets: w, transactions: t, goals: g } = event.data.payload;
          if (w) setWallets(w);
          if (t) setTransactions(t);
          if (g) setGoals(g);
        }
      };
    }
    return () => {
      channel?.close();
    };
  }, []);

  const broadcastChange = (newWallets: Wallet[], newTxs: Transaction[], newGoals: Goal[]) => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'SYNC_STATE',
        payload: { wallets: newWallets, transactions: newTxs, goals: newGoals },
      });
      channel.close();
    }
  };

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

    const cashPercentage = grandTotal > 0 ? (cashTotal / grandTotal) * 100 : 0;
    const ewalletPercentage = grandTotal > 0 ? (ewalletTotal / grandTotal) * 100 : 0;
    const bankPercentage = grandTotal > 0 ? (bankTotal / grandTotal) * 100 : 0;
    const goalsPercentage = grandTotal > 0 ? (goalsTotal / grandTotal) * 100 : 0;

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
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    // Update wallet balance accordingly
    const updatedWallets = wallets.map((w) => {
      if (txData.type === 'income' && w.id === txData.walletId) {
        return { ...w, balance: w.balance + txData.amount };
      }
      if (txData.type === 'expense' && w.id === txData.walletId) {
        return { ...w, balance: Math.max(0, w.balance - txData.amount) };
      }
      if (txData.type === 'transfer') {
        if (w.id === txData.walletId) {
          return { ...w, balance: Math.max(0, w.balance - txData.amount) };
        }
        if (w.id === txData.toWalletId) {
          return { ...w, balance: w.balance + txData.amount };
        }
      }
      return w;
    });

    const updatedTxs = [newTx, ...transactions];
    setWallets(updatedWallets);
    setTransactions(updatedTxs);
    broadcastChange(updatedWallets, updatedTxs, goals);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    // Rollback old transaction on wallets
    let tempWallets = [...wallets];
    if (oldTx.type === 'income') {
      tempWallets = tempWallets.map((w) =>
        w.id === oldTx.walletId ? { ...w, balance: w.balance - oldTx.amount } : w
      );
    } else if (oldTx.type === 'expense') {
      tempWallets = tempWallets.map((w) =>
        w.id === oldTx.walletId ? { ...w, balance: w.balance + oldTx.amount } : w
      );
    } else if (oldTx.type === 'transfer') {
      tempWallets = tempWallets.map((w) => {
        if (w.id === oldTx.walletId) return { ...w, balance: w.balance + oldTx.amount };
        if (w.id === oldTx.toWalletId) return { ...w, balance: w.balance - oldTx.amount };
        return w;
      });
    }

    // Apply new transaction state
    const newTx = { ...oldTx, ...updatedFields };
    if (newTx.type === 'income') {
      tempWallets = tempWallets.map((w) =>
        w.id === newTx.walletId ? { ...w, balance: w.balance + newTx.amount } : w
      );
    } else if (newTx.type === 'expense') {
      tempWallets = tempWallets.map((w) =>
        w.id === newTx.walletId ? { ...w, balance: w.balance - newTx.amount } : w
      );
    } else if (newTx.type === 'transfer') {
      tempWallets = tempWallets.map((w) => {
        if (w.id === newTx.walletId) return { ...w, balance: w.balance - newTx.amount };
        if (w.id === newTx.toWalletId) return { ...w, balance: w.balance + newTx.amount };
        return w;
      });
    }

    const updatedTxs = transactions.map((t) => (t.id === id ? newTx : t));
    setWallets(tempWallets);
    setTransactions(updatedTxs);
    broadcastChange(tempWallets, updatedTxs, goals);
  };

  const deleteTransaction = (id: string) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    let updatedWallets = [...wallets];
    if (oldTx.type === 'income') {
      updatedWallets = updatedWallets.map((w) =>
        w.id === oldTx.walletId ? { ...w, balance: w.balance - oldTx.amount } : w
      );
    } else if (oldTx.type === 'expense') {
      updatedWallets = updatedWallets.map((w) =>
        w.id === oldTx.walletId ? { ...w, balance: w.balance + oldTx.amount } : w
      );
    } else if (oldTx.type === 'transfer') {
      updatedWallets = updatedWallets.map((w) => {
        if (w.id === oldTx.walletId) return { ...w, balance: w.balance + oldTx.amount };
        if (w.id === oldTx.toWalletId) return { ...w, balance: w.balance - oldTx.amount };
        return w;
      });
    }

    const updatedTxs = transactions.filter((t) => t.id !== id);
    setWallets(updatedWallets);
    setTransactions(updatedTxs);
    broadcastChange(updatedWallets, updatedTxs, goals);
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
    broadcastChange(updated, transactions, goals);
  };

  const updateWallet = (id: string, updatedFields: Partial<Wallet>) => {
    const updated = wallets.map((w) => (w.id === id ? { ...w, ...updatedFields } : w));
    setWallets(updated);
    broadcastChange(updated, transactions, goals);
  };

  const deleteWallet = (id: string) => {
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    broadcastChange(updated, transactions, goals);
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
    broadcastChange(wallets, transactions, updated);
  };

  const updateGoal = (id: string, updatedFields: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g));
    setGoals(updated);
    broadcastChange(wallets, transactions, updated);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    broadcastChange(wallets, transactions, updated);
  };

  const depositToGoal = (goalId: string, amount: number, _note?: string) => {
    const updated = goals.map((g) =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
    );
    setGoals(updated);
    broadcastChange(wallets, transactions, updated);
  };

  const withdrawFromGoal = (goalId: string, amount: number, _note?: string) => {
    const updated = goals.map((g) =>
      g.id === goalId
        ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount) }
        : g
    );
    setGoals(updated);
    broadcastChange(wallets, transactions, updated);
  };

  // ================= Cloud Sync & Settings =================
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const syncWithCloud = async (): Promise<boolean> => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
      return false;
    }
    const client = initSupabase(settings.supabaseUrl, settings.supabaseAnonKey);
    if (!client) return false;

    const payload = { wallets, transactions, goals };
    const success = await syncUpToSupabase(settings.userName || 'default_user', payload);
    if (success) {
      updateSettings({ lastSyncedAt: new Date().toISOString() });
    }
    return success;
  };

  // ================= Import / Reset Data =================
  const importAllData = (data: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    goals?: Goal[];
  }) => {
    let newWallets = wallets;
    let newTxs = transactions;
    let newGoals = goals;

    if (data.wallets && data.wallets.length > 0) {
      newWallets = [...wallets, ...data.wallets];
      setWallets(newWallets);
    }
    if (data.transactions && data.transactions.length > 0) {
      newTxs = [...data.transactions, ...transactions];
      setTransactions(newTxs);
    }
    if (data.goals && data.goals.length > 0) {
      newGoals = [...goals, ...data.goals];
      setGoals(newGoals);
    }

    broadcastChange(newWallets, newTxs, newGoals);
  };

  const resetAllData = () => {
    setWallets(DEFAULT_WALLETS);
    setTransactions(DEFAULT_TRANSACTIONS);
    setGoals(DEFAULT_GOALS);
    broadcastChange(DEFAULT_WALLETS, DEFAULT_TRANSACTIONS, DEFAULT_GOALS);
  };

  const resetToZero = () => {
    const zeroWallets = wallets.map((w) => ({ ...w, balance: 0 }));
    const zeroGoals = goals.map((g) => ({ ...g, currentAmount: 0 }));
    setWallets(zeroWallets);
    setTransactions([]);
    setGoals(zeroGoals);
    broadcastChange(zeroWallets, [], zeroGoals);
  };

  return (
    <FinanceContext.Provider
      value={{
        wallets,
        transactions,
        goals,
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
        updateSettings,
        syncWithCloud,
        importAllData,
        resetAllData,
        resetToZero,
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

