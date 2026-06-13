"use client";

import { formatMoney } from "@/lib/format";
import type { Receipt } from "@/types/billing";

/** On-screen, print-friendly receipt layout. */
export function ReceiptView({ receipt }: { receipt: Receipt }) {
  const date = new Date(receipt.invoiceDate).toLocaleString();
  return (
    <div className="mx-auto max-w-sm rounded-lg bg-white p-5 font-mono text-[13px] text-gray-900">
      <div className="text-center">
        <p className="text-base font-bold uppercase tracking-wide">{receipt.company.name}</p>
        {receipt.company.tagline && <p className="text-[11px]">{receipt.company.tagline}</p>}
        {receipt.company.phone && <p className="text-[11px]">{receipt.company.phone}</p>}
        {receipt.company.address && <p className="text-[11px]">{receipt.company.address}</p>}
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-0.5 text-[12px]">
        <div className="flex justify-between">
          <span>Invoice</span>
          <span className="font-semibold">{receipt.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{date}</span>
        </div>
        {receipt.cashierName && (
          <div className="flex justify-between">
            <span>Cashier</span>
            <span>{receipt.cashierName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Status</span>
          <span>{receipt.status}</span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="pb-1 font-semibold">Item</th>
            <th className="pb-1 text-center font-semibold">Qty</th>
            <th className="pb-1 text-right font-semibold">Price</th>
            <th className="pb-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((it, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-1">{it.name}</td>
              <td className="py-0.5 text-center">{it.quantity}</td>
              <td className="py-0.5 text-right">{formatMoney(it.unitPrice)}</td>
              <td className="py-0.5 text-right">{formatMoney(it.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-0.5 text-[12px]">
        <Row label="Subtotal" value={receipt.subtotal} />
        {receipt.discountAmount > 0 && <Row label="Discount" value={-receipt.discountAmount} />}
        <Row label="Tax" value={receipt.taxAmount} />
        <div className="flex justify-between border-t border-gray-300 pt-1 text-sm font-bold">
          <span>Total</span>
          <span>{formatMoney(receipt.totalAmount)}</span>
        </div>
        <Row label="Paid" value={receipt.paidAmount} />
        {receipt.balanceAmount > 0 && <Row label="Balance" value={receipt.balanceAmount} />}
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-0.5 text-[12px]">
        {receipt.payments.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span>{p.methodName}</span>
            <span>{formatMoney(p.amount)}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px]">Thank you for your visit!</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
