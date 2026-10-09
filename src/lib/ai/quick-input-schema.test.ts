import { describe, expect, it } from "vitest";
import { cleanQuickInput } from "./quick-input-schema";

const raw = {
  name: " テスト山エール ",
  rating: 4.2,
  bitterness: 7,
  aroma: null,
  sweet_dry: 3.6,
  light_rich: 0,
  serving_temp: "warm" as const,
  comment: "唐揚げと合う",
};

describe("cleanQuickInput", () => {
  it("★は0.5刻みで0.5〜5に収める", () => {
    const r = cleanQuickInput("beer", raw);
    expect(r.name).toBe("テスト山エール");
    expect(r.rating).toBe(4);
    expect(r.bitterness).toBe(5);
  });

  it("ビールでは日本酒の項目を null にする", () => {
    const r = cleanQuickInput("beer", raw);
    expect(r.sweet_dry).toBeNull();
    expect(r.serving_temp).toBeNull();
  });

  it("日本酒は甘辛・濃淡を1〜5の整数にし、苦みは null", () => {
    const r = cleanQuickInput("sake", raw);
    expect(r.sweet_dry).toBe(4);
    expect(r.light_rich).toBe(1);
    expect(r.serving_temp).toBe("warm");
    expect(r.bitterness).toBeNull();
  });

  it("空の文字は null", () => {
    expect(cleanQuickInput("beer", { ...raw, name: "  ", comment: "" }).name).toBeNull();
  });
});
