export type EnquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface Enquiry {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    service: string | null;
    message: string | null;
    source: string;
    status: EnquiryStatus;
    handledBy: string | null;
    handledAt: string | null;
    createdAt: string;
    updatedAt: string;
}
