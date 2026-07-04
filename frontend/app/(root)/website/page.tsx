"use client";

import { Fragment, useState, type ComponentType, type ReactNode } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconPhoto,
  IconHome,
  IconInfoCircle,
  IconListDetails,
  IconAddressBook,
  IconSeo,
  IconCalendarTime,
  IconInbox,
  IconExternalLink,
  IconTicket,
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
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { GalleryManagerContent } from "./gallery/page";
import { HomepageSection } from "./homepage-section";
import { AboutSection } from "./about-section";
import { ServicesSection } from "./services-section";
import { MembershipSection } from "./membership-section";
import { TimetableSection } from "./timetable-section";
import { ContactSection } from "./contact-section";
import { BrandingSection } from "./branding-section";
import { EnquiriesSection } from "./enquiries-section";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3333";

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

/**
 * Website management — a dedicated, tabbed area for everything shown on the
 * public marketing site. Mirrors the Settings page layout so more sections
 * (homepage content, contact details, SEO, …) drop in as new entries here.
 */
export default function WebsitePage() {
  const { can } = usePermissions();
  const [tab, setTab] = useState("homepage");

  const groups: Group[] = (
    [
      {
        label: "Pages",
        sections: [
          can("website.view") && {
            value: "homepage",
            label: "Homepage / Hero",
            icon: IconHome,
            node: <HomepageSection />,
          },
          can("website.view") && {
            value: "about",
            label: "About page",
            icon: IconInfoCircle,
            node: <AboutSection />,
          },
          can("website.view") && {
            value: "services",
            label: "Services",
            icon: IconListDetails,
            node: <ServicesSection />,
          },
          can("website.view") && {
            value: "membership",
            label: "Membership & Passes",
            icon: IconTicket,
            node: <MembershipSection />,
          },
          can("website.view") && {
            value: "timetable",
            label: "Timetable",
            icon: IconCalendarTime,
            node: <TimetableSection />,
          },
          can("gallery.view") && {
            value: "gallery",
            label: "Gallery",
            icon: IconPhoto,
            node: <GalleryManagerContent />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Site-wide",
        sections: [
          can("website.view") && {
            value: "contact",
            label: "Contact & Hours",
            icon: IconAddressBook,
            node: <ContactSection />,
          },
          can("website.view") && {
            value: "branding",
            label: "SEO & Branding",
            icon: IconSeo,
            node: <BrandingSection />,
          },
        ].filter(Boolean) as Section[],
      },
      {
        label: "Leads",
        sections: [
          can("enquiry.view") && {
            value: "enquiries",
            label: "Bookings & enquiries",
            icon: IconInbox,
            node: <EnquiriesSection />,
          },
        ].filter(Boolean) as Section[],
      },
    ] as Group[]
  ).filter((g) => g.sections.length > 0);

  const sections = groups.flatMap((g) => g.sections);
  const active = sections.find((s) => s.value === tab) ?? sections[0];

  return (
    <PermissionPage permission="website.view">
      <div className="space-y-6">
        <PageHeader
          title="Website"
          description="Edit everything on your public website — pick a section on the left, make changes, then Save. Changes go live within a minute."
        >
          <Button asChild variant="outline">
            <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer">
              <IconExternalLink className="size-4" /> View live site
            </a>
          </Button>
        </PageHeader>

        <Tabs
          value={active?.value ?? tab}
          onValueChange={setTab}
          orientation="vertical"
          className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8"
        >
          {/* Mobile / tablet: compact section picker */}
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
                          tab === s.value &&
                            "bg-primary/10 font-medium text-primary focus:bg-primary/10 focus:text-primary",
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
