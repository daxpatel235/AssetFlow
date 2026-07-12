import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { route } from '@/lib/api-error';
import type {
  Department, Category, Employee, Asset, Allocation, Transfer, Booking,
  MaintenanceRequest, AuditCycle, AppNotification, ActivityEvent,
} from '@/lib/mock/assetflow';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bootstrap — the single aggregate read.
// Returns every collection in the EXACT client shapes the UI already consumes
// (see src/lib/mock/assetflow.ts). The client store hydrates its arrays from
// this once on load and re-reads it after every mutation, so the whole app is
// backed by Postgres without touching a single page component.
// ─────────────────────────────────────────────────────────────────────────────

const d10 = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');
const dt16 = (d: Date) => d.toISOString().slice(0, 16); // wall-clock (seeded as UTC)
const num = (d: unknown) => (d == null ? 0 : Number(d));

export type BootstrapData = {
  departments: Department[];
  categories: Category[];
  employees: Employee[];
  assets: Asset[];
  allocations: Allocation[];
  transfers: Transfer[];
  bookings: Booking[];
  maintenance: MaintenanceRequest[];
  auditCycles: AuditCycle[];
  notifications: AppNotification[];
  activity: ActivityEvent[];
};

export const GET = route(async () => {
  const me = await requireUser();

  const [
    departments, categories, users, assets, allocations, transfers,
    bookings, tickets, cycles, notifications, activity,
  ] = await Promise.all([
    prisma.department.findMany({ include: { _count: { select: { employees: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.category.findMany({ include: { _count: { select: { assets: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.asset.findMany({ orderBy: { tag: 'asc' } }),
    prisma.allocation.findMany({ orderBy: { allocatedAt: 'desc' } }),
    prisma.transfer.findMany({ orderBy: { requestedAt: 'desc' } }),
    prisma.booking.findMany({ orderBy: { startTime: 'asc' } }),
    prisma.maintenanceTicket.findMany({ orderBy: { reportedAt: 'desc' } }),
    prisma.auditCycle.findMany({ include: { results: true }, orderBy: { startDate: 'desc' } }),
    prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);

  const data: BootstrapData = {
    departments: departments.map((d): Department => ({
      id: d.id, name: d.name, code: d.code, headId: d.headId ?? '',
      parentId: d.parentId, status: d.status === 'inactive' ? 'inactive' : 'active',
      employeeCount: d._count.employees,
    })),
    categories: categories.map((c): Category => ({
      id: c.id, name: c.name, description: c.description ?? '', assetCount: c._count.assets,
      icon: c.icon, fields: (c.fields as Category['fields']) ?? [],
    })),
    employees: users.map((u): Employee => ({
      id: u.id, name: u.name, email: u.email, departmentId: u.departmentId ?? '',
      role: u.role, title: u.title ?? '', status: u.isActive ? 'active' : 'inactive',
      joinedAt: d10(u.joinedAt), phone: u.phone ?? '',
    })),
    assets: assets.map((a): Asset => ({
      id: a.id, tag: a.tag, name: a.name, categoryId: a.categoryId, serial: a.serial ?? '',
      status: a.status, condition: a.condition, location: a.location ?? '',
      acquisitionDate: d10(a.acquisitionDate), acquisitionCost: num(a.acquisitionCost),
      bookable: a.bookable, holderId: a.holderId, departmentId: a.departmentId,
      ...(a.image ? { image: a.image } : {}),
      ...(a.warrantyEnds ? { warrantyEnds: d10(a.warrantyEnds) } : {}),
      ...(a.customData ? { customData: a.customData as Record<string, unknown> } : {}),
    })),
    allocations: allocations.map((al): Allocation => ({
      id: al.id, assetId: al.assetId, employeeId: al.employeeId, departmentId: al.departmentId,
      allocatedAt: d10(al.allocatedAt), expectedReturn: al.expectedReturn ? d10(al.expectedReturn) : null,
      returnedAt: al.returnedAt ? d10(al.returnedAt) : null, status: al.status,
      checkoutNote: al.checkoutNote ?? undefined, checkinNote: al.checkinNote ?? undefined,
    })),
    transfers: transfers.map((t): Transfer => ({
      id: t.id, assetId: t.assetId, fromId: t.fromId, toId: t.toId,
      requestedAt: d10(t.requestedAt), status: t.status, reason: t.reason,
      approverId: t.approverId ?? undefined,
    })),
    bookings: bookings.map((b): Booking => ({
      id: b.id, resourceId: b.assetId, employeeId: b.employeeId,
      start: dt16(b.startTime), end: dt16(b.endTime), status: b.status, purpose: b.purpose ?? '',
    })),
    maintenance: tickets.map((m): MaintenanceRequest => ({
      id: m.id, assetId: m.assetId, raisedById: m.reporterId, issue: m.issue,
      priority: m.priority, status: m.status, createdAt: d10(m.reportedAt),
      technicianId: m.assignedToId ?? undefined, cost: m.cost != null ? num(m.cost) : undefined,
      notes: safeNotes(m.notes),
    })),
    auditCycles: cycles.map((c): AuditCycle => ({
      id: c.id, name: c.name, scope: c.location ?? '', from: d10(c.startDate), to: d10(c.endDate),
      status: c.status, auditorIds: c.auditorIds,
      records: c.results.map((r) => ({ assetId: r.assetId, result: r.status, note: r.notes ?? undefined })),
    })),
    notifications: notifications.map((n): AppNotification => ({
      id: n.id, kind: n.kind as AppNotification['kind'], title: n.title, body: n.body ?? '',
      at: n.createdAt.toISOString(), read: n.read,
    })),
    activity: activity.map((a): ActivityEvent => ({
      id: a.id, actorId: a.userId ?? '', action: a.summary ?? '', target: '',
      module: (a.entity as ActivityEvent['module']) ?? 'asset', at: a.createdAt.toISOString(),
    })),
  };

  // Never cache — the store refetches this after every mutation and must see
  // the just-written state immediately (this is the "reload and it persists" win).
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
});

function safeNotes(raw: string | null): MaintenanceRequest['notes'] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
