import { describe, expect, it } from "vitest";
import { BEER_CATEGORIES } from "@/lib/masters";
import { BEER_STYLES, BEER_TREE, beerStyleBySlug, treePathOf } from "./beer-styles";

describe("ビールのスタイル図鑑", () => {
  it("記録のスタイル(Other 以外)がすべて図鑑にある", () => {
    const names = BEER_CATEGORIES.map((c) => c.label).filter((n) => n !== "Other");
    expect(BEER_STYLES.map((s) => s.name).sort()).toEqual(names.sort());
  });
  it("slug は重ならず、URL に使える文字だけ", () => {
    const slugs = BEER_STYLES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
    expect(beerStyleBySlug("pale-ale")?.name).toBe("Pale Ale");
  });
  it("系統樹にどのスタイルもちょうど1回ずつ出てくる", () => {
    const inTree = BEER_TREE.flatMap((f) => f.groups.flatMap((g) => g.styles));
    expect(inTree.sort()).toEqual(BEER_STYLES.map((s) => s.name).sort());
    expect(treePathOf("Stout")?.family.key).toBe("ale");
  });
  it("範囲は小さい順", () => {
    for (const s of BEER_STYLES) for (const r of [s.abv, s.ibu, s.srm]) if (r) expect(r[0]).toBeLessThanOrEqual(r[1]);
  });
});
