import { PrismaClient, Role, ItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// HIDDEN admin — for testing/administration only. It is NOT shown anywhere in
// the UI. Regular users must register their own account (which is always
// role: user). Override via env, or edit these before deploying.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'owner@odoo.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Owner@2026!';

// Legacy demo accounts to purge if a previous seed created them.
const LEGACY_DEMO = ['admin@demo.com', 'manager@demo.com', 'user@demo.com'];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

// Rich, believable catalog so the dashboard is alive on first load: mixed
// statuses, a few LOW-STOCK items (≤5) to light up the alerts + insights, some
// high-value items for the "top by value" list, and createdAt spread across the
// last 14 days to draw the trend chart. (See docs/WINNING.md — never demo empty.)
const ITEMS = [
  { name: 'Wireless Mouse', sku: 'WM-001', price: 25.99, quantity: 120, status: ItemStatus.active, createdAt: daysAgo(13) },
  { name: 'Mechanical Keyboard', sku: 'MK-002', price: 89.0, quantity: 45, status: ItemStatus.active, createdAt: daysAgo(12) },
  { name: '27" 4K Monitor', sku: 'MN-004', price: 419.99, quantity: 18, status: ItemStatus.active, createdAt: daysAgo(11) },
  { name: 'Laptop Stand', sku: 'LS-005', price: 34.0, quantity: 60, status: ItemStatus.active, createdAt: daysAgo(10) },
  { name: 'USB-C Hub', sku: 'UH-003', price: 39.5, quantity: 4, status: ItemStatus.active, createdAt: daysAgo(9) },
  { name: 'Webcam 1080p', sku: 'WC-006', price: 59.99, quantity: 2, status: ItemStatus.active, createdAt: daysAgo(8) },
  { name: 'Noise-Cancelling Headset', sku: 'HS-007', price: 199.0, quantity: 12, status: ItemStatus.active, createdAt: daysAgo(6) },
  { name: 'Standing Desk', sku: 'SD-008', price: 549.0, quantity: 5, status: ItemStatus.active, createdAt: daysAgo(5) },
  { name: 'Ergonomic Chair', sku: 'EC-009', price: 329.0, quantity: 1, status: ItemStatus.active, createdAt: daysAgo(4) },
  { name: 'Desk Lamp', sku: 'DL-010', price: 28.5, quantity: 0, status: ItemStatus.active, createdAt: daysAgo(3) },
  { name: 'Docking Station', sku: 'DK-011', price: 149.99, quantity: 22, status: ItemStatus.active, createdAt: daysAgo(2) },
  { name: 'HDMI Cable 2m', sku: 'HC-012', price: 9.99, quantity: 300, status: ItemStatus.active, createdAt: daysAgo(1) },
  { name: 'Portable SSD 1TB', sku: 'SS-013', price: 119.0, quantity: 3, status: ItemStatus.active, createdAt: daysAgo(0) },
  { name: 'Legacy Printer', sku: 'LP-014', price: 89.0, quantity: 0, status: ItemStatus.archived, createdAt: daysAgo(20) },
  { name: 'Old Router', sku: 'OR-015', price: 45.0, quantity: 0, status: ItemStatus.archived, createdAt: daysAgo(25) },
];

async function main() {
  // Remove any old public demo accounts.
  await prisma.user.deleteMany({ where: { email: { in: LEGACY_DEMO } } });

  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password, role: Role.admin, name: 'Owner' },
    create: { name: 'Owner', email: ADMIN_EMAIL, password, role: Role.admin },
  });

  // Sample data belongs to the hidden admin only; self-registered users start
  // with a clean workspace (records are owner-scoped).
  await prisma.item.deleteMany({ where: { createdById: admin.id } });
  await prisma.notification.deleteMany({ where: { userId: admin.id } });
  await prisma.activityLog.deleteMany({ where: { userId: admin.id } });

  await prisma.item.createMany({ data: ITEMS.map((i) => ({ ...i, createdById: admin.id })) });
  const items = await prisma.item.findMany({ where: { createdById: admin.id } });

  const lowStock = items.filter((it) => it.status === 'active' && it.quantity <= 5);
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: 'Welcome 👋', body: 'Sample data loaded for the admin account.', link: '/items' },
      ...(lowStock.length
        ? [{ userId: admin.id, title: 'Low stock alert', body: `${lowStock.length} items are running low on stock.`, link: '/items' }]
        : []),
    ],
  });
  await prisma.activityLog.createMany({
    data: items.slice(0, 6).map((it) => ({ action: 'create' as const, entity: 'items', entityId: it.id, summary: it.name, userId: admin.id, userName: admin.name })),
  });

  console.log('Seeded ✔  Users self-register (role: user). A hidden admin exists for testing — see prisma/seed.ts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
