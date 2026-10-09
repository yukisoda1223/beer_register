import { describe, expect, it } from "vitest";
import { cleanQuickInput } from "./quick-input-schema";

const raw = {
  name: " Test Ale ",
  rating: 4.2,
  aroma: null,
  bitterness: 7,
  smoky: 3,
  sweet_dry: 3.6,
  aroma_level: 0,
  body: 4,
  served: "warm" as const,
  comment: "唐揚げと合う",
};

describe("cleanQuickInput", () => {
  it("★は0.5刻みで0.5〜5に収め、ビールでは他の種類の項目を null にする", () => {
    const r = cleanQuickInput("beer", raw);
    expect(r.name).toBe("Test Ale");
    expect(r.rating).toBe(4);
    expect(r.bitterness).toBe(5);
    expect(r).toMatchObject({ smoky: null, sweet_dry: null, aroma_level: null, body: null, served: null });
  });

  it("日本酒は甘辛・香りの強さ(1〜5の整数)と温度", () => {
    const r = cleanQuickInput("sake", raw);
    expect(r).toMatchObject({ sweet_dry: 4, aroma_level: 1, served: "warm", bitterness: null, body: null });
  });

  it("ウイスキーはボディ・スモーキー・飲み方(日本酒の温度は入らない)", () => {
    const r = cleanQuickInput("whisky", { ...raw, served: "rocks" });
    expect(r).toMatchObject({ body: 4, smoky: 3, served: "rocks", sweet_dry: null });
    expect(cleanQuickInput("whisky", raw).served).toBeNull();
  });

  it("ワインは甘辛とボディ、シードルは甘辛だけ", () => {
    expect(cleanQuickInput("wine", raw)).toMatchObject({ sweet_dry: 4, body: 4, served: null });
    expect(cleanQuickInput("cider", raw)).toMatchObject({ sweet_dry: 4, body: null });
  });

  it("空の文字は null", () => {
    expect(cleanQuickInput("beer", { ...raw, name: "  ", comment: "" }).name).toBeNull();
  });
});
