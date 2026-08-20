import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
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
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const { hideIncome, toggleHideIncome } = usePrivacy();
  const [gasUrl, setGasUrl] = useState(apiService.getGasUrl());
  const [savedMsg, setSavedMsg] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSaveGasUrl = (e) => {
    e.preventDefault();
    apiService.setGasUrl(gasUrl.trim());
    setSavedMsg('URL Google Apps Script Web App berhasil disimpan!');
    showToast('Konfigurasi backend berhasil disimpan', 'success');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleConfirmResetData = () => {
    try {
      apiService.resetData();
      showToast('Data berhasil di-reset ke data bawaan awal', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Gagal melakukan reset data', 'error');
    }
  };

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
        <CardHeader>
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
      <Card>
        <CardHeader className="bg-linear-to-r from-primary/10 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-2xl bg-linear-to-tr from-primary to-cyan-600 text-white font-black text-xl flex items-center justify-center shadow-md uppercase shrink-0">
                {(currentUser?.username || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                  {displayName}
                  <Badge variant="success">
                    Aktif
                  </Badge>
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-primary" />
                  {currentUser?.email || 'Belum terhubung email'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowLogoutModal(true)}
              className="shrink-0"
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

      {/* 2. Google Apps Script Integration */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <LinkIcon className="size-5 text-primary" />
          <CardTitle>Integrasi Google Apps Script (Backend)</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Aplikasi ini dirancang untuk dapat terhubung langsung ke Google Sheets & Google Apps Script Web App (`doGet`/`doPost`).
          </p>

          {savedMsg && (
            <Alert className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <AlertDescription className="font-bold text-sm">
                {savedMsg}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSaveGasUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">
                Google Apps Script Web App URL
              </label>
              <Input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="font-mono text-sm touch-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-bold"
            >
              Simpan Konfigurasi Backend
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Database Reset */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Database className="size-5 text-primary" />
          <CardTitle>Kelola Data Simulasi</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Jika Anda ingin mengembalikan data aplikasi ke data bawaan awal (Users, Pasien, Paket, Kunjungan).
          </p>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowResetModal(true)}
            className="w-full font-bold"
          >
            <RefreshCw className="size-4" />
            Reset Data ke Seed Awal
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmResetData}
        title="Reset Seluruh Data"
        description="Apakah Anda yakin ingin mereset seluruh data simulasi ke data awal? Seluruh perubahan lokal akan terhapus."
        confirmText="Ya, Reset Data"
        cancelText="Batal"
        variant="destructive"
        icon={RefreshCw}
      />

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
          <span>Sesuai Spesifikasi PRD v1.0</span>
        </div>
        <p>Warna Utama: oklch(0.52 0.105 223.128) • Mobile First Elderly Ready</p>
      </div>

    </div>
  );
}

