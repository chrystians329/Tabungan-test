import React from 'react';
import {
  WalletCards,
  Wallet as WalletIcon,
  Smartphone,
  Landmark,
  Plus,
  Edit2,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Wallet } from '../types';
import { formatRupiah } from '../utils/formatters';

interface WalletsViewProps {
  onOpenNewWallet: () => void;
  onEditWallet: (wallet: Wallet) => void;
  onOpenTransfer: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  onOpenNewWallet,
  onEditWallet,
  onOpenTransfer,
}) => {
  const { wallets, breakdown, deleteWallet } = useFinance();

  const cashWallets = wallets.filter((w) => w.type === 'cash');
  const ewallets = wallets.filter((w) => w.type === 'ewallet');
  const bankWallets = wallets.filter((w) => w.type === 'bank');

  const handleDelete = (w: Wallet) => {
    if (confirm(`Hapus dompet "${w.name}"? Saldo Rp ${new Intl.NumberFormat('id-ID').format(w.balance)} akan dihapus dari total.`)) {
      deleteWallet(w.id);
    }
  };

  const renderWalletCard = (w: Wallet) => {
    const isCash = w.type === 'cash';
    const isEWallet = w.type === 'ewallet';

    return (
      <div
        key={w.id}
        className="relative overflow-hidden rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-5 shadow-soft hover:shadow-md transition group flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isCash
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isEWallet
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}
            >
              {isCash ? (
                <WalletIcon className="w-5 h-5" />
              ) : isEWallet ? (
                <Smartphone className="w-5 h-5" />
              ) : (
                <Landmark className="w-5 h-5" />
              )}
            </div>

            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                {w.name}
              </span>
              <span className="text-[11px] text-slate-400 block font-mono">
                {w.accountNumber || (isCash ? 'Uang Fisik' : 'Tanpa No. Rek')}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => onEditWallet(w)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition"
              title="Edit Saldo / Nama"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(w)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
              title="Hapus Dompet"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-darkborder/60 flex items-end justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Saldo Aktif
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatRupiah(w.balance)}
            </span>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              isCash
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isEWallet
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            {isCash ? 'Cash' : isEWallet ? 'E-Wallet' : 'Bank'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-brand-500" />
            Dompet, E-Wallet & Rekening Bank
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola semua kantong penyimpanan uang Anda
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenTransfer}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-500" />
            <span>Transfer Antar Dompet</span>
          </button>

          <button
            onClick={onOpenNewWallet}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun / Dompet</span>
          </button>
        </div>
      </div>

      {/* 1. UANG CASH (TUNAI) SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              1. Uang Tunai / Cash ({cashWallets.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            Total: {formatRupiah(breakdown.cashTotal)} ({Math.round(breakdown.cashPercentage)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cashWallets.map(renderWalletCard)}
        </div>
      </div>

      {/* 2. E-WALLET SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              2. E-Wallet ({ewallets.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
            Total: {formatRupiah(breakdown.ewalletTotal)} ({Math.round(breakdown.ewalletPercentage)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ewallets.map(renderWalletCard)}
        </div>
      </div>

      {/* 3. REKENING BANK SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              3. Rekening Bank ({bankWallets.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            Total: {formatRupiah(breakdown.bankTotal)} ({Math.round(breakdown.bankPercentage)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankWallets.map(renderWalletCard)}
        </div>
      </div>
    </div>
  );
};

