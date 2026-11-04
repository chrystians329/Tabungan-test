import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah } from '../../utils/formatters';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({ isOpen, onClose }) => {
  const { breakdown, transactions, scanHistory, goals, resetTotalProgress } = useFinance();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      alert('Ketik "RESET" pada kolom konfirmasi untuk melanjutkan.');
      return;
    }
    setIsResetting(true);
    // Beri jeda kecil agar animasi state terlihat
    setTimeout(() => {
      resetTotalProgress();
      setIsResetting(false);
      setDone(true);
      setConfirmText('');
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1600);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60">
      <div className="w-full max-w-md bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden modal-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Total Progress
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkborder/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center empty-pop">
            <CheckCircle2 className="w-12 h-12 text-brand-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white">Progress Berhasil Direset</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Semua record telah dihapus. Saldo & tabungan Anda kembali ke Rp 0.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                Tindakan ini <strong>tidak bisa dibatalkan</strong>. Semua record transaksi,
                riwayat scan struk, dan saldo di seluruh dompet serta tabungan goals akan
                dihapus / disetel ke <strong>Rp 0</strong>.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder">
                <span className="text-[11px] text-slate-400 block">Total Kekayaan Saat Ini</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(breakdown.grandTotal)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder">
                <span className="text-[11px] text-slate-400 block">Akan Disetel Ke</span>
                <span className="text-sm font-extrabold text-rose-500">Rp 0</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-darkbg rounded-2xl p-4 border border-slate-200 dark:border-darkborder">
              <li className="flex items-center justify-between">
                <span>Record transaksi dihapus</span>
                <strong>{transactions.length} data</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Riwayat scan struk dihapus</span>
                <strong>{scanHistory.length} data</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Saldo dompet direset</span>
                <strong>Rp 0</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Tabungan goals direset</span>
                <strong>{goals.length} goals = Rp 0</strong>
              </li>
            </ul>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Ketik <span className="font-extrabold text-rose-500">RESET</span> untuk konfirmasi
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-soft transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Semua Progress</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isResetting}
                className="px-5 py-3 rounded-xl border border-slate-200 dark:border-darkborder text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg transition"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
