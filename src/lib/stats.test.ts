import { describe, expect, it } from "vitest";
import {
  categoryBreakdown,
  countDrinks,
  favoritesTop5,
  heatLevel,
  monthCalendar,
  monthsBefore,
  summaryInput,
  type StatRecord,
} from "./stats";

let n = 0;
function rec(o: Partial<StatRecord>): StatRecord {
  n++;
  return {
    id: `t${n}`,
    product_id: `p${n}`,
    status: "saved",
    drunk_on: "2026-10-01",
    name: `Drink ${n}`,
    category: "IPA",
    beer_family: "ale",
    kind: "beer",
    rating: 3,
    image_path: null,
    region: null,
    country: "Japan",
    sweet_dry: null,
    aroma_level: null,
    body: null,
    smoky: null,
    served: null,
    peat: null,
    created_at: `2026-10-01T00:00:${String(n).padStart(2, "0")}Z`,
    ...o,
  };
}

describe("countDrinks", () => {
  it("同じ銘柄は1つと数え、下書きは数えない", () => {
    const rs = [rec({ product_id: "a" }), rec({ product_id: "a" }), rec({ product_id: "b" }), rec({ status: "draft" })];
    expect(countDrinks(rs)).toEqual({ unique: 2, total: 3 });
  });
});

describe("monthsBefore", () => {
  it("n か月前。月末は丸める", () => {
    expect(monthsBefore("2026-10-09", 6)).toBe("2026-04-09");
    expect(monthsBefore("2026-08-31", 6)).toBe("2026-02-28");
    expect(monthsBefore("2026-01-15", 1)).toBe("2025-12-15");
  });
});

describe("favoritesTop5", () => {
  it("過去6か月・評価順→新しい順・同じ銘柄は一番よかった1回だけ・5件まで", () => {
    const rs = [
      rec({ product_id: "a", rating: 4, drunk_on: "2026-09-01" }),
      rec({ product_id: "a", rating: 5, drunk_on: "2026-08-01", name: "A best" }),
      rec({ product_id: "b", rating: 5, drunk_on: "2026-09-15" }),
      rec({ product_id: "c", rating: 4.5 }),
      rec({ product_id: "d", rating: 5, drunk_on: "2026-03-01" }), // 6か月より前
      rec({ product_id: "e", rating: 4 }),
      rec({ product_id: "f", rating: 3 }),
      rec({ product_id: "g", rating: 2 }),
      rec({ product_id: "h", rating: 5, status: "draft" }),
    ];
    const top = favoritesTop5(rs, "2026-10-09");
    expect(top.map((r) => r.product_id)).toEqual(["b", "a", "c", "e", "f"]);
    expect(top[1].name).toBe("A best");
  });
});

describe("categoryBreakdown", () => {
  it("銘柄ごとに数え、上位5つ + Other にまとめる", () => {
    const cats = ["IPA", "IPA", "IPA", "Lager", "Lager", "Stout", "Pilsner", "Weizen", "Porter", "Saison"];
    const rs = cats.map((c) => rec({ category: c }));
    rs.push(rec({ product_id: rs[0].product_id, category: "IPA" })); // 同じ銘柄の2回目
    const { total, items } = categoryBreakdown(rs);
    expect(total).toBe(10);
    expect(items[0]).toEqual({ label: "IPA", count: 3 });
    expect(items.at(-1)).toEqual({ label: "Other", count: 2 });
    expect(items).toHaveLength(6);
  });
});

describe("monthCalendar", () => {
  it("日曜はじまりの空きマスと、日ごとの回数", () => {
    const rs = [rec({ drunk_on: "2026-10-01" }), rec({ drunk_on: "2026-10-01" }), rec({ drunk_on: "2026-10-09" }), rec({ drunk_on: "2026-09-30" })];
    const cal = monthCalendar(rs, 2026, 10);
    expect(cal.offset).toBe(4); // 2026-10-01 は木曜
    expect(cal.days).toHaveLength(31);
    expect(cal.days[0]).toBe(2);
    expect(cal.days[8]).toBe(1);
    expect(cal.total).toBe(3);
  });
  it("濃さは 0〜3", () => {
    expect([0, 1, 2, 3, 7].map(heatLevel)).toEqual([0, 1, 2, 3, 3]);
  });
});

describe("summaryInput", () => {
  it("件数・スタイル別の平均・直近12か月・系統を出す", () => {
    const rs = [rec({ category: "IPA", rating: 5 }), rec({ category: "IPA", rating: 4 }), rec({ category: "Lager", beer_family: "lager", rating: 3, drunk_on: "2026-07-10" })];
    const s = summaryInput("beer", rs, "2026-10-09") as Record<string, unknown>;
    expect(s.total_tastings).toBe(3);
    expect(s.categories).toEqual([
      { category: "IPA", tastings: 2, avg_rating: 4.5 },
      { category: "Lager", tastings: 1, avg_rating: 3 },
    ]);
    expect((s.last_12_months as { month: string }[]).at(-1)).toEqual({ month: "2026-10", tastings: 2, top_category: "IPA" });
    expect(s.families).toEqual({ ale: 2, lager: 1 });
  });
  it("日本酒は甘辛・香りの強さの平均と温度別の平均★", () => {
    const rs = [
      rec({ kind: "sake", sweet_dry: 4, aroma_level: 2, served: "cold", rating: 5 }),
      rec({ kind: "sake", sweet_dry: 3, aroma_level: 3, served: "cold", rating: 4 }),
    ];
    const s = summaryInput("sake", rs, "2026-10-09") as Record<string, unknown>;
    expect(s.avg_sweet_dry).toBe(3.5);
    expect(s.avg_aroma_intensity).toBe(2.5);
    expect((s.avg_rating_by_served as Record<string, number | null>).cold).toBe(4.5);
  });
  it("ウイスキーはボディとスモーキーの平均", () => {
    const rs = [rec({ kind: "whisky", body: 4, smoky: 5 }), rec({ kind: "whisky", body: 2, smoky: 3 })];
    const s = summaryInput("whisky", rs, "2026-10-09") as Record<string, unknown>;
    expect(s).toMatchObject({ avg_body: 3, avg_smoky: 4 });
  });
});
