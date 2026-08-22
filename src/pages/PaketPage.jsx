import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { PatientAutocomplete } from '../components/common/PatientAutocomplete';
import { PackageCalculator, calculateValuePerSession } from '../components/common/PackageCalculator';
import { getTodayDateString, formatDateLocal, getFriendlyErrorMessage } from '../lib/utils';
import { DatePicker } from '../components/common/DatePicker';
import { KunjunganCard } from '../components/common/KunjunganCard';
import { EmptyState } from '../components/common/EmptyState';
import { ImportModal } from '../components/common/ImportModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useAnimatePresence } from '../hooks/useAnimatePresence';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Package,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Phone,
  ChevronRight,
  FileSpreadsheet,
  Pencil,
  Trash2,
  Lock,
  X,
  DollarSign,
  CreditCard,
  Wallet,
} from 'lucide-react';

export function PaketPage({ onNavigate }) {
  const { showToast } = useToast();
  const { api } = useAuth();
  usePrivacy();

  const [paketList, setPaketList] = useState([]);
  const [kunjunganList, setKunjunganList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { shouldRender: shouldRenderCreateModal, isMounted: isCreateModalMounted } = useAnimatePresence(showModal, 250);
  const [showImportModal, setShowImportModal] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const { shouldRender: shouldRenderEditPaketModal, isMounted: isEditPaketModalMounted } = useAnimatePresence(showEditModal, 250);
  const [editPaketData, setEditPaketData] = useState(null);
  const [editHargaPaket, setEditHargaPaket] = useState('');
  const [editTotalKunjungan, setEditTotalKunjungan] = useState('');
  const [editTanggalBeli, setEditTanggalBeli] = useState('');
  const [editMetodePembayaran, setEditMetodePembayaran] = useState('cash');
  const [editStatusPaket, setEditStatusPaket] = useState('aktif');
  const [editNamaPasien, setEditNamaPasien] = useState('');
  const [editNoTelp, setEditNoTelp] = useState('');

  // Edit kunjungan state
  const [editingKunjungan, setEditingKunjungan] = useState(null);
  const [activeEditingKunjungan, setActiveEditingKunjungan] = useState(null);
  const { shouldRender: shouldRenderEditKunjunganModal, isMounted: isEditKunjunganModalMounted } = useAnimatePresence(Boolean(editingKunjungan), 250);

  const handleOpenEditKunjungan = (k) => {
    const formatted = {
      ...k,
      tanggal_kunjungan: k.tanggal_kunjungan
        ? formatDateLocal(k.tanggal_kunjungan)
        : '',
    };
    setEditingKunjungan(formatted);
    setActiveEditingKunjungan(formatted);
  };

  const updateEditingKunjungan = (newVal) => {
    setEditingKunjungan(newVal);
    if (newVal) {
      setActiveEditingKunjungan(newVal);
    }
  };

  const currentEditKunjungan = editingKunjungan || activeEditingKunjungan;
  const [deleteKunjunganId, setDeleteKunjunganId] = useState(null);
  const [deletePaketTarget, setDeletePaketTarget] = useState(null);

  // Detail drawer
  const [selectedPaket, setSelectedPaket] = useState(null);
  const [activeSelectedPaket, setActiveSelectedPaket] = useState(null);
  const { shouldRender: shouldRenderDetailModal, isMounted: isDetailModalMounted } = useAnimatePresence(Boolean(selectedPaket), 250);

  const handleOpenDetailModal = (pkt) => {
    setSelectedPaket(pkt);
    if (pkt) setActiveSelectedPaket(pkt);
  };

  const currentPaket = selectedPaket || activeSelectedPaket;
  const currentPaketVisits = (kunjunganList || []).filter(
    (k) => currentPaket && k.paket_id === currentPaket.paket_id
  );
  const currentTerpakai = currentPaket
    ? Math.max(Number(currentPaket.terpakai || 0), currentPaketVisits.length)
    : 0;
  const currentSisa = currentPaket
    ? Math.max(0, Number(currentPaket.total_kunjungan) - currentTerpakai)
    : 0;

  const [updatingKunjunganId, setUpdatingKunjunganId] = useState(null);
  const [pendingKunjunganStatus, setPendingKunjunganStatus] = useState({});

  const [peekPaketMap, setPeekPaketMap] = useState({});

  // Helper function: urutkan array secara descending (terbaru di atas)
  const sortDesc = (arr, idField) =>
    (arr || []).slice().sort((a, b) => {
      const keyA = a.created_at || a[idField] || '';
      const keyB = b.created_at || b[idField] || '';
      return String(keyB).localeCompare(String(keyA));
    });

  // ─── Data Loading ─────────────────────────────────────────────
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [pakets, kunjungans] = await Promise.all([
        api.getPaketList().catch(() => []),
        api.getKunjunganList().catch(() => []),
      ]);
      setPaketList(sortDesc(pakets, 'paket_id'));
      setKunjunganList(sortDesc(kunjungans, 'kunjungan_id'));
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Gagal memuat data paket'), 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (active) setLoadingData(true);
      try {
        const [pakets, kunjungans] = await Promise.all([
          api.getPaketList().catch(() => []),
          api.getKunjunganList().catch(() => []),
        ]);
        if (active) {
          setPaketList(sortDesc(pakets, 'paket_id'));
          setKunjunganList(sortDesc(kunjungans, 'kunjungan_id'));
        }
      } catch (err) {
        if (active) showToast(getFriendlyErrorMessage(err, 'Gagal memuat data paket'), 'error');
      } finally {
        if (active) setLoadingData(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [api, showToast]);

  // Keep selectedPaket in sync with fresh data after reload
  useEffect(() => {
    if (!selectedPaket) return;
    const updated = paketList.find((p) => p.paket_id === selectedPaket.paket_id);
    if (updated && JSON.stringify(updated) !== JSON.stringify(selectedPaket)) {
      const timer = setTimeout(() => setSelectedPaket(updated), 0);
      return () => clearTimeout(timer);
    }
  }, [paketList, selectedPaket]);

  // ─── Privacy Toggle ───────────────────────────────────────────
  const togglePaketPeek = (id, e) => {
    if (e) e.stopPropagation();
    setPeekPaketMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── Kunjungan Status Update (in drawer) ─────────────────────
  const handleUpdateKunjunganStatus = async (kunjunganId, newStatus) => {
    if (updatingKunjunganId) return;
    setUpdatingKunjunganId(kunjunganId);
    setPendingKunjunganStatus((prev) => ({ ...prev, [kunjunganId]: newStatus }));
    try {
      await api.updateKunjunganStatus(kunjunganId, newStatus);
      await loadData();
      showToast('Status pembayaran berhasil diperbarui!', 'success');
    } catch (err) {
      setPendingKunjunganStatus((prev) => {
        const n = { ...prev }; delete n[kunjunganId]; return n;
      });
      showToast(getFriendlyErrorMessage(err, 'Maaf, status pembayaran belum berhasil diperbarui. Silakan coba lagi.'), 'error');
    } finally {
      setUpdatingKunjunganId(null);
      setPendingKunjunganStatus((prev) => {
        const n = { ...prev }; delete n[kunjunganId]; return n;
      });
    }
  };

  // ─── Create Paket Form ────────────────────────────────────────
  const [namaPasien, setNamaPasien] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [totalKunjungan, setTotalKunjungan] = useState(5);
  const [hargaPaket, setHargaPaket] = useState(1500000);
  const [tanggalBeli, setTanggalBeli] = useState(getTodayDateString());
  const [metodePembayaran, setMetodePembayaran] = useState('cash');
  const [simPrice, setSimPrice] = useState(1500000);
  const [simSessions, setSimSessions] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSelectPatient = (patient) => {
    if (patient) setNoTelp(String(patient.no_telp || ''));
  };

  const handleCreatePaket = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!namaPasien.trim()) {
      const msg = 'Nama Pasien wajib diisi.';
      setErrorMsg(msg); showToast(msg, 'error'); return;
    }
    if (!noTelp.trim()) {
      const msg = 'Nomor Telepon wajib diisi.';
      setErrorMsg(msg); showToast(msg, 'error'); return;
    }
    const numSessions = Number(totalKunjungan);
    if (!numSessions || numSessions <= 0 || !Number.isInteger(numSessions)) {
      const msg = 'Total sesi harus lebih dari 0.';
      setErrorMsg(msg); showToast(msg, 'error'); return;
    }

    setSaving(true);
    try {
      const patientRecord = await api.saveOrGetPasienByName(namaPasien, noTelp);
      const numHarga = Number(hargaPaket);

      await api.createPaket({
        pasien_id: patientRecord.pasien_id,
        nama_pasien: patientRecord.nama_pasien,
        no_telp: noTelp,
        total_kunjungan: numSessions,
        harga_paket: numHarga,
        tanggal_beli: tanggalBeli,
        metode_pembayaran: metodePembayaran,
      });

      const successText = `Paket baru & 1 catatan kunjungan pertama (${formatDateLocal(tanggalBeli)}) berhasil dibuat untuk ${patientRecord.nama_pasien}!`;
      setSuccessMsg(successText);
      showToast(successText, 'success');
      setShowModal(false);
      setNamaPasien(''); setNoTelp(''); setTotalKunjungan(5); setHargaPaket(1500000); setMetodePembayaran('cash');
      await loadData();
    } catch (err) {
      const errorText = getFriendlyErrorMessage(err, 'Maaf, paket baru belum berhasil dibuat. Silakan coba lagi.');
      setErrorMsg(errorText);
      showToast(errorText, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Edit Paket Handlers ─────────────────────────────────────
  const handleOpenEditModal = (pkt, e) => {
    if (e) e.stopPropagation();
    setEditPaketData(pkt);
    setEditNamaPasien(pkt.nama_pasien || '');
    setEditNoTelp(pkt.no_telp || '');
    setEditHargaPaket(String(pkt.harga_paket || ''));
    setEditTotalKunjungan(String(pkt.total_kunjungan || ''));
    setEditTanggalBeli(pkt.tanggal_beli ? formatDateLocal(pkt.tanggal_beli) : '');
    setEditMetodePembayaran(pkt.metode_pembayaran || 'cash');
    setEditStatusPaket(pkt.status_paket || 'aktif');
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleSaveEditPaket = async (e) => {
    e.preventDefault();
    if (!editPaketData || saving) return;

    const total = Number(editTotalKunjungan);
    const terpakai = Number(editPaketData.terpakai || 0);
    const harga = Number(editHargaPaket);
    const newNama = editNamaPasien.trim();
    const newTelp = editNoTelp.trim();

    if (!newNama) {
      setErrorMsg('Nama pasien wajib diisi.');
      return;
    }
    if (!total || total <= 0) {
      setErrorMsg('Total kunjungan / sesi harus lebih dari 0.');
      return;
    }
    if (!harga || harga <= 0) {
      setErrorMsg('Harga total paket harus lebih dari 0.');
      return;
    }

    const sisa = Math.max(0, total - terpakai);
    setSaving(true);
    setErrorMsg('');

    try {
      // 1. Update package record
      await api.updatePaket(editPaketData.paket_id, {
        nama_pasien: newNama,
        no_telp: newTelp,
        total_kunjungan: total,
        harga_paket: harga,
        tanggal_beli: editTanggalBeli,
        metode_pembayaran: editMetodePembayaran,
        status_paket: sisa <= 0 ? 'selesai' : 'aktif',
        terpakai,
        sisa_kunjungan: sisa,
      });

      // 2. Automatically update all visit records under this package if patient name or phone changed
      const isPatientInfoChanged =
        newNama !== editPaketData.nama_pasien || newTelp !== (editPaketData.no_telp || '');

      if (isPatientInfoChanged) {
        const associatedVisits = (kunjunganList || []).filter(
          (k) => k.paket_id === editPaketData.paket_id
        );

        if (associatedVisits.length > 0) {
          await Promise.all(
            associatedVisits.map((v) =>
              api.updateKunjungan(v.kunjungan_id, {
                nama_pasien: newNama,
                no_telp: newTelp,
                tanggal_kunjungan: v.tanggal_kunjungan ? formatDateLocal(v.tanggal_kunjungan) : '',
                biaya: Number(v.biaya || 0),
                metode_pembayaran: (v.metode_pembayaran || 'cash').toLowerCase(),
                status: (v.status || 'menunggu').toLowerCase(),
              })
            )
          );
        }
      }

      showToast('Data paket & seluruh catatan kunjungan terkait berhasil diperbarui!', 'success');
      setShowEditModal(false);
      await loadData();

      if (selectedPaket && selectedPaket.paket_id === editPaketData.paket_id) {
        setSelectedPaket((prev) => ({
          ...prev,
          nama_pasien: newNama,
          no_telp: newTelp,
          total_kunjungan: total,
          harga_paket: harga,
          tanggal_beli: editTanggalBeli,
          status_paket: editStatusPaket,
          terpakai,
          sisa_kunjungan: sisa,
        }));
      }
    } catch (err) {
      setErrorMsg(getFriendlyErrorMessage(err, 'Maaf, data paket belum berhasil diperbarui. Silakan coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeletePaketModal = (pkt, e) => {
    if (e) e.stopPropagation();
    setDeletePaketTarget(pkt);
  };

  const handleConfirmDeletePaket = async () => {
    if (!deletePaketTarget || saving) return;
    setSaving(true);
    try {
      const targetPaketId = deletePaketTarget.paket_id;
      const relatedVisits = (kunjunganList || []).filter(
        (k) => String(k.paket_id || '') === String(targetPaketId)
      );

      // 1. Delete package in backend
      await api.deletePaket(targetPaketId);

      // 2. Cascade delete all visits matching this paket_id
      if (relatedVisits.length > 0) {
        await Promise.all(
          relatedVisits.map((v) => api.deleteKunjungan(v.kunjungan_id).catch(() => null))
        );
      }

      showToast(
        relatedVisits.length > 0
          ? `Paket ${targetPaketId} dan ${relatedVisits.length} catatan kunjungan terkait berhasil dihapus!`
          : `Paket ${targetPaketId} berhasil dihapus!`,
        'success'
      );

      if (selectedPaket && selectedPaket.paket_id === targetPaketId) {
        setSelectedPaket(null);
      }
      if (editPaketData && editPaketData.paket_id === targetPaketId) {
        setShowEditModal(false);
      }
      setDeletePaketTarget(null);
      await loadData();
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Gagal menghapus paket. Silakan coba lagi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditKunjungan = async (e) => {
    e.preventDefault();
    if (!editingKunjungan || saving) return;
    setSaving(true);
    try {
      await api.updateKunjungan(editingKunjungan.kunjungan_id, {
        nama_pasien: editingKunjungan.nama_pasien,
        no_telp: editingKunjungan.no_telp || '',
        tanggal_kunjungan: editingKunjungan.tanggal_kunjungan,
        biaya: Number(editingKunjungan.biaya || 0),
        metode_pembayaran: (editingKunjungan.metode_pembayaran || 'cash').toLowerCase(),
        status: (editingKunjungan.status || 'menunggu').toLowerCase(),
      });
      setEditingKunjungan(null);
      showToast('Perubahan data kunjungan berhasil disimpan!', 'success');
      await loadData();
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Maaf, perubahan data belum berhasil disimpan. Silakan coba lagi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteKunjungan = async () => {
    if (!deleteKunjunganId || saving) return;
    setSaving(true);
    try {
      await api.deleteKunjungan(deleteKunjunganId);
      setDeleteKunjunganId(null);
      showToast('Data kunjungan berhasil dihapus!', 'success');
      await loadData();
    } catch (err) {
      showToast(getFriendlyErrorMessage(err, 'Maaf, data kunjungan belum berhasil dihapus. Silakan coba lagi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Kunjungan yang terkait dengan paket yang dipilih (terbaru di atas)
  const paketKunjungan = selectedPaket
    ? kunjunganList
      .filter((k) => k.paket_id === selectedPaket.paket_id)
      .sort((a, b) => {
        const dateA = a.tanggal_kunjungan ? String(a.tanggal_kunjungan) : '';
        const dateB = b.tanggal_kunjungan ? String(b.tanggal_kunjungan) : '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return String(b.kunjungan_id || '').localeCompare(String(a.kunjungan_id || ''));
      })
    : [];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 pb-44 sm:pb-12 animate-in fade-in-50">

      {/* Header */}
      <Card>
        <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4 border-0 pb-0">
          <div className="flex items-center gap-3">
            <Package className="size-7 text-primary" />
            <div>
              <CardTitle>Manajemen Paket Kunjungan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klik paket untuk melihat detail &amp; riwayat kunjungan
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="w-full sm:w-auto font-bold h-11 sm:h-10 justify-center text-sm whitespace-nowrap"
            >
              <FileSpreadsheet className="size-4 shrink-0" />
              <span>Import Spreadsheet</span>
            </Button>
            <Button
              type="button"
              onClick={() => { setShowModal(true); setErrorMsg(''); setSuccessMsg(''); }}
              className="w-full sm:w-auto font-black h-11 sm:h-10 justify-center text-sm whitespace-nowrap"
            >
              <PlusCircle className="size-4 shrink-0" />
              <span>Buat Paket Baru</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        initialType="paket"
        onImportSuccess={loadData}
        api={api}
        showToast={showToast}
      />

      {/* Package Calculator */}
      <PackageCalculator
        priceValue={simPrice}
        onPriceChange={setSimPrice}
        sessionsValue={simSessions}
        onSessionsChange={setSimSessions}
      />

      {/* Success Notification */}
      {successMsg && (
        <Alert className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="font-bold text-base">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Package List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingData ? (
          <>
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-36" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : paketList.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              type="paket"
              action={{
                label: 'Buat Paket Baru',
                onClick: () => {
                  setShowModal(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                },
              }}
            />
          </div>
        ) : (
          paketList.map((pkt) => {
            const isPeek = Boolean(peekPaketMap[pkt.paket_id]);
            const relatedCount = kunjunganList.filter((k) => k.paket_id === pkt.paket_id).length;
            const displayTerpakai = Math.max(Number(pkt.terpakai || 0), relatedCount);
            const displaySisa = Math.max(0, Number(pkt.total_kunjungan) - displayTerpakai);
            const isAktif = pkt.status_paket === 'aktif' && displaySisa > 0;
            const progressPercent = Math.round((displayTerpakai / Number(pkt.total_kunjungan)) * 100);
            const valPerSession = calculateValuePerSession(pkt.harga_paket, pkt.total_kunjungan);

            return (
              <Card
                key={pkt.paket_id}
                onClick={() => handleOpenDetailModal(pkt)}
                className={`cursor-pointer hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] ${isAktif ? 'border-primary/40' : 'opacity-75'
                  }`}
              >
                <CardContent className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {pkt.paket_id}
                      </span>
                      <h3 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                        <User className="size-5 text-primary" />
                        {pkt.nama_pasien}
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Phone className="size-3.5" />
                        {pkt.no_telp || 'Tanpa no telp'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Stop propagation so privacy toggle doesn't open the drawer */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <PrivacyPeekButton
                          isRevealed={isPeek}
                          onToggle={() => togglePaketPeek(pkt.paket_id)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(pkt, e)}
                        className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="Edit Paket"
                      >
                        <Pencil className="size-4 text-primary" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeletePaketModal(pkt, e)}
                        className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Hapus Paket"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </button>
                      <Badge variant={isAktif ? 'success' : 'secondary'} className="uppercase">
                        {isAktif ? 'Aktif' : 'Selesai'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-muted-foreground">Sisa Kunjungan:</span>
                      <span className="text-xl font-black text-primary">
                        {displaySisa} / {pkt.total_kunjungan} Kunjungan
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground font-medium pt-1">
                      <span>Terpakai: {displayTerpakai}x</span>
                      <span>Beli: {pkt.tanggal_beli ? formatDateLocal(pkt.tanggal_beli) : '-'}</span>
                    </div>
                  </div>

                  {/* Harga */}
                  <div
                    className="bg-secondary/50 p-3 rounded-2xl border border-border space-y-1 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-muted-foreground">Harga Total Paket:</span>
                      <PrivacyAmount
                        amount={pkt.harga_paket}
                        isRevealed={isPeek}
                        onToggle={() => togglePaketPeek(pkt.paket_id)}
                        className="font-black text-foreground"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                      <span className="text-muted-foreground font-medium">Nilai per Sesi (Kalkulasi):</span>
                      <PrivacyAmount
                        amount={valPerSession}
                        isRevealed={isPeek}
                        onToggle={() => togglePaketPeek(pkt.paket_id)}
                        className="font-bold text-primary"
                      />
                    </div>
                  </div>

                  {/* Clickable hint */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground/70 font-medium">
                    <span>{relatedCount} kunjungan tercatat</span>
                    <span className="flex items-center gap-0.5 text-primary/70 font-bold">
                      Lihat detail <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ─── Detail Paket Modal ─── */}
      {shouldRenderDetailModal && currentPaket && createPortal(
        <div
          onClick={() => setSelectedPaket(null)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
            isDetailModalMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className={`p-0 border-0 sm:border-2 border-primary/40 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-xl md:max-w-2xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform ${
              isDetailModalMounted
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
            }`}
          >
            {/* Modal Header */}
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shrink-0 bg-card">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Package className="size-5 sm:size-6 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg md:text-xl font-black text-foreground truncate">
                      {currentPaket.nama_pasien}
                    </CardTitle>
                    <Badge
                      variant={
                        currentPaket.status_paket === 'aktif' && Number(currentPaket.sisa_kunjungan) > 0
                          ? 'success' : 'secondary'
                      }
                      className="uppercase font-bold text-[10px] sm:text-xs shrink-0"
                    >
                      {currentPaket.status_paket === 'aktif' && Number(currentPaket.sisa_kunjungan) > 0
                        ? 'Aktif' : 'Selesai'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{currentPaket.paket_id}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPaket(null)}
                className="text-muted-foreground font-black text-xl size-9 rounded-xl hover:bg-secondary shrink-0"
              >
                ✕
              </Button>
            </CardHeader>

            {/* Scrollable content */}
            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">

              {/* Paket Summary Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <Phone className="size-3.5 text-primary" />
                    {currentPaket.no_telp || 'Tanpa no telp'}
                  </div>

                  {/* Action Buttons moved into summary card */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(currentPaket)}
                      className="font-bold h-8 text-xs rounded-xl gap-1.5 bg-background shadow-2xs"
                    >
                      <Pencil className="size-3.5 text-primary shrink-0" />
                      <span>Edit Paket</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenDeletePaketModal(currentPaket, e)}
                      className="font-bold h-8 text-xs rounded-xl gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 bg-background shadow-2xs"
                    >
                      <Trash2 className="size-3.5 shrink-0" />
                      <span>Hapus</span>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-muted-foreground">Sisa Kunjungan:</span>
                  <span className="text-xl font-black text-primary">
                    {currentSisa} / {currentPaket.total_kunjungan} Sesi
                  </span>
                </div>
                <Progress
                  value={Math.round((currentTerpakai / Number(currentPaket.total_kunjungan)) * 100)}
                  className="h-2.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Terpakai: {currentTerpakai}x</span>
                  <span>Beli: {currentPaket.tanggal_beli ? formatDateLocal(currentPaket.tanggal_beli) : '-'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary/20 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Harga Paket</span>
                    <span className="font-black text-foreground">
                      Rp {Number(currentPaket.harga_paket).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Metode Bayar</span>
                    <span className="font-black text-foreground capitalize">
                      {currentPaket.metode_pembayaran === 'transfer' ? 'Transfer' : 'Cash'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block">Nilai per Sesi</span>
                    <span className="font-black text-primary">
                      Rp {calculateValuePerSession(currentPaket.harga_paket, currentPaket.total_kunjungan).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kunjungan List Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Kunjungan Terkait ({paketKunjungan.length})
                </h3>
                {onNavigate && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Pass patient & paket context so KunjunganFormPage pre-fills the form.
                      // biaya = nilai per sesi (harga_paket / total_kunjungan)
                      const nilaiPerSesi = currentPaket.total_kunjungan
                        ? Math.round(Number(currentPaket.harga_paket) / Number(currentPaket.total_kunjungan))
                        : 0;
                      onNavigate('catat', {
                        nama_pasien: currentPaket.nama_pasien,
                        no_telp: currentPaket.no_telp || '',
                        pasien_id: currentPaket.pasien_id,
                        paket_id: currentPaket.paket_id,
                        biaya: nilaiPerSesi,
                      });
                      setSelectedPaket(null);
                    }}
                  >
                    <PlusCircle className="size-3.5" />
                    Catat Kunjungan
                  </Button>
                )}
              </div>

              {/* Kunjungan Cards */}
              {paketKunjungan.length === 0 ? (
                <EmptyState
                  type="riwayat"
                  title="Belum Ada Kunjungan"
                  description="Catat kunjungan dari tab 'Catat Kunjungan' dan pilih paket ini."
                  variant="simple"
                />
              ) : (
                <div className="space-y-3">
                  {paketKunjungan.map((item) => (
                    <KunjunganCard
                      key={item.kunjungan_id}
                      item={item}
                      showPatientName={false}
                      isRevealed={true}
                      updatingId={updatingKunjunganId}
                      pendingStatus={pendingKunjunganStatus}
                      onUpdateStatus={handleUpdateKunjunganStatus}
                      onEdit={handleOpenEditKunjungan}
                      onDelete={(id) => setDeleteKunjunganId(id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* ─── Modal: Buat Paket Baru ─── */}
      {shouldRenderCreateModal && createPortal(
        <div
          onClick={() => setShowModal(false)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
            isCreateModalMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className={`p-0 border-0 sm:border-2 border-primary/40 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-lg md:max-w-xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform ${
              isCreateModalMounted
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shrink-0 bg-card">
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                <Package className="size-6 sm:size-7 text-primary" />
                Buat Paket Kunjungan Baru
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground font-black text-xl"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">
              {errorMsg && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-bold text-base">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreatePaket} className="space-y-4 sm:space-y-5">
                <PatientAutocomplete
                  value={namaPasien}
                  onChange={setNamaPasien}
                  onSelectPatient={handleSelectPatient}
                  phoneValue={noTelp}
                  onPhoneChange={setNoTelp}
                />

                <PackageCalculator
                  priceValue={hargaPaket}
                  onPriceChange={setHargaPaket}
                  sessionsValue={totalKunjungan}
                  onSessionsChange={setTotalKunjungan}
                  showCardWrapper={false}
                />

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Calendar className="size-4 sm:size-5 text-primary" />
                    Tanggal Pembelian
                  </label>
                  <DatePicker
                    value={tanggalBeli}
                    onChange={setTanggalBeli}
                    placeholder="Pilih tanggal pembelian..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Wallet className="size-4 sm:size-5 text-primary" />
                    Metode Pembayaran Paket
                  </label>
                  <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                    <SelectTrigger className="w-full h-12 sm:h-13 px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs touch-input">
                      <SelectValue placeholder="Pilih metode..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl z-50">
                      <SelectItem value="cash">Cash (Tunai)</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">
                    *Metode ini otomatis digunakan pada catatan kunjungan pertama.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setShowModal(false)}
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
                      <><Spinner className="size-4 sm:size-5 shrink-0" /><span className="truncate">Menyimpan...</span></>
                    ) : (
                      <><CheckCircle2 className="size-4 sm:size-5 shrink-0" /><span className="truncate">Simpan Paket</span></>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* ─── Modal: Edit Paket Kunjungan ─── */}
      {shouldRenderEditPaketModal && editPaketData && createPortal(
        <div
          onClick={() => setShowEditModal(false)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
            isEditPaketModalMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className={`p-0 border-0 sm:border-2 border-primary/40 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-lg md:max-w-xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform ${
              isEditPaketModalMounted
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shrink-0 bg-card">
              <div>
                <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                  <Pencil className="size-5 sm:size-6 text-primary" />
                  Edit Paket Kunjungan
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{editPaketData.paket_id}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground font-black text-xl"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">
              {errorMsg && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-bold text-base">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSaveEditPaket} className="space-y-4 sm:space-y-5">
                {/* Patient Autocomplete Input */}
                <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl bg-secondary/60 border border-border">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Informasi Pasien Pemilik Paket
                  </div>
                  <PatientAutocomplete
                    value={editNamaPasien}
                    onChange={setEditNamaPasien}
                    onSelectPatient={(p) => {
                      setEditNamaPasien(p.nama_pasien || '');
                      setEditNoTelp(String(p.no_telp || ''));
                    }}
                    phoneValue={editNoTelp}
                    onPhoneChange={setEditNoTelp}
                  />
                  <p className="text-[11px] text-muted-foreground font-medium pt-1">
                    *Mengubah nama pasien akan otomatis memperbarui seluruh catatan kunjungan yang terikat dengan paket ini.
                  </p>
                </div>

                <PackageCalculator
                  priceValue={editHargaPaket}
                  onPriceChange={setEditHargaPaket}
                  sessionsValue={editTotalKunjungan}
                  onSessionsChange={setEditTotalKunjungan}
                  showCardWrapper={false}
                />

                {/* Terpakai & Sisa Kunjungan (Otomatis) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-secondary/60 border border-border">
                  <div>
                    <span className="text-[11px] sm:text-xs font-bold text-muted-foreground block mb-1">
                      Sesi Terpakai (Otomatis)
                    </span>
                    <span className="font-black text-base sm:text-lg text-foreground">
                      {Number(editPaketData.terpakai || 0)} Sesi
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-bold text-muted-foreground block mb-1">
                      Sisa Sesi (Otomatis)
                    </span>
                    <span className="font-black text-base sm:text-lg text-primary">
                      {Math.max(0, Number(editTotalKunjungan || 0) - Number(editPaketData.terpakai || 0))} Sesi
                    </span>
                  </div>
                </div>

                {/* Tanggal Beli */}
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Calendar className="size-4 sm:size-5 text-primary" />
                    Tanggal Pembelian
                  </label>
                  <DatePicker
                    value={editTanggalBeli}
                    onChange={setEditTanggalBeli}
                    placeholder="Pilih tanggal..."
                  />
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Wallet className="size-4 sm:size-5 text-primary" />
                    Metode Pembayaran Paket
                  </label>
                  <Select value={editMetodePembayaran} onValueChange={setEditMetodePembayaran}>
                    <SelectTrigger className="w-full h-12 sm:h-13 px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs touch-input">
                      <SelectValue placeholder="Pilih metode..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl z-50">
                      <SelectItem value="cash">Cash (Tunai)</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Paket (Otomatis) */}
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    Status Paket (Otomatis)
                  </label>
                  <div className="h-12 px-4 flex items-center justify-between font-bold text-sm bg-secondary/80 rounded-xl border border-input">
                    <span className="text-muted-foreground text-xs font-semibold">*Otomatis dari sisa kuota sesi</span>
                    {Math.max(0, Number(editTotalKunjungan || 0) - Number(editPaketData.terpakai || 0)) <= 0 ? (
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs">
                        <CheckCircle2 className="size-3.5 mr-1 text-amber-500" /> Selesai / Habis
                      </Badge>
                    ) : (
                      <Badge variant="success" className="font-bold text-xs">
                        <CheckCircle2 className="size-3.5 mr-1" /> Aktif
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setShowEditModal(false)}
                    className="w-1/3 sm:w-auto px-4 h-12 sm:h-13 text-base font-bold rounded-xl sm:rounded-2xl gap-1.5 shrink-0"
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
                      <><Spinner className="size-4 sm:size-5 shrink-0" /><span className="truncate">Menyimpan...</span></>
                    ) : (
                      <><CheckCircle2 className="size-4 sm:size-5 shrink-0" /><span className="truncate">Simpan Perubahan</span></>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}

      {/* ─── Delete Kunjungan Confirmation Modal ─── */}
      <ConfirmModal
        isOpen={Boolean(deleteKunjunganId)}
        onClose={() => setDeleteKunjunganId(null)}
        onConfirm={handleConfirmDeleteKunjungan}
        title="Hapus Catatan Kunjungan"
        description="Apakah Anda yakin ingin menghapus data kunjungan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="destructive"
        icon={Trash2}
        isLoading={saving}
      />

      {/* ─── Delete Paket Confirmation Modal ─── */}
      <ConfirmModal
        isOpen={Boolean(deletePaketTarget)}
        onClose={() => setDeletePaketTarget(null)}
        onConfirm={handleConfirmDeletePaket}
        title="Hapus Paket Kunjungan"
        description={
          deletePaketTarget
            ? `Apakah Anda yakin ingin menghapus Paket (${deletePaketTarget.paket_id}) atas nama ${deletePaketTarget.nama_pasien || ''}? Seluruh catatan kunjungan yang terikat dengan paket ini juga akan ikut terhapus secara otomatis.`
            : 'Apakah Anda yakin ingin menghapus Paket ini?'
        }
        confirmText="Ya, Hapus Paket"
        cancelText="Batal"
        variant="destructive"
        icon={Trash2}
        isLoading={saving}
      />

      {/* ─── Modal: Edit Kunjungan ─── */}
      {shouldRenderEditKunjunganModal && activeEditingKunjungan && createPortal(
        <div
          onClick={() => setEditingKunjungan(null)}
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
            isEditKunjunganModalMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className={`p-0 border-0 sm:border-2 border-primary/40 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-lg md:max-w-xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform ${
              isEditKunjunganModalMounted
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] shrink-0 bg-card">
              <CardTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
                <Pencil className="size-5 sm:size-6 text-primary shrink-0" />
                <span>Edit Kunjungan ({currentEditKunjungan.kunjungan_id})</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingKunjungan(null)}
                className="text-muted-foreground font-black text-xl"
              >
                ✕
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">
              <form onSubmit={handleSaveEditKunjungan} className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <User className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Nama Pasien
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={currentEditKunjungan.nama_pasien || ''}
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

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <Calendar className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Tanggal Kunjungan
                  </label>
                  <DatePicker
                    value={currentEditKunjungan.tanggal_kunjungan}
                    onChange={(dateVal) =>
                      updateEditingKunjungan({ ...currentEditKunjungan, tanggal_kunjungan: dateVal })
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
                    value={currentEditKunjungan.biaya}
                    onChange={(e) =>
                      updateEditingKunjungan({ ...currentEditKunjungan, biaya: e.target.value })
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
                  <div className="h-12 px-4 flex items-center font-bold text-sm bg-secondary/80 text-muted-foreground rounded-xl border border-input">
                    <Lock className="size-4 mr-2 shrink-0 text-muted-foreground" /> {currentEditKunjungan.metode_pembayaran === 'transfer' ? 'Transfer Bank' : 'Tunai / Cash'} (Patokan Paket)
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground mb-1.5">
                    <CheckCircle2 className="size-4 sm:size-4.5 text-primary shrink-0" />
                    Status Pembayaran
                  </label>
                  <div className="h-12 px-4 flex items-center font-bold text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="size-4.5 mr-2 shrink-0" /> Lunas (Terbayar Paket)
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setEditingKunjungan(null)}
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
                      <><Spinner className="size-4 sm:size-5 shrink-0" /><span className="truncate">Menyimpan...</span></>
                    ) : (
                      <><CheckCircle2 className="size-4 sm:size-5 shrink-0" /><span className="truncate">Simpan Perubahan</span></>
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
