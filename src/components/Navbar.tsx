import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  FileSpreadsheet,
  ScanLine,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah } from '../utils/formatters';

interface NavbarProps {
  onOpenNewTransaction: (type?: 'income' | 'expense') => void;
  onOpenSyncModal: () => void;
  onOpenExportImport: () => void;
  onOpenScanModal: () => void;
  onOpenInstallModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTransaction,
  onOpenSyncModal,
  onOpenExportImport,
  onOpenScanModal,
  onOpenInstallModal,
}) => {
  const { theme, toggleTheme, breakdown, settings } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-darkcard/80 backdrop-blur-md border-b border-slate-200/80 dark:border-darkborder transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-soft flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <img src="/logo.svg" alt="KayaKu Logo" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Kaya<span className="text-brand-500">Ku</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Manajemen Keuangan & Target Tabungan
            </p>
          </div>
        </div>

        {/* Center / Right Metrics Badge (Desktop) */}
        <div className="hidden md:flex items-center space-x-3 bg-slate-100 dark:bg-darkbg px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-darkborder">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Kekayaan:</span>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
            {formatRupiah(breakdown.grandTotal)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Transaction Buttons (Desktop) */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <button
              onClick={() => onOpenNewTransaction('income')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition"
              title="Tambah Pemasukan"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>

            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition"
              title="Tambah Pengeluaran"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Scan Button */}
          <button
            onClick={onOpenScanModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow transition"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Struk / E-Wallet</span>
          </button>

          {/* Export / Import Button */}
          <button
            onClick={onOpenExportImport}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder/50 transition"
            title="Export / Import Excel & Data"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenSyncModal}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder/50 transition"
            title="Sinkronisasi Cloud (Mobile & Desktop)"
          >
            <Cloud className="w-4 h-4" />
            {settings.syncEnabled && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            )}
          </button>

          {/* Install Mobile App Button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold transition border border-brand-500/20"
            title="Install KayaKu di HP"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">App HP</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkborder/50 transition"
            title={`Ganti ke mode ${theme === 'light' ? 'Gelap' : 'Terang'}`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

