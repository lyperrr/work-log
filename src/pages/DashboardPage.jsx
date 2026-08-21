import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useSettings } from '../context/SettingsContext';
import { PrivacyAmount, PrivacyPeekButton } from '../components/common/PrivacyAmount';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { EmptyState } from '../components/common/EmptyState';

import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Package,
  Calendar,
  Wallet,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function DashboardPage({ onNavigate }) {
  const { currentUser, api } = useAuth();
  const { hideIncome, toggleHideIncome, formatAmount } = usePrivacy();
  const { dataScope } = useSettings();
  const [kunjunganList, setKunjunganList] = useState([]);
  const [paketList, setPaketList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.user_id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [kunjungan, paket] = await Promise.all([
          api.getKunjunganList(),
          api.getPaketList(),
        ]);
        const sortDesc = (arr, idKey) =>
          (arr || []).slice().sort((a, b) => {
            const keyA = a.created_at || a[idKey] || '';
            const keyB = b.created_at || b[idKey] || '';
            return String(keyB).localeCompare(String(keyA));
          });
        if (!cancelled) {
          setKunjunganList(sortDesc(kunjungan, 'kunjungan_id'));
          setPaketList(sortDesc(paket, 'paket_id'));
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [currentUser?.user_id]);

  const [peekToday, setPeekToday] = useState(false);
  const [peekWeek, setPeekWeek] = useState(false);
  const [peekMonth, setPeekMonth] = useState(false);
  const [peekVisitsMap, setPeekVisitsMap] = useState({});

  const toggleVisitPeek = (id) => {
    setPeekVisitsMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const displayName = currentUser?.username
    ? currentUser.username.charAt(0).toUpperCase() + currentUser.username.slice(1)
    : currentUser?.email
      ? currentUser.email.split('@')[0]
      : 'Pengguna';

  const getCleanDate = (d) => (d ? String(d).split('T')[0] : '');
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7); // e.g. "2026-08"

  const displayKunjunganList = dataScope === 'current_month'
    ? kunjunganList.filter((k) => getCleanDate(k.tanggal_kunjungan).startsWith(currentYearMonth))
    : kunjunganList;

  const displayPaketList = dataScope === 'current_month'
    ? paketList.filter((p) => getCleanDate(p.tanggal_beli).startsWith(currentYearMonth))
    : paketList;

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start.toISOString().split('T')[0];
  };

  const getStartOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };

  const startOfWeek = getStartOfWeek();
  const startOfMonth = getStartOfMonth();

  // Kunjungan dengan status 'lunas' (case-insensitive)
  const lunasVisits = displayKunjunganList.filter((k) => (k.status || '').toLowerCase() === 'lunas');

  const todayVisitIncome = lunasVisits
    .filter((k) => getCleanDate(k.tanggal_kunjungan) === todayStr)
    .reduce((sum, k) => sum + (Number(k.biaya) || 0), 0);

  const weekVisitIncome = lunasVisits
    .filter((k) => getCleanDate(k.tanggal_kunjungan) >= startOfWeek)
    .reduce((sum, k) => sum + (Number(k.biaya) || 0), 0);

  const monthVisitIncome = lunasVisits
    .filter((k) => getCleanDate(k.tanggal_kunjungan) >= startOfMonth)
    .reduce((sum, k) => sum + (Number(k.biaya) || 0), 0);

  // Pemasukan dari Pembelian Paket
  const todayPaketIncome = displayPaketList
    .filter((p) => getCleanDate(p.tanggal_beli) === todayStr)
    .reduce((sum, p) => sum + (Number(p.harga_paket) || 0), 0);

  const weekPaketIncome = displayPaketList
    .filter((p) => getCleanDate(p.tanggal_beli) >= startOfWeek)
    .reduce((sum, p) => sum + (Number(p.harga_paket) || 0), 0);

  const monthPaketIncome = displayPaketList
    .filter((p) => getCleanDate(p.tanggal_beli) >= startOfMonth)
    .reduce((sum, p) => sum + (Number(p.harga_paket) || 0), 0);

  const todayIncome = todayVisitIncome + todayPaketIncome;
  const weekIncome = weekVisitIncome + weekPaketIncome;
  const monthIncome = monthVisitIncome + monthPaketIncome;

  // Total Keseluruhan (Scoped)
  const totalVisitIncome = lunasVisits.reduce((sum, k) => sum + (Number(k.biaya) || 0), 0);
  const totalPaketIncome = displayPaketList.reduce((sum, p) => sum + (Number(p.harga_paket) || 0), 0);
  const totalIncome = totalVisitIncome + totalPaketIncome;

  const pendingCount = displayKunjunganList.filter((k) => (k.status || '').toLowerCase() === 'menunggu').length;
  const unpaidCount = displayKunjunganList.filter((k) => (k.status || '').toLowerCase() === 'belum bayar').length;
  const activePaketCount = displayPaketList.filter((p) => (p.status_paket || '').toLowerCase() === 'aktif' && (p.sisa_kunjungan === undefined || Number(p.sisa_kunjungan) > 0)).length;

  // Tanggal transaksi aktif yang unik
  const activeDates = Array.from(
    new Set([
      ...lunasVisits.map((k) => getCleanDate(k.tanggal_kunjungan)),
      ...paketList.map((p) => getCleanDate(p.tanggal_beli)),
    ])
  )
    .filter(Boolean)
    .sort();

  // Cek apakah 7 hari terakhir dari hari ini ada data
  const hasDataInCurrent7Days = Array.from({ length: 7 }).some((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return (
      lunasVisits.some((k) => getCleanDate(k.tanggal_kunjungan) === dateStr) ||
      paketList.some((p) => getCleanDate(p.tanggal_beli) === dateStr)
    );
  });

  const chartTargetDates = hasDataInCurrent7Days || activeDates.length === 0
    ? Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    })
    : activeDates.slice(-7);

  const chartData = chartTargetDates.map((dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayLabel = isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

    const visitTotal = lunasVisits
      .filter((k) => getCleanDate(k.tanggal_kunjungan) === dateStr)
      .reduce((sum, k) => sum + (Number(k.biaya) || 0), 0);

    const paketTotal = paketList
      .filter((p) => getCleanDate(p.tanggal_beli) === dateStr)
      .reduce((sum, p) => sum + (Number(p.harga_paket) || 0), 0);

    return {
      day: dayLabel,
      total: visitTotal + paketTotal,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in-50">

      {/* Welcome Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 md:p-6 rounded-3xl bg-linear-to-r from-primary/15 via-primary/10 to-cyan-500/10 border border-primary/20 shadow-xs overflow-hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl shrink-0">👋</span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight truncate">
              {getGreeting()}, <span className="text-primary">{displayName}</span>!
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Semoga harimu lancar. Berikut ringkasan aktivitas kunjungan & pemasukanmu hari ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleHideIncome}
            className={hideIncome ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40' : ''}
          >
            {hideIncome ? <EyeOff className="size-3.5 text-amber-500" /> : <Eye className="size-3.5 text-primary" />}
            {hideIncome ? 'Mode Privasi' : 'Privasi'}
          </Button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Button
          type="button"
          onClick={() => onNavigate('catat')}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="size-5" />
            <span className="text-sm font-bold">Catat Kunjungan</span>
          </div>
          <ArrowRight className="size-4 opacity-90" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => onNavigate('paket')}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-3">
            <Package className="size-5 text-primary" />
            <span className="text-sm font-bold">Buat Paket Baru</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Main Income Highlights Card */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            <Wallet className="size-5 text-primary" />
            Ringkasan Pemasukan
          </CardTitle>
          <Badge variant="success">
            <CheckCircle2 className="size-3.5" /> Status Lunas
          </Badge>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Hari Ini */}
            <div className="bg-linear-to-br from-primary/15 to-primary/5 border border-primary/30 p-4.5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hari Ini</span>
                <PrivacyPeekButton isRevealed={peekToday} onToggle={() => setPeekToday(!peekToday)} />
              </div>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Spinner className="size-4 text-primary" />
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </div>
                ) : (
                  <PrivacyAmount amount={todayIncome} isRevealed={peekToday} onToggle={() => setPeekToday(!peekToday)} className="text-2xl md:text-3xl font-black text-primary tracking-tight" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Total lunas hari ini</div>
            </div>

            {/* Minggu Ini */}
            <div className="bg-secondary/60 p-4.5 rounded-2xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Minggu Ini</span>
                <PrivacyPeekButton isRevealed={peekWeek} onToggle={() => setPeekWeek(!peekWeek)} />
              </div>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Spinner className="size-4 text-primary" />
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </div>
                ) : (
                  <PrivacyAmount amount={weekIncome} isRevealed={peekWeek} onToggle={() => setPeekWeek(!peekWeek)} className="text-xl md:text-2xl font-black text-foreground tracking-tight" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Sejak awal minggu</div>
            </div>

            {/* Bulan Ini */}
            <div className="bg-secondary/60 p-4.5 rounded-2xl border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bulan Ini</span>
                <PrivacyPeekButton isRevealed={peekMonth} onToggle={() => setPeekMonth(!peekMonth)} />
              </div>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Spinner className="size-4 text-emerald-600" />
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </div>
                ) : (
                  <PrivacyAmount amount={monthIncome} isRevealed={peekMonth} onToggle={() => setPeekMonth(!peekMonth)} className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Sejak awal bulan</div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Status Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-center shadow-xs hover:scale-102 transition-transform flex flex-col items-center justify-center">
          <Clock className="size-6 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
            {loading ? <Spinner className="size-5 text-amber-600 my-1" /> : pendingCount}
          </div>
          <div className="text-xs font-bold text-amber-800 dark:text-amber-200 mt-0.5">
            Menunggu
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl text-center shadow-xs hover:scale-102 transition-transform flex flex-col items-center justify-center">
          <AlertCircle className="size-6 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
            {loading ? <Spinner className="size-5 text-rose-600 my-1" /> : unpaidCount}
          </div>
          <div className="text-xs font-bold text-rose-800 dark:text-rose-200 mt-0.5">
            Belum Bayar
          </div>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/25 p-4 rounded-2xl text-center shadow-xs hover:scale-102 transition-transform flex flex-col items-center justify-center">
          <Package className="size-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300">
            {loading ? <Spinner className="size-5 text-cyan-600 my-1" /> : activePaketCount}
          </div>
          <div className="text-xs font-bold text-cyan-800 dark:text-cyan-200 mt-0.5">
            Paket Aktif
          </div>
        </div>
      </div>

      {/* Income Trend Chart */}
      <Card className="border-2 border-border rounded-3xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Grafik Pemasukan 7 Hari Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full min-w-0 pt-2 min-h-55">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} width={35} />
                <Tooltip
                  formatter={(value) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Pemasukan']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', borderColor: 'var(--border)' }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="oklch(0.52 0.105 223.128)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Visits Section */}
      <Card className="border-2 border-border rounded-3xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-black text-lg flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            Kunjungan Terbaru
          </CardTitle>
          <Button
            variant="link"
            onClick={() => onNavigate('riwayat')}
            className="text-sm font-bold text-primary p-0 h-auto"
          >
            Lihat Semua →
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl border border-border/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : displayKunjunganList.length === 0 ? (
            <EmptyState
              type="riwayat"
              title="Belum Ada Kunjungan"
              description={
                dataScope === 'current_month'
                  ? 'Belum ada kunjungan tercatat untuk bulan ini (mode reset bulanan aktif).'
                  : 'Belum ada data kunjungan yang tercatat.'
              }
              variant="simple"
              action={{
                label: 'Catat Kunjungan Baru',
                onClick: () => onNavigate('catat'),
              }}
            />
          ) : (
            displayKunjunganList.slice(0, 4).map((k) => (
              <div
                key={k.kunjungan_id}
                className="p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-base shrink-0">
                    {k.nama_pasien?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="font-bold text-base md:text-lg text-foreground flex items-center gap-2 flex-wrap">
                      {k.nama_pasien}
                      {k.info_paket && (
                        <Badge variant="secondary" className="bg-primary/15 text-primary font-bold text-xs">
                          {k.info_paket}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 font-medium">
                      <span>{k.tanggal_kunjungan ? String(k.tanggal_kunjungan).split('T')[0] : '-'}</span>
                      <span>•</span>
                      <span className="uppercase font-semibold">{k.metode_pembayaran}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  <div className="flex items-center gap-1.5 justify-end">
                    <PrivacyPeekButton
                      isRevealed={Boolean(peekVisitsMap[k.kunjungan_id])}
                      onToggle={() => toggleVisitPeek(k.kunjungan_id)}
                    />
                    <PrivacyAmount
                      amount={k.biaya}
                      isRevealed={Boolean(peekVisitsMap[k.kunjungan_id])}
                      onToggle={() => toggleVisitPeek(k.kunjungan_id)}
                      className="font-black text-base md:text-lg text-foreground"
                    />
                  </div>
                  <Badge
                    variant={
                      k.status === 'lunas'
                        ? 'success'
                        : k.status === 'menunggu'
                          ? 'warning'
                          : 'destructive'
                    }
                    className="capitalize mt-1"
                  >
                    {k.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}



