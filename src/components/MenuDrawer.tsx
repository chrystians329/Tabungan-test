import React from 'react';
import {
  X,
  LayoutDashboard,
  Receipt,
  WalletCards,
  Target,
  ScanLine,
  FileSpreadsheet,
  Cloud,
  LayoutTemplate,
  RotateCcw,
  Moon,
  Sun,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ActiveTab } from './Sidebar';
import { formatRupiah } from '../utils/formatters';
import { useModalTransition } from '../hooks/useModalTransition';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenTemplateSettings: () => void;
  onOpenResetProgress: () => void;
  onOpenSyncModal: () => void;
  onOpenExportImport: () => void;
  onOpenScanModal: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onOpenTemplateSettings,
  onOpenResetProgress,
  onOpenSyncModal,
  onOpenExportImport,
  onOpenScanModal,
}) => {
  const { breakdown, settings, theme, toggleTheme, lastRemoteSyncAt } = useFinance();

  // Tetap mounted selama animasi close supaya drawer tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen, 220);

  if (!mounted) return null;

  const goTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
    { id: 'wallets', label: 'Dompet & Bank', icon: WalletCards },
    { id: 'goals', label: 'Target Goals', icon: Target },
    { id: 'scanner', label: 'Scan Struk / E-Wallet', icon: ScanLine },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Menu utama"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/60 ${
          isClosing ? 'fade-out pointer-events-none' : 'animate-fade-in'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`relative w-[85%] max-w-xs h-full bg-white dark:bg-darkcard border-r border-slate-200 dark:border-darkborder shadow-2xl flex flex-col ${
          isClosing ? 'animate-slide-out-left pointer-events-none' : 'animate-slide-in-left'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-soft flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center">
                <img src="/logo.svg" alt="KayaKu" className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                Kaya<span className="text-brand-500">Ku</span> Menu
              </span>
              <span className="text-[10px] text-slate-400">Kelola & atur aplikasi</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkbg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Menu navigasi */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => goTab(item.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition text-left"
                >
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Pengaturan */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Pengaturan & Data
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenTemplateSettings();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 transition text-left"
            >
              <span className="flex items-center space-x-3">
                <LayoutTemplate className="w-4 h-4 text-brand-500" />
                <span>Template Pemasukan</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-400">
                {(settings.incomeTemplates || []).length}
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenExportImport();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 transition text-left"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export / Import Excel</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSyncModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 transition text-left"
            >
              <span className="flex items-center space-x-3">
                <Cloud className="w-4 h-4 text-brand-500" />
                <span>Sinkron HP & Desktop</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.syncEnabled
                    ? 'bg-brand-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenScanModal();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 transition text-left"
            >
              <ScanLine className="w-4 h-4 text-brand-500" />
              <span>Scan Struk / E-Wallet</span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500/10 transition text-left"
            >
              <span className="flex items-center space-x-3">
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-darkbg text-slate-500 dark:text-slate-400">
                {theme === 'light' ? 'Terang' : 'Gelap'}
              </span>
            </button>
          </div>

          {/* Zona Berbahaya: Reset Total Progress */}
          <div className="space-y-1.5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              Zona Berbahaya
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenResetProgress();
              }}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition text-left"
            >
              <span className="flex items-center space-x-3">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Total Progress</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                0
              </span>
            </button>
            <p className="text-[10px] text-slate-400 px-2 leading-relaxed">
              Menghapus semua record transaksi, riwayat scan, dan menyetel seluruh saldo serta
              tabungan goals ke Rp 0.
            </p>
          </div>
        </div>

        {/* Footer mini stat */}
        <div className="p-4 border-t border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darkbg/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
              Total Kekayaan
            </span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400">
              {formatRupiah(breakdown.grandTotal)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-darkborder rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
              style={{ width: `${Math.min(100, breakdown.goalsPercentage)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Goals: {Math.round(breakdown.goalsPercentage)}%
            </span>
            <span>
              {lastRemoteSyncAt
                ? 'Tersinkron realtime'
                : settings.syncEnabled
                ? 'Auto-sync aktif'
                : 'Sync belum aktif'}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
};
