import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  Target,
  Plus,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-darkborder pb-safe transition-colors">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto relative">
        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'dashboard'
              ? 'text-brand-500 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* 2. Transaksi */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'transactions'
              ? 'text-brand-500 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Transaksi</span>
        </button>

        {/* 3. Center Elevated Quick Add Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickAction}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition"
            aria-label="Aksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Dompet & Bank */}
        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'wallets'
              ? 'text-brand-500 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <WalletCards className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dompet</span>
        </button>

        {/* 5. Goals */}
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            activeTab === 'goals'
              ? 'text-brand-500 font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Goals</span>
        </button>
      </div>
    </nav>
  );
};

