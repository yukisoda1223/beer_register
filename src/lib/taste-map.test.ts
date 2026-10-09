import { describe, expect, it } from "vitest";
import { JAPAN_TILES, prefectureCounts, prefectureLevel } from "./prefectures";
import { PREFECTURES } from "./masters";
import type { StatRecord } from "./stats";
import { TASTE_AXES, distribution, preferenceGrid, preferenceSentence, tastePoints } from "./taste-map";

let n = 0;
function rec(o: Partial<StatRecord>): StatRecord {
  n++;
  return {
    id: `t${n}`, product_id: `p${n}`, status: "saved", drunk_on: "2026-10-01", name: `Drink ${n}`, category: null,
    beer_family: null, kind: "sake", rating: 3, image_path: null, region: null, country: "Japan",
    sweet_dry: null, aroma_level: null, body: null, smoky: null, served: null, peat: null, cask: null,
    created_at: `2026-10-01T00:00:${String(n).padStart(2, "0")}Z`, ...o,
  };
}
const x = TASTE_AXES.sake!.x;
const y = TASTE_AXES.sake!.y!;

describe("tastePoints", () => {
  it("同じ銘柄は平均して1点、軸が空の記録と下書きは使わない", () => {
    const pts = tastePoints(
      [
        rec({ product_id: "a", sweet_dry: 4, aroma_level: 2, rating: 4, drunk_on: "2026-09-01" }),
        rec({ product_id: "a", sweet_dry: 5, aroma_level: 3, rating: 5, drunk_on: "2026-10-02", id: "latest" }),
        rec({ product_id: "b", sweet_dry: 2, aroma_level: null }),
        rec({ product_id: "c", sweet_dry: 2, aroma_level: 2, status: "draft" }),
      ],
      x,
      y,
    );
    expect(pts).toEqual([{ productId: "a", tastingId: "latest", name: expect.any(String), x: 4.5, y: 2.5, rating: 4.5, count: 2 }]);
  });
});

describe("preferenceGrid", () => {
  it("評価の高い銘柄の近くが一番濃く、★3以下だけなら塗らない", () => {
    const pts = tastePoints([rec({ sweet_dry: 5, aroma_level: 5, rating: 5 }), rec({ sweet_dry: 1, aroma_level: 1, rating: 2 })], x, y);
    const g = preferenceGrid(pts, x, y, 10);
    expect(g[0][9]).toBe(Math.max(...g.flat())); // 右上(辛口・華やか)が一番濃い
    expect(g[0][9]).toBeGreaterThan(0.9);
    expect(g[9][0]).toBe(0); // 左下(★2の近く)
    const none = preferenceGrid(tastePoints([rec({ sweet_dry: 3, aroma_level: 3, rating: 3 })], x, y), x, y, 10);
    expect(none.flat().every((v) => v === 0)).toBe(true);
  });
});

describe("preferenceSentence", () => {
  it("★4以上が2つ未満なら案内を出す", () => {
    const pts = tastePoints([rec({ sweet_dry: 5, aroma_level: 5, rating: 5 })], x, y);
    expect(preferenceSentence("sake", pts, x, y)).toContain("2つ以上");
  });
  it("好きな銘柄の中心から一文を作る", () => {
    const pts = tastePoints([rec({ sweet_dry: 5, aroma_level: 4, rating: 5 }), rec({ sweet_dry: 4, aroma_level: 5, rating: 4.5 }), rec({ sweet_dry: 1, aroma_level: 1, rating: 2 })], x, y);
    expect(preferenceSentence("sake", pts, x, y)).toBe("辛口で香りが華やかな日本酒がお好きなようです。");
  });
  it("片方が真ん中ならもう片方だけ、両方真ん中ならバランス", () => {
    const w = TASTE_AXES.wine!;
    const one = tastePoints([rec({ sweet_dry: 3, body: 5, rating: 5 }), rec({ sweet_dry: 3, body: 4, rating: 4 })], w.x, w.y);
    expect(preferenceSentence("wine", one, w.x, w.y)).toBe("フルボディのワインがお好きなようです。");
    const mid = tastePoints([rec({ sweet_dry: 3, body: 3, rating: 5 }), rec({ sweet_dry: 3, body: 3, rating: 4 })], w.x, w.y);
    expect(preferenceSentence("wine", mid, w.x, w.y)).toContain("バランス");
  });
  it("シードルは横軸だけ", () => {
    const c = TASTE_AXES.cider!;
    const pts = tastePoints([rec({ sweet_dry: 1, rating: 4 }), rec({ sweet_dry: 2, rating: 5 })], c.x);
    expect(preferenceSentence("cider", pts, c.x)).toBe("甘口のシードルがお好きなようです。");
    expect(distribution(pts).map((d) => d.count)).toEqual([1, 1, 0, 0, 0]);
  });
});

describe("prefectures", () => {
  it("47マスで、位置が重ならない", () => {
    expect(JAPAN_TILES.map((t) => t.name).sort()).toEqual([...PREFECTURES].sort());
    expect(new Set(JAPAN_TILES.map((t) => `${t.c},${t.r}`)).size).toBe(47);
  });
  it("都道府県ごとの銘柄数(同じ銘柄は1つ、海外と下書きは数えない)", () => {
    const { counts, covered } = prefectureCounts([
      rec({ product_id: "a", region: "Niigata" }),
      rec({ product_id: "a", region: "Niigata" }),
      rec({ product_id: "b", region: "Niigata" }),
      rec({ product_id: "c", region: "Hyogo" }),
      rec({ product_id: "d", region: "Ontario", country: "Canada" }),
      rec({ product_id: "e", region: "Kyoto", status: "draft" }),
    ]);
    expect(counts).toEqual({ Niigata: 2, Hyogo: 1 });
    expect(covered).toBe(2);
    expect([0, 1, 2, 3, 4, 5, 9].map(prefectureLevel)).toEqual([0, 1, 2, 3, 3, 4, 4]);
  });
});
