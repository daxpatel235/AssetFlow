import {
  LayoutDashboard,
  CircleUser,
  Boxes,
  ArrowLeftRight,
  Inbox,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Building2,
  BarChart3,
  Activity,
  Bell,
  type LucideIcon,
} from 'lucide-react';

import type { Role } from '@/lib/mock/assetflow';
import { NAV_ROLES } from '@/lib/permissions';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: string;
  roles?: Role[]; // if set, only these roles see the item; undefined = everyone
  search?: { path: string; titleKey: string; subtitleKey?: string };
};

// Single source of truth for the sidebar + global search, grouped into sections.
export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { href: '/my-workspace', label: 'My Workspace', icon: CircleUser, section: 'Overview' },
  { href: '/assets', label: 'Asset Registry', icon: Boxes, section: 'Operations', search: { path: '/assets', titleKey: 'name', subtitleKey: 'tag' } },
  { href: '/allocations', label: 'Allocation & Transfer', icon: ArrowLeftRight, section: 'Operations', roles: NAV_ROLES['/allocations'] },
  { href: '/approvals', label: 'Approvals', icon: Inbox, section: 'Operations', roles: NAV_ROLES['/approvals'] },
  { href: '/bookings', label: 'Resource Booking', icon: CalendarDays, section: 'Operations' },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, section: 'Operations' },
  { href: '/audits', label: 'Audit Cycles', icon: ClipboardCheck, section: 'Operations', roles: NAV_ROLES['/audits'] },
  { href: '/organization', label: 'Organization', icon: Building2, section: 'Manage', roles: NAV_ROLES['/organization'] },
  { href: '/reports', label: 'Reports & Analytics', icon: BarChart3, section: 'Manage', roles: NAV_ROLES['/reports'] },
  { href: '/activity', label: 'Activity Log', icon: Activity, section: 'Manage', roles: NAV_ROLES['/activity'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, section: 'Manage' },
  // [generator:nav]
];

// Sidebar section order
export const NAV_SECTIONS = ['Overview', 'Operations', 'Manage'];

export const SEARCH_SOURCES = NAV.filter((n) => n.search).map((n) => ({ label: n.label, href: n.href, ...n.search! }));
