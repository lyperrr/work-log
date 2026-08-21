import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Spinner } from '../ui/spinner';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Package,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

const SAMPLE_PAKET_CSV = `Nama Pasien,No Telp,Total Kunjungan,Harga Paket,Tanggal Beli
Siti Nurhaliza,08123456001,5,1500000,2026-08-01
Budi Santoso,08198765432,10,2500000,2026-08-05
Asep Sunandar,08219031410,5,1500000,2026-08-10`;

const SAMPLE_KUNJUNGAN_CSV = `Nama Pasien,No Telp,Tanggal Kunjungan,Biaya,Metode Pembayaran,Status,ID Paket (Opsional)
Siti Nurhaliza,08123456001,2026-08-15,300000,cash,lunas,PKT-0001
Budi Santoso,08198765432,2026-08-16,250000,transfer,menunggu,
Dewi Sartika,08134567890,2026-08-18,300000,cash,belum bayar,`;

export function ImportModal({
  isOpen,
  onClose,
  initialType = 'paket', // 'paket' | 'kunjungan'
  onImportSuccess,
  api,
  showToast,
}) {
  const [importType, setImportType] = useState(initialType);
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'file'
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [parsingError, setParsingError] = useState('');
  const [importing, setImporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Helper: Download sample CSV file
  const handleDownloadSample = () => {
    const content = importType === 'paket' ? SAMPLE_PAKET_CSV : SAMPLE_KUNJUNGAN_CSV;
    const filename = importType === 'paket' ? 'sample_import_paket.csv' : 'sample_import_kunjungan.csv';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Copy sample text to clipboard
  const handleCopySample = () => {
    const content = importType === 'paket' ? SAMPLE_PAKET_CSV : SAMPLE_KUNJUNGAN_CSV;
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    if (showToast) showToast('Format sample berhasil disalin!', 'success');
  };

  // CSV / TSV / Copy-Paste Parser
  const parseSpreadsheetData = (text, type) => {
    if (!text || !text.trim()) {
      setParsedData([]);
      setParsingError('');
      return;
    }

    try {
      const lines = text
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setParsedData([]);
        return;
      }

      // Detect separator (Tab or Comma or Semicolon)
      const firstLine = lines[0];
      let sep = ',';
      if (firstLine.includes('\t')) sep = '\t';
      else if (firstLine.includes(';')) sep = ';';

      // Check if first row is header
      const rawHeader = lines[0].toLowerCase();
      const hasHeader =
        rawHeader.includes('nama') ||
        rawHeader.includes('pasien') ||
        rawHeader.includes('kunjungan') ||
        rawHeader.includes('biaya') ||
        rawHeader.includes('harga');

      const dataLines = hasHeader ? lines.slice(1) : lines;

      const items = dataLines.map((line, idx) => {
        const cols = line.split(sep).map((c) => c.replace(/^["']|["']$/g, '').trim());

        if (type === 'paket') {
          // Columns: nama_pasien, no_telp, total_kunjungan, harga_paket, tanggal_beli
          const nama_pasien = cols[0] || '';
          const no_telp = cols[1] || '';
          const total_kunjungan = parseInt(cols[2], 10) || 5;
          const harga_paket = parseFloat((cols[3] || '0').replace(/[^0-9.]/g, '')) || 0;
          const tanggal_beli = cols[4] || new Date().toISOString().split('T')[0];

          const isValid = Boolean(nama_pasien.trim() && total_kunjungan > 0 && harga_paket >= 0);

          return {
            id: idx + 1,
            nama_pasien,
            no_telp,
            total_kunjungan,
            harga_paket,
            tanggal_beli,
            isValid,
            error: !nama_pasien ? 'Nama Pasien kosong' : !harga_paket ? 'Harga Paket kosong' : '',
          };
        } else {
          // Columns: nama_pasien, no_telp, tanggal_kunjungan, biaya, metode_pembayaran, status, paket_id
          const nama_pasien = cols[0] || '';
          const no_telp = cols[1] || '';
          const tanggal_kunjungan = cols[2] || new Date().toISOString().split('T')[0];
          const biaya = parseFloat((cols[3] || '0').replace(/[^0-9.]/g, '')) || 300000;
          const metode_pembayaran = (cols[4] || 'cash').toLowerCase() === 'transfer' ? 'transfer' : 'cash';

          let status = (cols[5] || 'lunas').toLowerCase();
          if (!['lunas', 'menunggu', 'belum bayar'].includes(status)) {
            status = 'lunas';
          }

          const paket_id = cols[6] || '';
          const isValid = Boolean(nama_pasien.trim() && biaya >= 0);

          return {
            id: idx + 1,
            nama_pasien,
            no_telp,
            tanggal_kunjungan,
            biaya,
            metode_pembayaran,
            status,
            paket_id,
            isValid,
            error: !nama_pasien ? 'Nama Pasien kosong' : '',
          };
        }
      });

      setParsedData(items);
      setParsingError('');
    } catch (err) {
      setParsingError('Gagal membaca format data. Pastikan format berupa CSV atau tabel Excel.');
      setParsedData([]);
    }
  };

  const handleTextChange = (val) => {
    setRawText(val);
    parseSpreadsheetData(val, importType);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      setRawText(content);
      parseSpreadsheetData(content, importType);
    };
    reader.readAsText(file);
  };

  const validItems = parsedData.filter((item) => item.isValid);

  // Submit Import
  const handleExecuteImport = async () => {
    if (validItems.length === 0 || importing) return;
    setImporting(true);
    setParsingError('');

    try {
      let importedCount = 0;

      for (const item of validItems) {
        // Ensure patient is created or retrieved
        const patientRecord = await api.saveOrGetPasienByName(item.nama_pasien, item.no_telp);

        if (importType === 'paket') {
          await api.createPaket({
            pasien_id: patientRecord.pasien_id,
            total_kunjungan: item.total_kunjungan,
            harga_paket: item.harga_paket,
            tanggal_beli: item.tanggal_beli,
          });
        } else {
          await api.createKunjungan({
            pasien_id: patientRecord.pasien_id,
            nama_pasien: patientRecord.nama_pasien,
            no_telp: patientRecord.no_telp || item.no_telp,
            tanggal_kunjungan: item.tanggal_kunjungan,
            biaya: item.biaya,
            metode_pembayaran: item.metode_pembayaran,
            status: item.status,
            paket_id: item.paket_id || '',
          });
        }
        importedCount++;
      }

      const typeLabel = importType === 'paket' ? 'Paket' : 'Kunjungan';
      if (showToast) {
        showToast(`Berhasil mengimpor ${importedCount} data ${typeLabel}!`, 'success');
      }

      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      setParsingError(err.message || 'Gagal memproses impor data.');
      if (showToast) {
        showToast(err.message || 'Gagal memproses impor', 'error');
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
      <Card className="border-2 border-primary/40 rounded-3xl max-w-2xl w-full shadow-2xl my-auto overflow-hidden">
        {/* Modal Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4 bg-card">
          <CardTitle className="text-lg md:text-xl font-black flex items-center gap-3">
            <FileSpreadsheet className="size-6 text-primary" />
            Import Data Spreadsheet
          </CardTitle>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-5 md:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Import Type Selector (Paket vs Kunjungan) */}
          <div className="flex bg-secondary p-1 rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => {
                setImportType('paket');
                setParsedData([]);
                setRawText('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${importType === 'paket'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Package className="size-4" />
              Import Paket Kunjungan
            </button>
            <button
              type="button"
              onClick={() => {
                setImportType('kunjungan');
                setParsedData([]);
                setRawText('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${importType === 'kunjungan'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Calendar className="size-4" />
              Import Sesi Kunjungan
            </button>
          </div>

          {/* Quick Actions: Download Sample & Copy Format */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-primary/5 border border-primary/20 rounded-2xl text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-primary">
              <Info className="size-4 shrink-0" />
              <span>Gunakan format sample untuk hasil impor sempurna.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySample}
                className="h-8 text-xs font-bold border-primary/30"
              >
                <Copy className="size-3.5" />
                {copySuccess ? 'Tersalin!' : 'Salin Format'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="h-8 text-xs font-bold border-primary/30"
              >
                <Download className="size-3.5" />
                Unduh .CSV Sample
              </Button>
            </div>
          </div>

          {/* Input Method Switcher (Paste Text vs Upload CSV) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Metode Impor:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`pb-0.5 border-b-2 font-bold ${activeTab === 'paste' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                    }`}
                >
                  Copy-Paste Teks / Excel
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`pb-0.5 border-b-2 font-bold ${activeTab === 'file' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                    }`}
                >
                  Upload File CSV
                </button>
              </div>
            </div>

            {activeTab === 'paste' ? (
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={
                  importType === 'paket'
                    ? 'Paste data dari Excel atau Google Sheets di sini...\nContoh:\nSiti Nurhaliza\t08123456001\t5\t1500000\t2026-08-01'
                    : 'Paste data dari Excel atau Google Sheets di sini...\nContoh:\nSiti Nurhaliza\t08123456001\t2026-08-15\t300000\tcash\tlunas'
                }
                className="w-full h-32 p-3 text-xs md:text-sm font-mono border-2 border-input rounded-2xl bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/40 hover:border-primary bg-secondary/30 p-6 rounded-2xl text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="size-8 mx-auto text-primary group-hover:scale-110 transition-transform mb-2" />
                <p className="text-sm font-bold text-foreground">Pilih file .CSV atau .TXT</p>
                <p className="text-xs text-muted-foreground mt-0.5">Klik untuk mengunggah file dari komputer kamu</p>
              </div>
            )}
          </div>

          {/* Parsing Error Alert */}
          {parsingError && (
            <Alert variant="destructive" className="rounded-2xl border-2">
              <AlertCircle className="size-4" />
              <AlertDescription className="font-bold text-xs">{parsingError}</AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">
                  Pratinjau Data ({validItems.length} dari {parsedData.length} Valid)
                </span>
                <Badge variant={validItems.length > 0 ? 'success' : 'destructive'} className="text-[10px]">
                  {validItems.length} Siap diimpor
                </Badge>
              </div>

              <div className="border border-border rounded-2xl overflow-hidden max-h-48 overflow-y-auto text-xs bg-card">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-secondary text-muted-foreground font-bold border-b border-border sticky top-0">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Nama Pasien</th>
                      <th className="p-2.5">No. Telp</th>
                      {importType === 'paket' ? (
                        <>
                          <th className="p-2.5">Sesi</th>
                          <th className="p-2.5">Harga</th>
                          <th className="p-2.5">Tgl Beli</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2.5">Tgl Kunjungan</th>
                          <th className="p-2.5">Biaya</th>
                          <th className="p-2.5">Metode</th>
                          <th className="p-2.5">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedData.map((row) => (
                      <tr key={row.id} className={!row.isValid ? 'bg-destructive/5' : 'hover:bg-secondary/40'}>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="size-4 text-rose-500" title={row.error} />
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-foreground">{row.nama_pasien || '-'}</td>
                        <td className="p-2.5 text-muted-foreground">{row.no_telp || '-'}</td>
                        {importType === 'paket' ? (
                          <>
                            <td className="p-2.5 font-bold text-primary">{row.total_kunjungan}x</td>
                            <td className="p-2.5 font-bold">Rp {Number(row.harga_paket).toLocaleString('id-ID')}</td>
                            <td className="p-2.5 text-muted-foreground">{row.tanggal_beli}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2.5 text-muted-foreground">{row.tanggal_kunjungan}</td>
                            <td className="p-2.5 font-bold text-primary">Rp {Number(row.biaya).toLocaleString('id-ID')}</td>
                            <td className="p-2.5 uppercase font-bold text-[10px]">{row.metode_pembayaran}</td>
                            <td className="p-2.5">
                              <Badge
                                variant={row.status === 'lunas' ? 'success' : 'warning'}
                                className="capitalize text-[9px] py-0 px-1.5"
                              >
                                {row.status}
                              </Badge>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={importing} className="font-bold">
              Batal
            </Button>
            <Button
              type="button"
              disabled={validItems.length === 0 || importing}
              onClick={handleExecuteImport}
              className="font-black px-6 shadow-md"
            >
              {importing ? (
                <>
                  <Spinner className="size-4" />
                  Mengimpor Data...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="size-4" />
                  Impor {validItems.length} Data {importType === 'paket' ? 'Paket' : 'Kunjungan'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
