'use client';
import Link from 'next/link';
import {
  PackageCheck,
  UserCheck,
  Wrench,
  CalendarDays,
  ArrowLeftRight,
  CalendarClock,
  AlertTriangle,
  Plus,
  CalendarPlus,
  ArrowRight,
  Activity as ActivityIcon,
} from 'lucide-react';
import { PageHeader, Card, Button, Avatar } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard, AreaChartX, BarChartX } from '@/components/ui/Chart';
import { Timeline, type TimelineItem } from '@/components/ui/Timeline';
import {
  AssetStatusBadge,
  AllocationStatusBadge,
  MaintenanceStatusBadge,
  BookingStatusBadge,
  PriorityBadge,
  ASSET_STATUS,
} from '@/components/assetflow/badges';
import { useAuth } from '@/providers/AuthProvider';
import { useAF } from '@/lib/store/assetflow-store';
import { formatCurrency, formatDate } from '@/lib/format';
import { fmtTimeRange } from '@/components/assetflow/ui';
import {
  TODAY,
  dashboardKpis,
  statusCounts,
  registrationTrend,
  departmentAllocation,
  overdueReturns,
  upcomingReturns,
  transfers,
  maintenance,
  bookings,
  activity,
  assets,
  employeeName,
  asset as getAsset,
  type AssetStatus,
} from '@/lib/mock/assetflow';

const QUICK = [
  { href: '/assets', label: 'Register Asset', icon: Plus },
  { href: '/bookings', label: 'Book Resource', icon: CalendarPlus },
  { href: '/maintenance', label: 'Raise Maintenance', icon: Wrench },
];

function SectionCard({ title, icon: Icon, action, children }: { title: string; icon: React.ComponentType<{ className?: string }>; action?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-fg-muted" />
          <h3 className="font-semibold text-fg">{title}</h3>
        </div>
        {action && (
          <Link href={action.href} className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">
            {action.label} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function StatusOverview() {
  const counts = statusCounts();
  const total = assets.length;
  const order = (Object.keys(counts) as AssetStatus[]).filter((k) => counts[k] > 0);
  const dotClass: Record<string, string> = {
    green: 'bg-emerald-500', blue: 'bg-blue-500', violet: 'bg-violet-500', amber: 'bg-amber-500', red: 'bg-red-500', slate: 'bg-slate-400', cyan: 'bg-cyan-500', brand: 'bg-brand-500',
  };
  return (
    <Card>
      <h3 className="font-semibold text-fg mb-1">Asset Status Overview</h3>
      <p className="text-sm text-fg-muted mb-4">{total} assets tracked</p>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        {order.map((k) => (
          <div key={k} className={dotClass[ASSET_STATUS[k].tone]} style={{ width: `${(counts[k] / total) * 100}%` }} title={`${ASSET_STATUS[k].label}: ${counts[k]}`} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {order.map((k) => (
          <li key={k} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dotClass[ASSET_STATUS[k].tone]}`} />
              <span className="text-fg">{ASSET_STATUS[k].label}</span>
            </span>
            <span className="font-semibold text-fg tabular-nums">{counts[k]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { v: _v } = useAF(); // subscribe so KPIs refresh on any store mutation
  const k = dashboardKpis();
  const overdue = overdueReturns();
  const upcoming = upcomingReturns();
  const pendingTransfers = transfers.filter((t) => t.status === 'requested');
  const openMaintenance = maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'rejected');
  const todayBookings = bookings.filter((b) => b.status === 'ongoing' || b.status === 'upcoming').slice(0, 5);

  const activityItems: TimelineItem[] = activity.slice(0, 6).map((a) => ({
    id: a.id,
    title: employeeName(a.actorId),
    description: `${a.action} ${a.target}`,
    time: a.at,
    tone: a.module === 'maintenance' ? 'amber' as never : a.module === 'audit' ? 'red' : a.module === 'booking' ? 'blue' : 'brand',
  }));

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`} subtitle={formatDate(TODAY, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}>
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href}>
            <Button variant={q.label === 'Register Asset' ? 'primary' : 'ghost'} size="sm">
              <q.icon className="w-4 h-4" /> {q.label}
            </Button>
          </Link>
        ))}
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 stagger">
        <StatCard label="Assets Available" value={k.available} icon={PackageCheck} tone="green" hint={`of ${k.totalAssets}`} spark={[6, 7, 7, 8, 8, 9, 9]} />
        <StatCard label="Assets Allocated" value={k.allocated} icon={UserCheck} tone="blue" hint="in use" spark={[10, 9, 9, 8, 8, 7, 8]} />
        <StatCard label="Maintenance" value={k.maintenanceToday} icon={Wrench} tone="amber" hint="open today" spark={[1, 2, 2, 1, 3, 3, 3]} />
        <StatCard label="Active Bookings" value={k.activeBookings} icon={CalendarDays} tone="purple" hint="today" spark={[3, 4, 3, 5, 4, 6, 5]} />
        <StatCard label="Pending Transfers" value={k.pendingTransfers} icon={ArrowLeftRight} tone="brand" hint="awaiting approval" spark={[0, 1, 1, 2, 1, 2, 2]} />
        <StatCard label="Upcoming Returns" value={k.upcomingReturns} icon={CalendarClock} tone={k.overdue ? 'red' : 'green'} hint={`${k.overdue} overdue`} spark={[2, 3, 2, 4, 3, 3, 4]} />
      </div>

      {/* Trend + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <ChartCard title="Assets registered — last 14 days">
            <AreaChartX data={registrationTrend()} xKey="label" dataKey="count" />
          </ChartCard>
        </div>
        <StatusOverview />
      </div>

      {/* Overdue — highlighted separately */}
      {overdue.length > 0 && (
        <Card className="mb-6 border-red-500/30 bg-red-500/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-fg">Overdue Returns</h3>
              <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-xs font-bold">{overdue.length}</span>
            </div>
            <Link href="/allocations" className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {overdue.map((a) => {
              const as = getAsset(a.assetId);
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-surface p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={employeeName(a.employeeId)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{as?.name}</p>
                      <p className="text-xs text-fg-muted truncate">{employeeName(a.employeeId)} · due {formatDate(a.expectedReturn!)}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 text-xs font-bold whitespace-nowrap">{a.daysOverdue}d late</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Returns + Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Upcoming Returns" icon={CalendarClock} action={{ href: '/allocations', label: 'View all' }}>
          {upcoming.length ? (
            <ul className="divide-y divide-border">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={employeeName(a.employeeId)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm text-fg truncate">{getAsset(a.assetId)?.name}</p>
                      <p className="text-xs text-fg-muted truncate">{employeeName(a.employeeId)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-fg-muted whitespace-nowrap">in {a.daysLeft}d</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted py-6 text-center">No upcoming returns.</p>
          )}
        </SectionCard>

        <SectionCard title="Pending Transfers" icon={ArrowLeftRight} action={{ href: '/allocations', label: 'Review' }}>
          {pendingTransfers.length ? (
            <ul className="divide-y divide-border">
              {pendingTransfers.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-fg truncate">{getAsset(t.assetId)?.name}</p>
                    <p className="text-xs text-fg-muted truncate">{employeeName(t.fromId)} → {employeeName(t.toId)}</p>
                  </div>
                  <Link href="/allocations"><Button size="sm" variant="ghost">Review</Button></Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted py-6 text-center">No pending transfers.</p>
          )}
        </SectionCard>
      </div>

      {/* Maintenance + Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Maintenance Summary" icon={Wrench} action={{ href: '/maintenance', label: 'View all' }}>
          {openMaintenance.length ? (
            <ul className="divide-y divide-border">
              {openMaintenance.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-fg truncate">{getAsset(m.assetId)?.name}</p>
                    <p className="text-xs text-fg-muted truncate">{m.issue}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={m.priority} />
                    <MaintenanceStatusBadge status={m.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted py-6 text-center">Nothing in maintenance.</p>
          )}
        </SectionCard>

        <SectionCard title="Active Bookings" icon={CalendarDays} action={{ href: '/bookings', label: 'Calendar' }}>
          {todayBookings.length ? (
            <ul className="divide-y divide-border">
              {todayBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-fg truncate">{getAsset(b.resourceId)?.name}</p>
                    <p className="text-xs text-fg-muted truncate">{fmtTimeRange(b.start, b.end)} · {employeeName(b.employeeId)}</p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted py-6 text-center">No bookings today.</p>
          )}
        </SectionCard>
      </div>

      {/* Activity + Department allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Activity" icon={ActivityIcon} action={{ href: '/activity', label: 'Full log' }}>
          <Timeline items={activityItems} />
        </SectionCard>
        <ChartCard title="Allocated assets by department">
          <BarChartX data={departmentAllocation()} xKey="label" dataKey="count" />
        </ChartCard>
      </div>
    </div>
  );
}
