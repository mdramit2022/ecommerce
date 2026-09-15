import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUserOrders } from "@/lib/account/orders";
import { orderListQuerySchema } from "@/lib/validations/order";
import { OrdersTable } from "@/components/account/OrdersTable";
import { AccountPagination } from "@/components/account/AccountPagination";
import { EmptyState, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 10;

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Server Component: paginated list of the signed-in user's orders. */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/orders");

  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const parsed = orderListQuerySchema.safeParse({ page: rawPage ?? 1, limit: PAGE_SIZE });
  const query = parsed.success ? parsed.data : { page: 1, limit: PAGE_SIZE };

  const { data: orders, pagination } = await listUserOrders(session.user.id, query);

  return (
    <>
      <PageHeader
        title="Orders"
        description={
          pagination.total === 0
            ? "You have not placed any orders yet."
            : `${pagination.total} ${pagination.total === 1 ? "order" : "orders"}`
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title={pagination.total === 0 ? "No orders yet" : "Nothing on this page"}
          description={
            pagination.total === 0
              ? "Your orders will appear here once you check out."
              : "This page is past the end of your order history."
          }
          action={
            <Link
              href={pagination.total === 0 ? "/" : "/account/orders"}
              className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700"
            >
              {pagination.total === 0 ? "Start shopping" : "Back to first page"}
            </Link>
          }
        />
      ) : (
        <>
          <OrdersTable orders={orders} />
          <div className="mt-8">
            <AccountPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/account/orders"
            />
          </div>
        </>
      )}
    </>
  );
}
