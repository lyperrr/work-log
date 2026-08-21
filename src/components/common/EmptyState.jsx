import { Button } from '../ui/button';
import {
  SearchX,
  FolderOpen,
  Package,
  History,
  UserX,
  FilterX,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';

const PRESET_ICONS = {
  search: SearchX,
  'no-data': FolderOpen,
  paket: Package,
  riwayat: History,
  pasien: UserX,
  filter: FilterX,
};

const PRESET_TITLES = {
  search: 'Hasil Pencarian Tidak Ditemukan',
  'no-data': 'Belum Ada Data',
  paket: 'Belum Ada Paket Kunjungan',
  riwayat: 'Belum Ada Riwayat Kunjungan',
  pasien: 'Pasien Tidak Ditemukan',
  filter: 'Tidak Ada Data Ditemukan',
};

const PRESET_DESCRIPTIONS = {
  search: 'Tidak ada data yang cocok dengan kriteria pencarian atau filter Anda.',
  'no-data': 'Belum ada data yang tersimpan saat ini.',
  paket: 'Belum ada paket kunjungan yang didaftarkan.',
  riwayat: 'Belum ada transaksi atau sesi kunjungan pasien yang dicatat.',
  pasien: 'Nama pasien tidak ditemukan di dalam basis data.',
  filter: 'Coba ubah atau atur ulang kata kunci pencarian dan filter Anda.',
};

/**
 * Reusable & Versatile EmptyState Component.
 *
 * Props:
 * @param {'search' | 'no-data' | 'paket' | 'riwayat' | 'pasien' | 'filter'} [type='no-data'] Preset type
 * @param {string} [title] Custom title override
 * @param {string} [description] Custom description override
 * @param {string} [query] Search query string (used for search type message)
 * @param {React.ComponentType | React.ReactNode} [icon] Custom icon override
 * @param {Function} [onReset] Callback for "Reset Filter" button
 * @param {Object | React.ReactNode} [action] Action button config `{ label, onClick, icon: IconComponent }` or ReactNode
 * @param {'card' | 'simple' | 'borderless'} [variant='card'] Layout wrapper style
 * @param {string} [className] Extra container CSS classes
 */
export function EmptyState({
  type = 'no-data',
  title,
  description,
  query,
  icon,
  onReset,
  action,
  variant = 'card',
  className = '',
}) {
  // Determine Icon component
  const IconComp = icon || PRESET_ICONS[type] || FolderOpen;

  // Determine Title & Description
  const displayTitle = title || PRESET_TITLES[type] || 'Data Kosong';

  let displayDesc = description || PRESET_DESCRIPTIONS[type] || '';
  if (type === 'search' && query && !description) {
    displayDesc = `Tidak ditemukan hasil yang cocok untuk kata kunci "${query}". Coba periksa ejaan atau atur ulang filter.`;
  }

  const containerClasses =
    variant === 'card'
      ? 'bg-card border-2 border-dashed border-border/80 rounded-3xl p-8 sm:p-12 text-center shadow-xs'
      : variant === 'simple'
      ? 'p-6 sm:p-8 text-center bg-secondary/30 rounded-2xl border border-border/60'
      : 'p-6 text-center';

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses} ${className}`}>
      {/* Icon Badge */}
      <div className="size-16 sm:size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs animate-in zoom-in-95 duration-200">
        {typeof IconComp === 'function' || typeof IconComp === 'object' ? (
          <IconComp className="size-8 sm:size-10 stroke-[2]" />
        ) : (
          IconComp
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-black text-foreground max-w-md leading-snug">
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDesc && (
        <p className="text-sm text-muted-foreground font-medium max-w-sm mt-1.5 leading-relaxed">
          {displayDesc}
        </p>
      )}

      {/* Action Buttons */}
      {(onReset || action) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {onReset && (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl border-border hover:bg-secondary flex items-center gap-2"
            >
              <RotateCcw className="size-4 text-primary" />
              Reset Filter &amp; Cari
            </Button>
          )}

          {action && (
            typeof action === 'object' && action.label ? (
              <Button
                type="button"
                onClick={action.onClick}
                className="font-black text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2"
              >
                {action.icon ? (
                  <action.icon className="size-4" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                {action.label}
              </Button>
            ) : (
              action
            )
          )}
        </div>
      )}
    </div>
  );
}
