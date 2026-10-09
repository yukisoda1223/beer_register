// 記録1件の型。ビュー drink_records(飲んだ記録 tastings + 銘柄 products)と同じ形
import type { IconSpec } from "@/components/DrinkIcon";
import type { Kind } from "@/lib/kinds";
import { beerColorOf } from "@/lib/masters";

export type BeerFamily = "ale" | "lager" | "other";
export type ServingTemp = "cold" | "room" | "warm" | "hot";

export type Drink = {
  // 飲んだ記録(tastings)の id
  id: string;
  // 銘柄(products)の id
  product_id: string;
  kind: Kind;
  status: "draft" | "saved";
  drunk_on: string;
  name: string;
  maker: string | null;
  maker_address: string | null;
  // 産地。region は日本なら都道府県(例: Nagano)、海外なら州・都市(例: Ontario)
  region: string | null;
  country: string | null;
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
  // 地図・AI関連
  lat: number | null;
  lng: number | null;
  ai_filled_fields: string[];
  sources: { title: string; url: string }[];
  created_at: string;
  updated_at: string;
};

// 一覧・詳細に出す「産地」。例: "Ontario, Canada"、"Nagano, Japan"、"Italy"
export function originLabel(d: Pick<Drink, "region" | "country">): string | null {
  const parts = [d.region?.trim(), d.country?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

// 写真がないときのアイコン(§6.5)。ビールはスタイルの色で塗る
export function iconOf(d: Pick<Drink, "kind" | "beer_family" | "category">): IconSpec {
  if (d.kind === "sake") return { type: "sake", color: "#829da5" };
  return { type: d.beer_family ?? "other", color: beerColorOf(d.category, d.beer_family) };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-09-28" → "Sep 28, 2026"
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// "2026-09-28" → "9/28"
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}
