import { describe, expect, it } from "vitest";
import { geocodeQueries } from "./geocode";

describe("geocodeQueries", () => {
  it("所在地 → 地域, 国 → 国 の順に探す", () => {
    expect(geocodeQueries({ address: "Matsumoto, Nagano", region: "Nagano", country: "Japan" })).toEqual([
      "Matsumoto, Nagano",
      "Nagano, Japan",
      "Japan",
    ]);
  });
  it("所在地がなくても地域や国で探す", () => {
    expect(geocodeQueries({ address: null, region: "Ontario", country: "Canada" })).toEqual(["Ontario, Canada", "Canada"]);
    expect(geocodeQueries({ address: " ", region: null, country: "Italy" })).toEqual(["Italy"]);
  });
  it("何もなければ探さない", () => {
    expect(geocodeQueries({ address: null, region: null, country: null })).toEqual([]);
  });
});
