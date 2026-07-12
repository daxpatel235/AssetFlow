'use client';
// ─────────────────────────────────────────────────────────────────────────────
// AssetFlow — client store (DB-backed).
// The app is now persisted in Postgres. This provider:
//   1. loads the whole dataset once from GET /api/bootstrap and hydrates the
//      in-module arrays in `@/lib/mock/assetflow` IN PLACE — so every page and
//      selector that reads those arrays now renders real database rows without
//      any change to page code;
//   2. exposes the same action surface as before, but each action POSTs to
//      /api/actions (validated + RBAC-enforced + transactional on the server),
//      then refetches bootstrap so a change made anywhere reflects everywhere —
//      and, crucially, survives a page reload.
// Role/permissions come from the authenticated session (never self-assigned).
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  assets, allocations, transfers, bookings, maintenance, auditCycles,
  employees, departments, categories, notifications, activity,
  employee as findEmp,
  type Role, type Condition, type Priority, type AuditResult,
} from '@/lib/mock/assetflow';
import { permissionsFor, type Permissions } from '@/lib/permissions';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingScreen } from '@/components/ui/feedback';

// The bootstrap payload mirrors the client collections exactly.
type Collections = {
  departments: typeof departments; categories: typeof categories; employees: typeof employees;
  assets: typeof assets; allocations: typeof allocations; transfers: typeof transfers;
  bookings: typeof bookings; maintenance: typeof maintenance; auditCycles: typeof auditCycles;
  notifications: typeof notifications; activity: typeof activity;
};

// Replace each array's contents in place so existing references stay valid.
function hydrateArrays(d: Collections) {
  const swap = <T,>(arr: T[], next: T[]) => arr.splice(0, arr.length, ...(next ?? []));
  swap(departments, d.departments);
  swap(categories, d.categories);
  swap(employees, d.employees);
  swap(assets, d.assets);
  swap(allocations, d.allocations);
  swap(transfers, d.transfers);
  swap(bookings, d.bookings);
  swap(maintenance, d.maintenance);
  swap(auditCycles, d.auditCycles);
  swap(notifications, d.notifications);
  swap(activity, d.activity);
}

// ── Action input shapes (unchanged from the prototype) ───────────────────────
export type RegisterAssetInput = {
  name: string; categoryId: string; serial?: string; location?: string;
  acquisitionDate?: string; acquisitionCost?: number; condition?: Condition;
  departmentId?: string | null; bookable?: boolean; warrantyEnds?: string;
  customData?: Record<string, unknown>;
};
export type AllocateInput = {
  assetId: string; targetType: 'employee' | 'department';
  employeeId?: string; departmentId?: string;
  expectedReturn?: string | null; condition?: Condition; note?: string;
};

type AFContext = {
  v: number;
  ready: boolean;
  actingId: string;
  setActingId: (id: string) => void;
  actingEmployee: ReturnType<typeof findEmp>;
  role: Role;
  perms: Permissions;

  // assets
  registerAsset: (input: RegisterAssetInput) => Promise<string>;
  // allocation / transfer
  allocate: (input: AllocateInput) => Promise<void>;
  returnAllocation: (allocationId: string, opts?: { condition?: Condition; note?: string }) => Promise<void>;
  requestTransfer: (input: { assetId: string; fromId: string; toId: string; reason: string }) => Promise<void>;
  decideTransfer: (transferId: string, approve: boolean) => Promise<void>;
  // maintenance
  raiseMaintenance: (input: { assetId: string; issue: string; priority: Priority }) => Promise<void>;
  decideMaintenance: (id: string, approve: boolean) => Promise<void>;
  assignTechnician: (id: string, technicianId: string) => Promise<void>;
  startMaintenance: (id: string) => Promise<void>;
  resolveMaintenance: (id: string) => Promise<void>;
  // audits
  setAuditResult: (cycleId: string, assetId: string, result: AuditResult, note?: string) => Promise<void>;
  closeAudit: (cycleId: string) => Promise<number>;
  createAuditCycle: (input: { name: string; scope: string; from: string; to: string; auditorIds: string[]; assetIds: string[] }) => Promise<void>;
  // organization
  addDepartment: (input: { name: string; code: string; headId: string; parentId: string | null }) => Promise<void>;
  updateDepartment: (id: string, patch: { name?: string; code?: string; headId?: string; parentId?: string | null }) => Promise<void>;
  toggleDepartmentStatus: (id: string) => Promise<void>;
  addCategory: (input: { name: string; description: string; icon?: string; fields?: { name: string; type: 'text' | 'number' | 'date' | 'boolean' }[] }) => Promise<void>;
  updateCategory: (id: string, patch: { name?: string; description?: string }) => Promise<void>;
  addEmployee: (input: { name: string; email: string; departmentId: string; title: string }) => Promise<void>;
  setEmployeeRole: (id: string, role: Role) => Promise<void>;
  toggleEmployeeStatus: (id: string) => Promise<void>;
  // notifications
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const Ctx = createContext<AFContext | null>(null);

export function AssetFlowProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [v, setV] = useState(0);
  const [ready, setReady] = useState(false);
  const bump = () => setV((x) => x + 1);

  // Optional read-only "view as" override for My Workspace. It never changes
  // role/permissions (those are locked to the session) — it only filters which
  // person's assets are shown, so it cannot escalate privileges.
  const [viewAsId, setViewAsId] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    try {
      const d = await api.get<Collections>('/bootstrap');
      hydrateArrays(d);
    } catch (err) {
      console.error('bootstrap load failed:', err);
    } finally {
      setReady(true);
      bump();
    }
  }, []);

  useEffect(() => { void hydrate(); }, [hydrate]);

  const run = useCallback(async <R = unknown>(action: string, payload?: unknown): Promise<R> => {
    const res = await api.post<{ ok: boolean; result?: R }>('/actions', { action, payload });
    await hydrate();
    return res.result as R;
  }, [hydrate]);

  const actingId = viewAsId ?? user?.id ?? 'e1';
  const actingEmployee = findEmp(actingId);
  const role: Role = (user?.role as Role) ?? 'employee';
  const perms = permissionsFor(role);

  // ── Assets ────────────────────────────────────────────────────────────────
  const registerAsset = useCallback(async (input: RegisterAssetInput) => {
    const r = await run<{ tag: string }>('registerAsset', input);
    return r?.tag ?? '';
  }, [run]);

  // ── Allocation / transfer ───────────────────────────────────────────────
  const allocate = useCallback(async (input: AllocateInput) => { await run('allocate', input); }, [run]);
  const returnAllocation = useCallback(async (allocationId: string, opts?: { condition?: Condition; note?: string }) => {
    await run('returnAllocation', { allocationId, ...opts });
  }, [run]);
  const requestTransfer = useCallback(async (input: { assetId: string; fromId: string; toId: string; reason: string }) => { await run('requestTransfer', input); }, [run]);
  const decideTransfer = useCallback(async (transferId: string, approve: boolean) => { await run('decideTransfer', { transferId, approve }); }, [run]);

  // ── Maintenance ─────────────────────────────────────────────────────────
  const raiseMaintenance = useCallback(async (input: { assetId: string; issue: string; priority: Priority }) => { await run('raiseMaintenance', input); }, [run]);
  const decideMaintenance = useCallback(async (id: string, approve: boolean) => { await run('decideMaintenance', { id, approve }); }, [run]);
  const assignTechnician = useCallback(async (id: string, technicianId: string) => { await run('assignTechnician', { id, technicianId }); }, [run]);
  const startMaintenance = useCallback(async (id: string) => { await run('startMaintenance', { id }); }, [run]);
  const resolveMaintenance = useCallback(async (id: string) => { await run('resolveMaintenance', { id }); }, [run]);

  // ── Audits ────────────────────────────────────────────────────────────────
  const setAuditResult = useCallback(async (cycleId: string, assetId: string, result: AuditResult, note?: string) => { await run('setAuditResult', { cycleId, assetId, result, note }); }, [run]);
  const closeAudit = useCallback(async (cycleId: string) => {
    const r = await run<{ missing: number }>('closeAudit', { cycleId });
    return r?.missing ?? 0;
  }, [run]);
  const createAuditCycle = useCallback(async (input: { name: string; scope: string; from: string; to: string; auditorIds: string[]; assetIds: string[] }) => { await run('createAuditCycle', input); }, [run]);

  // ── Organization ──────────────────────────────────────────────────────────
  const addDepartment = useCallback(async (input: { name: string; code: string; headId: string; parentId: string | null }) => { await run('addDepartment', input); }, [run]);
  const updateDepartment = useCallback(async (id: string, patch: { name?: string; code?: string; headId?: string; parentId?: string | null }) => { await run('updateDepartment', { id, ...patch }); }, [run]);
  const toggleDepartmentStatus = useCallback(async (id: string) => { await run('toggleDepartmentStatus', { id }); }, [run]);
  const addCategory = useCallback(async (input: { name: string; description: string; icon?: string; fields?: { name: string; type: 'text' | 'number' | 'date' | 'boolean' }[] }) => { await run('addCategory', input); }, [run]);
  const updateCategory = useCallback(async (id: string, patch: { name?: string; description?: string }) => { await run('updateCategory', { id, ...patch }); }, [run]);
  const addEmployee = useCallback(async (input: { name: string; email: string; departmentId: string; title: string }) => { await run('addEmployee', input); }, [run]);
  const setEmployeeRole = useCallback(async (id: string, r: Role) => { await run('setEmployeeRole', { id, role: r }); }, [run]);
  const toggleEmployeeStatus = useCallback(async (id: string) => { await run('toggleEmployeeStatus', { id }); }, [run]);

  // ── Notifications ─────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => { await run('markAllRead', {}); }, [run]);
  const markRead = useCallback(async (id: string) => { await run('markRead', { id }); }, [run]);

  const value = useMemo<AFContext>(() => ({
    v, ready, actingId, setActingId: setViewAsId, actingEmployee, role, perms,
    registerAsset, allocate, returnAllocation, requestTransfer, decideTransfer,
    raiseMaintenance, decideMaintenance, assignTechnician, startMaintenance, resolveMaintenance,
    setAuditResult, closeAudit, createAuditCycle,
    addDepartment, updateDepartment, toggleDepartmentStatus, addCategory, updateCategory,
    addEmployee, setEmployeeRole, toggleEmployeeStatus, markAllRead, markRead,
  }), [
    v, ready, actingId, actingEmployee, role, perms,
    registerAsset, allocate, returnAllocation, requestTransfer, decideTransfer,
    raiseMaintenance, decideMaintenance, assignTechnician, startMaintenance, resolveMaintenance,
    setAuditResult, closeAudit, createAuditCycle,
    addDepartment, updateDepartment, toggleDepartmentStatus, addCategory, updateCategory,
    addEmployee, setEmployeeRole, toggleEmployeeStatus, markAllRead, markRead,
  ]);

  // One loading gate: block the app shell until the session and the dataset are
  // both ready, so no page ever flashes empty seed arrays.
  if (authLoading || !ready) return <LoadingScreen label="Loading AssetFlow…" />;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAF(): AFContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAF must be used within AssetFlowProvider');
  return ctx;
}
