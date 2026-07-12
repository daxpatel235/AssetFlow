// ─────────────────────────────────────────────────────────────────────────────
// AssetFlow — Role-Based Access Control (RBAC)
// The spec is emphatic about "secure role-based workflows (not self-assigned admin
// roles)". This is the single source of truth for what each role can do; the nav,
// the page gates and the in-page action buttons all read from here.
// ─────────────────────────────────────────────────────────────────────────────
import type { Role } from '@/lib/mock/assetflow';

export type Permissions = {
  viewDashboard: boolean; // org-wide KPI dashboard
  manageOrg: boolean; // Organization Setup — Admin only
  registerAsset: boolean; // register / edit assets
  allocate: boolean; // allocate / return / initiate transfers on the ops console
  approveTransfers: boolean; // approve/reject transfer requests
  approveMaintenance: boolean; // approve/reject + route maintenance
  raiseMaintenance: boolean; // raise a maintenance request (everyone)
  manageAudits: boolean; // create/close audit cycles, record results
  viewApprovals: boolean; // the unified approvals inbox
  viewAllocations: boolean; // the allocation & transfer console
  viewReports: boolean; // reports & analytics
  viewActivity: boolean; // org activity log
  book: boolean; // create resource bookings (everyone)
};

const base: Permissions = {
  viewDashboard: true,
  manageOrg: false,
  registerAsset: false,
  allocate: false,
  approveTransfers: false,
  approveMaintenance: false,
  raiseMaintenance: true,
  manageAudits: false,
  viewApprovals: false,
  viewAllocations: false,
  viewReports: false,
  viewActivity: false,
  book: true,
};

const P = (o: Partial<Permissions>): Permissions => ({ ...base, ...o });

export const PERMISSIONS: Record<Role, Permissions> = {
  // Admin — full control incl. org setup & org-wide analytics.
  admin: P({
    manageOrg: true, registerAsset: true, allocate: true, approveTransfers: true,
    approveMaintenance: true, manageAudits: true, viewApprovals: true,
    viewAllocations: true, viewReports: true, viewActivity: true,
  }),
  // Asset Manager — registers/allocates, approves transfers/maintenance/audits.
  asset_manager: P({
    registerAsset: true, allocate: true, approveTransfers: true,
    approveMaintenance: true, manageAudits: true, viewApprovals: true,
    viewAllocations: true, viewReports: true, viewActivity: true,
  }),
  // Department Head — views dept assets, approves dept requests, books for dept.
  dept_head: P({
    allocate: true, approveTransfers: true, viewApprovals: true,
    viewAllocations: true, viewReports: true, viewActivity: true,
  }),
  // Employee — views own, books, raises maintenance, initiates return/transfer.
  employee: P({}),
};

export const permissionsFor = (role: Role): Permissions => PERMISSIONS[role];

// Which roles may see each nav destination (used to filter the sidebar).
export const NAV_ROLES: Record<string, Role[]> = {
  '/allocations': ['admin', 'asset_manager', 'dept_head'],
  '/approvals': ['admin', 'asset_manager', 'dept_head'],
  '/audits': ['admin', 'asset_manager'],
  '/organization': ['admin'],
  '/reports': ['admin', 'asset_manager', 'dept_head'],
  '/activity': ['admin', 'asset_manager', 'dept_head'],
};
