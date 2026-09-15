import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableHead, Td, Th } from "@/components/admin/Table";
import { formatDateTime } from "@/lib/admin/format";
import { getAdminOrders } from "@/lib/admin/orders";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { PAYMENT_METHOD_VALUES, getPaymentMethod } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/utils";
import {
  adminOrderListQuerySchema,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
} from "@/lib/validations/order";

export const metadata: Metadata = { title: "Orders" };

const ORDERS_PATH = "/admin/orders";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const parsed = adminOrderListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : adminOrderListQuerySchema.parse({});

  const { orders, pagination } = await getAdminOrders(query);

  const preserve = {
    q: query.q,
    status: query.status,
    paymentStatus: query.paymentStatus,
    paymentMethod: query.paymentMethod,
  };
  const hasFilters = Boolean(query.q || query.status || query.paymentStatus || query.paymentMethod);

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${pagination.total} order${pagination.total === 1 ? "" : "s"}${hasFilters ? " matching your filters" : ""}`}
      />

      <Notice notice={raw.notice} error={raw.error} />

      <form
        method="get"
        action={ORDERS_PATH}
        className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_150px_150px_150px_auto]"
      >
        <Input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Order number, email or shipping name"
          aria-label="Search orders"
        />
        <Select name="status" defaultValue={query.status ?? ""} aria-label="Order status">
          <option value="">Any status</option>
          {ORDER_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          name="paymentStatus"
          defaultValue={query.paymentStatus ?? ""}
          aria-label="Payment status"
        >
          <option value="">Any payment</option>
          {PAYMENT_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          name="paymentMethod"
          defaultValue={query.paymentMethod ?? ""}
          aria-label="Payment method"
        >
          <option value="">Any method</option>
          {PAYMENT_METHOD_VALUES.map((value) => (
            <option key={value} value={value}>
              {getPaymentMethod(value).label}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {hasFilters && (
            <Link href={ORDERS_PATH} className="text-sm text-neutral-600 hover:text-neutral-900">
              Reset
            </Link>
          )}
        </div>
      </form>

      {orders.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No orders match these filters" : "No orders yet"}
          description={
            hasFilters
              ? "Try a different search term or clear the filters."
              : "Orders appear here once customers check out."
          }
          action={
            hasFilters ? (
              <LinkButton href={ORDERS_PATH} variant="outline">
                Clear filters
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th>Method</Th>
              <Th>Payment</Th>
              <Th className="text-right">Items</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-neutral-50">
                <Td>
                  <Link
                    href={`${ORDERS_PATH}/${order.id}`}
                    className="font-medium text-neutral-900 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {formatDateTime(order.createdAt)}
                </Td>
                <Td>
                  <p className="truncate">{order.email}</p>
                  {order.customerName && (
                    <p className="text-xs text-neutral-500">{order.customerName}</p>
                  )}
                </Td>
                <Td>
                  <OrderStatusBadge status={order.status} />
                </Td>
                <Td className="whitespace-nowrap text-neutral-600">
                  {getPaymentMethod(order.paymentMethod).badge}
                </Td>
                <Td>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </Td>
                <Td className="text-right">{order.itemCount}</Td>
                <Td className="text-right font-medium whitespace-nowrap">
                  {formatPrice(order.total, order.currency.toUpperCase())}
                </Td>
              </tr>
            ))}
          </TableBody>
        </Table>
      )}

      <AdminPagination pagination={pagination} basePath={ORDERS_PATH} preserve={preserve} />
    </>
  );
}
