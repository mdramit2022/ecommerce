import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createAddress } from "@/app/account/addresses/actions";
import { AddressForm } from "@/components/account/AddressForm";
import { Card, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Add address" };

/** Server Component: renders the client form bound to the create Server Action. */
export default async function NewAddressPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/addresses/new");

  return (
    <>
      <PageHeader title="Add address" description="Add a new shipping address to your account." />
      <Card className="max-w-2xl">
        <AddressForm action={createAddress} submitLabel="Add address" />
      </Card>
    </>
  );
}
