import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  Target,
  ScanLine,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCompactRupiah } from '../utils/formatters';

export type ActiveTab = 'dashboard' | 'transactions' | 'wallets' | 'goals' | 'scanner';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { breakdown } = useFinance();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'Transaksi',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'wallets' as ActiveTab,
      label: 'Dompet & Bank',
      icon: WalletCards,
      badge: formatCompactRupiah(breakdown.cashTotal + breakdown.ewalletTotal + breakdown.bankTotal),
    },
    {
      id: 'goals' as ActiveTab,
      label: 'Target Goals',
      icon: Target,
      badge: formatCompactRupiah(breakdown.goalsTotal),
    },
    {
      id: 'scanner' as ActiveTab,
      label: 'Scan Struk / E-Wallet',
      icon: ScanLine,
      badge: 'AI/OCR',
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard h-[calc(100vh-4rem)] sticky top-16 transition-colors">
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Menu Utama
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg/70'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 dark:bg-darkbg text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Mini Card: Target Goals Teaser */}
      <div className="m-3 p-4 rounded-2xl border border-slate-200 dark:border-darkborder bg-slate-50/50 dark:bg-darkbg/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            Alokasi Tabungan
          </span>
          <span className="text-[11px] font-bold text-brand-500">
            {Math.round(breakdown.goalsPercentage)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-darkborder rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
            style={{ width: `${Math.min(100, breakdown.goalsPercentage)}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
          Goals terisolasi dari rekening utama Anda.
        </p>
      </div>
    </aside>
  );
};
