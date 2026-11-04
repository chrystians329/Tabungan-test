import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Calendar, Tag, Wallet as WalletIcon } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Belanja & Groceries',
  'Transportasi',
  'Tagihan & Utilitas',
  'Hiburan & Hobi',
  'Kesehatan & Medis',
  'Pendidikan',
  'Lain-lain',
];

const INCOME_CATEGORIES = [
  'Gaji Pokok',
  'Bonus & THR',
  'Freelance / Proyek',
  'Investasi & Dividen',
  'Hadiah & Hibah',
  'Penjualan',
  'Lain-lain',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction = null,
}) => {
  const { wallets, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(String(editingTransaction.amount));
      setWalletId(editingTransaction.walletId);
      setToWalletId(editingTransaction.toWalletId || '');
      setCategory(editingTransaction.category);
      setMerchant(editingTransaction.merchant || '');
      setDate(editingTransaction.date);
      setNote(editingTransaction.note);
    } else {
      setType(initialType);
      setAmountStr('');
      setWalletId(wallets[0]?.id || '');
      setToWalletId(wallets[1]?.id || wallets[0]?.id || '');
      setCategory(initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setMerchant('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [editingTransaction, initialType, wallets, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(amountStr.replace(/\D/g, ''));
    if (!amount || amount <= 0) {
      alert('Masukkan nominal uang yang valid.');
      return;
    }
    if (!walletId) {
      alert('Pilih dompet / rekening.');
      return;
    }
    if (type === 'transfer' && (!toWalletId || toWalletId === walletId)) {
      alert('Pilih dompet tujuan yang berbeda untuk transfer.');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        category: type === 'transfer' ? 'Transfer Saldo' : category,
        merchant,
        date,
        note,
      });
    } else {
      addTransaction({
        type,
        amount,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        category: type === 'transfer' ? 'Transfer Saldo' : category,
        merchant,
        date,
        note,
      });
    }

    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountStr(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkborder/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Transaction Type Segmented Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-darkbg rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(EXPENSE_CATEGORIES[0]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(INCOME_CATEGORIES[0]);
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                type === 'income'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nominal Uang
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                required
                autoFocus
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Source Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {type === 'transfer' ? 'Dari Dompet (Sumber)' : 'Sumber Dompet / Rekening'}
            </label>
            <div className="relative">
              <WalletIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.type.toUpperCase()}) - Sisa Rp{' '}
                    {new Intl.NumberFormat('id-ID').format(w.balance)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destination Wallet (if Transfer) */}
          {type === 'transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Ke Dompet (Tujuan)
              </label>
              <div className="relative">
                <WalletIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Category (if not Transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Kategori
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Merchant / Sumber & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Merchant / Tempat / Sumber
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="cth: Indomaret, Gaji PT..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan kecil pengingat..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-soft hover:shadow-glow transition"
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

