import React, { useState } from 'react';
import { X, LayoutTemplate, Plus, Edit2, Trash2, Sparkles, Save } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { IncomeTemplate } from '../../types';
import { INCOME_CATEGORIES } from '../../constants/categories';
import { formatRupiah } from '../../utils/formatters';

interface TemplateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}) => {
  const { settings, addIncomeTemplate, updateIncomeTemplate, deleteIncomeTemplate } = useFinance();
  const templates = settings.incomeTemplates || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (!isOpen) return null;

  const startEdit = (tpl: IncomeTemplate) => {
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
    setForm({ ...EMPTY_FORM, id: '' });
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
      updateIncomeTemplate(form.id, payload);
    } else {
      addIncomeTemplate(payload);
    }
    cancelForm();
  };

  const handleDelete = (tpl: IncomeTemplate) => {
    if (confirm(`Hapus template pemasukan "${tpl.name}"?`)) {
      deleteIncomeTemplate(tpl.id);
      if (form.id === tpl.id) cancelForm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-darkcard rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkborder overflow-hidden modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-darkborder">
          <div className="flex items-center space-x-2">
            <LayoutTemplate className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Template Pemasukan
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur sesuka hati, muncul otomatis saat catat pemasukan
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
          {/* List template */}
          <div className="space-y-2">
            {templates.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-darkborder text-center empty-pop">
                <Sparkles className="w-8 h-8 text-brand-400 mx-auto mb-2 float-slow" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada template. Buat template pertama agar pemasukan lebih cepat dicatat.
                </p>
              </div>
            ) : (
              templates.map((tpl, index) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-darkborder hover:border-brand-500/40 transition group fade-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                      {tpl.name}
                    </span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                      {formatRupiah(tpl.amount)}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                        {tpl.category}
                      </span>
                      {tpl.merchant && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-darkcard text-slate-500 dark:text-slate-400">
                          {tpl.merchant}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => startEdit(tpl)}
                      className="p-2 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition"
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
              className="p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 space-y-3 fade-up"
            >
              <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
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
                    placeholder="cth: Gaji Bulanan"
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
                    {INCOME_CATEGORIES.map((c) => (
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
                    placeholder="cth: PT Maju Jaya"
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
                  placeholder="cth: Gaji tanggal 25"
                  className="w-full px-3 py-2.5 bg-white dark:bg-darkbg rounded-xl border border-slate-200 dark:border-darkborder text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-soft transition flex items-center justify-center gap-1.5"
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
              className="w-full py-3 rounded-xl border-2 border-dashed border-brand-500/40 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-500/10 transition flex items-center justify-center gap-1.5"
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
