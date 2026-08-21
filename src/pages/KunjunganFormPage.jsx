import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
} from 'lucide-react';

export function KunjunganFormPage({ onSaved }) {
  const { showToast } = useToast();
  const { api } = useAuth();

  const [namaPasien, setNamaPasien] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [tanggalKunjungan, setTanggalKunjungan] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [biaya, setBiaya] = useState(300000);
  const [metodePembayaran, setMetodePembayaran] = useState('cash');
  const [status, setStatus] = useState('menunggu');

  const [selectedPaketId, setSelectedPaketId] = useState('none');
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

  // In-memory filter active pakets for current patient name
  useEffect(() => {
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
    setSelectedPaketId(filtered.length > 0 ? filtered[0].paket_id : 'none');
  }, [namaPasien, allPakets]);

  const handlePatientNameChange = (val) => {
    setNamaPasien(val);
  };

  const handleSelectPatient = (patient) => {
    if (patient) {
      // Always set noTelp from patient record — normalize to string in case
      // Sheets returned the phone number as a Number type.
      // Previously only set when truthy, leaving phone empty for patients
      // with no stored phone and causing "Nomor Telepon wajib diisi" error.
      setNoTelp(String(patient.no_telp || ''));

      // Auto-fill biaya dari kunjungan terakhir pasien ini
      const lastVisit = allVisits.find(
        (k) => (k.nama_pasien || '').toLowerCase().trim() === (patient.nama_pasien || '').toLowerCase().trim()
      );
      if (lastVisit && lastVisit.biaya !== undefined && lastVisit.biaya !== null) {
        setBiaya(Number(lastVisit.biaya));
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
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <PlusCircle className="size-7" />
            </div>
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
                <label className="block text-sm font-bold text-primary flex items-center gap-2">
                  <Package className="size-4" />
                  Gunakan Paket Aktif Pasien Ini?
                </label>
                <Select value={selectedPaketId} onValueChange={setSelectedPaketId}>
                  <SelectTrigger className="w-full h-[52px] px-4 bg-card border-2 border-primary/40 font-bold text-base md:text-lg rounded-xl">
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
              <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
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
              <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
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
                className="w-full h-[52px] px-4 text-base md:text-lg border-2 border-input rounded-xl bg-background font-bold touch-input shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  Metode Pembayaran
                </label>
                <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                  <SelectTrigger className="w-full h-[52px] px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs">
                    <SelectValue placeholder="Pilih metode..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="cash">Tunai / Cash</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  Status Pembayaran
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full h-[52px] px-4 border-2 border-input font-bold text-base md:text-lg rounded-xl bg-background shadow-xs">
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
                  <Spinner className="size-5 mr-2" />
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
