import React, { useState, useEffect } from 'react';
import { X, Target, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal, GoalPriority } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

const PRESET_IMAGES = [
  {
    name: 'Dana Darurat',
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Gadget & Laptop',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Liburan & Healing',
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Kendaraan / Motor',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Rumah & Properti',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Emas / Investasi',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80',
  },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal = null,
}) => {
  const { addGoal, updateGoal } = useFinance();

  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('biasa');
  const [deadline, setDeadline] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetAmountStr(new Intl.NumberFormat('id-ID').format(editingGoal.targetAmount));
      setPriority(editingGoal.priority);
      setDeadline(editingGoal.deadline || '');
      setImageUrl(editingGoal.imageUrl || PRESET_IMAGES[0].url);
      setNotes(editingGoal.notes || '');
    } else {
      setName('');
      setTargetAmountStr('');
      setPriority('biasa');
      setDeadline('');
      setImageUrl(PRESET_IMAGES[0].url);
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                🚨 Sangat Mendesak
              </button>

              <button
                type="button"
                onClick={() => setPriority('biasa')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  priority === 'biasa'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚡ Biasa Saja
              </button>

              <button
                type="button"
                onClick={() => setPriority('santai')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  priority === 'santai'
                    ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'border-slate-200 dark:border-darkborder text-slate-600 dark:text-slate-400'
                }`}
              >
                ☕ Tidak Penting Amat
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
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Gambar Target
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`relative rounded-xl overflow-hidden aspect-video border-2 transition ${
                    imageUrl === preset.url
                      ? 'border-brand-500 scale-105 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex items-center space-x-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-darkborder hover:border-brand-500 text-xs text-slate-600 dark:text-slate-300 transition">
                <ImageIcon className="w-4 h-4 text-brand-500" />
                <span>Upload Foto Sendiri</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Atau tempel URL gambar..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
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

