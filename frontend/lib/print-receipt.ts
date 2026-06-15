import type { Receipt } from "@/types/billing";
import { formatMoney } from "@/lib/format";
import { resolveMediaUrl } from "@/lib/media";

const esc = (s: string): string =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Opens a print window containing only the receipt and triggers the browser
 * print dialog. Self-contained HTML (no app chrome), so it prints cleanly on
 * thermal or A4 printers without a global print stylesheet.
 */
export function printReceipt(receipt: Receipt): void {
    const rows = receipt.items
        .map(
            (it) => `<tr>
        <td>${esc(it.name)}</td>
        <td class="c">${it.quantity}</td>
        <td class="r">${formatMoney(it.unitPrice)}</td>
        <td class="r">${formatMoney(it.totalAmount)}</td>
      </tr>`,
        )
        .join("");

    const payments = receipt.payments
        .map((p) => `<div class="row"><span>${esc(p.methodName)}</span><span>${formatMoney(p.amount)}</span></div>`)
        .join("");

    const logoUrl = resolveMediaUrl(receipt.company.logoUrl);

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(receipt.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, Menlo, Consolas, monospace; color: #111; margin: 0; padding: 16px; }
  .receipt { max-width: 320px; margin: 0 auto; font-size: 12px; }
  .center { text-align: center; }
  .logo { max-width: 160px; max-height: 80px; width: auto; height: auto; margin: 0 auto 6px; display: block; object-fit: contain; }
  .brand { font-size: 15px; font-weight: 700; text-transform: uppercase; }
  .muted { font-size: 11px; }
  .sep { border-top: 1px dashed #888; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 11px; }
  td { padding: 2px 0; vertical-align: top; }
  .c { text-align: center; } .r { text-align: right; }
  .row { display: flex; justify-content: space-between; }
  .total { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 2px; }
</style></head>
<body><div class="receipt">
  <div class="center">
    ${logoUrl ? `<img class="logo" src="${esc(logoUrl)}" alt="${esc(receipt.company.name)}" />` : ""}
    <div class="brand">${esc(receipt.company.name)}</div>
    ${receipt.company.tagline ? `<div class="muted">${esc(receipt.company.tagline)}</div>` : ""}
    ${receipt.company.phone ? `<div class="muted">${esc(receipt.company.phone)}</div>` : ""}
    ${receipt.company.address ? `<div class="muted">${esc(receipt.company.address)}</div>` : ""}
  </div>
  <div class="sep"></div>
  <div class="row"><span>Invoice</span><span><b>${esc(receipt.invoiceNo)}</b></span></div>
  <div class="row"><span>Date</span><span>${esc(new Date(receipt.invoiceDate).toLocaleString())}</span></div>
  ${receipt.cashierName ? `<div class="row"><span>Cashier</span><span>${esc(receipt.cashierName)}</span></div>` : ""}
  <div class="row"><span>Status</span><span>${esc(receipt.status)}</span></div>
  <div class="sep"></div>
  <table><thead><tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="sep"></div>
  <div class="row"><span>Subtotal</span><span>${formatMoney(receipt.subtotal)}</span></div>
  ${receipt.discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${formatMoney(receipt.discountAmount)}</span></div>` : ""}
  <div class="row"><span>Tax</span><span>${formatMoney(receipt.taxAmount)}</span></div>
  <div class="total"><span>Total</span><span>${formatMoney(receipt.totalAmount)}</span></div>
  <div class="row"><span>Paid</span><span>${formatMoney(receipt.paidAmount)}</span></div>
  ${receipt.balanceAmount > 0 ? `<div class="row"><span>Balance</span><span>${formatMoney(receipt.balanceAmount)}</span></div>` : ""}
  <div class="sep"></div>
  ${payments}
  <p class="center muted" style="margin-top:14px">Thank you for your visit!</p>
</div>
<script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 300); };</script>
</body></html>`;

    const w = window.open("", "_blank", "width=400,height=640");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
}
