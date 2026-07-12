'use client';
import { useMemo, useState } from 'react';
import { Boxes, ArrowLeftRight, CalendarDays, Wrench, ClipboardCheck, Building2, type LucideIcon } from 'lucide-react';
import { PageHeader, Card, Avatar, SearchBar, EmptyState } from '@/components/ui/kit';
import { FilterTabs } from '@/components/ui/kit';
import { StatusPill } from '@/components/assetflow/badges';
import { timeAgo, formatDate } from '@/lib/format';
import { activity, employeeName, type ActivityEvent } from '@/lib/mock/assetflow';

const MODULE: Record<ActivityEvent['module'], { label: string; icon: LucideIcon; tone: 'brand' | 'blue' | 'amber' | 'red' | 'violet' | 'cyan' }> = {
  asset: { label: 'Asset', icon: Boxes, tone: 'brand' },
  allocation: { label: 'Allocation', icon: ArrowLeftRight, tone: 'blue' },
  booking: { label: 'Booking', icon: CalendarDays, tone: 'cyan' },
  maintenance: { label: 'Maintenance', icon: Wrench, tone: 'amber' },
  audit: { label: 'Audit', icon: ClipboardCheck, tone: 'red' },
  org: { label: 'Organization', icon: Building2, tone: 'violet' },
};

const TABS = [{ value: 'all', label: 'All' }, ...Object.entries(MODULE).map(([value, m]) => ({ value, label: m.label }))];

export default function ActivityPage() {
  const [module, setModule] = useState('all');
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    return [...activity]
      .filter((a) => (module === 'all' || a.module === module) && (!q || (employeeName(a.actorId) + a.action + a.target).toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [module, q]);

  // group by day
  const groups = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const a of items) { const key = formatDate(a.at, { dateStyle: 'full' }); if (!map.has(key)) map.set(key, []); map.get(key)!.push(a); }
    return [...map.entries()];
  }, [items]);

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="A complete audit trail of who did what, and when">
        <SearchBar value={q} onChange={setQ} placeholder="Search activity…" />
      </PageHeader>

      <FilterTabs tabs={TABS} active={module} onChange={setModule} className="mb-6" />

      {groups.length ? (
        <div className="space-y-6">
          {groups.map(([day, evs]) => (
            <div key={day}>
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-3">{day}</p>
              <Card className="p-0 overflow-hidden divide-y divide-border">
                {evs.map((a) => {
                  const m = MODULE[a.module];
                  const Icon = m.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/50 transition">
                      <Avatar name={employeeName(a.actorId)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-fg">
                          <span className="font-medium">{employeeName(a.actorId)}</span>{' '}
                          <span className="text-fg-muted">{a.action}</span>{' '}
                          <span className="font-medium">{a.target}</span>
                        </p>
                        <p className="text-xs text-fg-muted">{timeAgo(a.at)}</p>
                      </div>
                      <span className="hidden sm:inline-flex"><StatusPill tone={m.tone} label={m.label} icon={Icon} dot={false} /></span>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No activity found" hint="Try a different filter or search." />
      )}
    </div>
  );
}
