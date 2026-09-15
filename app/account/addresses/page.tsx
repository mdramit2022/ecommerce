import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listUserAddresses } from "@/lib/account/addresses";
import { AddressCard } from "@/components/account/AddressCard";
import { EmptyState, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Addresses" };

const addLinkClass =
  "inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700";

/** Server Component: the user's saved addresses with default / edit / delete controls. */
export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/addresses");

  const addresses = await listUserAddresses(session.user.id);

  return (
    <>
      <PageHeader
        title="Addresses"
        description="Saved shipping addresses. Your default is pre-selected at checkout."
        actions={
          <Link href="/account/addresses/new" className={addLinkClass}>
            Add address
          </Link>
        }
      />

      {addresses.length === 0 ? (
        <EmptyState
          title="No saved addresses"
          description="Add an address to speed up checkout."
          action={
            <Link href="/account/addresses/new" className={addLinkClass}>
              Add your first address
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id}>
              <AddressCard address={address} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
