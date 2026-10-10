// 記録フォームの値 ⇔ データベースの行 の変換と、入力チェック
import type { Drink, Peat, Served } from "@/lib/drink";
import { KIND_CONFIG, type NumberProductField } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import { SERVED_OPTIONS, beerFamilyOf } from "@/lib/masters";
import { normalizeName } from "@/lib/normalize";

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
  aroma: number | null;
  comment: string;
  // 種類ごとの銘柄の情報
  polish_ratio: string;
  sake_meter: string;
  acidity: string;
  ingredient: string;
  age_years: string;
  cask: string;
  peat: Peat | null;
  vintage: string;
  // 種類ごとの、飲んだ回の評価
  bitterness: number | null;
  smoky: number | null;
  sweet_dry: number | null;
  aroma_level: number | null;
  body: number | null;
  served: Served | null;
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
    aroma: null,
    comment: "",
    polish_ratio: "",
    sake_meter: "",
    acidity: "",
    ingredient: "",
    age_years: "",
    cask: "",
    peat: null,
    vintage: "",
    bitterness: null,
    smoky: null,
    sweet_dry: null,
    aroma_level: null,
    body: null,
    served: null,
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
    aroma: d.aroma,
    comment: str(d.comment),
    polish_ratio: str(d.polish_ratio),
    sake_meter: str(d.sake_meter),
    acidity: str(d.acidity),
    ingredient: str(d.ingredient),
    age_years: str(d.age_years),
    cask: str(d.cask),
    peat: d.peat,
    vintage: str(d.vintage),
    bitterness: d.bitterness,
    smoky: d.smoky,
    sweet_dry: d.sweet_dry,
    aroma_level: d.aroma_level,
    body: d.body,
    served: d.served,
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

const COMMON_RULES: NumberRule[] = [
  { field: "abv", min: 0, max: 99.9, label: "ABV" },
  { field: "price_yen", min: 0, max: 10_000_000, integer: true, label: "Price" },
];

const PRODUCT_RULES: Record<NumberProductField, Omit<NumberRule, "label">> = {
  polish_ratio: { field: "polish_ratio", min: 1, max: 100, integer: true },
  sake_meter: { field: "sake_meter", min: -999, max: 999 },
  acidity: { field: "acidity", min: 0, max: 99 },
  age_years: { field: "age_years", min: 0, max: 100, integer: true },
  vintage: { field: "vintage", min: 1800, max: 2200, integer: true },
};

// 入力チェック。保存は商品名・日付・総合評価が必要(スタイルはビールだけ必須)。下書きは商品名だけでよい
export function validateDrinkForm(kind: Kind, v: DrinkFormValues, status: "draft" | "saved"): DrinkFormErrors {
  const config = KIND_CONFIG[kind];
  const errors: DrinkFormErrors = {};
  if (!v.name.trim()) errors.name = "Enter a name";
  if (status === "saved") {
    if (config.categoryRequired && !v.category) errors.category = `Choose a ${config.categoryLabel.toLowerCase()}`;
    if (!v.drunk_on) errors.drunk_on = "Enter a date";
    if (v.rating == null) errors.rating = "Add a rating";
  }
  const rules = [...COMMON_RULES, ...config.numbers.map((n) => ({ ...PRODUCT_RULES[n.field], label: n.label }))];
  for (const rule of rules) {
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

// データベースに保存する形にする。銘柄(products)と飲んだ記録(tastings)に分け、
// その種類で使わない項目は null にする
export function drinkPayload(kind: Kind, v: DrinkFormValues, status: "draft" | "saved") {
  const c = KIND_CONFIG[kind];
  const hasNumber = (f: NumberProductField) => c.numbers.some((n) => n.field === f);
  const hasScale = (f: string) => c.scales.some((s) => s.field === f);
  const servedOk = SERVED_OPTIONS[kind]?.some((o) => o.value === v.served) ?? false;

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
    beer_family: kind === "beer" ? beerFamilyOf(v.category) : null,
    polish_ratio: hasNumber("polish_ratio") ? num(v.polish_ratio) : null,
    sake_meter: hasNumber("sake_meter") ? num(v.sake_meter) : null,
    acidity: hasNumber("acidity") ? num(v.acidity) : null,
    age_years: hasNumber("age_years") ? num(v.age_years) : null,
    vintage: hasNumber("vintage") ? num(v.vintage) : null,
    ingredient: c.ingredient ? text(v.ingredient) : null,
    cask: c.cask ? text(v.cask) : null,
    peat: c.peat ? v.peat : null,
  };
  const tasting = {
    status,
    drunk_on: v.drunk_on || todayISO(),
    rating: v.rating,
    aroma: v.aroma,
    comment: text(v.comment),
    bitterness: hasScale("bitterness") ? v.bitterness : null,
    smoky: hasScale("smoky") ? v.smoky : null,
    sweet_dry: hasScale("sweet_dry") ? v.sweet_dry : null,
    aroma_level: hasScale("aroma_level") ? v.aroma_level : null,
    body: hasScale("body") ? v.body : null,
    served: servedOk ? v.served : null,
  };
  return { product, tasting };
}
