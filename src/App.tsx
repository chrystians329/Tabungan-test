import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { WalletsView } from './views/WalletsView';
import { GoalsView } from './views/GoalsView';
import { ScanView } from './views/ScanView';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { WalletModal } from './components/modals/WalletModal';
import { GoalModal } from './components/modals/GoalModal';
import { GoalActionModal } from './components/modals/GoalActionModal';
import { ScanModal } from './components/modals/ScanModal';
import { CloudSyncModal } from './components/modals/CloudSyncModal';
import { ExportImportModal } from './components/modals/ExportImportModal';
import { InstallPwaModal } from './components/modals/InstallPwaModal';

// Types
import { Transaction, Wallet, Goal, TransactionType } from './types';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ScanLine, Target, X, Smartphone } from 'lucide-react';

const AppContent: React.FC = () => {
  const { wallets } = useFinance();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isGoalActionOpen, setIsGoalActionOpen] = useState(false);
  const [actionGoal, setActionGoal] = useState<Goal | null>(null);
  const [goalActionMode, setGoalActionMode] = useState<'deposit' | 'withdraw'>('deposit');

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Mobile Quick Action Drawer / Bottom Sheet
  const [isMobileQuickMenuOpen, setIsMobileQuickMenuOpen] = useState(false);

  // Handlers
  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setEditingTx(null);
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleOpenNewWallet = () => {
    setEditingWallet(null);
    setIsWalletModalOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsWalletModalOpen(true);
  };

  const handleOpenTransfer = () => {
    setEditingTx(null);
    setTxModalType('transfer');
    setIsTxModalOpen(true);
  };

  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleOpenGoalAction = (goal: Goal, mode: 'deposit' | 'withdraw') => {
    setActionGoal(goal);
    setGoalActionMode(mode);
    setIsGoalActionOpen(true);
  };

  const handleConfirmScanTransaction = (data: {
    amount: number;
    merchant: string;
    date: string;
    category: string;
    sourceType?: 'cash' | 'ewallet' | 'bank';
  }) => {
    // Determine wallet id based on source type
    const matchingWallet = data.sourceType
      ? wallets.find((w) => w.type === data.sourceType)
      : wallets[0];

    setEditingTx({
      id: '',
      type: 'expense',
      amount: data.amount,
      walletId: matchingWallet?.id || wallets[0]?.id || '',
      category: data.category,
      date: data.date,
      merchant: data.merchant,
      note: 'Dicatat dari hasil Scan Pintar',
      createdAt: new Date().toISOString(),
    });
    setTxModalType('expense');
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* 1. Header Navbar */}
      <Navbar
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* 2. Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* 3. Main Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenScanModal={() => setIsScanModalOpen(true)}
              onOpenGoalModal={handleOpenNewGoal}
              onOpenGoalAction={handleOpenGoalAction}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              onOpenExportImport={() => setIsExportImportOpen(true)}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsView
              onOpenNewWallet={handleOpenNewWallet}
              onEditWallet={handleEditWallet}
              onOpenTransfer={handleOpenTransfer}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              onOpenNewGoal={handleOpenNewGoal}
              onEditGoal={handleEditGoal}
              onOpenGoalAction={handleOpenGoalAction}
            />
          )}

          {activeTab === 'scanner' && (
            <ScanView onConfirmTransaction={handleConfirmScanTransaction} />
          )}
        </main>
      </div>

      {/* 4. Mobile Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAction={() => setIsMobileQuickMenuOpen(true)}
      />

      {/* Mobile Quick Action Drawer */}
      {isMobileQuickMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm lg:hidden">
          <div className="w-full bg-white dark:bg-darkcard rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-darkborder p-6 pb-safe space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Aksi Cepat
              </span>
              <button
                onClick={() => setIsMobileQuickMenuOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsMobileQuickMenuOpen(false);
                  handleOpenNewTransaction('expense');
                }}
                className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center space-x-2.5 font-semibold text-xs border border-rose-500/20"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileQuickMenuOpen(false);
                  handleOpenNewTransaction('income');
                }}
                className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2.5 font-semibold text-xs border border-emerald-500/20"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileQuickMenuOpen(false);
                  handleOpenTransfer();
                }}
                className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center space-x-2.5 font-semibold text-xs border border-blue-500/20"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transfer Dompet</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileQuickMenuOpen(false);
                  setIsScanModalOpen(true);
                }}
                className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center space-x-2.5 font-semibold text-xs border border-brand-500/20"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Struk / QR</span>
              </button>
            </div>

            {/* Install to Home Screen Bar for Mobile */}
            <button
              onClick={() => {
                setIsMobileQuickMenuOpen(false);
                setIsInstallModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-white dark:bg-brand-500 dark:text-white flex items-center justify-between text-xs font-bold shadow-soft transition"
            >
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-brand-400 dark:text-white" />
                <span>Pasang / Install KayaKu di HP</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                Gratis PWA
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Modals Container */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialType={txModalType}
        editingTransaction={editingTx}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        editingWallet={editingWallet}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
      />

      <GoalActionModal
        isOpen={isGoalActionOpen}
        onClose={() => setIsGoalActionOpen(false)}
        goal={actionGoal}
        mode={goalActionMode}
      />

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onConfirmTransaction={handleConfirmScanTransaction}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
      />

      <InstallPwaModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default App;

