import * as XLSX from 'xlsx';
import { Transaction, Wallet, Goal, WealthBreakdown } from '../types';
import { formatRupiah } from './formatters';

export interface ExportDataPayload {
  transactions: Transaction[];
  wallets: Wallet[];
  goals: Goal[];
  breakdown: WealthBreakdown;
}

export const exportToExcel = ({
  transactions,
  wallets,
  goals,
  breakdown,
}: ExportDataPayload) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan Keuangan
  const summaryData = [
    ['RINGKASAN KEKAYAAN & KEUANGAN', ''],
    ['Tanggal Export', new Date().toLocaleDateString('id-ID')],
    ['', ''],
    ['Kategori Akun', 'Saldo (IDR)', 'Persentase (%)'],
    ['Uang Cash (Tunai)', breakdown.cashTotal, `${breakdown.cashPercentage.toFixed(1)}%`],
    ['E-Wallet', breakdown.ewalletTotal, `${breakdown.ewalletPercentage.toFixed(1)}%`],
    ['Rekening Bank', breakdown.bankTotal, `${breakdown.bankPercentage.toFixed(1)}%`],
    ['Tabungan Goals (Terpisah)', breakdown.goalsTotal, `${breakdown.goalsPercentage.toFixed(1)}%`],
    ['', '', ''],
    ['TOTAL KEKAYAAN', breakdown.grandTotal, '100%'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Sheet Transaksi
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const transactionRows = transactions.map((t) => ({
    Tanggal: t.date,
    Tipe: t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer Antar Dompet',
    Kategori: t.category,
    'Dompet Asal': walletMap.get(t.walletId) || 'Dompet Dihapus',
    'Dompet Tujuan (Transfer)': t.toWalletId ? walletMap.get(t.toWalletId) : '-',
    'Nominal (Rp)': t.amount,
    Merchant: t.merchant || '-',
    Catatan: t.note || '-',
  }));
  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  // 3. Sheet Dompet
  const walletRows = wallets.map((w) => ({
    ID: w.id,
    'Nama Dompet': w.name,
    Tipe: w.type === 'cash' ? 'Cash / Tunai' : w.type === 'ewallet' ? 'E-Wallet' : 'Bank',
    'Nomor Rekening / Akun': w.accountNumber || '-',
    'Saldo Saat Ini (Rp)': w.balance,
  }));
  const wsWallets = XLSX.utils.json_to_sheet(walletRows);
  XLSX.utils.book_append_sheet(wb, wsWallets, 'Daftar Dompet');

  // 4. Sheet Goals
  const goalRows = goals.map((g) => ({
    'Nama Target': g.name,
    Prioritas: g.priority === 'urgent' ? 'Sangat Mendesak' : g.priority === 'biasa' ? 'Biasa Saja' : 'Tidak Terlalu Penting',
    'Terkumpul (Rp)': g.currentAmount,
    'Target (Rp)': g.targetAmount,
    'Progress (%)': `${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}%`,
    Deadline: g.deadline || '-',
    Catatan: g.notes || '-',
  }));
  const wsGoals = XLSX.utils.json_to_sheet(goalRows);
  XLSX.utils.book_append_sheet(wb, wsGoals, 'Target Goals');

  // Generate filename with date
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `KayaKu_Laporan_Keuangan_${dateStr}.xlsx`);
};

export const exportToJSON = (data: {
  transactions: Transaction[];
  wallets: Wallet[];
  goals: Goal[];
}) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KayaKu_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Konversi serial tanggal Excel (angka) menjadi string YYYY-MM-DD */
const excelDateToISO = (value: unknown): string | undefined => {
  if (!value || value === '-') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    return new Date(ms).toISOString().split('T')[0];
  }
  const str = String(value).trim();
  if (!str) return undefined;
  return str;
};

export const parseExcelOrJSONFile = async (
  file: File
): Promise<{
  transactions?: Transaction[];
  wallets?: Wallet[];
  goals?: Goal[];
}> => {
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Format file JSON tidak sesuai dengan backup KayaKu.');
    }
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : undefined,
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : undefined,
      goals: Array.isArray(parsed.goals) ? parsed.goals : undefined,
    };
  }

  // Handle Excel / CSV
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const result: {
    transactions?: Transaction[];
    wallets?: Wallet[];
    goals?: Goal[];
  } = {};

  // Try parsing sheets
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    if (sheetName.toLowerCase().includes('transaksi')) {
      result.transactions = rows.map((r, i) => {
        const fromName =
          r['Dompet Asal'] && r['Dompet Asal'] !== 'Dompet Dihapus' ? String(r['Dompet Asal']) : '';
        const toName =
          r['Dompet Tujuan (Transfer)'] && r['Dompet Tujuan (Transfer)'] !== '-'
            ? String(r['Dompet Tujuan (Transfer)'])
            : '';
        return {
          id: `import_tx_${Date.now()}_${i}`,
          date: excelDateToISO(r['Tanggal']) || new Date().toISOString().split('T')[0],
          type:
            r['Tipe'] === 'Pemasukan'
              ? ('income' as const)
              : r['Tipe'] === 'Pengeluaran'
              ? ('expense' as const)
              : ('transfer' as const),
          category: r['Kategori'] || 'Lain-lain',
          walletId: fromName ? `name:${fromName}` : '',
          toWalletId: toName ? `name:${toName}` : undefined,
          amount: Number(r['Nominal (Rp)']) || 0,
          merchant: r['Merchant'] && r['Merchant'] !== '-' ? r['Merchant'] : '',
          note: r['Catatan'] && r['Catatan'] !== '-' ? r['Catatan'] : '',
          createdAt: new Date().toISOString(),
        } as Transaction;
      });
    }

    if (sheetName.toLowerCase().includes('dompet')) {
      result.wallets = rows.map((r, i) => ({
        id: r['ID'] ? String(r['ID']) : `import_w_${i + 1}`,
        name: r['Nama Dompet'] || `Dompet ${i + 1}`,
        type:
          String(r['Tipe']).toLowerCase().includes('bank')
            ? 'bank'
            : String(r['Tipe']).toLowerCase().includes('ewallet') || String(r['Tipe']).toLowerCase().includes('wallet')
            ? 'ewallet'
            : 'cash',
        balance: Number(r['Saldo Saat Ini (Rp)']) || 0,
        accountNumber: r['Nomor Rekening / Akun'] || '',
        createdAt: new Date().toISOString(),
      }));
    }

    if (sheetName.toLowerCase().includes('goal')) {
      result.goals = rows.map((r, i) => {
        const priorityRaw = String(r['Prioritas'] || '').toLowerCase();
        return {
          id: `import_g_${i + 1}`,
          name: r['Nama Target'] || `Goal ${i + 1}`,
          targetAmount: Number(r['Target (Rp)']) || 1000000,
          currentAmount: Number(r['Terkumpul (Rp)']) || 0,
          priority:
            priorityRaw.includes('urgent') || priorityRaw.includes('mendesak')
              ? ('urgent' as const)
              : priorityRaw.includes('santai') ||
                priorityRaw.includes('tidak penting') ||
                priorityRaw.includes('tidak terlalu')
              ? ('santai' as const)
              : ('biasa' as const),
          deadline: excelDateToISO(r['Deadline']),
          notes: r['Catatan'] && r['Catatan'] !== '-' ? r['Catatan'] : '',
          createdAt: new Date().toISOString(),
        } as Goal;
      });
    }
  });

  return result;
};


