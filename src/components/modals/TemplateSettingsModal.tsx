import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutTemplate,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Save,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { IncomeTemplate, ExpenseTemplate } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { formatRupiah } from '../../utils/formatters';
import { useModalTransition } from '../../hooks/useModalTransition';

interface TemplateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tab awal saat modal dibuka (default: pemasukan) */
  initialTab?: 'income' | 'expense';
}

const EMPTY_FORM = {
  id: '',
  name: '',
  amountStr: '',
  category: INCOME_CATEGORIES[0],
  merchant: '',
  note: '',
};

export const TemplateSettingsModal: React.FC<TemplateSettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'income',
}) => {
  const {
    settings,
    addIncomeTemplate,
    updateIncomeTemplate,
    deleteIncomeTemplate,
    addExpenseTemplate,
    updateExpenseTemplate,
    deleteExpenseTemplate,
  } = useFinance();

  const [tab, setTab] = useState<'income' | 'expense'>(initialTab);
  const templates: (IncomeTemplate | ExpenseTemplate)[] =
    tab === 'income' ? settings.incomeTemplates || [] : settings.expenseTemplates || [];
  const categories = tab === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const [form, setForm] = useState(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Tetap mounted selama animasi close supaya modal tidak langsung hilang
  const [mounted, isClosing] = useModalTransition(isOpen);

  // Sinkronkan tab dengan permintaan caller setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  }, [isOpen, initialTab]);

  if (!mounted) return null;

  const isIncome = tab === 'income';

  const switchTab = (next: 'income' | 'expense') => {
    if (next === tab) return;
    const nextCats = next === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setTab(next);
    setForm((prev) => ({
      ...prev,
      category: nextCats.includes(prev.category) ? prev.category : nextCats[0],
    }));
  };

  const startEdit = (tpl: IncomeTemplate | ExpenseTemplate) => {
    setForm({
      id: tpl.id,
      name: tpl.name,
      amountStr: tpl.amount ? new Intl.NumberFormat('id-ID').format(tpl.amount) : '',
      category: tpl.category,
      merchant: tpl.merchant || '',
      note: tpl.note || '',
    });
    setIsFormOpen(true);
  };

  const startAdd = () => {
    setForm({ ...EMPTY_FORM, id: '', category: categories[0] });
    setIsFormOpen(true);
  };

  const cancelForm = () => {
    setForm(EMPTY_FORM);
    setIsFormOpen(false);
  };

  const handleAmountChange = (value: string) => {
    const raw = value.replace(/\D/g, '');
    setForm((prev) => ({
      ...prev,
      amountStr: raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '',
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing) return;
    const amount = Number(form.amountStr.replace(/\D/g, '')) || 0;
    if (!form.name.trim()) {
      alert('Nama template wajib diisi.');
      return;
    }
    if (amount <= 0) {
      alert('Nominal template harus lebih dari 0.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      amount,
      category: form.category,
      merchant: form.merchant.trim(),
      note: form.note.trim(),
    };

    if (form.id) {
      if (isIncome) {
        updateIncomeTemplate(form.id, payload);
      } else {
        updateExpenseTemplate(form.id, payload);
      }
    } else {
      if (isIncome) {
        addIncomeTemplate(payload);
      } else {
        addExpenseTemplate(payload);
      }
    }
    cancelForm();
  };

  const handleDelete = (tpl: IncomeTemplate | ExpenseTemplate) => {
    const label = isIncome ? 'pemasukan' : 'pengeluaran';
    if (confirm(`Hapus template ${label} "${tpl.name}"?`)) {
      if (isIncome) {
        deleteIncomeTemplate(tpl.id);
      } else {
        deleteExpenseTemplate(tpl.id);
      }
      if (form.id === tpl.id) cancelForm();
    }
  };

  const accentText = isIncome ? 'text-brand-600 dark:text-brand-400' : 'text-rose-600 dark:text-rose-400';
  const accentBorder = isIncome ? 'border-brand-500/30' : 'border-rose-500/30';
  const accentBadge = isIncome
    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 ${
        isClosing ? 'fade-out pointer-events-none' : 'animate-fade-in'
      }`}
    >
      <div
        className={`w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden ${
          isClosing ? 'modal-out pointer-events-none' : 'modal-in'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <LayoutTemplate className={`w-5 h-5 ${isIncome ? 'text-brand-500' : 'text-rose-500'}`} />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isIncome ? 'Template Pemasukan' : 'Template Pengeluaran'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isIncome
                  ? 'Atur sesuka hati, muncul otomatis saat catat pemasukan'
                  : 'Atur sesuka hati, muncul otomatis saat catat pengeluaran'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-darkborder/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tab Pemasukan / Pengeluaran */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-darkbg rounded-xl">
            <button
              type="button"
              onClick={() => switchTab('income')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                isIncome
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Pemasukan</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('expense')}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition ${
                !isIncome
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pengeluaran</span>
            </button>
          </div>

          {/* List template */}
          <div className="space-y-2">
            {templates.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-darkborder text-center empty-pop">
                <Sparkles className={`w-8 h-8 mx-auto mb-2 float-slow ${isIncome ? 'text-brand-400' : 'text-rose-400'}`} />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada template. Buat template pertama agar{' '}
                  {isIncome ? 'pemasukan' : 'pengeluaran'} lebih cepat dicatat.
                </p>
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder transition group ${
                    isIncome
                      ? 'hover:border-brand-500/40'
                      : 'hover:border-rose-500/40'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                      {tpl.name}
                    </span>
                    <span className={`text-xs font-semibold ${accentText}`}>
                      {formatRupiah(tpl.amount)}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${accentBadge}`}
                      >
                        {tpl.category}
                      </span>
                      {tpl.merchant && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-darkcard text-slate-600 dark:text-slate-300 font-semibold">
                          {tpl.merchant}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => startEdit(tpl)}
                      className={`p-2 rounded-lg text-slate-400 hover:bg-brand-500/10 transition ${
                        isIncome ? 'hover:text-brand-500' : 'hover:text-rose-500'
                      }`}
                      title="Edit Template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Hapus Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form tambah / edit */}
          {isFormOpen ? (
            <form
              onSubmit={handleSave}
              className={`p-4 rounded-2xl border space-y-3 fade-up ${accentBorder} ${
                isIncome ? 'bg-brand-500/5' : 'bg-rose-500/5'
              }`}
            >
              <span className={`text-xs font-bold ${accentText}`}>
                {form.id ? 'Edit Template' : 'Template Baru'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Nama Template
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={isIncome ? 'cth: Gaji Bulanan' : 'cth: Makan Siang'}
                    required
                    className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.amountStr}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Sumber / Merchant
                  </label>
                  <input
                    type="text"
                    value={form.merchant}
                    onChange={(e) => setForm((p) => ({ ...p, merchant: e.target.value }))}
                    placeholder={isIncome ? 'cth: PT Maju Jaya' : 'cth: Indomaret'}
                    className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder={isIncome ? 'cth: Gaji tanggal 25' : 'cth: Makan bareng tim'}
                  className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-soft transition flex items-center justify-center gap-1.5 ${
                    isIncome ? 'bg-brand-500 hover:bg-brand-600' : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Template</span>
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkborder text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darkbg transition"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={startAdd}
              className={`w-full py-3 rounded-xl border-2 border-dashed text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                isIncome
                  ? 'border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10'
                  : 'border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Template Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
