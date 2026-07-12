'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// ── Tabs (underline style, with a sliding active indicator) ──────────────────
export type TabDef = { value: string; label: string; count?: number };
export function Tabs({ tabs, active, onChange, className }: { tabs: TabDef[]; active: string; onChange: (v: string) => void; className?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, tabs]);

  return (
    <div className={cn('relative', className)}>
      <div ref={listRef} className="relative flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => {
          const on = t.value === active;
          return (
            <button
              key={t.value}
              data-tab={t.value}
              onClick={() => onChange(t.value)}
              className={cn('relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors', on ? 'text-brand' : 'text-fg-muted hover:text-fg')}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors', on ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-fg-muted')}>{t.count}</span>
              )}
            </button>
          );
        })}
        <span
          className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-brand transition-all duration-300 ease-spring"
          style={{ transform: `translateX(${ind.left}px)`, width: ind.width, opacity: ind.width ? 1 : 0 }}
        />
      </div>
    </div>
  );
}

// ── Segmented control (view switchers) ───────────────────────────────────────
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }> }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-2/60 p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ease-spring active:scale-95', on ? 'bg-surface text-fg shadow-sm ring-1 ring-border/60' : 'text-fg-muted hover:text-fg')}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Drawer (right slide-over) ────────────────────────────────────────────────
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }: { open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('absolute right-0 inset-y-0 w-full bg-surface border-l border-border shadow-pop flex flex-col animate-slide-in', width)}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="min-w-0">
            {title && <h3 className="font-bold text-fg tracking-tight truncate">{title}</h3>}
            {subtitle && <p className="text-sm text-fg-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 text-fg-muted hover:text-fg p-1 rounded-lg hover:bg-surface-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-border px-6 py-4 bg-surface-2/40">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// ── Definition list row ──────────────────────────────────────────────────────
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-fg-muted shrink-0">{label}</span>
      <span className="text-sm font-medium text-fg text-right min-w-0">{children}</span>
    </div>
  );
}

// ── Date/time helpers for bookings & schedules ───────────────────────────────
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export const fmtTimeRange = (a: string, b: string) => `${fmtTime(a)} – ${fmtTime(b)}`;
export const fmtDayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
