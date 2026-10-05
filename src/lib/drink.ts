// 記録1件の型(仕様書 §5.1 の drinks テーブルと同じ形)
import type { Kind } from "@/lib/kinds";

export type BeerFamily = "ale" | "lager" | "other";
export type ServingTemp = "cold" | "room" | "warm" | "hot";

export type Drink = {
  id: string;
  kind: Kind;
  status: "draft" | "saved";
  drunk_on: string;
  name: string;
  maker: string | null;
  maker_address: string | null;
  country: string | null;
  prefecture: string | null;
  abv: number | null;
  price_yen: number | null;
  price_note: string | null;
  rating: number | null;
  aroma: number | null;
  comment: string | null;
  image_path: string | null;
  category: string | null;
  // ビールのみ
  beer_family: BeerFamily | null;
  bitterness: number | null;
  // 日本酒のみ
  polish_ratio: number | null;
  sake_meter: number | null;
  acidity: number | null;
  rice: string | null;
  sweet_dry: number | null;
  light_rich: number | null;
  serving_temp: ServingTemp | null;
};

export const SERVING_TEMP_LABELS: Record<ServingTemp, string> = {
  cold: "冷酒",
  room: "常温",
  warm: "ぬる燗",
  hot: "熱燗",
};

// 一覧・詳細に出す「産地」。日本なら都道府県、海外なら国名。
export function originLabel(d: Pick<Drink, "country" | "prefecture">): string | null {
  if (d.prefecture) return d.prefecture;
  return d.country || null;
}

// 写真がないときのアイコンの種類(§6.5)
export function iconTypeOf(d: Pick<Drink, "kind" | "beer_family">) {
  if (d.kind === "sake") return "sake" as const;
  return d.beer_family ?? "other";
}

// "2026-09-28" → "2026年9月28日"
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

// "2026-09-28" → "9/28"
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}
