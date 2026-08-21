import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { LogOut, Trash2 } from 'lucide-react';

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
  if (!isOpen) return null;

  const DefaultIcon = variant === 'destructive' ? Trash2 : LogOut;
  const IconComponent = CustomIcon || DefaultIcon;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-card border-2 border-primary/30 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-5 my-auto">
        <div className="flex flex-col items-center text-center">
          <div
            className={`size-14 rounded-2xl flex items-center justify-center mb-3 ${variant === 'destructive'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'
              }`}
          >
            <IconComponent className="size-8" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-foreground">
            {title}
          </h3>
        </div>

        <p className="text-base text-muted-foreground font-medium">
          {description}
        </p>

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-1/2 py-6 font-bold text-base rounded-2xl touch-btn"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={isLoading}
            onClick={onConfirm}
            className="w-1/2 py-6 font-black text-base rounded-2xl shadow-lg touch-btn"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}


