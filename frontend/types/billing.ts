import type { PassKind } from "@/types/pass";

export type InvoiceStatus =
    | "DRAFT"
    | "PENDING"
    | "PARTIAL"
    | "PAID"
    | "CANCELLED"
    | "REFUNDED";
export type InvoiceType = "PRODUCT" | "PASS" | "TRAINING" | "MIXED";
export type InvoiceItemType = "PRODUCT" | "PASS" | "TRAINING" | "SERVICE" | "MEMBERSHIP";

export interface PaymentMethod {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
    usageCount: number;
    createdBy: string | null;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface InvoiceItem {
    id: string;
    itemType: InvoiceItemType;
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
}

export interface Payment {
    id: string;
    paymentMethodId: string;
    paymentMethodName: string;
    amount: number;
    transactionReference: string | null;
    remarks: string | null;
    receivedBy: string | null;
    paymentDate: string;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    customerId: string | null;
    invoiceType: InvoiceType;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: InvoiceStatus;
    notes: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    items: InvoiceItem[];
    payments: Payment[];
}

export interface InvoiceSummary {
    id: string;
    invoiceNo: string;
    customerId: string | null;
    invoiceType: InvoiceType;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: InvoiceStatus;
    itemCount: number;
    createdBy: string | null;
    createdAt: string;
}

/** A pass issued by a checkout (returned alongside the invoice). */
export interface IssuedPass {
    id: string;
    passNumber: string;
    passTypeName: string;
    holderName: string | null;
    expiryTime: string;
}

export interface CheckoutResult {
    invoice: Invoice;
    change: number;
    /** Passes created+activated by this sale (empty for product-only invoices). */
    passes: IssuedPass[];
}

/** A unified sellable catalog entry (product or pass) for the POS. */
export interface CatalogItem {
    itemType: "PRODUCT" | "PASS";
    id: string;
    name: string;
    sku: string | null;
    price: number;
    taxPercentage: number;
    /** Null for passes (no stock concept); product stock otherwise. */
    stockQuantity: number | null;
    subtitle: string | null;
    imageUrl: string | null;
    /** The pass kind (null for products) — drives POS quantity rules. */
    passKind: PassKind | null;
}

export interface Receipt {
    company: {
        name: string;
        tagline: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
    };
    invoiceNo: string;
    invoiceDate: string;
    status: InvoiceStatus;
    cashierName: string | null;
    customerId: string | null;
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        discountAmount: number;
        taxAmount: number;
        totalAmount: number;
    }[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    payments: { methodName: string; amount: number; transactionReference: string | null }[];
}

export interface SalesSummary {
    invoices: number;
    revenue: number;
    itemsSold: number;
}

export interface TopProduct {
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
    stockRemaining: number | null;
}

export interface LowStockProduct {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    minimumStock: number;
}

export interface PaymentMethodTotal {
    paymentMethodId: string;
    name: string;
    amount: number;
}

export interface PassTypeTotal {
    passTypeId: string;
    name: string;
    count: number;
    revenue: number;
}

/** Revenue split by what was sold — products vs passes — for a date range. */
export interface RevenueBreakdown {
    product: number;
    pass: number;
    total: number;
}

export interface TopPassBuyer {
    userId: string | null;
    name: string;
    photoUrl: string | null;
    passCount: number;
    totalSpent: number;
}
