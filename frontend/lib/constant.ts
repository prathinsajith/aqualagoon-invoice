export interface NavItem {
    title: string;
    url: string;
    icon: string;
    /** When set, the item is shown only if the user holds this permission. */
    permission?: string;
    /** When true, the item is shown only to admins. */
    adminOnly?: boolean;
    children?: {
        title: string;
        href: string;
    }[];
}

export const NAVBAR_DATA: {
    navMain: NavItem[];
    navSecondary: NavItem[];
} = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: 'IconLayoutDashboard',
            adminOnly: true,
        },
        // Hidden for now — uncomment to restore.
        // {
        //     title: "Calendar",
        //     url: "/calendar",
        //     icon: 'IconCalendar',
        // },
        // {
        //     title: "Status",
        //     url: "/status",
        //     icon: 'IconAnalyze',
        // },
        // Users, Products & Categories now live under Settings (profile dropdown → Settings).
        {
            // POS is launched as a full-screen "New sale" modal from the Invoices page.
            title: "Invoices",
            url: "/invoices",
            icon: 'IconReceipt',
            permission: 'invoice.view',
        },
        {
            title: "Passes",
            url: "/passes",
            icon: 'IconTicket',
            permission: 'pass.view',
        },
        // Training management (types/programs/fee plans/batches live under Settings).
        {
            // Unified student desk: enrollments + attendance + fees as tabs.
            // Shown to anyone who can see enrollments (trainers/staff/admin).
            title: "Students",
            url: "/students",
            icon: 'IconUsersGroup',
            permission: 'enrollment.view',
        },
        // Audit Logs is admin-only and lives in the profile dropdown, not the header nav.
        // Hidden for now — uncomment to restore.
        // {
        //     title: "Analytics",
        //     url: "/analytics",
        //     icon: 'IconChartBar',
        // },
    ],
    navSecondary: [
        {
            title: "Profile",
            url: "/profile",
            icon: 'IconUserCircle',
        },
        {
            title: "Settings",
            url: "/settings",
            icon: 'IconSettings',
        },
        {
            title: "Get Help",
            url: "/help",
            icon: 'IconHelp',
        },
        {
            title: "Search",
            url: "/search",
            icon: 'IconSearch',
        },
    ],
}