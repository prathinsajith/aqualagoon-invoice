-- CreateIndex
CREATE INDEX "audit_logs_record_id_idx" ON "audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "product_categories_name_idx" ON "product_categories"("name");

-- CreateIndex
CREATE INDEX "users_first_name_idx" ON "users"("first_name");

-- CreateIndex
CREATE INDEX "users_last_name_idx" ON "users"("last_name");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");
