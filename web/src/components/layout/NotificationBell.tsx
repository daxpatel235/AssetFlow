'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Bell, Check, UserCheck, Wrench, XCircle, CalendarCheck, CalendarX, ArrowLeftRight,
  AlertTriangle, ShieldAlert, type LucideIcon,
} from 'lucide-react';
import { IconButton } from '@/components/ui/kit';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { notifications as seed, type NotificationKind, type AppNotification } from '@/lib/mock/assetflow';

const META: Record<NotificationKind, { icon: LucideIcon; cls: string }> = {
  asset_assigned: { icon: UserCheck, cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  maintenance_approved: { icon: Wrench, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  maintenance_rejected: { icon: XCircle, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  booking_confirmed: { icon: CalendarCheck, cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  booking_reminder: { icon: Bell, cls: 'bg-brand/10 text-brand' },
  booking_cancelled: { icon: CalendarX, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  transfer_approved: { icon: ArrowLeftRight, cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  overdue_return: { icon: AlertTriangle, cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  audit_flagged: { icon: ShieldAlert, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(seed);
  const unread = items.filter((n) => !n.read).length;
  const markAll = () => setItems((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <div className="relative">
      <IconButton onClick={() => setOpen((v) => !v)} title="Notifications" aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </IconButton>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-40 w-80 max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-xl shadow-pop overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-fg text-sm">Notifications{unread > 0 && <span className="ml-1.5 text-xs font-normal text-fg-muted">{unread} new</span>}</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-brand hover:underline inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-fg-muted text-center py-10">You&apos;re all caught up.</p>
              ) : (
                items.slice(0, 8).map((n) => {
                  const m = META[n.kind];
                  const Icon = m.icon;
                  return (
                    <div key={n.id} className={cn('flex items-start gap-3 px-4 py-3 border-b border-border last:border-0', !n.read && 'bg-brand/[0.03]')}>
                      <span className={cn('grid place-items-center w-8 h-8 rounded-lg shrink-0', m.cls)}><Icon className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg flex items-center gap-1.5">{n.title}{!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}</p>
                        <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-fg-muted mt-1">{timeAgo(n.at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-semibold text-brand hover:bg-surface-2 py-3 border-t border-border transition">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
