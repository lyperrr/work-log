import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { KunjunganCard } from '../components/common/KunjunganCard';
import { EmptyState } from '../components/common/EmptyState';
import { ImportModal } from '../components/common/ImportModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getTodayDateString } from '../lib/utils';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
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
  FileSpreadsheet,
} from 'lucide-react';

export function RiwayatPage() {
  const { showToast } = useToast();
  const { api } = useAuth();
  const { dataScope } = useSettings();
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
  const [statusFilter, setStatusFilter] = useState('');
  const [metodeFilter, setMetodeFilter] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingItem, setEditingItem] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

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
    let active = true;
    const fetchData = async () => {
      try {
        const data = await api.getKunjunganList();
        if (active) setKunjunganList(data || []);
      } catch (err) {
        if (active) showToast(err.message || 'Gagal memuat data kunjungan', 'error');
      } finally {
        if (active) setLoadingData(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [api, showToast]);

  const todayStr = getTodayDateString();
  const currentYearMonth = todayStr.substring(0, 7);

  const filteredList = (Array.isArray(kunjunganList) ? kunjunganList : []).filter((k) => {
    if (!k || typeof k !== 'object') return false;

    const kDate = k.tanggal_kunjungan ? String(k.tanggal_kunjungan).split('T')[0] : '';

    // Enforce dataScope from Settings (Bulan Saat Ini Saja vs Semua Bulan)
    if (dataScope === 'current_month' && !startDate && !endDate) {
      if (kDate && !kDate.startsWith(currentYearMonth)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (k.nama_pasien || '').toLowerCase().includes(q);
      const matchId = (k.kunjungan_id || '').toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (statusFilter && statusFilter !== 'semua' && (k.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (metodeFilter && metodeFilter !== 'semua' && (k.metode_pembayaran || '').toLowerCase() !== metodeFilter.toLowerCase()) {
      return false;
    }

    if (jenisFilter === 'reguler' && k.paket_id) return false;
    if (jenisFilter === 'paket' && !k.paket_id) return false;

    if (startDate && kDate < startDate) return false;
    if (endDate && kDate > endDate) return false;

    return true;
  }).sort((a, b) => {
    const dateA = a.tanggal_kunjungan ? String(a.tanggal_kunjungan).split('T')[0] : '';
    const dateB = b.tanggal_kunjungan ? String(b.tanggal_kunjungan).split('T')[0] : '';
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.kunjungan_id || '').localeCompare(String(a.kunjungan_id || ''));
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
    setStatusFilter('');
    setMetodeFilter('');
    setJenisFilter('');
    setStartDate('');
    setEndDate('');
    showToast('Filter pencarian di-reset', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">

      {/* Header Card using shadcn Card */}
      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-0 pb-0">
          <div className="flex items-center gap-3">
            <History className="size-6 shrink-0 text-primary" />
            <div>
              <CardTitle className="">
                Riwayat &amp; Filter Kunjungan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cari dan filter data transaksi kunjungan pasien
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="w-full sm:w-auto font-bold"
          >
            <FileSpreadsheet className="size-4.5" />
            Import Spreadsheet
          </Button>
        </CardHeader>
      </Card>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialType="kunjungan"
        onImportSuccess={loadData}
        api={api}
        showToast={showToast}
      />

      {/* Filter Control Box using shadcn Card, Input, Select, and Button */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base text-foreground">
            <Filter className="size-5 text-primary shrink-0" />
            <span>Filter Pencarian Data</span>
            {dataScope === 'current_month' && !startDate && !endDate && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold text-xs ml-2">
                <Calendar className="size-4" />
                Bulan Ini ({currentYearMonth})
              </Badge>
            )}
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
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Status Pembayaran
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="menunggu">Menunggu</SelectItem>
                  <SelectItem value="belum bayar">Belum Bayar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Metode Filter */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Metode Pembayaran
              </label>
              <Select value={metodeFilter} onValueChange={setMetodeFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Pilih metode..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Metode</SelectItem>
                  <SelectItem value="cash">Cash (Tunai)</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jenis Transaksi */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                Jenis Transaksi
              </label>
              <Select value={jenisFilter} onValueChange={setJenisFilter}>
                <SelectTrigger className="w-full h-12 text-base font-semibold border border-input rounded-xl bg-background touch-input">
                  <SelectValue placeholder="Pilih jenis transaksi..." />
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
          <EmptyState
            type={
              searchQuery || statusFilter !== 'semua' || metodeFilter !== 'semua' || jenisFilter !== 'semua' || startDate || endDate
                ? 'search'
                : 'riwayat'
            }
            query={searchQuery}
            onReset={
              searchQuery || statusFilter !== 'semua' || metodeFilter !== 'semua' || jenisFilter !== 'semua' || startDate || endDate
                ? resetFilters
                : undefined
            }
          />
        ) : (
          filteredList.map((item) => (
            <KunjunganCard
              key={item.kunjungan_id}
              item={item}
              showPatientName={true}
              isRevealed={Boolean(peekRiwayatMap[item.kunjungan_id])}
              onTogglePeek={() => toggleRiwayatPeek(item.kunjungan_id)}
              updatingId={updatingId}
              pendingStatus={pendingStatus}
              onUpdateStatus={handleUpdateStatus}
              onEdit={(k) =>
                setEditingItem({
                  ...k,
                  tanggal_kunjungan: k.tanggal_kunjungan
                    ? String(k.tanggal_kunjungan).split('T')[0]
                    : '',
                })
              }
              onDelete={(id) => setDeleteTargetId(id)}
            />
          ))
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
          <Card className="p-0 border-2 border-primary/40 rounded-3xl max-w-lg w-full shadow-2xl shrink-0 overflow-hidden">
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
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Nama Pasien
                  </label>
                  <Input
                    type="text"
                    value={editingItem.nama_pasien || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, nama_pasien: e.target.value })
                    }
                    className="font-bold h-12 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Tanggal Kunjungan
                  </label>
                  <DatePicker
                    value={editingItem.tanggal_kunjungan}
                    onChange={(dateVal) =>
                      setEditingItem({ ...editingItem, tanggal_kunjungan: dateVal })
                    }
                    placeholder="Pilih tanggal kunjungan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Biaya (Rp)
                  </label>
                  <Input
                    type="number"
                    value={editingItem.biaya}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, biaya: e.target.value })
                    }
                    className="font-bold h-12 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Metode Pembayaran
                  </label>
                  <Select
                    value={editingItem.metode_pembayaran || 'cash'}
                    onValueChange={(val) =>
                      setEditingItem({ ...editingItem, metode_pembayaran: val })
                    }
                  >
                    <SelectTrigger className="w-full h-12 text-base font-bold border border-input rounded-xl bg-background">
                      <SelectValue placeholder="Pilih metode..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="cash">Tunai / Cash</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Status Pembayaran
                  </label>
                  <Select
                    value={editingItem.status || 'menunggu'}
                    onValueChange={(val) =>
                      setEditingItem({ ...editingItem, status: val })
                    }
                  >
                    <SelectTrigger className="w-full h-12 text-base font-bold border border-input rounded-xl bg-background">
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="lunas">Lunas</SelectItem>
                      <SelectItem value="menunggu">Menunggu</SelectItem>
                      <SelectItem value="belum bayar">Belum Bayar</SelectItem>
                    </SelectContent>
                  </Select>
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
