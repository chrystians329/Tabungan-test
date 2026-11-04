import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Tag,
  Wallet as WalletIcon,
  LayoutTemplate,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { useModalTransition } from '../../hooks/useModalTransition';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  /** Data hasil scan / template yang di-prefill sebagai transaksi BARU */
  prefillTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction = null,
  prefillTransaction = null,
}) => {
  const { wallets, settings, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Editing hanya bila benar-benar punya id (hasil scan/template = transaksi baru)
  const isEditing = Boolean(editingTransaction && editingTransaction.id);

  // Tetap mounted selama animasi close supaya tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen);

  useEffect(() => {
    // Hanya isi ulang form saat modal dibuka (saat menutup form sengaja dibiarkan
    // supaya isinya tidak mendadak kosong selama animasi close)
    if (!isOpen) return;

    if (isEditing && editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(new Intl.NumberFormat('id-ID').format(editingTransaction.amount));
      setWalletId(editingTransaction.walletId);
      setToWalletId(editingTransaction.toWalletId || '');
      setCategory(editingTransaction.category);
      setMerchant(editingTransaction.merchant || '');
      setDate(editingTransaction.date);
      setNote(editingTransaction.note);
      return;
    }

    const source = prefillTransaction;
    const nextType = source?.type || initialType;
    setType(nextType);
    setAmountStr(source?.amount ? new Intl.NumberFormat('id-ID').format(source.amount) : '');
    setWalletId(source?.walletId || wallets[0]?.id || '');
    setToWalletId(wallets[1]?.id || wallets[0]?.id || '');
    setCategory(
      source?.category ||
        (nextType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
    );
    setMerchant(source?.merchant || '');
    setDate(source?.date || new Date().toISOString().split('T')[0]);
    setNote(source?.note || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction, prefillTransaction, initialType, isOpen]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing) return;
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

    if (isEditing && editingTransaction) {
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

  const incomeTemplates = settings.incomeTemplates || [];

  const applyTemplate = (tpl: (typeof incomeTemplates)[number]) => {
    setType('income');
    setAmountStr(tpl.amount ? new Intl.NumberFormat('id-ID').format(tpl.amount) : '');
    setCategory(tpl.category);
    setMerchant(tpl.merchant || '');
    setNote(tpl.note || '');
    if (tpl.walletId && wallets.some((w) => w.id === tpl.walletId)) {
      setWalletId(tpl.walletId);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  // Pastikan kategori hasil scan/OCR selalu tampil di dropdown
  const categoryOptions =
    category && !categories.includes(category) ? [category, ...categories] : categories;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 ${
        isClosing ? 'fade-out pointer-events-none' : 'animate-fade-in'
      }`}
    >
      <div
        className={`w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden ${
          isClosing ? 'modal-out pointer-events-none' : 'modal-in'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
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

          {/* Template Pemasukan (cepat, bisa diatur di hamburger menu) */}
          {type === 'income' && incomeTemplates.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-brand-500" />
                Template Pemasukan
              </label>
              <div className="flex flex-wrap gap-1.5">
                {incomeTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-[11px] font-bold hover:bg-brand-500 hover:text-white transition"
                    title={`Isi otomatis: ${tpl.name}`}
                  >
                    {tpl.name}
                    <span className="opacity-70 font-semibold">
                      {' '}
                      · {new Intl.NumberFormat('id-ID').format(tpl.amount)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                inputMode="numeric"
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
                  {categoryOptions.map((c) => (
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
          <div className="pt-2 space-y-2">
            {!isEditing && prefillTransaction && (
              <p className="text-[11px] text-center text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-xl py-2 px-3">
                Data dari hasil scan siap disimpan sebagai transaksi baru.
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-soft hover:shadow-glow transition"
            >
              {isEditing ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

