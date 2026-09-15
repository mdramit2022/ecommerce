import { Badge } from "@/components/ui/Badge";

export type StockStatusProps = {
  stock: number;
  /** Show "Only N left" at or below this level. */
  lowStockThreshold?: number;
};

/** Server Component: availability badge for the product detail page. */
export function StockStatus({ stock, lowStockThreshold = 5 }: StockStatusProps) {
  if (stock <= 0) return <Badge tone="danger">Out of stock</Badge>;
  if (stock <= lowStockThreshold) return <Badge tone="warning">Only {stock} left</Badge>;
  return <Badge tone="success">In stock</Badge>;
}
