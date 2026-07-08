import { env } from "../config/env.js";
import { sendMail } from "./mail/mailer.js";
import type { MailBranding } from "./mail/branding.js";
import {
  enquiryNotificationEmail,
  enquiryConfirmationEmail,
  type EnquiryNotice,
  type EnquiryContact,
} from "./mail/templates.js";

export type { EnquiryNotice, EnquiryContact };

export interface NotifyOptions {
  brand: MailBranding;
  notice: EnquiryNotice;
  /** Where to send the business notification (resolved by the caller). */
  adminEmail: string | null;
  /** Business contact info shown in the visitor's confirmation email. */
  contact: EnquiryContact;
}

/**
 * Best-effort notifications for a new website enquiry/booking:
 *   1. emails the business a notification,
 *   2. emails the visitor a branded confirmation (only if they left an email),
 *   3. sends a WhatsApp alert to the business (if configured).
 * Never throws — a failed notification must not fail the visitor's submission.
 */
export async function notifyNewEnquiry({ brand, notice, adminEmail, contact }: NotifyOptions): Promise<void> {
  // --- Business notification email ----------------------------------------
  if (adminEmail) {
    const msg = enquiryNotificationEmail(brand, notice);
    await sendMail({ ...msg, to: adminEmail });
  }

  // --- Visitor confirmation email (email is optional on the form) ---------
  if (notice.email) {
    const msg = enquiryConfirmationEmail(brand, notice, contact);
    await sendMail({ ...msg, to: notice.email });
  }

  // --- WhatsApp (Meta Cloud API) ------------------------------------------
  if (env.whatsappEnabled) {
    const kind = notice.source === "booking" ? "Booking request" : "Enquiry";
    const lines = [
      `Name: ${notice.name}`,
      notice.phone ? `Phone: ${notice.phone}` : null,
      notice.email ? `Email: ${notice.email}` : null,
      notice.eventDate ? `Event date: ${notice.eventDate}` : null,
      notice.eventType ? `Event type: ${notice.eventType}` : null,
      notice.guests ? `Guests: ${notice.guests}` : null,
      notice.service ? `Interested in: ${notice.service}` : null,
      notice.message ? `Message: ${notice.message}` : null,
    ].filter(Boolean);
    const body = `*New ${kind}*\n${lines.join("\n")}`;
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: env.WHATSAPP_NOTIFY_TO,
          type: "text",
          text: { body },
        }),
      });
      if (!res.ok) {
        console.error(`[whatsapp] send failed (${res.status}): ${await res.text().catch(() => "")}`);
      }
    } catch (error) {
      console.error("[whatsapp] send error:", error);
    }
  }
}
