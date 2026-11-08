import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface TransactionsViewProps {
  onOpenNewTransaction: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenExportImport: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenNewTransaction,
  onEditTransaction,
  onOpenExportImport,
}) => {
  const { transactions, wallets, deleteTransaction } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterWalletId, setFilterWalletId] = useState<string>('all');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Wallet filter
      if (filterWalletId !== 'all' && t.walletId !== filterWalletId && t.toWalletId !== filterWalletId) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesMerchant = (t.merchant || '').toLowerCase().includes(q);
        const matchesNote = (t.note || '').toLowerCase().includes(q);
        const matchesAmount = String(t.amount).includes(q);
        if (!matchesCategory && !matchesMerchant && !matchesNote && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, filterWalletId, searchQuery]);

  // Aggregate stats of filtered
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalFilteredIncome - totalFilteredExpense;

  const handleDelete = (id: string, merchantOrCat: string) => {
    if (confirm(`Yakin ingin menghapus transaksi "${merchantOrCat}"? Saldo dompet akan disesuaikan otomatis.`)) {
      deleteTransaction(id);
    }
  };

  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-500" />
            Riwayat & Kelola Transaksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total {filteredTransactions.length} transaksi tercatat
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenExportImport}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={() => onOpenNewTransaction('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance Mini Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Pemasukan</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            +{formatRupiah(totalFilteredIncome)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Pengeluaran</span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
            -{formatRupiah(totalFilteredExpense)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Selisih Bersih (Net)</span>
          <span
            className={`text-base font-extrabold ${
              netBalance >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}
            {formatRupiah(netBalance)}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi, toko, nominal, atau catatan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-brand-500 text-white shadow-soft'
                : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              filterType === 'income'
                ? 'bg-emerald-500 text-white shadow-soft'
                : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
            }`}
          >
            Pemasukan
          </button>

          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              filterType === 'expense'
                ? 'bg-rose-500 text-white shadow-soft'
                : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
            }`}
          >
            Pengeluaran
          </button>

          <button
            onClick={() => setFilterType('transfer')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              filterType === 'transfer'
                ? 'bg-blue-600 text-white shadow-soft'
                : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Filter by Wallet */}
        <select
          value={filterWalletId}
          onChange={(e) => setFilterWalletId(e.target.value)}
          className="px-3.5 py-2 bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Semua Dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.type.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Transactions List Table / Card View */}
      <div className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft divide-y divide-slate-100 dark:divide-darkborder overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada transaksi yang cocok dengan filter.
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const wallet = walletMap.get(tx.walletId);
            const toWallet = tx.toWalletId ? walletMap.get(tx.toWalletId) : null;

            return (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-darkbg/40 transition group"
              >
                {/* Left info */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : isExpense
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isExpense ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowLeftRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {tx.merchant || tx.category}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-darkbg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-darkborder">
                        {tx.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{formatDateIndo(tx.date)}</span>
                      <span>•</span>
                      <span>
                        {wallet?.name || 'Dompet'}
                        {toWallet ? ` ➔ ${toWallet.name}` : ''}
                      </span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            "{tx.note}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right info & Action buttons */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 pl-14 sm:pl-0">
                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatRupiah(tx.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                      {tx.type}
                    </span>
                  </div>

                  {/* Edit & Delete Action Buttons (CRUD) */}
                  <div className="flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition"
                      title="Edit Transaksi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id, tx.merchant || tx.category)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

