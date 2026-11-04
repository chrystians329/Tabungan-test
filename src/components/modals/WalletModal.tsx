import React, { useState, useEffect } from 'react';
import { X, Wallet as WalletIcon, Smartphone, Landmark } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet, WalletType } from '../../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWallet?: Wallet | null;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  editingWallet = null,
}) => {
  const { addWallet, updateWallet } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [balanceStr, setBalanceStr] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#10B981');

  useEffect(() => {
    if (editingWallet) {
      setName(editingWallet.name);
      setType(editingWallet.type);
      setBalanceStr(new Intl.NumberFormat('id-ID').format(editingWallet.balance));
      setAccountNumber(editingWallet.accountNumber || '');
      setColor(editingWallet.color || '#10B981');
    } else {
      setName('');
      setType('bank');
      setBalanceStr('');
      setAccountNumber('');
      setColor('#10B981');
    }
  }, [editingWallet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number(balanceStr.replace(/\D/g, '')) || 0;
    if (!name.trim()) {
      alert('Masukkan nama dompet / bank.');
      return;
    }

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        name,
        type,
        balance,
        accountNumber,
        color,
      });
    } else {
      addWallet({
        name,
        type,
        balance,
        accountNumber,
        color,
      });
    }
    onClose();
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setBalanceStr(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingWallet ? 'Edit Dompet / Rekening' : 'Tambah Dompet / Rekening Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wallet Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Jenis Akun Keuangan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  type === 'cash'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkbg'
                }`}
              >
                <WalletIcon className="w-5 h-5 mb-1" />
                <span className="text-xs">Uang Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setType('ewallet')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  type === 'ewallet'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkbg'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1" />
                <span className="text-xs">E-Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setType('bank')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  type === 'bank'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-darkbg'
                }`}
              >
                <Landmark className="w-5 h-5 mb-1" />
                <span className="text-xs">Bank</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nama Dompet / Bank
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: BCA Utama, Dompet Saku, GoPay..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Saldo Saat Ini
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={balanceStr}
                onChange={handleBalanceChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Account Number */}
          {type !== 'cash' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Nomor Rekening / No. HP E-Wallet (Opsional)
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="cth: 821-098-xxxx atau 0812-xxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-soft hover:shadow-glow transition"
            >
              {editingWallet ? 'Simpan Perubahan' : 'Tambah Dompet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

