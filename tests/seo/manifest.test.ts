import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest()", () => {
  it("describes an installable storefront", () => {
    const result = manifest();

    expect(result).toMatchObject({
      name: "Laxmi Plastic Stores",
      short_name: "Laxmi",
      start_url: "/",
      scope: "/",
      display: "standalone",
      lang: "en",
    });
    expect(result.description).toBeTruthy();
  });

  it("uses valid hex colours", () => {
    const result = manifest();
    expect(result.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is plain JSON", () => {
    const result = manifest();
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});
