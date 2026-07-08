export type EnquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface Enquiry {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    service: string | null;
    message: string | null;
    // Private-event booking details (present when source === "booking").
    eventDate: string | null;
    eventType: string | null;
    guests: string | null;
    source: string;
    status: EnquiryStatus;
    handledBy: string | null;
    handledAt: string | null;
    createdAt: string;
    updatedAt: string;
}
