import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useSettings } from '../context/SettingsContext';
import { FontSizeControl } from '../components/common/FontSizeControl';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

import {
  Settings,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Mail,
  LogOut,
  Sparkles,
  Calendar,
  FileText,
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const { hideIncome, toggleHideIncome } = usePrivacy();
  const { dataScope, setDataScope, kopSurat, setKopSurat } = useSettings();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [tempKop, setTempKop] = useState(kopSurat);

  const handleSaveKop = (e) => {
    e.preventDefault();
    setKopSurat(tempKop);
    showToast('Pengaturan KOP Surat berhasil disimpan!', 'success');
  };

  const handleConfirmLogout = () => {
    logout();
    showToast('Berhasil keluar dari akun', 'success');
  };

  const displayName = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)
    : currentUser?.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto pb-24 sm:pb-8 animate-in fade-in-50">

      {/* Header Card */}
      <Card>
        <CardHeader className="border-0 pb-0">
          <div className="flex items-center gap-3">
            <Settings className="size-6 shrink-0 text-primary" />
            <div>
              <CardTitle>
                Pengaturan Aplikasi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Profil Pengguna, Aksesibilitas, KOP Surat PDF, &amp; Backend Data
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 0. Profil Pengguna (User Profile Card) */}
      <Card className="p-0!">
        <CardHeader className="bg-primary p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-primary-foreground text-foreground font-black text-xl flex items-center justify-center shadow-md uppercase shrink-0">
                {(currentUser?.username || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  {displayName}
                  <Badge variant="success" className="bg-emerald-600 text-white">
                    Aktif
                  </Badge>
                </h3>
                <p className="text-xs md:text-sm text-white font-medium flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-white" />
                  {currentUser?.email || 'Belum terhubung email'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowLogoutModal(true)}
              className="shrink-0 bg-destructive text-white hover:bg-destructive/80"
            >
              <LogOut className="size-4" />
              Keluar Akun
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-3 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-secondary/50 p-3 rounded-2xl border border-border/60">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Nama Pengguna</span>
              <span className="font-black text-foreground flex items-center gap-2">
                <User className="size-4 text-primary" />
                {currentUser?.username || '-'}
              </span>
            </div>
            <div className="bg-secondary/50 p-3 rounded-2xl border border-border/60">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Role Akses</span>
              <span className="font-black text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                {currentUser?.role || 'Admin'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Pengaturan KOP Surat Laporan PDF */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <FileText className="size-5 shrink-0 text-primary" />
          <CardTitle>Pengaturan KOP Surat Laporan PDF</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveKop} className="space-y-4">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              Informasi KOP Surat ini akan otomatis tercetak di bagian atas Laporan Keuangan PDF &amp; Rekap Kunjungan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Nama Klinik / Praktik</label>
                <Input
                  value={tempKop.namaKlinik}
                  onChange={(e) => setTempKop({ ...tempKop, namaKlinik: e.target.value })}
                  placeholder="Contoh: KLINIK FISIOTERAPI SEHAT"
                  className="font-bold text-xs h-11"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Sub-judul / Spesialisasi</label>
                <Input
                  value={tempKop.subKlinik}
                  onChange={(e) => setTempKop({ ...tempKop, subKlinik: e.target.value })}
                  placeholder="Contoh: Layanan Kesehatan & Fisioterapi"
                  className="text-xs h-11"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Alamat Lengkap</label>
              <Input
                value={tempKop.alamatKlinik}
                onChange={(e) => setTempKop({ ...tempKop, alamatKlinik: e.target.value })}
                placeholder="Alamat Lengkap Klinik"
                className="text-xs h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">No. Telp / WA / Email</label>
                <Input
                  value={tempKop.kontakKlinik}
                  onChange={(e) => setTempKop({ ...tempKop, kontakKlinik: e.target.value })}
                  placeholder="Telp/WA: 0812..."
                  className="text-xs h-11"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Kota Penerbit</label>
                <Input
                  value={tempKop.kotaPenerbit}
                  onChange={(e) => setTempKop({ ...tempKop, kotaPenerbit: e.target.value })}
                  placeholder="Contoh: Jakarta"
                  className="text-xs h-11"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Penanggung Jawab (User Logged In)</label>
                <div className="h-11 px-3.5 bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-input flex items-center gap-2">
                  <User className="size-4 text-primary shrink-0" />
                  <span className="truncate">{displayName} (Otomatis dari Akun Active)</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto font-bold">
              Simpan Pengaturan KOP Surat
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Ukuran Teks Aksesibilitas (Elderly Accessibility Card) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <CardTitle>Ukuran Teks Aplikasi (Aksesibilitas)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Sesuaikan ukuran tulisan agar lebih mudah dibaca untuk usia lanjut atau pengguna yang membutuhkan tampilan teks lebih besar.
          </p>

          <FontSizeControl />
        </CardContent>
      </Card>

      {/* 3. Mode Privasi (Privacy Mode Card) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <CardTitle>Mode Privasi Pemasukan</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Sembunyikan nominal rupiah di dashboard dan kartu kunjungan saat layar dilihat orang lain di tempat umum.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={toggleHideIncome}
            className="w-full justify-between font-bold h-12"
          >
            <div className="flex items-center gap-2">
              {hideIncome ? <EyeOff className="size-5 text-amber-500" /> : <Eye className="size-5 text-primary" />}
              <span>{hideIncome ? 'AKTIF' : 'NONAKTIF'}</span>
            </div>

            <Badge variant={hideIncome ? 'warning' : 'default'} className="font-mono">
              {hideIncome ? 'Rp (Tidak Terlihat)' : 'Rp (Terlihat)'}
            </Badge>
          </Button>
        </CardContent>
      </Card>

      {/* 4. Rentang Tampilan Data (Data Scope Filter) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Calendar className="size-5 shrink-0 text-primary" />
          <CardTitle>Rentang Tampilan Data (Reset Tiap Bulan)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Pilih apakah aplikasi hanya menampilkan data transaksi di bulan saat ini (otomatis di-reset setiap bulan baru) atau menampilkan seluruh data historis dari bulan-bulan sebelumnya.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDataScope('current_month');
                showToast('Mode Tampilan: Bulan Saat Ini Saja (Default)', 'info');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${dataScope === 'current_month'
                ? 'border-primary bg-primary/10 shadow-xs'
                : 'border-border bg-card hover:bg-secondary/60'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-foreground">Bulan Saat Ini Saja</span>
                <Badge variant={dataScope === 'current_month' ? 'default' : 'outline'}>
                  {dataScope === 'current_month' ? 'Aktif (Default)' : 'Pilih'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Hanya menampilkan data bulan berjalan. Data di-reset visual setiap pergantian bulan.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setDataScope('all_time');
                showToast('Mode Tampilan: Semua Bulan (Historis)', 'info');
              }}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${dataScope === 'all_time'
                ? 'border-primary bg-primary/10 shadow-xs'
                : 'border-border bg-card hover:bg-secondary/60'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-foreground">Semua Bulan (Historis)</span>
                <Badge variant={dataScope === 'all_time' ? 'default' : 'outline'}>
                  {dataScope === 'all_time' ? 'Aktif' : 'Pilih'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Menampilkan seluruh riwayat transaksi dari bulan-bulan sebelumnya.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Keluar dari Akun"
        description="Apakah Anda yakin ingin keluar dari akun ini?"
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
        variant="destructive"
        icon={LogOut}
      />

      {/* PRD Compliance Card */}
      <div className="bg-secondary/40 border border-border rounded-3xl p-4 text-center text-xs text-muted-foreground space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-bold text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          <span>Rekap Kerja - v1.6</span>
        </div>
      </div>

    </div>
  );
}
