import { describe, expect, it } from "vitest";
import { cleanQuickInput } from "./quick-input-schema";

const raw = {
  name: " Test Ale ",
  rating: 4.2,
  bitterness: 7,
  smoky: 1.2,
  sweet_dry: 1.6,
  aroma_level: -0.7,
  body: -3,
  served: "warm" as const,
  comment: "唐揚げと合う",
};

describe("cleanQuickInput", () => {
  it("総合は★0.5刻み、味は −2.5〜+2.5 の 0.5 刻みに収め、ビールでは他の種類の項目を null にする", () => {
    const r = cleanQuickInput("beer", raw);
    expect(r.name).toBe("Test Ale");
    expect(r.rating).toBe(4);
    expect(r).toMatchObject({ bitterness: 2.5, aroma_level: -0.5 });
    expect(r).toMatchObject({ smoky: null, sweet_dry: null, body: null, served: null });
  });

  it("日本酒は甘辛・香りの強さと温度", () => {
    const r = cleanQuickInput("sake", raw);
    expect(r).toMatchObject({ sweet_dry: 1.5, aroma_level: -0.5, served: "warm", bitterness: null, body: null });
  });

  it("ウイスキーはボディ・スモーキー・飲み方(日本酒の温度は入らない)", () => {
    const r = cleanQuickInput("whisky", { ...raw, served: "rocks" });
    expect(r).toMatchObject({ body: -2.5, smoky: 1, served: "rocks", sweet_dry: null });
    expect(cleanQuickInput("whisky", raw).served).toBeNull();
  });

  it("ワインは甘辛とボディ、シードルは甘辛だけ", () => {
    expect(cleanQuickInput("wine", raw)).toMatchObject({ sweet_dry: 1.5, body: -2.5, served: null });
    expect(cleanQuickInput("cider", raw)).toMatchObject({ sweet_dry: 1.5, body: null });
  });

  it("空の文字は null", () => {
    expect(cleanQuickInput("beer", { ...raw, name: "  ", comment: "" }).name).toBeNull();
  });
});
