import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserAddress } from "@/lib/account/addresses";
import { updateAddress } from "@/app/account/addresses/actions";
import { AddressForm } from "@/components/account/AddressForm";
import { Card, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Edit address" };

type EditAddressPageProps = {
  params: Promise<{ id: string }>;
};

/** Server Component: loads the user's address (404 if not theirs) and binds the update action. */
export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/addresses");

  const { id } = await params;
  const address = await getUserAddress(session.user.id, id);
  if (!address) notFound();

  const action = updateAddress.bind(null, address.id);

  return (
    <>
      <PageHeader title="Edit address" description={address.fullName} />
      <Card className="max-w-2xl">
        <AddressForm action={action} initial={address} submitLabel="Save changes" />
      </Card>
    </>
  );
}
