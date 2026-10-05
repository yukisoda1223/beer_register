import { describe, expect, it } from "vitest";
import { formatDateLong, formatDateShort, iconTypeOf, originLabel } from "./drink";

describe("originLabel", () => {
  it("都道府県があれば都道府県を出す", () => {
    expect(originLabel({ country: "日本", prefecture: "新潟県" })).toBe("新潟県");
  });
  it("海外は国名を出す", () => {
    expect(originLabel({ country: "ベルギー", prefecture: null })).toBe("ベルギー");
  });
  it("どちらも無ければ null", () => {
    expect(originLabel({ country: null, prefecture: null })).toBeNull();
    expect(originLabel({ country: "", prefecture: "" })).toBeNull();
  });
});

describe("iconTypeOf", () => {
  it("日本酒は徳利、ビールは系統ごと、系統なしは缶", () => {
    expect(iconTypeOf({ kind: "sake", beer_family: null })).toBe("sake");
    expect(iconTypeOf({ kind: "beer", beer_family: "ale" })).toBe("ale");
    expect(iconTypeOf({ kind: "beer", beer_family: null })).toBe("other");
  });
});

describe("日付の表示", () => {
  it("年月日と月/日に整える", () => {
    expect(formatDateLong("2026-09-08")).toBe("2026年9月8日");
    expect(formatDateShort("2026-09-08")).toBe("9/8");
  });
});
