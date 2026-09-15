import { env } from "@/lib/env";
import { getPaymentMethod } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/utils";
import type { OrderDetail } from "@/types/order";

/**
 * Transactional email templates for orders. Pure functions: build content only,
 * sending happens in `lib/orders/fulfill.ts` via `sendEmail`.
 */

export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

/** Escape user-controlled text (product titles, names, addresses) before embedding in HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Postal-address lines with empty parts removed. */
export function shippingAddressLines(order: OrderDetail): string[] {
  const address = order.shippingAddress;
  if (!address) return [];

  const locality = [address.city, address.state].filter(Boolean).join(", ");
  const localityLine = [locality, address.postalCode].filter(Boolean).join(" ");

  return [
    address.name,
    address.line1,
    address.line2,
    localityLine,
    address.country,
    address.phone,
  ].filter((line): line is string => typeof line === "string" && line.trim().length > 0);
}

export function orderConfirmationEmail(order: OrderDetail): EmailContent {
  const currency = order.currency.toUpperCase();
  const money = (amount: number) => formatPrice(amount, currency);
  const method = getPaymentMethod(order.paymentMethod);
  // A manually settled order still owes us money when it is placed, so say "received" not "confirmed".
  const awaitingPayment = method.manual && order.paymentStatus !== "PAID";
  const subject = awaitingPayment
    ? `Order received - ${order.orderNumber}`
    : `Order confirmed - ${order.orderNumber}`;
  const ordersUrl = `${env.NEXT_PUBLIC_APP_URL}/account/orders`;
  const addressLines = shippingAddressLines(order);
  const placedOn = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemRowsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.title)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(item.unitPrice)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(item.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const totalsHtml = `
        <tr><td colspan="3" style="padding:6px 0;text-align:right;color:#555;">Subtotal</td><td style="padding:6px 0;text-align:right;">${money(order.subtotal)}</td></tr>
        <tr><td colspan="3" style="padding:6px 0;text-align:right;color:#555;">Shipping</td><td style="padding:6px 0;text-align:right;">${money(order.shippingCost)}</td></tr>
        <tr><td colspan="3" style="padding:6px 0;text-align:right;color:#555;">Tax</td><td style="padding:6px 0;text-align:right;">${money(order.tax)}</td></tr>
        <tr><td colspan="3" style="padding:10px 0;text-align:right;font-weight:600;">Total</td><td style="padding:10px 0;text-align:right;font-weight:600;">${money(order.total)}</td></tr>`;

  const addressHtml =
    addressLines.length > 0
      ? `
      <h2 style="font-size:16px;margin:24px 0 8px;">Shipping to</h2>
      <p style="margin:0;line-height:1.5;">${addressLines.map(escapeHtml).join("<br>")}</p>`
      : "";

  const accountHtml = order.userId
    ? `<p style="margin:24px 0 0;"><a href="${ordersUrl}" style="color:#111;">View your orders</a></p>`
    : "";

  const paymentHtml = awaitingPayment
    ? `
      <div style="margin:24px 0 0;padding:16px;border:1px solid #f0d8a8;border-radius:8px;background:#fdf7ec;">
        <h2 style="font-size:16px;margin:0 0 8px;">Paying by ${escapeHtml(method.label)}</h2>
        <p style="margin:0 0 8px;">Amount due: <strong>${money(order.total)}</strong>. Quote order ${escapeHtml(order.orderNumber)}.</p>
        <ul style="margin:0;padding-left:18px;line-height:1.6;">
          ${method.instructions.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>`
    : `
      <p style="margin:24px 0 0;">Paid by ${escapeHtml(method.label)}.</p>`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
      <h1 style="font-size:22px;margin:0 0 8px;">Thank you for your order</h1>
      <p style="margin:0 0 24px;color:#555;">
        Order <strong>${escapeHtml(order.orderNumber)}</strong> placed on ${escapeHtml(placedOn)}.
        ${
          awaitingPayment
            ? "We will confirm it as soon as your payment is verified."
            : "We will email you again when it ships."
        }
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="text-align:left;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">
            <th style="padding:0 0 8px;">Item</th>
            <th style="padding:0 0 8px;text-align:right;">Qty</th>
            <th style="padding:0 0 8px;text-align:right;">Price</th>
            <th style="padding:0 0 8px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRowsHtml}</tbody>
        <tfoot>${totalsHtml}</tfoot>
      </table>${addressHtml}${paymentHtml}${accountHtml}
      <p style="margin:32px 0 0;font-size:12px;color:#888;">Questions? Reply to this email and we will help.</p>
    </div>
  </body>
</html>`;

  const textLines = [
    "Thank you for your order",
    "",
    `Order ${order.orderNumber} placed on ${placedOn}.`,
    "",
    ...order.items.map(
      (item) =>
        `${item.quantity} x ${item.title} @ ${money(item.unitPrice)} = ${money(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${money(order.shippingCost)}`,
    `Tax: ${money(order.tax)}`,
    `Total: ${money(order.total)}`,
  ];
  if (addressLines.length > 0) textLines.push("", "Shipping to:", ...addressLines);

  if (awaitingPayment) {
    textLines.push(
      "",
      `Paying by ${method.label} - amount due ${money(order.total)}, quote order ${order.orderNumber}:`,
      ...method.instructions.map((line) => `- ${line}`),
    );
  } else {
    textLines.push("", `Paid by ${method.label}.`);
  }

  if (order.userId) textLines.push("", `View your orders: ${ordersUrl}`);

  return { subject, html, text: textLines.join("\n") };
}
