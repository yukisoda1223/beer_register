import { describe, expect, it } from "vitest";
import { geocodeQueries } from "./geocode";

describe("geocodeQueries", () => {
  it("住所 → 都道府県の順に探す", () => {
    expect(geocodeQueries({ address: "新潟県長岡市", prefecture: "新潟県", country: "日本" })).toEqual([
      "新潟県長岡市",
      "新潟県 日本",
    ]);
  });
  it("海外は住所 → 国", () => {
    expect(geocodeQueries({ address: "Brussels", prefecture: null, country: "ベルギー" })).toEqual(["Brussels", "ベルギー"]);
  });
  it("住所がなくても都道府県や国で探す", () => {
    expect(geocodeQueries({ address: null, prefecture: "長野県", country: "日本" })).toEqual(["長野県 日本"]);
    expect(geocodeQueries({ address: " ", prefecture: null, country: "日本" })).toEqual(["日本"]);
  });
  it("何もなければ探さない", () => {
    expect(geocodeQueries({ address: null, prefecture: null, country: null })).toEqual([]);
  });
});
