import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AddressCardActions } from "@/components/account/AddressCardActions";
import type { AddressData } from "@/lib/account/addresses";

export type AddressCardProps = {
  address: AddressData;
};

/** Server Component: one saved address; only the action buttons are client-side. */
export function AddressCard({ address }: AddressCardProps) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-neutral-900">{address.fullName}</p>
        {address.isDefault && <Badge tone="success">Default</Badge>}
      </div>
      <address className="mt-2 text-sm leading-6 text-neutral-600 not-italic">
        {address.line1}
        <br />
        {address.line2 && (
          <>
            {address.line2}
            <br />
          </>
        )}
        {address.city}
        {address.state ? `, ${address.state}` : ""} {address.postalCode}
        <br />
        {address.country}
        {address.phone && (
          <>
            <br />
            {address.phone}
          </>
        )}
      </address>
      <AddressCardActions id={address.id} isDefault={address.isDefault} />
    </Card>
  );
}
