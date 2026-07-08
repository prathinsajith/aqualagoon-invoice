import type { MailMessage } from "./mailer.js";
import type { MailBranding } from "./branding.js";

const AQUA = "#0a84d6";
const AQUA_LIGHT = "#29abe2";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wraps body HTML in a responsive, branded email shell (table-based for clients). */
function layout(brand: MailBranding, bodyHtml: string): string {
  const name = escapeHtml(brand.name);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f3f6fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,${AQUA_LIGHT},${AQUA});padding:28px 32px;text-align:center;">
                <img src="${escapeHtml(brand.logoUrl)}" width="64" height="64" alt="${name}" style="display:inline-block;width:64px;height:64px;border-radius:16px;background:#ffffff;padding:6px;border:0;outline:none;text-decoration:none;" />
                <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;margin-top:14px;">${name}</div>
                ${brand.tagline ? `<div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px;">${escapeHtml(brand.tagline)}</div>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;text-align:center;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} ${name}. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td align="center" style="border-radius:10px;background:${AQUA};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:10px;">${label}</a>
    </td></tr>
  </table>`;
}

/** Password reset email. */
export function passwordResetEmail(
  brand: MailBranding,
  opts: { name: string; resetUrl: string; ttl: string },
): MailMessage {
  const name = escapeHtml(opts.name);
  const subject = `Reset your ${brand.name} password`;
  const html = layout(
    brand,
    `
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Reset your password</h1>
    <p style="margin:0 0 8px;">Hi ${name},</p>
    <p style="margin:0 0 8px;">We received a request to reset your ${escapeHtml(brand.name)} password. Click the button below to choose a new one.</p>
    ${button(opts.resetUrl, "Reset password")}
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">This link expires in ${opts.ttl}. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${opts.resetUrl}</p>
  `,
  );
  const text = `Reset your ${brand.name} password\n\nHi ${opts.name},\nReset your password using this link (expires in ${opts.ttl}):\n${opts.resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { to: "", subject, html, text };
}

/** Welcome email sent when an account is created. */
export function welcomeEmail(
  brand: MailBranding,
  opts: { name: string; loginUrl: string },
): MailMessage {
  const name = escapeHtml(opts.name);
  const subject = `Welcome to ${brand.name}`;
  const html = layout(
    brand,
    `
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${name}!</h1>
    <p style="margin:0 0 8px;">Your ${escapeHtml(brand.name)} account has been created. You can now sign in to the admin console.</p>
    ${button(opts.loginUrl, "Go to sign in")}
    <p style="margin:0;color:#64748b;font-size:13px;">If you weren't expecting this, please contact your administrator.</p>
  `,
  );
  const text = `Welcome to ${brand.name}, ${opts.name}!\n\nYour account has been created. Sign in: ${opts.loginUrl}`;
  return { to: "", subject, html, text };
}

/** Sent to a new staff/admin/coach user so they can set their own password. */
export function setPasswordEmail(
  brand: MailBranding,
  opts: { name: string; setupUrl: string; ttl: string },
): MailMessage {
  const name = escapeHtml(opts.name);
  const subject = `Set up your ${brand.name} account`;
  const html = layout(
    brand,
    `
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${name}!</h1>
    <p style="margin:0 0 8px;">An account has been created for you on ${escapeHtml(brand.name)}. Set your password to finish setting up and sign in.</p>
    ${button(opts.setupUrl, "Set your password")}
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">This link expires in ${opts.ttl}. If it expires, use "Forgot password" on the sign-in page to request a new one.</p>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${opts.setupUrl}</p>
  `,
  );
  const text = `Welcome to ${brand.name}, ${opts.name}!\n\nSet your password to finish setting up your account (expires in ${opts.ttl}):\n${opts.setupUrl}`;
  return { to: "", subject, html, text };
}

// ── Website enquiry / booking emails ────────────────────────────────────────

export interface EnquiryNotice {
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  message: string | null;
  eventDate?: string | null;
  eventType?: string | null;
  guests?: string | null;
  source: string;
}

/** Business contact details surfaced in the visitor's confirmation email. */
export interface EnquiryContact {
  phone: string | null;
  email: string | null;
}

function enquiryKind(source: string): string {
  return source === "booking" ? "Booking request" : "Enquiry";
}

/** A label/value details table for the submitted fields (skips empty ones). */
function detailsTable(notice: EnquiryNotice): string {
  const rows: [string, string | null][] = [
    ["Name", notice.name],
    ["Phone", notice.phone],
    ["Email", notice.email],
    ["Event date", notice.eventDate ?? null],
    ["Event type", notice.eventType ?? null],
    ["Guests", notice.guests ?? null],
    ["Interested in", notice.service],
    ["Message", notice.message],
  ];
  const cells = rows
    .filter(([, v]) => !!v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:#64748b;vertical-align:top;white-space:nowrap;font-size:13px;"><strong>${escapeHtml(k)}</strong></td><td style="padding:7px 0;color:#0f172a;font-size:14px;">${escapeHtml(v as string).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${cells}</table>`;
}

function detailsText(notice: EnquiryNotice): string {
  return [
    `Name: ${notice.name}`,
    notice.phone ? `Phone: ${notice.phone}` : null,
    notice.email ? `Email: ${notice.email}` : null,
    notice.eventDate ? `Event date: ${notice.eventDate}` : null,
    notice.eventType ? `Event type: ${notice.eventType}` : null,
    notice.guests ? `Guests: ${notice.guests}` : null,
    notice.service ? `Interested in: ${notice.service}` : null,
    notice.message ? `Message: ${notice.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Notifies the business of a new website enquiry/booking. */
export function enquiryNotificationEmail(brand: MailBranding, notice: EnquiryNotice): MailMessage {
  const kind = enquiryKind(notice.source);
  const html = layout(
    brand,
    `
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">New ${escapeHtml(kind.toLowerCase())} from the website</h1>
    <p style="margin:0 0 20px;color:#475569;">You have a new ${escapeHtml(kind.toLowerCase())}. Reply or call the visitor back.</p>
    <div style="background:#f2f9fd;border-radius:12px;padding:16px 18px;">
      ${detailsTable(notice)}
    </div>
  `,
  );
  const text = `New ${kind.toLowerCase()} from the website:\n\n${detailsText(notice)}`;
  return { to: "", subject: `New ${kind} — ${notice.name}`, html, text };
}

/** Confirms receipt to the visitor who submitted the form (needs their email). */
export function enquiryConfirmationEmail(
  brand: MailBranding,
  notice: EnquiryNotice,
  contact?: EnquiryContact,
): MailMessage {
  const kind = enquiryKind(notice.source);
  const isBooking = notice.source === "booking";
  const firstName = escapeHtml(notice.name.split(" ")[0] || notice.name);
  const intro = isBooking
    ? `We've received your booking request and our team will call you back shortly to confirm the details.`
    : `Thanks for reaching out! We've received your enquiry and our team will get back to you soon.`;
  const steps = isBooking
    ? ["We review your booking request", "Our team calls you to confirm the details", "See you at the pool"]
    : ["We review your message", "Our team gets back to you shortly", "We help you get started"];
  const reachUs = contact?.phone
    ? `Prefer to talk now? Call <strong style="color:#0f172a;">${escapeHtml(contact.phone)}</strong> and we'll be happy to help.`
    : `Need anything sooner? Just reply to this email.`;
  const callButton = contact?.phone
    ? button(`tel:${contact.phone.replace(/[^\d+]/g, "")}`, "Call us")
    : "";
  const html = layout(
    brand,
    `
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${isBooking ? "Booking request received" : "We've received your enquiry"}</h1>
    <p style="margin:0 0 8px;">Hi ${firstName},</p>
    <p style="margin:0 0 22px;">${intro}</p>
    <div style="background:#f2f9fd;border-radius:12px;padding:16px 18px;margin:0 0 22px;">
      <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your ${escapeHtml(kind.toLowerCase())}</div>
      ${detailsTable(notice)}
    </div>
    <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">What happens next</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      ${steps
        .map(
          (s, i) =>
            `<tr>
              <td width="32" style="padding:0 12px 14px 0;vertical-align:top;">
                <div style="width:26px;height:26px;border-radius:50%;background:${AQUA};color:#ffffff;font-size:13px;font-weight:800;text-align:center;line-height:26px;">${i + 1}</div>
              </td>
              <td style="padding:0 0 14px;vertical-align:middle;color:#334155;font-size:14px;">${escapeHtml(s)}</td>
            </tr>`,
        )
        .join("")}
    </table>
    ${callButton}
    <p style="margin:${callButton ? "8" : "20"}px 0 0;color:#475569;font-size:14px;text-align:center;">${reachUs}</p>
  `,
  );
  const text = [
    `Hi ${notice.name},`,
    "",
    intro,
    "",
    `Your ${kind.toLowerCase()}:`,
    detailsText(notice),
    "",
    "What happens next:",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    contact?.phone ? `Prefer to talk now? Call ${contact.phone}.` : "",
    `— ${brand.name}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
  const subject = isBooking ? `We got your booking request — ${brand.name}` : `Thanks for your enquiry — ${brand.name}`;
  return { to: notice.email ?? "", subject, html, text };
}
