import React from 'react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  message: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
  warningMessage?: string | null;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  type?: 'delete' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemDetails,
  warningMessage,
  confirmText = 'Hapus Data',
  cancelText = 'Batal',
  isLoading = false,
  type = 'delete'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isBlocked = Boolean(warningMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Icon */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isBlocked 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
              : type === 'delete' 
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            <span className="material-symbols-outlined text-[28px]">
              {isBlocked ? 'warning' : type === 'delete' ? 'delete_forever' : 'info'}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-headline-sm font-extrabold text-on-surface leading-tight">
              {title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
              {message}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Item Summary Details Box */}
        {itemDetails && itemDetails.length > 0 && (
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-3.5 space-y-2">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-medium">{item.label}</span>
                <span className="font-bold text-on-surface truncate max-w-[220px]">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation Warning Box (If deletion is blocked due to active usage/dependencies) */}
        {isBlocked && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-xl p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
              <span className="material-symbols-outlined text-[18px]">block</span>
              <span>Aksi Diblokir oleh Sistem</span>
            </div>
            <p className="leading-relaxed opacity-90">{warningMessage}</p>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            disabled={isLoading}
          >
            {isBlocked ? 'Tutup' : cancelText}
          </Button>

          {!isBlocked && onConfirm && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-label-md px-5 py-2 rounded-full transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              <span>{confirmText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
