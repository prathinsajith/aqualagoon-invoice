"use client";

import {
  IconCategory,
  IconCreditCard,
  IconKey,
  IconPackage,
  IconSchool,
  IconStairsUp,
  IconReceipt2,
  IconCalendarEvent,
  IconCalendarOff,
  IconTicket,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/rbac/page-header";
import { PermissionPage } from "@/components/rbac/permission-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleAccessMatrix } from "@/components/rbac/role-access-matrix";
import { usePermissions } from "@/hooks/usePermissions";
import { RolesSection } from "../roles/roles-section";
import { UsersContent } from "../users/page";
import { ProductsContent } from "../products/page";
import { CategoriesContent } from "../product-categories/page";
import { PassTypesContent } from "../pass-types/page";
import { TrainingTypesContent } from "../training-types/page";
import { TrainingProgramsContent } from "../training-programs/page";
import { FeePlansContent } from "../fee-plans/page";
import { BatchesContent } from "../batches/page";
import { PaymentMethodsSection } from "./payment-methods-section";
import { HolidaysSection } from "./holidays-section";

const TAB_TRIGGER =
  "h-auto w-full flex-none justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none";

const RAIL_LABEL = "px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70";

export default function SettingsPage() {
  const { can } = usePermissions();
  const canUsers = can("user.view");
  const canManage = can("setting.manage");
  const canCategories = can("product_category.view");
  const canProducts = can("product.view");
  const canPassTypes = can("pass_type.view");
  const canTrainingTypes = can("training_type.view");
  const canTrainingPrograms = can("training_program.view");
  const canFeePlans = can("fee_plan.view");
  const canBatches = can("batch.view");
  const canPaymentMethods = can("payment_method.view");
  const canHolidays = can("setting.view");
  const hasCatalog = canCategories || canProducts || canPassTypes;
  const hasTraining = canTrainingTypes || canTrainingPrograms || canFeePlans || canBatches;

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
          <TabsList className="h-auto w-full shrink-0 flex-row flex-wrap gap-1 self-start rounded-xl bg-card p-2 shadow-md ring-1 ring-black/5 lg:sticky lg:top-6 lg:w-60 lg:flex-col lg:flex-nowrap lg:items-stretch dark:ring-white/10">
            <p className={`hidden lg:block ${RAIL_LABEL}`}>Access control</p>
            {canUsers && (
              <TabsTrigger value="users" className={TAB_TRIGGER}>
                <IconUsers className="size-4" /> Users
              </TabsTrigger>
            )}
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

            {hasTraining && <p className={`mt-2 hidden lg:block ${RAIL_LABEL}`}>Training</p>}
            {canTrainingTypes && (
              <TabsTrigger value="training-types" className={TAB_TRIGGER}>
                <IconSchool className="size-4" /> Training types
              </TabsTrigger>
            )}
            {canTrainingPrograms && (
              <TabsTrigger value="training-programs" className={TAB_TRIGGER}>
                <IconStairsUp className="size-4" /> Training programs
              </TabsTrigger>
            )}
            {canFeePlans && (
              <TabsTrigger value="fee-plans" className={TAB_TRIGGER}>
                <IconReceipt2 className="size-4" /> Fee plans
              </TabsTrigger>
            )}
            {canBatches && (
              <TabsTrigger value="batches" className={TAB_TRIGGER}>
                <IconCalendarEvent className="size-4" /> Batches
              </TabsTrigger>
            )}

            {canPaymentMethods && <p className={`mt-2 hidden lg:block ${RAIL_LABEL}`}>Billing</p>}
            {canPaymentMethods && (
              <TabsTrigger value="payment-methods" className={TAB_TRIGGER}>
                <IconCreditCard className="size-4" /> Payment methods
              </TabsTrigger>
            )}

            {canHolidays && <p className={`mt-2 hidden lg:block ${RAIL_LABEL}`}>Attendance</p>}
            {canHolidays && (
              <TabsTrigger value="holidays" className={TAB_TRIGGER}>
                <IconCalendarOff className="size-4" /> Holidays
              </TabsTrigger>
            )}
          </TabsList>

          {/* Right: content */}
          <div className="min-w-0 flex-1">
            {canUsers && (
              <TabsContent value="users" className="mt-0">
                <UsersContent />
              </TabsContent>
            )}

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

            {canTrainingTypes && (
              <TabsContent value="training-types" className="mt-0">
                <TrainingTypesContent />
              </TabsContent>
            )}

            {canTrainingPrograms && (
              <TabsContent value="training-programs" className="mt-0">
                <TrainingProgramsContent />
              </TabsContent>
            )}

            {canFeePlans && (
              <TabsContent value="fee-plans" className="mt-0">
                <FeePlansContent />
              </TabsContent>
            )}

            {canBatches && (
              <TabsContent value="batches" className="mt-0">
                <BatchesContent />
              </TabsContent>
            )}

            {canPaymentMethods && (
              <TabsContent value="payment-methods" className="mt-0">
                <PaymentMethodsSection />
              </TabsContent>
            )}

            {canHolidays && (
              <TabsContent value="holidays" className="mt-0">
                <HolidaysSection />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </PermissionPage>
  );
}
