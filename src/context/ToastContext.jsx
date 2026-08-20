import { createContext, useContext, useCallback } from 'react';
import { Toaster, toast } from '../components/ui/toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    // Map custom types to shadcn toast manager types
    const toastType = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';

    toast.add({
      title: message,
      type: toastType,
      timeout: duration,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Official shadcn Toaster component */}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
