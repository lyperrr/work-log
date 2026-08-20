import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Type } from 'lucide-react';

export function FontSizeControl() {
  const { fontSize, setFontSize, FONT_SIZES } = useAccessibility();

  return (
    <div className="bg-card p-4 rounded-2xl border-2 border-primary/20 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-foreground font-bold text-base">
        <Type className="size-5 text-primary shrink-0" />
        <span>Ukuran Teks Tampilan (Aksesibilitas)</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Sesuaikan ukuran tulisan agar mudah dibaca oleh orang tua / lansia.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FONT_SIZES.map((item) => {
          const isActive = fontSize === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFontSize(item.id)}
              className={`px-3 py-3 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-1 touch-btn ${isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                : 'bg-background text-foreground border-input hover:border-primary/50'
                }`}
            >
              <span className="text-lg font-black">{item.scaleText}</span>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
