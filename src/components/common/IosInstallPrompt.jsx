import { useState } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isDismissed = localStorage.getItem('ios_pwa_prompt_dismissed');
    return Boolean(isIos && !isStandalone && !isDismissed);
  });

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios_pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 sm:p-5 my-4 relative shadow-sm animate-in fade-in-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground size-8"
        title="Tutup petunjuk"
      >
        <X className="size-4" />
      </Button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Smartphone className="size-5" />
        </div>
        <div className="space-y-2">
          <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
            Pasang Aplikasi di Home Screen iPhone
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
            Buka website di Safari, lalu ikuti langkah ini untuk pengalaman aplikasi penuh:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-foreground">
            <span className="inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border shadow-2xs">
              1. Tekan tombol Share <Share className="size-3.5 text-primary shrink-0" />
            </span>
            <span className="inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border shadow-2xs">
              2. Pilih <PlusSquare className="size-3.5 text-primary shrink-0" /> Tambah ke Utama
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
