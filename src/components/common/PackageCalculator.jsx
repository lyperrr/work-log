import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Calculator, DollarSign, Layers, Info, AlertCircle } from 'lucide-react';

export function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '-';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateValuePerSession(price, sessions) {
  const numPrice = Number(price);
  const numSessions = Number(sessions);

  // Validate inputs: price > 0, sessions positive integer
  if (
    !numPrice ||
    numPrice <= 0 ||
    !numSessions ||
    numSessions <= 0 ||
    !Number.isInteger(numSessions)
  ) {
    return null;
  }

  return Math.round(numPrice / numSessions);
}

export function PackageCalculator({
  priceValue,
  onPriceChange,
  sessionsValue,
  onSessionsChange,
  readOnlyInputs = false,
  showCardWrapper = true,
}) {
  const numPrice = Number(priceValue) || 0;
  const numSessions = Number(sessionsValue) || 0;

  // Validation state for total sessions
  const isSessionsValid =
    sessionsValue === '' ||
      sessionsValue === null ||
      sessionsValue === undefined
      ? true
      : numSessions > 0 && Number.isInteger(Number(sessionsValue));

  const sessionVal = calculateValuePerSession(priceValue, sessionsValue);
  const formattedSessionValue = sessionVal !== null ? formatRupiah(sessionVal) : '-';

  const content = (
    <div className="space-y-4">
      {/* 1. Package Price Input */}
      <div>
        <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
          <DollarSign className="size-5 text-primary shrink-0" />
          Harga Total Paket (Rp)
        </label>
        {readOnlyInputs ? (
          <div className="p-3.5 bg-secondary text-foreground rounded-xl border-2 border-input font-bold text-lg">
            {formatRupiah(numPrice)}
          </div>
        ) : (
          <Input
            type="number"
            value={priceValue ?? ''}
            onChange={(e) => onPriceChange && onPriceChange(e.target.value)}
            placeholder="1500000"
            step="10000"
            min="0"
            className="font-bold touch-input"
          />
        )}
      </div>

      {/* 2. Total Sessions Input */}
      <div>
        <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
          <Layers className="size-5 text-primary shrink-0" />
          Total Sesi / Kunjungan
        </label>
        {readOnlyInputs ? (
          <div className="p-3.5 bg-secondary text-foreground rounded-xl border-2 border-input font-bold text-lg">
            {numSessions} Sesi
          </div>
        ) : (
          <Input
            type="number"
            value={sessionsValue ?? ''}
            onChange={(e) => onSessionsChange && onSessionsChange(e.target.value)}
            placeholder="5"
            step="1"
            min="1"
            className={`font-bold touch-input ${!isSessionsValid ? 'border-destructive focus:ring-destructive' : ''
              }`}
          />
        )}

        {/* Validation message */}
        {!isSessionsValid && (
          <p className="text-xs font-bold text-destructive mt-1.5 flex items-center gap-1">
            <AlertCircle className="size-4 shrink-0" />
            Total sesi harus berupa angka bulat positif lebih dari 0 (contoh: 1, 2, 5, 10).
          </p>
        )}
      </div>

      {/* 3. Read-Only Calculated Output: Value per Session */}
      <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-2xl space-y-1 text-center">
        <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
          Nilai per Sesi (Estimasi Value)
        </div>

        <div className="text-2xl md:text-3xl font-black text-primary transition-all">
          {formattedSessionValue}
        </div>

        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 pt-1 font-medium">
          <Info className="size-3.5 text-primary" />
          <span>Otomatis dihitung dari (Harga Paket ÷ Total Sesi)</span>
        </div>
      </div>
    </div>
  );

  if (!showCardWrapper) return content;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Calculator className="size-5 text-primary shrink-0" />
          Kalkulator Nilai Paket (Package Calculation)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">{content}</CardContent>
    </Card>
  );
}
