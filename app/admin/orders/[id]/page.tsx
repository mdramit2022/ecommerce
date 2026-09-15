import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { PaymentStatusForm } from "@/components/admin/PaymentStatusForm";
import { formatDateTime } from "@/lib/admin/format";
import { getAdminOrderDetail } from "@/lib/admin/orders";
import { nextOrderStatuses, nextPaymentStatuses } from "@/lib/orders/status";
import { countryName } from "@/lib/payments/countries";
import { getPaymentMethod } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/utils";
import { updateOrderPayment, updateOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Order" };

type PageProps = { params: Promise<{ id: string }> };

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-neutral-500">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-xs break-all text-neutral-800 sm:text-right"
            : "text-sm text-neutral-900 sm:text-right"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  const currency = order.currency.toUpperCase();
  const money = (amount: number) => formatPrice(amount, currency);
  const method = getPaymentMethod(order.paymentMethod);
  const nextStatuses = [...nextOrderStatuses(order.status, order.paymentMethod)];
  const nextPayments = method.manual ? [...nextPaymentStatuses(order.paymentStatus)] : [];
  const address = order.shippingAddress;

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.orderNumber}
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)} · updated ${formatDateTime(order.updatedAt)}`}
        actions={
          <LinkButton href="/admin/orders" variant="outline">
            Back to orders
          </LinkButton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Card className="p-0">
            <h2 className="border-b border-neutral-200 px-5 py-4 font-semibold text-neutral-900">
              Items ({order.itemCount})
            </h2>
            <ul className="divide-y divide-neutral-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-md bg-neutral-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    {item.productSlug ? (
                      <Link
                        href={`/admin/products/${item.productId}/edit`}
                        className="block truncate text-sm font-medium text-neutral-900 hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {money(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-neutral-900">
                    {money(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="border-t border-neutral-200 px-5 py-3">
              <DetailRow label="Subtotal" value={money(order.subtotal)} />
              <DetailRow label="Shipping" value={money(order.shippingCost)} />
              <DetailRow label="Tax" value={money(order.tax)} />
              <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
                <dt className="font-semibold text-neutral-900">Total</dt>
                <dd className="text-lg font-semibold text-neutral-900">{money(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-neutral-900">Shipping address</h2>
            {address ? (
              <address className="text-sm leading-relaxed text-neutral-800 not-italic">
                {address.name && <div className="font-medium">{address.name}</div>}
                {address.line1 && <div>{address.line1}</div>}
                {address.line2 && <div>{address.line2}</div>}
                <div>
                  {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                </div>
                {address.country && <div>{countryName(address.country)}</div>}
                {address.phone && <div className="text-neutral-500">{address.phone}</div>}
              </address>
            ) : (
              <p className="text-sm text-neutral-500">No shipping address on this order.</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 font-semibold text-neutral-900">Update status</h2>
            <OrderStatusForm
              orderId={order.id}
              currentStatus={order.status}
              paymentStatus={order.paymentStatus}
              nextStatuses={nextStatuses}
              action={updateOrderStatus}
            />
            {order.status === "PAID" && order.paymentStatus === "PAID" && !method.manual && (
              <Alert tone="info" className="mt-4">
                Cancelling a paid order does not refund the customer automatically. Refund in the
                Stripe dashboard, then tick &quot;mark as refunded&quot; here.
              </Alert>
            )}
            {order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus === "UNPAID" && (
              <Alert tone="info" className="mt-4">
                Cash on delivery: this order may ship before it is paid. Record the cash with
                &quot;Record payment&quot; once the courier hands it in.
              </Alert>
            )}
          </Card>

          {method.manual && (
            <Card>
              <h2 className="mb-1 font-semibold text-neutral-900">Record payment</h2>
              <p className="mb-4 text-sm text-neutral-500">
                {method.label} is settled by hand - confirm it here once you have verified the
                money.
              </p>
              <PaymentStatusForm
                orderId={order.id}
                paymentMethod={order.paymentMethod}
                methodLabel={method.label}
                currentStatus={order.paymentStatus}
                nextStatuses={nextPayments}
                referenceLabel={method.referenceLabel}
                currentReference={order.paymentReference}
                action={updateOrderPayment}
              />
            </Card>
          )}

          <Card>
            <h2 className="mb-2 font-semibold text-neutral-900">Customer</h2>
            <dl className="divide-y divide-neutral-100">
              <DetailRow label="Email" value={order.email} />
              <DetailRow
                label="Account"
                value={
                  order.customer ? (
                    <Link
                      href={`/admin/customers?q=${encodeURIComponent(order.customer.email)}`}
                      className="hover:underline"
                    >
                      {order.customer.name ?? order.customer.email}
                    </Link>
                  ) : (
                    <span className="text-neutral-500">Guest checkout</span>
                  )
                }
              />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-2 font-semibold text-neutral-900">Payment</h2>
            <dl className="divide-y divide-neutral-100">
              <DetailRow label="Method" value={method.label} />
              <DetailRow
                label="Payment status"
                value={<PaymentStatusBadge status={order.paymentStatus} />}
              />
              <DetailRow
                label={method.referenceLabel ?? "Reference"}
                mono
                value={
                  order.paymentReference ?? (
                    <span className="font-sans text-sm text-neutral-400">-</span>
                  )
                }
              />
              <DetailRow label="Currency" value={currency} />
              <DetailRow
                label="Stripe session"
                mono
                value={
                  order.stripeSessionId ?? (
                    <span className="font-sans text-sm text-neutral-400">-</span>
                  )
                }
              />
              <DetailRow
                label="Payment intent"
                mono
                value={
                  order.stripePaymentIntentId ?? (
                    <span className="font-sans text-sm text-neutral-400">-</span>
                  )
                }
              />
              <DetailRow label="Order id" mono value={order.id} />
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
