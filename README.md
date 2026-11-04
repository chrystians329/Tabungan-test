# 🌟 KayaKu - Smart Personal Finance & Isolated Goals Web App

Aplikasi manajemen keuangan pribadi modern, responsif (Mobile & Desktop), dengan sistem tabungan target (*goals*) terisolasi, pemindai OCR struk dan screenshot e-wallet, kalkulasi persentase kekayaan otomatis, serta sinkronisasi multi-device gratis.

---

## 🎨 Sistem Desain: 2 Kunci Warna Utama
Aplikasi ini dirancang dengan prinsip **minimalis, elegan, bersih, dan bebas visual-slop**:
1. **Primary Key Color: Emerald / Jade Green (`#10B981` / `#059669`)**
   - Melambangkan kemakmuran finansial (*wealth growth*), ketenangan pikiran, dan kejelasan alokasi.
2. **Neutral Key Color: Obsidian Slate (`#0F172A` / `#0B0F17`)**
   - Menghadirkan struktur premium fintech, tipografi berkontras tinggi, kartu modern, dan latar belakang dark/light mode yang nyaman di mata.

---

## ✨ Fitur-Fitur Utama

### 1. Pemasukan & Pengeluaran Terpisah Berdasarkan Kantong Uang
- **Cash / Tunai**: Pencatatan uang fisik di dompet/saku.
- **E-Wallet**: GoPay, OVO, DANA, ShopeePay, dll.
- **Rekening Bank**: BCA, Mandiri, BRI, BNI, Jenius, SeaBank, dll.
- Fitur **Transfer Saldo Antar Dompet** dengan penyesuaian otomatis.

### 2. Full CRUD (Create, Read, Update, Delete)
- Tambah, edit, dan hapus transaksi dengan pembaruan saldo dompet secara *real-time*.
- Kelola dompet/rekening (tambah rekening baru, ubah nomor akun/saldo, hapus akun).
- Riwayat transaksi dilengkapi pencarian teks, filter kategori, filter dompet, dan tanggal.

### 3. Sinkronisasi Mobile & Desktop (Gratis)
- **Supabase Free Tier (Direkomendasikan)**: Menghubungkan HP & Laptop secara *real-time* (< 100ms) menggunakan WebSocket gratis selamanya.
- **Cross-Tab Realtime**: Menggunakan `BroadcastChannel` API sehingga perubahan di satu tab langsung muncul di tab lainnya.
- **Google Drive / JSON Backup**: Unduh file backup dan pulihkan di perangkat lain kapan saja.

### 4. Target Tabungan (Goals Terpisah)
- **Sistem Saldo Terisolasi**: Saldo goals terpisah 100% dari saldo utama (Cash/E-Wallet/Bank). Pengeluaran belanja harian di tabungan utama tidak akan memotong uang target goals, dan sebaliknya.
- Atribut goals:
  - Foto/gambar (Preset pilihan atau upload foto sendiri)
  - Nama impian
  - Target nominal & tanggal capaian
  - **Urgensi Kebutuhan**:
    - 🚨 *Sangat Mendesak (Urgent)*
    - ⚡ *Biasa Saja (Medium)*
    - ☕ *Tidak Penting Amat (Low)*
- Animasi kembang api (*confetti*) saat target tabungan berhasil mencapai 100%!

### 5. Dashboard Portofolio & Kalkulasi Persentase Uang
- Total Kekayaan Bersih (*Grand Total Net Worth*) menghitung keseluruhan:
  $$\text{Grand Total} = \text{Cash} + \text{E-Wallet} + \text{Bank} + \text{Goals}$$
- Visual **Multi-Segment Distribution Bar** dan kartu persentase:
  - Uang Cash: Rp X (Y%)
  - E-Wallet: Rp X (Y%)
  - Bank: Rp X (Y%)
  - Goals: Rp X (Y%)

### 6. Export & Import Excel Spreadsheet (.xlsx)
- **Export ke Excel (.xlsx)**: Berisi 4 sheet terstruktur:
  1. *Ringkasan*: Alokasi total kekayaan dan persentase
  2. *Daftar Transaksi*: Riwayat lengkap pemasukan, pengeluaran & transfer
  3. *Daftar Dompet*: Saldo aktif setiap akun
  4. *Target Goals*: Progress dan status tabungan impian
- **Import dari Excel / CSV / JSON**: Deteksi otomatis dengan preview sebelum data digabungkan.

### 7. Scan Struk Belanja (Receipt OCR)
- Scan struk fisik (Indomaret, Alfamart, restoran, supermarket, dsb.) via kamera ponsel atau file gambar.
- Ekstraksi otomatis nominal total, merchant toko, dan tanggal transaksi.

### 8. Scan Screenshot E-Wallet & Bukti Transfer
- Membaca screenshot bukti transaksi GoPay, OVO, DANA, BCA Mobile, Livin', atau QRIS.
- Otomatis mendeteksi sumber e-wallet/bank dan mengisi form pencatatan.

### 9. Light & Dark Mode
- Beralih instan antara mode Gelap (Obsidian) dan Terang (Pure White).
- Preferensi tersimpan otomatis di perangkat pengguna.

---

## 🚀 Cara Menjalankan Proyek

1. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka di browser: `http://localhost:3000`

2. **Jalankan di HP / Mobile dalam Jaringan Wi-Fi yang Sama**:
   Vite sudah diset dengan `--host`, sehingga Anda cukup membuka IP laptop Anda di browser HP (contoh: `http://192.168.1.x:3000`).

3. **Build untuk Production**:
   ```bash
   npm run build
   npm run preview
   ```

# Tabungan-test
# Tabungan-test
