// Client-facing types. Kept separate from Prisma so the client bundle never
// imports the server Prisma client.
export type Role = 'admin' | 'manager' | 'user';

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
