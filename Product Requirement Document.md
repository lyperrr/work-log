# Product Requirements Document (PRD)
## Aplikasi Pencatatan Kerja Freelance & Pemasukan Kunjungan

| | |
|---|---|
| **Nama Proyek** | Aplikasi Pencatatan Kunjungan & Pemasukan Freelance |
| **Versi Dokumen** | 2.0 (Updated & Synchronized) |
| **Tanggal** | 20 Agustus 2026 |
| **Platform** | Web App (Vite React + TailwindCSS + shadcn UI, Backend: Google Apps Script + Google Sheets) |
| **Target Pengguna** | Freelancer (Termasuk Orang Tua / Senior / Lansia) |

---

## 1. Latar Belakang & Tujuan

Pengguna bekerja secara freelance dengan melakukan kunjungan pasien (kunjungan berbayar) dan menawarkan **paket kunjungan** (misalnya 5x atau 10x kunjungan sekaligus dengan jadwal fleksibel yang dapat ditentukan klien sewaktu-waktu).

**Tujuan Aplikasi:**
1. **Pencatatan Terisolasi (Multi-User Data Isolation)**: Setiap akun pengguna mengelola data pasien, paket, dan kunjungannya masing-masing secara privat dan terpisah tanpa ada kebocoran data antar akun.
2. **Keamanan & Mode Privasi (Privacy Mode)**: Kemampuan menyembunyikan nominal uang/pemasukan di tempat umum dengan mode privasi global serta tombol peek 1-by-1 per kartu (*clickable biaya box*).
3. **Pencatatan Kunjungan & Paket Fleksibel**: Mendukung pencatatan kunjungan reguler dan pemakaian jatah paket kunjungan tanpa keterikatan jadwal kaku.
4. **Kalkulator Simulasi Paket**: Alat bantu kalkulasi harga per sesi dan estimasi nilai paket secara langsung.
5. **UI/UX Ergonomis & Accessibility**: Pengaturan ukuran huruf (normal, besar, sangat besar, ekstra besar), navigasi bottom dock melayang, serta ukuran tombol/kartu yang proporsional dan ramah lansia.

---

## 2. Ruang Lingkup (Scope)

### 2.1 Termasuk (In-Scope)
- **Autentikasi & Multi-User Isolation**: Login, Register, Logout dengan modal konfirmasi, serta isolasi data per `user_id`.
- **Master Data Pasien**: Autocomplete nama pasien dengan reuse `pasien_id` per akun user.
- **Pencatatan Kunjungan**: Tambah, lihat, edit, hapus kunjungan reguler maupun dari paket.
- **Manajemen Paket Kunjungan**: Pembuatan paket baru, kalkulator simulasi paket, tracking sisa kunjungan, dan status otomatis (`aktif` / `selesai`).
- **Dashboard Ringkasan & Grafik**: Pemasukan hari ini, minggu ini, bulan ini, serta grafik visual Recharts.
- **Mode Privasi (Income Masking)**: Sakelar Mode Privasi global + tombol peek mata 1-per-1 pada tiap kartu kunjungan/paket/pemasukan (*clickable biaya bar*).
- **Filter & Pencarian Lanjutan**: Filter nama pasien, status pembayaran (`lunas`, `menunggu`, `belum bayar`), metode pembayaran (`cash`, `transfer`), dan jenis transaksi.
- **Profil Pengguna & Pengaturan**: Kartu profil pengguna di menu Settings, konfigurasi URL Google Apps Script Web App, kontrol ukuran teks (accessibility), dan reset data simulasi.

---

## 3. Architecture & Tech Stack

| Layer | Teknologi | Deskripsi |
|---|---|---|
| **Frontend** | React 19 + Vite + TailwindCSS v4 | SPA ultra-cepat, responsive, dan mobile-first |
| **UI Library** | shadcn/ui + Lucide Icons | Base components (`Button`, `Card`, `Badge`, `Alert`, `Input`, `Select`, `DatePicker`, `ConfirmModal`) |
| **Backend & Storage** | Google Apps Script (Web App) + Google Sheets | Integrasi REST API (`doGet` / `doPost`) + LocalStorage fallback untuk simulasi offline |
| **Keamanan & Isolasi** | `user_id` Ownership Filter | Semua query database memfilter data berdasarkan `user_id` milik akun yang sedang login |

---

## 4. Struktur Data & Multi-User Isolation Schema

Setiap entri data terikat pada **`user_id`** pemilik akun untuk menjamin bahwa data antar akun terisolasi 100% dan tidak bocor ke akun lain.

### 4.1 Sheet: `Users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | string (unik) | Primary key, format `USR-0001` |
| `username` | string | Wajib, nama pengguna |
| `email` | string | Wajib, unik |
| `password_hash` | string | Password ter-hash |
| `created_at` | datetime | Timestamp pembuatan akun |

### 4.2 Sheet: `Pasien` (Master Data Per Akun)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `pasien_id` | string (unik) | Primary key, format `PSN-0001` |
| `user_id` | string (FK → Users) | **Isolasi Data**: Pemilik akun master pasien ini |
| `nama_pasien` | string | Wajib |
| `no_telp` | string | Wajib |
| `created_at` | datetime | Timestamp otomatis |
| `updated_at` | datetime | Timestamp pembaruan |

### 4.3 Sheet: `Paket`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `paket_id` | string (unik) | Primary key, format `PKT-0001` |
| `user_id` | string (FK → Users) | **Isolasi Data**: Pemilik akun paket |
| `pasien_id` | string (FK → Pasien) | Wajib, mengacu ke master pasien akun tsb |
| `total_kunjungan` | number | Jumlah jatah kunjungan (misal 5) |
| `terpakai` | number | Bertambah otomatis tiap jatah digunakan |
| `sisa_kunjungan` | number (computed) | `total_kunjungan - terpakai` |
| `harga_paket` | number | Total harga paket |
| `tanggal_beli` | date | Tanggal transaksi paket |
| `status_paket` | enum | `aktif`, `selesai` (otomatis `selesai` jika sisa = 0) |

### 4.4 Sheet: `Kunjungan` (Transaksi Utama)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `kunjungan_id` | string (unik) | Primary key, format `TRX-0001` |
| `user_id` | string (FK → Users) | **Isolasi Data**: Pemilik akun transaksi |
| `pasien_id` | string (FK → Pasien) | Wajib |
| `paket_id` | string (FK, nullable) | Diisi jika bagian dari paket; null jika reguler |
| `metode_pembayaran` | enum | `cash`, `transfer` |
| `tanggal_kunjungan` | date | Tanggal pelaksanaan kunjungan |
| `biaya` | number | Nominal transaksi (diisi 0 jika dari paket) |
| `status` | enum | `menunggu`, `lunas`, `belum bayar` |
| `created_at` | datetime | Timestamp pembuatan |

---

## 5. Fitur Utama & Functional Requirements

### 5.1 Autentikasi & Isolasi Data Akun
- **FR-1**: User dapat mendaftar (Register) dan masuk (Login) dengan email & password.
- **FR-2 (Privasi Data Per-Akun)**: Seluruh data Pasien, Paket, dan Kunjungan dipilah berdasarkan `user_id`. Pengguna A **tidak dapat melihat atau mengakses** data milik Pengguna B.
- **FR-3**: Logout dilengkapi dengan `ConfirmModal` konfirmasi untuk keamanan pengguna.

### 5.2 Mode Privasi (Sembunyikan Nominal Uang)
- **FR-4**: Sakelar **Mode Privasi** di Pengaturan & Beranda untuk menyembunyikan semua nominal (`Rp ••••••`).
- **FR-5**: **Tombol Peek 1-per-1 (`PrivacyPeekButton`)** di setiap kartu (Dashboard, Paket, Riwayat) memungkinkan mengintip nominal secara independen tanpa menggeser tata letak kartu (*no layout shift*).
- **FR-6**: **Kotak Biaya Klik-Langsung (*Clickable Biaya Box*)**: Pengguna dapat mengklik mana saja di area kotak `Biaya:` untuk menampilkan/menyembunyikan angka biaya.

### 5.3 Master Data Pasien & Autocomplete
- **FR-7**: Dropdown autocomplete pencarian nama pasien saat menginput kunjungan atau paket.
- **FR-8**: Jika memilih pasien lama, nomor telepon otomatis terisi dan `pasien_id` lama dipakai kembali.

### 5.4 Pencatatan Kunjungan & Paket
- **FR-9**: Pencatatan kunjungan reguler (biaya default Rp 300.000) dan kunjungan dari paket aktif.
- **FR-10**: Pemakaian jatah paket otomatis mengurangi `sisa_kunjungan` dan mengubah status ke `selesai` saat sisa = 0.
- **FR-11**: Fitur **Kalkulator Simulasi Paket** interaktif di menu Paket untuk menghitung nilai per sesi & hemat biaya.

### 5.5 Layout Responsif & Informasi Jelas (Mobile-First)
- **FR-12**: Tata letak kartu transaksi yang rapi dengan keterangan label yang eksplisit:
  - `Metode: CASH / Transfer`
  - `Biaya: Rp ...` (kotak khusus yang dapat diklik)
  - `No. Telp: ...` dan `Tgl Kunjungan: ...` (dengan ukuran teks yang jelas & lega)
  - `Status Pembayaran: [ Lunas / Menunggu / Belum Bayar ]`
- **FR-13**: Aksesibilitas ukuran huruf (Kecil, Sedang, Besar, Ekstra Besar) tersimpan sebagai preferensi.

---

## 6. Prinsip Desain & Komponen UI (shadcn/ui)

- **Ukuran Komponen Proporsional**: Menggunakan ukuran default yang pas (`h-9` / `h-10` untuk tombol, `32x32px` untuk icon button) tanpa tombol raksasa yang mengganggu.
- **Component-Driven Styling**: Gaya visual dikendalikan penuh dari file komponen dasar (`Button.jsx`, `Card.jsx`, `Badge.jsx`, `Alert.jsx`, `DatePicker.jsx`).
- **Warna Identitas**: Primary `oklch(0.52 0.105 223.128)` dengan aksen status yang jelas:
  - `lunas` → Hijau (`success`)
  - `menunggu` → Kuning/Oranye (`warning`)
  - `belum bayar` → Merah (`destructive`)