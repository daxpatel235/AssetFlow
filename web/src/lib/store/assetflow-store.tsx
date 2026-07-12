'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AssetFlow — client store.
// Single mutable source of truth for the whole app while there is no backend.
// The seed arrays in `@/lib/mock/assetflow` ARE the store — actions mutate them
// in place and bump a version counter, so EVERY screen (dashboard KPIs, registry,
// workspace, reports…) reflects a change made anywhere else. This is what makes
// the lifecycle real: approving maintenance actually flips the asset to "Under
// Maintenance"; resolving it flips it back; returning frees it; closing an audit
// marks missing assets Lost — across the entire app, not just one page.
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  assets, allocations, transfers, bookings, maintenance, auditCycles,
  employees, departments, categories, notifications, activity,
  department as findDept, employee as findEmp, category as findCat, asset as findAsset,
  employeeName, departmentName,
  type Role, type Asset, type AssetStatus, type Condition, type Priority,
  type AuditResult, type NotificationKind,
} from '@/lib/mock/assetflow';
import { permissionsFor, type Permissions } from '@/lib/permissions';

const TODAY_ISO = '2026-07-12';
let seq = 5000;
const uid = (p: string) => `${p}${seq++}`;

function logActivity(actorId: string, action: string, target: string, module: 'asset' | 'allocation' | 'booking' | 'maintenance' | 'audit' | 'org') {
  activity.unshift({ id: uid('ac'), actorId, action, target, module, at: `${TODAY_ISO}T09:00` });
}
function notify(kind: NotificationKind, title: string, body: string) {
  notifications.unshift({ id: uid('n'), kind, title, body, at: `${TODAY_ISO}T09:00`, read: false });
}
const assetLabelOf = (a?: Asset) => (a ? `${a.name} (${a.tag})` : 'Asset');

// ── Action input shapes ──────────────────────────────────────────────────────
export type RegisterAssetInput = {
  name: string; categoryId: string; serial?: string; location?: string;
  acquisitionDate?: string; acquisitionCost?: number; condition?: Condition;
  departmentId?: string | null; bookable?: boolean; warrantyEnds?: string;
  customData?: Record<string, any>;
};
export type AllocateInput = {
  assetId: string; targetType: 'employee' | 'department';
  employeeId?: string; departmentId?: string;
  expectedReturn?: string | null; condition?: Condition; note?: string;
};

type AFContext = {
  v: number;
  actingId: string;
  setActingId: (id: string) => void;
  actingEmployee: ReturnType<typeof findEmp>;
  role: Role;
  perms: Permissions;

  // assets
  registerAsset: (input: RegisterAssetInput) => string;
  // allocation / transfer
  allocate: (input: AllocateInput) => void;
  returnAllocation: (allocationId: string, opts?: { condition?: Condition; note?: string }) => void;
  requestTransfer: (input: { assetId: string; fromId: string; toId: string; reason: string }) => void;
  decideTransfer: (transferId: string, approve: boolean) => void;
  // maintenance
  raiseMaintenance: (input: { assetId: string; issue: string; priority: Priority }) => void;
  decideMaintenance: (id: string, approve: boolean) => void;
  assignTechnician: (id: string, technicianId: string) => void;
  startMaintenance: (id: string) => void;
  resolveMaintenance: (id: string) => void;
  // audits
  setAuditResult: (cycleId: string, assetId: string, result: AuditResult, note?: string) => void;
  closeAudit: (cycleId: string) => number;
  createAuditCycle: (input: { name: string; scope: string; from: string; to: string; auditorIds: string[]; assetIds: string[] }) => void;
  // organization
  addDepartment: (input: { name: string; code: string; headId: string; parentId: string | null }) => void;
  updateDepartment: (id: string, patch: { name?: string; code?: string; headId?: string; parentId?: string | null }) => void;
  toggleDepartmentStatus: (id: string) => void;
  addCategory: (input: { name: string; description: string; icon?: string; fields?: { name: string; type: 'text' | 'number' | 'date' | 'boolean' }[] }) => void;
  updateCategory: (id: string, patch: { name?: string; description?: string }) => void;
  addEmployee: (input: { name: string; email: string; departmentId: string; title: string }) => void;
  setEmployeeRole: (id: string, role: Role) => void;
  toggleEmployeeStatus: (id: string) => void;
  // notifications
  markAllRead: () => void;
  markRead: (id: string) => void;
};

const Ctx = createContext<AFContext | null>(null);

export function AssetFlowProvider({ children }: { children: ReactNode }) {
  const [v, setV] = useState(0);
  const bump = () => setV((x) => x + 1);
  // Demo identity overlay — drives RBAC + "My Workspace". Defaults to the Admin
  // so the whole app is visible first; switching identity demonstrates gating.
  const [actingId, setActingId] = useState('e1');

  const actingEmployee = findEmp(actingId);
  const role: Role = actingEmployee?.role ?? 'employee';
  const perms = permissionsFor(role);
  const me = actingId;

  // ── Assets ──────────────────────────────────────────────────────────────
  const registerAsset: AFContext['registerAsset'] = (input) => {
    const tag = `AF-${String(assets.length + 1).padStart(4, '0')}`;
    const a: Asset = {
      id: uid('a'), tag, name: input.name, categoryId: input.categoryId,
      serial: input.serial || `SN-${Math.floor(Math.random() * 90000 + 10000)}`,
      status: 'available', condition: input.condition ?? 'new',
      location: input.location || 'IT Store', acquisitionDate: input.acquisitionDate || TODAY_ISO,
      acquisitionCost: input.acquisitionCost ?? 0, bookable: !!input.bookable,
      holderId: null, departmentId: input.departmentId ?? null,
      ...(input.warrantyEnds ? { warrantyEnds: input.warrantyEnds } : {}),
      ...(input.customData ? { customData: input.customData } : {}),
    };
    assets.unshift(a);
    const cat = findCat(input.categoryId);
    if (cat) cat.assetCount += 1;
    logActivity(me, 'registered new asset', assetLabelOf(a), 'asset');
    bump();
    return tag;
  };

  // ── Allocation / transfer ───────────────────────────────────────────────
  const allocate: AFContext['allocate'] = (input) => {
    const a = findAsset(input.assetId);
    if (!a) return;
    if (input.targetType === 'employee' && input.employeeId) {
      a.status = 'allocated';
      a.holderId = input.employeeId;
      allocations.unshift({
        id: uid('al'), assetId: a.id, employeeId: input.employeeId, allocatedAt: TODAY_ISO,
        expectedReturn: input.expectedReturn ?? null, returnedAt: null, status: 'active',
        ...(input.condition ? {} : {}), checkoutNote: input.note,
      });
      logActivity(me, 'allocated', `${assetLabelOf(a)} → ${employeeName(input.employeeId)}`, 'allocation');
      notify('asset_assigned', 'Asset assigned', `${assetLabelOf(a)} assigned to ${employeeName(input.employeeId)}.`);
    } else if (input.targetType === 'department' && input.departmentId) {
      const head = findDept(input.departmentId)?.headId ?? me;
      a.status = 'allocated';
      a.holderId = null;
      a.departmentId = input.departmentId;
      allocations.unshift({
        id: uid('al'), assetId: a.id, employeeId: head, departmentId: input.departmentId,
        allocatedAt: TODAY_ISO, expectedReturn: input.expectedReturn ?? null, returnedAt: null,
        status: 'active', checkoutNote: input.note || `Shared with ${departmentName(input.departmentId)}`,
      });
      logActivity(me, 'allocated', `${assetLabelOf(a)} → ${departmentName(input.departmentId)} (dept)`, 'allocation');
      notify('asset_assigned', 'Asset assigned to department', `${assetLabelOf(a)} allocated to ${departmentName(input.departmentId)}.`);
    }
    bump();
  };

  const returnAllocation: AFContext['returnAllocation'] = (allocationId, opts) => {
    const al = allocations.find((x) => x.id === allocationId);
    if (!al) return;
    al.status = 'returned';
    al.returnedAt = TODAY_ISO;
    al.checkinNote = opts?.note || 'Returned via check-in';
    const a = findAsset(al.assetId);
    if (a) {
      a.status = 'available';
      a.holderId = null;
      if (opts?.condition) a.condition = opts.condition;
    }
    logActivity(me, 'returned', assetLabelOf(a), 'allocation');
    bump();
  };

  const requestTransfer: AFContext['requestTransfer'] = ({ assetId, fromId, toId, reason }) => {
    transfers.unshift({ id: uid('t'), assetId, fromId, toId, requestedAt: TODAY_ISO, status: 'requested', reason });
    const a = findAsset(assetId);
    logActivity(me, 'requested transfer of', assetLabelOf(a), 'allocation');
    bump();
  };

  const decideTransfer: AFContext['decideTransfer'] = (transferId, approve) => {
    const t = transfers.find((x) => x.id === transferId);
    if (!t) return;
    t.status = approve ? 'completed' : 'rejected';
    t.approverId = me;
    const a = findAsset(t.assetId);
    if (approve && a) {
      // close the outgoing holder's allocation, open the incoming one
      const prev = allocations.find((x) => x.assetId === a.id && x.employeeId === t.fromId && !x.returnedAt);
      if (prev) { prev.status = 'returned'; prev.returnedAt = TODAY_ISO; prev.checkinNote = 'Transferred'; }
      a.holderId = t.toId;
      a.status = 'allocated';
      allocations.unshift({ id: uid('al'), assetId: a.id, employeeId: t.toId, allocatedAt: TODAY_ISO, expectedReturn: null, returnedAt: null, status: 'active', checkoutNote: 'Received via transfer' });
      logActivity(me, 'approved transfer of', assetLabelOf(a), 'allocation');
      notify('transfer_approved', 'Transfer approved', `${assetLabelOf(a)} transferred to ${employeeName(t.toId)}.`);
    } else {
      logActivity(me, 'rejected transfer of', assetLabelOf(a), 'allocation');
    }
    bump();
  };

  // ── Maintenance ─────────────────────────────────────────────────────────
  const raiseMaintenance: AFContext['raiseMaintenance'] = ({ assetId, issue, priority }) => {
    maintenance.unshift({ id: uid('m'), assetId, raisedById: me, issue, priority, status: 'pending', createdAt: TODAY_ISO, notes: [{ at: TODAY_ISO, byId: me, text: 'Raised request.' }] });
    const a = findAsset(assetId);
    logActivity(me, 'raised maintenance for', assetLabelOf(a), 'maintenance');
    bump();
  };

  const decideMaintenance: AFContext['decideMaintenance'] = (id, approve) => {
    const m = maintenance.find((x) => x.id === id);
    if (!m) return;
    m.status = approve ? 'approved' : 'rejected';
    m.notes.push({ at: TODAY_ISO, byId: me, text: approve ? 'Approved by ' + employeeName(me) : 'Rejected by ' + employeeName(me) });
    const a = findAsset(m.assetId);
    if (approve && a) {
      // Spec: on approval, the asset auto-flips to Under Maintenance.
      a.status = 'maintenance';
      notify('maintenance_approved', 'Maintenance approved', `${assetLabelOf(a)} approved for repair — status set to Under Maintenance.`);
    } else {
      notify('maintenance_rejected', 'Maintenance rejected', `Request for ${assetLabelOf(a)} was rejected.`);
    }
    logActivity(me, approve ? 'approved maintenance for' : 'rejected maintenance for', assetLabelOf(a), 'maintenance');
    bump();
  };

  const assignTechnician: AFContext['assignTechnician'] = (id, technicianId) => {
    const m = maintenance.find((x) => x.id === id);
    if (!m) return;
    m.status = 'assigned';
    m.technicianId = technicianId;
    m.notes.push({ at: TODAY_ISO, byId: me, text: `Assigned to ${employeeName(technicianId)}.` });
    bump();
  };

  const startMaintenance: AFContext['startMaintenance'] = (id) => {
    const m = maintenance.find((x) => x.id === id);
    if (!m) return;
    m.status = 'in_progress';
    m.notes.push({ at: TODAY_ISO, byId: me, text: 'Work started.' });
    const a = findAsset(m.assetId);
    logActivity(me, 'started repair on', assetLabelOf(a), 'maintenance');
    bump();
  };

  const resolveMaintenance: AFContext['resolveMaintenance'] = (id) => {
    const m = maintenance.find((x) => x.id === id);
    if (!m) return;
    m.status = 'resolved';
    m.notes.push({ at: TODAY_ISO, byId: me, text: 'Repair completed — asset back in service.' });
    const a = findAsset(m.assetId);
    if (a && a.status === 'maintenance') {
      // Spec: on resolution the asset returns to service (Allocated if still held, else Available).
      a.status = a.holderId ? 'allocated' : 'available';
    }
    logActivity(me, 'resolved maintenance for', assetLabelOf(a), 'maintenance');
    bump();
  };

  // ── Audits ──────────────────────────────────────────────────────────────
  const setAuditResult: AFContext['setAuditResult'] = (cycleId, assetId, result, note) => {
    const c = auditCycles.find((x) => x.id === cycleId);
    const r = c?.records.find((x) => x.assetId === assetId);
    if (!r) return;
    r.result = result;
    if (note !== undefined) r.note = note;
    bump();
  };

  const closeAudit: AFContext['closeAudit'] = (cycleId) => {
    const c = auditCycles.find((x) => x.id === cycleId);
    if (!c) return 0;
    c.status = 'closed';
    let missing = 0;
    for (const r of c.records) {
      if (r.result === 'missing') {
        missing += 1;
        const a = findAsset(r.assetId);
        if (a && a.status !== 'disposed') { a.status = 'lost'; a.holderId = null; }
        notify('audit_flagged', 'Asset marked lost', `${assetLabelOf(findAsset(r.assetId))} was not located and is now Lost.`);
      }
    }
    logActivity(me, 'closed audit cycle', c.name, 'audit');
    bump();
    return missing;
  };

  const createAuditCycle: AFContext['createAuditCycle'] = ({ name, scope, from, to, auditorIds, assetIds }) => {
    auditCycles.unshift({ id: uid('au'), name, scope, from, to, status: 'planned', auditorIds, records: assetIds.map((assetId) => ({ assetId, result: 'pending' })) });
    logActivity(me, 'created audit cycle', name, 'audit');
    bump();
  };

  // ── Organization ────────────────────────────────────────────────────────
  const addDepartment: AFContext['addDepartment'] = ({ name, code, headId, parentId }) => {
    departments.push({ id: uid('d'), name, code: code || name.slice(0, 3).toUpperCase(), headId, parentId, status: 'active', employeeCount: 0 });
    logActivity(me, 'created department', name, 'org');
    bump();
  };
  const updateDepartment: AFContext['updateDepartment'] = (id, patch) => {
    const d = findDept(id);
    if (!d) return;
    Object.assign(d, patch);
    logActivity(me, 'updated department', d.name, 'org');
    bump();
  };
  const toggleDepartmentStatus: AFContext['toggleDepartmentStatus'] = (id) => {
    const d = findDept(id);
    if (!d) return;
    d.status = d.status === 'active' ? 'inactive' : 'active';
    logActivity(me, d.status === 'inactive' ? 'deactivated department' : 'reactivated department', d.name, 'org');
    bump();
  };
  const addCategory: AFContext['addCategory'] = ({ name, description, icon, fields }) => {
    categories.push({ id: uid('c'), name, description, assetCount: 0, icon: icon || 'Boxes', fields: fields || [] });
    logActivity(me, 'created category', name, 'org');
    bump();
  };
  const updateCategory: AFContext['updateCategory'] = (id, patch) => {
    const c = findCat(id);
    if (!c) return;
    Object.assign(c, patch);
    logActivity(me, 'updated category', c.name, 'org');
    bump();
  };
  const addEmployee: AFContext['addEmployee'] = ({ name, email, departmentId, title }) => {
    // Signup always creates a plain Employee — roles are only granted here.
    employees.push({ id: uid('e'), name, email, departmentId, role: 'employee', title: title || 'Employee', status: 'active', joinedAt: TODAY_ISO, phone: '' });
    const d = findDept(departmentId);
    if (d) d.employeeCount += 1;
    logActivity(me, 'added employee', name, 'org');
    bump();
  };
  const setEmployeeRole: AFContext['setEmployeeRole'] = (id, r) => {
    const e = findEmp(id);
    if (!e) return;
    e.role = r;
    logActivity(me, 'promoted', `${e.name} → ${r.replace('_', ' ')}`, 'org');
    bump();
  };
  const toggleEmployeeStatus: AFContext['toggleEmployeeStatus'] = (id) => {
    const e = findEmp(id);
    if (!e) return;
    e.status = e.status === 'active' ? 'inactive' : 'active';
    logActivity(me, e.status === 'inactive' ? 'deactivated' : 'reactivated', e.name, 'org');
    bump();
  };

  // ── Notifications ───────────────────────────────────────────────────────
  const markAllRead: AFContext['markAllRead'] = () => { notifications.forEach((n) => (n.read = true)); bump(); };
  const markRead: AFContext['markRead'] = (id) => { const n = notifications.find((x) => x.id === id); if (n) n.read = true; bump(); };

  const value = useMemo<AFContext>(() => ({
    v, actingId, setActingId, actingEmployee, role, perms,
    registerAsset, allocate, returnAllocation, requestTransfer, decideTransfer,
    raiseMaintenance, decideMaintenance, assignTechnician, startMaintenance, resolveMaintenance,
    setAuditResult, closeAudit, createAuditCycle,
    addDepartment, updateDepartment, toggleDepartmentStatus, addCategory, updateCategory,
    addEmployee, setEmployeeRole, toggleEmployeeStatus, markAllRead, markRead,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [v, actingId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAF(): AFContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAF must be used within AssetFlowProvider');
  return ctx;
}
