import { describe, expect, it } from "vitest";
import { cleanResearchResult, researchToolSchema } from "./research-schema";

const beer = {
  name: "テスト山ペールエール",
  maker: "テスト山ブルワリー",
  maker_address: "長野県松本市",
  country: "日本",
  prefecture: "長野県",
  category: "ペールエール",
  abv: 5.5,
  price_yen: 380.4,
  price_note: "350ml缶",
  sources: [{ title: "公式", url: "https://example.com" }, { title: "変", url: "javascript:alert(1)" }],
};

describe("cleanResearchResult", () => {
  it("形が正しければ整えて返す", () => {
    const r = cleanResearchResult("beer", { candidates: [beer], note: null })!;
    expect(r.candidates[0].price_yen).toBe(380);
    expect(r.candidates[0].sources).toEqual([{ title: "公式", url: "https://example.com" }]);
  });

  it("マスタにないカテゴリは「その他」、知らない都道府県は null", () => {
    const r = cleanResearchResult("beer", { candidates: [{ ...beer, category: "ミルクスタウト", prefecture: "長野" }], note: null })!;
    expect(r.candidates[0].category).toBe("その他");
    expect(r.candidates[0].prefecture).toBeNull();
  });

  it("候補は最大3つ", () => {
    const r = cleanResearchResult("beer", { candidates: [beer, beer, beer, beer], note: "多い" })!;
    expect(r.candidates).toHaveLength(3);
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
