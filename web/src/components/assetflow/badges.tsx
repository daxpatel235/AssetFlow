import {
  Circle,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Archive,
  Trash2,
  CalendarClock,
  Ban,
  PlayCircle,
  Hourglass,
  XCircle,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Laptop,
  Armchair,
  Car,
  DoorOpen,
  Wrench as WrenchIcon,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type {
  AssetStatus,
  AllocationStatus,
  TransferStatus,
  BookingStatus,
  MaintenanceStatus,
  AuditResult,
  AuditCycleStatus,
  Role,
  Priority,
  Condition,
} from '@/lib/mock/assetflow';

// ── Pill primitive ───────────────────────────────────────────────────────────
// Ring-led status pill with a leading dot/icon — the Linear/Vercel status look.
type Tone = 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'slate' | 'cyan' | 'brand';

const TONE: Record<Tone, { pill: string; dot: string }> = {
  green: { pill: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 dark:text-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-400/25', dot: 'bg-emerald-500' },
  blue: { pill: 'text-blue-700 bg-blue-50 ring-blue-600/20 dark:text-blue-300 dark:bg-blue-500/10 dark:ring-blue-400/25', dot: 'bg-blue-500' },
  violet: { pill: 'text-violet-700 bg-violet-50 ring-violet-600/20 dark:text-violet-300 dark:bg-violet-500/10 dark:ring-violet-400/25', dot: 'bg-violet-500' },
  amber: { pill: 'text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-300 dark:bg-amber-500/10 dark:ring-amber-400/25', dot: 'bg-amber-500' },
  red: { pill: 'text-red-700 bg-red-50 ring-red-600/20 dark:text-red-300 dark:bg-red-500/10 dark:ring-red-400/25', dot: 'bg-red-500' },
  slate: { pill: 'text-slate-600 bg-slate-100 ring-slate-500/20 dark:text-slate-300 dark:bg-slate-500/10 dark:ring-slate-400/25', dot: 'bg-slate-400' },
  cyan: { pill: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20 dark:text-cyan-300 dark:bg-cyan-500/10 dark:ring-cyan-400/25', dot: 'bg-cyan-500' },
  brand: { pill: 'text-brand-700 bg-brand-50 ring-brand-600/20 dark:text-brand-300 dark:bg-brand-500/10 dark:ring-brand-400/25', dot: 'bg-brand-500' },
};

export function StatusPill({ tone, label, icon: Icon, dot = true, className }: { tone: Tone; label: string; icon?: LucideIcon; dot?: boolean; className?: string }) {
  const t = TONE[tone];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', t.pill, className)}>
      {Icon ? <Icon className="w-3.5 h-3.5" /> : dot ? <span className={cn('w-1.5 h-1.5 rounded-full', t.dot)} /> : null}
      {label}
    </span>
  );
}

// ── Meta maps (also used for filters / timelines) ────────────────────────────
export const ASSET_STATUS: Record<AssetStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  available: { label: 'Available', tone: 'green', icon: CheckCircle2 },
  allocated: { label: 'Allocated', tone: 'blue', icon: UserCheck },
  reserved: { label: 'Reserved', tone: 'violet', icon: CalendarClock },
  maintenance: { label: 'Under Maintenance', tone: 'amber', icon: Wrench },
  lost: { label: 'Lost', tone: 'red', icon: AlertTriangle },
  retired: { label: 'Retired', tone: 'slate', icon: Archive },
  disposed: { label: 'Disposed', tone: 'slate', icon: Trash2 },
};

const ALLOCATION_STATUS: Record<AllocationStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  active: { label: 'Active', tone: 'blue', icon: Circle },
  returned: { label: 'Returned', tone: 'green', icon: CheckCircle2 },
  overdue: { label: 'Overdue', tone: 'red', icon: AlertTriangle },
};

const TRANSFER_STATUS: Record<TransferStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  requested: { label: 'Requested', tone: 'amber', icon: Hourglass },
  approved: { label: 'Approved', tone: 'green', icon: CheckCircle2 },
  rejected: { label: 'Rejected', tone: 'red', icon: XCircle },
  completed: { label: 'Completed', tone: 'blue', icon: UserCheck },
};

const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  upcoming: { label: 'Upcoming', tone: 'blue', icon: Clock },
  ongoing: { label: 'Ongoing', tone: 'green', icon: PlayCircle },
  completed: { label: 'Completed', tone: 'slate', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', tone: 'red', icon: Ban },
};

const MAINTENANCE_STATUS: Record<MaintenanceStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  pending: { label: 'Pending', tone: 'amber', icon: Hourglass },
  approved: { label: 'Approved', tone: 'cyan', icon: CheckCircle2 },
  rejected: { label: 'Rejected', tone: 'red', icon: XCircle },
  assigned: { label: 'Technician Assigned', tone: 'violet', icon: UserCheck },
  in_progress: { label: 'In Progress', tone: 'blue', icon: PlayCircle },
  resolved: { label: 'Resolved', tone: 'green', icon: CheckCircle2 },
};

const AUDIT_RESULT: Record<AuditResult, { label: string; tone: Tone; icon: LucideIcon }> = {
  pending: { label: 'Pending', tone: 'slate', icon: HelpCircle },
  verified: { label: 'Verified', tone: 'green', icon: ShieldCheck },
  missing: { label: 'Missing', tone: 'red', icon: ShieldAlert },
  damaged: { label: 'Damaged', tone: 'amber', icon: AlertTriangle },
};

const AUDIT_CYCLE: Record<AuditCycleStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  planned: { label: 'Planned', tone: 'slate', icon: Clock },
  active: { label: 'Active', tone: 'blue', icon: PlayCircle },
  closed: { label: 'Closed', tone: 'green', icon: CheckCircle2 },
};

export const ROLE_META: Record<Role, { label: string; tone: Tone }> = {
  admin: { label: 'Admin', tone: 'brand' },
  asset_manager: { label: 'Asset Manager', tone: 'violet' },
  dept_head: { label: 'Dept. Head', tone: 'cyan' },
  employee: { label: 'Employee', tone: 'slate' },
};

const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'slate' },
  medium: { label: 'Medium', tone: 'blue' },
  high: { label: 'High', tone: 'amber' },
  critical: { label: 'Critical', tone: 'red' },
};

const CONDITION_META: Record<Condition, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'green' },
  good: { label: 'Good', tone: 'blue' },
  fair: { label: 'Fair', tone: 'amber' },
  poor: { label: 'Poor', tone: 'red' },
};

// ── Public badge components ──────────────────────────────────────────────────
export const AssetStatusBadge = ({ status, icon }: { status: AssetStatus; icon?: boolean }) => {
  const m = ASSET_STATUS[status];
  return <StatusPill tone={m.tone} label={m.label} icon={icon ? m.icon : undefined} dot={!icon} />;
};
export const AllocationStatusBadge = ({ status }: { status: AllocationStatus }) => {
  const m = ALLOCATION_STATUS[status];
  return <StatusPill tone={m.tone} label={m.label} />;
};
export const TransferStatusBadge = ({ status }: { status: TransferStatus }) => {
  const m = TRANSFER_STATUS[status];
  return <StatusPill tone={m.tone} label={m.label} icon={m.icon} />;
};
export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const m = BOOKING_STATUS[status];
  return <StatusPill tone={m.tone} label={m.label} />;
};
export const MaintenanceStatusBadge = ({ status }: { status: MaintenanceStatus }) => {
  const m = MAINTENANCE_STATUS[status];
  return <StatusPill tone={m.tone} label={m.label} icon={m.icon} />;
};
export const AuditResultBadge = ({ result }: { result: AuditResult }) => {
  const m = AUDIT_RESULT[result];
  return <StatusPill tone={m.tone} label={m.label} icon={m.icon} />;
};
export const AuditCycleBadge = ({ status }: { status: AuditCycleStatus }) => {
  const m = AUDIT_CYCLE[status];
  return <StatusPill tone={m.tone} label={m.label} icon={m.icon} />;
};
export const RoleBadge = ({ role }: { role: Role }) => {
  const m = ROLE_META[role];
  return <StatusPill tone={m.tone} label={m.label} dot={false} />;
};
export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const m = PRIORITY_META[priority];
  return <StatusPill tone={m.tone} label={m.label} />;
};
export const ConditionBadge = ({ condition }: { condition: Condition }) => {
  const m = CONDITION_META[condition];
  return <StatusPill tone={m.tone} label={m.label} dot={false} />;
};

// Category icon resolver (data stores a string key)
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  laptop: Laptop,
  armchair: Armchair,
  car: Car,
  'door-open': DoorOpen,
  wrench: WrenchIcon,
};
export const categoryIcon = (key: string): LucideIcon => CATEGORY_ICON[key] ?? Package;

// Filter tab option lists (value/label) derived from meta maps
export const ASSET_STATUS_TABS = [
  { value: 'all', label: 'All' },
  ...(Object.keys(ASSET_STATUS) as AssetStatus[]).map((s) => ({ value: s, label: ASSET_STATUS[s].label })),
];
