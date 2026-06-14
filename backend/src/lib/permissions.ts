/**
 * The permission catalog — the single source of truth for every granular
 * permission in the system. The seeder inserts exactly these rows, and guards
 * reference the `name` strings. Adding a new module's permissions here (and
 * re-seeding) is all that's needed to make them assignable.
 *
 * Naming convention: `<module>.<action>` (e.g. "user.create").
 */

export interface PermissionDef {
  module: string;
  action: string;
  name: string;
  description: string;
}

const def = (module: string, action: string, description: string): PermissionDef => ({
  module,
  action,
  name: `${module}.${action}`,
  description,
});

export const PERMISSIONS: PermissionDef[] = [
  // Users
  def("user", "create", "Create users"),
  def("user", "view", "View users"),
  def("user", "update", "Update users"),
  def("user", "delete", "Delete (archive) users"),
  def("user", "restore", "Restore archived users"),

  // Roles
  def("role", "create", "Create roles"),
  def("role", "view", "View roles"),
  def("role", "update", "Update roles"),
  def("role", "delete", "Delete roles"),

  // Permissions
  def("permission", "view", "View the permission catalog"),
  def("permission", "assign", "Assign/remove permissions on roles"),

  // Audit logs
  def("audit", "view", "View the audit log"),

  // Company settings (role-assignment scopes) — admin-only by default
  def("setting", "view", "View company settings"),
  def("setting", "manage", "Manage company settings (who can assign which roles)"),

  // Product categories
  def("product_category", "view", "View product categories"),
  def("product_category", "create", "Create product categories"),
  def("product_category", "update", "Update product categories"),
  def("product_category", "delete", "Delete product categories"),

  // Products (inventory)
  def("product", "create", "Create products"),
  def("product", "view", "View products"),
  def("product", "update", "Update products"),
  def("product", "delete", "Delete products"),

  // Payment methods (admin-managed billing settings)
  def("payment_method", "view", "View payment methods"),
  def("payment_method", "create", "Create payment methods"),
  def("payment_method", "update", "Update payment methods"),
  def("payment_method", "delete", "Delete payment methods"),

  // Dashboard (admin analytics overview)
  def("dashboard", "view", "View the admin dashboard"),

  // Billing / POS
  def("billing", "view", "View billing dashboard & sales summaries"),
  def("billing", "create", "Create invoices via POS billing"),
  def("billing", "cancel", "Cancel invoices"),

  // Invoices & payments
  def("invoice", "create", "Create invoices"),
  def("invoice", "view", "View invoices"),
  def("invoice", "update", "Update invoices"),
  def("invoice", "cancel", "Cancel invoices"),
  def("invoice", "print", "Print invoice receipts"),
  def("payment", "view", "View payments"),

  // Pass types (membership/pass catalog)
  def("pass_type", "view", "View pass types"),
  def("pass_type", "create", "Create pass types"),
  def("pass_type", "update", "Update pass types"),
  def("pass_type", "delete", "Delete pass types"),

  // User passes
  def("pass", "view", "View user passes"),
  def("pass", "activate", "Activate passes"),
  def("pass", "suspend", "Suspend passes"),
  def("pass", "cancel", "Cancel passes"),
  def("pass", "renew", "Renew passes"),

  // Training types
  def("training_type", "view", "View training types"),
  def("training_type", "create", "Create training types"),
  def("training_type", "update", "Update training types"),
  def("training_type", "delete", "Delete training types"),

  // Training programs
  def("training_program", "view", "View training programs"),
  def("training_program", "create", "Create training programs"),
  def("training_program", "update", "Update training programs"),
  def("training_program", "delete", "Delete training programs"),

  // Fee plans
  def("fee_plan", "view", "View fee plans"),
  def("fee_plan", "create", "Create fee plans"),
  def("fee_plan", "update", "Update fee plans"),
  def("fee_plan", "delete", "Delete fee plans"),

  // Training batches
  def("batch", "view", "View training batches"),
  def("batch", "create", "Create training batches"),
  def("batch", "update", "Update training batches (incl. trainer assignment)"),
  def("batch", "delete", "Delete training batches"),

  // Student enrollments
  def("enrollment", "view", "View enrollments"),
  def("enrollment", "create", "Enroll students"),
  def("enrollment", "update", "Update enrollments"),
  def("enrollment", "delete", "Remove enrollments"),

  // Attendance
  def("attendance", "view", "View attendance"),
  def("attendance", "create", "Mark attendance"),
  def("attendance", "update", "Update attendance"),

  // Student fees
  def("student_fee", "view", "View student fees"),
  def("student_fee", "create", "Generate student fees"),
  def("student_fee", "update", "Update student fees"),

  // --- Future modules (seeded now so they are assignable as features land) ---

  def("ticket", "create", "Create tickets"),
  def("ticket", "view", "View tickets"),
  def("ticket", "sell", "Sell tickets"),
];

/** All permission name strings, useful for granting "everything" to Admin. */
export const ALL_PERMISSION_NAMES = PERMISSIONS.map((p) => p.name);

/**
 * Default permission grants per system role (by permission name). Admin gets
 * everything (handled separately in the seeder); the rest get a sensible
 * starter set that an operator can adjust in the UI afterwards.
 */
export const ROLE_PERMISSION_DEFAULTS: Record<string, string[]> = {
  Staff: [
    "user.view",
    "role.view",
    "product_category.view",
    "product.view",
    "billing.view",
    "billing.create",
    "invoice.create",
    "invoice.view",
    "invoice.print",
    "payment.view",
    "pass_type.view",
    "pass.view",
    "pass.activate",
    "pass.suspend",
    "pass.renew",
    "ticket.create",
    "ticket.view",
    "ticket.sell",
    // Training desk: full operational access (manage programs, enroll, attend, fees).
    "training_type.view",
    "training_program.view",
    "fee_plan.view",
    "batch.view",
    "batch.create",
    "batch.update",
    "enrollment.view",
    "enrollment.create",
    "enrollment.update",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "student_fee.view",
    "student_fee.create",
  ],
  // Trainers see their batches, students and attendance, and mark attendance.
  Trainer: [
    "training_type.view",
    "training_program.view",
    "batch.view",
    "enrollment.view",
    "attendance.view",
    "attendance.create",
    "attendance.update",
  ],
  Coach: ["user.view", "ticket.view"],
  Student: ["product.view", "ticket.view"],
  Guest: ["product.view"],
};
