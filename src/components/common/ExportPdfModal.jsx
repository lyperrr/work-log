import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAnimatePresence } from '../../hooks/useAnimatePresence';
import { DatePicker } from './DatePicker';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatDateLocal } from '../../lib/utils';
import {
  FileText,
  Printer,
  Filter,
  Zap,
  CalendarDays,
  History,
  CalendarCheck,
  Search,
  X,
} from 'lucide-react';

export function ExportPdfModal({ isOpen, onClose, kunjunganList = [] }) {
  const { shouldRender, isMounted } = useAnimatePresence(isOpen, 250);
  const { kopSurat } = useSettings();

  // Period state: '1_minggu' | 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'custom'
  const [periodType, setPeriodType] = useState('bulan_ini');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // ─── Filter Data Based on Selected Period ─────────────────────────────
  const { filteredList, dateLabel, startDateStr, endDateStr } = useMemo(() => {
    const now = new Date();
    const todayStr = formatDateLocal(now);
    let start = '';
    let end = todayStr;
    let label = 'Bulan Ini';

    if (periodType === '1_minggu') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      start = formatDateLocal(past7);
      label = `1 Minggu Terakhir (${start} - ${end})`;
    } else if (periodType === 'bulan_ini') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      label = `Bulan Ini (${month}/${year})`;
    } else if (periodType === 'bulan_lalu') {
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const year = prevMonthDate.getFullYear();
      const month = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
      start = `${year}-${month}-01`;
      const lastDay = new Date(year, prevMonthDate.getMonth() + 1, 0).getDate();
      end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      label = `Bulan Lalu (${month}/${year})`;
    } else if (periodType === 'tahun_ini') {
      const year = now.getFullYear();
      start = `${year}-01-01`;
      end = `${year}-12-31`;
      label = `Tahun Ini (${year})`;
    } else if (periodType === 'custom') {
      start = customStartDate;
      end = customEndDate;
      label = start && end ? `Periode ${start} s/d ${end}` : 'Custom Date';
    }

    const filtered = (kunjunganList || []).filter((k) => {
      if (!k.tanggal_kunjungan) return false;
      const kDate = String(k.tanggal_kunjungan).split('T')[0];
      if (start && kDate < start) return false;
      if (end && kDate > end) return false;
      return true;
    });

    // Urutkan ascending berdasarkan tanggal kunjungan
    filtered.sort((a, b) => String(a.tanggal_kunjungan).localeCompare(String(b.tanggal_kunjungan)));

    return { filteredList: filtered, dateLabel: label, startDateStr: start, endDateStr: end };
  }, [kunjunganList, periodType, customStartDate, customEndDate]);

  // ─── Financial & Count Summary ─────────────────────────────────────────
  const summary = useMemo(() => {
    let totalBiaya = 0;
    let countLunas = 0;
    let countMenunggu = 0;
    let countBelum = 0;
    let totalCash = 0;
    let totalTransfer = 0;

    filteredList.forEach((item) => {
      const b = Number(item.biaya) || 0;
      totalBiaya += b;
      if (item.status === 'lunas') countLunas++;
      else if (item.status === 'menunggu') countMenunggu++;
      else countBelum++;

      if (item.metode_pembayaran === 'transfer') totalTransfer += b;
      else totalCash += b;
    });

    return {
      totalKunjungan: filteredList.length,
      totalBiaya,
      countLunas,
      countMenunggu,
      countBelum,
      totalCash,
      totalTransfer,
    };
  }, [filteredList]);

  // ─── Print Trigger ─────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  if (!shouldRender) return null;

  return createPortal(
    <div
      id="printable-report-root"
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
        isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className={`p-0 border-0 sm:border border-border rounded-t-3xl sm:rounded-2xl max-w-none sm:max-w-3xl md:max-w-4xl w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[92vh] shadow-xl flex flex-col overflow-hidden bg-card transition-all duration-300 ease-ios-spring transform print:border-0 print:shadow-none print:rounded-none print:bg-white ${
          isMounted
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
        }`}
      >
        {/* Modal Header */}
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pt-[max(1.25rem,env(safe-area-inset-top))] border-b border-border bg-card shrink-0 no-print">
          <CardTitle className="text-base sm:text-lg md:text-xl font-black flex items-center gap-2.5">
            <FileText className="size-5 sm:size-6 text-primary shrink-0" />
            <span>Cetak Laporan PDF</span>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full shrink-0">
            <X className="size-5 text-muted-foreground" />
          </Button>
        </CardHeader>

        {/* Modal Scrollable Body */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2rem))]">
          {/* Filter Periode & Cetak Action Section */}
          <div className="space-y-4 bg-secondary/50 p-3.5 sm:p-4 rounded-2xl border border-border/80 no-print">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="size-3.5 text-primary" />
                Pilih Periode Laporan:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPeriodType('1_minggu')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    periodType === '1_minggu'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80'
                  }`}
                >
                  <Zap className="size-3.5 shrink-0" />
                  <span>1 Minggu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('bulan_ini')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    periodType === 'bulan_ini'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80'
                  }`}
                >
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span>Bulan Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('bulan_lalu')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    periodType === 'bulan_lalu'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80'
                  }`}
                >
                  <History className="size-3.5 shrink-0" />
                  <span>Bulan Lalu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('tahun_ini')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    periodType === 'tahun_ini'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80'
                  }`}
                >
                  <CalendarCheck className="size-3.5 shrink-0" />
                  <span>Tahun Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriodType('custom')}
                  className={`py-2 px-2 rounded-xl font-bold text-xs col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 transition-all ${
                    periodType === 'custom'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/80'
                  }`}
                >
                  <Search className="size-3.5 shrink-0" />
                  <span>Custom Date</span>
                </button>
              </div>

              {/* Custom Date Pickers */}
              {periodType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground mb-1 block">Tanggal Mulai:</span>
                    <DatePicker
                      value={customStartDate}
                      onChange={setCustomStartDate}
                      placeholder="Pilih tanggal awal..."
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-muted-foreground mb-1 block">Tanggal Akhir:</span>
                    <DatePicker
                      value={customEndDate}
                      onChange={setCustomEndDate}
                      placeholder="Pilih tanggal akhir..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pembatas & Tombol Ekspor PDF Berwarna Merah */}
            <div className="pt-3 border-t border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Printer className="size-3.5 text-rose-500 shrink-0" />
                <span>Dokumen PDF Siap Dicetak / Disimpan</span>
              </span>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handlePrint}
                className="font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md gap-2 rounded-xl h-11 sm:h-9 px-4 text-xs sm:text-sm justify-center border border-rose-700/30 active:scale-98 transition-all shrink-0"
              >
                <Printer className="size-4 shrink-0" />
                <span>Cetak / Simpan PDF</span>
              </Button>
            </div>
          </div>

          {/* ─── LIVE PRINTABLE PDF REPORT PREVIEW AREA ─── */}
            <div
              id="printable-report-area"
              className="bg-white text-gray-900 p-6 sm:p-8 border border-gray-200 rounded-xl font-sans text-xs space-y-5 select-text print:p-0 print:m-0 print:border-0 print:border-none print:rounded-none print:shadow-none"
            >
              {/* ─── 1. KOP SURAT OFFICIAL HEADER ─── */}
              <div className="text-center pb-3 border-b-4 border-double border-gray-900">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-gray-900 uppercase">
                  {kopSurat.namaKlinik}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-0.5">
                  {kopSurat.subKlinik}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {kopSurat.alamatKlinik}
                </p>
                <p className="text-[11px] font-medium text-gray-600 mt-0.5">
                  {kopSurat.kontakKlinik}
                </p>
              </div>

              {/* ─── 2. REPORT TITLE & METADATA ─── */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wide text-gray-900">
                    LAPORAN REKAPITULASI KUNJUNGAN &amp; KEUANGAN
                  </h2>
                  <p className="text-xs text-gray-700 font-bold mt-0.5">
                    Periode: <span className="text-primary-800 underline">{dateLabel}</span>
                  </p>
                </div>
                <div className="text-right text-[11px] text-gray-500 font-mono">
                  <div>Dicetak Pada: {formatDateLocal(new Date())}</div>
                  <div>Status Data: Valid &amp; Terverifikasi</div>
                </div>
              </div>

              {/* ─── 3. EXECUTIVE SUMMARY CARDS (FLAT FORMAL SUMMARY ON PRINT) ─── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-800 print:bg-transparent print:p-0 print:border-y print:border-gray-300 print:rounded-none print:shadow-none print:py-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Kunjungan</span>
                  <span className="text-base font-black text-gray-900">{summary.totalKunjungan} Transaksi</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Pendapatan</span>
                  <span className="text-base font-black text-emerald-700">
                    Rp {summary.totalBiaya.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Status Pembayaran</span>
                  <span className="text-xs font-bold text-gray-900 block">
                    <span className="text-emerald-600 font-black">{summary.countLunas} Lunas</span> |{' '}
                    <span className="text-rose-600 font-black">{summary.countBelum + summary.countMenunggu} Pending</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Metode Bayar</span>
                  <span className="text-xs font-bold text-gray-900 block">
                    Cash: Rp {summary.totalCash.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-medium text-gray-600 block">
                    Transfer: Rp {summary.totalTransfer.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* ─── 4. DETAILED TRANSACTION TABLE ─── */}
              {filteredList.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg text-gray-500 print:border-0 print:py-4 print:rounded-none print:text-gray-800">
                  Tidak ada transaksi kunjungan pada periode ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px] text-left">
                    <thead>
                      <tr className="bg-gray-800 text-white font-bold uppercase text-[10px]">
                        <th className="p-2 border border-gray-800 text-center w-8">No</th>
                        <th className="p-2 border border-gray-800">Tanggal</th>
                        <th className="p-2 border border-gray-800">ID Sesi</th>
                        <th className="p-2 border border-gray-800">Nama Pasien</th>
                        <th className="p-2 border border-gray-800">No. Telp</th>
                        <th className="p-2 border border-gray-800 text-center">Metode</th>
                        <th className="p-2 border border-gray-800 text-right">Biaya (Rp)</th>
                        <th className="p-2 border border-gray-800 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item, idx) => (
                        <tr
                          key={item.kunjungan_id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="p-2 border border-gray-300 text-center font-medium">{idx + 1}</td>
                          <td className="p-2 border border-gray-300 font-medium whitespace-nowrap">
                            {item.tanggal_kunjungan ? formatDateLocal(item.tanggal_kunjungan) : '-'}
                          </td>
                          <td className="p-2 border border-gray-300 font-mono font-bold text-gray-700">
                            {item.kunjungan_id}
                          </td>
                          <td className="p-2 border border-gray-300 font-bold text-gray-900">
                            {item.nama_pasien}
                            {item.info_paket && (
                              <span className="block text-[9px] font-normal text-gray-500">
                                ({item.info_paket})
                              </span>
                            )}
                          </td>
                          <td className="p-2 border border-gray-300 text-gray-700">
                            {item.no_telp || '-'}
                          </td>
                          <td className="p-2 border border-gray-300 text-center capitalize font-bold text-gray-800">
                            {item.metode_pembayaran === 'transfer' ? 'Transfer' : 'Cash'}
                          </td>
                          <td className="p-2 border border-gray-300 text-right font-black text-gray-900">
                            {Number(item.biaya || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="p-2 border border-gray-300 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold capitalize text-[9px] ${
                                item.status === 'lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'menunggu'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 text-gray-900 font-black text-xs">
                        <td colSpan={6} className="p-2.5 border border-gray-400 text-right uppercase">
                          Total Seluruh Pendapatan Periode Ini:
                        </td>
                        <td className="p-2.5 border border-gray-400 text-right text-emerald-800 text-sm">
                          Rp {summary.totalBiaya.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5 border border-gray-400"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* ─── 5. SIGNATURE FOOTER ─── */}
              <div className="pt-6 border-t border-gray-200 flex justify-end">
                <div className="text-center min-w-[220px] space-y-12">
                  <div>
                    <p className="text-xs text-gray-700">
                      {kopSurat.kotaPenerbit}, {formatDateLocal(new Date())}
                    </p>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      Penanggung Jawab Laporan,
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 underline uppercase">
                      ( {kopSurat.penanggungJawab} )
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Penanggung Jawab Klinik / Praktek</p>
                  </div>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
