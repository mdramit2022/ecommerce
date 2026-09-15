import { DEFAULT_SITE_SETTINGS } from "@/lib/brand";
import { SITE_SETTING_FIELDS, type SiteSettings } from "@/lib/content/kinds";

/**
 * Pure helpers between the `SiteSetting` key/value rows and the typed `SiteSettings` object.
 * Missing or malformed rows fall back to the defaults in lib/brand.ts, so the storefront never
 * renders an empty phone number because a row was deleted.
 */

export type SettingRow = { key: string; value: string };

export function settingsFromRows(rows: readonly SettingRow[]): SiteSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const settings: SiteSettings = { ...DEFAULT_SITE_SETTINGS };

  for (const field of SITE_SETTING_FIELDS) {
    const raw = byKey.get(field.key);
    if (raw === undefined) continue;
    if (field.type === "number") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        (settings as Record<keyof SiteSettings, string | number>)[field.prop] = parsed;
      }
    } else if (raw.trim().length > 0) {
      (settings as Record<keyof SiteSettings, string | number>)[field.prop] = raw;
    }
  }

  return settings;
}

export function settingsToRows(settings: SiteSettings): SettingRow[] {
  return SITE_SETTING_FIELDS.map((field) => ({
    key: field.key,
    value: String(settings[field.prop]),
  }));
}

/** "+977-1-5912345" -> "tel:+97715912345" (digits and a leading plus only). */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `tel:${plus}${trimmed.replace(/\D/g, "")}`;
}
