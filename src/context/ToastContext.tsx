import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', title?: string, duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, type, title, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div 
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-[90vw] sm:max-w-md w-full pointer-events-none px-2 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void; key?: string }) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-emerald-100',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          icon: 'check_circle',
          bar: 'bg-emerald-500',
          defaultTitle: 'Berhasil!'
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/40 text-rose-100',
          iconBg: 'bg-rose-500/20 text-rose-400',
          icon: 'error',
          bar: 'bg-rose-500',
          defaultTitle: 'Terjadi Kesalahan'
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/40 text-amber-100',
          iconBg: 'bg-amber-500/20 text-amber-400',
          icon: 'warning',
          bar: 'bg-amber-500',
          defaultTitle: 'Perhatian'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/90 dark:bg-slate-900/95 border-blue-500/40 text-slate-100',
          iconBg: 'bg-blue-500/20 text-blue-400',
          icon: 'info',
          bar: 'bg-blue-500',
          defaultTitle: 'Informasi'
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`pointer-events-auto flex flex-col rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-in slide-in-from-top-5 fade-in overflow-hidden ${style.bg}`}
    >
      <div className="flex items-start justify-between p-3.5 gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <h5 className="font-headline-sm font-bold text-sm tracking-wide text-white">
              {toast.title || style.defaultTitle}
            </h5>
            <p className="font-body-md text-xs text-white/80 leading-relaxed">
              {toast.message}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Auto-dismiss progress bar animation */}
      {toast.duration && toast.duration > 0 && (
        <div className="w-full bg-white/10 h-1 overflow-hidden">
          <div
            className={`h-full ${style.bar} transition-all ease-linear`}
            style={{
              animation: `toastProgress ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
