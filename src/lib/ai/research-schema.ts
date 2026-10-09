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
  region: nullableString,
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
    name: { type: "string", description: "Official product name" },
    maker: { ...str, description: kind === "beer" ? "Brewery name" : "Brewery (sakagura) name" },
    maker_address: { ...str, description: "Brewery location in English, down to the city (e.g. Matsumoto, Nagano)" },
    country: { ...str, description: "Country in English (e.g. Japan, Canada, Belgium)" },
    region: {
      ...str,
      description: "Japan: prefecture in English without suffix (e.g. Nagano). Elsewhere: state/province or city (e.g. Ontario)",
    },
    category: { type: "string", enum: categoriesFor(kind), description: kind === "beer" ? "Beer style" : "Sake grade" },
    abv: { ...num, description: "ABV (%)" },
    price_yen: { ...num, description: "Reference price in Japanese yen (integer)" },
    price_note: { ...str, description: "What the price is for, in English (e.g. 350ml can)" },
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
          polish_ratio: { ...num, description: "Rice polishing ratio (%, integer)" },
          sake_meter: { ...num, description: "Sake meter value (SMV), can be negative" },
          acidity: { ...num, description: "Acidity" },
          rice: { ...str, description: "Rice variety in English (e.g. Yamada Nishiki)" },
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
      note: { ...str, description: "Short note in English (e.g. why there are several candidates), or null" },
    },
    required: ["candidates", "note"],
    additionalProperties: false,
  };
}

export const MAX_CANDIDATES = 5;

// AI の答えを整える。マスタにないカテゴリは Other、日本の地域は都道府県の一覧にあるものだけ、候補は最大5つ
export function cleanResearchResult(kind: Kind, raw: unknown): ResearchResult | null {
  const parsed = researchResultSchema[kind].safeParse(raw);
  if (!parsed.success) return null;
  const categories = categoriesFor(kind);
  const candidates = parsed.data.candidates.slice(0, MAX_CANDIDATES).map((c) => {
    const isJapan = c.country === "Japan";
    const region = isJapan ? (PREFECTURES.find((p) => p.toLowerCase() === c.region?.toLowerCase()) ?? null) : c.region;
    return {
      ...c,
      category: categories.includes(c.category) ? c.category : "Other",
      region,
      price_yen: c.price_yen == null ? null : Math.round(c.price_yen),
      sources: c.sources.filter((s) => /^https?:\/\//.test(s.url)),
    };
  });
  return { candidates, note: parsed.data.note };
}
