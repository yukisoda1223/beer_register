// 味の好みマップ(日本酒・ワイン・ウイスキー)とシードルの甘辛の分布。
// 1銘柄 = 1点(その銘柄を飲んだ記録の平均)。評価の高い銘柄の近くほど濃く塗る
import type { Kind } from "@/lib/kinds";
import type { StatRecord } from "@/lib/stats";

type AxisField = "sweet_dry" | "aroma_level" | "body" | "smoky";

// 軸の端の言葉。low/high は画面の英語、ja は好みの一文に使う日本語(te = 「〜で」、attr = 名詞の前)
type Pole = { en: string; te: string; attr: string };
export type Axis = { field: AxisField; label: string; min: number; max: number; low: Pole; high: Pole };

const SWEET_DRY: Axis = {
  field: "sweet_dry",
  label: "Sweet — Dry",
  min: 1,
  max: 5,
  low: { en: "Sweet", te: "甘口で", attr: "甘口の" },
  high: { en: "Dry", te: "辛口で", attr: "辛口の" },
};
const AROMA: Axis = {
  field: "aroma_level",
  label: "Aroma intensity",
  min: 1,
  max: 5,
  low: { en: "Subtle", te: "香りが控えめで", attr: "香りが控えめな" },
  high: { en: "Fragrant", te: "香りが華やかで", attr: "香りが華やかな" },
};
const BODY: Axis = {
  field: "body",
  label: "Body",
  min: 1,
  max: 5,
  low: { en: "Light", te: "ライトボディで", attr: "ライトボディの" },
  high: { en: "Full", te: "フルボディで", attr: "フルボディの" },
};
const SMOKY: Axis = {
  field: "smoky",
  label: "Smoky",
  min: 0.5,
  max: 5,
  low: { en: "Gentle", te: "スモーキーさが控えめで", attr: "スモーキーさが控えめな" },
  high: { en: "Smoky", te: "スモーキーで", attr: "スモーキーな" },
};

// 種類ごとの軸。横 x・縦 y の2つあるものはマップ、x だけのもの(シードル)は分布
export const TASTE_AXES: Partial<Record<Kind, { x: Axis; y?: Axis }>> = {
  sake: { x: SWEET_DRY, y: AROMA },
  wine: { x: SWEET_DRY, y: BODY },
  whisky: { x: BODY, y: SMOKY },
  cider: { x: SWEET_DRY },
};

const NOUN: Record<Kind, string> = { beer: "ビール", sake: "日本酒", whisky: "ウイスキー", cider: "シードル", wine: "ワイン" };

export type TastePoint = { productId: string; tastingId: string; name: string; x: number; y: number | null; rating: number; count: number };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// 銘柄ごとにまとめて1点にする。軸の値が入っていない記録は使わない。リンク先は一番新しい記録
export function tastePoints(records: StatRecord[], x: Axis, y?: Axis): TastePoint[] {
  const groups = new Map<string, StatRecord[]>();
  for (const r of records) {
    if (r.status !== "saved" || r.rating == null || r[x.field] == null) continue;
    if (y && r[y.field] == null) continue;
    groups.set(r.product_id, [...(groups.get(r.product_id) ?? []), r]);
  }
  return [...groups.entries()].map(([productId, rs]) => {
    const latest = [...rs].sort((a, b) => b.drunk_on.localeCompare(a.drunk_on) || b.created_at.localeCompare(a.created_at))[0];
    return {
      productId,
      tastingId: latest.id,
      name: latest.name,
      x: mean(rs.map((r) => r[x.field] as number)),
      y: y ? mean(rs.map((r) => r[y.field] as number)) : null,
      rating: mean(rs.map((r) => r.rating as number)),
      count: rs.length,
    };
  });
}

// 塗りの濃さ(0〜1)を size × size のマス目で返す。
// 各銘柄が (評価 − 3) の重みで周りを塗る(★3より低い銘柄の近くは薄くなる)。一番濃いマスが 1
export function preferenceGrid(points: TastePoint[], x: Axis, y: Axis, size = 20): number[][] {
  const sigma = 0.75;
  const raw = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      // マスの中心の値(row 0 が上 = y の最大)
      const vx = x.min + ((col + 0.5) / size) * (x.max - x.min);
      const vy = y.max - ((row + 0.5) / size) * (y.max - y.min);
      let score = 0;
      for (const p of points) {
        const d2 = (p.x - vx) ** 2 + ((p.y ?? 0) - vy) ** 2;
        score += Math.exp(-d2 / (2 * sigma * sigma)) * (p.rating - 3);
      }
      return Math.max(0, score);
    }),
  );
  // ★4が1つだけ、のようなときに真っ黒にならないよう、最低でも ★5 1つぶんで割る
  const top = Math.max(2, ...raw.flat());
  return raw.map((row) => row.map((v) => v / top));
}

// 好みの一文(日本語)。★4以上の銘柄が2つ以上あるときだけ、その中心がどちら寄りかで決める
export function preferenceSentence(kind: Kind, points: TastePoint[], x: Axis, y?: Axis): string {
  const liked = points.filter((p) => p.rating >= 4);
  if (liked.length < 2) return "★4以上の銘柄が2つ以上たまると、好みの傾向をお伝えします。";
  const weights = liked.map((p) => p.rating - 3);
  const total = weights.reduce((a, b) => a + b, 0);
  const center = (v: (p: TastePoint) => number) => liked.reduce((sum, p, i) => sum + v(p) * weights[i], 0) / total;

  const side = (axis: Axis, value: number): Pole | null => {
    const t = (value - axis.min) / (axis.max - axis.min); // 0〜1
    return t < 0.4 ? axis.low : t > 0.6 ? axis.high : null;
  };
  const poles = [side(x, center((p) => p.x)), y ? side(y, center((p) => p.y ?? 0)) : null].filter((p): p is Pole => p != null);
  const noun = NOUN[kind];
  if (poles.length === 0) return `どちらかに偏らない、バランスのとれた${noun}がお好きなようです。`;
  const phrase = poles.map((p, i) => (i === poles.length - 1 ? p.attr : p.te)).join("");
  return `${phrase}${noun}がお好きなようです。`;
}

// シードルの甘辛の分布: 1〜5 の段階ごとの銘柄数と平均評価
export function distribution(points: TastePoint[]) {
  return [1, 2, 3, 4, 5].map((step) => {
    const inStep = points.filter((p) => Math.round(p.x) === step);
    return { step, count: inStep.length, avgRating: inStep.length ? mean(inStep.map((p) => p.rating)) : null };
  });
}
