import { env } from "../config/env.js";
import { sendMail } from "./mail/mailer.js";

export interface EnquiryNotice {
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string | null;
  source: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

/**
 * Best-effort notification for a new website enquiry/booking — emails the
 * business and (if configured) sends a WhatsApp alert. Never throws: a failed
 * notification must not fail the visitor's form submission.
 */
export async function notifyNewEnquiry(e: EnquiryNotice, toEmail: string | null): Promise<void> {
  const kind = e.source === "booking" ? "Booking request" : "Enquiry";
  const rows: [string, string | null][] = [
    ["Name", e.name],
    ["Phone", e.phone],
    ["Email", e.email],
    ["Interested in", e.service],
    ["Message", e.message],
  ];
  const present = rows.filter(([, v]) => !!v) as [string, string][];
  const textLines = present.map(([k, v]) => `${k}: ${v}`);

  // --- Email ---------------------------------------------------------------
  if (toEmail) {
    const html = `
      <h2 style="font-family:sans-serif;color:#0c3b63">New ${escapeHtml(kind)} from the website</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
        ${present
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 12px 6px 0;color:#7fa9c4;vertical-align:top"><b>${escapeHtml(k)}</b></td><td style="padding:6px 0;color:#0c3b63">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>`;
    await sendMail({
      to: toEmail,
      subject: `New ${kind} — ${e.name}`,
      text: `New ${kind.toLowerCase()} from the website:\n\n${textLines.join("\n")}`,
      html,
    });
  }

  // --- WhatsApp (Meta Cloud API) ------------------------------------------
  if (env.whatsappEnabled) {
    const body = `*New ${kind}*\n${textLines.join("\n")}`;
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${env.WHATSAPP_PHONE_ID}/messages`,
        {
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
        },
      );
      if (!res.ok) {
        console.error(`[whatsapp] send failed (${res.status}): ${await res.text().catch(() => "")}`);
      }
    } catch (error) {
      console.error("[whatsapp] send error:", error);
    }
  }
}
