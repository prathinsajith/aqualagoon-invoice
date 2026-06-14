import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";
import {
  ALL_PERMISSION_NAMES,
  PERMISSIONS,
  ROLE_PERMISSION_DEFAULTS,
} from "../src/lib/permissions.js";

/**
 * Idempotent seeder. Safe to re-run: everything is upserted by natural key, so
 * it converges the DB to the desired baseline (permission catalog, system
 * roles + their grants, and a default Super Admin) without creating duplicates.
 *
 * Run with `pnpm db:seed`.
 */

const SYSTEM_ROLES: { name: string; description: string }[] = [
  { name: "Admin", description: "Full access to every part of the system." },
  { name: "Staff", description: "Day-to-day operational staff." },
  { name: "Trainer", description: "Training instructors — batches, students and attendance." },
  { name: "Coach", description: "Swimming coaches / trainers." },
  { name: "Student", description: "Enrolled students / members." },
  { name: "Guest", description: "Limited, read-only access." },
];

const ADMIN_EMAIL = process.env["SEED_ADMIN_EMAIL"] ?? "admin@aqualagoon.com";
const ADMIN_PASSWORD = process.env["SEED_ADMIN_PASSWORD"] ?? "Admin@12345";

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Permission catalog -------------------------------------------------
    for (const permission of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: { module: permission.module, action: permission.action },
        create: {
          module: permission.module,
          action: permission.action,
          name: permission.name,
        },
      });
    }
    console.log(`✓ Seeded ${PERMISSIONS.length} permissions`);

    const permissionsByName = new Map(
      (await prisma.permission.findMany({ select: { id: true, name: true } })).map((p) => [
        p.name,
        p.id,
      ]),
    );

    // 2. System roles -------------------------------------------------------
    for (const [index, role] of SYSTEM_ROLES.entries()) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: { description: role.description, isSystem: true, displayOrder: index },
        create: { name: role.name, description: role.description, isSystem: true, displayOrder: index },
      });
    }
    console.log(`✓ Seeded ${SYSTEM_ROLES.length} system roles`);

    // 3. Role → permission grants ------------------------------------------
    const grants: Record<string, string[]> = {
      Admin: ALL_PERMISSION_NAMES,
      ...ROLE_PERMISSION_DEFAULTS,
    };
    for (const [roleName, permissionNames] of Object.entries(grants)) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) continue;
      const permissionIds = permissionNames
        .map((name) => permissionsByName.get(name))
        .filter((id): id is string => Boolean(id));
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    console.log("✓ Assigned permissions to system roles");

    // 3b. Role-assignment scopes -------------------------------------------
    // Who may assign/view which roles when creating users. Admins bypass this
    // in code, but we seed Admin -> all for a consistent settings matrix.
    const rolesByName = new Map(
      (await prisma.role.findMany({ select: { id: true, name: true } })).map((r) => [r.name, r]),
    );
    const allRoleNames = SYSTEM_ROLES.map((r) => r.name);
    const assignableDefaults: Record<string, string[]> = {
      Admin: allRoleNames,
      Staff: ["Guest", "Student", "Trainer"],
      Coach: ["Guest", "Student"],
    };
    for (const [roleName, assignableNames] of Object.entries(assignableDefaults)) {
      const role = rolesByName.get(roleName);
      if (!role) continue;
      const assignableIds = assignableNames
        .map((name) => rolesByName.get(name)?.id)
        .filter((id): id is string => Boolean(id));
      await prisma.roleAssignableRole.createMany({
        data: assignableIds.map((assignableRoleId) => ({ roleId: role.id, assignableRoleId })),
        skipDuplicates: true,
      });
    }
    console.log("✓ Seeded role-assignment scopes");

    // 4. Default Super Admin user ------------------------------------------
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    const admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {},
      create: {
        userCode: "USR-ADMIN",
        firstName: "Super",
        lastName: "Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });

    console.log(`✓ Super Admin ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

    // 5. Company profile (singleton) ---------------------------------------
    if ((await prisma.companySetting.count()) === 0) {
      await prisma.companySetting.create({
        data: {
          name: "Aqua Lagoon",
          tagline: "Swimming Pool & Kids Water Park",
          email: "hello@aqualagoon.com",
        },
      });
      console.log("✓ Default company profile created");
    }

    // 6. Default payment methods -------------------------------------------
    if ((await prisma.paymentMethod.count()) === 0) {
      const methods = [
        { name: "Cash", description: "Cash payment at the counter" },
        { name: "UPI", description: "UPI / QR payment" },
        { name: "Credit Card", description: "Credit card via POS terminal" },
        { name: "Debit Card", description: "Debit card via POS terminal" },
        { name: "Bank Transfer", description: "Direct bank transfer" },
      ];
      await prisma.paymentMethod.createMany({
        data: methods.map((m, i) => ({ ...m, displayOrder: i + 1 })),
      });
      console.log(`✓ Seeded ${methods.length} payment methods`);
    }

    // 7. Sample pass types --------------------------------------------------
    if ((await prisma.passType.count()) === 0) {
      await prisma.passType.createMany({
        data: [
          { type: "GUEST", name: "Guest 1 Hour Pass", durationType: "HOUR", durationValue: 1, entryType: "UNLIMITED", price: "100" },
          { type: "GUEST", name: "Guest 2 Hour Pass", durationType: "HOUR", durationValue: 2, entryType: "UNLIMITED", price: "150" },
          { type: "GUEST", name: "Guest 3 Hour Pass", durationType: "HOUR", durationValue: 3, entryType: "UNLIMITED", price: "200" },
          { type: "STUDENT", name: "Student Monthly Pass", durationType: "MONTH", durationValue: 1, entryType: "UNLIMITED", price: "1500" },
          { type: "FAMILY", name: "Family Monthly Membership", durationType: "MONTH", durationValue: 1, entryType: "UNLIMITED", price: "5000" },
          { type: "VIP", name: "VIP 10-Entry Pass", durationType: "MONTH", durationValue: 1, entryType: "LIMITED", allowedEntries: 10, price: "2500", discountType: "PERCENTAGE", discountValue: "10" },
        ],
      });
      console.log("✓ Seeded 6 sample pass types");
    }

    // 8. Sample training data (types → programs → fee plans → a batch) -------
    if ((await prisma.trainingType.count()) === 0) {
      const trainerRole = await prisma.role.findUnique({ where: { name: "Trainer" } });
      // A demo trainer (idempotent on userCode/email).
      const trainer = await prisma.user.upsert({
        where: { email: "trainer@demo.aqualagoon.com" },
        update: {},
        create: {
          userCode: "TRN-0001",
          firstName: "Tara",
          lastName: "Trainer",
          email: "trainer@demo.aqualagoon.com",
          passwordHash: await hashPassword("Demo@12345"),
          status: "ACTIVE",
        },
      });
      if (trainerRole) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: trainer.id, roleId: trainerRole.id } },
          update: {},
          create: { userId: trainer.id, roleId: trainerRole.id },
        });
      }

      const seedProgramFees: {
        type: string;
        programs: { name: string; durationValue: number; defaultFee: string; plans: { name: string; durationType: "MONTH" | "QUARTER"; amount: string }[] }[];
      }[] = [
        {
          type: "Swimming",
          programs: [
            { name: "Swimming Beginner", durationValue: 1, defaultFee: "1500", plans: [{ name: "Swimming Monthly", durationType: "MONTH", amount: "1500" }, { name: "Swimming Quarterly", durationType: "QUARTER", amount: "4000" }] },
            { name: "Swimming Intermediate", durationValue: 1, defaultFee: "1800", plans: [{ name: "Swimming Monthly", durationType: "MONTH", amount: "1800" }] },
          ],
        },
        {
          type: "Yoga",
          programs: [
            { name: "Yoga Beginner", durationValue: 1, defaultFee: "1000", plans: [{ name: "Yoga Monthly", durationType: "MONTH", amount: "1000" }] },
          ],
        },
        {
          type: "Zumba",
          programs: [
            { name: "Zumba Morning", durationValue: 1, defaultFee: "1200", plans: [{ name: "Zumba Monthly", durationType: "MONTH", amount: "1200" }] },
          ],
        },
      ];

      let firstProgramId: string | null = null;
      for (const t of seedProgramFees) {
        const type = await prisma.trainingType.create({ data: { name: t.type, status: "ACTIVE" } });
        for (const p of t.programs) {
          const program = await prisma.trainingProgram.create({
            data: {
              trainingTypeId: type.id,
              name: p.name,
              durationType: "MONTH",
              durationValue: p.durationValue,
              defaultFee: p.defaultFee,
              status: "ACTIVE",
            },
          });
          firstProgramId ??= program.id;
          await prisma.feePlan.createMany({
            data: p.plans.map((fp) => ({
              trainingProgramId: program.id,
              name: fp.name,
              durationType: fp.durationType,
              amount: fp.amount,
              status: "ACTIVE" as const,
            })),
          });
        }
      }

      if (firstProgramId) {
        await prisma.trainingBatch.create({
          data: {
            trainingProgramId: firstProgramId,
            trainerId: trainer.id,
            name: "Swimming Morning Batch",
            startTime: "06:00",
            endTime: "07:00",
            capacity: 20,
            status: "ACTIVE",
          },
        });
      }
      console.log("✓ Seeded sample training types, programs, fee plans, batch + demo trainer");
    }

    console.log("🌱 Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
