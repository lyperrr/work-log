import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../components/ui/empty';
import { Spinner } from '../components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  History,
  Filter,
  Search,
  Calendar,
  Trash2,
  Edit,
  Phone,
  CreditCard,
  Package,
} from 'lucide-react';

export function RiwayatPage() {
  const { showToast } = useToast();
  const { api } = useAuth();
  usePrivacy();
  const [kunjunganList, setKunjunganList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  // Optimistic status: maps kunjungan_id → target status while API call is in flight.
  // This lets the button indicator "slide" to the new position immediately on click.
  const [pendingStatus, setPendingStatus] = useState({});

  const [peekRiwayatMap, setPeekRiwayatMap] = useState({});

  const toggleRiwayatPeek = (id) => {
    setPeekRiwayatMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [metodeFilter, setMetodeFilter] = useState('semua');
  const [jenisFilter, setJenisFilter] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingItem, setEditingItem] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await api.getKunjunganList();
      setKunjunganList(data || []);
    } catch (err) {
      showToast(err.message || 'Gagal memuat data kunjungan', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredList = (Array.isArray(kunjunganList) ? kunjunganList : []).filter((k) => {
    if (!k || typeof k !== 'object') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (k.nama_pasien || '').toLowerCase().includes(q);
      const matchId = (k.kunjungan_id || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (statusFilter !== 'semua' && (k.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (metodeFilter !== 'semua' && (k.metode_pembayaran || '').toLowerCase() !== metodeFilter.toLowerCase()) {
      return false;
    }

    if (jenisFilter === 'reguler' && k.paket_id) return false;
    if (jenisFilter === 'paket' && !k.paket_id) return false;

    const kDate = k.tanggal_kunjungan ? String(k.tanggal_kunjungan).split('T')[0] : '';
    if (startDate && kDate < startDate) return false;
    if (endDate && kDate > endDate) return false;

    return true;
  });

  const handleUpdateStatus = async (id, newStatus) => {
    if (saving || updatingId) return;
    setUpdatingId(id);
    // Optimistic: move the active indicator to the clicked button immediately
    setPendingStatus((prev) => ({ ...prev, [id]: newStatus }));
    try {
      await api.updateKunjunganStatus(id, newStatus);
      await loadData();
      showToast(`Status pembayaran diubah ke '${newStatus}'`, 'success');
    } catch (err) {
      // Revert optimistic update on failure
      setPendingStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });
      showToast(err.message || 'Gagal memperbarui status', 'error');
    } finally {
      setUpdatingId(null);
      setPendingStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setSaving(true);
    try {
      await api.deleteKunjungan(deleteTargetId);
      await loadData();
      showToast('Catatan kunjungan berhasil dihapus', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus catatan', 'error');
    } finally {
      setSaving(false);
      setDeleteTargetId(null);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem || saving) return;
    setSaving(true);
    try {
      await api.updateKunjungan(editingItem.kunjungan_id, {
        nama_pasien: editingItem.nama_pasien,
        tanggal_kunjungan: editingItem.tanggal_kunjungan,
        biaya: Number(editingItem.biaya),
        metode_pembayaran: editingItem.metode_pembayaran,
        status: editingItem.status,
      });
      setEditingItem(null);
      await loadData();
      showToast('Perubahan kunjungan berhasil disimpan', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('semua');
    setMetodeFilter('semua');
    setJenisFilter('semua');
    setStartDate('');
    setEndDate('');
    showToast('Filter pencarian di-reset', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">

      {/* Header Card using shadcn Card */}
      <Card>
        <CardHeader className="border-b-0 pb-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <History className="size-6" />
            </div>
            <div>
              <CardTitle className="">
                Riwayat & Filter Kunjungan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cari dan filter data transaksi kunjungan pasien
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Control Box using shadcn Card, Input, Select, and Button */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <Filter className="size-5 text-primary shrink-0" />
            <span>Filter Pencarian Data</span>
          </div>
          <Button
            variant="link"
            onClick={resetFilters}
            className="text-xs text-primary font-bold p-0 h-auto"
          >
            Reset Filter
          </Button>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Search Input using shadcn Input */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Cari Nama Pasien / ID
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama pasien..."
                  className="pl-10 h-12 font-semibold touch-input"
                />
                <Search className="size-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Status Filter using shadcn Select */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Status Pembayaran
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="menunggu">Menunggu</SelectItem>
                  <SelectItem value="belum bayar">Belum Bayar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metode Filter using shadcn Select */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Metode Pembayaran
              </label>
              <Select value={metodeFilter} onValueChange={setMetodeFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Semua Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Metode</SelectItem>
                  <SelectItem value="cash">Cash (Tunai)</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Transaksi using shadcn Select */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Jenis Transaksi
              </label>
              <Select value={jenisFilter} onValueChange={setJenisFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Semua Transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Transaksi</SelectItem>
                  <SelectItem value="reguler">Kunjungan Reguler</SelectItem>
                  <SelectItem value="paket">Bagian dari Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Start using shadcn Popover & Calendar DatePicker */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Dari Tanggal
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Pilih dari tanggal..."
              />
            </div>

            {/* Date Range End using shadcn Popover & Calendar DatePicker */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Sampai Tanggal
              </label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Pilih sampai tanggal..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between px-2 text-sm font-bold text-muted-foreground">
        <span>Menampilkan {filteredList.length} data kunjungan</span>
      </div>

      {/* Results List Cards - 100% Responsive */}
      <div className="space-y-4">
        {loadingData ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="border-2 border-dashed border-border/80 rounded-2xl p-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <History className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="font-bold text-base">Tidak Ada Data Kunjungan</EmptyTitle>
                <EmptyDescription>
                  {searchQuery || statusFilter !== 'semua' || metodeFilter !== 'semua' || jenisFilter !== 'semua' || startDate || endDate
                    ? 'Tidak ditemukan data yang sesuai dengan filter pencarian Anda.'
                    : 'Belum ada data riwayat kunjungan pasien yang tersimpan.'}
                </EmptyDescription>
              </EmptyHeader>
              {(searchQuery || statusFilter !== 'semua' || metodeFilter !== 'semua' || jenisFilter !== 'semua' || startDate || endDate) && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="font-bold">
                  Reset Filter
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          filteredList.map((item) => {
            const isLunas = item.status === 'lunas';
            const isMenunggu = item.status === 'menunggu';

            return (
              <div
                key={item.kunjungan_id}
                className="bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5 overflow-hidden"
              >
                {/* Header Row: Patient Info + Payment Method Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
                      {item.nama_pasien.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                          {item.kunjungan_id}
                        </span>
                        {item.info_paket && (
                          <Badge variant="secondary" className="bg-primary/15 text-primary font-bold text-[10px]">
                            <Package className="w-3 h-3 mr-1" />
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
                    <CreditCard className="w-3 h-3 mr-1 text-primary" />
                    Metode: {item.metode_pembayaran}
                  </Badge>
                </div>

                {/* Dedicated Biaya Highlight Bar (Clickable to reveal/hide) */}
                <div
                  onClick={() => toggleRiwayatPeek(item.kunjungan_id)}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-secondary/60 hover:bg-secondary/90 border border-border/60 cursor-pointer select-none transition-all group/biaya"
                  title="Klik untuk melihat/menyembunyikan biaya"
                >
                  <div className="flex items-center gap-2">
                    <PrivacyPeekButton
                      isRevealed={Boolean(peekRiwayatMap[item.kunjungan_id])}
                      onToggle={() => toggleRiwayatPeek(item.kunjungan_id)}
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover/biaya:text-foreground">
                      Biaya:
                    </span>
                  </div>
                  <PrivacyAmount
                    amount={item.biaya}
                    isRevealed={Boolean(peekRiwayatMap[item.kunjungan_id])}
                    onToggle={() => toggleRiwayatPeek(item.kunjungan_id)}
                    className="text-lg sm:text-xl font-black text-primary tracking-tight"
                  />
                </div>

                {/* Spacious Sub-row: Phone & Date Info (Slightly Larger Font Size) */}
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-foreground font-medium px-1 gap-2 border-t border-border/40 pt-2.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-4 text-primary shrink-0" />
                    <strong className="font-bold text-foreground">No. Telp:</strong>
                    <span className="text-foreground/90 font-semibold">{item.no_telp || '-'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary shrink-0" />
                    <strong className="font-bold text-foreground">Tgl Kunjungan:</strong>
                    <span className="text-foreground/90 font-semibold">
                      {item.tanggal_kunjungan ? String(item.tanggal_kunjungan).split('T')[0] : '-'}
                    </span>
                  </span>
                </div>

                {/* Status Section Header & Controls */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    <span>Status Pembayaran:</span>
                    <Badge
                      variant={isLunas ? 'success' : isMenunggu ? 'warning' : 'destructive'}
                      className="capitalize text-[10px] py-0 px-2"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  {/* Status Toggle Buttons */}
                  {(() => {
                    // Use pending (optimistic) status while API is in flight so the
                    // indicator slides to the target button immediately on click.
                    const isUpdatingThis = updatingId === item.kunjungan_id;
                    const effectiveStatus = isUpdatingThis && pendingStatus[item.kunjungan_id]
                      ? pendingStatus[item.kunjungan_id]
                      : item.status;
                    const effLunas    = effectiveStatus === 'lunas';
                    const effMenunggu = effectiveStatus === 'menunggu';
                    const effBelum    = !effLunas && !effMenunggu;

                    const btnBase = 'relative py-1.5 px-1 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-all duration-300';

                    return (
                      <div className="grid grid-cols-3 gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80">
                        {/* Menunggu */}
                        <button
                          type="button"
                          disabled={Boolean(updatingId)}
                          onClick={() => handleUpdateStatus(item.kunjungan_id, 'menunggu')}
                          className={`${btnBase} ${
                            effMenunggu
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
                          onClick={() => handleUpdateStatus(item.kunjungan_id, 'lunas')}
                          className={`${btnBase} ${
                            effLunas
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
                          onClick={() => handleUpdateStatus(item.kunjungan_id, 'belum bayar')}
                          className={`${btnBase} ${
                            effBelum
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
                    );
                  })()}
                </div>

                {/* Actions (Edit / Delete) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setEditingItem({
                        ...item,
                        tanggal_kunjungan: item.tanggal_kunjungan
                          ? String(item.tanggal_kunjungan).split('T')[0]
                          : '',
                      })
                    }
                    className="w-full font-bold"
                  >
                    <Edit className="size-3.5 mr-1 text-primary" />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteTargetId(item.kunjungan_id)}
                    className="w-full font-bold"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Kunjungan"
        description="Apakah Anda yakin ingin menghapus data kunjungan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="destructive"
        icon={Trash2}
        isLoading={saving}
      />

      {/* Edit Modal */}
      {editingItem && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
          <Card className="border-2 border-primary/40 rounded-3xl max-w-lg w-full shadow-2xl my-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
              <CardTitle className="text-xl font-black">
                Edit Kunjungan ({editingItem.kunjungan_id})
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground font-black text-xl"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Nama Pasien
                  </label>
                  <Input
                    type="text"
                    value={editingItem.nama_pasien || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, nama_pasien: e.target.value })
                    }
                    className="font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Tanggal Kunjungan
                  </label>
                  <Input
                    type="date"
                    value={editingItem.tanggal_kunjungan}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, tanggal_kunjungan: e.target.value })
                    }
                    className="font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Biaya (Rp)
                  </label>
                  <Input
                    type="number"
                    value={editingItem.biaya}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, biaya: e.target.value })
                    }
                    className="font-bold"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setEditingItem(null)}
                    className="w-1/2 py-5 font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-1/2 py-5 font-bold rounded-xl shadow-md"
                  >
                    {saving ? (
                      <>
                        <Spinner className="mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

    </div>
  );
}
