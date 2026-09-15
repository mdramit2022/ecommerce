import type { ComponentType } from "react";
import {
  BottleIcon,
  BroomIcon,
  CupIcon,
  LayersIcon,
  PlugIcon,
  PotIcon,
  RackIcon,
  SparklesIcon,
  StarOutlineIcon,
  StoveIcon,
  TagIcon,
  UtensilsIcon,
  type IconProps,
} from "@/components/ui/Icon";

/** Glyph per category slug; unknown slugs fall back to a tag. */
const CATEGORY_ICONS: Record<string, ComponentType<IconProps>> = {
  cookware: PotIcon,
  kitchenware: UtensilsIcon,
  "plastic-products": BottleIcon,
  "stainless-steel": LayersIcon,
  "glass-ceramic": CupIcon,
  "gas-stove": StoveIcon,
  appliances: PlugIcon,
  "racks-storage": RackIcon,
  household: BroomIcon,
  // Merchandising entries that sit under the categories in the menu.
  "new-arrivals": SparklesIcon,
  "best-sellers": StarOutlineIcon,
  offers: TagIcon,
};

export type CategoryIconProps = IconProps & { slug: string };

/** Server-safe icon for a category (or merchandising) slug. */
export function CategoryIcon({ slug, ...props }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[slug] ?? TagIcon;
  return <Icon {...props} />;
}
