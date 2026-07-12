'use client';
import { useMemo, useState } from 'react';
import { Download, FileText, TrendingUp, Wallet, Wrench, Percent, Trophy, Moon, ArrowDownRight, ShieldAlert, Clock, CalendarClock } from 'lucide-react';
import { PageHeader, Card, Button, Select, SectionLabel } from '@/components/ui/kit';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard, BarChartX, PieChartX, AreaChartX } from '@/components/ui/Chart';
import { type Column } from '@/components/ui/DataTable';
import { AssetStatusBadge, categoryIcon } from '@/components/assetflow/badges';
import { useToast } from '@/providers/ToastProvider';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { formatCurrency } from '@/lib/format';
import {
  assets, categories, departments, allocations, maintenance, categoryChartData,
  bookingHeatmap, categoryName, departmentName, category as getCategory, TODAY, registrationTrend, type Asset, type AssetStatus,
} from '@/lib/mock/assetflow';

const HEAT = ['bg-surface-2', 'bg-brand/25', 'bg-brand/50', 'bg-brand/80'];

export default function ReportsPage() {
  const toast = useToast();
  const [dept, setDept] = useState('');
  const [cat, setCat] = useState('');
  const [range, setRange] = useState('90');

  const scoped = useMemo(() => assets.filter((a) => (!dept || a.departmentId === dept) && (!cat || a.categoryId === cat)), [dept, cat]);

  const counts = scoped.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, { available: 0, allocated: 0, reserved: 0, maintenance: 0, lost: 0, retired: 0, disposed: 0 } as Record<AssetStatus, number>);
  
  const totalValue = scoped.reduce((s, a) => s + a.acquisitionCost, 0);
  const utilization = Math.round((counts.allocated / (counts.available + counts.allocated + counts.reserved || 1)) * 100);
  const scopedMaint = maintenance.filter(m => scoped.some(a => a.id === m.assetId));
  const maintCost = scopedMaint.reduce((s, m) => s + (m.cost ?? 0), 0);
  const avgMaint = Math.round(maintCost / Math.max(1, scopedMaint.filter((m) => m.cost).length));

  // utilization by category (allocated / total)
  const utilByCat = categories.map((c) => {
    const total = scoped.filter((a) => a.categoryId === c.id).length;
    const used = scoped.filter((a) => a.categoryId === c.id && (a.status === 'allocated' || a.status === 'reserved')).length;
    return { label: c.name, count: total ? Math.round((used / total) * 100) : 0 };
  });

  // maintenance frequency by category
  const maintByCat = categories.map((c) => ({ label: c.name, count: scopedMaint.filter((m) => scoped.find((a) => a.id === m.assetId)?.categoryId === c.id).length }));

  // lifecycle distribution
  const lifecycle = (Object.keys(counts) as AssetStatus[]).filter((k) => counts[k] > 0).map((k) => ({ label: k, count: counts[k] }));

  // scoped department allocation
  const deptAlloc = departments.map((d) => ({
    label: d.code,
    name: d.name,
    count: scoped.filter((a) => a.departmentId === d.id && a.status === 'allocated').length,
    total: scoped.filter((a) => a.departmentId === d.id).length,
  }));

  // most-used vs idle
  const allocCount = (id: string) => allocations.filter((a) => a.assetId === id).length;
  const mostUsed = [...scoped].sort((a, b) => allocCount(b.id) - allocCount(a.id)).filter((a) => allocCount(a.id) > 0).slice(0, 5);
  const idle = scoped.filter((a) => a.status === 'available' && allocCount(a.id) === 0).slice(0, 5);

  const heat = bookingHeatmap();

  // Condition distribution
  const conditionCounts = scoped.reduce((acc, a) => {
    acc[a.condition] = (acc[a.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const conditionData = Object.entries(conditionCounts).map(([label, count]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), count }));

  // Maintenance cost by category
  const maintCostByCat = categories.map((c) => {
    const cost = scopedMaint
      .filter((m) => scoped.find((a) => a.id === m.assetId)?.categoryId === c.id)
      .reduce((s, m) => s + (m.cost ?? 0), 0);
    return { label: c.name, count: cost };
  });

  // Highest maintenance cost assets
  const highestMaintAssets = [...scoped]
    .map(a => ({ asset: a, cost: maintenance.filter(m => m.assetId === a.id).reduce((s, m) => s + (m.cost ?? 0), 0) }))
    .filter(x => x.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  const exportColumns: Column<Asset>[] = [
    { key: 'tag', label: 'Tag' },
    { key: 'name', label: 'Name' },
    { key: 'categoryId', label: 'Category', exportValue: (a) => categoryName(a.categoryId) },
    { key: 'status', label: 'Status' },
    { key: 'location', label: 'Location' },
    { key: 'acquisitionCost', label: 'Cost', exportValue: (a) => a.acquisitionCost },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Operational insight across assets, allocation, maintenance and bookings">
        <Button variant="ghost" size="sm" onClick={() => { exportToCSV(exportColumns, scoped, 'assetflow-report'); toast.success('CSV exported'); }}><Download className="w-4 h-4" /> CSV</Button>
        <Button variant="ghost" size="sm" onClick={() => { exportToPDF(exportColumns, scoped, 'assetflow-report', 'AssetFlow Report'); toast.success('PDF exported'); }}><FileText className="w-4 h-4" /> PDF</Button>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div><SectionLabel className="mb-1.5 block">Department</SectionLabel><Select value={dept} onChange={(e) => setDept(e.target.value)} options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="All departments" className="min-w-[12rem]" /></div>
          <div><SectionLabel className="mb-1.5 block">Category</SectionLabel><Select value={cat} onChange={(e) => setCat(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="All categories" className="min-w-[12rem]" /></div>
          <div><SectionLabel className="mb-1.5 block">Date range</SectionLabel><Select value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: '365', label: 'Last year' }]} placeholder="Range" className="min-w-[12rem]" /></div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Portfolio Value" value={formatCurrency(totalValue)} icon={Wallet} tone="green" hint={`${scoped.length} assets`} spark={[52, 55, 54, 58, 60, 63, 66]} />
        <StatCard label="Utilization Rate" value={`${utilization}%`} icon={Percent} tone="brand" delta={6} hint="allocated / usable" spark={[62, 64, 61, 68, 70, 74, 78]} />
        <StatCard label="Maintenance Spend" value={formatCurrency(maintCost)} icon={Wrench} tone="amber" hint={`avg ${formatCurrency(avgMaint)}`} spark={[3, 5, 4, 6, 5, 4, 6]} />
        <StatCard label="Active Assets" value={counts.available + counts.allocated + counts.reserved} icon={TrendingUp} tone="blue" hint="in service" spark={[18, 19, 19, 20, 20, 21, 21]} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Assets registered — last 14 days"><AreaChartX data={registrationTrend()} xKey="label" dataKey="count" /></ChartCard>
        <ChartCard title="Utilization by category (%)"><BarChartX data={utilByCat} xKey="label" dataKey="count" /></ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2"><ChartCard title="Allocated assets by department"><BarChartX data={deptAlloc} xKey="label" dataKey="count" /></ChartCard></div>
        <ChartCard title="Lifecycle distribution"><PieChartX data={lifecycle} /></ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Maintenance frequency by category"><BarChartX data={maintByCat} xKey="label" dataKey="count" /></ChartCard>

        {/* Booking heatmap */}
        <Card>
          <h3 className="font-semibold text-fg mb-4">Resource booking heatmap</h3>
          <div className="overflow-x-auto">
            <div className="inline-block">
              <div className="flex gap-1 mb-1 pl-10">
                {heat.hours.map((h) => <span key={h} className="w-6 text-[10px] text-fg-muted text-center">{h}</span>)}
              </div>
              {heat.grid.map((row, ri) => (
                <div key={ri} className="flex gap-1 mb-1 items-center">
                  <span className="w-9 text-[11px] text-fg-muted text-right pr-1">{heat.rows[ri]}</span>
                  {row.map((v, ci) => <span key={ci} className={`w-6 h-6 rounded ${HEAT[v]}`} title={`${heat.rows[ri]} ${heat.hours[ci]}:00 · ${v === 0 ? 'free' : v === 3 ? 'peak' : 'busy'}`} />)}
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-3 pl-10 text-[11px] text-fg-muted"><span>Less</span>{HEAT.map((c, i) => <span key={i} className={`w-4 h-4 rounded ${c}`} />)}<span>More</span></div>
            </div>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Asset condition breakdown"><PieChartX data={conditionData} /></ChartCard>
        <div className="lg:col-span-2"><ChartCard title="Maintenance cost by category"><BarChartX data={maintCostByCat} xKey="label" dataKey="count" /></ChartCard></div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-purple-500" /><h3 className="font-semibold text-fg">Most-used assets</h3></div>
          <ul className="divide-y divide-border">
            {mostUsed.map((a, i) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-3 min-w-0"><span className="grid place-items-center w-6 h-6 rounded-md bg-surface-2 text-xs font-semibold text-fg-muted">{i + 1}</span><span className="text-sm text-fg truncate">{a.name}</span></span>
                <span className="text-xs font-semibold text-fg-muted">{allocCount(a.id)} allocations</span>
              </li>
            ))}
            {!mostUsed.length && <li className="py-6 text-center text-sm text-fg-muted">No usage in range.</li>}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4"><Moon className="w-4 h-4 text-blue-500" /><h3 className="font-semibold text-fg">Idle assets</h3><span className="text-xs text-fg-muted">(never allocated)</span></div>
          <ul className="divide-y divide-border">
            {idle.map((a) => {
              const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
              return (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-3 min-w-0"><span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-2 text-fg-muted"><Icon className="w-4 h-4" /></span><span className="text-sm text-fg truncate">{a.name}</span></span>
                  <span className="flex items-center gap-2"><AssetStatusBadge status={a.status} /><ArrowDownRight className="w-4 h-4 text-fg-muted" /></span>
                </li>
              );
            })}
            {!idle.length && <li className="py-6 text-center text-sm text-fg-muted">No idle assets.</li>}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4"><Wrench className="w-4 h-4 text-red-500" /><h3 className="font-semibold text-fg">Highest repair costs</h3></div>
          <ul className="divide-y divide-border">
            {highestMaintAssets.map(({ asset: a, cost }) => {
              const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
              return (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-3 min-w-0"><span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-2 text-fg-muted"><Icon className="w-4 h-4" /></span><span className="text-sm text-fg truncate">{a.name}</span></span>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(cost)}</span>
                </li>
              );
            })}
            {!highestMaintAssets.length && <li className="py-6 text-center text-sm text-fg-muted">No maintenance costs recorded.</li>}
          </ul>
        </Card>
      </div>
      {/* ── Lifecycle Alerts ──────────────────────────────────────────── */}
      {(() => {
        const MS_PER_DAY = 86_400_000;
        const daysFromToday = (iso: string) => Math.round((new Date(iso).getTime() - TODAY.getTime()) / MS_PER_DAY);
        const YEAR_MS = 365.25 * MS_PER_DAY;
        const ageYears = (iso: string) => Math.round(((TODAY.getTime() - new Date(iso).getTime()) / YEAR_MS) * 10) / 10;

        const warrantyExpiring = scoped
          .filter((a) => a.warrantyEnds && daysFromToday(a.warrantyEnds) >= 0 && daysFromToday(a.warrantyEnds) <= 90)
          .sort((a, b) => daysFromToday(a.warrantyEnds!) - daysFromToday(b.warrantyEnds!));

        const nearingRetirement = scoped
          .filter((a) => ageYears(a.acquisitionDate) >= 5 && a.status !== 'retired' && a.status !== 'disposed')
          .sort((a, b) => ageYears(b.acquisitionDate) - ageYears(a.acquisitionDate));

        const openMaintIds = new Set(maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'rejected').map((m) => m.assetId));
        const dueForMaint = scoped
          .filter((a) => (a.condition === 'fair' || a.condition === 'poor') && !openMaintIds.has(a.id) && a.status !== 'retired' && a.status !== 'disposed')
          .sort((a, b) => (a.condition === 'poor' ? 0 : 1) - (b.condition === 'poor' ? 0 : 1));

        return (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-fg">Lifecycle Alerts</h2>
              <span className="text-sm text-fg-muted">— Due for maintenance / nearing retirement / warranty expiry</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Warranty expiring */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarClock className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-fg">Warranty Expiring</h3>
                  <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-xs font-bold">{warrantyExpiring.length}</span>
                </div>
                <p className="text-xs text-fg-muted mb-3">Assets with warranty ending within 90 days</p>
                {warrantyExpiring.length ? (
                  <ul className="divide-y divide-border">
                    {warrantyExpiring.map((a) => {
                      const days = daysFromToday(a.warrantyEnds!);
                      const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
                      return (
                        <li key={a.id} className="flex items-center justify-between py-2.5">
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-2 text-fg-muted shrink-0"><Icon className="w-4 h-4" /></span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-fg truncate">{a.name}</span>
                              <span className="block text-xs text-fg-muted">{a.tag} · {departmentName(a.departmentId)}</span>
                            </span>
                          </span>
                          <span className={`text-xs font-semibold whitespace-nowrap ${days <= 30 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{days}d left</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="text-sm text-fg-muted py-6 text-center">No upcoming warranty expirations.</p>}
              </Card>

              {/* Nearing retirement */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-fg">Nearing Retirement</h3>
                  <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-bold">{nearingRetirement.length}</span>
                </div>
                <p className="text-xs text-fg-muted mb-3">Active assets older than 5 years</p>
                {nearingRetirement.length ? (
                  <ul className="divide-y divide-border">
                    {nearingRetirement.map((a) => {
                      const age = ageYears(a.acquisitionDate);
                      const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
                      return (
                        <li key={a.id} className="flex items-center justify-between py-2.5">
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-2 text-fg-muted shrink-0"><Icon className="w-4 h-4" /></span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-fg truncate">{a.name}</span>
                              <span className="block text-xs text-fg-muted">{a.tag} · {departmentName(a.departmentId)}</span>
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <AssetStatusBadge status={a.status} />
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">{age}y old</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="text-sm text-fg-muted py-6 text-center">No assets nearing retirement.</p>}
              </Card>

              {/* Due for maintenance */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-4 h-4 text-violet-500" />
                  <h3 className="font-semibold text-fg">Due for Maintenance</h3>
                  <span className="rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 text-xs font-bold">{dueForMaint.length}</span>
                </div>
                <p className="text-xs text-fg-muted mb-3">Fair/poor condition with no open maintenance request</p>
                {dueForMaint.length ? (
                  <ul className="divide-y divide-border">
                    {dueForMaint.map((a) => {
                      const Icon = categoryIcon(getCategory(a.categoryId)?.icon ?? '');
                      return (
                        <li key={a.id} className="flex items-center justify-between py-2.5">
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="grid place-items-center w-7 h-7 rounded-lg bg-surface-2 text-fg-muted shrink-0"><Icon className="w-4 h-4" /></span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-fg truncate">{a.name}</span>
                              <span className="block text-xs text-fg-muted">{a.tag} · {departmentName(a.departmentId)}</span>
                            </span>
                          </span>
                          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${a.condition === 'poor' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>{a.condition}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="text-sm text-fg-muted py-6 text-center">All assets are in good shape.</p>}
              </Card>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
