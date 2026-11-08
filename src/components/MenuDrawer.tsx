import React from 'react';
import {
  X,
  Receipt,
  ScanLine,
  FileSpreadsheet,
  Cloud,
  LayoutTemplate,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useModalTransition } from '../hooks/useModalTransition';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplateSettings: (tab: 'income' | 'expense') => void;
  onOpenResetProgress: () => void;
  onOpenSyncModal: () => void;
  onOpenExportImport: () => void;
  onOpenScanModal: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTemplateSettings,
  onOpenResetProgress,
  onOpenSyncModal,
  onOpenExportImport,
  onOpenScanModal,
}) => {
  const { settings } = useFinance();

  // Tetap mounted selama animasi close supaya drawer tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen, 220);

  if (!mounted) return null;

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
        {/* Header — pt-safe agar tidak menabrak status bar HP */}
        <div className="flex items-center justify-between px-4 py-4 pt-safe border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-soft flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="KayaKu"
                  className="w-5 h-5"
                />
              </div>
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block leading-tight">
                Kaya<span className="text-brand-500">Ku</span> Menu
              </span>
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
          {/* Pengaturan */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Pengaturan & Data
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenTemplateSettings('income');
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
                onOpenTemplateSettings('expense');
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-rose-500/10 transition text-left"
            >
              <span className="flex items-center space-x-3">
                <Receipt className="w-4 h-4 text-rose-500" />
                <span>Template Pengeluaran</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                {(settings.expenseTemplates || []).length}
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
              onClick={() => {
                onClose();
                onOpenResetProgress();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition text-left"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Total Progress</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
