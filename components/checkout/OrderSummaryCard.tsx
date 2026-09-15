import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { countryName } from "@/lib/payments/countries";
import { getPaymentMethod } from "@/lib/payments/methods";
import { cn, formatPrice } from "@/lib/utils";
import type { OrderDetail, ShippingAddressData } from "@/types/order";

export type OrderSummaryCardProps = {
  order: OrderDetail;
  /** Show the contact email next to the shipping address. */
  showContact?: boolean;
  className?: string;
};

function addressLines(address: ShippingAddressData): string[] {
  const locality = [address.city, address.state].filter(Boolean).join(", ");
  const localityLine = [locality, address.postalCode].filter(Boolean).join(" ");
  const country = address.country ? countryName(address.country) : null;
  return [address.line1, address.line2, localityLine, country].filter(
    (line): line is string => typeof line === "string" && line.trim().length > 0,
  );
}

/**
 * Server Component. Self-contained rendering of an `OrderDetail`: line items, totals and the
 * shipping snapshot. Used by the checkout success page; safe to reuse anywhere an order is shown.
 */
export function OrderSummaryCard({ order, showContact = true, className }: OrderSummaryCardProps) {
  const currency = order.currency.toUpperCase();
  const money = (amount: number) => formatPrice(amount, currency);
  const address = order.shippingAddress;
  const hasContact = showContact && order.email && !order.email.includes("@checkout");
  const method = getPaymentMethod(order.paymentMethod);

  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-neutral-200 px-6 py-4">
        <h2 className="text-base font-semibold text-neutral-900">Order summary</h2>
        <p className="text-sm text-neutral-500">
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-sm">
          <thead className="text-left text-xs tracking-wide text-neutral-500 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">
                Item
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Qty
              </th>
              <th scope="col" className="px-3 py-3 text-right font-medium">
                Unit price
              </th>
              <th scope="col" className="px-6 py-3 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {item.image ? (
                        <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      {item.productSlug ? (
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-medium text-neutral-900 hover:underline"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span className="font-medium text-neutral-900">{item.title}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-neutral-700 tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-3 py-3 text-right text-neutral-700 tabular-nums">
                  {money(item.unitPrice)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-neutral-900 tabular-nums">
                  {money(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="space-y-1.5 border-t border-neutral-200 px-6 py-4 text-sm">
        <div className="flex justify-between text-neutral-600">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{money(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-neutral-600">
          <dt>Shipping</dt>
          <dd className="tabular-nums">
            {order.shippingCost === 0 ? "Free" : money(order.shippingCost)}
          </dd>
        </div>
        <div className="flex justify-between text-neutral-600">
          <dt>Tax</dt>
          <dd className="tabular-nums">{money(order.tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
          <dt>Total</dt>
          <dd className="tabular-nums">{money(order.total)}</dd>
        </div>
        <div className="flex justify-between pt-1 text-neutral-600">
          <dt>Payment method</dt>
          <dd className="text-neutral-900">{method.label}</dd>
        </div>
      </dl>

      {(address || hasContact) && (
        <div className="grid gap-6 border-t border-neutral-200 px-6 py-4 text-sm sm:grid-cols-2">
          {address && (
            <div>
              <h3 className="mb-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Shipping address
              </h3>
              <address className="leading-6 text-neutral-800 not-italic">
                {address.name && <span className="block font-medium">{address.name}</span>}
                {addressLines(address).map((line, index) => (
                  <span key={`${index}-${line}`} className="block">
                    {line}
                  </span>
                ))}
                {address.phone && <span className="block text-neutral-600">{address.phone}</span>}
              </address>
            </div>
          )}
          {hasContact && (
            <div>
              <h3 className="mb-1 text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Contact
              </h3>
              <p className="break-all text-neutral-800">{order.email}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
