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

export const parseExcelOrJSONFile = async (
  file: File
): Promise<{
  transactions?: Transaction[];
  wallets?: Wallet[];
  goals?: Goal[];
}> => {
  if (file.name.endsWith('.json')) {
    const text = await file.text();
    return JSON.parse(text);
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
      result.transactions = rows.map((r, i) => ({
        id: `import_tx_${Date.now()}_${i}`,
        date: r['Tanggal'] || new Date().toISOString().split('T')[0],
        type:
          r['Tipe'] === 'Pemasukan'
            ? 'income'
            : r['Tipe'] === 'Pengeluaran'
            ? 'expense'
            : 'transfer',
        category: r['Kategori'] || 'Lain-lain',
        walletId: 'default_cash',
        amount: Number(r['Nominal (Rp)']) || 0,
        merchant: r['Merchant'] || '',
        note: r['Catatan'] || '',
        createdAt: new Date().toISOString(),
      }));
    }

    if (sheetName.toLowerCase().includes('dompet')) {
      result.wallets = rows.map((r, i) => ({
        id: `import_w_${Date.now()}_${i}`,
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
      result.goals = rows.map((r, i) => ({
        id: `import_g_${Date.now()}_${i}`,
        name: r['Nama Target'] || `Goal ${i + 1}`,
        targetAmount: Number(r['Target (Rp)']) || 1000000,
        currentAmount: Number(r['Terkumpul (Rp)']) || 0,
        priority:
          String(r['Prioritas']).toLowerCase().includes('urgent') || String(r['Prioritas']).toLowerCase().includes('mendesak')
            ? 'urgent'
            : String(r['Prioritas']).toLowerCase().includes('santai') || String(r['Prioritas']).toLowerCase().includes('tidak penting')
            ? 'santai'
            : 'biasa',
        deadline: r['Deadline'] !== '-' ? r['Deadline'] : undefined,
        notes: r['Catatan'] || '',
        createdAt: new Date().toISOString(),
      }));
    }
  });

  return result;
};

