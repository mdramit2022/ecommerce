import type { ComponentType } from "react";
import {
  AwardIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarOutlineIcon,
  TagIcon,
  TiktokIcon,
  TruckIcon,
  YoutubeIcon,
  type IconProps,
} from "@/components/ui/Icon";

/** Icon component per content icon key / social network key (lib/content/kinds.ts). */
const ICONS: Record<string, ComponentType<IconProps>> = {
  truck: TruckIcon,
  shield: ShieldCheckIcon,
  cash: BanknoteIcon,
  award: AwardIcon,
  package: PackageIcon,
  "badge-check": BadgeCheckIcon,
  lock: LockIcon,
  clock: ClockIcon,
  phone: PhoneIcon,
  tag: TagIcon,
  sparkles: SparklesIcon,
  star: StarOutlineIcon,
  "map-pin": MapPinIcon,
  mail: MailIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

export type ContentIconProps = IconProps & { icon: string | null | undefined };

/** Server-safe icon for an admin-chosen key; unknown keys fall back to a tag. */
export function ContentIcon({ icon, ...props }: ContentIconProps) {
  const Icon = ICONS[icon ?? ""] ?? TagIcon;
  return <Icon {...props} />;
}
