// 記録フォームの値 ⇔ データベースの行 の変換と、入力チェック
import { beerFamilyOf } from "@/lib/masters";
import { normalizeName } from "@/lib/normalize";
import type { Drink, ServingTemp } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

// フォームの入力欄の値。文字の欄は "" が未入力、評価などは null が未入力
export type DrinkFormValues = {
  name: string;
  category: string;
  drunk_on: string;
  abv: string;
  price_yen: string;
  price_note: string;
  maker: string;
  maker_address: string;
  country: string;
  region: string;
  rating: number | null;
  bitterness: number | null;
  aroma: number | null;
  comment: string;
  // 日本酒のみ
  polish_ratio: string;
  sake_meter: string;
  acidity: string;
  rice: string;
  sweet_dry: number | null;
  light_rich: number | null;
  serving_temp: ServingTemp | null;
};

export type DrinkFormField = keyof DrinkFormValues;
export type DrinkFormErrors = Partial<Record<DrinkFormField, string>>;

// 今日の日付(端末の時刻で "2026-10-05" の形)
export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function emptyFormValues(kind: Kind, today = todayISO()): DrinkFormValues {
  return {
    name: "",
    category: "",
    drunk_on: today,
    abv: "",
    price_yen: "",
    price_note: "",
    maker: "",
    maker_address: "",
    country: kind === "sake" ? "Japan" : "",
    region: "",
    rating: null,
    bitterness: null,
    aroma: null,
    comment: "",
    polish_ratio: "",
    sake_meter: "",
    acidity: "",
    rice: "",
    sweet_dry: null,
    light_rich: null,
    serving_temp: null,
  };
}

const str = (v: string | number | null | undefined) => (v == null ? "" : String(v));

export function formValuesFromDrink(d: Drink): DrinkFormValues {
  return {
    name: d.name,
    category: str(d.category),
    drunk_on: d.drunk_on,
    abv: str(d.abv),
    price_yen: str(d.price_yen),
    price_note: str(d.price_note),
    maker: str(d.maker),
    maker_address: str(d.maker_address),
    country: str(d.country),
    region: str(d.region),
    rating: d.rating,
    bitterness: d.bitterness,
    aroma: d.aroma,
    comment: str(d.comment),
    polish_ratio: str(d.polish_ratio),
    sake_meter: str(d.sake_meter),
    acidity: str(d.acidity),
    rice: str(d.rice),
    sweet_dry: d.sweet_dry,
    light_rich: d.light_rich,
    serving_temp: d.serving_temp,
  };
}

// 数字の欄。全角数字・全角マイナスも受け付ける。空なら null、数字でなければ NaN
export function parseNumber(text: string): number | null {
  const normalized = text
    .trim()
    .replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[ー－−]/g, "-");
  if (normalized === "") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

type NumberRule = { field: DrinkFormField; min: number; max: number; integer?: boolean; label: string };

const NUMBER_RULES: Record<Kind, NumberRule[]> = {
  beer: [
    { field: "abv", min: 0, max: 99.9, label: "ABV" },
    { field: "price_yen", min: 0, max: 10_000_000, integer: true, label: "Price" },
  ],
  sake: [
    { field: "abv", min: 0, max: 99.9, label: "ABV" },
    { field: "price_yen", min: 0, max: 10_000_000, integer: true, label: "Price" },
    { field: "polish_ratio", min: 1, max: 100, integer: true, label: "Polishing ratio" },
    { field: "sake_meter", min: -999, max: 999, label: "SMV" },
    { field: "acidity", min: 0, max: 99, label: "Acidity" },
  ],
};

// 入力チェック。保存は必須項目(商品名・日付・総合評価・カテゴリ)が必要。下書きは商品名だけでよい
export function validateDrinkForm(kind: Kind, v: DrinkFormValues, status: "draft" | "saved"): DrinkFormErrors {
  const errors: DrinkFormErrors = {};
  if (!v.name.trim()) errors.name = "Enter a name";
  if (status === "saved") {
    if (!v.category) errors.category = kind === "beer" ? "Choose a style" : "Choose a grade";
    if (!v.drunk_on) errors.drunk_on = "Enter a date";
    if (v.rating == null) errors.rating = "Add a rating";
  }
  for (const rule of NUMBER_RULES[kind]) {
    const n = parseNumber(v[rule.field] as string);
    if (n == null) continue;
    if (Number.isNaN(n) || n < rule.min || n > rule.max || (rule.integer && !Number.isInteger(n))) {
      errors[rule.field] = `${rule.label} must be ${rule.integer ? "a whole number" : "a number"}`;
    }
  }
  return errors;
}

const text = (v: string) => (v.trim() === "" ? null : v.trim());
const num = (v: string) => {
  const n = parseNumber(v);
  return n == null || Number.isNaN(n) ? null : n;
};

// データベースに保存する形にする。銘柄(products)と飲んだ記録(tastings)に分ける
export function drinkPayload(kind: Kind, v: DrinkFormValues, status: "draft" | "saved") {
  const isBeer = kind === "beer";
  const product = {
    kind,
    name: v.name.trim(),
    name_key: normalizeName(v.name),
    category: text(v.category),
    abv: num(v.abv),
    price_yen: num(v.price_yen),
    price_note: text(v.price_note),
    maker: text(v.maker),
    maker_address: text(v.maker_address),
    country: text(v.country),
    region: text(v.region),
    beer_family: isBeer ? beerFamilyOf(v.category) : null,
    polish_ratio: isBeer ? null : num(v.polish_ratio),
    sake_meter: isBeer ? null : num(v.sake_meter),
    acidity: isBeer ? null : num(v.acidity),
    rice: isBeer ? null : text(v.rice),
  };
  const tasting = {
    status,
    drunk_on: v.drunk_on || todayISO(),
    rating: v.rating,
    aroma: v.aroma,
    comment: text(v.comment),
    bitterness: isBeer ? v.bitterness : null,
    sweet_dry: isBeer ? null : v.sweet_dry,
    light_rich: isBeer ? null : v.light_rich,
    serving_temp: isBeer ? null : v.serving_temp,
  };
  return { product, tasting };
}
