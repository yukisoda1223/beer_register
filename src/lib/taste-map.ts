// 味の好みマップ(日本酒・ワイン・ウイスキー)とシードルの甘辛の分布。
// 1銘柄 = 1点(その銘柄を飲んだ記録の平均)。評価の高い銘柄の近くほど濃く塗る
import { SCALE_MAX, SCALE_MIN } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import type { StatRecord } from "@/lib/stats";

type AxisField = "sweet_dry" | "aroma_level" | "body" | "smoky" | "bitterness";

// 軸の端の言葉。word は画面に出す言葉、te・attr は好みの一文に使う形(te = 「〜で」、attr = 名詞の前)
type Pole = { word: string; te: string; attr: string };
export type Axis = { field: AxisField; label: string; min: number; max: number; low: Pole; high: Pole };

const SWEET_DRY: Axis = {
  field: "sweet_dry",
  label: "甘辛",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "甘口", te: "甘口で", attr: "甘口の" },
  high: { word: "辛口", te: "辛口で", attr: "辛口の" },
};
const AROMA: Axis = {
  field: "aroma_level",
  label: "香りの強さ",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "控えめ", te: "香りが控えめで", attr: "香りが控えめな" },
  high: { word: "華やか", te: "香りが華やかで", attr: "香りが華やかな" },
};
const BODY: Axis = {
  field: "body",
  label: "ボディ",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "ライト", te: "ライトボディで", attr: "ライトボディの" },
  high: { word: "フル", te: "フルボディで", attr: "フルボディの" },
};
const SMOKY: Axis = {
  field: "smoky",
  label: "スモーキー",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "穏やか", te: "スモーキーさが控えめで", attr: "スモーキーさが控えめな" },
  high: { word: "スモーキー", te: "スモーキーで", attr: "スモーキーな" },
};

const BITTERNESS: Axis = {
  field: "bitterness",
  label: "苦み",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "苦み弱め", te: "苦みが控えめで", attr: "苦みが控えめな" },
  high: { word: "苦み強め", te: "苦みがしっかりしていて", attr: "苦みのしっかりした" },
};
const AROMA_RICH: Axis = {
  field: "aroma_level",
  label: "香りの豊かさ",
  min: SCALE_MIN,
  max: SCALE_MAX,
  low: { word: "香り控えめ", te: "香りが控えめで", attr: "香りが控えめな" },
  high: { word: "香り豊か", te: "香りが豊かで", attr: "香りの豊かな" },
};

// 種類ごとの軸。横 x・縦 y の2つあるものはマップ、x だけのもの(シードル)は分布
export const TASTE_AXES: Partial<Record<Kind, { x: Axis; y?: Axis }>> = {
  beer: { x: BITTERNESS, y: AROMA_RICH },
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
  const sigma = 0.9;
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

// シードルの甘辛の分布: −2〜+2 の5つの段階ごとの銘柄数と平均評価(±2.5 は端の段階に入れる)
export function distribution(points: TastePoint[]) {
  const stepOf = (x: number) => Math.min(2, Math.max(-2, Math.round(x)));
  return [-2, -1, 0, 1, 2].map((step) => {
    const inStep = points.filter((p) => stepOf(p.x) === step);
    return { step, count: inStep.length, avgRating: inStep.length ? mean(inStep.map((p) => p.rating)) : null };
  });
}
