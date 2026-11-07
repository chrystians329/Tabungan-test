import React, { useMemo, useState } from 'react';
import {
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatCompactRupiah, formatDateIndo, getPriorityBadge } from '../utils/formatters';
import { ActiveTab } from '../components/Sidebar';
import { Goal } from '../types';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

interface DashboardViewProps {
  onOpenNewTransaction: (type?: 'income' | 'expense') => void;
  onOpenScanModal: () => void;
  onOpenGoalModal: () => void;
  onOpenGoalAction: (goal: Goal, mode: 'deposit' | 'withdraw') => void;
  onDeleteGoal: (goalId: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTransaction,
  onOpenScanModal,
  onOpenGoalModal,
  onOpenGoalAction,
  onDeleteGoal,
  setActiveTab,
}) => {
  const { breakdown, wallets, transactions, goals } = useFinance();
  const [chartPage, setChartPage] = useState(0);

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Recent transactions (top 5)
  const recentTransactions = transactions.slice(0, 5);

  // Diagram ditampilkan per rentang enam bulan agar riwayat sebelumnya tetap bisa dibuka.
  const monthlySeries = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + chartPage * 6 - 5 + i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        key: prefix,
        label: MONTH_LABELS[d.getMonth()],
        income: 0,
        expense: 0,
      };
    });

    const monthTotals = new Map(months.map((month) => [month.key, month]));
    transactions.forEach((transaction) => {
      if (transaction.type !== 'income' && transaction.type !== 'expense') return;
      const month = monthTotals.get(transaction.date.slice(0, 7));
      if (month) month[transaction.type] += transaction.amount;
    });

    return months;
  }, [transactions, now.getFullYear(), now.getMonth(), chartPage]);

  const currentMonth = monthlySeries.find((month) => month.key === currentMonthPrefix);
  const monthlyIncome = currentMonth?.income || 0;
  const monthlyExpense = currentMonth?.expense || 0;
  const chartMax = Math.max(
    1,
    ...monthlySeries.map((m) => Math.max(m.income, m.expense))
  );
  const seriesIncome = monthlySeries.reduce((sum, m) => sum + m.income, 0);
  const seriesExpense = monthlySeries.reduce((sum, m) => sum + m.expense, 0);
  const chartRangeLabel = `${new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${monthlySeries[0].key}-01`))} – ${new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${monthlySeries[5].key}-01`))}`;

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Saldo gabungan */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50 to-white dark:from-darkcard dark:to-darkbg text-slate-900 dark:text-white p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-darkborder">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-brand-500/10 dark:bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 rounded-full bg-emerald-600/10 dark:bg-emerald-600/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1
            aria-label="Total uang"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            {formatRupiah(breakdown.grandTotal)}
          </h1>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewTransaction('income')}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-semibold transition border border-slate-200 dark:border-white/10"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-brand-400" />
              <span>+ Pemasukan</span>
            </button>
            <button
              onClick={() => onOpenNewTransaction('expense')}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-semibold transition border border-slate-200 dark:border-white/10"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>- Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* 2. FITUR 5: PERCENTAGE BREAKDOWN BAR (CASH, E-WALLET, BANK, GOALS) */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-darkborder/80">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Distribusi</span>
          </div>

          {/* Multi-segment progress bar */}
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden flex p-0.5 gap-0.5 border border-slate-300 dark:border-slate-700">
            <div
              style={{ width: `${breakdown.cashPercentage}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`Cash: ${Math.round(breakdown.cashPercentage)}%`}
            />
            <div
              style={{ width: `${breakdown.ewalletPercentage}%` }}
              className="h-full bg-cyan-500 transition-all duration-500"
              title={`E-Wallet: ${Math.round(breakdown.ewalletPercentage)}%`}
            />
            <div
              style={{ width: `${breakdown.bankPercentage}%` }}
              className="h-full bg-blue-500 transition-all duration-500"
              title={`Bank: ${Math.round(breakdown.bankPercentage)}%`}
            />
            <div
              style={{ width: `${breakdown.goalsPercentage}%` }}
              className="h-full bg-amber-400 rounded-r-full transition-all duration-500"
              title={`Goals: ${Math.round(breakdown.goalsPercentage)}%`}
            />
          </div>

          {/* 4-Way Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {/* Cash */}
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cash:</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {Math.round(breakdown.cashPercentage)}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {formatCompactRupiah(breakdown.cashTotal)}
                </span>
              </div>
            </div>

            {/* E-Wallet */}
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-md bg-cyan-500 shrink-0" />
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">E-Wallet:</span>
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                    {Math.round(breakdown.ewalletPercentage)}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {formatCompactRupiah(breakdown.ewalletTotal)}
                </span>
              </div>
            </div>

            {/* Bank */}
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-md bg-blue-500 shrink-0" />
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Bank:</span>
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {Math.round(breakdown.bankPercentage)}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {formatCompactRupiah(breakdown.bankTotal)}
                </span>
              </div>
            </div>

            {/* Goals */}
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
              <div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Goals:</span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {Math.round(breakdown.goalsPercentage)}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  {formatCompactRupiah(breakdown.goalsTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGRAM PEMASUKAN & PENGELUARAN 6 BULAN */}
      <div className="p-5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Arus Kas <span className="text-xs font-medium text-slate-400">6 Bulan</span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setChartPage((page) => page - 1)}
                aria-label="Lihat enam bulan sebelumnya"
                title="Lihat enam bulan sebelumnya"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-28 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {chartRangeLabel}
              </span>
              <button
                type="button"
                onClick={() => setChartPage((page) => Math.min(0, page + 1))}
                disabled={chartPage === 0}
                aria-label="Lihat enam bulan berikutnya"
                title="Lihat enam bulan berikutnya"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-darkbg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                +{formatCompactRupiah(seriesIncome)}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                -{formatCompactRupiah(seriesExpense)}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                Pengeluaran
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-28 flex-col justify-between sm:h-32"
          >
            {[0, 1, 2, 3].map((line) => (
              <span
                key={line}
                className="w-full border-t border-dashed border-slate-200 dark:border-darkborder"
              />
            ))}
          </div>
          <div className="relative z-10 mx-auto grid w-full max-w-lg grid-cols-6 gap-0">
            {monthlySeries.map((month) => {
              const incomeHeight =
                month.income > 0 ? Math.max(6, (month.income / chartMax) * 100) : 0;
              const expenseHeight =
                month.expense > 0 ? Math.max(6, (month.expense / chartMax) * 100) : 0;

              return (
                <div
                  key={month.key}
                  className="flex flex-col items-center gap-1.5"
                  title={`${month.label}: +${formatRupiah(month.income)} / -${formatRupiah(
                    month.expense
                  )}`}
                >
                  <div className="flex items-end justify-center gap-1 w-full h-28 sm:h-32 border-b border-slate-200 dark:border-darkborder">
                    <div
                      className="w-full max-w-4 bg-emerald-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${incomeHeight}%` }}
                    />
                    <div
                      className="w-full max-w-4 bg-rose-500 rounded-t-md transition-all duration-500"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{month.label}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      month.income - month.expense >= 0
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-rose-500'
                    }`}
                  >
                    {month.income - month.expense >= 0 ? '+' : '-'}
                    {formatCompactRupiah(Math.abs(month.income - month.expense))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MONTHLY CASH FLOW SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Pemasukan
            </span>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              +{formatRupiah(monthlyIncome)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Pengeluaran
            </span>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              -{formatRupiah(monthlyExpense)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUT ACTIONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => onOpenNewTransaction('income')}
          className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:border-brand-500 transition shadow-soft flex items-center space-x-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            + Pemasukan
          </span>
        </button>

        <button
          onClick={() => onOpenNewTransaction('expense')}
          className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:border-rose-500 transition shadow-soft flex items-center space-x-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            - Pengeluaran
          </span>
        </button>

        <button
          onClick={onOpenScanModal}
          className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:border-brand-500 transition shadow-soft flex items-center space-x-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <ScanLine className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Scan Struk / QR
          </span>
        </button>

        <button
          onClick={onOpenGoalModal}
          className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:border-amber-500 transition shadow-soft flex items-center space-x-3 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            + Target Goal
          </span>
        </button>
      </div>

      {/* ACTIVE GOALS SECTION (ISOLATED SAVINGS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-500" />
              Target Tabungan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatRupiah(breakdown.goalsTotal)}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('goals')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.slice(0, 3).map((goal) => {
            const badge = getPriorityBadge(goal.priority);
            const percentage = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-4 shadow-soft hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Image & Priority Badge */}
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3">
                    <img
                      src={goal.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80'}
                      alt={goal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {goal.name}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Terkumpul</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-darkbg overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-darkborder/50">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(goal.currentAmount)}
                    </span>
                    <span className="text-slate-400">
                      dari {formatCompactRupiah(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Quick Deposit to this goal */}
                <button
                  onClick={() =>
                    percentage >= 100 ? onDeleteGoal(goal.id) : onOpenGoalAction(goal, 'deposit')
                  }
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    percentage >= 100
                      ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white'
                      : 'bg-brand-500/10 hover:bg-brand-500 text-brand-600 dark:text-brand-400 hover:text-white'
                  }`}
                >
                  {percentage >= 100 ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Goals</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nabung ke Sini</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT TRANSACTIONS PREVIEW */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-500" />
            Riwayat Transaksi Terbaru
          </h2>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft divide-y divide-slate-100 dark:divide-darkborder overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada riwayat transaksi. Klik tombol di atas untuk menambah transaksi pertama Anda!
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const wallet = wallets.find((w) => w.id === tx.walletId);

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-darkbg/40 transition">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {tx.merchant || tx.category}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDateIndo(tx.date)}</span>
                        <span>•</span>
                        <span>{wallet?.name || 'Dompet'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold ${
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
                    <span className="text-[11px] text-slate-400 block capitalize">
                      {tx.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
