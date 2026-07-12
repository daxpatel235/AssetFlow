import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api-error';
import type { Insight } from '@/types';

// GET /api/items/stats -> rich dashboard payload. Everything here is computed
// deterministically from the user's real data (no external calls), so the
// dashboard is fast, offline-safe, and always renders — including the
// auto-generated "insights", which read like AI but are pure arithmetic.

const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

export const GET = route(async () => {
  const user = await requireUser();
  const where = { createdById: user.id };

  // One scan over the (owner-scoped, indexed) rows — enough to derive every
  // metric below without a fan-out of round-trips. Capped for safety at scale.
  const items = await prisma.item.findMany({
    where,
    select: { id: true, name: true, price: true, quantity: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const now = Date.now();
  const weekAgo = now - 7 * DAY_MS;
  const twoWeeksAgo = now - 14 * DAY_MS;

  let total = 0;
  let active = 0;
  let archived = 0;
  let totalValue = 0;
  let priceSum = 0;
  let recent = 0; // created in the last 7 days
  let prev = 0; // created in the 7 days before that
  const statusCounts: Record<string, number> = {};

  // Trend buckets: last TREND_DAYS days, oldest → newest.
  const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(now - (TREND_DAYS - 1 - i) * DAY_MS);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 };
  });
  const trendByKey = new Map(trend.map((t) => [t.key, t]));

  for (const it of items) {
    const price = Number(it.price);
    const value = price * it.quantity;
    total += 1;
    priceSum += price;
    if (it.status === 'active') active += 1;
    if (it.status === 'archived') archived += 1;
    totalValue += value;
    statusCounts[it.status] = (statusCounts[it.status] ?? 0) + 1;

    const t = it.createdAt.getTime();
    if (t >= weekAgo) recent += 1;
    else if (t >= twoWeeksAgo) prev += 1;

    const bucket = trendByKey.get(it.createdAt.toISOString().slice(0, 10));
    if (bucket) bucket.count += 1;
  }

  const avgPrice = total ? priceSum / total : 0;
  const recentDelta = prev === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prev) / prev) * 100);

  const lowStock = items
    .filter((it) => it.status === 'active' && it.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6)
    .map((it) => ({ id: it.id, name: it.name, quantity: it.quantity }));

  const topByValue = items
    .map((it) => ({ id: it.id, name: it.name, value: Number(it.price) * it.quantity }))
    .filter((it) => it.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const byStatus = Object.entries(statusCounts).map(([label, count]) => ({ label, count }));

  // --- Auto-generated insights (deterministic; the demo "wow" that never breaks) ---
  const insights: Insight[] = [];
  if (total === 0) {
    insights.push({ kind: 'empty', tone: 'brand', text: 'Add your first item to see live insights here.' });
  } else {
    if (recentDelta > 0) insights.push({ kind: 'trend-up', tone: 'green', text: `${recentDelta}% more items added this week than last.` });
    else if (recentDelta < 0) insights.push({ kind: 'trend-down', tone: 'amber', text: `${Math.abs(recentDelta)}% fewer items added this week than last.` });
    else if (recent > 0) insights.push({ kind: 'trend-up', tone: 'brand', text: `${recent} item${recent === 1 ? '' : 's'} added in the last 7 days.` });

    if (lowStock.length) insights.push({ kind: 'low-stock', tone: 'red', text: `${lowStock.length} active item${lowStock.length === 1 ? '' : 's'} running low on stock.` });

    if (topByValue[0]) insights.push({ kind: 'value', tone: 'purple', text: `Top asset: “${topByValue[0].name}” at ${formatMoney(topByValue[0].value)}.` });

    const activeShare = total ? Math.round((active / total) * 100) : 0;
    insights.push({ kind: 'active', tone: 'blue', text: `${activeShare}% of your catalog is active (${active}/${total}).` });
  }

  return NextResponse.json({
    total,
    active,
    archived,
    recent,
    recentDelta,
    totalValue,
    avgPrice,
    lowStockCount: items.filter((it) => it.status === 'active' && it.quantity <= LOW_STOCK_THRESHOLD).length,
    byStatus,
    trend: trend.map(({ label, count }) => ({ label, count })),
    lowStock,
    topByValue,
    insights,
  });
});

function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
