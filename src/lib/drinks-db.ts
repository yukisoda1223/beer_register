// 記録の読み込み(ブラウザ側)。ビュー drink_records(飲んだ記録 + 銘柄)から読む。
// 他人の記録は RLS で見えないので user_id での絞り込みは不要
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Drink } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

export const IMAGE_BUCKET = "drink-images";
export const PAGE_SIZE = 20;

export type ListQuery = {
  kind: Kind;
  status: "draft" | "saved";
  search: string;
  category: string;
  // 地域(都道府県マップから開いたとき)。空なら絞り込まない
  region?: string;
  minRating: number | null;
  sort: "date" | "rating";
};

// 検索の文字から、絞り込みの書き方を壊す記号を取り除く
export function sanitizeSearch(q: string) {
  return q.replace(/[,()%*\\]/g, " ").trim();
}

export async function fetchDrinkPage(supabase: SupabaseClient, q: ListQuery, page: number) {
  let query = supabase.from("drink_records").select("*").eq("kind", q.kind).eq("status", q.status);

  const search = sanitizeSearch(q.search);
  if (search) query = query.or(`name.ilike.%${search}%,maker.ilike.%${search}%`);
  if (q.category) query = query.eq("category", q.category);
  if (q.region) query = query.eq("region", q.region);
  if (q.minRating != null) query = query.gte("rating", q.minRating);

  query =
    q.sort === "rating"
      ? query.order("rating", { ascending: false, nullsFirst: false }).order("drunk_on", { ascending: false })
      : query.order("drunk_on", { ascending: false }).order("created_at", { ascending: false });

  const from = page * PAGE_SIZE;
  const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data as Drink[];
}

export async function countDrafts(supabase: SupabaseClient, kind: Kind) {
  const { count } = await supabase
    .from("drink_records")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("status", "draft");
  return count ?? 0;
}

// 写真の署名付きURL(有効期限1時間)をまとめて作る
export async function signedImageUrls(supabase: SupabaseClient, paths: string[]) {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return {} as Record<string, string>;
  const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(unique, 60 * 60);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

// 通信エラーのときの表示
export function errorMessage(fallback: string) {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You seem to be offline. Please try again.";
  return fallback;
}
