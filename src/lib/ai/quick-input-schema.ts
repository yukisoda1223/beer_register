// 「チャットで入力」の読み取り結果の形(仕様書 §8.4)
import { z } from "zod";
import type { ServingTemp } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

export const quickInputSchema = z.object({
  name: z.string().nullable().describe("銘柄名・商品名。書かれていなければ null"),
  rating: z.number().nullable().describe("総合評価 0.5〜5(0.5刻み)"),
  bitterness: z.number().nullable().describe("苦み 0.5〜5(0.5刻み、ビールのみ)"),
  aroma: z.number().nullable().describe("香り 0.5〜5(0.5刻み)"),
  sweet_dry: z.number().nullable().describe("1=甘口〜5=辛口(整数、日本酒のみ)"),
  light_rich: z.number().nullable().describe("1=淡麗〜5=濃醇(整数、日本酒のみ)"),
  serving_temp: z.enum(["cold", "room", "warm", "hot"]).nullable().describe("飲んだ温度(日本酒のみ)"),
  comment: z.string().nullable().describe("上の項目に入らなかった感想(料理との相性など)"),
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
