import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderDetail } from "@/lib/account/orders";
import { buildOrderTimeline } from "@/lib/account/order-timeline";
import { currencyCode, formatDateTime } from "@/lib/account/format";
import { countryName } from "@/lib/payments/countries";
import { getPaymentMethod } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/utils";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { PaymentInstructions } from "@/components/checkout/PaymentInstructions";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Card, PageHeader } from "@/components/ui/Card";
import type { OrderItemData } from "@/types/order";

export const metadata: Metadata = { title: "Order details" };

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

function ItemTitle({ item }: { item: OrderItemData }) {
  if (!item.productSlug) return <span className="font-medium text-neutral-900">{item.title}</span>;
  return (
    <Link
      href={`/products/${item.productSlug}`}
      className="font-medium text-neutral-900 hover:underline"
    >
      {item.title}
    </Link>
  );
}

/** Server Component: one order, scoped to the signed-in user. Unknown or foreign ids render 404. */
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/orders");

  const { id } = await params;
  const order = await getOrderDetail(id, session.user.id);
  if (!order) notFound();

  const currency = currencyCode(order.currency);
  const money = (amount: number) => formatPrice(amount, currency);
  const timeline = buildOrderTimeline(order);
  const address = order.shippingAddress;
  const method = getPaymentMethod(order.paymentMethod);

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Order {order.orderNumber}
            <OrderStatusBadge status={order.status} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <Link
            href="/account/orders"
            className="text-sm text-neutral-700 underline-offset-4 hover:underline"
          >
            Back to orders
          </Link>
        }
      />

      {!method.manual && order.paymentStatus === "UNPAID" && order.status === "PENDING" && (
        <Alert tone="warning" className="mb-6" title="Payment pending">
          We have not received payment for this order yet. If you closed the checkout window, the
          order will remain pending until payment completes or the checkout session expires.
        </Alert>
      )}
      {!method.manual && order.paymentStatus === "FAILED" && (
        <Alert tone="danger" className="mb-6" title="Payment failed">
          Your payment could not be processed. You can place a new order from your cart.
        </Alert>
      )}

      <PaymentInstructions order={order} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-0">
            <h2 className="border-b border-neutral-200 px-6 py-4 text-base font-semibold text-neutral-900">
              Items ({order.itemCount})
            </h2>
            <ul className="divide-y divide-neutral-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <ItemTitle item={item} />
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {money(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-neutral-900">
                      {money(item.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Order progress</h2>
            <OrderTimeline steps={timeline} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-base font-semibold text-neutral-900">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="text-neutral-900">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd className="text-neutral-900">
                  {order.shippingCost === 0 ? "Free" : money(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Tax</dt>
                <dd className="text-neutral-900">{money(order.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
                <dt className="text-neutral-900">Total</dt>
                <dd className="text-neutral-900">{money(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">Payment</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Method</span>
              <span className="font-medium text-neutral-900">{method.label}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-neutral-500">Status</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              Receipt sent to <span className="text-neutral-900">{order.email}</span>
            </p>
            {order.paymentReference && (
              <p className="mt-2 text-xs break-all text-neutral-400">
                {method.referenceLabel ?? "Reference"}: {order.paymentReference}
              </p>
            )}
            {order.stripePaymentIntentId && (
              <p className="mt-2 text-xs break-all text-neutral-400">
                Reference: {order.stripePaymentIntentId}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-neutral-900">Shipping address</h2>
            {address ? (
              <address className="text-sm leading-6 text-neutral-600 not-italic">
                {address.name && (
                  <>
                    <span className="text-neutral-900">{address.name}</span>
                    <br />
                  </>
                )}
                {address.line1}
                {address.line2 && (
                  <>
                    <br />
                    {address.line2}
                  </>
                )}
                <br />
                {[address.city, address.state].filter(Boolean).join(", ")} {address.postalCode}
                <br />
                {address.country ? countryName(address.country) : null}
                {address.phone && (
                  <>
                    <br />
                    {address.phone}
                  </>
                )}
              </address>
            ) : (
              <p className="text-sm text-neutral-500">
                No shipping address was captured for this order.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
