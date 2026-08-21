import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { PatientAutocomplete } from '../components/common/PatientAutocomplete';
import { PackageCalculator, calculateValuePerSession } from '../components/common/PackageCalculator';
import { DatePicker } from '../components/common/DatePicker';
import { KunjunganCard } from '../components/common/KunjunganCard';
import { EmptyState } from '../components/common/EmptyState';
import { ImportModal } from '../components/common/ImportModal';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import {
  Package,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Phone,
  ChevronRight,
  ArrowLeft,
  FileSpreadsheet,
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
  const [showImportModal, setShowImportModal] = useState(false);

  // Detail drawer
  const [selectedPaket, setSelectedPaket] = useState(null);
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
    try {
      const [pakets, kunjungans] = await Promise.all([
        api.getPaketList().catch(() => []),
        api.getKunjunganList().catch(() => []),
      ]);
      setPaketList(sortDesc(pakets, 'paket_id'));
      setKunjunganList(sortDesc(kunjungans, 'kunjungan_id'));
    } catch (err) {
      showToast(err.message || 'Gagal memuat data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
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
        if (active) showToast(err.message || 'Gagal memuat data', 'error');
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
      showToast(`Status pembayaran (${kunjunganId}) berhasil diubah ke '${newStatus}'`, 'success');
    } catch (err) {
      setPendingKunjunganStatus((prev) => {
        const n = { ...prev }; delete n[kunjunganId]; return n;
      });
      showToast(err.message || 'Gagal memperbarui status pembayaran', 'error');
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
  const [tanggalBeli, setTanggalBeli] = useState(new Date().toISOString().split('T')[0]);
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
      const newPaket = await api.createPaket({
        pasien_id: patientRecord.pasien_id,
        total_kunjungan: numSessions,
        harga_paket: Number(hargaPaket),
        tanggal_beli: tanggalBeli,
      });
      const successText = `Paket (${newPaket.paket_id}) berhasil dibuat untuk ${patientRecord.nama_pasien}!`;
      setSuccessMsg(successText);
      showToast(successText, 'success');
      setShowModal(false);
      setNamaPasien(''); setNoTelp(''); setTotalKunjungan(5); setHargaPaket(1500000);
      await loadData();
    } catch (err) {
      const errorText = err.message || 'Gagal membuat paket baru.';
      setErrorMsg(errorText);
      showToast(errorText, 'error');
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
    <div className="space-y-6 animate-in fade-in-50">

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
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="flex-1 md:flex-none font-bold"
            >
              <FileSpreadsheet className="size-4" />
              Import Spreadsheet
            </Button>
            <Button
              type="button"
              onClick={() => { setShowModal(true); setErrorMsg(''); setSuccessMsg(''); }}
              className="flex-1 md:flex-none font-black"
            >
              <PlusCircle className="size-4" />
              Buat Paket Baru
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
            const isAktif = pkt.status_paket === 'aktif' && Number(pkt.sisa_kunjungan) > 0;
            const progressPercent = Math.round((Number(pkt.terpakai) / Number(pkt.total_kunjungan)) * 100);
            const valPerSession = calculateValuePerSession(pkt.harga_paket, pkt.total_kunjungan);
            const isPeek = Boolean(peekPaketMap[pkt.paket_id]);
            const relatedCount = kunjunganList.filter((k) => k.paket_id === pkt.paket_id).length;

            return (
              <Card
                key={pkt.paket_id}
                onClick={() => setSelectedPaket(pkt)}
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

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stop propagation so privacy toggle doesn't open the drawer */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <PrivacyPeekButton
                          isRevealed={isPeek}
                          onToggle={() => togglePaketPeek(pkt.paket_id)}
                        />
                      </div>
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
                        {pkt.sisa_kunjungan} / {pkt.total_kunjungan} Kunjungan
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground font-medium pt-1">
                      <span>Terpakai: {pkt.terpakai}x</span>
                      <span>Beli: {pkt.tanggal_beli ? String(pkt.tanggal_beli).split('T')[0] : '-'}</span>
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

      {/* ─── Detail Drawer ─── */}
      {selectedPaket && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-50"
          onClick={() => setSelectedPaket(null)}
        >
          <div
            className="absolute inset-y-0 right-0 w-full max-w-lg bg-background shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-background sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setSelectedPaket(null)}
                className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-base truncate">{selectedPaket.nama_pasien}</h2>
                <p className="text-xs text-muted-foreground font-mono">{selectedPaket.paket_id}</p>
              </div>
              <Badge
                variant={
                  selectedPaket.status_paket === 'aktif' && Number(selectedPaket.sisa_kunjungan) > 0
                    ? 'success' : 'secondary'
                }
                className="uppercase shrink-0"
              >
                {selectedPaket.status_paket === 'aktif' && Number(selectedPaket.sisa_kunjungan) > 0
                  ? 'Aktif' : 'Selesai'}
              </Badge>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* Paket Summary Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3.5" />
                  {selectedPaket.no_telp || 'Tanpa no telp'}
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-muted-foreground">Sisa Kunjungan:</span>
                  <span className="text-xl font-black text-primary">
                    {selectedPaket.sisa_kunjungan} / {selectedPaket.total_kunjungan} Sesi
                  </span>
                </div>
                <Progress
                  value={Math.round((Number(selectedPaket.terpakai) / Number(selectedPaket.total_kunjungan)) * 100)}
                  className="h-2.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Terpakai: {selectedPaket.terpakai}x</span>
                  <span>Beli: {selectedPaket.tanggal_beli ? String(selectedPaket.tanggal_beli).split('T')[0] : '-'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/20 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Harga Paket</span>
                    <span className="font-black text-foreground">
                      Rp {Number(selectedPaket.harga_paket).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block">Nilai per Sesi</span>
                    <span className="font-black text-primary">
                      Rp {calculateValuePerSession(selectedPaket.harga_paket, selectedPaket.total_kunjungan).toLocaleString('id-ID')}
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
                      const nilaiPerSesi = selectedPaket.total_kunjungan
                        ? Math.round(Number(selectedPaket.harga_paket) / Number(selectedPaket.total_kunjungan))
                        : 0;
                      onNavigate('catat', {
                        nama_pasien: selectedPaket.nama_pasien,
                        no_telp: selectedPaket.no_telp || '',
                        pasien_id: selectedPaket.pasien_id,
                        paket_id: selectedPaket.paket_id,
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── Modal: Buat Paket Baru ─── */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
          <Card className="border-2 border-primary/40 rounded-3xl max-w-lg w-full shadow-2xl my-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Package className="size-7 text-primary" />
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

            <CardContent className="p-6 md:p-8 space-y-5">
              {errorMsg && (
                <Alert variant="destructive" className="rounded-2xl border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-bold text-base">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreatePaket} className="space-y-5">
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
                  <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
                    <Calendar className="size-5 text-primary" />
                    Tanggal Pembelian
                  </label>
                  <DatePicker
                    value={tanggalBeli}
                    onChange={setTanggalBeli}
                    placeholder="Pilih tanggal pembelian..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    onClick={() => setShowModal(false)}
                    className="w-1/2 py-6 text-base font-bold rounded-2xl touch-btn"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-1/2 py-6 text-base font-black rounded-2xl shadow-lg touch-btn"
                  >
                    {saving ? (
                      <><Spinner className="mr-2" />Menyimpan...</>
                    ) : (
                      <><CheckCircle2 className="size-5" />Simpan Paket</>
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
