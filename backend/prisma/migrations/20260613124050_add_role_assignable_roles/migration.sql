-- CreateTable
CREATE TABLE "role_assignable_roles" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assignable_role_id" TEXT NOT NULL,

    CONSTRAINT "role_assignable_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_assignable_roles_role_id_idx" ON "role_assignable_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignable_roles_role_id_assignable_role_id_key" ON "role_assignable_roles"("role_id", "assignable_role_id");

-- AddForeignKey
ALTER TABLE "role_assignable_roles" ADD CONSTRAINT "role_assignable_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignable_roles" ADD CONSTRAINT "role_assignable_roles_assignable_role_id_fkey" FOREIGN KEY ("assignable_role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
