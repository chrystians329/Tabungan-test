import { GoalPriority } from '../types';

export const formatRupiah = (amount: number): string => {
  if (isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactRupiah = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return 'Rp 0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${abs}`;
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    // 'YYYY-MM-DD' ditambahkan waktu lokal agar tidak bergeser hari (timezone UTC)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T00:00:00`)
      : new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatPercentage = (percent: number): string => {
  if (isNaN(percent)) return '0%';
  return `${Math.round(percent)}%`;
};

export const getPriorityBadge = (priority: GoalPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Sangat Mendesak',
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        dotClass: 'bg-rose-500',
      };
    case 'biasa':
      return {
        label: 'Biasa Saja',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        dotClass: 'bg-amber-500',
      };
    case 'santai':
      return {
        label: 'Tidak Penting Amat',
        badgeClass: 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20',
        dotClass: 'bg-brand-500',
      };
  }
};

