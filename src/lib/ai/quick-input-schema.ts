// 「チャットで入力」の読み取り結果の形(仕様書 §8.4)
import { z } from "zod";
import type { ServingTemp } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

export const quickInputSchema = z.object({
  name: z.string().nullable().describe("Product name, or null"),
  rating: z.number().nullable().describe("Overall rating 0.5-5 in 0.5 steps"),
  bitterness: z.number().nullable().describe("Bitterness 0.5-5 in 0.5 steps (beer only)"),
  aroma: z.number().nullable().describe("Aroma 0.5-5 in 0.5 steps"),
  sweet_dry: z.number().nullable().describe("1 = sweet to 5 = dry, integer (sake only)"),
  light_rich: z.number().nullable().describe("1 = light to 5 = rich, integer (sake only)"),
  serving_temp: z.enum(["cold", "room", "warm", "hot"]).nullable().describe("Serving temperature (sake only)"),
  comment: z.string().nullable().describe("Remaining impressions (food pairing etc.)"),
});

export type QuickInput = {
  name: string | null;
  rating: number | null;
  bitterness: number | null;
  aroma: number | null;
  sweet_dry: number | null;
  light_rich: number | null;
  serving_temp: ServingTemp | null;
  comment: string | null;
};

const half = (n: number | null) => (n == null ? null : Math.min(5, Math.max(0.5, Math.round(n * 2) / 2)));
const step5 = (n: number | null) => (n == null ? null : Math.min(5, Math.max(1, Math.round(n))));
const text = (s: string | null) => (s && s.trim() ? s.trim() : null);

// 値を範囲内に収め、種類に関係ない項目は null にする
export function cleanQuickInput(kind: Kind, raw: z.infer<typeof quickInputSchema>): QuickInput {
  const isBeer = kind === "beer";
  return {
    name: text(raw.name),
    rating: half(raw.rating),
    bitterness: isBeer ? half(raw.bitterness) : null,
    aroma: half(raw.aroma),
    sweet_dry: isBeer ? null : step5(raw.sweet_dry),
    light_rich: isBeer ? null : step5(raw.light_rich),
    serving_temp: isBeer ? null : raw.serving_temp,
    comment: text(raw.comment),
  };
}
