import Image from "next/image";
import { Stars } from "@/components/reviews/Stars";
import { HAPPY_CUSTOMER_AVATARS } from "@/lib/brand";
import { pluralizeReviews } from "@/lib/reviews/format";
import type { ProductRating } from "@/types/product";

export type HappyCustomersProps = {
  /** Store-wide review aggregate (real figures, not marketing copy). */
  reviews: ProductRating;
};

/** Server Component. Avatar stack plus the store's real average rating and review count. */
export function HappyCustomers({ reviews }: HappyCustomersProps) {
  const rated = reviews.count > 0;

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900">Our Happy Customers</h3>

      <div className="mt-4 flex items-center gap-4">
        <ul className="flex -space-x-3">
          {HAPPY_CUSTOMER_AVATARS.map((avatar, index) => (
            <li
              key={avatar}
              className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white"
              style={{ zIndex: HAPPY_CUSTOMER_AVATARS.length - index }} // stack order
            >
              <Image src={avatar} alt="" fill sizes="40px" className="object-cover" />
            </li>
          ))}
        </ul>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-neutral-900">
            {rated ? reviews.average.toFixed(1) : "-"}
            <span className="text-base font-semibold text-neutral-400">/5</span>
          </p>
          <p className="text-xs text-neutral-500">
            {rated ? `Based on ${pluralizeReviews(reviews.count)}` : "No reviews yet"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Stars rating={reviews.average} size="sm" />
      </div>
    </div>
  );
}
