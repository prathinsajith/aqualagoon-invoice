"use client";

import { Fragment, useState, type ComponentType, type ReactNode } from "react";
import {
  IconCategory,
  IconCheck,
  IconChevronDown,
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleAccessMatrix } from "@/components/rbac/role-access-matrix";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
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
  "h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none";

const RAIL_LABEL = "px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70";

interface Section {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  node: ReactNode;
}
interface Group {
  label: string;
  sections: Section[];
}

export default function SettingsPage() {
  const { can } = usePermissions();
  const [tab, setTab] = useState("roles");

  // Build the nav data once (permission-gated), then drive BOTH the mobile
  // dropdown and the desktop rail from it — no duplicated markup.
  const groups: Group[] = (
    [
      {
        label: "Access control",
        sections: [
          can("user.view") && {
            value: "users",
            label: "Users",
            icon: IconUsers,
            node: <UsersContent />,
          },
          { value: "roles", label: "Roles & permissions", icon: IconKey, node: <RolesSection /> },
          can("setting.manage") && {
            value: "access",
            label: "User access rules",
            icon: IconUsersGroup,
            node: <RoleAccessMatrix />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Catalog",
        sections: [
          can("product_category.view") && {
            value: "categories",
            label: "Product categories",
            icon: IconCategory,
            node: <CategoriesContent />,
          },
          can("product.view") && {
            value: "products",
            label: "Products",
            icon: IconPackage,
            node: <ProductsContent />,
          },
          can("pass_type.view") && {
            value: "pass-types",
            label: "Pass types",
            icon: IconTicket,
            node: <PassTypesContent />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Training",
        sections: [
          can("training_type.view") && {
            value: "training-types",
            label: "Training types",
            icon: IconSchool,
            node: <TrainingTypesContent />,
          },
          can("training_program.view") && {
            value: "training-programs",
            label: "Training programs",
            icon: IconStairsUp,
            node: <TrainingProgramsContent />,
          },
          can("fee_plan.view") && {
            value: "fee-plans",
            label: "Fee plans",
            icon: IconReceipt2,
            node: <FeePlansContent />,
          },
          can("batch.view") && {
            value: "batches",
            label: "Batches",
            icon: IconCalendarEvent,
            node: <BatchesContent />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Billing",
        sections: [
          can("payment_method.view") && {
            value: "payment-methods",
            label: "Payment methods",
            icon: IconCreditCard,
            node: <PaymentMethodsSection />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Attendance",
        sections: [
          can("setting.view") && {
            value: "holidays",
            label: "Holidays",
            icon: IconCalendarOff,
            node: <HolidaysSection />,
          },
        ].filter(Boolean) as Section[],
      },
    ] as Group[]
  ).filter((g) => g.sections.length > 0);

  const sections = groups.flatMap((g) => g.sections);
  const active = sections.find((s) => s.value === tab) ?? sections[0];

  return (
    <PermissionPage permission="role.view">
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage roles, access rules, and your product catalog."
        />

        <Tabs
          value={tab}
          onValueChange={setTab}
          orientation="vertical"
          className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8"
        >
          {/* Mobile / tablet: compact section picker that opens a grouped vertical menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto w-full justify-between gap-2 rounded-xl bg-card px-3 py-2.5 shadow-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5 font-medium">
                    {active && <active.icon className="size-4 shrink-0 text-primary" />}
                    <span className="truncate">{active?.label}</span>
                  </span>
                  <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="max-h-[65vh] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
              >
                {groups.map((group, gi) => (
                  <Fragment key={group.label}>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.sections.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onSelect={() => setTab(s.value)}
                        className={cn(
                          "gap-2.5",
                          tab === s.value && "bg-primary/10 font-medium text-primary focus:bg-primary/10 focus:text-primary",
                        )}
                      >
                        <s.icon className="size-4" />
                        <span className="flex-1">{s.label}</span>
                        {tab === s.value && <IconCheck className="size-4" />}
                      </DropdownMenuItem>
                    ))}
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: sticky grouped vertical rail */}
          <TabsList className="hidden h-auto w-60 shrink-0 flex-col items-stretch gap-1 self-start rounded-xl bg-card p-2 shadow-md ring-1 ring-black/5 lg:sticky lg:top-6 lg:flex dark:ring-white/10">
            {groups.map((group, gi) => (
              <Fragment key={group.label}>
                <p className={cn(RAIL_LABEL, gi > 0 && "mt-2")}>{group.label}</p>
                {group.sections.map((s) => (
                  <TabsTrigger key={s.value} value={s.value} className={TAB_TRIGGER}>
                    <s.icon className="size-4" /> {s.label}
                  </TabsTrigger>
                ))}
              </Fragment>
            ))}
          </TabsList>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {sections.map((s) => (
              <TabsContent key={s.value} value={s.value} className="mt-0">
                {s.node}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </PermissionPage>
  );
}
