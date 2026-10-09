import { describe, expect, it } from "vitest";
import { emptyFormValues } from "@/lib/drink-form";
import { applyCandidate } from "./apply-research";

const candidate = {
  name: "Test Mountain Pale Ale",
  maker: "Test Mountain Brewery",
  maker_address: "Matsumoto, Nagano",
  country: "Japan",
  region: "Nagano",
  category: "Pale Ale",
  abv: 5.5,
  price_yen: 380,
  price_note: null,
  sources: [],
};

describe("applyCandidate", () => {
  it("空の欄だけ埋め、自分で入れた欄は残す", () => {
    const values = { ...emptyFormValues("beer"), name: "Test Mtn", maker: "My own brewery" };
    const r = applyCandidate("beer", values, [], candidate);
    expect(r.values.maker).toBe("My own brewery");
    expect(r.values.name).toBe("Test Mtn");
    expect(r.values.abv).toBe("5.5");
    expect(r.values.category).toBe("Pale Ale");
    expect(r.aiFilled.sort()).toEqual(["abv", "category", "country", "maker_address", "price_yen", "region"]);
  });

  it("調べ直すと、前に AI が入れた欄は新しい結果で書き換わる", () => {
    const first = applyCandidate("beer", { ...emptyFormValues("beer"), name: "x" }, [], candidate);
    const second = applyCandidate("beer", first.values, first.aiFilled, {
      ...candidate,
      maker: "Another Brewery",
      category: "IPA",
      abv: 6.5,
      region: null,
    });
    expect(second.values.maker).toBe("Another Brewery");
    expect(second.values.category).toBe("IPA");
    expect(second.values.abv).toBe("6.5");
    expect(second.values.region).toBe("");
    expect(second.aiFilled).not.toContain("region");
  });

  it("null の項目は入れない", () => {
    const r = applyCandidate("beer", emptyFormValues("beer"), [], candidate);
    expect(r.values.price_note).toBe("");
    expect(r.aiFilled).not.toContain("price_note");
  });

  it("日本酒の項目も埋める(国は初期値の Japan のまま)", () => {
    const sake = { ...candidate, category: "Junmai Ginjo", polish_ratio: 55, sake_meter: -2, acidity: 1.4, rice: "Yamada Nishiki" };
    const r = applyCandidate("sake", { ...emptyFormValues("sake"), name: "x" }, ["maker"], sake);
    expect(r.values.sake_meter).toBe("-2");
    expect(r.values.rice).toBe("Yamada Nishiki");
    expect(r.aiFilled).toContain("polish_ratio");
    expect(r.aiFilled).not.toContain("country");
  });
});
