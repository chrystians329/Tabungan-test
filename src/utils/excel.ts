import * as XLSX from 'xlsx';
import { Transaction, Wallet, Goal, WealthBreakdown } from '../types';

export interface ExportDataPayload {
  transactions: Transaction[];
  wallets: Wallet[];
  goals: Goal[];
  breakdown: WealthBreakdown;
}

/**
 * Format uang gaya Excel Indonesia.
 * Kode `[$-421]` = locale Indonesia, sehingga pemisah ribuan selalu tampil
 * sebagai TITIK (contoh: 1.500.000) di Excel / LibreOffice, berapa pun
 * setting bahasa aplikasi, dan nilai tetap berupa angka (bisa dijumlah).
 */
const MONEY_FORMAT = '[$-421]#,##0';
/** Persen dengan 1 desimal: 45.3 -> 45,3% */
const PERCENT_DECIMAL_FORMAT = '[$-421]0.0"%"';
/** Persen bulat: 45 -> 45% */
const PERCENT_INTEGER_FORMAT = '[$-421]0"%"';

/** Terapkan format sel (uang / persen) ke rentang baris pada satu kolom */
const setColumnFormat = (
  ws: XLSX.WorkSheet,
  col: number,
  fromRow: number,
  toRow: number,
  format: string
) => {
  for (let r = fromRow; r <= toRow; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: col })];
    if (cell && cell.t === 'n') cell.z = format;
  }
};

/**
 * Atur lebar semua kolom otomatis mengikuti konten terpanjang,
 * jadi tidak perlu klik manual / dobel-klik batas kolom di Excel.
 */
const applyAutoColumnWidths = (ws: XLSX.WorkSheet, minWidth = 8, maxWidth = 50) => {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const cols: XLSX.ColInfo[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    let width = minWidth;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || cell.v == null) continue;
      const text = cell.t === 'n' ? XLSX.utils.format_cell(cell) : String(cell.v);
      width = Math.max(width, text.length);
    }
    cols[c] = { wch: Math.min(maxWidth, Math.ceil(width) + 2) };
  }

  ws['!cols'] = cols;
};

/** Ubah sheet data biasa menjadi tabel: auto width + filter dropdown di header */
const styleAsTable = (ws: XLSX.WorkSheet, dataRows: number) => {
  applyAutoColumnWidths(ws);
  if (dataRows > 0 && ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }
};

export const exportToExcel = ({
  transactions,
  wallets,
  goals,
  breakdown,
}: ExportDataPayload) => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan Keuangan
  const summaryAoa: (string | number)[][] = [
    ['RINGKASAN KEKAYAAN & KEUANGAN', '', ''],
    ['Tanggal Export', new Date().toLocaleDateString('id-ID'), ''],
    ['', '', ''],
    ['Kategori Akun', 'Saldo (IDR)', 'Persentase (%)'],
    ['Uang Cash (Tunai)', breakdown.cashTotal, breakdown.cashPercentage],
    ['E-Wallet', breakdown.ewalletTotal, breakdown.ewalletPercentage],
    ['Rekening Bank', breakdown.bankTotal, breakdown.bankPercentage],
    ['Tabungan Goals (Terpisah)', breakdown.goalsTotal, breakdown.goalsPercentage],
    ['', '', ''],
    ['TOTAL KEKAYAAN', breakdown.grandTotal, 100],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  setColumnFormat(wsSummary, 1, 4, 9, MONEY_FORMAT);
  setColumnFormat(wsSummary, 2, 4, 7, PERCENT_DECIMAL_FORMAT);
  setColumnFormat(wsSummary, 2, 9, 9, PERCENT_INTEGER_FORMAT);
  wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  applyAutoColumnWidths(wsSummary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // 2. Sheet Transaksi
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const transactionHeader = [
    'Tanggal',
    'Tipe',
    'Kategori',
    'Dompet Asal',
    'Dompet Tujuan (Transfer)',
    'Nominal (Rp)',
    'Merchant',
    'Catatan',
  ];
  const transactionRows: (string | number)[][] = transactions.map((t) => [
    t.date,
    t.type === 'income'
      ? 'Pemasukan'
      : t.type === 'expense'
      ? 'Pengeluaran'
      : 'Transfer Antar Dompet',
    t.category,
    walletMap.get(t.walletId) || 'Dompet Dihapus',
    t.toWalletId ? walletMap.get(t.toWalletId) || 'Dompet Dihapus' : '-',
    t.amount,
    t.merchant || '-',
    t.note || '-',
  ]);
  const wsTransactions = XLSX.utils.aoa_to_sheet([transactionHeader, ...transactionRows]);
  setColumnFormat(wsTransactions, 5, 1, transactionRows.length, MONEY_FORMAT);
  styleAsTable(wsTransactions, transactionRows.length);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  // 3. Sheet Dompet
  const walletHeader = [
    'ID',
    'Nama Dompet',
    'Tipe',
    'Nomor Rekening / Akun',
    'Saldo Saat Ini (Rp)',
  ];
  const walletRows: (string | number)[][] = wallets.map((w) => [
    w.id,
    w.name,
    w.type === 'cash' ? 'Cash / Tunai' : w.type === 'ewallet' ? 'E-Wallet' : 'Bank',
    w.accountNumber || '-',
    w.balance,
  ]);
  const wsWallets = XLSX.utils.aoa_to_sheet([walletHeader, ...walletRows]);
  setColumnFormat(wsWallets, 4, 1, walletRows.length, MONEY_FORMAT);
  styleAsTable(wsWallets, walletRows.length);
  XLSX.utils.book_append_sheet(wb, wsWallets, 'Daftar Dompet');

  // 4. Sheet Goals
  const goalHeader = [
    'Nama Target',
    'Prioritas',
    'Terkumpul (Rp)',
    'Target (Rp)',
    'Progress (%)',
    'Deadline',
    'Catatan',
  ];
  const goalRows: (string | number)[][] = goals.map((g) => [
    g.name,
    g.priority === 'urgent'
      ? 'Sangat Mendesak'
      : g.priority === 'biasa'
      ? 'Biasa Saja'
      : 'Tidak Terlalu Penting',
    g.currentAmount,
    g.targetAmount,
    Math.round((g.currentAmount / (g.targetAmount || 1)) * 100),
    g.deadline || '-',
    g.notes || '-',
  ]);
  const wsGoals = XLSX.utils.aoa_to_sheet([goalHeader, ...goalRows]);
  setColumnFormat(wsGoals, 2, 1, goalRows.length, MONEY_FORMAT);
  setColumnFormat(wsGoals, 3, 1, goalRows.length, MONEY_FORMAT);
  setColumnFormat(wsGoals, 4, 1, goalRows.length, PERCENT_INTEGER_FORMAT);
  styleAsTable(wsGoals, goalRows.length);
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

/**
 * Membaca nilai uang dari Excel / CSV.
 * Mendukung angka mentah (1500000) maupun teks berformat
 * ("Rp 1.500.000", "1,500,000", "1.500.000,50").
 */
const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;

  let text = String(value).replace(/[^\d.,-]/g, '').trim();
  if (!text) return 0;

  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');

  if (lastDot > -1 && lastComma > -1) {
    // Pemisah desimal = pemisah paling kanan, sisanya pemisah ribuan
    text =
      lastDot > lastComma
        ? text.replace(/,/g, '')
        : text.replace(/\./g, '').replace(',', '.');
  } else if (lastComma > -1) {
    const parts = text.split(',');
    // "1,500,000" = ribuan (en-US), "1,5" = desimal (id-ID)
    text =
      parts[0] !== '0' && (parts.length > 2 || parts[1].length === 3)
        ? text.replace(/,/g, '')
        : text.replace(',', '.');
  } else if (lastDot > -1) {
    const parts = text.split('.');
    // "1.500.000" = ribuan (id-ID), "1.5" = desimal
    const isThousands =
      parts[0] !== '0' && (parts.length > 2 || parts[parts.length - 1].length === 3);
    if (isThousands) text = text.replace(/\./g, '');
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
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
          amount: parseAmount(r['Nominal (Rp)']),
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
        balance: parseAmount(r['Saldo Saat Ini (Rp)']),
        accountNumber:
          r['Nomor Rekening / Akun'] && r['Nomor Rekening / Akun'] !== '-'
            ? String(r['Nomor Rekening / Akun'])
            : '',
        createdAt: new Date().toISOString(),
      }));
    }

    if (sheetName.toLowerCase().includes('goal')) {
      result.goals = rows.map((r, i) => {
        const priorityRaw = String(r['Prioritas'] || '').toLowerCase();
        return {
          id: `import_g_${i + 1}`,
          name: r['Nama Target'] || `Goal ${i + 1}`,
          targetAmount: parseAmount(r['Target (Rp)']) || 1000000,
          currentAmount: parseAmount(r['Terkumpul (Rp)']),
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


