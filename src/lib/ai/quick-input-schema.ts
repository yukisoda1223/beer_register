// 「Quick note」(チャットで入力)の読み取り結果の形(仕様書 §8.4)
import { z } from "zod";
import type { Served } from "@/lib/drink";
import { KIND_CONFIG, clampScale, type ScaleField } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import { SERVED_OPTIONS } from "@/lib/masters";

export const quickInputSchema = z.object({
  name: z.string().nullable().describe("Product name, or null"),
  rating: z.number().nullable().describe("Overall rating 0.5-5 in 0.5 steps"),
  bitterness: z.number().nullable().describe("Bitterness, -2.5 (weak) to +2.5 (strong), 0 = average, 0.5 steps (beer only)"),
  aroma_level: z.number().nullable().describe("Aroma intensity, -2.5 (subtle) to +2.5 (rich/fragrant), 0 = average, 0.5 steps (beer, sake)"),
  sweet_dry: z.number().nullable().describe("-2.5 (sweet) to +2.5 (dry), 0 = average, 0.5 steps"),
  body: z.number().nullable().describe("Body, -2.5 (light) to +2.5 (full), 0 = average, 0.5 steps"),
  smoky: z.number().nullable().describe("Smokiness, -2.5 (gentle) to +2.5 (strong), 0 = average, 0.5 steps (whisky only)"),
  served: z.enum(["cold", "room", "warm", "hot", "neat", "rocks", "water", "highball", "cocktail"]).nullable().describe("How it was served"),
  comment: z.string().nullable().describe("Remaining impressions in Japanese (food pairing etc.)"),
});

export type QuickInput = {
  name: string | null;
  rating: number | null;
  bitterness: number | null;
  aroma_level: number | null;
  sweet_dry: number | null;
  body: number | null;
  smoky: number | null;
  served: Served | null;
  comment: string | null;
};

const half = (n: number | null) => (n == null ? null : Math.min(5, Math.max(0.5, Math.round(n * 2) / 2)));
const text = (s: string | null) => (s && s.trim() ? s.trim() : null);

// 値を範囲内に収め、その種類で使わない項目は null にする
export function cleanQuickInput(kind: Kind, raw: z.infer<typeof quickInputSchema>): QuickInput {
  const c = KIND_CONFIG[kind];
  const scale = (f: ScaleField) => (c.scales.some((s) => s.field === f) ? clampScale(raw[f]) : null);
  const served = SERVED_OPTIONS[kind]?.some((o) => o.value === raw.served) ? raw.served : null;
  return {
    name: text(raw.name),
    rating: half(raw.rating),
    bitterness: scale("bitterness"),
    aroma_level: scale("aroma_level"),
    sweet_dry: scale("sweet_dry"),
    body: scale("body"),
    smoky: scale("smoky"),
    served,
    comment: text(raw.comment),
  };
}
