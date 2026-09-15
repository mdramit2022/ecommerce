import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { countUserAddresses } from "@/lib/account/addresses";
import { countUserOrders, listRecentUserOrders } from "@/lib/account/orders";
import { getProfile } from "@/lib/account/profile";
import { formatDate } from "@/lib/account/format";
import { OrdersTable } from "@/components/account/OrdersTable";
import { Card, EmptyState, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Overview" };

const quickLinks = [
  {
    href: "/account/orders",
    label: "View all orders",
    description: "Track status and see receipts.",
  },
  {
    href: "/account/addresses",
    label: "Manage addresses",
    description: "Add or edit shipping addresses.",
  },
  { href: "/account/profile", label: "Edit profile", description: "Update your name or password." },
  { href: "/", label: "Continue shopping", description: "Back to the storefront." },
] as const;

/** Server Component: account overview with counts, recent orders and quick links. */
export default async function AccountOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account");
  const userId = session.user.id;

  const [profile, orderCount, addressCount, recentOrders] = await Promise.all([
    getProfile(userId),
    countUserOrders(userId),
    countUserAddresses(userId),
    listRecentUserOrders(userId, 3),
  ]);

  const displayName =
    profile?.name?.trim() || session.user.name?.trim() || profile?.email || "there";

  return (
    <>
      <PageHeader
        title={`Hello, ${displayName}`}
        description={
          profile ? `Member since ${formatDate(profile.createdAt)} - ${profile.email}` : undefined
        }
      />

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-neutral-500">Orders</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {orderCount}
          </p>
          <Link
            href="/account/orders"
            className="mt-2 inline-block text-sm text-neutral-700 underline-offset-4 hover:underline"
          >
            View orders
          </Link>
        </Card>
        <Card>
          <p className="text-sm text-neutral-500">Saved addresses</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            {addressCount}
          </p>
          <Link
            href="/account/addresses"
            className="mt-2 inline-block text-sm text-neutral-700 underline-offset-4 hover:underline"
          >
            Manage addresses
          </Link>
        </Card>
      </section>

      <section aria-labelledby="recent-orders" className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-orders" className="text-lg font-semibold text-neutral-900">
            Recent orders
          </h2>
          {orderCount > recentOrders.length && (
            <Link
              href="/account/orders"
              className="text-sm text-neutral-700 underline-offset-4 hover:underline"
            >
              See all {orderCount}
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place an order it will show up here."
            action={
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Start shopping
              </Link>
            }
          />
        ) : (
          <OrdersTable orders={recentOrders} />
        )}
      </section>

      <section aria-labelledby="quick-links" className="mt-10">
        <h2 id="quick-links" className="mb-4 text-lg font-semibold text-neutral-900">
          Quick links
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-900"
              >
                <span className="block text-sm font-medium text-neutral-900">{link.label}</span>
                <span className="mt-0.5 block text-xs text-neutral-500">{link.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
