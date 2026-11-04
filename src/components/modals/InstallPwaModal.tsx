import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone app
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed the PWA app');
      }
      setDeferredPrompt(null);
      onClose();
    } else {
      alert(
        'Untuk menginstall di Android: Buka menu titik tiga (⋮) di Chrome ➔ lalu pilih "Install aplikasi" atau "Tambahkan ke Layar Utama".'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Install Aplikasi di HP
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* App Preview Card */}
          <div className="flex items-center space-x-4 p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
            <img
              src="/icon-192.png"
              alt="KayaKu App Icon"
              className="w-14 h-14 rounded-2xl shadow-md border border-brand-500/30"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                KayaKu Mobile App
                <span className="text-[10px] bg-brand-500 text-white font-bold px-1.5 py-0.2 rounded">
                  PWA
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Akses cepat dari layar utama HP Anda, ringan, bebas iklan, dan berfungsi offline!
              </p>
            </div>
          </div>

          {isStandalone ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Aplikasi Sudah Terpasang!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Anda sudah menjalankan KayaKu dalam mode aplikasi layar penuh.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Instructions */
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Cara Pasang di iPhone / iPad (Safari)
              </span>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                    1
                  </span>
                  <div>
                    Ketuk tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> di bagian bawah layar Safari.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                    2
                  </span>
                  <div>
                    Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-500" />.
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                    3
                  </span>
                  <div>
                    Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Ikon KayaKu akan muncul di layar utama seperti aplikasi App Store!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome One-Click Install */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tekan tombol di bawah ini untuk langsung memasang KayaKu ke layar utama HP Android Anda tanpa perlu mendownload dari Play Store.
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-soft hover:shadow-glow transition flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Pasang Aplikasi Sekarang</span>
              </button>

              <div className="p-3 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-[11px] text-slate-500">
                💡 <em>Tips:</em> Anda juga bisa klik menu titik tiga (⋮) di browser Chrome HP ➔ pilih <strong>"Install aplikasi"</strong>.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

