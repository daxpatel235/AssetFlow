// ─────────────────────────────────────────────────────────────────────────────
// AssetFlow — front-end mock data layer.
// Single source of truth for every screen while there is no backend. Shapes are
// intentionally API-ready: swap these selectors for `useResource(...)` calls in
// phase 2 and the UI does not change.
// ─────────────────────────────────────────────────────────────────────────────

export const TODAY = new Date('2026-07-12T09:00:00');

// ── Enums / unions ───────────────────────────────────────────────────────────
export type AssetStatus =
  | 'available'
  | 'allocated'
  | 'reserved'
  | 'maintenance'
  | 'lost'
  | 'retired'
  | 'disposed';

export type Condition = 'new' | 'good' | 'fair' | 'poor';
export type Role = 'admin' | 'asset_manager' | 'dept_head' | 'employee';
export type AllocationStatus = 'active' | 'returned' | 'overdue';
export type TransferStatus = 'requested' | 'approved' | 'rejected' | 'completed';
export type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type MaintenanceStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'assigned'
  | 'in_progress'
  | 'resolved';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type AuditCycleStatus = 'planned' | 'active' | 'closed';
export type AuditResult = 'pending' | 'verified' | 'missing' | 'damaged';

// ── Entities ─────────────────────────────────────────────────────────────────
export type Department = {
  id: string;
  name: string;
  code: string;
  headId: string;
  parentId: string | null;
  status: 'active' | 'inactive';
  employeeCount: number;
};

export type CustomField = { name: string; type: 'text' | 'number' | 'date' | 'boolean'; required?: boolean };
export type Category = {
  id: string;
  name: string;
  description: string;
  assetCount: number;
  icon: string; // lucide name key resolved in components/assetflow/icon-map
  fields: CustomField[];
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  role: Role;
  title: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  phone: string;
};

export type Asset = {
  id: string;
  tag: string; // AF-0001
  name: string;
  categoryId: string;
  serial: string;
  status: AssetStatus;
  condition: Condition;
  location: string;
  acquisitionDate: string;
  acquisitionCost: number;
  bookable: boolean;
  holderId: string | null; // employee currently holding it
  departmentId: string | null;
  image?: string;
  warrantyEnds?: string;
  customData?: Record<string, any>;
};

export type Allocation = {
  id: string;
  assetId: string;
  employeeId: string;
  departmentId?: string | null; // set when the asset is allocated to a department (shared custody)
  allocatedAt: string;
  expectedReturn: string | null;
  returnedAt: string | null;
  status: AllocationStatus;
  checkoutNote?: string;
  checkinNote?: string;
};

export type Transfer = {
  id: string;
  assetId: string;
  fromId: string;
  toId: string;
  requestedAt: string;
  status: TransferStatus;
  reason: string;
  approverId?: string;
};

export type Booking = {
  id: string;
  resourceId: string; // asset with bookable=true
  employeeId: string;
  start: string; // ISO
  end: string; // ISO
  status: BookingStatus;
  purpose: string;
};

export type MaintenanceRequest = {
  id: string;
  assetId: string;
  raisedById: string;
  issue: string;
  priority: Priority;
  status: MaintenanceStatus;
  createdAt: string;
  technicianId?: string;
  cost?: number;
  notes: { at: string; byId: string; text: string }[];
};

export type AuditRecord = { assetId: string; result: AuditResult; note?: string };
export type AuditCycle = {
  id: string;
  name: string;
  scope: string;
  from: string;
  to: string;
  status: AuditCycleStatus;
  auditorIds: string[];
  records: AuditRecord[];
};

export type NotificationKind =
  | 'asset_assigned'
  | 'maintenance_approved'
  | 'maintenance_rejected'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'transfer_approved'
  | 'overdue_return'
  | 'audit_flagged';
export type AppNotification = {
  id: string;
  userId?: string; // recipient — seeds fan notifications out across personas
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export type ActivityEvent = {
  id: string;
  actorId: string;
  action: string;
  target: string;
  module: 'asset' | 'allocation' | 'booking' | 'maintenance' | 'audit' | 'org';
  at: string;
};

// ── Data: Departments ────────────────────────────────────────────────────────
export const departments: Department[] = [
  { id: 'd1', name: 'Operations', code: 'OPS', headId: 'e2', parentId: null, status: 'active', employeeCount: 34 },
  { id: 'd2', name: 'Engineering', code: 'ENG', headId: 'e4', parentId: 'd1', status: 'active', employeeCount: 52 },
  { id: 'd3', name: 'Facilities', code: 'FAC', headId: 'e6', parentId: 'd1', status: 'active', employeeCount: 18 },
  { id: 'd4', name: 'Finance', code: 'FIN', headId: 'e8', parentId: null, status: 'active', employeeCount: 12 },
  { id: 'd5', name: 'Human Resources', code: 'HR', headId: 'e9', parentId: null, status: 'active', employeeCount: 9 },
  { id: 'd6', name: 'IT & Security', code: 'IT', headId: 'e4', parentId: 'd2', status: 'active', employeeCount: 15 },
];

// ── Data: Categories ─────────────────────────────────────────────────────────
export const categories: Category[] = [
  {
    id: 'c1',
    name: 'Electronics',
    description: 'Laptops, monitors, phones and peripherals',
    assetCount: 8,
    icon: 'laptop',
    fields: [
      { name: 'Warranty period (months)', type: 'number', required: true },
      { name: 'Warranty expiry', type: 'date' },
    ],
  },
  { id: 'c2', name: 'Furniture', description: 'Desks, chairs and storage', assetCount: 4, icon: 'armchair', fields: [{ name: 'Material', type: 'text' }] },
  {
    id: 'c3',
    name: 'Vehicles',
    description: 'Company cars, vans and fleet',
    assetCount: 3,
    icon: 'car',
    fields: [
      { name: 'Registration no.', type: 'text', required: true },
      { name: 'Next service', type: 'date' },
    ],
  },
  { id: 'c4', name: 'Meeting Rooms', description: 'Bookable rooms and shared spaces', assetCount: 3, icon: 'door-open', fields: [{ name: 'Capacity', type: 'number' }] },
  { id: 'c5', name: 'Equipment', description: 'Tools, AV gear and instruments', assetCount: 4, icon: 'wrench', fields: [{ name: 'Calibration due', type: 'date' }] },
];

// ── Data: Employees ──────────────────────────────────────────────────────────
export const employees: Employee[] = [
  { id: 'e1', name: 'Aria Whitfield', email: 'pateldax23056@gmail.com', departmentId: 'd1', role: 'admin', title: 'Operations Director', status: 'active', joinedAt: '2021-02-11', phone: '+1 415 555 0110' },
  { id: 'e2', name: 'Marcus Reyes', email: 'marcus.reyes@assetflow.io', departmentId: 'd1', role: 'asset_manager', title: 'Head of Assets', status: 'active', joinedAt: '2021-06-03', phone: '+1 415 555 0122' },
  { id: 'e3', name: 'Priya Nair', email: 'priya.nair@assetflow.io', departmentId: 'd2', role: 'employee', title: 'Senior Engineer', status: 'active', joinedAt: '2022-01-19', phone: '+1 415 555 0133' },
  { id: 'e4', name: 'Daniel Okafor', email: 'daniel.okafor@assetflow.io', departmentId: 'd2', role: 'dept_head', title: 'VP Engineering', status: 'active', joinedAt: '2020-09-27', phone: '+1 415 555 0144' },
  { id: 'e5', name: 'Sofia Lindqvist', email: 'sofia.lindqvist@assetflow.io', departmentId: 'd2', role: 'employee', title: 'Product Designer', status: 'active', joinedAt: '2023-03-14', phone: '+1 415 555 0155' },
  { id: 'e6', name: 'James Carter', email: 'james.carter@assetflow.io', departmentId: 'd3', role: 'dept_head', title: 'Facilities Manager', status: 'active', joinedAt: '2019-11-02', phone: '+1 415 555 0166' },
  { id: 'e7', name: 'Lena Fischer', email: 'lena.fischer@assetflow.io', departmentId: 'd3', role: 'employee', title: 'Maintenance Technician', status: 'active', joinedAt: '2022-08-08', phone: '+1 415 555 0177' },
  { id: 'e8', name: 'Owen Bright', email: 'owen.bright@assetflow.io', departmentId: 'd4', role: 'dept_head', title: 'Finance Lead', status: 'active', joinedAt: '2021-04-22', phone: '+1 415 555 0188' },
  { id: 'e9', name: 'Hana Kim', email: 'hana.kim@assetflow.io', departmentId: 'd5', role: 'dept_head', title: 'People Partner', status: 'active', joinedAt: '2020-05-30', phone: '+1 415 555 0199' },
  { id: 'e10', name: 'Rafael Costa', email: 'rafael.costa@assetflow.io', departmentId: 'd6', role: 'asset_manager', title: 'IT Asset Specialist', status: 'active', joinedAt: '2022-10-11', phone: '+1 415 555 0201' },
  { id: 'e11', name: 'Nadia Haddad', email: 'nadia.haddad@assetflow.io', departmentId: 'd2', role: 'employee', title: 'Data Engineer', status: 'active', joinedAt: '2023-07-01', phone: '+1 415 555 0212' },
  { id: 'e12', name: 'Tom Schneider', email: 'tom.schneider@assetflow.io', departmentId: 'd3', role: 'employee', title: 'Technician', status: 'inactive', joinedAt: '2021-12-05', phone: '+1 415 555 0223' },
];

// ── Data: Assets (tags AF-0001..) ────────────────────────────────────────────
export const assets: Asset[] = [
  { id: 'a1', tag: 'AF-0001', name: 'MacBook Pro 16" M3', categoryId: 'c1', serial: 'C02X1MPQ16', status: 'allocated', condition: 'good', location: 'HQ · Floor 3', acquisitionDate: '2024-03-15', acquisitionCost: 3200, bookable: false, holderId: 'e3', departmentId: 'd2', warrantyEnds: '2027-03-15' },
  { id: 'a2', tag: 'AF-0002', name: 'Dell UltraSharp 27"', categoryId: 'c1', serial: 'DUS27-88213', status: 'allocated', condition: 'good', location: 'HQ · Floor 3', acquisitionDate: '2024-03-15', acquisitionCost: 620, bookable: false, holderId: 'e3', departmentId: 'd2', warrantyEnds: '2026-09-15' },
  { id: 'a3', tag: 'AF-0003', name: 'iPhone 15 Pro', categoryId: 'c1', serial: 'IP15P-40021', status: 'available', condition: 'new', location: 'IT Store', acquisitionDate: '2025-01-20', acquisitionCost: 1100, bookable: false, holderId: null, departmentId: 'd6', warrantyEnds: '2027-01-20' },
  { id: 'a4', tag: 'AF-0004', name: 'ThinkPad X1 Carbon', categoryId: 'c1', serial: 'TP-X1C-7781', status: 'maintenance', condition: 'fair', location: 'Repair Bay', acquisitionDate: '2023-05-11', acquisitionCost: 1850, bookable: false, holderId: null, departmentId: 'd2', warrantyEnds: '2026-05-11' },
  { id: 'a5', tag: 'AF-0005', name: 'Herman Miller Aeron', categoryId: 'c2', serial: 'HM-AER-3390', status: 'allocated', condition: 'good', location: 'HQ · Floor 2', acquisitionDate: '2022-11-02', acquisitionCost: 1400, bookable: false, holderId: 'e5', departmentId: 'd2' },
  { id: 'a6', tag: 'AF-0006', name: 'Standing Desk Pro', categoryId: 'c2', serial: 'SD-PRO-1128', status: 'available', condition: 'good', location: 'Warehouse', acquisitionDate: '2023-02-18', acquisitionCost: 780, bookable: false, holderId: null, departmentId: 'd3' },
  { id: 'a7', tag: 'AF-0007', name: 'Toyota Hiace Van', categoryId: 'c3', serial: 'VIN-HIACE-2231', status: 'reserved', condition: 'good', location: 'Depot A', acquisitionDate: '2023-08-30', acquisitionCost: 38000, bookable: true, holderId: null, departmentId: 'd3' },
  { id: 'a8', tag: 'AF-0008', name: 'Ford Transit', categoryId: 'c3', serial: 'VIN-TRANS-9982', status: 'available', condition: 'fair', location: 'Depot A', acquisitionDate: '2021-04-12', acquisitionCost: 34000, bookable: true, holderId: null, departmentId: 'd3' },
  { id: 'a9', tag: 'AF-0009', name: 'Tesla Model 3', categoryId: 'c3', serial: 'VIN-TSLA-5510', status: 'allocated', condition: 'new', location: 'Depot B', acquisitionDate: '2025-02-01', acquisitionCost: 45000, bookable: true, holderId: 'e2', departmentId: 'd1' },
  { id: 'a10', tag: 'AF-0010', name: 'Conference Room — Aspen', categoryId: 'c4', serial: 'ROOM-ASP', status: 'available', condition: 'good', location: 'HQ · Floor 4', acquisitionDate: '2020-01-01', acquisitionCost: 0, bookable: true, holderId: null, departmentId: 'd1' },
  { id: 'a11', tag: 'AF-0011', name: 'Conference Room — Birch', categoryId: 'c4', serial: 'ROOM-BIR', status: 'available', condition: 'good', location: 'HQ · Floor 2', acquisitionDate: '2020-01-01', acquisitionCost: 0, bookable: true, holderId: null, departmentId: 'd1' },
  { id: 'a12', tag: 'AF-0012', name: 'Focus Pod — Cedar', categoryId: 'c4', serial: 'ROOM-CED', status: 'available', condition: 'good', location: 'HQ · Floor 3', acquisitionDate: '2021-06-01', acquisitionCost: 0, bookable: true, holderId: null, departmentId: 'd2' },
  { id: 'a13', tag: 'AF-0013', name: 'Projector Epson EB', categoryId: 'c5', serial: 'EPS-EB-2201', status: 'available', condition: 'good', location: 'AV Store', acquisitionDate: '2022-09-14', acquisitionCost: 900, bookable: true, holderId: null, departmentId: 'd1' },
  { id: 'a14', tag: 'AF-0014', name: 'DSLR Camera Kit', categoryId: 'c5', serial: 'CAM-DSLR-0087', status: 'allocated', condition: 'good', location: 'Marketing', acquisitionDate: '2023-11-20', acquisitionCost: 2100, bookable: true, holderId: 'e5', departmentId: 'd2' },
  { id: 'a15', tag: 'AF-0015', name: 'Torque Wrench Set', categoryId: 'c5', serial: 'TWS-4410', status: 'maintenance', condition: 'poor', location: 'Repair Bay', acquisitionDate: '2020-03-03', acquisitionCost: 340, bookable: false, holderId: null, departmentId: 'd3' },
  { id: 'a16', tag: 'AF-0016', name: 'Dell Latitude 5540', categoryId: 'c1', serial: 'DL-5540-1190', status: 'allocated', condition: 'good', location: 'HQ · Floor 1', acquisitionDate: '2024-06-10', acquisitionCost: 1300, bookable: false, holderId: 'e11', departmentId: 'd2', warrantyEnds: '2027-06-10' },
  { id: 'a17', tag: 'AF-0017', name: 'Logitech MX Master 3', categoryId: 'c1', serial: 'LG-MX3-7742', status: 'available', condition: 'new', location: 'IT Store', acquisitionDate: '2025-03-01', acquisitionCost: 110, bookable: false, holderId: null, departmentId: 'd6' },
  { id: 'a18', tag: 'AF-0018', name: 'Server Rack Unit R720', categoryId: 'c5', serial: 'SRV-R720-0031', status: 'retired', condition: 'poor', location: 'Data Center', acquisitionDate: '2018-07-19', acquisitionCost: 5400, bookable: false, holderId: null, departmentId: 'd6' },
  { id: 'a19', tag: 'AF-0019', name: 'Executive Desk Oak', categoryId: 'c2', serial: 'ED-OAK-0210', status: 'allocated', condition: 'good', location: 'HQ · Floor 4', acquisitionDate: '2021-10-05', acquisitionCost: 1200, bookable: false, holderId: 'e1', departmentId: 'd1' },
  { id: 'a20', tag: 'AF-0020', name: 'iPad Pro 12.9"', categoryId: 'c1', serial: 'IPAD-PRO-6621', status: 'lost', condition: 'good', location: 'Unknown', acquisitionDate: '2023-04-27', acquisitionCost: 1400, bookable: false, holderId: null, departmentId: 'd5' },
  { id: 'a21', tag: 'AF-0021', name: 'Office Chair Steelcase', categoryId: 'c2', serial: 'SC-CHR-9931', status: 'disposed', condition: 'poor', location: 'Recycled', acquisitionDate: '2017-05-15', acquisitionCost: 900, bookable: false, holderId: null, departmentId: 'd3' },
  { id: 'a22', tag: 'AF-0022', name: 'Surface Laptop Studio', categoryId: 'c1', serial: 'SLS-2210-8890', status: 'available', condition: 'new', location: 'IT Store', acquisitionDate: '2025-04-18', acquisitionCost: 2400, bookable: false, holderId: null, departmentId: 'd6', warrantyEnds: '2027-04-18' },
  { id: 'a23', tag: 'AF-0023', name: 'Portable Generator 5kW', categoryId: 'c5', serial: 'GEN-5KW-0442', status: 'available', condition: 'good', location: 'Depot A', acquisitionDate: '2022-12-01', acquisitionCost: 1600, bookable: true, holderId: null, departmentId: 'd3' },
  { id: 'a24', tag: 'AF-0024', name: 'BMW X5 Fleet', categoryId: 'c3', serial: 'VIN-BMW-3321', status: 'allocated', condition: 'good', location: 'Depot B', acquisitionDate: '2024-01-09', acquisitionCost: 62000, bookable: true, holderId: 'e8', departmentId: 'd4' },
];

// ── Data: Allocations ────────────────────────────────────────────────────────
export const allocations: Allocation[] = [
  { id: 'al1', assetId: 'a1', employeeId: 'e3', allocatedAt: '2025-06-01', expectedReturn: '2026-07-05', returnedAt: null, status: 'overdue', checkoutNote: 'Primary dev machine' },
  { id: 'al2', assetId: 'a2', employeeId: 'e3', allocatedAt: '2025-06-01', expectedReturn: null, returnedAt: null, status: 'active' },
  { id: 'al3', assetId: 'a5', employeeId: 'e5', allocatedAt: '2025-03-10', expectedReturn: null, returnedAt: null, status: 'active' },
  { id: 'al4', assetId: 'a9', employeeId: 'e2', allocatedAt: '2026-05-20', expectedReturn: '2026-07-16', returnedAt: null, status: 'active', checkoutNote: 'Field visits Q3' },
  { id: 'al5', assetId: 'a14', employeeId: 'e5', allocatedAt: '2026-06-25', expectedReturn: '2026-07-14', returnedAt: null, status: 'active', checkoutNote: 'Product shoot' },
  { id: 'al6', assetId: 'a16', employeeId: 'e11', allocatedAt: '2026-04-02', expectedReturn: '2026-07-02', returnedAt: null, status: 'overdue' },
  { id: 'al7', assetId: 'a19', employeeId: 'e1', allocatedAt: '2024-01-15', expectedReturn: null, returnedAt: null, status: 'active' },
  { id: 'al8', assetId: 'a24', employeeId: 'e8', allocatedAt: '2026-06-10', expectedReturn: '2026-07-18', returnedAt: null, status: 'active' },
  { id: 'al9', assetId: 'a13', employeeId: 'e5', allocatedAt: '2026-05-01', expectedReturn: '2026-05-30', returnedAt: '2026-05-29', status: 'returned', checkinNote: 'Returned in good condition' },
  { id: 'al10', assetId: 'a3', employeeId: 'e11', allocatedAt: '2026-02-01', expectedReturn: '2026-04-01', returnedAt: '2026-03-28', status: 'returned' },
];

// ── Data: Transfers ──────────────────────────────────────────────────────────
export const transfers: Transfer[] = [
  { id: 't1', assetId: 'a1', fromId: 'e3', toId: 'e11', requestedAt: '2026-07-10', status: 'requested', reason: 'Priya moving to new project; Nadia needs the 16" for ML builds.' },
  { id: 't2', assetId: 'a5', fromId: 'e5', toId: 'e3', requestedAt: '2026-07-09', status: 'requested', reason: 'Desk swap between design and engineering.' },
  { id: 't3', assetId: 'a9', fromId: 'e2', toId: 'e6', requestedAt: '2026-07-06', status: 'approved', reason: 'Facilities needs the EV for site inspections.', approverId: 'e2' },
  { id: 't4', assetId: 'a14', fromId: 'e5', toId: 'e11', requestedAt: '2026-07-01', status: 'rejected', reason: 'Camera still needed for ongoing campaign.', approverId: 'e2' },
];

// ── Data: Bookings ───────────────────────────────────────────────────────────
export const bookings: Booking[] = (() => {
  const b: Booking[] = [];
  const baseDate = new Date('2026-07-12T00:00:00');
  let idCounter = 1;
  const samplePurposes = ['Engineering standup', 'Budget review', 'Hiring panel', 'Design critique', 'Client site visit', '1:1 sync', 'Vendor call'];
  
  for (let offset = -14; offset <= 14; offset++) {
    const dateStr = new Date(baseDate.getTime() + offset * 86400000).toISOString().slice(0, 10);
    // Add 4-6 bookings per day
    for (let i = 0; i < 5; i++) {
      const startHour = 9 + i * 2;
      const rId = ['a10', 'a11', 'a7', 'a13', 'a9', 'a12'][(offset + i + 28) % 6];
      // Spread bookings across every persona (incl. admin e1) so each user's
      // "My Workspace" calendar has entries — vary by day (offset) AND slot (i).
      const eId = ['e4', 'e8', 'e9', 'e5', 'e6', 'e2', 'e3', 'e11', 'e1', 'e7', 'e10'][(offset + i + 28) % 11];
      
      b.push({
        id: 'b' + (idCounter++),
        resourceId: rId,
        employeeId: eId,
        start: `${dateStr}T${String(startHour).padStart(2, '0')}:00`,
        end: `${dateStr}T${String(startHour + 1).padStart(2, '0')}:30`,
        status: offset < 0 ? 'completed' : offset === 0 && startHour === 9 ? 'ongoing' : 'upcoming',
        purpose: samplePurposes[(offset + i + 14) % samplePurposes.length]
      });
    }
  }
  return b;
})();

// ── Data: Maintenance ────────────────────────────────────────────────────────
export const maintenance: MaintenanceRequest[] = [
  {
    id: 'm1', assetId: 'a4', raisedById: 'e11', issue: 'Keyboard unresponsive after spill; several keys not registering.', priority: 'high', status: 'in_progress', createdAt: '2026-07-08', technicianId: 'e7', cost: 180,
    notes: [
      { at: '2026-07-08', byId: 'e11', text: 'Raised request — laptop unusable.' },
      { at: '2026-07-09', byId: 'e2', text: 'Approved. Assigning to Lena.' },
      { at: '2026-07-10', byId: 'e7', text: 'Keyboard assembly ordered, ETA 2 days.' },
    ],
  },
  {
    id: 'm2', assetId: 'a15', raisedById: 'e6', issue: 'Torque calibration drifting out of spec.', priority: 'medium', status: 'assigned', createdAt: '2026-07-09', technicianId: 'e7',
    notes: [
      { at: '2026-07-09', byId: 'e6', text: 'Needs recalibration before next job.' },
      { at: '2026-07-10', byId: 'e2', text: 'Approved and assigned.' },
    ],
  },
  {
    id: 'm3', assetId: 'a8', raisedById: 'e6', issue: 'Brake warning light on; requires inspection.', priority: 'critical', status: 'pending', createdAt: '2026-07-11',
    notes: [{ at: '2026-07-11', byId: 'e6', text: 'Safety concern — flagged critical.' }],
  },
  {
    id: 'm4', assetId: 'a13', raisedById: 'e4', issue: 'Projector lamp dimming, needs replacement.', priority: 'low', status: 'pending', createdAt: '2026-07-12',
    notes: [{ at: '2026-07-12', byId: 'e4', text: 'Noticed during rehearsal.' }],
  },
  {
    id: 'm5', assetId: 'a2', raisedById: 'e3', issue: 'Dead pixels in top-left corner.', priority: 'low', status: 'rejected', createdAt: '2026-07-05',
    notes: [
      { at: '2026-07-05', byId: 'e3', text: 'Minor but noticeable.' },
      { at: '2026-07-06', byId: 'e2', text: 'Rejected — within tolerance, monitor still usable.' },
    ],
  },
  {
    id: 'm6', assetId: 'a5', raisedById: 'e5', issue: 'Gas lift sinking; chair won\'t hold height.', priority: 'medium', status: 'resolved', createdAt: '2026-06-20', technicianId: 'e7', cost: 90,
    notes: [
      { at: '2026-06-20', byId: 'e5', text: 'Chair keeps dropping.' },
      { at: '2026-06-21', byId: 'e2', text: 'Approved.' },
      { at: '2026-06-24', byId: 'e7', text: 'Gas lift replaced, tested OK. Resolved.' },
    ],
  },
];

// ── Data: Audit cycles ───────────────────────────────────────────────────────
export const auditCycles: AuditCycle[] = [
  {
    id: 'au1', name: 'Q3 HQ Floor 3 Audit', scope: 'HQ · Floor 3', from: '2026-07-08', to: '2026-07-20', status: 'active', auditorIds: ['e10', 'e7'],
    records: [
      { assetId: 'a1', result: 'verified' },
      { assetId: 'a2', result: 'verified' },
      { assetId: 'a12', result: 'pending' },
      { assetId: 'a4', result: 'damaged', note: 'Cracked bezel found during check.' },
      { assetId: 'a20', result: 'missing', note: 'Not located at recorded desk.' },
    ],
  },
  {
    id: 'au2', name: 'Fleet Depot A/B Verification', scope: 'Depots A & B', from: '2026-07-14', to: '2026-07-25', status: 'planned', auditorIds: ['e10'],
    records: [
      { assetId: 'a7', result: 'pending' },
      { assetId: 'a8', result: 'pending' },
      { assetId: 'a9', result: 'pending' },
      { assetId: 'a24', result: 'pending' },
      { assetId: 'a23', result: 'pending' },
    ],
  },
  {
    id: 'au3', name: 'Q2 IT Store Audit', scope: 'IT Store', from: '2026-04-01', to: '2026-04-14', status: 'closed', auditorIds: ['e10', 'e2'],
    records: [
      { assetId: 'a3', result: 'verified' },
      { assetId: 'a17', result: 'verified' },
      { assetId: 'a22', result: 'verified' },
      { assetId: 'a20', result: 'missing', note: 'Escalated — later marked Lost.' },
    ],
  },
];

// ── Data: Notifications ──────────────────────────────────────────────────────
export const notifications: AppNotification[] = [
  // Aria Whitfield (e1) — Admin / Operations Director (primary demo persona)
  { id: 'n1', userId: 'e1', kind: 'overdue_return', title: 'Overdue return', body: 'MacBook Pro 16" (AF-0001) held by Priya Nair is 7 days overdue.', at: '2026-07-12T08:10', read: false },
  { id: 'n2', userId: 'e1', kind: 'transfer_approved', title: 'Transfer approved', body: 'Tesla Model 3 (AF-0009) transfer to Facilities approved.', at: '2026-07-12T07:45', read: false },
  { id: 'n3', userId: 'e1', kind: 'audit_flagged', title: 'Audit discrepancy', body: 'iPad Pro (AF-0020) flagged missing in Q3 HQ Floor 3 Audit.', at: '2026-07-11T16:30', read: false },
  { id: 'n4', userId: 'e1', kind: 'booking_reminder', title: 'Booking reminder', body: 'Budget review in Aspen room starts in 30 minutes.', at: '2026-07-12T10:00', read: false },
  { id: 'n5', userId: 'e1', kind: 'maintenance_approved', title: 'Maintenance approved', body: 'ThinkPad X1 (AF-0004) repair approved and assigned to Lena Fischer.', at: '2026-07-09T10:05', read: true },

  // Marcus Reyes (e2) — Asset Manager (approver inbox)
  { id: 'n6', userId: 'e2', kind: 'transfer_approved', title: 'New transfer request', body: 'Priya Nair requested a transfer of MacBook Pro 16" (AF-0001).', at: '2026-07-10T13:22', read: false },
  { id: 'n7', userId: 'e2', kind: 'maintenance_approved', title: 'New maintenance request', body: 'James Carter raised a critical issue on Ford Transit (AF-0008).', at: '2026-07-11T14:12', read: false },
  { id: 'n8', userId: 'e2', kind: 'asset_assigned', title: 'Asset assigned', body: 'Tesla Model 3 (AF-0009) assigned to you.', at: '2026-05-20T09:30', read: true },

  // Priya Nair (e3) — Employee / Senior Engineer
  { id: 'n9', userId: 'e3', kind: 'asset_assigned', title: 'Asset assigned', body: 'MacBook Pro 16" (AF-0001) assigned to you.', at: '2025-06-01T09:00', read: true },
  { id: 'n10', userId: 'e3', kind: 'overdue_return', title: 'Return overdue', body: 'Your MacBook Pro 16" (AF-0001) is overdue for return.', at: '2026-07-12T08:12', read: false },
  { id: 'n11', userId: 'e3', kind: 'maintenance_rejected', title: 'Maintenance rejected', body: 'Your dead-pixel request for Dell UltraSharp (AF-0002) was rejected.', at: '2026-07-06T11:00', read: true },

  // Daniel Okafor (e4) — Dept Head / Engineering
  { id: 'n12', userId: 'e4', kind: 'booking_reminder', title: 'Booking reminder', body: 'Engineering standup in Aspen room starts soon.', at: '2026-07-12T08:45', read: false },
  { id: 'n13', userId: 'e4', kind: 'booking_cancelled', title: 'Booking cancelled', body: 'Birch room booking at 16:00 was cancelled.', at: '2026-07-12T09:15', read: true },

  // Lena Fischer (e7) — Maintenance Technician
  { id: 'n14', userId: 'e7', kind: 'maintenance_approved', title: 'Repair assigned to you', body: 'You were assigned the ThinkPad X1 (AF-0004) keyboard repair.', at: '2026-07-09T10:06', read: false },
  { id: 'n15', userId: 'e7', kind: 'maintenance_approved', title: 'Repair assigned to you', body: 'Torque Wrench Set (AF-0015) recalibration assigned to you.', at: '2026-07-10T10:15', read: true },

  // Owen Bright (e8) — Dept Head / Finance
  { id: 'n16', userId: 'e8', kind: 'asset_assigned', title: 'Asset assigned', body: 'BMW X5 Fleet (AF-0024) assigned to you.', at: '2026-06-10T09:00', read: true },
  { id: 'n17', userId: 'e8', kind: 'booking_reminder', title: 'Booking reminder', body: 'Budget review starts in 30 minutes.', at: '2026-07-12T09:30', read: false },

  // Nadia Haddad (e11) — Employee / Data Engineer
  { id: 'n18', userId: 'e11', kind: 'asset_assigned', title: 'Asset assigned', body: 'Dell Latitude 5540 (AF-0016) assigned to you.', at: '2026-04-02T09:20', read: true },
  { id: 'n19', userId: 'e11', kind: 'overdue_return', title: 'Return overdue', body: 'Your Dell Latitude 5540 (AF-0016) is overdue for return.', at: '2026-07-12T08:15', read: false },

  // James Carter (e6) — Facilities Manager
  { id: 'n20', userId: 'e6', kind: 'transfer_approved', title: 'Transfer approved', body: 'Tesla Model 3 (AF-0009) transferred to Facilities.', at: '2026-07-06T15:00', read: false },
];

// ── Data: Activity feed ──────────────────────────────────────────────────────
export const activity: ActivityEvent[] = [
  { id: 'ac1', actorId: 'e2', action: 'approved transfer of', target: 'Tesla Model 3 (AF-0009)', module: 'allocation', at: '2026-07-12T07:45' },
  { id: 'ac2', actorId: 'e10', action: 'flagged as missing', target: 'iPad Pro (AF-0020)', module: 'audit', at: '2026-07-11T16:30' },
  { id: 'ac3', actorId: 'e6', action: 'raised critical maintenance for', target: 'Ford Transit (AF-0008)', module: 'maintenance', at: '2026-07-11T14:12' },
  { id: 'ac4', actorId: 'e7', action: 'started repair on', target: 'ThinkPad X1 (AF-0004)', module: 'maintenance', at: '2026-07-10T09:30' },
  { id: 'ac5', actorId: 'e4', action: 'booked', target: 'Aspen room · 09:00–10:00', module: 'booking', at: '2026-07-12T08:00' },
  { id: 'ac6', actorId: 'e2', action: 'registered new asset', target: 'Surface Laptop Studio (AF-0022)', module: 'asset', at: '2026-07-09T15:40' },
  { id: 'ac7', actorId: 'e1', action: 'promoted', target: 'Rafael Costa → Asset Manager', module: 'org', at: '2026-07-08T11:00' },
  { id: 'ac8', actorId: 'e11', action: 'requested transfer of', target: 'MacBook Pro 16" (AF-0001)', module: 'allocation', at: '2026-07-10T13:20' },
  { id: 'ac9', actorId: 'e5', action: 'returned', target: 'Projector Epson EB (AF-0013)', module: 'allocation', at: '2026-05-29T17:05' },
  { id: 'ac10', actorId: 'e2', action: 'allocated', target: 'DSLR Camera Kit (AF-0014) → Sofia Lindqvist', module: 'allocation', at: '2026-06-25T10:15' },
  { id: 'ac11', actorId: 'e2', action: 'allocated', target: 'BMW X5 Fleet (AF-0024) → Owen Bright', module: 'allocation', at: '2026-06-10T09:05' },
  { id: 'ac12', actorId: 'e7', action: 'resolved maintenance for', target: 'Herman Miller Aeron (AF-0005)', module: 'maintenance', at: '2026-06-24T14:20' },
  { id: 'ac13', actorId: 'e10', action: 'created audit cycle', target: 'Fleet Depot A/B Verification', module: 'audit', at: '2026-07-11T09:00' },
  { id: 'ac14', actorId: 'e4', action: 'booked', target: 'Birch room · 11:00–12:00', module: 'booking', at: '2026-07-12T07:30' },
  { id: 'ac15', actorId: 'e1', action: 'reactivated', target: 'Tom Schneider', module: 'org', at: '2026-07-05T10:00' },
  { id: 'ac16', actorId: 'e2', action: 'rejected maintenance for', target: 'Dell UltraSharp 27" (AF-0002)', module: 'maintenance', at: '2026-07-06T11:00' },
  { id: 'ac17', actorId: 'e10', action: 'verified', target: 'iPhone 15 Pro (AF-0003)', module: 'audit', at: '2026-04-02T13:15' },
  { id: 'ac18', actorId: 'e6', action: 'requested transfer of', target: 'Tesla Model 3 (AF-0009)', module: 'allocation', at: '2026-07-06T14:00' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────────────────
export const byId = <T extends { id: string }>(list: T[], id: string | null | undefined) => list.find((x) => x.id === id);
export const employee = (id: string | null | undefined) => byId(employees, id);
export const department = (id: string | null | undefined) => byId(departments, id);
export const category = (id: string | null | undefined) => byId(categories, id);
export const asset = (id: string | null | undefined) => byId(assets, id);
export const employeeName = (id: string | null | undefined) => employee(id)?.name ?? '—';
export const departmentName = (id: string | null | undefined) => department(id)?.name ?? '—';
export const categoryName = (id: string | null | undefined) => category(id)?.name ?? '—';
export const assetLabel = (id: string | null | undefined) => {
  const a = asset(id);
  return a ? `${a.name} (${a.tag})` : '—';
};

// ─────────────────────────────────────────────────────────────────────────────
// Derived selectors — dashboard KPIs & analytics
// ─────────────────────────────────────────────────────────────────────────────
const daysBetween = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86_400_000);

export function statusCounts() {
  const out: Record<AssetStatus, number> = { available: 0, allocated: 0, reserved: 0, maintenance: 0, lost: 0, retired: 0, disposed: 0 };
  for (const a of assets) out[a.status]++;
  return out;
}

export function dashboardKpis() {
  const s = statusCounts();
  const activeBookings = bookings.filter((b) => b.status === 'ongoing' || b.status === 'upcoming').length;
  const pendingTransfers = transfers.filter((t) => t.status === 'requested').length;
  const maintenanceToday = maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'rejected').length;
  const upcoming = upcomingReturns();
  return {
    available: s.available,
    allocated: s.allocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns: upcoming.length,
    overdue: overdueReturns().length,
    totalAssets: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.acquisitionCost, 0),
  };
}

export function overdueReturns() {
  return allocations
    .filter((a) => a.status === 'overdue' || (a.expectedReturn && !a.returnedAt && new Date(a.expectedReturn) < TODAY))
    .map((a) => ({ ...a, daysOverdue: a.expectedReturn ? Math.max(0, daysBetween(TODAY, new Date(a.expectedReturn))) : 0 }));
}

export function upcomingReturns(days = 10) {
  return allocations
    .filter((a) => a.expectedReturn && !a.returnedAt && new Date(a.expectedReturn) >= TODAY && daysBetween(new Date(a.expectedReturn), TODAY) <= days)
    .map((a) => ({ ...a, daysLeft: a.expectedReturn ? daysBetween(new Date(a.expectedReturn), TODAY) : 0 }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function statusChartData() {
  const s = statusCounts();
  return (Object.keys(s) as AssetStatus[]).filter((k) => s[k] > 0).map((k) => ({ label: k, count: s[k] }));
}

export function categoryChartData() {
  return categories.map((c) => ({ label: c.name, count: assets.filter((a) => a.categoryId === c.id).length }));
}

export function departmentAllocation() {
  return departments.map((d) => ({
    label: d.code,
    name: d.name,
    count: assets.filter((a) => a.departmentId === d.id && a.status === 'allocated').length,
    total: assets.filter((a) => a.departmentId === d.id).length,
  }));
}

// 14-day acquisition/registration trend (synthetic but stable)
export function registrationTrend() {
  const seed = [1, 0, 2, 1, 3, 0, 1, 2, 4, 1, 0, 2, 3, 1];
  return seed.map((count, i) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - (13 - i));
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count };
  });
}

// Booking heatmap — day-of-week × hour buckets (0–3 intensity)
export function bookingHeatmap() {
  const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17'];
  const grid = [
    [0, 2, 3, 2, 1, 1, 2, 3, 2, 0],
    [1, 3, 2, 1, 0, 2, 3, 2, 1, 1],
    [0, 1, 3, 3, 2, 1, 2, 1, 0, 0],
    [2, 3, 3, 2, 1, 2, 3, 3, 2, 1],
    [1, 2, 2, 1, 0, 1, 1, 2, 3, 2],
  ];
  return { rows, hours, grid };
}

// ─────────────────────────────────────────────────────────────────────────────
// Self-service (My Workspace) & approvals selectors
// ─────────────────────────────────────────────────────────────────────────────
export const MANAGER_ROLES: Role[] = ['admin', 'asset_manager', 'dept_head'];
export const isManager = (r: Role) => MANAGER_ROLES.includes(r);

export const assetsHeldBy = (empId: string) => assets.filter((a) => a.holderId === empId);
export const activeAllocationsBy = (empId: string) => allocations.filter((a) => a.employeeId === empId && !a.returnedAt);
export const bookingsBy = (empId: string) => bookings.filter((b) => b.employeeId === empId);
export const maintenanceBy = (empId: string) => maintenance.filter((m) => m.raisedById === empId);
export const transfersBy = (empId: string) => transfers.filter((t) => t.fromId === empId || t.toId === empId);

// The expected-return date for an asset an employee currently holds (if any).
export function returnDueFor(empId: string, assetId: string) {
  const al = allocations.find((a) => a.employeeId === empId && a.assetId === assetId && !a.returnedAt);
  return al?.expectedReturn ?? null;
}

// Everything currently waiting on a manager decision.
export function pendingApprovals() {
  return {
    transfers: transfers.filter((t) => t.status === 'requested'),
    maintenance: maintenance.filter((m) => m.status === 'pending'),
  };
}
