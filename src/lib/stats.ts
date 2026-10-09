// レポートの集計(仕様書 §7.1)。対象は保存済み(status = saved)の記録だけ
import type { Drink } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

export type StatRecord = Pick<
  Drink,
  | "id" | "product_id" | "status" | "drunk_on" | "name" | "category" | "beer_family" | "kind" | "rating"
  | "image_path" | "region" | "country" | "sweet_dry" | "aroma_level" | "body" | "smoky" | "served" | "peat" | "cask" | "created_at"
>;

function saved<T extends Pick<StatRecord, "status">>(records: T[]) {
  return records.filter((r) => r.status === "saved");
}

// 飲んだ銘柄の数(同じ銘柄は1つ)と、飲んだ回数
export function countDrinks(records: StatRecord[]) {
  const s = saved(records);
  return { unique: new Set(s.map((r) => r.product_id)).size, total: s.length };
}

// "2026-10-09" の n か月前の日付("2026-04-09")。月末は丸める
export function monthsBefore(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) - n;
  const ty = Math.floor(total / 12);
  const tm = (total % 12) + 1;
  const last = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
  return `${ty}-${String(tm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

// お気に入り Top5: 過去6か月、評価の高い順 → 同点なら新しい順。同じ銘柄は一番よかった1回だけ
export function favoritesTop5(records: StatRecord[], today: string): StatRecord[] {
  const from = monthsBefore(today, 6);
  const order = (a: StatRecord, b: StatRecord) =>
    (b.rating ?? 0) - (a.rating ?? 0) || b.drunk_on.localeCompare(a.drunk_on) || b.created_at.localeCompare(a.created_at);
  const best = new Map<string, StatRecord>();
  for (const r of saved(records).filter((r) => r.drunk_on >= from && r.drunk_on <= today && r.rating != null)) {
    const current = best.get(r.product_id);
    if (!current || order(r, current) < 0) best.set(r.product_id, r);
  }
  return [...best.values()].sort(order).slice(0, 5);
}

// スタイル(特定名称)別の銘柄数。多い順に上位5つ + Other
export function categoryBreakdown(records: StatRecord[], top = 5) {
  const byProduct = new Map<string, string>();
  for (const r of saved(records)) byProduct.set(r.product_id, r.category ?? "Other");
  const counts = new Map<string, number>();
  for (const c of byProduct.values()) counts.set(c, (counts.get(c) ?? 0) + 1);
  const sorted = [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const total = byProduct.size;
  if (sorted.length <= top + 1) return { total, items: sorted };
  const head = sorted.slice(0, top);
  const rest = sorted.slice(top).reduce((sum, x) => sum + x.count, 0);
  const other = head.find((x) => x.label === "Other");
  if (other) other.count += rest;
  return { total, items: other ? head : [...head, { label: "Other", count: rest }] };
}

// 月のカレンダー(日曜はじまり)。days[i] は i+1 日に飲んだ回数、offset は1日の前の空きマスの数
export function monthCalendar(records: StatRecord[], year: number, month: number) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const days = Array<number>(daysInMonth).fill(0);
  for (const r of saved(records)) {
    if (r.drunk_on.startsWith(prefix)) days[Number(r.drunk_on.slice(8, 10)) - 1]++;
  }
  return { offset, days, total: days.reduce((a, b) => a + b, 0) };
}

// カレンダーのマスの濃さ(0〜3)
export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  return count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) => (xs.length ? round1(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

// AI の Your Summary に渡す集計(仕様書 §8.3)。数字の計算はここでして、AI には結果だけを渡す
export function summaryInput(kind: Kind, records: StatRecord[], today: string) {
  const s = saved(records);
  const { unique, total } = countDrinks(records);

  const byCategory = new Map<string, number[]>();
  for (const r of s) {
    const list = byCategory.get(r.category ?? "Other") ?? [];
    if (r.rating != null) list.push(r.rating);
    byCategory.set(r.category ?? "Other", list);
  }
  const categories = [...byCategory.entries()]
    .map(([category, ratings]) => ({ category, tastings: s.filter((r) => (r.category ?? "Other") === category).length, avg_rating: avg(ratings) }))
    .sort((a, b) => b.tastings - a.tastings);

  const months: { month: string; tastings: number; top_category: string | null }[] = [];
  for (let i = 11; i >= 0; i--) {
    const ym = monthsBefore(today, i).slice(0, 7);
    const inMonth = s.filter((r) => r.drunk_on.startsWith(ym));
    const counts = new Map<string, number>();
    inMonth.forEach((r) => counts.set(r.category ?? "Other", (counts.get(r.category ?? "Other") ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    months.push({ month: ym, tastings: inMonth.length, top_category: top });
  }

  const result: Record<string, unknown> = {
    kind,
    unique_drinks: unique,
    total_tastings: total,
    categories,
    last_12_months: months,
    favorites: favoritesTop5(records, today).map((r) => ({ name: r.name, category: r.category, rating: r.rating })),
    countries: [...new Set(s.map((r) => r.country).filter(Boolean))],
  };
  const avgOf = (f: "sweet_dry" | "aroma_level" | "body" | "smoky") => avg(s.flatMap((r) => (r[f] != null ? [r[f] as number] : [])));
  if (kind === "beer") {
    const families: Record<string, number> = {};
    s.forEach((r) => (families[r.beer_family ?? "other"] = (families[r.beer_family ?? "other"] ?? 0) + 1));
    result.families = families;
  }
  if (kind === "sake" || kind === "wine" || kind === "cider") result.avg_sweet_dry = avgOf("sweet_dry");
  if (kind === "sake") result.avg_aroma_intensity = avgOf("aroma_level");
  if (kind === "wine" || kind === "whisky") result.avg_body = avgOf("body");
  if (kind === "whisky") result.avg_smoky = avgOf("smoky");
  if (kind === "sake" || kind === "whisky") {
    const served: Record<string, number | null> = {};
    for (const v of new Set(s.flatMap((r) => (r.served ? [r.served] : [])))) {
      served[v] = avg(s.filter((r) => r.served === v).flatMap((r) => (r.rating != null ? [r.rating] : [])));
    }
    result.avg_rating_by_served = served;
  }
  return result;
}
