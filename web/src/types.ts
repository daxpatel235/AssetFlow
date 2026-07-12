// Client-facing types. Kept separate from Prisma so the client bundle never
// imports the server Prisma client. These role strings MUST match the Prisma
// `Role` enum (prisma/schema.prisma) exactly — they are the single vocabulary
// shared by the JWT session, the RBAC guards, and the UI.
export type Role = 'admin' | 'asset_manager' | 'dept_head' | 'employee';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
};

export type Item = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdById: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type Insight = {
  kind: 'trend-up' | 'trend-down' | 'low-stock' | 'value' | 'active' | 'empty';
  tone: 'green' | 'amber' | 'red' | 'brand' | 'purple' | 'blue';
  text: string;
};

export type Stats = {
  total: number;
  active: number;
  archived: number;
  recent: number;
  recentDelta: number; // % change vs the previous 7 days
  totalValue: number; // Σ price × quantity
  avgPrice: number;
  lowStockCount: number;
  byStatus: { label: string; count: number }[];
  trend: { label: string; count: number }[]; // last 14 days
  lowStock: { id: string; name: string; quantity: number }[];
  topByValue: { id: string; name: string; value: number }[];
  insights: Insight[];
};
