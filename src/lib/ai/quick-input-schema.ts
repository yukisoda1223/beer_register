// 「Quick note」(チャットで入力)の読み取り結果の形(仕様書 §8.4)
import { z } from "zod";
import type { Served } from "@/lib/drink";
import { KIND_CONFIG } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import { SERVED_OPTIONS } from "@/lib/masters";

export const quickInputSchema = z.object({
  name: z.string().nullable().describe("Product name, or null"),
  rating: z.number().nullable().describe("Overall rating 0.5-5 in 0.5 steps"),
  aroma: z.number().nullable().describe("Aroma rating 0.5-5 in 0.5 steps"),
  bitterness: z.number().nullable().describe("Bitterness 0.5-5 in 0.5 steps (beer only)"),
  smoky: z.number().nullable().describe("Smokiness 0.5-5 in 0.5 steps (whisky only)"),
  sweet_dry: z.number().nullable().describe("1 = sweet to 5 = dry, integer"),
  aroma_level: z.number().nullable().describe("Aroma intensity, 1 = subtle to 5 = fragrant, integer (sake only)"),
  body: z.number().nullable().describe("Body, 1 = light to 5 = full, integer"),
  served: z.enum(["cold", "room", "warm", "hot", "neat", "rocks", "water", "highball", "cocktail"]).nullable().describe("How it was served"),
  comment: z.string().nullable().describe("Remaining impressions in Japanese (food pairing etc.)"),
});

export type QuickInput = {
  name: string | null;
  rating: number | null;
  aroma: number | null;
  bitterness: number | null;
  smoky: number | null;
  sweet_dry: number | null;
  aroma_level: number | null;
  body: number | null;
  served: Served | null;
  comment: string | null;
};

const half = (n: number | null) => (n == null ? null : Math.min(5, Math.max(0.5, Math.round(n * 2) / 2)));
const step5 = (n: number | null) => (n == null ? null : Math.min(5, Math.max(1, Math.round(n))));
const text = (s: string | null) => (s && s.trim() ? s.trim() : null);

// 値を範囲内に収め、その種類で使わない項目は null にする
export function cleanQuickInput(kind: Kind, raw: z.infer<typeof quickInputSchema>): QuickInput {
  const c = KIND_CONFIG[kind];
  const star = (f: "bitterness" | "smoky") => (c.stars.some((s) => s.field === f) ? half(raw[f]) : null);
  const scale = (f: "sweet_dry" | "aroma_level" | "body") => (c.scales.some((s) => s.field === f) ? step5(raw[f]) : null);
  const served = SERVED_OPTIONS[kind]?.some((o) => o.value === raw.served) ? raw.served : null;
  return {
    name: text(raw.name),
    rating: half(raw.rating),
    aroma: half(raw.aroma),
    bitterness: star("bitterness"),
    smoky: star("smoky"),
    sweet_dry: scale("sweet_dry"),
    aroma_level: scale("aroma_level"),
    body: scale("body"),
    served,
    comment: text(raw.comment),
  };
}
