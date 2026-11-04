import React, { useState } from 'react';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowDownRight,
  ArrowUpLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Goal, GoalPriority } from '../types';
import {
  formatRupiah,
  formatCompactRupiah,
  formatDateIndo,
  getPriorityBadge,
} from '../utils/formatters';

interface GoalsViewProps {
  onOpenNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onOpenGoalAction: (goal: Goal, mode: 'deposit' | 'withdraw') => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  onOpenNewGoal,
  onEditGoal,
  onOpenGoalAction,
}) => {
  const { goals, breakdown, deleteGoal } = useFinance();
  const [filterPriority, setFilterPriority] = useState<'all' | GoalPriority>('all');

  const filteredGoals = goals.filter((g) => {
    if (filterPriority === 'all') return true;
    return g.priority === filterPriority;
  });

  const handleDelete = (goal: Goal) => {
    if (confirm(`Yakin ingin menghapus target goal "${goal.name}"?`)) {
      deleteGoal(goal.id);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-500" />
            Target Tabungan (Goals Terpisah)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tabungan khusus untuk impian & masa depan Anda tanpa mengganggu uang operasional utama
          </p>
        </div>

        <button
          onClick={onOpenNewGoal}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Target Goal Baru</span>
        </button>
      </div>

      {/* Isolation Notice Banner */}
      <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
        <div className="text-xs text-brand-800 dark:text-brand-200">
          <strong>Sistem Tabungan Mandiri (Terisolasi):</strong> Uang di dalam target goals ini dihitung secara terpisah dari saldo dompet utama. Jika Anda menambah pengeluaran di dompet utama, saldo tabungan goals tidak akan berkurang, dan begitu pula sebaliknya.
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Tabungan di Goals</span>
          <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
            {formatRupiah(breakdown.goalsTotal)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Alokasi dari Total Kekayaan</span>
          <span className="text-xl font-extrabold text-amber-500">
            {Math.round(breakdown.goalsPercentage)}% Portofolio
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft">
          <span className="text-[11px] font-semibold text-slate-400 block">Jumlah Target Aktif</span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            {goals.length} Goals
          </span>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          onClick={() => setFilterPriority('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            filterPriority === 'all'
              ? 'bg-brand-500 text-white shadow-soft'
              : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
          }`}
        >
          Semua ({goals.length})
        </button>

        <button
          onClick={() => setFilterPriority('urgent')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            filterPriority === 'urgent'
              ? 'bg-rose-500 text-white shadow-soft'
              : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
          }`}
        >
          🚨 Sangat Mendesak
        </button>

        <button
          onClick={() => setFilterPriority('biasa')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            filterPriority === 'biasa'
              ? 'bg-amber-500 text-white shadow-soft'
              : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
          }`}
        >
          ⚡ Biasa Saja
        </button>

        <button
          onClick={() => setFilterPriority('santai')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            filterPriority === 'santai'
              ? 'bg-emerald-600 text-white shadow-soft'
              : 'bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-300'
          }`}
        >
          ☕ Tidak Penting Amat
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder">
            Belum ada target tabungan di kategori ini.
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const badge = getPriorityBadge(goal.priority);
            const percentage = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-5 shadow-soft hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Goal Image & Priority */}
                  <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3.5 bg-slate-100 dark:bg-darkbg">
                    <img
                      src={goal.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80'}
                      alt={goal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                    </div>

                    {isCompleted && (
                      <div className="absolute inset-0 bg-brand-900/50 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                          <CheckCircle className="w-4 h-4" />
                          Target Tercapai!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Deadline */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                        {goal.name}
                      </h3>
                      {goal.deadline && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Target: {formatDateIndo(goal.deadline)}
                        </p>
                      )}
                    </div>

                    {/* Quick Menu */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition"
                        title="Edit Target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {goal.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 italic">
                      "{goal.notes}"
                    </p>
                  )}

                  {/* Progress Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-darkborder/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Terkumpul</span>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-darkbg overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-brand-400'
                            : 'bg-brand-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(goal.currentAmount)}
                      </span>
                      <span className="text-slate-400">
                        Target: {formatCompactRupiah(goal.targetAmount)}
                      </span>
                    </div>

                    {!isCompleted && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Kurang <strong>{formatRupiah(remaining)}</strong> lagi
                      </p>
                    )}
                  </div>
                </div>

                {/* Deposit / Withdraw Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                  {isCompleted ? (
                    <>
                      <button
                        onClick={() => handleDelete(goal)}
                        className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-soft transition flex items-center justify-center gap-1.5"
                        title="Goal sudah 100%, hapus dari daftar"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus Goals</span>
                      </button>

                      <button
                        onClick={() => onOpenGoalAction(goal, 'withdraw')}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-darkbg transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpLeft className="w-4 h-4 text-amber-500" />
                        <span>Tarik</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpenGoalAction(goal, 'deposit')}
                        className="py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-soft hover:shadow-glow transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        <span>Nabung</span>
                      </button>

                      <button
                        onClick={() => onOpenGoalAction(goal, 'withdraw')}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-darkbg transition flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpLeft className="w-4 h-4 text-amber-500" />
                        <span>Tarik</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

