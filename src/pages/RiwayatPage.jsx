import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { KunjunganCard } from '../components/common/KunjunganCard';
import { EmptyState } from '../components/common/EmptyState';
import { ImportModal } from '../components/common/ImportModal';
import { ExportPdfModal } from '../components/common/ExportPdfModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAnimatePresence } from '../hooks/useAnimatePresence';
import { getTodayDateString, formatDateLocal, getFriendlyErrorMessage } from '../lib/utils';
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
  Printer,
  Lock,
  CheckCircle2,
  RotateCcw,
  User,
  DollarSign,
  CreditCard,
  X,
  Pencil,
  Wallet,
  Building2,
  Clock,
  AlertCircle,
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
  const [activeEditingItem, setActiveEditingItem] = useState(null);
  const { shouldRender: showEditModal, isMounted: isEditModalMounted } = useAnimatePresence(Boolean(editingItem), 250);

  const handleOpenEdit = (k) => {
    const formatted = {
      ...k,
      tanggal_kunjungan: k.tanggal_kunjungan
        ? formatDateLocal(k.tanggal_kunjungan)
        : '',
    };
    setEditingItem(formatted);
    setActiveEditingItem(formatted);
  };

  const updateEditingItem = (newVal) => {
    setEditingItem(newVal);
    if (newVal) {
      setActiveEditingItem(newVal);
    }
  };

  const currentEdit = editingItem || activeEditingItem;
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const data = await api.getKunjunganList();
      setKunjunganList(data || []);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Maaf, data riwayat kunjungan belum dapat dimuat saat ini.'), 'error');
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
        if (active) showToast(getFriendlyErrorMessage(err, 'Maaf, data riwayat kunjungan belum dapat dimuat saat ini.'), 'error');
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

    const kDate = k.tanggal_kunjungan ? formatDateLocal(k.tanggal_kunjungan) : '';

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
      showToast('Status pembayaran berhasil diperbarui!', 'success');
    } catch (err) {
      // Revert optimistic update on failure
      setPendingStatus((prev) => { const n = { ...prev }; delete n[id]; return n; });
      showToast(getFriendlyErrorMessage(err, 'Maaf, status pembayaran belum berhasil diperbarui. Silakan coba lagi.'), 'error');
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
      showToast('Catatan kunjungan berhasil dihapus!', 'success');
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Maaf, catatan kunjungan belum berhasil dihapus. Silakan coba lagi.'), 'error');
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
      showToast('Perubahan data kunjungan berhasil disimpan!', 'success');
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Maaf, perubahan data belum berhasil disimpan. Silakan coba lagi.'), 'error');
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
    <div className="space-y-4 sm:space-y-6 pb-36 sm:pb-8 animate-in fade-in-50">

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
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button
              type="button"
              variant="default"
              onClick={() => setShowExportPdfModal(true)}
              className="w-full sm:w-auto font-bold bg-primary text-primary-foreground shadow-sm gap-1.5"
            >
              <Printer className="size-4.5" />
              Cetak Laporan PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="w-full sm:w-auto font-bold gap-1.5"
            >
              <FileSpreadsheet className="size-4.5" />
              Import Spreadsheet
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Export PDF Modal */}
      <ExportPdfModal
        isOpen={showExportPdfModal}
        onClose={() => setShowExportPdfModal(false)}
        kunjunganList={kunjunganList}
      />

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
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-foreground min-w-0">
              <Filter className="size-4.5 text-primary shrink-0" />
              <span className="truncate">Filter Pencarian Data</span>
            </div>
            <Button
              variant="link"
              onClick={resetFilters}
              className="text-xs text-primary font-bold p-0 h-auto shrink-0 flex items-center gap-1.5 hover:underline"
            >
              <RotateCcw className="size-3.5 shrink-0" />
              <span>Reset Filter</span>
            </Button>
          </div>
          {dataScope === 'current_month' && !startDate && !endDate && (
            <div className="pt-0.5">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-bold text-xs inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" />
                <span>Bulan Ini ({currentYearMonth})</span>
              </Badge>
            </div>
          )}
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
              onEdit={handleOpenEdit}
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
      {showEditModal && activeEditingItem && createPortal(
        <div
          onClick={() => setEditingItem(null)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
            isEditModalMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className={`p-0 border-0 sm:border-2 border-primary/40 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-lg md:max-w-xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform ${
              isEditModalMounted
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shrink-0 bg-card">
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                <Pencil className="size-5 sm:size-6 text-primary shrink-0" />
                <span>Edit Kunjungan ({activeEditingItem.kunjungan_id})</span>
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

            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <User className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Nama Pasien
                  </label>
                  {currentEdit.paket_id ? (
                    <div>
                      <div className="relative">
                        <Input
                          type="text"
                          value={currentEdit.nama_pasien || ''}
                          readOnly
                          disabled
                          className="font-bold h-12 rounded-xl bg-secondary/80 text-muted-foreground cursor-not-allowed pr-10"
                        />
                        <Lock className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                        Nama pasien terkunci karena kunjungan ini terikat dengan Paket Kunjungan.
                      </p>
                    </div>
                  ) : (
                    <Input
                      type="text"
                      value={currentEdit.nama_pasien || ''}
                      onChange={(e) =>
                        updateEditingItem({ ...currentEdit, nama_pasien: e.target.value })
                      }
                      className="font-bold h-12 rounded-xl"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Calendar className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Tanggal Kunjungan
                  </label>
                  <DatePicker
                    value={currentEdit.tanggal_kunjungan}
                    onChange={(dateVal) =>
                      updateEditingItem({ ...currentEdit, tanggal_kunjungan: dateVal })
                    }
                    placeholder="Pilih tanggal kunjungan..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <DollarSign className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Biaya (Rp)
                  </label>
                  <Input
                    type="number"
                    value={currentEdit.biaya}
                    onChange={(e) =>
                      updateEditingItem({ ...currentEdit, biaya: e.target.value })
                    }
                    className="font-bold h-12 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <CreditCard className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Metode Pembayaran
                  </label>
                  {currentEdit.paket_id ? (
                    <div className="h-12 px-4 flex items-center font-bold text-sm bg-secondary/80 text-muted-foreground rounded-xl border border-input">
                      <Lock className="size-4 mr-2 shrink-0 text-muted-foreground" /> {currentEdit.metode_pembayaran === 'transfer' ? 'Transfer Bank' : 'Tunai / Cash'} (Patokan Paket)
                    </div>
                  ) : (
                    <Select
                      value={currentEdit.metode_pembayaran || 'cash'}
                      onValueChange={(val) =>
                        updateEditingItem({ ...currentEdit, metode_pembayaran: val })
                      }
                    >
                      <SelectTrigger className="w-full h-12 text-base font-bold border border-input rounded-xl bg-background">
                        <SelectValue placeholder="Pilih metode..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="cash">
                          <span className="flex items-center gap-2 font-bold"><Wallet className="size-4 text-emerald-600 shrink-0" /> Tunai / Cash</span>
                        </SelectItem>
                        <SelectItem value="transfer">
                          <span className="flex items-center gap-2 font-bold"><Building2 className="size-4 text-blue-600 shrink-0" /> Transfer Bank</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <CheckCircle2 className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Status Pembayaran
                  </label>
                  {currentEdit.paket_id ? (
                    <div className="h-12 px-4 flex items-center font-bold text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="size-4.5 mr-2 shrink-0" /> Lunas (Terbayar Paket)
                    </div>
                  ) : (
                    <Select
                      value={currentEdit.status || 'menunggu'}
                      onValueChange={(val) =>
                        updateEditingItem({ ...currentEdit, status: val })
                      }
                    >
                      <SelectTrigger className="w-full h-12 text-base font-bold border border-input rounded-xl bg-background">
                        <SelectValue placeholder="Pilih status..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="lunas">
                          <span className="flex items-center gap-2 font-bold"><CheckCircle2 className="size-4 text-emerald-600 shrink-0" /> Lunas</span>
                        </SelectItem>
                        <SelectItem value="menunggu">
                          <span className="flex items-center gap-2 font-bold"><Clock className="size-4 text-amber-500 shrink-0" /> Menunggu</span>
                        </SelectItem>
                        <SelectItem value="belum bayar">
                          <span className="flex items-center gap-2 font-bold"><AlertCircle className="size-4 text-rose-500 shrink-0" /> Belum Bayar</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setEditingItem(null)}
                    className="w-1/3 sm:w-auto px-4 h-12 sm:h-13 ext-base font-bold rounded-xl sm:rounded-2xl gap-1.5 shrink-0"
                  >
                    <X className="size-4 shrink-0 text-muted-foreground" />
                    <span>Batal</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-12 sm:h-13 text-base font-black rounded-xl sm:rounded-2xl shadow-lg gap-1.5 sm:gap-2 whitespace-nowrap min-w-0"
                  >
                    {saving ? (
                      <>
                        <Spinner className="size-4 sm:size-5 shrink-0" />
                        <span className="truncate">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4 sm:size-5 shrink-0" />
                        <span className="truncate">Simpan Perubahan</span>
                      </>
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
