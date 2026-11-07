import React from 'react';
import { Cloud, FileSpreadsheet, Menu, Moon, Sun } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah } from '../utils/formatters';

interface NavbarProps {
  onOpenMenu: () => void;
  onOpenSyncModal: () => void;
  onOpenExportImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMenu,
  onOpenSyncModal,
  onOpenExportImport,
}) => {
  const { breakdown, settings, theme, toggleTheme } = useFinance();

  return (
    <header className="sticky top-0 z-30 pt-safe bg-white dark:bg-darkcard border-b border-slate-200/80 dark:border-darkborder transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Hamburger (kiri logo) + Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMenu}
            aria-label="Buka menu"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-darkbg border border-slate-200 dark:border-darkborder text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:border-slate-600 active:scale-95 transition shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-soft flex items-center justify-center shrink-0">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                theme === 'dark' ? 'bg-slate-900' : 'bg-white'
              }`}>
                <img
                  src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
                  alt="KayaKu Logo"
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
            <span className="hidden xs:inline font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Kaya<span className="text-brand-500">Ku</span>
            </span>
          </div>
        </div>

        {/* Total uang (angka saja) */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-darkbg px-3 py-1.5 rounded-full border border-slate-200 dark:border-darkborder">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
            {formatRupiah(breakdown.grandTotal)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Mode gelap' : 'Mode terang'}
            aria-pressed={theme === 'dark'}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-darkborder bg-slate-100 dark:bg-darkbg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-darkborder/50 transition"
            title={theme === 'light' ? 'Mode gelap' : 'Mode terang'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenExportImport}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder/50 transition"
            title="Export / Import Excel & Data"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSyncModal}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder/50 transition"
            title="Sinkronisasi HP & Desktop (Realtime)"
          >
            <Cloud className="w-4 h-4" />
            {settings.syncEnabled ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
