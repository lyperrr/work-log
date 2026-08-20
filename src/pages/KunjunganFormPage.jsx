import { useState } from 'react';
import { apiService } from '../services/apiService';
import { useToast } from '../context/ToastContext';
import { PatientAutocomplete } from '../components/common/PatientAutocomplete';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Package,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

export function KunjunganFormPage({ onSaved }) {
  const { showToast } = useToast();

  const [namaPasien, setNamaPasien] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [tanggalKunjungan, setTanggalKunjungan] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [biaya, setBiaya] = useState(300000);
  const [metodePembayaran, setMetodePembayaran] = useState('Transfer');
  const [catatan, setCatatan] = useState('');
  const [status, setStatus] = useState('lunas');

  const [selectedPaketId, setSelectedPaketId] = useState('none');
  const [activePaketList, setActivePaketList] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPatientPakets = (patientName) => {
    if (!patientName || !patientName.trim()) {
      setActivePaketList([]);
      setSelectedPaketId('none');
      return;
    }

    const allPaket = apiService.getPaketList();
    const filtered = allPaket.filter(
      (p) =>
        p.nama_pasien.toLowerCase().trim() === patientName.toLowerCase().trim() &&
        p.status_paket === 'aktif' &&
        p.sisa_kunjungan > 0
    );

    setActivePaketList(filtered);
    if (filtered.length > 0) {
      setSelectedPaketId(filtered[0].paket_id);
    } else {
      setSelectedPaketId('none');
    }
  };

  const handlePatientNameChange = (val) => {
    setNamaPasien(val);
    loadPatientPakets(val);
  };

  const handleSelectPatient = (patient) => {
    if (patient) {
      if (patient.no_telp) {
        setNoTelp(patient.no_telp);
      }
      loadPatientPakets(patient.nama_pasien);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    if (!biaya || Number(biaya) < 0) {
      const msg = 'Biaya / Nominal harus berupa angka 0 atau lebih.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    try {
      const patientRecord = apiService.saveOrGetPasienByName(namaPasien, noTelp);

      const usePaket = selectedPaketId !== 'none' ? selectedPaketId : null;

      const newKunjungan = apiService.createKunjungan({
        pasien_id: patientRecord.pasien_id,
        nama_pasien: patientRecord.nama_pasien,
        no_telp: patientRecord.no_telp,
        tanggal_kunjungan: tanggalKunjungan,
        biaya: Number(biaya),
        metode_pembayaran: metodePembayaran,
        catatan: catatan,
        status: status,
        paket_id: usePaket,
      });

      let successText = `Catatan kunjungan (${newKunjungan.kunjungan_id}) berhasil disimpan untuk ${patientRecord.nama_pasien}!`;

      if (usePaket) {
        successText += ` 1 kunjungan dipotong dari paket ${usePaket}.`;
      }

      setSuccessMsg(successText);
      showToast(successText, 'success');

      setNamaPasien('');
      setNoTelp('');
      setBiaya(300000);
      setCatatan('');
      setStatus('lunas');
      setSelectedPaketId('none');
      setActivePaketList([]);

      if (onSaved) {
        setTimeout(() => {
          onSaved();
        }, 1200);
      }
    } catch (err) {
      const errorText = err.message || 'Gagal menyimpan catatan kunjungan.';
      setErrorMsg(errorText);
      showToast(errorText, 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
      <Card className="border-2 border-primary/20 rounded-3xl shadow-lg overflow-hidden">
        <CardHeader className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border">
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
                  <SelectTrigger className="w-full bg-card border-2 font-bold py-3 text-base rounded-xl">
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
                className="py-3.5 text-lg border-2 rounded-xl font-bold touch-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <CreditCard className="size-5 text-primary" />
                  Metode Pembayaran
                </label>
                <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
                  <SelectTrigger className="w-full border-2 font-bold py-3 text-base rounded-xl">
                    <SelectValue placeholder="Pilih metode..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Transfer">Transfer Bank</SelectItem>
                    <SelectItem value="Tunai">Tunai / Cash</SelectItem>
                    <SelectItem value="QRIS">QRIS / E-Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  Status Pembayaran
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full border-2 font-bold py-3 text-base rounded-xl">
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

            <div>
              <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Catatan Kunjungan (Opsional)
              </label>
              <Input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Evaluasi perkembangan bahu, sesi ke-3"
                className="py-3 text-base border-2 rounded-xl touch-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-7 font-black text-lg rounded-2xl shadow-lg shadow-primary/20 touch-btn mt-4"
            >
              <CheckCircle2 className="size-6" />
              Simpan Catatan Kunjungan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
