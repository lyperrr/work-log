import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { LogOut, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useAnimatePresence } from '../../hooks/useAnimatePresence';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  description = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'destructive', // 'destructive' or 'primary'
  icon: CustomIcon,
  isLoading = false,
}) {
  const { shouldRender, isMounted } = useAnimatePresence(isOpen, 250);

  if (!shouldRender) return null;

  const DefaultIcon = variant === 'destructive' ? Trash2 : LogOut;
  const IconComponent = CustomIcon || DefaultIcon;

  return createPortal(
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden transition-opacity duration-250 ease-out ${
        isMounted ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-card border-0 sm:border-2 border-primary/30 rounded-t-3xl sm:rounded-3xl max-w-none sm:max-w-md w-full shadow-2xl p-5 sm:p-6 text-center space-y-4 sm:space-y-5 my-0 sm:my-auto pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-6 transition-all duration-300 ease-ios-spring transform ${
          isMounted
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full sm:translate-y-6 opacity-0 sm:scale-95'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center mb-2 sm:mb-3 ${
              variant === 'destructive'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <IconComponent className="size-6 sm:size-8 shrink-0" />
          </div>

          <h3 className="text-lg sm:text-xl md:text-2xl font-black text-foreground">
            {title}
          </h3>
        </div>

        <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium">
          {description}
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-1/3 sm:w-auto px-4 h-12 text-base font-bold rounded-xl sm:rounded-2xl gap-1.5 shrink-0"
          >
            <X className="size-4 shrink-0 text-muted-foreground" />
            <span>{cancelText}</span>
          </Button>

          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 h-12 text-base font-black rounded-xl sm:rounded-2xl shadow-lg gap-1.5 whitespace-nowrap min-w-0"
          >
            {isLoading ? (
              <>
                <Spinner className="size-4 shrink-0" />
                <span className="truncate">Memproses...</span>
              </>
            ) : (
              <>
                {variant === 'destructive' ? (
                  <Trash2 className="size-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="size-4 shrink-0" />
                )}
                <span className="truncate">{confirmText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
