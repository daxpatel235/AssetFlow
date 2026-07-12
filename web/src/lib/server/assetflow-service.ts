import 'server-only';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { Prisma, Asset } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-error';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notify';
import { permissionsFor, type Permissions } from '@/lib/permissions';
import type { SessionUser } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// AssetFlow — server-side business logic (the real backend).
// Every lifecycle action the UI can trigger lives here: validated (Zod),
// authorised (RBAC by session role, never client-supplied), and written inside
// a transaction so multi-row invariants (e.g. transfer = close one allocation +
// open another + flip the asset) can never half-apply. Activity + notifications
// are recorded as side effects. The client refetches /api/bootstrap afterward.
// ─────────────────────────────────────────────────────────────────────────────

type Module = 'asset' | 'allocation' | 'booking' | 'maintenance' | 'audit' | 'org';
const TODAY = () => new Date().toISOString().slice(0, 10);
const label = (a: { name: string; tag: string }) => `${a.name} (${a.tag})`;

function must(actor: SessionUser, perm: keyof Permissions): void {
  if (!permissionsFor(actor.role)[perm]) {
    throw ApiError.forbidden('Your role does not permit this action.');
  }
}

function moduleAction(m: Module): 'create' | 'update' | 'transfer' | 'audit' {
  if (m === 'audit') return 'audit';
  if (m === 'allocation') return 'transfer';
  if (m === 'asset') return 'create';
  return 'update';
}

// Fire-and-forget audit trail entry (swallows its own errors).
function log(actor: SessionUser, phrase: string, module: Module): void {
  void logActivity({ action: moduleAction(module), entity: module, summary: phrase, userId: actor.id, userName: actor.name });
}

// Ping everyone who can approve so requests never sit unseen.
async function notifyManagers(input: { kind?: string; title: string; body: string }): Promise<void> {
  const managers = await prisma.user.findMany({ where: { role: { in: ['admin', 'asset_manager'] }, isActive: true }, select: { id: true } });
  await Promise.all(managers.map((m) => notify(m.id, input)));
}

type Note = { at: string; byId: string; text: string };
const readNotes = (raw: string | null): Note[] => {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
};
const appendNote = (raw: string | null, note: Note) => JSON.stringify([...readNotes(raw), note]);

async function getAsset(client: Prisma.TransactionClient, id: string): Promise<Asset> {
  const a = await client.asset.findUnique({ where: { id } });
  if (!a) throw ApiError.notFound('Asset not found.');
  return a;
}

// ── Zod payload schemas ──────────────────────────────────────────────────────
const S = {
  registerAsset: z.object({
    name: z.string().min(1), categoryId: z.string().min(1), serial: z.string().optional(),
    location: z.string().optional(), acquisitionDate: z.string().optional(),
    acquisitionCost: z.number().nonnegative().optional(),
    condition: z.enum(['new', 'good', 'fair', 'poor']).optional(),
    departmentId: z.string().nullable().optional(), bookable: z.boolean().optional(),
    warrantyEnds: z.string().optional(), customData: z.record(z.any()).optional(),
  }),
  allocate: z.object({
    assetId: z.string().min(1), targetType: z.enum(['employee', 'department']),
    employeeId: z.string().optional(), departmentId: z.string().optional(),
    expectedReturn: z.string().nullable().optional(),
    condition: z.enum(['new', 'good', 'fair', 'poor']).optional(), note: z.string().optional(),
  }),
  returnAllocation: z.object({ allocationId: z.string().min(1), condition: z.enum(['new', 'good', 'fair', 'poor']).optional(), note: z.string().optional() }),
  createBooking: z.object({ resourceId: z.string().min(1), start: z.string().min(1), end: z.string().min(1), purpose: z.string().optional() }),
  requestTransfer: z.object({ assetId: z.string().min(1), fromId: z.string().min(1), toId: z.string().min(1), reason: z.string().min(1) }),
  decideTransfer: z.object({ transferId: z.string().min(1), approve: z.boolean() }),
  raiseMaintenance: z.object({ assetId: z.string().min(1), issue: z.string().min(1), priority: z.enum(['low', 'medium', 'high', 'critical']) }),
  decideMaintenance: z.object({ id: z.string().min(1), approve: z.boolean() }),
  assignTechnician: z.object({ id: z.string().min(1), technicianId: z.string().min(1) }),
  startMaintenance: z.object({ id: z.string().min(1) }),
  resolveMaintenance: z.object({ id: z.string().min(1) }),
  setAuditResult: z.object({ cycleId: z.string().min(1), assetId: z.string().min(1), result: z.enum(['pending', 'verified', 'missing', 'damaged']), note: z.string().optional() }),
  closeAudit: z.object({ cycleId: z.string().min(1) }),
  createAuditCycle: z.object({ name: z.string().min(1), scope: z.string().min(1), from: z.string().min(1), to: z.string().min(1), auditorIds: z.array(z.string()), assetIds: z.array(z.string()) }),
  addDepartment: z.object({ name: z.string().min(1), code: z.string().optional(), headId: z.string().optional(), parentId: z.string().nullable().optional() }),
  updateDepartment: z.object({ id: z.string().min(1), name: z.string().optional(), code: z.string().optional(), headId: z.string().optional(), parentId: z.string().nullable().optional() }),
  toggleDepartmentStatus: z.object({ id: z.string().min(1) }),
  addCategory: z.object({ name: z.string().min(1), description: z.string().optional(), icon: z.string().optional(), fields: z.array(z.object({ name: z.string(), type: z.enum(['text', 'number', 'date', 'boolean']), required: z.boolean().optional() })).optional() }),
  updateCategory: z.object({ id: z.string().min(1), name: z.string().optional(), description: z.string().optional() }),
  addEmployee: z.object({ name: z.string().min(1), email: z.string().email(), departmentId: z.string().min(1), title: z.string().optional() }),
  setEmployeeRole: z.object({ id: z.string().min(1), role: z.enum(['admin', 'asset_manager', 'dept_head', 'employee']) }),
  toggleEmployeeStatus: z.object({ id: z.string().min(1) }),
  markAllRead: z.object({}).optional(),
  markRead: z.object({ id: z.string().min(1) }),
};

// ── Dispatcher ───────────────────────────────────────────────────────────────
export async function runAction(actor: SessionUser, action: string, payload: unknown): Promise<unknown> {
  switch (action) {
    // ── Assets ────────────────────────────────────────────────────────────
    case 'registerAsset': {
      must(actor, 'registerAsset');
      const p = S.registerAsset.parse(payload);
      const count = await prisma.asset.count();
      const tag = `AF-${String(count + 1).padStart(4, '0')}`;
      const a = await prisma.asset.create({
        data: {
          tag, name: p.name, categoryId: p.categoryId,
          serial: p.serial || `SN-${Math.floor(Math.random() * 90000 + 10000)}`,
          status: 'available', condition: p.condition ?? 'new',
          location: p.location || 'IT Store',
          acquisitionDate: p.acquisitionDate ? new Date(p.acquisitionDate) : new Date(),
          acquisitionCost: p.acquisitionCost ?? 0, bookable: !!p.bookable,
          holderId: null, departmentId: p.departmentId ?? null,
          warrantyEnds: p.warrantyEnds ? new Date(p.warrantyEnds) : null,
          customData: (p.customData as Prisma.InputJsonValue) ?? undefined,
        },
      });
      log(actor, `registered new asset ${label(a)}`, 'asset');
      return { tag };
    }

    // ── Allocation ────────────────────────────────────────────────────────
    case 'allocate': {
      must(actor, 'allocate');
      const p = S.allocate.parse(payload);
      const a = await getAsset(prisma, p.assetId);
      if (p.targetType === 'employee') {
        if (!p.employeeId) throw ApiError.badRequest('Select an employee.');
        await prisma.$transaction([
          prisma.asset.update({ where: { id: a.id }, data: { status: 'allocated', holderId: p.employeeId } }),
          prisma.allocation.create({ data: { assetId: a.id, employeeId: p.employeeId, allocatedAt: new Date(), expectedReturn: p.expectedReturn ? new Date(p.expectedReturn) : null, status: 'active', checkoutNote: p.note } }),
        ]);
        const emp = await prisma.user.findUnique({ where: { id: p.employeeId }, select: { id: true, name: true } });
        log(actor, `allocated ${label(a)} → ${emp?.name ?? 'employee'}`, 'allocation');
        if (emp) await notify(emp.id, { kind: 'asset_assigned', title: 'Asset assigned', body: `${label(a)} assigned to you.` });
      } else {
        if (!p.departmentId) throw ApiError.badRequest('Select a department.');
        const dept = await prisma.department.findUnique({ where: { id: p.departmentId }, select: { name: true, headId: true } });
        const holderForRecord = dept?.headId ?? actor.id;
        await prisma.$transaction([
          prisma.asset.update({ where: { id: a.id }, data: { status: 'allocated', holderId: null, departmentId: p.departmentId } }),
          prisma.allocation.create({ data: { assetId: a.id, employeeId: holderForRecord, departmentId: p.departmentId, allocatedAt: new Date(), expectedReturn: p.expectedReturn ? new Date(p.expectedReturn) : null, status: 'active', checkoutNote: p.note || `Shared with ${dept?.name ?? 'department'}` } }),
        ]);
        log(actor, `allocated ${label(a)} → ${dept?.name ?? 'department'} (dept)`, 'allocation');
      }
      return { ok: true };
    }

    case 'returnAllocation': {
      const p = S.returnAllocation.parse(payload);
      const al = await prisma.allocation.findUnique({ where: { id: p.allocationId } });
      if (!al) throw ApiError.notFound('Allocation not found.');
      const a = await getAsset(prisma, al.assetId);
      await prisma.$transaction([
        prisma.allocation.update({ where: { id: al.id }, data: { status: 'returned', returnedAt: new Date(), checkinNote: p.note || 'Returned via check-in' } }),
        prisma.asset.update({ where: { id: a.id }, data: { status: 'available', holderId: null, ...(p.condition ? { condition: p.condition } : {}) } }),
      ]);
      log(actor, `returned ${label(a)}`, 'allocation');
      return { ok: true };
    }

    case 'requestTransfer': {
      const p = S.requestTransfer.parse(payload);
      const a = await getAsset(prisma, p.assetId);
      await prisma.transfer.create({ data: { assetId: p.assetId, fromId: p.fromId, toId: p.toId, reason: p.reason, status: 'requested', requestedAt: new Date() } });
      log(actor, `requested transfer of ${label(a)}`, 'allocation');
      await notifyManagers({ kind: 'transfer_approved', title: 'Transfer request', body: `${actor.name} requested a transfer of ${label(a)}.` });
      return { ok: true };
    }

    case 'decideTransfer': {
      must(actor, 'approveTransfers');
      const p = S.decideTransfer.parse(payload);
      const t = await prisma.transfer.findUnique({ where: { id: p.transferId } });
      if (!t) throw ApiError.notFound('Transfer not found.');
      const a = await getAsset(prisma, t.assetId);
      if (p.approve) {
        const prev = await prisma.allocation.findFirst({ where: { assetId: a.id, employeeId: t.fromId, returnedAt: null } });
        await prisma.$transaction([
          prisma.transfer.update({ where: { id: t.id }, data: { status: 'completed', approverId: actor.id } }),
          ...(prev ? [prisma.allocation.update({ where: { id: prev.id }, data: { status: 'returned', returnedAt: new Date(), checkinNote: 'Transferred' } })] : []),
          prisma.asset.update({ where: { id: a.id }, data: { holderId: t.toId, status: 'allocated' } }),
          prisma.allocation.create({ data: { assetId: a.id, employeeId: t.toId, allocatedAt: new Date(), status: 'active', checkoutNote: 'Received via transfer' } }),
        ]);
        const to = await prisma.user.findUnique({ where: { id: t.toId }, select: { id: true, name: true } });
        log(actor, `approved transfer of ${label(a)}`, 'allocation');
        if (to) await notify(to.id, { kind: 'transfer_approved', title: 'Transfer approved', body: `${label(a)} transferred to you.` });
      } else {
        await prisma.transfer.update({ where: { id: t.id }, data: { status: 'rejected', approverId: actor.id } });
        log(actor, `rejected transfer of ${label(a)}`, 'allocation');
      }
      return { ok: true };
    }

    // ── Bookings ──────────────────────────────────────────────────────────
    case 'createBooking': {
      must(actor, 'book');
      const p = S.createBooking.parse(payload);
      const a = await getAsset(prisma, p.resourceId);
      if (!a.bookable) throw ApiError.badRequest('This asset is not bookable.');
      // Times arrive as wall-clock 'YYYY-MM-DDTHH:mm'; store as UTC so the
      // calendar round-trips the exact slot (matches how bootstrap reads them).
      const start = new Date(p.start + 'Z');
      const end = new Date(p.end + 'Z');
      if (!(end.getTime() > start.getTime())) throw ApiError.badRequest('End time must be after the start time.');
      const clash = await prisma.booking.findFirst({ where: { assetId: a.id, status: { not: 'cancelled' }, startTime: { lt: end }, endTime: { gt: start } } });
      if (clash) throw ApiError.conflict('That time slot overlaps an existing booking.');
      const now = Date.now();
      const status = now >= start.getTime() && now <= end.getTime() ? 'ongoing' : end.getTime() < now ? 'completed' : 'upcoming';
      await prisma.booking.create({ data: { assetId: a.id, employeeId: actor.id, startTime: start, endTime: end, purpose: p.purpose || 'New booking', status } });
      log(actor, `booked ${a.name} · ${p.start.slice(11)}–${p.end.slice(11)}`, 'booking');
      return { ok: true };
    }

    // ── Maintenance ───────────────────────────────────────────────────────
    case 'raiseMaintenance': {
      must(actor, 'raiseMaintenance');
      const p = S.raiseMaintenance.parse(payload);
      const a = await getAsset(prisma, p.assetId);
      await prisma.maintenanceTicket.create({ data: { assetId: p.assetId, reporterId: actor.id, issue: p.issue, priority: p.priority, status: 'pending', reportedAt: new Date(), notes: JSON.stringify([{ at: TODAY(), byId: actor.id, text: 'Raised request.' }]) } });
      log(actor, `raised maintenance for ${label(a)}`, 'maintenance');
      await notifyManagers({ kind: 'maintenance_approved', title: 'Maintenance request', body: `${actor.name} raised a ${p.priority} issue on ${label(a)}.` });
      return { ok: true };
    }

    case 'decideMaintenance': {
      must(actor, 'approveMaintenance');
      const p = S.decideMaintenance.parse(payload);
      const m = await prisma.maintenanceTicket.findUnique({ where: { id: p.id } });
      if (!m) throw ApiError.notFound('Ticket not found.');
      const a = await getAsset(prisma, m.assetId);
      const note = { at: TODAY(), byId: actor.id, text: p.approve ? `Approved by ${actor.name}` : `Rejected by ${actor.name}` };
      await prisma.$transaction([
        prisma.maintenanceTicket.update({ where: { id: m.id }, data: { status: p.approve ? 'approved' : 'rejected', notes: appendNote(m.notes, note) } }),
        ...(p.approve ? [prisma.asset.update({ where: { id: a.id }, data: { status: 'maintenance' } })] : []),
      ]);
      log(actor, `${p.approve ? 'approved' : 'rejected'} maintenance for ${label(a)}`, 'maintenance');
      await notify(m.reporterId, p.approve
        ? { kind: 'maintenance_approved', title: 'Maintenance approved', body: `${label(a)} approved for repair — now Under Maintenance.` }
        : { kind: 'maintenance_rejected', title: 'Maintenance rejected', body: `Your request for ${label(a)} was rejected.` });
      return { ok: true };
    }

    case 'assignTechnician': {
      must(actor, 'approveMaintenance');
      const p = S.assignTechnician.parse(payload);
      const m = await prisma.maintenanceTicket.findUnique({ where: { id: p.id } });
      if (!m) throw ApiError.notFound('Ticket not found.');
      const tech = await prisma.user.findUnique({ where: { id: p.technicianId }, select: { id: true, name: true } });
      await prisma.maintenanceTicket.update({ where: { id: m.id }, data: { status: 'assigned', assignedToId: p.technicianId, notes: appendNote(m.notes, { at: TODAY(), byId: actor.id, text: `Assigned to ${tech?.name ?? 'technician'}.` }) } });
      if (tech) await notify(tech.id, { kind: 'maintenance_approved', title: 'Repair assigned to you', body: `You have been assigned a repair ticket.` });
      return { ok: true };
    }

    case 'startMaintenance': {
      const p = S.startMaintenance.parse(payload);
      const m = await prisma.maintenanceTicket.findUnique({ where: { id: p.id } });
      if (!m) throw ApiError.notFound('Ticket not found.');
      if (!permissionsFor(actor.role).approveMaintenance && m.assignedToId !== actor.id) throw ApiError.forbidden('Only the assigned technician or a manager can start this.');
      const a = await getAsset(prisma, m.assetId);
      await prisma.maintenanceTicket.update({ where: { id: m.id }, data: { status: 'in_progress', notes: appendNote(m.notes, { at: TODAY(), byId: actor.id, text: 'Work started.' }) } });
      log(actor, `started repair on ${label(a)}`, 'maintenance');
      return { ok: true };
    }

    case 'resolveMaintenance': {
      const p = S.resolveMaintenance.parse(payload);
      const m = await prisma.maintenanceTicket.findUnique({ where: { id: p.id } });
      if (!m) throw ApiError.notFound('Ticket not found.');
      if (!permissionsFor(actor.role).approveMaintenance && m.assignedToId !== actor.id) throw ApiError.forbidden('Only the assigned technician or a manager can resolve this.');
      const a = await getAsset(prisma, m.assetId);
      await prisma.$transaction([
        prisma.maintenanceTicket.update({ where: { id: m.id }, data: { status: 'resolved', resolvedAt: new Date(), notes: appendNote(m.notes, { at: TODAY(), byId: actor.id, text: 'Repair completed — asset back in service.' }) } }),
        ...(a.status === 'maintenance' ? [prisma.asset.update({ where: { id: a.id }, data: { status: a.holderId ? 'allocated' : 'available' } })] : []),
      ]);
      log(actor, `resolved maintenance for ${label(a)}`, 'maintenance');
      await notify(m.reporterId, { kind: 'maintenance_approved', title: 'Repair completed', body: `${label(a)} is back in service.` });
      return { ok: true };
    }

    // ── Audits ────────────────────────────────────────────────────────────
    case 'setAuditResult': {
      const p = S.setAuditResult.parse(payload);
      const cycle = await prisma.auditCycle.findUnique({ where: { id: p.cycleId }, select: { auditorIds: true } });
      if (!cycle) throw ApiError.notFound('Audit cycle not found.');
      if (!permissionsFor(actor.role).manageAudits && !cycle.auditorIds.includes(actor.id)) throw ApiError.forbidden('Only assigned auditors or a manager can record results.');
      await prisma.auditResult.updateMany({ where: { cycleId: p.cycleId, assetId: p.assetId }, data: { status: p.result, notes: p.note, scannedById: actor.id, scannedAt: new Date() } });
      return { ok: true };
    }

    case 'closeAudit': {
      must(actor, 'manageAudits');
      const p = S.closeAudit.parse(payload);
      const cycle = await prisma.auditCycle.findUnique({ where: { id: p.cycleId }, include: { results: true } });
      if (!cycle) throw ApiError.notFound('Audit cycle not found.');
      const missing = cycle.results.filter((r) => r.status === 'missing');
      await prisma.$transaction(async (tx) => {
        await tx.auditCycle.update({ where: { id: cycle.id }, data: { status: 'closed', endDate: new Date() } });
        for (const r of missing) {
          const a = await tx.asset.findUnique({ where: { id: r.assetId } });
          if (a && a.status !== 'disposed') await tx.asset.update({ where: { id: a.id }, data: { status: 'lost', holderId: null } });
        }
      });
      for (const r of missing) {
        const a = await prisma.asset.findUnique({ where: { id: r.assetId }, select: { name: true, tag: true } });
        if (a) await notifyManagers({ kind: 'audit_flagged', title: 'Asset marked lost', body: `${label(a)} was not located during "${cycle.name}" and is now Lost.` });
      }
      log(actor, `closed audit cycle ${cycle.name}`, 'audit');
      return { missing: missing.length };
    }

    case 'createAuditCycle': {
      must(actor, 'manageAudits');
      const p = S.createAuditCycle.parse(payload);
      await prisma.auditCycle.create({
        data: {
          name: p.name, location: p.scope, startDate: new Date(p.from), endDate: new Date(p.to),
          status: 'planned', auditorIds: p.auditorIds, createdById: actor.id,
          results: { create: p.assetIds.map((assetId) => ({ assetId, status: 'pending' as const })) },
        },
      });
      log(actor, `created audit cycle ${p.name}`, 'audit');
      return { ok: true };
    }

    // ── Organization (Admin only) ─────────────────────────────────────────
    case 'addDepartment': {
      must(actor, 'manageOrg');
      const p = S.addDepartment.parse(payload);
      await prisma.department.create({ data: { name: p.name, code: p.code || p.name.slice(0, 3).toUpperCase(), headId: p.headId || null, parentId: p.parentId ?? null, status: 'active' } });
      log(actor, `created department ${p.name}`, 'org');
      return { ok: true };
    }

    case 'updateDepartment': {
      must(actor, 'manageOrg');
      const { id, ...patch } = S.updateDepartment.parse(payload);
      const d = await prisma.department.update({ where: { id }, data: { ...patch, headId: patch.headId, parentId: patch.parentId } });
      log(actor, `updated department ${d.name}`, 'org');
      return { ok: true };
    }

    case 'toggleDepartmentStatus': {
      must(actor, 'manageOrg');
      const p = S.toggleDepartmentStatus.parse(payload);
      const d = await prisma.department.findUnique({ where: { id: p.id } });
      if (!d) throw ApiError.notFound('Department not found.');
      const next = d.status === 'active' ? 'inactive' : 'active';
      await prisma.department.update({ where: { id: d.id }, data: { status: next } });
      log(actor, `${next === 'inactive' ? 'deactivated' : 'reactivated'} department ${d.name}`, 'org');
      return { ok: true };
    }

    case 'addCategory': {
      must(actor, 'manageOrg');
      const p = S.addCategory.parse(payload);
      await prisma.category.create({ data: { name: p.name, description: p.description, icon: p.icon || 'box', fields: (p.fields as Prisma.InputJsonValue) ?? [] } });
      log(actor, `created category ${p.name}`, 'org');
      return { ok: true };
    }

    case 'updateCategory': {
      must(actor, 'manageOrg');
      const { id, ...patch } = S.updateCategory.parse(payload);
      const c = await prisma.category.update({ where: { id }, data: patch });
      log(actor, `updated category ${c.name}`, 'org');
      return { ok: true };
    }

    case 'addEmployee': {
      must(actor, 'manageOrg');
      const p = S.addEmployee.parse(payload);
      const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Owner@2026!', 10);
      await prisma.user.create({ data: { name: p.name, email: p.email, password, role: 'employee', title: p.title || 'Employee', departmentId: p.departmentId, isActive: true, joinedAt: new Date() } });
      log(actor, `added employee ${p.name}`, 'org');
      return { ok: true };
    }

    case 'setEmployeeRole': {
      must(actor, 'manageOrg');
      const p = S.setEmployeeRole.parse(payload);
      const u = await prisma.user.update({ where: { id: p.id }, data: { role: p.role } });
      log(actor, `promoted ${u.name} → ${p.role.replace('_', ' ')}`, 'org');
      return { ok: true };
    }

    case 'toggleEmployeeStatus': {
      must(actor, 'manageOrg');
      const p = S.toggleEmployeeStatus.parse(payload);
      const u = await prisma.user.findUnique({ where: { id: p.id } });
      if (!u) throw ApiError.notFound('Employee not found.');
      await prisma.user.update({ where: { id: u.id }, data: { isActive: !u.isActive } });
      log(actor, `${u.isActive ? 'deactivated' : 'reactivated'} ${u.name}`, 'org');
      return { ok: true };
    }

    // ── Notifications (own) ───────────────────────────────────────────────
    case 'markAllRead': {
      await prisma.notification.updateMany({ where: { userId: actor.id, read: false }, data: { read: true } });
      return { ok: true };
    }

    case 'markRead': {
      const p = S.markRead.parse(payload);
      await prisma.notification.updateMany({ where: { id: p.id, userId: actor.id }, data: { read: true } });
      return { ok: true };
    }

    default:
      throw ApiError.badRequest(`Unknown action: ${action}`);
  }
}
