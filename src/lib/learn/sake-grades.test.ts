import { describe, expect, it } from "vitest";
import { SAKE_CATEGORIES, SAKE_CATEGORY_JA } from "@/lib/masters";
import { SAKE_GRADES, sakeGradeBySlug } from "./sake-grades";

describe("日本酒の特定名称", () => {
  it("記録の特定名称(Other 以外)がすべてそろい、日本語名も同じ", () => {
    expect(SAKE_GRADES.map((g) => g.name).sort()).toEqual(SAKE_CATEGORIES.filter((c) => c !== "Other").sort());
    for (const g of SAKE_GRADES) expect(g.ja).toBe(SAKE_CATEGORY_JA[g.name]);
  });
  it("slug は重ならない", () => {
    expect(new Set(SAKE_GRADES.map((g) => g.slug)).size).toBe(SAKE_GRADES.length);
    expect(sakeGradeBySlug("junmai-daiginjo")?.ja).toBe("純米大吟醸");
  });
  it("吟醸は60%以下、大吟醸は50%以下、本醸造は70%以下", () => {
    const by = (n: string) => SAKE_GRADES.find((g) => g.name === n)!;
    expect([by("Ginjo").polishFor, by("Daiginjo").polishFor, by("Honjozo").polishFor]).toEqual([60, 50, 70]);
  });
});
