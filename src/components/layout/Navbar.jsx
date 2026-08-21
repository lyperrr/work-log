import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { Button } from '../ui/button';
import {
  Home,
  PlusCircle,
  Package,
  History,
  Settings,
  LogOut,
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    showToast('Berhasil keluar dari akun', 'success');
  };

  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'paket', label: 'Paket', icon: Package },
    { id: 'catat', label: 'Catat', icon: PlusCircle, isCenter: true },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 glass-nav border-b border-border/60 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <img
              src="/logo-kinesis-corpus.png"
              alt="Logo Kinesis Corpus"
              className="size-9 object-contain rounded-lg"
            />
            <div>
              <h1 className="font-black text-lg md:text-xl text-foreground leading-tight tracking-tight">
                Kinesis Corpus
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                Freelance & Pemasukan Kunjungan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setShowLogoutModal(true)}
                title="Keluar Akun"
              >
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Glass Bottom Navigation Dock */}
      <div className="fixed bottom-3 left-0 right-0 z-40 px-3 pointer-events-none pb-safe">
        <nav className="max-w-2xl w-full mx-auto bg-background rounded-3xl border border-primary/20 shadow-[0_10px_35px_rgba(0,0,0,0.15)] p-1.5 pointer-events-auto transition-all">
          <div className="grid grid-cols-5 gap-1 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              // Center "Catat" Button (Protrudes out slightly upwards with consistent rounded-2xl shape)
              if (item.isCenter) {
                return (
                  <div key={item.id} className="relative flex justify-center items-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`-mt-5 sm:-mt-6 size-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300 touch-btn shadow-glow-primary ${isActive
                        ? 'bg-linear-to-tr from-primary via-primary to-cyan-500 text-white font-black scale-105'
                        : 'bg-linear-to-tr from-primary to-cyan-600 text-white font-black active:scale-95'
                        }`}
                    >
                      <Icon className="size-6 sm:w-7 sm:h-7 stroke-[2.5] drop-shadow-xs" />
                      <span className="text-[10px] font-black tracking-tight leading-none">
                        {item.label}
                      </span>
                    </button>
                  </div>
                );
              }

              // Standard Navigation Items
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 touch-btn ${isActive
                    ? 'bg-primary/15 text-primary font-black scale-102'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    }`}
                >
                  <Icon className={`size-5 sm:w-6 sm:h-6 transition-transform ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-2'}`} />
                  <span className="text-[11px] font-bold tracking-tight text-center line-clamp-1">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar Akun"
        description="Apakah Anda yakin ingin keluar dari aplikasi pencatatan kerja ini?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="destructive"
        icon={LogOut}
      />
    </>
  );
}
