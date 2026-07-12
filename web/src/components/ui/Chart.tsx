'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, Label } from 'recharts';
import { Card } from './kit';
import { useId, useState, useEffect, type ReactNode } from 'react';

export const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

const AXIS = { stroke: 'rgb(var(--fg-muted))', fontSize: 12, axisLine: false, tickLine: false };
const TOOLTIP = {
  contentStyle: {
    background: 'rgb(var(--surface))',
    border: '1px solid rgb(var(--border))',
    borderRadius: 10,
    color: 'rgb(var(--fg))',
    fontSize: 12,
    boxShadow: '0 12px 32px -12px rgb(15 23 42 / 0.28)',
    padding: '8px 12px',
  },
  labelStyle: { color: 'rgb(var(--fg-muted))', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'rgb(var(--fg))' },
};

export function ChartCard({ title, action, children, height = 280 }: { title?: string; action?: ReactNode; children: ReactNode; height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  return (
    <Card>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-fg">{title}</h3>}
          {action}
        </div>
      )}
      <div style={{ width: '100%', height }}>
        {mounted && <ResponsiveContainer>{children as never}</ResponsiveContainer>}
      </div>
    </Card>
  );
}

export function BarChartX({ data, xKey, dataKey, ...props }: { data: Record<string, unknown>[]; xKey: string; dataKey: string; [key: string]: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} {...props}>
      <defs>
        <linearGradient id="barBrand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} {...AXIS} />
      <YAxis {...AXIS} allowDecimals={false} width={32} />
      <Tooltip {...TOOLTIP} cursor={{ fill: 'rgb(var(--fg-muted) / 0.06)' }} />
      <Bar dataKey={dataKey} fill="url(#barBrand)" radius={[6, 6, 0, 0]} maxBarSize={52} />
    </BarChart>
  );
}

// Smooth gradient area chart — used for the dashboard "added over time" trend.
// Shares the brand blue + semantic axis/tooltip tokens with the other charts.
export function AreaChartX({ data, xKey, dataKey, ...props }: { data: Record<string, unknown>[]; xKey: string; dataKey: string; [key: string]: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} {...props}>
      <defs>
        <linearGradient id="areaBrand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} {...AXIS} interval="preserveStartEnd" minTickGap={24} />
      <YAxis {...AXIS} allowDecimals={false} width={32} />
      <Tooltip {...TOOLTIP} cursor={{ stroke: 'rgb(var(--border))' }} />
      <Area type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2.5} fill="url(#areaBrand)" activeDot={{ r: 5, strokeWidth: 2, stroke: 'rgb(var(--surface))' }} />
    </AreaChart>
  );
}

export function PieChartX({ data, dataKey = 'count', nameKey = 'label', centerLabel = 'total', ...props }: { data: Record<string, unknown>[]; dataKey?: string; nameKey?: string; centerLabel?: string; [key: string]: any }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = data.reduce((s, d) => s + (Number(d[dataKey]) || 0), 0);
  return (
    <PieChart {...props}>
      <Tooltip {...TOOLTIP} />
      <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={56} outerRadius={86} paddingAngle={3} cornerRadius={5} stroke="rgb(var(--surface))" strokeWidth={3}>
        {data.map((_, i) => (
          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        ))}
        <Label position="center" content={({ viewBox }) => {
          const vb = viewBox as { cx: number; cy: number } | undefined;
          if (!vb) return null;
          return (
            <text x={vb.cx} y={vb.cy} textAnchor="middle" dominantBaseline="central">
              <tspan x={vb.cx} dy="-0.1em" fontSize="26" fontWeight={700} fill="rgb(var(--fg))">{total}</tspan>
              <tspan x={vb.cx} dy="1.5em" fontSize="11" fill="rgb(var(--fg-muted))">{centerLabel}</tspan>
            </text>
          );
        }} />
      </Pie>
    </PieChart>
  );
}

// Lightweight inline SVG sparkline — crisp at any size, no chart runtime cost.
export function Sparkline({ data, stroke = '#2563eb', className = '' }: { data: number[]; stroke?: string; className?: string }) {
  const id = useId();
  const w = 100, h = 32, pad = 3;
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - pad - ((v - min) / range) * (h - pad * 2)] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
