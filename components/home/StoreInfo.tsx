import { ClockIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "@/components/ui/Icon";
import { CONTACT } from "@/lib/brand";

/** Server Component. Where the shop is and how to call it. */
export function StoreInfo() {
  return (
    <div className="grid h-full gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <div className="flex gap-3">
        <span className="bg-brand-blue-light text-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <MapPinIcon className="h-5 w-5" />
        </span>
        <div className="text-sm">
          <h3 className="font-semibold text-neutral-900">Visit Our Store</h3>
          <p className="mt-0.5 text-neutral-600">{CONTACT.addressLine}</p>
          <a
            href={CONTACT.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-blue mt-1.5 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            <NavigationIcon className="h-3.5 w-3.5" />
            Get Directions
          </a>
        </div>
      </div>

      <div className="flex gap-3">
        <span className="bg-brand-blue-light text-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
          <PhoneIcon className="h-5 w-5" />
        </span>
        <div className="text-sm">
          <h3 className="font-semibold text-neutral-900">Need Help? Call Us</h3>
          <a
            href={CONTACT.phoneHref}
            className="hover:text-brand-blue mt-0.5 block text-neutral-700"
          >
            {CONTACT.phone}
          </a>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-neutral-500">
            <ClockIcon className="h-3.5 w-3.5" />
            {CONTACT.hours}
          </p>
        </div>
      </div>
    </div>
  );
}
