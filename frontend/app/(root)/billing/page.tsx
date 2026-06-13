"use client";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { PosScreen } from "@/components/billing/pos-screen";

export default function BillingPage() {
  return (
    <PermissionPage permission="billing.create">
      <div className="space-y-6">
        <PageHeader title="POS Billing" description="Sell products and passes, and take payment." />
        <PosScreen />
      </div>
    </PermissionPage>
  );
}
