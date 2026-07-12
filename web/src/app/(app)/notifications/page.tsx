'use client';
import { useState } from 'react';
import {
  UserCheck, Wrench, XCircle, CalendarCheck, Bell, CalendarX, ArrowLeftRight, AlertTriangle, ShieldAlert, CheckCheck, type LucideIcon,
} from 'lucide-react';
import { PageHeader, Card, Button, EmptyState, FilterTabs } from '@/components/ui/kit';
import { useToast } from '@/providers/ToastProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { timeAgo } from '@/lib/format';
import { notifications as liveNotifications, type NotificationKind } from '@/lib/mock/assetflow';

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

export default function NotificationsPage() {
  const toast = useToast();
  // DB-backed: read the hydrated array + subscribe to store bumps; actions persist.
  const { v: _v, markAllRead, markRead } = useAF();
  const list = liveNotifications;
  const [filter, setFilter] = useState('all');

  const unread = list.filter((n) => !n.read).length;
  const shown = list.filter((n) => (filter === 'all' ? true : !n.read));

  const markAll = async () => { await markAllRead(); toast.success('All caught up'); };

  return (
    <div>
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'You’re all caught up'}>
        <Button variant="ghost" size="sm" onClick={markAll} disabled={!unread}><CheckCheck className="w-4 h-4" /> Mark all read</Button>
      </PageHeader>

      <FilterTabs tabs={[{ value: 'all', label: 'All' }, { value: 'unread', label: `Unread${unread ? ` (${unread})` : ''}` }]} active={filter} onChange={setFilter} className="mb-5" />

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((n) => {
            const m = META[n.kind];
            const Icon = m.icon;
            return (
              <Card key={n.id} className={`flex items-start gap-3 transition ${!n.read ? 'border-brand/30 bg-brand/[0.02]' : ''}`}>
                <span className={`grid place-items-center w-10 h-10 rounded-xl shrink-0 ${m.cls}`}><Icon className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-fg">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <p className="text-sm text-fg-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-fg-muted mt-1.5">{timeAgo(n.at)}</p>
                </div>
                {n.read
                  ? <span className="text-xs font-medium text-fg-muted shrink-0">Read</span>
                  : <button onClick={() => { void markRead(n.id); }} className="text-xs font-semibold text-brand hover:underline shrink-0">Mark read</button>}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title="Nothing here" hint="You have no notifications in this view." />
      )}
    </div>
  );
}
