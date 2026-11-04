import React, { useState } from 'react';
import {
  ScanLine,
  Receipt,
  Smartphone,
  UploadCloud,
  Loader2,
  Sparkles,
  ArrowRight,
  X,
  FileCheck,
} from 'lucide-react';
import { scanImageOCR } from '../utils/ocrScanner';
import { OCRResult } from '../types';
import { formatRupiah } from '../utils/formatters';

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
  const [scanType, setScanType] = useState<'receipt' | 'ewallet'>('receipt');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [scanResult, setScanResult] = useState<OCRResult | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setScanResult(null);
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
    onConfirmTransaction({
      amount: scanResult.amount || 0,
      merchant: scanResult.merchant || (scanType === 'receipt' ? 'Struk Toko' : 'E-Wallet Transfer'),
      date: scanResult.date || new Date().toISOString().split('T')[0],
      category: scanResult.category || (scanType === 'receipt' ? 'Belanja & Groceries' : 'Transfer & E-Wallet'),
      sourceType: scanResult.sourceWalletType,
    });
  };

  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
    setIsScanning(false);
    setProgressPercent(0);
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
          <span>Screenshot E-Wallet / QRIS</span>
        </button>
      </div>

      {/* Main Upload / Scanner Box */}
      <div className="rounded-3xl bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder p-6 shadow-soft space-y-5">
        {!imagePreview ? (
          <label className="border-2 border-dashed border-slate-300 dark:border-darkborder rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 transition group bg-slate-50/50 dark:bg-darkbg/30">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-soft">
              <UploadCloud className="w-8 h-8" />
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {scanType === 'receipt' ? 'Upload Foto Struk Belanja' : 'Upload Bukti Screenshot E-Wallet'}
            </span>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Ambil gambar langsung dengan kamera HP Anda atau pilih dari galeri.
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
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
    </div>
  );
};

