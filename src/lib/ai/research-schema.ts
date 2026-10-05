// 「名前からAIで自動入力」の結果の形(仕様書 §8.2)
import { z } from "zod";
import type { Kind } from "@/lib/kinds";
import { BEER_CATEGORIES, PREFECTURES, SAKE_CATEGORIES } from "@/lib/masters";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

const source = z.object({ title: z.string(), url: z.string() });

const beerCandidate = z.object({
  name: z.string(),
  maker: nullableString,
  maker_address: nullableString,
  country: nullableString,
  prefecture: nullableString,
  category: z.string(),
  abv: nullableNumber,
  price_yen: nullableNumber,
  price_note: nullableString,
  sources: z.array(source),
});

const sakeCandidate = beerCandidate.extend({
  polish_ratio: nullableNumber,
  sake_meter: nullableNumber,
  acidity: nullableNumber,
  rice: nullableString,
});

export const researchResultSchema = {
  beer: z.object({ candidates: z.array(beerCandidate), note: nullableString }),
  sake: z.object({ candidates: z.array(sakeCandidate), note: nullableString }),
};

export type ResearchCandidate = z.infer<typeof sakeCandidate> | z.infer<typeof beerCandidate>;
export type ResearchResult = { candidates: ResearchCandidate[]; note: string | null };

export function categoriesFor(kind: Kind): string[] {
  return kind === "beer" ? BEER_CATEGORIES.map((c) => c.label) : SAKE_CATEGORIES;
}

// AI に渡すツールの入力スキーマ(JSON Schema)。strict: true で形を守らせる
export function researchToolSchema(kind: Kind) {
  const str = { anyOf: [{ type: "string" }, { type: "null" }] };
  const num = { anyOf: [{ type: "number" }, { type: "null" }] };
  const common: Record<string, unknown> = {
    name: { type: "string", description: "正式な商品名" },
    maker: { ...str, description: kind === "beer" ? "醸造所名" : "酒蔵名" },
    maker_address: { ...str, description: "醸造所・酒蔵の所在地(市区町村まで)" },
    country: { ...str, description: "国名(日本語。例: 日本、ベルギー)" },
    prefecture: { ...str, description: "日本の場合は都道府県(例: 新潟県)。日本以外は null" },
    category: { type: "string", enum: categoriesFor(kind), description: kind === "beer" ? "ビアスタイル" : "特定名称" },
    abv: { ...num, description: "アルコール度数(%)" },
    price_yen: { ...num, description: "参考価格(円、整数)" },
    price_note: { ...str, description: "価格の容量など(例: 350ml缶の参考価格)" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, url: { type: "string" } },
        required: ["title", "url"],
        additionalProperties: false,
      },
    },
  };
  const sake: Record<string, unknown> =
    kind === "sake"
      ? {
          polish_ratio: { ...num, description: "精米歩合(%、整数)" },
          sake_meter: { ...num, description: "日本酒度(マイナスあり)" },
          acidity: { ...num, description: "酸度" },
          rice: { ...str, description: "酒米(例: 山田錦)" },
        }
      : {};
  const properties = { ...common, ...sake };
  return {
    type: "object" as const,
    properties: {
      candidates: {
        type: "array",
        items: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
      },
      note: { ...str, description: "補足(候補が複数ある理由など)。なければ null" },
    },
    required: ["candidates", "note"],
    additionalProperties: false,
  };
}

// AI の答えを整える。マスタにないカテゴリは「その他」、知らない都道府県は null、候補は最大3つ
export function cleanResearchResult(kind: Kind, raw: unknown): ResearchResult | null {
  const parsed = researchResultSchema[kind].safeParse(raw);
  if (!parsed.success) return null;
  const categories = categoriesFor(kind);
  const candidates = parsed.data.candidates.slice(0, 3).map((c) => {
    const prefecture = c.prefecture && PREFECTURES.includes(c.prefecture) ? c.prefecture : null;
    return {
      ...c,
      category: categories.includes(c.category) ? c.category : "その他",
      prefecture,
      country: prefecture ? "日本" : c.country,
      price_yen: c.price_yen == null ? null : Math.round(c.price_yen),
      sources: c.sources.filter((s) => /^https?:\/\//.test(s.url)),
    };
  });
  return { candidates, note: parsed.data.note };
}
