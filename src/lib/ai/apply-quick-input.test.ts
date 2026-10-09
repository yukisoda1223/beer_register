import { describe, expect, it } from "vitest";
import { emptyFormValues } from "@/lib/drink-form";
import { applyQuickInput } from "./apply-quick-input";

const input = {
  name: "テスト山エール",
  rating: 4,
  bitterness: 4,
  aroma: null,
  sweet_dry: null,
  light_rich: null,
  serving_temp: null,
  comment: "唐揚げと合う",
};

describe("applyQuickInput", () => {
  it("空のフォームに名前・★・苦み・コメントを入れる", () => {
    const r = applyQuickInput(emptyFormValues("beer"), [], input);
    expect(r.values.name).toBe("テスト山エール");
    expect(r.values.rating).toBe(4);
    expect(r.values.bitterness).toBe(4);
    expect(r.values.aroma).toBeNull();
    expect(r.values.comment).toBe("唐揚げと合う");
    expect(r.aiFilled.sort()).toEqual(["bitterness", "comment", "name", "rating"]);
  });

  it("入力済みの名前・★は上書きせず、コメントは後ろに足す", () => {
    const values = { ...emptyFormValues("beer"), name: "自分の名前", rating: 3, comment: "泡がきれい" };
    const r = applyQuickInput(values, [], input);
    expect(r.values.name).toBe("自分の名前");
    expect(r.values.rating).toBe(3);
    expect(r.values.comment).toBe("泡がきれい\n唐揚げと合う");
    expect(r.aiFilled).not.toContain("rating");
  });
});
