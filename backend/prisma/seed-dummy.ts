/**
 * Dummy / demo data seeder. Populates categories, products, users (across all
 * roles, honouring the email-optional rules) and sales (real POS checkouts, so
 * invoices, payments, stock and inventory transactions stay consistent).
 *
 * Idempotent-ish: base records are upserted by a deterministic key; sales are
 * topped up to a target count, so re-running won't pile up invoices.
 *
 *   pnpm exec tsx prisma/seed-dummy.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";
import { BillingService } from "../src/modules/billing/billing.service.js";
import { DashboardService } from "../src/modules/dashboard/dashboard.service.js";
import type { ActorContext } from "../src/modules/users/users.service.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"]! }),
});

const DEMO_PASSWORD = "Demo@12345";
const TARGET_INVOICES = 12;

const CATEGORIES = [
  { code: "DMC-BEV", name: "Beverages", description: "Cold drinks & juices" },
  { code: "DMC-GEAR", name: "Swim Gear", description: "Goggles, caps, kickboards" },
  { code: "DMC-SNACK", name: "Snacks", description: "Bars, chips & chocolate" },
  { code: "DMC-ACC", name: "Accessories", description: "Towels, pouches & deposits" },
];

const PRODUCTS = [
  { sku: "DMY-WATER", name: "Mineral Water 500ml", cat: "Beverages", sell: 1.5, buy: 0.6, tax: 5, stock: 200, min: 24 },
  { sku: "DMY-OJ", name: "Orange Juice", cat: "Beverages", sell: 3.0, buy: 1.2, tax: 5, stock: 120, min: 12 },
  { sku: "DMY-ENERGY", name: "Energy Drink", cat: "Beverages", sell: 4.5, buy: 2.0, tax: 12, stock: 90, min: 12 },
  { sku: "DMY-ICETEA", name: "Iced Tea", cat: "Beverages", sell: 2.5, buy: 1.0, tax: 5, stock: 80, min: 10 },
  { sku: "DMY-GOGGLE", name: "Swimming Goggles", cat: "Swim Gear", sell: 12.0, buy: 5.5, tax: 12, stock: 60, min: 6 },
  { sku: "DMY-CAP", name: "Silicone Swim Cap", cat: "Swim Gear", sell: 6.0, buy: 2.5, tax: 12, stock: 75, min: 8 },
  { sku: "DMY-KICK", name: "Kickboard", cat: "Swim Gear", sell: 15.0, buy: 7.0, tax: 12, stock: 30, min: 4 },
  { sku: "DMY-FINS", name: "Training Fins", cat: "Swim Gear", sell: 22.0, buy: 11.0, tax: 12, stock: 25, min: 3 },
  { sku: "DMY-NOSE", name: "Nose Clip", cat: "Swim Gear", sell: 4.0, buy: 1.5, tax: 12, stock: 100, min: 10 },
  { sku: "DMY-BAR", name: "Protein Bar", cat: "Snacks", sell: 2.5, buy: 1.0, tax: 5, stock: 150, min: 20 },
  { sku: "DMY-CHIPS", name: "Potato Chips", cat: "Snacks", sell: 1.8, buy: 0.7, tax: 5, stock: 140, min: 20 },
  { sku: "DMY-CHOC", name: "Chocolate Bar", cat: "Snacks", sell: 2.2, buy: 0.9, tax: 5, stock: 130, min: 20 },
  { sku: "DMY-TOWEL", name: "Microfibre Towel", cat: "Accessories", sell: 8.0, buy: 3.5, tax: 12, stock: 50, min: 6 },
  { sku: "DMY-POUCH", name: "Waterproof Pouch", cat: "Accessories", sell: 9.5, buy: 4.0, tax: 12, stock: 40, min: 5 },
];

const STAFF_USERS = [
  { code: "USR-DMMAYA", first: "Maya", last: "Nair", email: "maya@demo.aqualagoon.com", role: "Staff" },
  { code: "USR-DMLEO", first: "Leo", last: "Fernandes", email: "leo@demo.aqualagoon.com", role: "Staff" },
  { code: "USR-DMNAD", first: "Nadia", last: "Khan", email: "nadia@demo.aqualagoon.com", role: "Coach" },
];

// Customer users — no email (Guest/Student), per the email-optional rule.
const CUSTOMER_USERS = [
  { code: "USR-DMSAM", first: "Sam", last: "Rivera", role: "Student" },
  { code: "USR-DMPRI", first: "Priya", last: "Patel", role: "Student" },
  { code: "USR-DMGWEN", first: "Gwen", last: "Wong", role: "Guest" },
  { code: "USR-DMOMAR", first: "Omar", last: "Garcia", role: "Guest" },
];

async function main() {
  console.log("🌱 Seeding dummy data…\n");

  const roles = Object.fromEntries(
    (await prisma.role.findMany({ select: { id: true, name: true } })).map((r) => [r.name, r.id]),
  );
  const admin = await prisma.user.findFirst({ where: { userRoles: { some: { role: { name: "Admin" } } } } });
  if (!admin) throw new Error("No admin user — run the base seed first.");
  const actor: ActorContext = { userId: admin.id, roles: ["Admin"], ip: "127.0.0.1" };
  const pwHash = await hashPassword(DEMO_PASSWORD);

  // 1. Categories ----------------------------------------------------------
  const catByName = new Map<string, string>();
  for (const c of CATEGORIES) {
    const existing = await prisma.productCategory.findFirst({ where: { code: c.code } });
    const row = existing
      ? await prisma.productCategory.update({ where: { id: existing.id }, data: { name: c.name, description: c.description, status: "ACTIVE", deletedAt: null } })
      : await prisma.productCategory.create({ data: { code: c.code, name: c.name, description: c.description, status: "ACTIVE", createdBy: admin.id, updatedBy: admin.id } });
    catByName.set(c.name, row.id);
  }
  console.log(`✓ ${CATEGORIES.length} categories`);

  // 2. Products ------------------------------------------------------------
  for (const p of PRODUCTS) {
    const categoryId = catByName.get(p.cat)!;
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name: p.name, categoryId, sellingPrice: String(p.sell), purchasePrice: String(p.buy), taxPercentage: String(p.tax), minimumStock: p.min, status: "ACTIVE", deletedAt: null },
      });
    } else {
      await prisma.product.create({
        data: { sku: p.sku, name: p.name, categoryId, sellingPrice: String(p.sell), purchasePrice: String(p.buy), taxPercentage: String(p.tax), stockQuantity: p.stock, minimumStock: p.min, status: "ACTIVE", createdBy: admin.id, updatedBy: admin.id },
      });
    }
  }
  console.log(`✓ ${PRODUCTS.length} products`);

  // 3. Users ---------------------------------------------------------------
  const customerIds: string[] = [];
  for (const s of STAFF_USERS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { firstName: s.first, lastName: s.last, status: "ACTIVE", deletedAt: null },
      create: { userCode: s.code, firstName: s.first, lastName: s.last, email: s.email, passwordHash: pwHash, status: "ACTIVE" },
    });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: roles[s.role] } }, update: {}, create: { userId: user.id, roleId: roles[s.role] } });
  }
  for (const c of CUSTOMER_USERS) {
    let user = await prisma.user.findUnique({ where: { userCode: c.code } });
    if (!user) {
      user = await prisma.user.create({ data: { userCode: c.code, firstName: c.first, lastName: c.last, email: null, passwordHash: pwHash, status: "ACTIVE" } });
    }
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: roles[c.role] } }, update: {}, create: { userId: user.id, roleId: roles[c.role] } });
    customerIds.push(user.id);
  }
  console.log(`✓ ${STAFF_USERS.length} staff users (password: ${DEMO_PASSWORD}), ${CUSTOMER_USERS.length} customers (no email)`);

  // 4. Sales via the real POS checkout -------------------------------------
  const billing = new BillingService(prisma);
  const methods = await prisma.paymentMethod.findMany({ where: { isActive: true, deletedAt: null } });
  const products = await prisma.product.findMany({ where: { sku: { startsWith: "DMY-" } } });
  const pid = (sku: string) => products.find((p) => p.sku === sku)!.id;

  // Deterministic carts cycled to reach the target invoice count.
  const carts = [
    { items: [{ productId: pid("DMY-WATER"), quantity: 2, discountAmount: 0 }, { productId: pid("DMY-BAR"), quantity: 1, discountAmount: 0 }], customer: customerIds[0] },
    { items: [{ productId: pid("DMY-GOGGLE"), quantity: 1, discountAmount: 2 }, { productId: pid("DMY-CAP"), quantity: 1, discountAmount: 0 }], customer: customerIds[1] },
    { items: [{ productId: pid("DMY-OJ"), quantity: 3, discountAmount: 0 }], customer: null },
    { items: [{ productId: pid("DMY-KICK"), quantity: 1, discountAmount: 0 }, { productId: pid("DMY-FINS"), quantity: 1, discountAmount: 5 }], customer: customerIds[2] },
    { items: [{ productId: pid("DMY-CHIPS"), quantity: 2, discountAmount: 0 }, { productId: pid("DMY-CHOC"), quantity: 2, discountAmount: 0 }, { productId: pid("DMY-ICETEA"), quantity: 1, discountAmount: 0 }], customer: null },
    { items: [{ productId: pid("DMY-TOWEL"), quantity: 1, discountAmount: 0 }, { productId: pid("DMY-POUCH"), quantity: 1, discountAmount: 0 }], customer: customerIds[3] },
    { items: [{ productId: pid("DMY-ENERGY"), quantity: 2, discountAmount: 0 }, { productId: pid("DMY-BAR"), quantity: 2, discountAmount: 1 }], customer: null },
    { items: [{ productId: pid("DMY-NOSE"), quantity: 1, discountAmount: 0 }, { productId: pid("DMY-WATER"), quantity: 1, discountAmount: 0 }], customer: customerIds[0] },
  ];

  let created = 0;
  let i = 0;
  while ((await prisma.invoice.count()) < TARGET_INVOICES) {
    const cart = carts[i % carts.length];
    const method = methods[i % methods.length];
    // Compute exact total so we can simulate a precise full payment.
    let total = 0;
    for (const it of cart.items) {
      const p = products.find((x) => x.id === it.productId)!;
      const gross = p.sellingPrice.toNumber() * it.quantity;
      const disc = Math.min(it.discountAmount, gross);
      const taxable = gross - disc;
      total += Math.round((taxable + (taxable * p.taxPercentage.toNumber()) / 100) * 100) / 100;
    }
    try {
      await billing.checkout(
        {
          customerId: cart.customer ?? null,
          notes: "[seed] demo sale",
          items: cart.items,
          payment: { paymentMethodId: method.id, paidAmount: Math.ceil(total) },
        },
        actor,
      );
      created++;
    } catch (e) {
      console.warn("  (skipped a sale:", (e as Error).message, ")");
    }
    i++;
    if (i > 50) break; // safety
  }
  console.log(`✓ ${created} sales created (invoices + payments + stock + inventory txns)`);

  // 5. Verify --------------------------------------------------------------
  const dashboard = new DashboardService(prisma);
  const [catCount, prodCount, userCount, invCount, payCount, invTxnCount, pmCount] = await Promise.all([
    prisma.productCategory.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.invoice.count(),
    prisma.payment.count(),
    prisma.inventoryTransaction.count(),
    prisma.paymentMethod.count({ where: { deletedAt: null } }),
  ]);
  const summary = await dashboard.salesSummary();
  const top = await dashboard.topProducts(3);

  console.log("\n📊 Verification");
  console.log(`  categories: ${catCount}`);
  console.log(`  products: ${prodCount}`);
  console.log(`  users: ${userCount}`);
  console.log(`  payment methods: ${pmCount}`);
  console.log(`  invoices: ${invCount}`);
  console.log(`  payments: ${payCount}`);
  console.log(`  inventory transactions: ${invTxnCount}`);
  console.log(`  today → invoices ${summary.invoices}, revenue ${summary.revenue.toFixed(2)}, items ${summary.itemsSold}`);
  console.log(`  top product: ${top[0]?.name ?? "—"} (${top[0]?.quantitySold ?? 0} sold)`);

  // Integrity: every sale invoice has items, a payment, and matching SALE txns.
  const sampleInv = await prisma.invoice.findFirst({ where: { notes: { contains: "[seed]" } }, include: { items: true, payments: true } });
  const okIntegrity = !!sampleInv && sampleInv.items.length > 0 && sampleInv.payments.length > 0 && sampleInv.balanceAmount.toNumber() === 0;
  console.log(`  invoice integrity (items + payment + zero balance): ${okIntegrity ? "✓" : "✗"}`);

  console.log("\n🌱 Dummy data ready.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
