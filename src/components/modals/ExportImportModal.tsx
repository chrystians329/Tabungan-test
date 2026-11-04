import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { exportToExcel, exportToJSON, parseExcelOrJSONFile } from '../../utils/excel';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transactions, wallets, goals, breakdown, importAllData, resetAllData, resetTotalProgress } =
    useFinance();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any | null>(null);

  // Bersihkan state preview setiap modal ditutup/dibuka (bug: preview basi ikut terimport)
  useEffect(() => {
    if (!isOpen) {
      setImportPreview(null);
      setImportStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    exportToExcel({
      transactions,
      wallets,
      goals,
      breakdown,
    });
  };

  const handleExportJSON = () => {
    exportToJSON({
      transactions,
      wallets,
      goals,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseExcelOrJSONFile(file);
      setImportPreview(parsed);
      setImportStatus(
        `File berhasil dibaca! Ditemukan: ${parsed.transactions?.length || 0} transaksi, ${
          parsed.wallets?.length || 0
        } dompet, ${parsed.goals?.length || 0} goals.`
      );
    } catch (err) {
      console.error(err);
      setImportPreview(null);
      setImportStatus(null);
      alert('Gagal membaca format file. Pastikan format file sesuai (.xlsx, .csv, atau .json).');
    } finally {
      e.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    importAllData(importPreview);
    alert('Data berhasil diimport ke aplikasi!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Export & Import Data
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Export Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Export Data Keluar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Excel Export */}
              <button
                onClick={handleExportExcel}
                className="p-4 rounded-2xl border border-slate-200 dark:border-darkborder hover:border-emerald-500 bg-slate-50/50 dark:bg-darkbg/40 text-left transition group hover:shadow-soft"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Excel Spreadsheet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Format .xlsx lengkap dengan ringkasan & multi-sheet
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download .xlsx</span>
                </div>
              </button>

              {/* JSON Backup Export */}
              <button
                onClick={handleExportJSON}
                className="p-4 rounded-2xl border border-slate-200 dark:border-darkborder hover:border-brand-500 bg-slate-50/50 dark:bg-darkbg/40 text-left transition group hover:shadow-soft"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <FileJson className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Full Backup JSON</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Backup komplit untuk restore atau transfer antar device
                </p>
                <div className="mt-3 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>Download .json</span>
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-darkborder" />

          {/* Import Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Import Data Masuk
            </h4>

            <label className="border-2 border-dashed border-slate-300 dark:border-darkborder rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 transition group bg-slate-50/50 dark:bg-darkbg/40">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-500 transition mb-2" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Pilih File Excel / CSV / JSON
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Mendukung .xlsx, .xls, .csv, .json
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div className="mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                <p>{importStatus}</p>
              </div>
            )}

            {importPreview && (
              <button
                onClick={handleConfirmImport}
                className="w-full mt-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-soft transition"
              >
                Gabungkan & Import Sekarang
              </button>
            )}
          </div>

          <hr className="border-slate-200 dark:border-darkborder" />

          {/* Reset To Pure Zero Button */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                  Kosongkan Semua Saldo & Tabungan (Reset ke Rp 0)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Menghapus semua riwayat transaksi dan mengembalikan saldo dompet & tabungan goals menjadi Rp 0.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Yakin ingin mereset semua saldo dompet, tabungan goals, dan transaksi menjadi Rp 0?')) {
                  resetTotalProgress();
                  alert('Semua saldo dan riwayat berhasil direset menjadi Rp 0!');
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-sm transition"
            >
              Kosongkan Semua Saldo (Jadikan Rp 0)
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Atau isi kembali dengan sampel simulasi?
            </span>
            <button
              onClick={() => {
                if (confirm('Kembalikan semua data ke sampel awal?')) {
                  resetAllData();
                  alert('Data telah diisi dengan sampel simulasi.');
                  onClose();
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold underline"
            >
              Muat Sampel Contoh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

