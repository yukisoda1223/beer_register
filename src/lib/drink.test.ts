import { describe, expect, it } from "vitest";
import { formatDateLong, formatDateShort, iconOf, originLabel } from "./drink";

describe("originLabel", () => {
  it("地域と国をつなげる", () => {
    expect(originLabel({ region: "Ontario", country: "Canada" })).toBe("Ontario, Canada");
    expect(originLabel({ region: "Nagano", country: "Japan" })).toBe("Nagano, Japan");
  });
  it("片方だけでも出す。どちらも無ければ null", () => {
    expect(originLabel({ region: null, country: "Italy" })).toBe("Italy");
    expect(originLabel({ region: null, country: "" })).toBeNull();
  });
});

describe("iconOf", () => {
  it("日本酒は徳利、ビールは系統の形とスタイルの色、系統なしは缶", () => {
    expect(iconOf({ kind: "sake", beer_family: null, category: null }).type).toBe("sake");
    expect(iconOf({ kind: "beer", beer_family: "ale", category: "Stout" })).toEqual({ type: "ale", color: "#1E1410" });
    expect(iconOf({ kind: "beer", beer_family: null, category: null }).type).toBe("other");
  });
});

describe("日付の表示", () => {
  it("年月日と月/日に整える", () => {
    expect(formatDateLong("2026-09-08")).toBe("Sep 8, 2026");
    expect(formatDateShort("2026-09-08")).toBe("9/8");
  });
});
