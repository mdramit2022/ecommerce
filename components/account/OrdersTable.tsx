import Link from "next/link";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { currencyCode, formatDate } from "@/lib/account/format";
import { formatPrice } from "@/lib/utils";
import type { OrderSummary } from "@/types/order";

export type OrdersTableProps = {
  orders: OrderSummary[];
};

/** Server Component: compact order list used by the overview and the orders page. */
export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Order
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Payment
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Items
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 font-medium text-neutral-900">
                <Link href={`/account/orders/${order.id}`} className="hover:underline">
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-600">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={order.paymentStatus} />
              </td>
              <td className="px-4 py-3 text-right text-neutral-600">{order.itemCount}</td>
              <td className="px-4 py-3 text-right font-medium text-neutral-900">
                {formatPrice(order.total, currencyCode(order.currency))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
