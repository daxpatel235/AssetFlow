'use client';
import Link from 'next/link';
import {
  PackageCheck, CalendarClock, Wrench, ArrowLeftRight, ArrowRight, Inbox, MapPin, CalendarDays, Eye,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar, Select, EmptyState } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import {
  AssetStatusBadge, MaintenanceStatusBadge, TransferStatusBadge, BookingStatusBadge, RoleBadge, categoryIcon,
} from '@/components/assetflow/badges';
import { fmtTimeRange, fmtDayLabel } from '@/components/assetflow/ui';
import { useAF } from '@/lib/store/assetflow-store';
import {
  TODAY, employees, assetsHeldBy, bookingsBy, maintenanceBy, transfersBy, returnDueFor,
  pendingApprovals, isManager, asset as getAsset, employeeName, departmentName,
  category as getCategory,
} from '@/lib/mock/assetflow';

const daysFromToday = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / 86_400_000);

function SectionCard({ title, icon: Icon, count, action, children }: { title: string; icon: React.ComponentType<{ className?: string }>; count?: number; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-fg-muted" />
          <h3 className="font-semibold text-fg">{title}</h3>
          {typeof count === 'number' && <span className="rounded-full bg-surface-2 text-fg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>}
        </div>
        {action && <Link href={action.href} className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">{action.label} <ArrowRight className="w-3 h-3" /></Link>}
      </div>
      {children}
    </Card>
  );
}

export default function MyWorkspacePage() {
  const { actingId: meId, setActingId: setMeId, v: _v } = useAF();
  const me = employees.find((e) => e.id === meId) ?? employees[0];

  const held = assetsHeldBy(me.id);
  const dueList = held.map((a) => ({ asset: a, due: returnDueFor(me.id, a.id) })).filter((x) => x.due);
  const overdueCount = dueList.filter((x) => daysFromToday(x.due!) < 0).length;

  const myBookings = bookingsBy(me.id).filter((b) => b.status === 'upcoming' || b.status === 'ongoing').sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const myMaint = maintenanceBy(me.id);
  const openMaint = myMaint.filter((m) => m.status !== 'resolved' && m.status !== 'rejected');
  const myTransfers = transfersBy(me.id);

  const manager = isManager(me.role);
  const approvals = pendingApprovals();
  const approvalCount = approvals.transfers.length + approvals.maintenance.length;

  return (
    <div>
      <PageHeader title="My Workspace" subtitle="Everything assigned to you — assets, bookings and requests in one place">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted"><Eye className="w-3.5 h-3.5" /> Viewing as</span>
          <Select value={meId} onChange={(e) => setMeId(e.target.value)} options={employees.map((e) => ({ value: e.id, label: `${e.name} · ${e.role.replace('_', ' ')}` }))} placeholder="" className="w-auto min-w-[14rem]" />
        </div>
      </PageHeader>

      {/* Identity */}
      <Card className="mb-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 border-l-accent">
        <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-accent/[0.07] blur-3xl" />
        <span className="relative shrink-0 rounded-2xl p-0.5 bg-gradient-to-br from-accent-400 to-brand-600">
          <Avatar name={me.name} size="lg" className="ring-2 ring-surface" />
        </span>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-lg font-bold text-fg tracking-tight">{me.name}</p>
            <RoleBadge role={me.role} />
          </div>
          <p className="text-sm text-fg-muted">{me.title} · {departmentName(me.departmentId)}</p>
        </div>
        <div className="text-sm text-fg-muted sm:text-right">
          <p>{me.email}</p>
          <p>{me.phone}</p>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard label="Assets held" value={held.length} icon={PackageCheck} tone="blue" hint="assigned to me" />
        <StatCard label="Upcoming returns" value={dueList.length} icon={CalendarClock} tone={overdueCount ? 'red' : 'green'} hint={overdueCount ? `${overdueCount} overdue` : 'on track'} />
        <StatCard label="Open requests" value={openMaint.length} icon={Wrench} tone="amber" hint="maintenance" />
        <StatCard label={manager ? 'Awaiting my approval' : 'My transfers'} value={manager ? approvalCount : myTransfers.length} icon={manager ? Inbox : ArrowLeftRight} tone="brand" hint={manager ? 'action needed' : 'requests'} />
      </div>

      {/* Manager approvals banner */}
      {manager && approvalCount > 0 && (
        <Card className="mb-6 border-brand/30 bg-brand/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand/10 text-brand shrink-0"><Inbox className="w-5 h-5" /></span>
            <div>
              <p className="font-semibold text-fg">{approvalCount} item{approvalCount > 1 ? 's' : ''} awaiting your approval</p>
              <p className="text-sm text-fg-muted">{approvals.transfers.length} transfer{approvals.transfers.length !== 1 ? 's' : ''} · {approvals.maintenance.length} maintenance request{approvals.maintenance.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link href="/approvals"><Button size="sm">Review approvals <ArrowRight className="w-4 h-4" /></Button></Link>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets assigned to me */}
        <SectionCard title="Assets assigned to me" icon={PackageCheck} count={held.length} action={{ href: '/assets', label: 'Registry' }}>
          {held.length ? (
            <ul className="divide-y divide-border">
              {held.map((a) => {
                const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
                const due = returnDueFor(me.id, a.id);
                const dleft = due ? daysFromToday(due) : null;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/assets/${a.id}`} className="flex items-center gap-3 min-w-0 group">
                      <span className="grid place-items-center w-9 h-9 rounded-lg bg-surface-2 text-fg-muted shrink-0"><Icon className="w-4 h-4" /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-fg truncate group-hover:text-brand">{a.name}</span>
                        <span className="block text-xs text-fg-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.location}</span>
                      </span>
                    </Link>
                    <div className="text-right shrink-0">
                      <AssetStatusBadge status={a.status} />
                      {due && <p className={`text-[11px] mt-1 font-medium ${dleft! < 0 ? 'text-red-600 dark:text-red-400' : 'text-fg-muted'}`}>{dleft! < 0 ? `${Math.abs(dleft!)}d overdue` : `due in ${dleft}d`}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState icon={PackageCheck} title="No assets assigned" hint="You don’t currently hold any assets." action={<Link href="/assets"><Button variant="ghost" size="sm">Browse registry</Button></Link>} />}
        </SectionCard>

        {/* My bookings */}
        <SectionCard title="My bookings" icon={CalendarDays} count={myBookings.length} action={{ href: '/bookings', label: 'Calendar' }}>
          {myBookings.length ? (
            <ul className="divide-y divide-border">
              {myBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{getAsset(b.resourceId)?.name}</p>
                    <p className="text-xs text-fg-muted">{fmtDayLabel(b.start)} · {fmtTimeRange(b.start, b.end)}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={CalendarDays} title="No upcoming bookings" hint="Book a shared resource from the calendar." action={<Link href="/bookings"><Button variant="accent" size="sm">Book a resource</Button></Link>} />}
        </SectionCard>

        {/* My maintenance requests */}
        <SectionCard title="My maintenance requests" icon={Wrench} count={myMaint.length} action={{ href: '/maintenance', label: 'View all' }}>
          {myMaint.length ? (
            <ul className="divide-y divide-border">
              {myMaint.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{getAsset(m.assetId)?.name}</p>
                    <p className="text-xs text-fg-muted truncate">{m.issue}</p>
                  </div>
                  <MaintenanceStatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={Wrench} title="No requests" hint="You haven’t raised any maintenance requests." action={<Link href="/maintenance"><Button variant="ghost" size="sm">Raise a request</Button></Link>} />}
        </SectionCard>

        {/* My transfers */}
        <SectionCard title="My transfers" icon={ArrowLeftRight} count={myTransfers.length} action={{ href: '/allocations', label: 'View all' }}>
          {myTransfers.length ? (
            <ul className="divide-y divide-border">
              {myTransfers.map((t) => {
                const outgoing = t.fromId === me.id;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{getAsset(t.assetId)?.name}</p>
                      <p className="text-xs text-fg-muted truncate">
                        <span className={outgoing ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>{outgoing ? 'Outgoing' : 'Incoming'}</span>
                        {' · '}{employeeName(t.fromId)} → {employeeName(t.toId)}
                      </p>
                    </div>
                    <TransferStatusBadge status={t.status} />
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState icon={ArrowLeftRight} title="No transfers" hint="No transfer requests involve you." />}
        </SectionCard>
      </div>
    </div>
  );
}
