import { describe, expect, it } from "vitest";
import { emptyFormValues } from "@/lib/drink-form";
import { applyCandidate } from "./apply-research";

const candidate = {
  name: "テスト山ペールエール(正式)",
  maker: "テスト山ブルワリー",
  maker_address: "長野県松本市",
  country: "日本",
  prefecture: "長野県",
  category: "ペールエール",
  abv: 5.5,
  price_yen: 380,
  price_note: null,
  sources: [],
};

describe("applyCandidate", () => {
  it("空の欄だけ埋め、埋めた項目を覚える", () => {
    const values = { ...emptyFormValues("beer"), name: "テスト山", maker: "自分で入れた醸造所" };
    const r = applyCandidate("beer", values, [], candidate);
    expect(r.values.maker).toBe("自分で入れた醸造所");
    expect(r.values.name).toBe("テスト山");
    expect(r.values.abv).toBe("5.5");
    expect(r.values.category).toBe("ペールエール");
    expect(r.aiFilled.sort()).toEqual(["abv", "category", "country", "maker_address", "prefecture", "price_yen"]);
  });

  it("null の項目は入れない", () => {
    const r = applyCandidate("beer", emptyFormValues("beer"), [], candidate);
    expect(r.values.price_note).toBe("");
    expect(r.aiFilled).not.toContain("price_note");
  });

  it("日本酒の項目も埋める(国は初期値の「日本」のまま)", () => {
    const sake = { ...candidate, country: "日本", category: "純米吟醸", polish_ratio: 55, sake_meter: -2, acidity: 1.4, rice: "山田錦" };
    const r = applyCandidate("sake", { ...emptyFormValues("sake"), name: "x" }, ["maker"], sake);
    expect(r.values.sake_meter).toBe("-2");
    expect(r.values.rice).toBe("山田錦");
    expect(r.aiFilled).toContain("polish_ratio");
    expect(r.aiFilled).not.toContain("country");
    expect(r.aiFilled).toContain("maker");
  });
});
