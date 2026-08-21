import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { PatientAutocomplete } from '../components/common/PatientAutocomplete';
import { PackageCalculator, calculateValuePerSession } from '../components/common/PackageCalculator';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../components/ui/empty';
import { Spinner } from '../components/ui/spinner';
import {
  Package,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Phone,
} from 'lucide-react';

export function PaketPage() {
  const { showToast } = useToast();
  const { api } = useAuth();
  usePrivacy();
  const [paketList, setPaketList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [peekPaketMap, setPeekPaketMap] = useState({});

  const loadData = async () => {
    try {
      const data = await api.getPaketList();
      setPaketList(data);
    } catch (err) {
      showToast(err.message || 'Gagal memuat data paket', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePaketPeek = (id) => {
    setPeekPaketMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Form states for new Paket
  const [namaPasien, setNamaPasien] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [totalKunjungan, setTotalKunjungan] = useState(5);
  const [hargaPaket, setHargaPaket] = useState(1500000);
  const [tanggalBeli, setTanggalBeli] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Standalone simulator state
  const [simPrice, setSimPrice] = useState(1500000);
  const [simSessions, setSimSessions] = useState(5);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');


  const handleSelectPatient = (patient) => {
    if (patient) {
      // Always set noTelp from patient record (normalize to string in case
      // Sheets returned the phone number as a numeric type)
      setNoTelp(String(patient.no_telp || ''));
    }
  };

  const handleCreatePaket = async (e) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!namaPasien.trim()) {
      const msg = 'Nama Pasien wajib diisi.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }
    if (!noTelp.trim()) {
      const msg = 'Nomor Telepon wajib diisi.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    const numSessions = Number(totalKunjungan);
    if (!numSessions || numSessions <= 0 || !Number.isInteger(numSessions)) {
      const msg = 'Total sessions must be greater than 0.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
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

      const successText = `Paket baru (${newPaket.paket_id}) berhasil dibuat untuk ${patientRecord.nama_pasien}!`;
      setSuccessMsg(successText);
      showToast(successText, 'success');

      setShowModal(false);
      setNamaPasien('');
      setNoTelp('');
      setTotalKunjungan(5);
      setHargaPaket(1500000);

      await loadData();
    } catch (err) {
      const errorText = err.message || 'Gagal membuat paket baru.';
      setErrorMsg(errorText);
      showToast(errorText, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">

      {/* Header section with Create button */}
      <Card>
        <CardHeader className="flex-col md:flex-row items-start md:items-center justify-between gap-4 border-0">
          <div className="flex items-center gap-3">
            <Package className="size-7 text-primary" />
            <div>
              <CardTitle>
                Manajemen Paket Kunjungan
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Daftar paket aktif & sisa kunjungan milik pasien
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setShowModal(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="w-full md:w-auto"
          >
            <PlusCircle className="size-4" />
            Buat Paket Baru
          </Button>
        </CardHeader>
      </Card>

      {/* Standalone Package Calculation Feature */}
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
          <AlertDescription className="font-bold text-base">
            {successMsg}
          </AlertDescription>
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
          <div className="col-span-full bg-card border-2 border-dashed border-border rounded-3xl p-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package className="size-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="font-bold text-base">Belum Ada Paket Kunjungan</EmptyTitle>
                <EmptyDescription>
                  Belum ada paket kunjungan yang dibuat. Klik tombol "Buat Paket Baru" untuk mendaftarkan paket pasien.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                size="sm"
                onClick={() => {
                  setShowModal(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="mt-2 font-bold"
              >
                <PlusCircle className="size-4 mr-1.5" />
                Buat Paket Baru
              </Button>
            </Empty>
          </div>
        ) : (
          paketList.map((pkt) => {
            const isAktif = pkt.status_paket === 'aktif' && pkt.sisa_kunjungan > 0;
            const progressPercent = Math.round((pkt.terpakai / pkt.total_kunjungan) * 100);
            const valPerSession = calculateValuePerSession(pkt.harga_paket, pkt.total_kunjungan);
            const isPeek = Boolean(peekPaketMap[pkt.paket_id]);

            return (
              <Card
                key={pkt.paket_id}
                className={isAktif ? 'border-primary/40' : 'opacity-80'}
              >
                <CardContent className="space-y-4">
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

                    <div className="flex items-center gap-2">
                      <PrivacyPeekButton
                        isRevealed={isPeek}
                        onToggle={() => togglePaketPeek(pkt.paket_id)}
                      />
                      <Badge variant={isAktif ? 'success' : 'secondary'} className="uppercase">
                        {isAktif ? 'Aktif' : 'Selesai'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
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

                  <div className="bg-secondary/50 p-3 rounded-2xl border border-border space-y-1 text-sm">
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal / Overlay: Buat Paket Baru */}
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
                  <AlertDescription className="font-bold text-base">
                    {errorMsg}
                  </AlertDescription>
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

                {/* Integrated Package Calculator */}
                <PackageCalculator
                  priceValue={hargaPaket}
                  onPriceChange={setHargaPaket}
                  sessionsValue={totalKunjungan}
                  onSessionsChange={setTotalKunjungan}
                  showCardWrapper={false}
                />

                <div>
                  <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
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
                      <>
                        <Spinner className="mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-5 mr-1" />
                        Simpan Paket
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
