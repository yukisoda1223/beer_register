// 選択肢マスタ(仕様書 §6)。画面・データとも英語
import type { BeerFamily, Peat, Served } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

// 6.1 ビールのスタイルと系統。color はアイコンのビールの色(写真がないとき)
export const BEER_CATEGORIES: { label: string; family: BeerFamily; color: string }[] = [
  { label: "Pilsner", family: "lager", color: "#E9B949" },
  { label: "Lager", family: "lager", color: "#E3A93A" },
  { label: "Helles", family: "lager", color: "#F0CB5E" },
  { label: "Bock", family: "lager", color: "#8C4A1C" },
  { label: "Rauchbier", family: "lager", color: "#5E2E14" },
  { label: "Schwarzbier", family: "lager", color: "#2A1A12" },
  { label: "Pale Ale", family: "ale", color: "#D4892F" },
  { label: "IPA", family: "ale", color: "#C97A26" },
  { label: "Session IPA", family: "ale", color: "#DDA041" },
  { label: "Hazy IPA", family: "ale", color: "#EDB34A" },
  { label: "Double IPA", family: "ale", color: "#B8641D" },
  { label: "Weizen", family: "ale", color: "#EFC25C" },
  { label: "Witbier", family: "ale", color: "#F3D98A" },
  { label: "Saison", family: "ale", color: "#E2A845" },
  { label: "Amber Ale", family: "ale", color: "#A8521E" },
  { label: "Brown Ale", family: "ale", color: "#6E3518" },
  { label: "Porter", family: "ale", color: "#3B2216" },
  { label: "Stout", family: "ale", color: "#1E1410" },
  { label: "Kölsch", family: "ale", color: "#F2CF66" },
  { label: "Cream Ale", family: "ale", color: "#EFCB6C" },
  { label: "Tripel", family: "ale", color: "#E0A238" },
  { label: "Barleywine", family: "ale", color: "#8A3A16" },
  { label: "Sour Ale", family: "other", color: "#D9775A" },
  { label: "Fruit Beer", family: "other", color: "#C8495A" },
  { label: "Radler", family: "other", color: "#F2C94C" },
  { label: "Other", family: "other", color: "#C9A16A" },
];

export const BEER_FAMILY_LABELS: Record<BeerFamily, string> = {
  ale: "Ale",
  lager: "Lager",
  other: "Other",
};

export function beerFamilyOf(category: string | null | undefined): BeerFamily | null {
  if (!category) return null;
  return BEER_CATEGORIES.find((c) => c.label === category)?.family ?? "other";
}

// ビールの色(スタイルが分からなければ系統の代表色)
export function beerColorOf(category: string | null | undefined, family?: BeerFamily | null): string {
  const found = BEER_CATEGORIES.find((c) => c.label === category);
  if (found) return found.color;
  if (family === "lager") return "#E3A93A";
  if (family === "ale") return "#A8521E";
  return "#C9A16A";
}

// 6.2 日本酒の特定名称
export const SAKE_CATEGORIES = [
  "Junmai Daiginjo",
  "Junmai Ginjo",
  "Tokubetsu Junmai",
  "Junmai",
  "Daiginjo",
  "Ginjo",
  "Tokubetsu Honjozo",
  "Honjozo",
  "Futsushu",
  "Other",
];

// 日本酒の特定名称の表示(データは英語のまま持ち、画面・AI の要約では日本語で出す)
export const SAKE_CATEGORY_JA: Record<string, string> = {
  "Junmai Daiginjo": "純米大吟醸",
  "Junmai Ginjo": "純米吟醸",
  "Tokubetsu Junmai": "特別純米",
  Junmai: "純米",
  Daiginjo: "大吟醸",
  Ginjo: "吟醸",
  "Tokubetsu Honjozo": "特別本醸造",
  Honjozo: "本醸造",
  Futsushu: "普通酒",
  Other: "その他",
};

// スタイル・特定名称の表示名。日本酒だけ日本語、ほかは英語のまま(Stout など)
export function categoryText(kind: Kind, category: string | null | undefined): string | null {
  if (!category) return null;
  return kind === "sake" ? (SAKE_CATEGORY_JA[category] ?? category) : category;
}

// 6.3 飲み方。日本酒は温度(表示は日本語)、ウイスキーは飲み方
export const SERVED_OPTIONS: Partial<Record<Kind, { value: Served; label: string }[]>> = {
  sake: [
    { value: "cold", label: "冷酒" },
    { value: "room", label: "常温" },
    { value: "warm", label: "ぬる燗" },
    { value: "hot", label: "熱燗" },
  ],
  whisky: [
    { value: "neat", label: "Neat" },
    { value: "rocks", label: "Rocks" },
    { value: "water", label: "With water" },
    { value: "highball", label: "Highball" },
    { value: "cocktail", label: "Cocktail" },
  ],
};

export function servedLabel(kind: Kind, value: Served | null): string | null {
  if (!value) return null;
  return SERVED_OPTIONS[kind]?.find((o) => o.value === value)?.label ?? value;
}

// ウイスキー
export const WHISKY_TYPES = ["Single Malt", "Blended Malt", "Blended", "Single Grain", "Bourbon", "Rye", "Pot Still", "Other"];
export const CASKS = ["Bourbon", "Sherry", "Wine", "Port", "Mizunara", "Mixed", "Other"];
export const PEAT_LEVELS: { value: Peat; label: string; color: string }[] = [
  { value: "none", label: "None", color: "#D9A048" },
  { value: "light", label: "Light", color: "#C0802F" },
  { value: "medium", label: "Medium", color: "#9B5E24" },
  { value: "heavy", label: "Heavy", color: "#6E3F1A" },
];

// シードル
export const CIDER_STYLES = ["Modern", "Traditional", "Perry", "Rosé", "Fruit", "Hopped", "Ice Cider", "Other"];

// ワイン(color はアイコンのワインの色)
export const WINE_TYPES: { label: string; color: string }[] = [
  { label: "Red", color: "#6E1F2E" },
  { label: "White", color: "#E9D27A" },
  { label: "Rosé", color: "#E59AA4" },
  { label: "Sparkling", color: "#EEDC8E" },
  { label: "Orange", color: "#E09A4A" },
  { label: "Dessert", color: "#D9A02B" },
  { label: "Fortified", color: "#7A2E1E" },
];

// 6.4 都道府県(北から順、英語。産地の「地域」と制覇率で使う)
export const PREFECTURES = [
  "Hokkaido",
  "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
  "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
  "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano",
  "Gifu", "Shizuoka", "Aichi", "Mie",
  "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara", "Wakayama",
  "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
  "Tokushima", "Kagawa", "Ehime", "Kochi",
  "Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Oita", "Miyazaki", "Kagoshima",
  "Okinawa",
];

// 国の入力候補(自由入力もできる)
export const COUNTRY_SUGGESTIONS = [
  "Japan", "United States", "Canada", "Belgium", "Germany", "Czech Republic", "United Kingdom", "Ireland",
  "Netherlands", "Denmark", "Italy", "France", "Australia", "New Zealand", "Mexico", "Taiwan", "South Korea",
];
