import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { apiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  usePrivacy();
  const [kunjunganList, setKunjunganList] = useState(() => apiService.getKunjunganList());

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

  const loadData = () => {
    setKunjunganList(apiService.getKunjunganList());
  };

  const filteredList = kunjunganList.filter((k) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = k.nama_pasien.toLowerCase().includes(q);
      const matchId = k.kunjungan_id.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }

    if (statusFilter !== 'semua' && k.status !== statusFilter) {
      return false;
    }

    if (metodeFilter !== 'semua' && k.metode_pembayaran !== metodeFilter) {
      return false;
    }

    if (jenisFilter === 'reguler' && k.paket_id) return false;
    if (jenisFilter === 'paket' && !k.paket_id) return false;

    if (startDate && k.tanggal_kunjungan < startDate) return false;
    if (endDate && k.tanggal_kunjungan > endDate) return false;

    return true;
  });

  const handleUpdateStatus = (id, newStatus) => {
    try {
      apiService.updateKunjungan(id, { status: newStatus });
      loadData();
      showToast(`Status pembayaran diubah ke '${newStatus}'`, 'success');
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status', 'error');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    try {
      apiService.deleteKunjungan(deleteTargetId);
      loadData();
      showToast('Catatan kunjungan berhasil dihapus', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus catatan', 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      apiService.updateKunjungan(editingItem.kunjungan_id, {
        tanggal_kunjungan: editingItem.tanggal_kunjungan,
        biaya: Number(editingItem.biaya),
        metode_pembayaran: editingItem.metode_pembayaran,
        status: editingItem.status,
      });
      setEditingItem(null);
      loadData();
      showToast('Perubahan kunjungan berhasil disimpan', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan perubahan', 'error');
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
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <History className="size-6" />
            </div>
            <div>
              <CardTitle>
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
                  className="pl-10 font-semibold touch-input"
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
                <SelectTrigger className="w-full h-[52px] text-base font-semibold border border-input rounded-xl bg-background touch-input">
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
                <SelectTrigger className="w-full h-[52px] text-base font-semibold border border-input rounded-xl bg-background touch-input">
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
                <SelectTrigger className="w-full h-[52px] text-base font-semibold border border-input rounded-xl bg-background touch-input">
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
        {filteredList.length === 0 ? (
          <Card className="border-2 border-dashed border-border/80 rounded-2xl p-8 text-center text-muted-foreground space-y-2">
            <History className="size-12 mx-auto text-muted-foreground/60" />
            <p className="text-lg font-bold">Tidak ada data kunjungan yang cocok.</p>
            <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
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
                    <span className="text-foreground/90 font-semibold">{item.tanggal_kunjungan}</span>
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
                  <div className="grid grid-cols-3 gap-1 bg-secondary/80 p-1 rounded-xl border border-border/80">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.kunjungan_id, 'menunggu')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center transition-all ${isMenunggu
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Menunggu
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.kunjungan_id, 'lunas')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center transition-all ${isLunas
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Lunas
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.kunjungan_id, 'belum bayar')}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center transition-all ${!isLunas && !isMenunggu
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      Belum Bayar
                    </button>
                  </div>
                </div>

                {/* Actions (Edit / Delete) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingItem({ ...item })}
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
                    value={editingItem.nama_pasien}
                    disabled
                    className="bg-secondary text-muted-foreground font-bold"
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
                    onClick={() => setEditingItem(null)}
                    className="w-1/2 py-5 font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="w-1/2 py-5 font-bold rounded-xl shadow-md"
                  >
                    Simpan Perubahan
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
