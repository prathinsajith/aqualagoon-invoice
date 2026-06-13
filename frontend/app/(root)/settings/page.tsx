"use client";

import {
  IconCategory,
  IconCreditCard,
  IconKey,
  IconPackage,
  IconTicket,
  IconUsersGroup,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleAccessMatrix } from "@/components/rbac/role-access-matrix";
import { usePermissions } from "@/hooks/usePermissions";
import { RolesSection } from "../roles/roles-section";
import { ProductsContent } from "../products/page";
import { CategoriesContent } from "../product-categories/page";
import { PassTypesContent } from "../pass-types/page";
import { PaymentMethodsSection } from "./payment-methods-section";

const TAB_TRIGGER =
  "h-auto w-full flex-none justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none";

const RAIL_LABEL = "px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70";

export default function SettingsPage() {
  const { can } = usePermissions();
  const canManage = can("setting.manage");
  const canCategories = can("product_category.view");
  const canProducts = can("product.view");
  const canPassTypes = can("pass_type.view");
  const canPaymentMethods = can("payment_method.view");
  const hasCatalog = canCategories || canProducts || canPassTypes;

  return (
    <PermissionPage permission="role.view">
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage roles, access rules, and your product catalog."
        />

        <Tabs
          defaultValue="roles"
          orientation="vertical"
          className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
        >
          {/* Left rail: grouped nav inside a card */}
          <TabsList className="h-auto w-full shrink-0 flex-row flex-wrap gap-1 self-start rounded-xl border bg-card p-2 shadow-sm lg:sticky lg:top-6 lg:w-60 lg:flex-col lg:flex-nowrap lg:items-stretch">
            <p className={`hidden lg:block ${RAIL_LABEL}`}>Access control</p>
            <TabsTrigger value="roles" className={TAB_TRIGGER}>
              <IconKey className="size-4" /> Roles &amp; permissions
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="access" className={TAB_TRIGGER}>
                <IconUsersGroup className="size-4" /> User access rules
              </TabsTrigger>
            )}

            {hasCatalog && <p className={`mt-2 hidden lg:block ${RAIL_LABEL}`}>Catalog</p>}
            {canCategories && (
              <TabsTrigger value="categories" className={TAB_TRIGGER}>
                <IconCategory className="size-4" /> Product categories
              </TabsTrigger>
            )}
            {canProducts && (
              <TabsTrigger value="products" className={TAB_TRIGGER}>
                <IconPackage className="size-4" /> Products
              </TabsTrigger>
            )}
            {canPassTypes && (
              <TabsTrigger value="pass-types" className={TAB_TRIGGER}>
                <IconTicket className="size-4" /> Pass types
              </TabsTrigger>
            )}

            {canPaymentMethods && <p className={`mt-2 hidden lg:block ${RAIL_LABEL}`}>Billing</p>}
            {canPaymentMethods && (
              <TabsTrigger value="payment-methods" className={TAB_TRIGGER}>
                <IconCreditCard className="size-4" /> Payment methods
              </TabsTrigger>
            )}
          </TabsList>

          {/* Right: content */}
          <div className="min-w-0 flex-1">
            <TabsContent value="roles" className="mt-0">
              <RolesSection />
            </TabsContent>

            {canManage && (
              <TabsContent value="access" className="mt-0">
                <RoleAccessMatrix />
              </TabsContent>
            )}

            {canCategories && (
              <TabsContent value="categories" className="mt-0">
                <CategoriesContent />
              </TabsContent>
            )}

            {canProducts && (
              <TabsContent value="products" className="mt-0">
                <ProductsContent />
              </TabsContent>
            )}

            {canPassTypes && (
              <TabsContent value="pass-types" className="mt-0">
                <PassTypesContent />
              </TabsContent>
            )}

            {canPaymentMethods && (
              <TabsContent value="payment-methods" className="mt-0">
                <PaymentMethodsSection />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </PermissionPage>
  );
}
