'use client';
import { Loader2, AlertTriangle, Boxes } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-brand', className)} />;
}

export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand/30 animate-pulse">
          <Boxes className="w-6 h-6" />
        </span>
        <div className="flex items-center gap-2 text-fg-muted"><Spinner className="w-4 h-4" /><span className="text-sm">{label}</span></div>
      </div>
    </div>
  );
}

// ── Skeleton primitives (shimmer via .skeleton in globals.css) ────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16 mt-2.5" />
      <Skeleton className="h-3 w-24 mt-3" />
    </div>
  );
}

// Generic page skeleton — shown during route transitions via loading.tsx.
export function PageSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72 mt-2.5" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-5"><Skeleton className="h-4 w-40 mb-4" /><Skeleton className="h-56 w-full" /></div>
        <div className="bg-surface rounded-2xl border border-border p-5"><Skeleton className="h-4 w-32 mb-4" /><Skeleton className="h-56 w-full" /></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-16 text-fg-muted">
      <AlertTriangle className="w-8 h-8 mx-auto text-red-400 mb-2" />
      <p className="font-medium text-fg">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-brand text-sm mt-2 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
