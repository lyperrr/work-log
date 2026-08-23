import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { PrivacyAmount, PrivacyPeekButton } from './PrivacyAmount';
import { ConfirmModal } from './ConfirmModal';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  CreditCard,
  Calendar,
  Phone,
  Package,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
} from 'lucide-react';

export function KunjunganCard({
  item,
  showPatientName = true,
  isRevealed = false,
  onTogglePeek,
  updatingId,
  pendingStatus = {},
  onUpdateStatus,
  onEdit,
  onDelete,
}) {
  const [confirmStatusTarget, setConfirmStatusTarget] = useState(null);

  const isUpdatingThis = updatingId === item.kunjungan_id;
  const rawStatus = (item.status || '').toLowerCase().trim();
  const effectiveStatus =
    isUpdatingThis && pendingStatus[item.kunjungan_id]
      ? (pendingStatus[item.kunjungan_id] || '').toLowerCase().trim()
      : rawStatus;

  const effLunas = effectiveStatus === 'lunas';
  const effMenunggu = effectiveStatus === 'menunggu';
  const effBelum = !effLunas && !effMenunggu;

  const formattedDate = item.tanggal_kunjungan
    ? String(item.tanggal_kunjungan).split('T')[0]
    : '-';

  const btnBase =
    'relative py-2.5 px-1 rounded-xl text-xs sm:text-sm font-black text-center flex items-center justify-center gap-1.5 transition-all duration-300 whitespace-nowrap';

  return (
    <div className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5 overflow-hidden">
      {/* ─── Header: Patient Info (Optional) & Method Badge ─── */}
      {showPatientName ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
              {(item.nama_pasien || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                  {item.kunjungan_id}
                </span>
                {item.info_paket && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary font-bold text-[10px]">
                    <Package className="w-3 h-3" />
                    {item.info_paket}
                  </Badge>
                )}
              </div>

              {/* Popover untuk melihat nama pasien lengkap saat terpotong (clamp/truncate) */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-left w-full mt-0.5 group/name focus:outline-none"
                    title={item.nama_pasien}
                  >
                    <h3 className="text-base font-bold text-foreground truncate group-hover/name:text-primary transition-colors">
                      {item.nama_pasien}
                    </h3>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  className="w-auto max-w-[280px] sm:max-w-xs p-3.5 rounded-2xl shadow-xl border-2 border-primary/30 bg-card z-50 animate-in fade-in-50 zoom-in-95"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                      <User className="size-3.5" />
                      <span>Nama Lengkap Pasien</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-foreground break-words leading-snug">
                      {item.nama_pasien}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Badge variant="outline" className="capitalize font-bold text-xs tracking-wider shrink-0 bg-background">
            <CreditCard className="w-3 h-3 text-primary" />
            {item.metode_pembayaran === 'transfer' ? 'Transfer Bank' : 'Cash (Tunai)'}
          </Badge>
        </div>
      ) : (
        /* Header when Patient Name is hidden (e.g. in Paket Drawer) */
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
              {item.kunjungan_id}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Calendar className="size-3.5 text-primary shrink-0" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium capitalize">
              <CreditCard className="size-3.5 text-primary shrink-0" />
              {item.metode_pembayaran === 'transfer' ? 'Transfer Bank' : 'Cash (Tunai)'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PrivacyAmount
              amount={item.paket_id ? 0 : item.biaya}
              isRevealed={isRevealed}
              onToggle={onTogglePeek}
              className="text-base font-black text-primary tracking-tight"
            />
          </div>
        </div>
      )}

      {/* ─── Biaya Highlight Bar (Only shown when patient name is visible) ─── */}
      {showPatientName && (
        <div
          onClick={onTogglePeek}
          className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-secondary/60 hover:bg-secondary/90 border border-border/60 cursor-pointer select-none transition-all group/biaya"
          title="Klik untuk melihat/menyembunyikan biaya"
        >
          <div className="flex items-center gap-2">
            <PrivacyPeekButton isRevealed={isRevealed} onToggle={onTogglePeek} />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover/biaya:text-foreground">
              {item.paket_id ? 'Biaya Sesi Paket:' : 'Biaya:'}
            </span>
          </div>
          <PrivacyAmount
            amount={item.paket_id ? 0 : item.biaya}
            isRevealed={isRevealed}
            onToggle={onTogglePeek}
            className="text-lg sm:text-xl font-black text-primary tracking-tight"
          />
        </div>
      )}

      {/* ─── Phone & Date Info (Only shown when patient name is visible) ─── */}
      {showPatientName && (
        <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-foreground font-medium px-1 gap-2 border-t border-border/40 pt-2.5">
          <span className="flex items-center gap-1.5">
            <Phone className="size-4 text-primary shrink-0" />
            <strong className="font-bold text-foreground">No. Telp:</strong>
            {item.no_telp ? (
              <a
                href={`https://wa.me/${String(item.no_telp).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
                title="Hubungi via WhatsApp"
              >
                {item.no_telp}
              </a>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4 text-primary shrink-0" />
            <strong className="font-bold text-foreground">Tgl Kunjungan:</strong>
            <span className="text-foreground/90 font-semibold">{formattedDate}</span>
          </span>
        </div>
      )}

      {/* ─── Status Toggle Section ─── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wide">Status Pembayaran:</span>
          <Badge
            variant={effLunas ? 'success' : effMenunggu ? 'warning' : 'destructive'}
            className="capitalize text-xs sm:text-sm font-black px-2.5 py-0.5"
          >
            {effLunas ? (
              <span className="flex items-center gap-1">
                <Lock className="size-3 shrink-0" /> lunas (selesai)
              </span>
            ) : (
              effectiveStatus
            )}
          </Badge>
        </div>

        {effLunas ? (
          /* Status LUNAS: Locked & Disabled (Cannot be edited) */
          <div className="p-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm select-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
              <span>Pembayaran Lunas (Selesai)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
              <Lock className="size-3.5 shrink-0" />
              <span>Terkunci</span>
            </div>
          </div>
        ) : (
          /* 3-Button Toggle Segment with Confirmation Prompt */
          <div className="grid grid-cols-3 gap-1.5 bg-secondary/90 p-0.5 rounded-2xl border-2 border-border/80">
            {/* Menunggu */}
            <button
              type="button"
              disabled={Boolean(updatingId) || effMenunggu}
              onClick={() => {
                if (effMenunggu) return;
                setConfirmStatusTarget('menunggu');
              }}
              className={`${btnBase} ${effMenunggu
                  ? isUpdatingThis
                    ? 'bg-amber-500 text-white shadow-sm animate-pulse cursor-default'
                    : 'bg-amber-500 text-white shadow-sm cursor-default'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background hover:border-border border border-transparent cursor-pointer shadow-none bg-transparent'
                }`}
            >
              {isUpdatingThis && effMenunggu ? (
                <Spinner className="size-5 sm:size-4" />
              ) : (
                <span className='inline-flex items-center gap-0.5'>
                  <Clock className="size-3 sm:size-4 shrink-0" /> Menunggu
                </span>
              )}
            </button>

            {/* Lunas */}
            <button
              type="button"
              disabled={Boolean(updatingId) || effLunas}
              onClick={() => {
                if (effLunas) return;
                setConfirmStatusTarget('lunas');
              }}
              className={`${btnBase} ${effLunas
                  ? isUpdatingThis
                    ? 'bg-emerald-600 text-white shadow-sm animate-pulse cursor-default'
                    : 'bg-emerald-600 text-white shadow-sm cursor-default'
                : 'text-muted-foreground hover:text-foreground hover:bg-background hover:border-border border border-transparent cursor-pointer shadow-none bg-transparent'
                }`}
            >
              {isUpdatingThis && effLunas ? (
                <Spinner className="size-5 sm:size-4" />
              ) : (
                <span className='inline-flex items-center gap-0.5'>
                  <CheckCircle2 className="size-3 sm:size-4 shrink-0" /> Lunas
                </span>
              )}
            </button>

            {/* Belum Bayar */}
            <button
              type="button"
              disabled={Boolean(updatingId) || effBelum}
              onClick={() => {
                if (effBelum) return;
                setConfirmStatusTarget('belum bayar');
              }}
              className={`${btnBase} ${effBelum
                  ? isUpdatingThis
                    ? 'bg-rose-600 text-white shadow-sm animate-pulse cursor-default'
                    : 'bg-rose-600 text-white shadow-sm cursor-default'
                : 'text-muted-foreground hover:text-foreground hover:bg-background hover:border-border border border-transparent cursor-pointer shadow-none bg-transparent'
                }`}
            >
              {isUpdatingThis && effBelum ? (
                <Spinner className="size-5 sm:size-4" />
              ) : (
                <span className='inline-flex items-center gap-0.5'>
                  <AlertCircle className="size-3 sm:size-4 shrink-0" /> Belum Bayar
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmStatusTarget)}
        onClose={() => setConfirmStatusTarget(null)}
        onConfirm={() => {
          if (onUpdateStatus && confirmStatusTarget) {
            onUpdateStatus(item.kunjungan_id, confirmStatusTarget);
          }
          setConfirmStatusTarget(null);
        }}
        title="Konfirmasi Perubahan Status"
        description={`Apakah Anda yakin ingin mengubah status pembayaran ${
          item.nama_pasien ? `pasien "${item.nama_pasien}"` : `kunjungan (${item.kunjungan_id})`
        } dari "${effectiveStatus}" menjadi "${confirmStatusTarget}"?${
          confirmStatusTarget === 'lunas'
            ? ' Perhatian: Status yang sudah diubah menjadi Lunas akan dikunci & tidak dapat diubah lagi.'
            : ''
        }`}
        confirmText="Ya, Ubah Status"
        cancelText="Batal"
        variant={confirmStatusTarget === 'lunas' ? 'primary' : 'primary'}
        icon={confirmStatusTarget === 'lunas' ? CheckCircle2 : Clock}
        isLoading={isUpdatingThis}
      />

      {/* ─── Optional Actions (Edit / Delete) ─── */}
      {(onEdit || onDelete) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              disabled={effLunas}
              onClick={() => !effLunas && onEdit(item)}
              title={effLunas ? 'Data kunjungan berstatus Lunas dianggap selesai & tidak dapat di-edit' : 'Edit Data'}
              className={`w-full text-sm font-bold py-2 border-border/80 flex items-center justify-center gap-1.5 ${
                effLunas ? 'opacity-50 cursor-not-allowed bg-secondary/40 text-muted-foreground' : 'hover:bg-secondary'
              }`}
            >
              {effLunas ? (
                <Lock className="size-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Edit className="size-3.5 text-primary shrink-0" />
              )}
              Edit Data
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(item.kunjungan_id)}
              className="w-full text-sm font-bold py-2 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="size-3.5" />
              Hapus
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
