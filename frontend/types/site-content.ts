export interface HomepageContent {
    heroKicker: string;
    heroLead: string;
    heroImageUrl: string;
    whyUsImageUrl: string;
    stats: { value: string; label: string }[];
}

export interface SocialLinks {
    facebook: string;
    instagram: string;
    x: string;
    youtube: string;
    whatsapp: string;
}

export interface ContactContent {
    address: string;
    phone: string;
    email: string;
    hoursWeekday: string;
    hoursSunday: string;
    social: SocialLinks;
}

export interface ServiceItem {
    id: string;
    icon: string;
    color: string;
    tint: string;
    title: string;
    blurb: string;
    long: string;
    tags: string[];
    cta: string;
    imgRight: boolean;
    imageUrl: string;
}

export interface PricingPlan {
    id: string;
    name: string;
    price: string;
    unit: string;
    popular: boolean;
    features: string[];
    btn: string;
}
export interface PricingContent {
    plans: PricingPlan[];
    note: string;
}

export interface ServicesContent {
    items: ServiceItem[];
}

export interface SafetyCard {
    icon: string;
    color: string;
    tint: string;
    title: string;
    text: string;
}
export interface AboutContent {
    title: string;
    intro: string;
    imageUrl: string;
    storyTitle: string;
    storyParagraphs: string[];
    stats: { value: string; label: string }[];
    safety: SafetyCard[];
    highlightsTitle: string;
    highlights: SafetyCard[];
    classInfoTitle: string;
    classInfo: { label: string; value: string }[];
}

export interface TimetableSlot {
    key: string;
    label: string;
    color: string;
    bg: string;
}
export interface TimetableRow {
    time: string;
    cells: string[];
}
export interface TimetableContent {
    days: string[];
    slots: TimetableSlot[];
    rows: TimetableRow[];
}

export interface BrandingContent {
    logoUrl: string;
    metaTitle: string;
    metaDescription: string;
    ogImageUrl: string;
}

export interface SiteContent {
    homepage: HomepageContent;
    about: AboutContent;
    contact: ContactContent;
    services: ServicesContent;
    pricing: PricingContent;
    timetable: TimetableContent;
    branding: BrandingContent;
}

export type SiteContentKey = keyof SiteContent;
