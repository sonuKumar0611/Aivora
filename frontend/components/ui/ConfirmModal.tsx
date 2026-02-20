'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <Card
        className={`w-full max-w-md shadow-xl ${variant === 'danger' ? 'border-red-500/40 dark:border-red-900/60' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3">
            {variant === 'danger' && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </span>
            )}
            <div>
              <h2 id="confirm-modal-title" className="text-lg font-semibold text-brand-textHeading">
                {title}
              </h2>
              <p id="confirm-modal-desc" className="mt-1 text-sm text-brand-textMuted">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-brand-divider transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="flex flex-row justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
