import { createWorker } from 'tesseract.js';
import { OCRResult, WalletType } from '../types';
import { getLocalDateString } from './formatters';

export interface ScanProgressCallback {
  (progress: { status: string; progress: number }): void;
}

export const scanImageOCR = async (
  imageSource: string | File,
  type: 'receipt' | 'ewallet',
  onProgress?: ScanProgressCallback
): Promise<OCRResult> => {
  const worker = await createWorker('ind+eng', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress({
          status: 'Sedang membaca teks gambar...',
          progress: Math.round((m.progress || 0) * 100),
        });
      } else if (onProgress) {
        onProgress({
          status: m.status,
          progress: 20,
        });
      }
    },
  });

  try {
    const ret = await worker.recognize(imageSource);
    const text = ret.data.text;
    await worker.terminate();

    if (type === 'ewallet') {
      return parseEWalletScreenshot(text);
    } else {
      return parseReceipt(text);
    }
  } catch (error) {
    await worker.terminate();
    console.error('OCR error:', error);
    // Fallback parser on failure
    return {
      rawText: 'Gagal memproses gambar secara otomatis. Silakan masukkan nominal manual.',
      amount: 0,
      detectedType: type,
    };
  }
};

/**
 * Intelligent parser for physical store receipts (Indomaret, Alfamart, Restoran, Supermarket)
 */
export const parseReceipt = (text: string): OCRResult => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let merchant = '';
  let amount = 0;
  let date = getLocalDateString();
  let category = 'Belanja & Groceries';

  // 1. Merchant Detection
  const knownMerchants = [
    'INDOMARET',
    'ALFAMART',
    'ALFAMIDI',
    'SUPERINDO',
    'HYPERMART',
    'TRANSMART',
    'CARREFOUR',
    'HERO',
    'STARBUCKS',
    'KOPI KENANGAN',
    'JANJI JIWA',
    'POINT COFFEE',
    'LAWSON',
    'FAMILYMART',
    'MCDONALD',
    'KFC',
    'BURGER KING',
    'PIZZA HUT',
    'WARKOP',
    'ACE HARDWARE',
    'MINISO',
    'UNIQLO',
  ];

  for (const line of lines.slice(0, 8)) {
    const upper = line.toUpperCase();
    const matched = knownMerchants.find((m) => upper.includes(m));
    if (matched) {
      merchant = matched;
      if (['STARBUCKS', 'KOPI KENANGAN', 'JANJI JIWA', 'POINT COFFEE', 'MCDONALD', 'KFC', 'BURGER KING', 'PIZZA HUT'].includes(matched)) {
        category = 'Makanan & Minuman';
      }
      break;
    }
  }

  // If no known merchant, pick the first clean line from the top
  if (!merchant && lines.length > 0) {
    const candidate = lines.slice(0, 3).find((l) => l.length > 3 && !l.match(/jl\.|jalan|no\.|telp/i));
    if (candidate) {
      merchant = candidate.replace(/[^\w\s]/gi, '').trim();
    }
  }

  // 2. Date Detection (DD/MM/YYYY or DD-MM-YYYY or DD Mon YYYY)
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    try {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = `20${year}`;
      const parsedDate = `${year}-${month}-${day}`;
      if (!isNaN(Date.parse(parsedDate))) {
        date = parsedDate;
      }
    } catch {
      // fallback to today
    }
  }

  // 3. Amount / Total Detection
  // Prioritaskan GRAND TOTAL / TOTAL BAYAR (sudah termasuk pajak/PPN).
  // Hindari "Subtotal" (belum termasuk pajak) — lookbehind + urutan keyword.
  const totalRegexes = [
    /(?:grand[\s\.\*]*total|total[\s\.\*]*bayar|total[\s\.\*]*tagihan|jumlah[\s\.\*]*bayar|total[\s\.\*]*akhir|netto)[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/i,
    /(?<!sub)(?:^|[^\w])total[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/im,
    /r?p?\.?\s*([\d\.\,]+)[\s]*(?:grand[\s\.\*]*total)/i,
  ];

  for (const regex of totalRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = cleanNominalString(match[1]);
      if (cleaned > 0) {
        amount = cleaned;
        break;
      }
    }
  }

  // Jika hanya Subtotal + PPN/Pajak yang terbaca (tanpa baris Grand Total),
  // jumlahkan agar pajak ikut masuk ke amount.
  if (amount === 0) {
    const subMatch = text.match(
      /(?:subtotal|sub[\s\.\*]*total)[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/i
    );
    const taxMatch = text.match(
      /(?:ppn|pajak|vat|tax)[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/i
    );
    if (subMatch) {
      const sub = cleanNominalString(subMatch[1]);
      const tax = taxMatch ? cleanNominalString(taxMatch[1]) : 0;
      if (sub > 0) amount = sub + tax;
    }
  }

  // Fallback: find highest logical number in lines containing "RP" or numbers
  if (amount === 0) {
    const allAmounts: number[] = [];
    for (const line of lines) {
      if (/total|grand|bayar|rp/i.test(line)) {
        const numbers = line.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/g);
        if (numbers) {
          numbers.forEach((numStr) => {
            const val = cleanNominalString(numStr);
            if (val > 500 && val < 50_000_000) {
              allAmounts.push(val);
            }
          });
        }
      }
    }
    if (allAmounts.length > 0) {
      amount = Math.max(...allAmounts);
    }
  }

  return {
    merchant: merchant || 'Toko / Resto',
    amount: amount || 0,
    date,
    category,
    rawText: text,
    detectedType: 'receipt',
    sourceWalletType: 'cash',
  };
};

/**
 * Intelligent parser for E-Wallet & Mobile Banking Screenshots (GoPay, OVO, DANA, ShopeePay, BCA, Livin)
 */
export const parseEWalletScreenshot = (text: string): OCRResult => {
  const upper = text.toUpperCase();
  let sourceWalletType: WalletType = 'ewallet';
  let merchant = '';
  let amount = 0;
  let date = getLocalDateString();
  let category = 'Transfer & E-Wallet';

  // 1. Detect Source Wallet / App
  if (upper.includes('GOPAY') || upper.includes('GOJEK')) {
    merchant = 'GoPay';
    sourceWalletType = 'ewallet';
  } else if (upper.includes('OVO')) {
    merchant = 'OVO';
    sourceWalletType = 'ewallet';
  } else if (upper.includes('DANA')) {
    merchant = 'DANA';
    sourceWalletType = 'ewallet';
  } else if (upper.includes('SHOPEEPAY') || upper.includes('SHOPEE')) {
    merchant = 'ShopeePay';
    sourceWalletType = 'ewallet';
  } else if (upper.includes('BCA') || upper.includes('M-BCA') || upper.includes('MYBCA')) {
    merchant = 'BCA Mobile';
    sourceWalletType = 'bank';
  } else if (upper.includes('MANDIRI') || upper.includes('LIVIN')) {
    merchant = 'Livin Mandiri';
    sourceWalletType = 'bank';
  } else if (upper.includes('BRIMO') || upper.includes('BRI')) {
    merchant = 'BRImo';
    sourceWalletType = 'bank';
  } else if (upper.includes('BNI')) {
    merchant = 'BNI Mobile';
    sourceWalletType = 'bank';
  } else if (upper.includes('SEABANK')) {
    merchant = 'SeaBank';
    sourceWalletType = 'bank';
  } else if (upper.includes('JENIUS')) {
    merchant = 'Jenius';
    sourceWalletType = 'bank';
  } else if (upper.includes('QRIS')) {
    merchant = 'Pembayaran QRIS';
    sourceWalletType = 'ewallet';
    category = 'Belanja & Groceries';
  }

  // 2. Detect Amount
  // Common patterns: "Rp 50.000", "Rp. 150.000", "Total Pembayaran: Rp 75.000", "Nominal Rp 100.000"
  const amountPatterns = [
    /(?:total|nominal|jumlah|pembayaran|berhasil|transfer|sebesar)[\s\:\.\=]*r?p?\.?\s*([\d\.\,]+)/i,
    /r?p?\.?\s*([\d\.\,]+)\b/i,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const val = cleanNominalString(match[1]);
      if (val >= 1000) {
        amount = val;
        break;
      }
    }
  }

  // Detect recipient if available (e.g. "Ke: Ahmad Fauzi", "Penerima: Indomaret")
  const recipientMatch = text.match(/(?:ke|penerima|tujuan|merchant|nama)[\s\:\.\=]+([A-Za-z0-9\s]{3,30})/i);
  if (recipientMatch && recipientMatch[1]) {
    const recipient = recipientMatch[1].trim();
    if (!recipient.toUpperCase().includes('BERHASIL')) {
      merchant = `${merchant ? merchant + ' - ' : ''}${recipient}`;
    }
  }

  return {
    merchant: merchant || 'E-Wallet Transfer',
    amount: amount || 0,
    date,
    category,
    rawText: text,
    detectedType: 'ewallet',
    sourceWalletType,
  };
};

const cleanNominalString = (raw: string): number => {
  // Normalize indonesian thousands delimiter (dot) and cents delimiter (comma)
  // e.g. "50.000,00" -> 50000
  let str = raw.replace(/\s+/g, '').replace(/rp/gi, '');

  if (str.includes(',') && str.includes('.')) {
    // 50.000,00
    str = str.replace(/\./g, '').split(',')[0];
  } else if (str.includes(',')) {
    // Might be 50,000 or 50000,00
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      str = parts[0];
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // 50.000
    str = str.replace(/\./g, '');
  }

  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
};
