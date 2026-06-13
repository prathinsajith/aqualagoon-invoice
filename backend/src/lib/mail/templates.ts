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
                <img src="${brand.logoUrl}" width="64" height="64" alt="${name}" style="display:inline-block;width:64px;height:64px;border-radius:16px;background:#ffffff;padding:6px;border:0;outline:none;text-decoration:none;" />
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
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${name}! 🌊</h1>
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
    <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Welcome aboard, ${name}! 🌊</h1>
    <p style="margin:0 0 8px;">An account has been created for you on ${escapeHtml(brand.name)}. Set your password to finish setting up and sign in.</p>
    ${button(opts.setupUrl, "Set your password")}
    <p style="margin:0 0 8px;color:#64748b;font-size:13px;">This link expires in ${opts.ttl}. If it expires, use "Forgot password" on the sign-in page to request a new one.</p>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">${opts.setupUrl}</p>
  `,
  );
  const text = `Welcome to ${brand.name}, ${opts.name}!\n\nSet your password to finish setting up your account (expires in ${opts.ttl}):\n${opts.setupUrl}`;
  return { to: "", subject, html, text };
}
