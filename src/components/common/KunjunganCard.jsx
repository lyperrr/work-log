import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { PrivacyAmount, PrivacyPeekButton } from './PrivacyAmount';
import {
  CreditCard,
  Calendar,
  Phone,
  Package,
  Edit,
  Trash2,
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
  const isUpdatingThis = updatingId === item.kunjungan_id;
  const effectiveStatus =
    isUpdatingThis && pendingStatus[item.kunjungan_id]
      ? pendingStatus[item.kunjungan_id]
      : item.status;

  const effLunas = effectiveStatus === 'lunas';
  const effMenunggu = effectiveStatus === 'menunggu';
  const effBelum = !effLunas && !effMenunggu;

  const formattedDate = item.tanggal_kunjungan
    ? String(item.tanggal_kunjungan).split('T')[0]
    : '-';

  const btnBase =
    'relative py-1.5 px-1 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-all duration-300';

  return (
    <div className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5 overflow-hidden">
      {/* ─── Header: Patient Info (Optional) & Method Badge ─── */}
      {showPatientName ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
              <h3 className="text-base font-bold text-foreground mt-0.5 truncate">
                {item.nama_pasien}
              </h3>
            </div>
          </div>

          <Badge variant="outline" className="uppercase font-bold text-[10px] sm:text-[11px] tracking-wider shrink-0 bg-background">
            <CreditCard className="w-3 h-3 text-primary" />
            {item.metode_pembayaran}
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
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <CreditCard className="size-3.5 text-primary shrink-0" />
              {item.metode_pembayaran}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PrivacyAmount
              amount={item.biaya}
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
              Biaya:
            </span>
          </div>
          <PrivacyAmount
            amount={item.biaya}
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
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
          <span>Status Pembayaran:</span>
          <Badge
            variant={effLunas ? 'success' : effMenunggu ? 'warning' : 'destructive'}
            className="capitalize text-[10px] py-0 px-2"
          >
            {effectiveStatus}
          </Badge>
        </div>

        {/* 3-Button Toggle Segment */}
        <div className="grid grid-cols-3 gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80">
          {/* Menunggu */}
          <button
            type="button"
            disabled={Boolean(updatingId)}
            onClick={() => onUpdateStatus && onUpdateStatus(item.kunjungan_id, 'menunggu')}
            className={`${btnBase} ${effMenunggu
                ? isUpdatingThis
                  ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                  : 'bg-amber-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {isUpdatingThis && effMenunggu && <Spinner className="size-3" />}
            Menunggu
          </button>

          {/* Lunas */}
          <button
            type="button"
            disabled={Boolean(updatingId)}
            onClick={() => onUpdateStatus && onUpdateStatus(item.kunjungan_id, 'lunas')}
            className={`${btnBase} ${effLunas
                ? isUpdatingThis
                  ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                  : 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {isUpdatingThis && effLunas && <Spinner className="size-3" />}
            Lunas
          </button>

          {/* Belum Bayar */}
          <button
            type="button"
            disabled={Boolean(updatingId)}
            onClick={() => onUpdateStatus && onUpdateStatus(item.kunjungan_id, 'belum bayar')}
            className={`${btnBase} ${effBelum
                ? isUpdatingThis
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                  : 'bg-rose-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {isUpdatingThis && effBelum && <Spinner className="size-3" />}
            Belum Bayar
          </button>
        </div>
      </div>

      {/* ─── Optional Actions (Edit / Delete) ─── */}
      {(onEdit || onDelete) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(item)}
              className="w-full text-xs font-bold py-2 border-border/80 hover:bg-secondary flex items-center justify-center gap-1.5"
            >
              <Edit className="size-3.5 text-primary" />
              Edit Data
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(item.kunjungan_id)}
              className="w-full text-xs font-bold py-2 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5"
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
