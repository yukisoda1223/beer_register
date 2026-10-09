import { describe, expect, it } from "vitest";
import { cleanResearchResult, researchToolSchema } from "./research-schema";

const beer = {
  name: "Test Mountain Pale Ale",
  maker: "Test Mountain Brewery",
  maker_address: "Matsumoto, Nagano",
  country: "Japan",
  region: "nagano",
  category: "Pale Ale",
  abv: 5.5,
  price_yen: 380.4,
  price_note: "350ml can",
  sources: [{ title: "Official", url: "https://example.com" }, { title: "bad", url: "javascript:alert(1)" }],
};

describe("cleanResearchResult", () => {
  it("形が正しければ整えて返す(日本の地域は一覧の書き方にそろえる)", () => {
    const r = cleanResearchResult("beer", { candidates: [beer], note: null })!;
    expect(r.candidates[0].price_yen).toBe(380);
    expect(r.candidates[0].region).toBe("Nagano");
    expect(r.candidates[0].sources).toEqual([{ title: "Official", url: "https://example.com" }]);
  });

  it("マスタにないスタイルは Other、日本で一覧にない地域は null、海外の地域はそのまま", () => {
    const r = cleanResearchResult("beer", {
      candidates: [
        { ...beer, category: "Milk Stout", region: "Shinshu" },
        { ...beer, country: "Canada", region: "Ontario" },
      ],
      note: null,
    })!;
    expect(r.candidates[0].category).toBe("Other");
    expect(r.candidates[0].region).toBeNull();
    expect(r.candidates[1].region).toBe("Ontario");
  });

  it("候補は最大5つ", () => {
    const r = cleanResearchResult("beer", { candidates: Array(7).fill(beer), note: "many" })!;
    expect(r.candidates).toHaveLength(5);
  });

  it("形が違えば null(やり直しの合図)", () => {
    expect(cleanResearchResult("beer", { candidates: [{ name: "x" }], note: null })).toBeNull();
    expect(cleanResearchResult("sake", { candidates: [beer], note: null })).toBeNull();
  });
});

describe("researchToolSchema", () => {
  it("日本酒だけ精米歩合などが入り、全項目が required", () => {
    const beerItems = researchToolSchema("beer").properties.candidates.items;
    const sakeItems = researchToolSchema("sake").properties.candidates.items;
    expect(Object.keys(sakeItems.properties)).toContain("polish_ratio");
    expect(Object.keys(beerItems.properties)).not.toContain("polish_ratio");
    expect(sakeItems.required).toEqual(Object.keys(sakeItems.properties));
  });
});
