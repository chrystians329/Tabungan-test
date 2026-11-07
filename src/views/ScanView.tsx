import React, { useState, useRef } from 'react';
import {
  ScanLine,
  Receipt,
  Smartphone,
  UploadCloud,
  Camera,
  Loader2,
  Sparkles,
  ArrowRight,
  X,
  FileCheck,
  History,
  Trash2,
} from 'lucide-react';
import { scanImageOCR } from '../utils/ocrScanner';
import { OCRResult } from '../types';
import { formatRupiah, formatDateIndo, getLocalDateString } from '../utils/formatters';
import { useFinance } from '../context/FinanceContext';

interface ScanViewProps {
  onConfirmTransaction: (data: {
    amount: number;
    merchant: string;
    date: string;
    category: string;
    sourceType?: 'cash' | 'ewallet' | 'bank';
  }) => void;
}

export const ScanView: React.FC<ScanViewProps> = ({ onConfirmTransaction }) => {
  const { scanHistory, addScanHistory, deleteScanHistory, clearScanHistory } = useFinance();
  const [scanType, setScanType] = useState<'receipt' | 'ewallet'>('receipt');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [scanResult, setScanResult] = useState<OCRResult | null>(null);
  const recordedRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const recordHistory = (status: 'saved' | 'discarded') => {
    if (recordedRef.current || !scanResult) return;
    recordedRef.current = true;
    addScanHistory({
      mode: scanType,
      amount: scanResult.amount || 0,
      merchant: scanResult.merchant || (scanType === 'receipt' ? 'Struk Toko' : 'E-Wallet Transfer'),
      date: scanResult.date || getLocalDateString(),
      category:
        scanResult.category ||
        (scanType === 'receipt' ? 'Belanja & Groceries' : 'Transfer & E-Wallet'),
      sourceType: scanResult.sourceWalletType,
      rawText: (scanResult.rawText || '').slice(0, 500),
      status,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setImagePreview(previewUrl);
    setScanResult(null);
    recordedRef.current = false;
    setIsScanning(true);
    setProgressMsg('Mengunggah gambar...');
    setProgressPercent(10);

    try {
      const result = await scanImageOCR(file, scanType, ({ status, progress }) => {
        setProgressMsg(status);
        setProgressPercent(progress);
      });
      setScanResult(result);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses OCR. Silakan coba gambar lain.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (!scanResult) return;
    recordHistory('saved');
    onConfirmTransaction({
      amount: scanResult.amount || 0,
      merchant: scanResult.merchant || (scanType === 'receipt' ? 'Struk Toko' : 'E-Wallet Transfer'),
      date: scanResult.date || getLocalDateString(),
      category:
        scanResult.category ||
        (scanType === 'receipt' ? 'Belanja & Groceries' : 'Transfer & E-Wallet'),
      sourceType: scanResult.sourceWalletType,
    });
    // Bersihkan hasil scan supaya tidak bisa ditransfer dua kali
    handleReset();
  };

  const handleReset = () => {
    recordHistory('discarded');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setImagePreview(null);
    setScanResult(null);
    setIsScanning(false);
    setProgressPercent(0);
    recordedRef.current = false;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-brand-500" />
          Scanner Pintar (OCR Struk & E-Wallet)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scan struk fisik atau screenshot bukti transfer e-wallet untuk pencatatan otomatis tanpa repot mengetik.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder">
        <button
          onClick={() => {
            setScanType('receipt');
            handleReset();
          }}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
            scanType === 'receipt'
              ? 'bg-brand-500 text-white shadow-soft'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Struk Belanja Fisik</span>
        </button>

        <button
          onClick={() => {
            setScanType('ewallet');
            handleReset();
          }}
          className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
            scanType === 'ewallet'
              ? 'bg-brand-500 text-white shadow-soft'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>SS E-Wallet / QRIS</span>
        </button>
      </div>

      {/* Main Upload / Scanner Box */}
      <div className="rounded-3xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-6 shadow-soft space-y-5">
        {!imagePreview ? (
          <div className="border-2 border-dashed border-slate-300 dark:border-darkborder rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-darkbg/30">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-soft">
              <UploadCloud className="w-8 h-8" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {scanType === 'receipt' ? 'Upload Foto Struk Belanja' : 'Upload Bukti Screenshot E-Wallet'}
            </span>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {scanType === 'receipt'
                ? 'Pilih foto dari galeri atau ambil langsung dengan kamera HP Anda.'
                : 'Pilih file screenshot dari galeri / file manager HP Anda.'}
            </p>

            {scanType === 'receipt' ? (
              <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full max-w-sm">
                <label className="flex-1 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold cursor-pointer transition flex items-center justify-center gap-2 shadow-soft">
                  <UploadCloud className="w-4 h-4" />
                  <span>Pilih Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 py-3 px-4 rounded-xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder text-slate-700 dark:text-slate-200 text-sm font-bold cursor-pointer transition flex items-center justify-center gap-2 hover:border-brand-500">
                  <Camera className="w-4 h-4" />
                  <span>Ambil Kamera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="inline-flex py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold cursor-pointer transition items-center gap-2 mt-5 shadow-soft">
                <UploadCloud className="w-4 h-4" />
                <span>Pilih File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-darkborder max-h-72 flex items-center justify-center bg-black/5">
              <img src={imagePreview} alt="Preview" className="max-h-72 w-auto object-contain" />
              {!isScanning && (
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  title="Ganti Gambar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress status */}
            {isScanning && (
              <div className="p-4 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    {progressMsg || 'Memproses OCR...'}
                  </span>
                  <span className="font-bold text-brand-500">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-darkborder rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Extracted Card */}
            {scanResult && !isScanning && (
              <div className="p-5 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Data Berhasil Diekstraksi
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500 text-white">
                    OCR Siap
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/90 dark:bg-darkcard/90 p-3.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                    <span className="text-slate-400 block text-[11px]">Total Nominal</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {scanResult.amount ? formatRupiah(scanResult.amount) : 'Tidak terdeteksi'}
                    </span>
                  </div>

                  <div className="bg-white/90 dark:bg-darkcard/90 p-3.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                    <span className="text-slate-400 block text-[11px]">Merchant / Penerima</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                      {scanResult.merchant || '-'}
                    </span>
                  </div>

                  <div className="bg-white/90 dark:bg-darkcard/90 p-3.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                    <span className="text-slate-400 block text-[11px]">Tanggal Transaksi</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {scanResult.date || '-'}
                    </span>
                  </div>

                  <div className="bg-white/90 dark:bg-darkcard/90 p-3.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                    <span className="text-slate-400 block text-[11px]">Kategori Rekomendasi</span>
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 truncate block">
                      {scanResult.category || '-'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-soft hover:shadow-glow transition flex items-center justify-center space-x-2"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Catat ke Buku Pengeluaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Riwayat Scan Struk / Screenshot */}
      <div className="rounded-3xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-darkborder">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-500" />
              Riwayat Scan
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {scanHistory.length} hasil scan tercatat (tersimpan otomatis)
            </p>
          </div>
          {scanHistory.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Hapus seluruh riwayat scan?')) clearScanHistory();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-10 text-center empty-pop">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3 float-slow" />
            <p className="text-xs text-slate-400">
              Belum ada riwayat scan. Hasil scan struk atau screenshot akan tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-darkborder max-h-96 overflow-y-auto">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-darkbg/40 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.mode === 'receipt'
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {item.mode === 'receipt' ? (
                      <Receipt className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                      {item.merchant || 'Tanpa Nama'}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{formatDateIndo(item.date)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[140px]">{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                      {item.amount > 0 ? formatRupiah(item.amount) : '-'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.status === 'saved'
                          ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                          : 'bg-slate-200 dark:bg-darkborder text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.status === 'saved' ? 'Tercatat' : 'Dibuang'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteScanHistory(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
