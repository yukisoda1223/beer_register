// 「名前からAIで自動入力」の結果の形(仕様書 §8.2)。項目は種類ごとに kind-config.ts から決める
import { z } from "zod";
import { KIND_CONFIG, categoriesFor } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import { PREFECTURES } from "@/lib/masters";

export { categoriesFor };

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const source = z.object({ title: z.string(), url: z.string() });

const baseCandidate = z.object({
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

// 種類ごとに足す項目
type Extra = { field: string; zod: z.ZodType; json: Record<string, unknown> };

const str = { anyOf: [{ type: "string" }, { type: "null" }] };
const num = { anyOf: [{ type: "number" }, { type: "null" }] };

function extrasFor(kind: Kind): Extra[] {
  const c = KIND_CONFIG[kind];
  const extras: Extra[] = [];
  const numberDescriptions: Record<string, string> = {
    polish_ratio: "Rice polishing ratio (%, integer)",
    sake_meter: "Sake meter value (SMV), can be negative",
    acidity: "Acidity",
    age_years: "Age statement in years (integer), or null if no age statement",
    vintage: "Vintage year (integer), or null for non-vintage",
  };
  for (const n of c.numbers) extras.push({ field: n.field, zod: nullableNumber, json: { ...num, description: numberDescriptions[n.field] } });
  if (c.ingredient) {
    const what = kind === "sake" ? "Rice variety" : kind === "wine" ? "Grape variety or varieties" : "Apple or pear variety";
    extras.push({ field: "ingredient", zod: nullableString, json: { ...str, description: `${what} in English, or null` } });
  }
  if (c.cask) {
    extras.push({ field: "cask", zod: z.string().nullable(), json: { anyOf: [{ type: "string", enum: c.cask }, { type: "null" }], description: "Main cask type" } });
  }
  if (c.peat) {
    const values = c.peat.map((p) => p.value);
    extras.push({ field: "peat", zod: z.enum(values as [string, ...string[]]).nullable(), json: { anyOf: [{ type: "string", enum: values }, { type: "null" }], description: "Peat level" } });
  }
  return extras;
}

function candidateZod(kind: Kind) {
  return baseCandidate.extend(Object.fromEntries(extrasFor(kind).map((e) => [e.field, e.zod])));
}

export type ResearchCandidate = z.infer<typeof baseCandidate> & {
  polish_ratio?: number | null;
  sake_meter?: number | null;
  acidity?: number | null;
  age_years?: number | null;
  vintage?: number | null;
  ingredient?: string | null;
  cask?: string | null;
  peat?: string | null;
};
export type ResearchResult = { candidates: ResearchCandidate[]; note: string | null };

const MAKER_WORD: Record<Kind, string> = {
  beer: "Brewery",
  sake: "Brewery (sakagura)",
  whisky: "Distillery",
  cider: "Cidery",
  wine: "Winery",
};

// AI に渡すツールの入力スキーマ(JSON Schema)。strict: true で形を守らせる
export function researchToolSchema(kind: Kind) {
  const common: Record<string, unknown> = {
    name: { type: "string", description: "Official product name" },
    maker: { ...str, description: `${MAKER_WORD[kind]} name` },
    maker_address: { ...str, description: "Producer location in English, down to the city (e.g. Matsumoto, Nagano)" },
    country: { ...str, description: "Country in English (e.g. Japan, United Kingdom, France)" },
    region: {
      ...str,
      description: "Japan: prefecture in English without suffix (e.g. Nagano). Elsewhere: state, province, region or city (e.g. Ontario, Islay, Bordeaux)",
    },
    category: { type: "string", enum: categoriesFor(kind), description: KIND_CONFIG[kind].categoryLabel },
    abv: { ...num, description: "ABV (%)" },
    price_yen: { ...num, description: "Reference price in Japanese yen (integer)" },
    price_note: { ...str, description: "What the price is for, in Japanese (e.g. 350ml缶, 720ml, 700ml瓶)" },
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
  const properties = { ...common, ...Object.fromEntries(extrasFor(kind).map((e) => [e.field, e.json])) };
  return {
    type: "object" as const,
    properties: {
      candidates: {
        type: "array",
        items: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
      },
      note: { ...str, description: "Short note in Japanese (e.g. why there are several candidates), or null" },
    },
    required: ["candidates", "note"],
    additionalProperties: false,
  };
}

export const MAX_CANDIDATES = 5;

// AI の答えを整える。マスタにないスタイルは Other、日本の地域は都道府県の一覧にあるものだけ、候補は最大5つ
export function cleanResearchResult(kind: Kind, raw: unknown): ResearchResult | null {
  const parsed = z.object({ candidates: z.array(candidateZod(kind)), note: nullableString }).safeParse(raw);
  if (!parsed.success) return null;
  const categories = categoriesFor(kind);
  const candidates = (parsed.data.candidates as ResearchCandidate[]).slice(0, MAX_CANDIDATES).map((c) => {
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
