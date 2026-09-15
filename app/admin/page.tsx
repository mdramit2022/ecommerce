import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  OrderStatusBadge,
  PaymentStatusBadge,
  orderStatusTone,
} from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { StatCard } from "@/components/admin/StatCard";
import { Table, TableBody, TableEmptyRow, TableHead, Td, Th } from "@/components/admin/Table";
import { getDashboardStats, LOW_STOCK_THRESHOLD } from "@/lib/admin/dashboard";
import { formatDate } from "@/lib/admin/format";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_VALUES } from "@/lib/validations/order";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">Store overview at a glance.</p>
        </div>
        <LinkButton href="/admin/products/new">New product</LinkButton>
      </div>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          hint="Sum of orders with payment status PAID"
        />
        <StatCard label="Orders" value={stats.ordersTotal} hint="All time">
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ORDER_STATUS_VALUES.map((status) => (
              <Badge key={status} tone={orderStatusTone[status]}>
                {status} {stats.ordersByStatus[status]}
              </Badge>
            ))}
          </div>
        </StatCard>
        <StatCard
          label="Products"
          value={
            <>
              {stats.productsActive}
              <span className="text-base font-normal text-neutral-400">
                {" "}
                / {stats.productsTotal}
              </span>
            </>
          }
          hint="Active / total"
        />
        <StatCard
          label="Customers"
          value={stats.customers}
          hint={`${stats.admins} admin account${stats.admins === 1 ? "" : "s"}`}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="font-semibold text-neutral-900">Low stock</h2>
            <span className="text-xs text-neutral-500">
              Active, stock &le; {LOW_STOCK_THRESHOLD}
            </span>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">
              All active products are sufficiently stocked.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-100" />
                  )}
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {product.title}
                  </Link>
                  <Badge tone={product.stock === 0 ? "danger" : "warning"}>
                    {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-neutral-600 hover:text-neutral-900">
              View all
            </Link>
          </div>
          <Table>
            <TableHead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </TableHead>
            <TableBody>
              {stats.recentOrders.length === 0 ? (
                <TableEmptyRow colSpan={5}>No orders yet.</TableEmptyRow>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
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
                    <Td>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </Td>
                    <Td className="text-right font-medium">
                      {formatPrice(order.total, order.currency.toUpperCase())}
                    </Td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
