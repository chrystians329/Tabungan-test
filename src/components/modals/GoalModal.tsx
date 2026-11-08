import React, { useState, useEffect } from 'react';
import { X, Target, Image as ImageIcon, AlertCircle, Trash2, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal, GoalPriority } from '../../types';
import { useModalTransition } from '../../hooks/useModalTransition';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

interface GoalPresetImage {
  id: string;
  name: string;
  url: string;
}

// Hanya 2 foto dummy awal sesuai permintaan
const DEFAULT_PRESET_IMAGES: GoalPresetImage[] = [
  {
    id: 'default_1',
    name: 'Dana Darurat',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'default_2',
    name: 'Gadget & Laptop',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
  },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal = null,
}) => {
  const { addGoal, updateGoal } = useFinance();

  const [targetImages, setTargetImages] = useState<GoalPresetImage[]>(() => {
    try {
      const saved = localStorage.getItem('kayaku_goal_preset_images');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRESET_IMAGES;
  });

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('biasa');
  const [deadline, setDeadline] = useState('');
  const [imageUrl, setImageUrl] = useState(() => targetImages[0]?.url || DEFAULT_PRESET_IMAGES[0].url);
  const [urlInput, setUrlInput] = useState('');
  const [notes, setNotes] = useState('');

  // Tetap mounted selama animasi close supaya tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen);

  useEffect(() => {
    // Hanya isi ulang form saat modal dibuka
    if (!isOpen) return;

    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmountStr(new Intl.NumberFormat('id-ID').format(editingGoal.targetAmount));
      setPriority(editingGoal.priority);
      setDeadline(editingGoal.deadline || '');
      setImageUrl(editingGoal.imageUrl || targetImages[0]?.url || DEFAULT_PRESET_IMAGES[0].url);
      setNotes(editingGoal.notes || '');
    } else {
      setName('');
      setTargetAmountStr('');
      setPriority('biasa');
      setDeadline('');
      setImageUrl(targetImages[0]?.url || DEFAULT_PRESET_IMAGES[0].url);
      setNotes('');
    }
    setUrlInput('');
  }, [editingGoal, isOpen, targetImages]);

  if (!mounted) return null;

  const addImageToPresets = (url: string, imgName = 'Foto Target') => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    setTargetImages((prev) => {
      const exists = prev.find((item) => item.url === cleanUrl);
      if (exists) return prev;
      const updated = [
        ...prev,
        {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: imgName,
          url: cleanUrl,
        },
      ];
      try {
        localStorage.setItem('kayaku_goal_preset_images', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setImageUrl(cleanUrl);
  };

  const handleDeletePresetImage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTargetImages((prev) => {
      if (prev.length <= 1) {
        alert('Sisakan minimal 1 foto target.');
        return prev;
      }
      const itemToDelete = prev.find((item) => item.id === id);
      const remaining = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('kayaku_goal_preset_images', JSON.stringify(remaining));
      } catch {}
      if (itemToDelete && imageUrl === itemToDelete.url) {
        setImageUrl(remaining[0].url);
      }
      return remaining;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing) return;
    const targetAmount = Number(targetAmountStr.replace(/\D/g, ''));
    if (!name.trim()) {
      alert('Masukkan nama target tabungan.');
      return;
    }
    if (!targetAmount || targetAmount <= 0) {
      alert('Masukkan nominal target yang valid.');
      return;
    }

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount,
        priority,
        deadline: deadline || undefined,
        imageUrl,
        notes: notes.trim(),
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount,
        priority,
        deadline: deadline || undefined,
        imageUrl,
        notes: notes.trim(),
      });
    }
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setTargetAmountStr(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '');
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const displayName = file.name.replace(/\.[^/.]+$/, '').slice(0, 16) || 'Foto Saya';
        addImageToPresets(dataUrl, displayName);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 ${
        isClosing ? 'fade-out pointer-events-none' : 'animate-fade-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden ${
          isClosing ? 'modal-out pointer-events-none' : 'modal-in'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-brand-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingGoal ? 'Edit Target Tabungan' : 'Buat Target Goals Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isolation Notice Alert */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
          <p className="text-xs text-brand-700 dark:text-brand-300">
            <strong>Terisolasi:</strong> Saldo goals terpisah dari tabungan utama. Perubahan saldo utama tidak akan mengubah target goals, dan sebaliknya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Goal Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Nama Target
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Dana Darurat, MacBook M3, Beli Rumah..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Target Nominal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={targetAmountStr}
                onChange={handleAmountChange}
                placeholder="0"
                required
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          {/* Priority / Urgency (Fitur 4) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Tingkat Kebutuhan / Urgensi
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  priority === 'urgent'
                    ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300'
                }`}
              >
                Sangat Mendesak
              </button>

              <button
                type="button"
                onClick={() => setPriority('biasa')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  priority === 'biasa'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300'
                }`}
              >
                Biasa Saja
              </button>

              <button
                type="button"
                onClick={() => setPriority('santai')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  priority === 'santai'
                    ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'border-brand-500/30 bg-brand-500/5 text-brand-700 dark:text-brand-300'
                }`}
              >
                Tidak Penting Amat
              </button>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Target Tanggal Capaian (Opsional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          {/* Image Selection (Preset & Custom Upload) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Gambar Target ({targetImages.length} Tersedia)
              </label>
              <span className="text-[10px] text-slate-400">Klik untuk pakai, tong sampah untuk hapus</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {targetImages.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setImageUrl(preset.url)}
                  className={`group relative rounded-xl overflow-hidden aspect-video border-2 cursor-pointer transition ${
                    imageUrl === preset.url
                      ? 'border-brand-500 scale-[1.02] shadow-md ring-2 ring-brand-500/20'
                      : 'border-transparent opacity-70 hover:opacity-100 hover:scale-[1.01]'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />

                  {/* Delete button from Gambar Target */}
                  <button
                    type="button"
                    onClick={(e) => handleDeletePresetImage(e, preset.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition shadow"
                    title={`Hapus foto "${preset.name}"`}
                    aria-label={`Hapus foto "${preset.name}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[9px] px-1 py-0.5 truncate text-center pointer-events-none">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-darkborder hover:border-brand-500 text-xs text-slate-600 dark:text-slate-300 transition shrink-0">
                <ImageIcon className="w-4 h-4 text-brand-500" />
                <span>Upload Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 flex items-center space-x-1.5">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (urlInput.trim()) {
                        addImageToPresets(urlInput.trim(), 'Link Gambar');
                        setUrlInput('');
                      }
                    }
                  }}
                  placeholder="Atau tempel link URL foto..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {urlInput.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      addImageToPresets(urlInput.trim(), 'Link Gambar');
                      setUrlInput('');
                    }}
                    className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shrink-0 transition"
                  >
                    Simpan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Catatan / Motivasi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="cth: Jangan lupa menabung tiap awal bulan!"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-soft hover:shadow-glow transition"
            >
              {editingGoal ? 'Simpan Perubahan' : 'Buat Target Goals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
