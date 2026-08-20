import { useState } from 'react';
import { usePrivacy } from '../../context/PrivacyContext';
import { Eye, EyeOff } from 'lucide-react';

export function PrivacyPeekButton({ isRevealed, onToggle, className = '' }) {
  const { hideIncome } = usePrivacy();
  if (!hideIncome) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all cursor-pointer border border-transparent hover:border-border shrink-0 ${className}`}
      title={isRevealed ? 'Sembunyikan nominal ini' : 'Intip nominal ini (1/1)'}
    >
      {isRevealed ? (
        <EyeOff className="size-4 text-amber-500" />
      ) : (
        <Eye className="size-4 text-primary opacity-70 hover:opacity-100" />
      )}
    </button>
  );
}

export function PrivacyAmount({
  amount,
  isRevealed: externalIsRevealed,
  onToggle,
  className = '',
  mask = 'Rp ••••••',
  customFormat,
}) {
  const { hideIncome } = usePrivacy();
  const [internalIsRevealed, setInternalIsRevealed] = useState(false);

  const isRevealed = externalIsRevealed !== undefined ? externalIsRevealed : internalIsRevealed;

  const rawFormatted = customFormat
    ? customFormat(amount)
    : new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  if (!hideIncome) {
    return <span className={className}>{rawFormatted}</span>;
  }

  const handleToggle = (e) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsRevealed((prev) => !prev);
    }
  };

  return (
    <span
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 cursor-pointer transition-all select-none ${className}`}
      title={isRevealed ? 'Sembunyikan nominal' : 'Klik untuk intip nominal (1/1)'}
    >
      <span>{isRevealed ? rawFormatted : mask}</span>
      {externalIsRevealed === undefined && (
        <span className="p-0.5 text-muted-foreground shrink-0">
          {isRevealed ? (
            <EyeOff className="size-3.5 text-amber-500" />
          ) : (
            <Eye className="size-3.5 text-primary opacity-60" />
          )}
        </span>
      )}
    </span>
  );
}
