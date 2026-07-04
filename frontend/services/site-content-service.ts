import { api } from "@/lib/axios";
import type {
    AboutContent,
    BrandingContent,
    ContactContent,
    HomepageContent,
    PricingContent,
    ServicesContent,
    SiteContent,
    SiteContentKey,
    TimetableContent,
} from "@/types/site-content";

type SectionData = {
    homepage: HomepageContent;
    about: AboutContent;
    contact: ContactContent;
    services: ServicesContent;
    pricing: PricingContent;
    timetable: TimetableContent;
    branding: BrandingContent;
};

export const SiteContentService = {
    get: async (): Promise<SiteContent> => {
        const res = await api.get("/api/site-content/admin");
        return res.data.data;
    },

    update: async <K extends SiteContentKey>(key: K, data: SectionData[K]): Promise<SectionData[K]> => {
        const res = await api.put(`/api/site-content/${key}`, data);
        return res.data.data;
    },

    uploadImage: async (file: File): Promise<string> => {
        const form = new FormData();
        form.append("file", file);
        const res = await api.post("/api/site-content/image", form);
        return res.data.data.url as string;
    },
};
