import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_SETTINGS } from "@/lib/brand";
import { SITE_SETTING_FIELDS } from "@/lib/content/kinds";
import { settingsFromRows, settingsToRows, telHref } from "./settings";

describe("settingsFromRows", () => {
  it("returns the defaults when there are no rows", () => {
    expect(settingsFromRows([])).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it("overrides text and number settings from rows", () => {
    const settings = settingsFromRows([
      { key: "contact.phone", value: "+977-1-0000000" },
      { key: "store.yearsInBusiness", value: "30" },
    ]);
    expect(settings.phone).toBe("+977-1-0000000");
    expect(settings.yearsInBusiness).toBe(30);
    expect(settings.email).toBe(DEFAULT_SITE_SETTINGS.email);
  });

  it("ignores blank text, non-numeric or negative numbers and unknown keys", () => {
    const settings = settingsFromRows([
      { key: "contact.phone", value: "   " },
      { key: "store.yearsInBusiness", value: "twenty" },
      { key: "store.freeDeliveryThreshold", value: "-5" },
      { key: "something.else", value: "x" },
    ]);
    expect(settings).toEqual(DEFAULT_SITE_SETTINGS);
  });
});

describe("settingsToRows", () => {
  it("writes one row per setting field and round-trips", () => {
    const rows = settingsToRows({ ...DEFAULT_SITE_SETTINGS, yearsInBusiness: 27, phone: "123456" });
    expect(rows).toHaveLength(SITE_SETTING_FIELDS.length);
    expect(rows.find((row) => row.key === "store.yearsInBusiness")?.value).toBe("27");
    expect(settingsFromRows(rows)).toEqual({
      ...DEFAULT_SITE_SETTINGS,
      yearsInBusiness: 27,
      phone: "123456",
    });
  });
});

describe("telHref", () => {
  it("keeps a leading plus and strips everything but digits", () => {
    expect(telHref("+977-1-5912345")).toBe("tel:+97715912345");
    expect(telHref("01-5912345")).toBe("tel:015912345");
    expect(telHref("  +977 (1) 591 2345 ")).toBe("tel:+97715912345");
  });
});
