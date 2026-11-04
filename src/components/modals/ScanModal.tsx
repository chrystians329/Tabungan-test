import React, { useState } from 'react';
import {
  X,
  ScanLine,
  Receipt,
  Smartphone,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { scanImageOCR } from '../../utils/ocrScanner';
import { OCRResult } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransaction: (data: {
    amount: number;
    merchant: string;
    date: string;
    category: string;
    sourceType?: 'cash' | 'ewallet' | 'bank';
  }) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onConfirmTransaction,
}) => {
  const [scanType, setScanType] = useState<'receipt' | 'ewallet'>('receipt');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [scanResult, setScanResult] = useState<OCRResult | null>(null);

  if (!isOpen) return null;

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
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
    setIsScanning(false);
    setProgressPercent(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <ScanLine className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Scan Cerdas (OCR)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Scanner Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-darkbg rounded-xl">
            <button
              type="button"
              onClick={() => {
                setScanType('receipt');
                handleReset();
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                scanType === 'receipt'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Struk Belanja Fisik</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScanType('ewallet');
                handleReset();
              }}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                scanType === 'ewallet'
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Screenshot E-Wallet</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {scanType === 'receipt'
              ? 'Pindai struk belanja Indomaret, Alfamart, restoran, supermarket untuk membaca nominal otomatis.'
              : 'Pindai screenshot transfer GoPay, OVO, DANA, BCA, QRIS untuk pencatatan instan.'}
          </p>

          {/* Upload Area / Dropzone */}
          {!imagePreview ? (
            <label className="border-2 border-dashed border-slate-300 dark:border-darkborder rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 transition group bg-slate-50/50 dark:bg-darkbg/30">
              <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Pilih Foto atau Ambil Kamera
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Mendukung format JPG, PNG, WEBP
              </span>
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
              {/* Image Preview Thumbnail */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-darkborder max-h-48 flex items-center justify-center bg-black/5">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 w-auto object-contain"
                />
                {!isScanning && (
                  <button
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                    title="Ganti Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress Indicator */}
              {isScanning && (
                <div className="p-4 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
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

              {/* Extracted Data Card */}
              {scanResult && !isScanning && (
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      Hasil Ekstraksi OCR Cerdas
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-700 dark:text-brand-300">
                      Terbaca
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/80 dark:bg-darkcard/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                      <span className="text-slate-400 block text-[10px]">Nominal Total</span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {scanResult.amount ? formatRupiah(scanResult.amount) : 'Tidak terdeteksi'}
                      </span>
                    </div>

                    <div className="bg-white/80 dark:bg-darkcard/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                      <span className="text-slate-400 block text-[10px]">Merchant / Sumber</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate block">
                        {scanResult.merchant || '-'}
                      </span>
                    </div>

                    <div className="bg-white/80 dark:bg-darkcard/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                      <span className="text-slate-400 block text-[10px]">Tanggal Terdeteksi</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {scanResult.date || '-'}
                      </span>
                    </div>

                    <div className="bg-white/80 dark:bg-darkcard/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-darkborder/50">
                      <span className="text-slate-400 block text-[10px]">Kategori Rekomendasi</span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400 truncate block">
                        {scanResult.category || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={handleApply}
                    className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-soft hover:shadow-glow transition flex items-center justify-center space-x-2"
                  >
                    <span>Lanjutkan & Catat ke Transaksi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

