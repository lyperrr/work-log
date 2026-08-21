import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getTodayDateString } from '../lib/utils';
import { PatientAutocomplete } from '../components/common/PatientAutocomplete';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Spinner } from '../components/ui/spinner';
import {
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Info,
} from 'lucide-react';

export function KunjunganFormPage({ onSaved, prefill }) {
  const { showToast } = useToast();
  const { api } = useAuth();

  const [namaPasien, setNamaPasien] = useState(() => prefill?.nama_pasien || '');
  const [noTelp, setNoTelp] = useState(() => String(prefill?.no_telp || ''));
  const [tanggalKunjungan, setTanggalKunjungan] = useState(
    getTodayDateString()
  );
  const [biaya, setBiaya] = useState(() =>
    prefill?.biaya != null ? Number(prefill.biaya) : 300000
  );
  const [metodePembayaran, setMetodePembayaran] = useState('cash');
  const [status, setStatus] = useState('menunggu');

  // Pre-select paket from prefill; updated after allPakets loads
  const [selectedPaketId, setSelectedPaketId] = useState(
    prefill?.paket_id || 'none'
  );
  const [allPakets, setAllPakets] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [activePaketList, setActivePaketList] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all pakets & visits; re-fetch whenever `api` changes (e.g. login)
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getPaketList().catch(() => []),
      api.getKunjunganList().catch(() => []),
    ]).then(([pakets, visits]) => {
      if (isMounted) {
        setAllPakets(pakets || []);
        setAllVisits(visits || []);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [api]);

  // In-memory filter active pakets for current patient name.
  // When a prefill is provided (coming from PaketPage), we also ensure the
  // specific prefill.paket_id is pre-selected once allPakets has loaded.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!namaPasien || !namaPasien.trim()) {
        setActivePaketList([]);
        setSelectedPaketId('none');
        return;
      }

      const filtered = allPakets.filter(
        (p) =>
          (p.nama_pasien || '').toLowerCase().trim() === namaPasien.toLowerCase().trim() &&
          (p.status_paket || '').toLowerCase() === 'aktif' &&
          Number(p.sisa_kunjungan || 0) > 0
      );
      setActivePaketList(filtered);

      // If a paket was pre-selected via prefill, keep it selected as long as
      // it's in the filtered list. Otherwise fall back to the first active one.
      if (prefill?.paket_id && filtered.some((p) => p.paket_id === prefill.paket_id)) {
        setSelectedPaketId(prefill.paket_id);
      } else {
        setSelectedPaketId(filtered.length > 0 ? filtered[0].paket_id : 'none');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [namaPasien, allPakets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamically update `biaya` whenever the selected Paket changes
  useEffect(() => {
    if (selectedPaketId && selectedPaketId !== 'none') {
      const targetPaket = allPakets.find((p) => p.paket_id === selectedPaketId);
      if (targetPaket && Number(targetPaket.total_kunjungan) > 0) {
        const perSessionVal = Math.round(
          Number(targetPaket.harga_paket || 0) / Number(targetPaket.total_kunjungan)
        );
        const timer = setTimeout(() => setBiaya(perSessionVal), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedPaketId, allPakets]);

  const handlePatientNameChange = (val) => {
    setNamaPasien(val);
  };

  const handleSelectPatient = (patient) => {
    if (patient) {
      setNoTelp(String(patient.no_telp || ''));

      // Auto-fill biaya dari kunjungan terakhir HANYA jika tidak sedang memakai paket
      if (selectedPaketId === 'none') {
        const lastVisit = allVisits.find(
          (k) => (k.nama_pasien || '').toLowerCase().trim() === (patient.nama_pasien || '').toLowerCase().trim()
        );
        if (lastVisit && lastVisit.biaya !== undefined && lastVisit.biaya !== null) {
          setBiaya(Number(lastVisit.biaya));
        }
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
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
    if (biaya === '' || biaya === undefined || biaya === null || Number(biaya) < 0) {
      const msg = 'Biaya / Nominal harus berupa angka 0 atau lebih.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    setSaving(true);
    try {
      const patientRecord = await api.saveOrGetPasienByName(namaPasien, noTelp);

      const usePaket = selectedPaketId !== 'none' ? selectedPaketId : null;

      const newKunjungan = await api.createKunjungan({
        pasien_id: patientRecord?.pasien_id || '',
        nama_pasien: patientRecord?.nama_pasien || namaPasien,
        no_telp: patientRecord?.no_telp || noTelp,
        tanggal_kunjungan: tanggalKunjungan,
        biaya: Number(biaya),
        metode_pembayaran: metodePembayaran,
        status: status,
        paket_id: usePaket || '',
      });

      let successText = `Catatan kunjungan (${newKunjungan?.kunjungan_id || 'baru'}) berhasil disimpan untuk ${patientRecord?.nama_pasien || namaPasien}!`;
      if (usePaket) successText += ` 1 kunjungan dipotong dari paket ${usePaket}.`;

      setSuccessMsg(successText);
      showToast(successText, 'success');

      setNamaPasien('');
      setNoTelp('');
      setBiaya(300000);
      setStatus('menunggu');
      setMetodePembayaran('cash');
      setSelectedPaketId('none');
      setActivePaketList([]);

      if (onSaved) {
        setTimeout(() => { onSaved(); }, 1200);
      }
    } catch (err) {
      const errorText = err.message || 'Gagal menyimpan catatan kunjungan.';
      setErrorMsg(errorText);
      showToast(errorText, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="">
          <div className="flex items-center gap-3">
            <PlusCircle className="size-7 shrink-0 text-primary" />
            <div>
              <CardTitle className="text-xl md:text-2xl font-black">
                Catat Kunjungan Baru
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">
                Isi formulir berikut untuk mencatat sesi kunjungan pasien & pembayaran
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 space-y-6">
          {errorMsg && (
            <Alert variant="destructive" className="rounded-2xl border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="font-bold text-base">
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* Context banner shown when form is opened from a paket card */}
          {prefill?.paket_id && (
            <div className="flex items-center gap-3 bg-primary/8 border border-primary/25 rounded-2xl px-4 py-3">
              <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Package className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-primary uppercase tracking-wide">
                  Melanjutkan Paket
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {prefill.nama_pasien} &nbsp;
                  <span className="font-mono text-xs text-muted-foreground">
                    {prefill.paket_id}
                  </span>
                </p>
              </div>
            </div>
          )}


          {successMsg && (
            <Alert className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500/30 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <AlertDescription className="font-bold text-base">
                {successMsg}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <PatientAutocomplete
              value={namaPasien}
              onChange={handlePatientNameChange}
              onSelectPatient={handleSelectPatient}
              phoneValue={noTelp}
              onPhoneChange={setNoTelp}
            />

            {/* Active Package Selector */}
            {activePaketList.length > 0 && (
              <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Package className="size-4" />
                  Gunakan Paket Aktif Pasien Ini?
                </label>
                <Select value={selectedPaketId} onValueChange={setSelectedPaketId}>
                  <SelectTrigger className="w-full h-13 px-4 bg-card border-2 border-primary/40 font-bold text-base md:text-lg rounded-xl">
                    <SelectValue placeholder="Pilih paket..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none">
                      Tidak Menggunakan Paket (Bayar Mandiri / Eceran)
                    </SelectItem>
                    {activePaketList.map((pkt) => (
                      <SelectItem key={pkt.paket_id} value={pkt.paket_id}>
                        {pkt.paket_id} - Sisa {pkt.sisa_kunjungan} dari {pkt.total_kunjungan} Kunjungan
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-medium">
                  *Jika memilih paket, 1 kuota kunjungan akan otomatis terpotong.
                </p>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
                <Calendar className="size-5 text-primary" />
                Tanggal Kunjungan
              </label>
              <DatePicker
                value={tanggalKunjungan}
                onChange={setTanggalKunjungan}
                placeholder="Pilih tanggal..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
                <DollarSign className="size-5 text-primary" />
                Biaya / Nominal Sesi (Rp)
              </label>
              <Input
                type="number"
                value={biaya}
                onChange={(e) => setBiaya(e.target.value)}
                placeholder="300000"
                step="5000"
                min="0"
                className="w-full h-13 px-4 text-base md:text-lg border-2 border-input rounded-xl bg-background font-bold touch-input shadow-xs"
              />
              {selectedPaketId !== 'none' && (() => {
                const curPkt = allPakets.find((p) => p.paket_id === selectedPaketId);
                if (!curPkt) return null;
                const hp = Number(curPkt.harga_paket || 0);
                const tk = Number(curPkt.total_kunjungan || 1);
                const calc = Math.round(hp / tk);
                return (
                  <p className="text-xs text-muted-foreground font-medium mt-1.5 flex items-center gap-1.5 bg-primary/5 p-2 rounded-lg border border-primary/20">
                    <Info className="size-4 text-primary shrink-0" />
                    <span>
                      Dihitung otomatis: <strong>Harga Paket (Rp {hp.toLocaleString('id-ID')})</strong> ÷ <strong>{tk} Sesi</strong> = <strong>Rp {calc.toLocaleString('id-ID')} / sesi</strong>.
                    </span>
                  </p>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
                  <CreditCard className="size-5 text-primary" />
                  Metode Pembayaran
                </label>
                <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                  <SelectTrigger className="w-full h-13 px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs">
                    <SelectValue placeholder="Pilih metode..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="cash">Tunai / Cash</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
                  <CheckCircle2 className="size-5 text-primary" />
                  Status Pembayaran
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full h-13 px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs">
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="menunggu">Menunggu Konfirmasi</SelectItem>
                    <SelectItem value="belum bayar">Belum Bayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            <Button
              type="submit"
              disabled={saving}
              className="w-full py-7 font-black text-lg rounded-2xl shadow-lg shadow-primary/20 touch-btn mt-4"
            >
              {saving ? (
                <>
                  <Spinner className="size-5" />
                  Menyimpan Catatan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-6" />
                  Simpan Catatan Kunjungan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
