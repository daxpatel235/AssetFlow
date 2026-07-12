'use client';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './kit';
import { cn } from '@/lib/cn';

export function Modal({ open, title, onClose, children, width = 'max-w-md' }: { open: boolean; title?: string; onClose?: () => void; children: ReactNode; width?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  // Portal to <body> so the overlay escapes the header/transform stacking
  // context — it must cover the whole viewport and center in the middle.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative flex flex-col max-h-[calc(100vh-2rem)] bg-surface rounded-2xl shadow-pop w-full animate-scale-in border border-border', width)}>
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-bold text-fg tracking-tight truncate">{title}</h3>
          <button onClick={onClose} className="shrink-0 -mr-1 p-1 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-2 transition" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// Promise-based confirm dialog.
type ConfirmOpts = { title?: string; message?: string; confirmLabel?: string; danger?: boolean };
const ConfirmContext = createContext<((opts: ConfirmOpts) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOpts; resolve: (v: boolean) => void } | null>(null);
  const confirm = useCallback((opts: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ opts, resolve })), []);
  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} title={state?.opts.title || 'Are you sure?'} onClose={() => close(false)}>
        <p className="text-sm text-fg-muted mb-6">{state?.opts.message || 'Please confirm this action.'}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={state?.opts.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {state?.opts.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
