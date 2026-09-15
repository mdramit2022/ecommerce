import { ProductCard, type ProductCardProps } from "@/components/product/ProductCard";
import type { HomeProduct } from "@/lib/catalog/home";
import { cn } from "@/lib/utils";

export type ProductStripProps = {
  products: HomeProduct[];
  variant?: ProductCardProps["variant"];
  /** Prioritise the images (above-the-fold strip). */
  priority?: boolean;
  className?: string;
};

/**
 * Server Component. Five cards across on desktop; two across on phones, where the fifth card is
 * hidden so the grid stays even (the reference design shows four).
 */
export function ProductStrip({
  products,
  variant = "full",
  priority = false,
  className,
}: ProductStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5",
        "[&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+5)]:flex",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={variant}
          badge={product.badge}
          priority={priority && index < 4}
        />
      ))}
    </div>
  );
}
