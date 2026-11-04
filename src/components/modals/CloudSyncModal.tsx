import React, { useState } from 'react';
import {
  X,
  Cloud,
  Check,
  Copy,
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getSupabaseSqlSchema } from '../../utils/cloudSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, syncWithCloud, lastRemoteSyncAt } = useFinance();
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [userId, setUserId] = useState(settings.userName || 'user_tabungan_1');
  const [autoSync, setAutoSync] = useState(settings.syncEnabled);
  const [intervalSec, setIntervalSec] = useState(
    Math.round((settings.syncIntervalMs || 4000) / 1000)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    updateSettings({
      supabaseUrl,
      supabaseAnonKey,
      userName: userId,
      syncEnabled: autoSync && Boolean(supabaseUrl && supabaseAnonKey),
      syncIntervalMs: Math.max(2, Number(intervalSec) || 4) * 1000,
    });

    try {
      const ok = await syncWithCloud();
      if (ok) {
        alert(
          'Terhubung! Data akan tersinkron otomatis (realtime) antara HP dan Desktop selama ID akun yang dipakai sama.'
        );
        onClose();
      } else {
        alert('Gagal menyinkronkan. Mohon periksa kembali Project URL dan Anon Key Supabase Anda.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(getSupabaseSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sinkronisasi Mobile & Desktop
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Architecture Illustration */}
          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <Laptop className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-1" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Desktop</span>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-brand-500 animate-pulse" />
            <div className="flex flex-col items-center">
              <Cloud className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-1" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Cloud Realtime</span>
            </div>
            <ArrowRightLeft className="w-5 h-5 text-brand-500 animate-pulse" />
            <div className="flex flex-col items-center">
              <Smartphone className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-1" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Aplikasi HP</span>
            </div>
          </div>

          {/* Status koneksi terakhir */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status sinkronisasi</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.syncEnabled ? 'bg-brand-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
              {settings.syncEnabled
                ? lastRemoteSyncAt
                  ? 'Realtime aktif'
                  : 'Auto-sync aktif'
                : 'Belum aktif'}
            </span>
          </div>

          {/* Option Comparison Guide */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Opsi Sinkronisasi Gratis
            </h4>

            {/* Supabase Free */}
            <div className="p-3.5 rounded-xl border border-brand-500/30 bg-brand-500/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Opsi 1: Supabase (Paling Direkomendasikan & 100% Gratis)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500 text-white">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Data di desktop & smartphone langsung tersinkron dalam hitungan milidetik secara gratis tanpa batas kuota transaksi bulanan.
              </p>
            </div>

            {/* Google Drive Option */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50/50 dark:bg-darkbg/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Opsi 2: Google Drive / Backup File
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-darkborder text-slate-600 dark:text-slate-400">
                  Manual Backup
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Simpan file backup JSON ke Google Drive pribadi Anda, lalu buka file tersebut dari menu <strong>Export / Import</strong> di ponsel Anda.
              </p>
            </div>
          </div>

          {/* Supabase Free Setup Form */}
          <form onSubmit={handleSaveAndSync} className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pengaturan Supabase Cloud (Gratis)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                ID Akun / User ID Sinkronisasi
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="nama-kamu-123"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <span className="text-[10px] text-slate-400">
                Gunakan ID yang sama di HP dan Komputer agar tersambung ke dompet yang sama.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>

            {/* Quick 1-click SQL copy button */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-darkbg text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Perlu SQL schema untuk tabel Supabase?
              </span>
              <button
                type="button"
                onClick={copySql}
                className="flex items-center space-x-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            {/* Opsi sinkronisasi otomatis */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-darkborder bg-slate-50/50 dark:bg-darkbg/40 space-y-3">
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white">
                    Sinkron otomatis (realtime)
                  </strong>
                  Perubahan di HP langsung muncul di Desktop dan sebaliknya.
                </span>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-500"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Interval pengecekan
                </span>
                <select
                  value={intervalSec}
                  onChange={(e) => setIntervalSec(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={2}>2 detik (cepat)</option>
                  <option value={4}>4 detik (standar)</option>
                  <option value={10}>10 detik (hemat)</option>
                  <option value={30}>30 detik</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft hover:shadow-glow transition disabled:opacity-50"
            >
              {isSyncing ? 'Menghubungkan ke Cloud...' : 'Simpan & Sinkronkan Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

