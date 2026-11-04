import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { useModalTransition } from '../../hooks/useModalTransition';

interface GoalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  mode: 'deposit' | 'withdraw';
}

export const GoalActionModal: React.FC<GoalActionModalProps> = ({
  isOpen,
  onClose,
  goal,
  mode,
}) => {
  const { depositToGoal, withdrawFromGoal } = useFinance();
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');

  // Tetap mounted selama animasi close supaya tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen);

  if (!mounted || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing) return;
    const amount = Number(amountStr.replace(/\D/g, ''));
    if (!amount || amount <= 0) {
      alert('Masukkan nominal uang yang valid.');
      return;
    }

    if (mode === 'withdraw' && amount > goal.currentAmount) {
      alert('Nominal penarikan melebihi saldo tabungan goal saat ini.');
      return;
    }

    if (mode === 'deposit') {
      depositToGoal(goal.id, amount, note);
      // Check if target is achieved to fire confetti!
      if (goal.currentAmount + amount >= goal.targetAmount) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#059669', '#FBBF24'],
        });
      }
    } else {
      withdrawFromGoal(goal.id, amount, note);
    }

    setAmountStr('');
    setNote('');
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountStr(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
  };

  const isDeposit = mode === 'deposit';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 ${
        isClosing ? 'fade-out pointer-events-none' : 'animate-fade-in'
      }`}
    >
      <div
        className={`w-full max-w-md bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden ${
          isClosing ? 'modal-out pointer-events-none' : 'modal-in'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            {isDeposit ? (
              <ArrowDownRight className="w-5 h-5 text-brand-500" />
            ) : (
              <ArrowUpLeft className="w-5 h-5 text-amber-500" />
            )}
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isDeposit ? 'Tabung ke Goal' : 'Tarik dari Goal'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
              Target Tabungan:
            </span>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{goal.name}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-darkborder text-xs">
              <span className="text-slate-500 dark:text-slate-400">Saldo Saat Ini:</span>
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                {formatRupiah(goal.currentAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Target Total:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatRupiah(goal.targetAmount)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nominal {isDeposit ? 'Tabungan' : 'Penarikan'}
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
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Quick Amount Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[50000, 100000, 250000, 500000, 1000000].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() =>
                  setAmountStr(new Intl.NumberFormat('id-ID').format(quick))
                }
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-darkborder hover:border-brand-500 hover:text-brand-500 transition text-slate-600 dark:text-slate-400"
              >
                +{new Intl.NumberFormat('id-ID').format(quick)}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth: Sisihan uang jajan minggu ini"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-semibold text-sm text-white shadow-soft transition flex items-center justify-center space-x-2 ${
                isDeposit
                  ? 'bg-brand-500 hover:bg-brand-600 hover:shadow-glow'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isDeposit ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tambahkan ke Tabungan Goal</span>
                </>
              ) : (
                <span>Tarik dari Goal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

