import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import {
  departments,
  categories,
  employees,
  assets,
  allocations,
  bookings,
  maintenance,
  auditCycles as audits,
  transfers,
  notifications,
  activity,
  employeeName,
} from '../src/lib/mock/assetflow';
import type { ActivityAction } from '@prisma/client';

// Map a mock activity "module" to the coarse ActivityLog action enum. The
// human-readable phrase is preserved verbatim in `summary`.
function activityAction(module: string): ActivityAction {
  if (module === 'audit') return 'audit';
  if (module === 'allocation') return 'transfer';
  if (module === 'asset') return 'create';
  return 'update';
}

const prisma = new PrismaClient();

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Owner@2026!';

async function main() {
  console.log('Seeding Database with AssetFlow Mock Data...');

  // 1. Clear existing data (in correct relational order to avoid FK errors)
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditResult.deleteMany();
  await prisma.auditCycle.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();

  // 2. Hash default password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 3. Departments
  console.log(`Inserting ${departments.length} Departments...`);
  for (const dept of departments) {
    await prisma.department.create({
      data: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        status: dept.status,
        parentId: dept.parentId,
      },
    });
  }

  // 4. Categories
  console.log(`Inserting ${categories.length} Categories...`);
  for (const cat of categories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        fields: cat.fields as any,
      },
    });
  }

  // 5. Users (Employees)
  console.log(`Inserting ${employees.length} Users...`);
  for (const emp of employees) {
    await prisma.user.create({
      data: {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        password: hashedPassword, // Everyone gets the same default password for demo
        role: emp.role as any,
        title: emp.title,
        phone: emp.phone,
        departmentId: emp.departmentId,
        isActive: emp.status === 'active',
        joinedAt: new Date(emp.joinedAt),
      },
    });
  }

  // Update Department Heads now that Users exist
  for (const dept of departments) {
    if (dept.headId) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { headId: dept.headId },
      });
    }
  }

  // 6. Assets
  console.log(`Inserting ${assets.length} Assets...`);
  for (const asset of assets) {
    await prisma.asset.create({
      data: {
        id: asset.id,
        tag: asset.tag,
        name: asset.name,
        serial: asset.serial,
        status: asset.status as any,
        condition: asset.condition as any,
        location: asset.location,
        acquisitionDate: asset.acquisitionDate ? new Date(asset.acquisitionDate) : null,
        acquisitionCost: asset.acquisitionCost,
        bookable: asset.bookable,
        categoryId: asset.categoryId,
        holderId: asset.holderId,
        departmentId: asset.departmentId,
        warrantyEnds: asset.warrantyEnds ? new Date(asset.warrantyEnds) : null,
      },
    });
  }

  // 7. Allocations
  console.log(`Inserting ${allocations.length} Allocations...`);
  for (const alloc of allocations) {
    await prisma.allocation.create({
      data: {
        id: alloc.id,
        assetId: alloc.assetId,
        employeeId: alloc.employeeId,
        departmentId: alloc.departmentId,
        status: alloc.status as any,
        allocatedAt: new Date(alloc.allocatedAt),
        expectedReturn: alloc.expectedReturn ? new Date(alloc.expectedReturn) : null,
        returnedAt: alloc.returnedAt ? new Date(alloc.returnedAt) : null,
        checkoutNote: alloc.checkoutNote,
        checkinNote: alloc.checkinNote,
      },
    });
  }

  // 8. Bookings
  console.log(`Inserting ${bookings.length} Bookings...`);
  for (const booking of bookings) {
    await prisma.booking.create({
      data: {
        id: booking.id,
        assetId: booking.resourceId,
        employeeId: booking.employeeId,
        status: booking.status as any,
        startTime: new Date(booking.start),
        endTime: new Date(booking.end),
        purpose: booking.purpose,
      },
    });
  }

  // 9. Maintenance
  console.log(`Inserting ${maintenance.length} Maintenance Tickets...`);
  for (const ticket of maintenance) {
    await prisma.maintenanceTicket.create({
      data: {
        id: ticket.id,
        assetId: ticket.assetId,
        reporterId: ticket.raisedById,
        assignedToId: ticket.technicianId,
        issue: ticket.issue,
        priority: ticket.priority as any,
        status: ticket.status as any,
        reportedAt: new Date(ticket.createdAt),
        cost: ticket.cost,
        notes: JSON.stringify(ticket.notes),
      },
    });
  }

  // 10. Audit Cycles
  console.log(`Inserting ${audits.length} Audit Cycles...`);
  for (const audit of audits) {
    await prisma.auditCycle.create({
      data: {
        id: audit.id,
        name: audit.name,
        status: audit.status as any,
        location: audit.scope,
        auditorIds: audit.auditorIds,
        startDate: new Date(audit.from),
        endDate: new Date(audit.to),
        createdById: audit.auditorIds[0] || employees[0].id,
      },
    });

    for (const record of audit.records) {
      await prisma.auditResult.create({
        data: {
          cycleId: audit.id,
          assetId: record.assetId,
          status: record.result as any,
          notes: record.note,
        },
      });
    }
  }

  // 11. Transfers (asset custody change requests + their approval history)
  console.log(`Inserting ${transfers.length} Transfers...`);
  for (const t of transfers) {
    await prisma.transfer.create({
      data: {
        id: t.id,
        assetId: t.assetId,
        fromId: t.fromId,
        toId: t.toId,
        approverId: t.approverId ?? null,
        reason: t.reason,
        status: t.status as any,
        requestedAt: new Date(t.requestedAt),
      },
    });
  }

  // 12. Notifications — seeded onto the admin persona (e1) so the bell is alive
  // in the demo. Going forward, every workflow mutation creates real per-user
  // notifications for the actual recipient.
  const adminId = employees[0].id;
  console.log(`Inserting ${notifications.length} Notifications...`);
  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        id: n.id,
        userId: adminId,
        kind: n.kind,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: new Date(n.at),
      },
    });
  }

  // 13. Activity log — the org-wide audit trail. The mock's human phrase +
  // target are preserved verbatim in `summary`; `entity` holds the module.
  console.log(`Inserting ${activity.length} Activity entries...`);
  for (const a of activity) {
    await prisma.activityLog.create({
      data: {
        id: a.id,
        action: activityAction(a.module),
        entity: a.module,
        summary: `${a.action} ${a.target}`,
        userName: employeeName(a.actorId),
        userId: a.actorId,
        createdAt: new Date(a.at),
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
