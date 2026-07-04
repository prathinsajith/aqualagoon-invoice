-- CreateIndex
CREATE INDEX "student_enrollments_created_at_idx" ON "student_enrollments"("created_at");

-- CreateIndex
CREATE INDEX "student_enrollments_batch_id_status_idx" ON "student_enrollments"("batch_id", "status");

-- CreateIndex
CREATE INDEX "student_enrollments_fee_plan_id_idx" ON "student_enrollments"("fee_plan_id");

-- CreateIndex
CREATE INDEX "student_fees_enrollment_id_status_idx" ON "student_fees"("enrollment_id", "status");
