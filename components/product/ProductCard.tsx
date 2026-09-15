import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { StarIcon } from "@/components/reviews/StarIcon";
import type { MerchBadge } from "@/lib/catalog/merchandising";
import { cn, formatPrice, percentOff } from "@/lib/utils";
import type { ProductCardData } from "@/types/product";

export type ProductCardProps = {
  product: ProductCardData;
  /** Pass `true` for above-the-fold cards to prioritise image loading. */
  priority?: boolean;
  /** `full` has Add to Cart and the discount; `compact` is the slimmer New Arrivals tile. */
  variant?: "full" | "compact";
  /** Merchandising ribbon on the image corner ("Best Seller", "Trending", "New"). */
  badge?: MerchBadge | null;
  className?: string;
};

const badgeTone: Record<MerchBadge["tone"], string> = {
  red: "bg-brand-red",
  green: "bg-emerald-600",
  blue: "bg-brand-blue",
};

/**
 * Server Component (no hooks; safe to render from Client Components too). The heart and the
 * Add to Cart button are the only client leaves.
 */
export function ProductCard({
  product,
  priority = false,
  variant = "full",
  badge = null,
  className,
}: ProductCardProps) {
  const href = `/products/${product.slug}`;
  const outOfStock = product.stock <= 0;
  const saving = percentOff(product.price, product.compareAtPrice);
  const rating = product.rating && product.rating.count > 0 ? product.rating : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-50">
        <Link href={href} aria-label={product.title} className="block h-full w-full">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              No image
            </div>
          )}
        </Link>

        {badge && (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white",
              badgeTone[badge.tone],
            )}
          >
            {badge.label}
          </span>
        )}
        {outOfStock && (
          <span className="absolute bottom-2 left-2 rounded-md bg-neutral-900/80 px-2 py-0.5 text-[10px] font-bold text-white">
            Sold out
          </span>
        )}
        <WishlistButton product={product} className="absolute top-2 right-2" />
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-[2.4rem] text-[13px] leading-5 font-medium text-neutral-800">
        <Link href={href} className="hover:text-brand-blue">
          {product.title}
        </Link>
      </h3>

      {rating && (
        <p className="mt-1 flex items-center gap-1 text-xs">
          <StarIcon className="text-brand-gold h-3.5 w-3.5" />
          <span className="font-semibold text-neutral-800">{rating.average.toFixed(1)}</span>
          <span className="text-neutral-400">({rating.count})</span>
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "text-brand-blue font-bold",
            variant === "full" ? "text-[15px]" : "text-sm",
          )}
        >
          {formatPrice(product.price)}
        </span>
        {variant === "full" && product.compareAtPrice !== null && saving > 0 && (
          <>
            <s className="text-xs text-neutral-400">{formatPrice(product.compareAtPrice)}</s>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
              {saving}% OFF
            </span>
          </>
        )}
      </div>

      {variant === "full" && (
        <div className="mt-3 flex items-center gap-2">
          <AddToCartButton product={product} size="sm" className="flex-1" />
          <WishlistButton product={product} variant="square" />
        </div>
      )}
    </article>
  );
}
