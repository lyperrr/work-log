import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useSettings } from '../context/SettingsContext';
import { FontSizeControl } from '../components/common/FontSizeControl';
import { apiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';

import {
  Settings,
  Database,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Mail,
  LogOut,
  Sparkles,
  Calendar,
  Filter,
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const { hideIncome, toggleHideIncome } = usePrivacy();
  const { dataScope, setDataScope } = useSettings();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    showToast('Berhasil keluar dari akun', 'success');
  };

  const displayName = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)
    : currentUser?.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in-50">

      {/* Header Card */}
      <Card>
        <CardHeader className="border-0 pb-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings className="size-6" />
            </div>
            <div>
              <CardTitle>
                Pengaturan Aplikasi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Profil Pengguna, Aksesibilitas, Privasi, & Backend Data
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
              <div className="size-14 rounded-2xl bg-primary-foreground text-foregorund font-black text-xl flex items-center justify-center shadow-md uppercase shrink-0">
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
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">Tipe Akun</span>
              <span className="font-black text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Freelance & Kunjungan
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Accessibility Control */}
      <FontSizeControl />

      {/* 2. Privacy Mode Control */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          {hideIncome ? <EyeOff className="size-5 text-amber-500" /> : <Eye className="size-5 text-primary" />}
          <CardTitle>Mode Privasi (Sembunyikan Nominal Uang)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Sembunyikan atau tampilkan semua nominal uang & pemasukan di seluruh halaman aplikasi (Berguna saat membuka aplikasi di tempat umum).
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              toggleHideIncome();
              showToast(
                !hideIncome
                  ? 'Mode Privasi Aktif: Nominal pemasukan disembunyikan'
                  : 'Nominal pemasukan ditampilkan kembali',
                'info'
              );
            }}
            className="w-full justify-between font-bold"
          >
            <div className="flex items-center gap-3">
              {hideIncome ? (
                <EyeOff className="size-4 text-amber-500" />
              ) : (
                <Eye className="size-4 text-primary" />
              )}
              <span>{hideIncome ? 'Mode Privasi: AKTIF' : 'Mode Privasi: NONAKTIF'}</span>
            </div>

            <Badge variant={hideIncome ? 'warning' : 'default'} className="font-mono">
              {hideIncome ? '••••••' : 'Rp (Ditampilkan)'}
            </Badge>
          </Button>
        </CardContent>
      </Card>
      {/* 2. Rentang Tampilan Data (Data Scope Filter) */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Calendar className="size-5 text-primary" />
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
          <span>Work Log - v1.0</span>
        </div>
      </div>

    </div>
  );
}

