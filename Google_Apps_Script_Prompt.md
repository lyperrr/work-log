# Prompt Pembuatan Kode Google Apps Script (Backend & Database)

Gunakan prompt komprehensif di bawah ini untuk meminta AI atau meng-generate kode produksi lengkap `Code.gs` pada Google Apps Script yang terhubung ke Google Spreadsheet sebagai database.

---

### 📋 COPY-PASTE PROMPT BERIKUT:

```markdown
Anda adalah seorang Senior Backend Engineer dan Pakar Google Apps Script. 
Tolong buatkan satu file kode `Code.gs` utuh dan siap pakai untuk Google Apps Script (GAS) Web App yang berfungsi sebagai backend API RESTful berbasis JSON dan otomatis mengelola Google Spreadsheet sebagai database.

Pengembangan ini harus mengacu 100% pada Product Requirements Document (PRD) berikut:

---

## 1. PERSYARATAN UTAMA & AKUN TERISOLASI (MULTI-USER ISOLATION)
- **Data Per-Akun Terisolasi Total**: Setiap pengguna (`user_id`) hanya dapat mengakses, menambah, mengubah, dan menghapus data milik mereka sendiri (`Pasien`, `Paket`, dan `Kunjungan`). Tidak boleh ada kebocoran data antar akun pengguna!
- **Auto-Initialization Database**: Buat fungsi `setupDatabase()` yang otomatis memeriksa dan membuat 4 tab/sheet di Google Spreadsheet jika belum ada:
  1. `Users`
  2. `Pasien`
  3. `Paket`
  4. `Kunjungan`

---

## 2. STRUKTUR TABEL & HEADER SHEET

### Tab 1: `Users`
- Header: `user_id`, `username`, `email`, `password_hash`, `created_at`
- Prefix ID: `USR-0001`

### Tab 2: `Pasien`
- Header: `pasien_id`, `user_id`, `nama_pasien`, `no_telp`, `created_at`, `updated_at`
- Prefix ID: `PSN-0001`

### Tab 3: `Paket`
- Header: `paket_id`, `user_id`, `pasien_id`, `total_kunjungan`, `terpakai`, `sisa_kunjungan`, `harga_paket`, `tanggal_beli`, `status_paket`, `created_at`
- Prefix ID: `PKT-0001`
- `status_paket`: `aktif` / `selesai`

### Tab 4: `Kunjungan`
- Header: `kunjungan_id`, `user_id`, `pasien_id`, `paket_id`, `metode_pembayaran`, `tanggal_kunjungan`, `biaya`, `status`, `created_at`, `updated_at`
- Prefix ID: `TRX-0001`
- `metode_pembayaran`: `cash` / `transfer`
- `status`: `menunggu` / `lunas` / `belum bayar`

---

## 3. LOGIKA KODE & FITUR YANG WAJIB DIIMPLEMENTASIKAN

### A. Web App Router (`doGet` & `doPost`) & CORS
- Buat handler `doGet(e)` dan `doPost(e)` yang menerima payload JSON dari request frontend.
- Setiap response wajib menggunakan `ContentService.createTextOutput()` dengan format JSON dan mendukung CORS headers (`Access-Control-Allow-Origin: *`).
- Format response standar:
  ```json
  {
    "success": true,
    "message": "Pesan status",
    "data": { ... }
  }
  ```

### B. Autentikasi Pengguna
1. `registerUser({ username, email, password })`:
   - Cek apakah email sudah terdaftar.
   - Hash password sederhana (misal SHA-256 / Utilities.computeDigest).
   - Generate `user_id` (`USR-XXXX`), simpan ke sheet `Users`.
2. `loginUser({ email, password })`:
   - Verifikasi email & password hash.
   - Kembalikan data user & token session.

### C. Master Data Pasien & Autocomplete
1. `getPasien(user_id, search_query)`:
   - Ambil daftar pasien milik `user_id` tersebut.
   - Jika `search_query` diisi, filter nama pasien secara *case-insensitive*.
2. `createOrGetPasien(user_id, { nama_pasien, no_telp })`:
   - Cek jika nama pasien sudah ada untuk `user_id` ini, gunakan `pasien_id` lama.
   - Jika belum ada, buat entri pasien baru (`PSN-XXXX`).

### D. Manajemen Paket Kunjungan
1. `getPaket(user_id)`:
   - Ambil semua paket milik `user_id`, sertakan detail nama & no telp pasien dari sheet `Pasien`.
2. `createPaket(user_id, { pasien_id, total_kunjungan, harga_paket, tanggal_beli })`:
   - Generate `paket_id` (`PKT-XXXX`).
   - Set `terpakai = 0`, `sisa_kunjungan = total_kunjungan`, `status_paket = 'aktif'`.

### E. Pencatatan Transaksi Kunjungan & Autoupdate Paket
1. `getKunjungan(user_id, filters)`:
   - Ambil data kunjungan milik `user_id`.
   - Dukung filter: `startDate`, `endDate`, `status` (`lunas`, `menunggu`, `belum bayar`), `metode_pembayaran` (`cash`, `transfer`), `searchQuery` (nama pasien / ID), dan `jenisFilter` (`reguler` / `paket`).
2. `createKunjungan(user_id, { pasien_id, paket_id, metode_pembayaran, tanggal_kunjungan, biaya, status })`:
   - Generate `kunjungan_id` (`TRX-XXXX`).
   - **Logika Paket Auto-Deduct**: Jika `paket_id` diisi, cari baris paket di sheet `Paket`, tambahkan `terpakai` + 1, kurangi `sisa_kunjungan` - 1. Jika `sisa_kunjungan` menjadi 0, otomatis ubah `status_paket = 'selesai'`.
3. `updateKunjunganStatus(user_id, { kunjungan_id, status })`:
   - Update kolom `status` pada transaksi tersebut.
4. `updateKunjungan(user_id, kunjungan_data)`:
   - Edit detail data kunjungan.
5. `deleteKunjungan(user_id, kunjungan_id)`:
   - Hapus baris kunjungan milik `user_id` tersebut (jika bagian dari paket, kembalikan `terpakai` - 1 pada paket).

---

## 4. PERSYARATAN KODE
- Kode ditulis bersih, modular, terorganisir, dan berikan komentar penjelasan di setiap fungsi utama.
- Sediakan fungsi `initialSetup()` yang bisa di-run sekali dari editor Apps Script untuk langsung membuat spreadsheet tab & memasukkan data seed awal (demo data) untuk testing.
```
