// 地図に出す記録の読み込み(ブラウザ側)。ピンは銘柄(products)ごとに1つ
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Drink } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

// id はその銘柄のいちばん新しい記録(カードから詳細へ移るとき用)
export type MapDrink = Pick<
  Drink,
  "id" | "product_id" | "kind" | "name" | "maker" | "rating" | "image_path" | "beer_family" | "category"
> & { lat: number; lng: number };

export type MissingLocation = { id: string; maker_address: string | null; region: string | null; country: string | null };

// 保存済みの記録がある銘柄のうち、緯度経度があるもの
export async function fetchMapDrinks(supabase: SupabaseClient, kind: Kind) {
  const { data, error } = await supabase
    .from("drink_records")
    .select("id, product_id, kind, name, maker, rating, image_path, beer_family, category, lat, lng")
    .eq("kind", kind)
    .eq("status", "saved")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("drunk_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const seen = new Set<string>();
  return (data as MapDrink[]).filter((d) => (seen.has(d.product_id) ? false : (seen.add(d.product_id), true)));
}

// 場所の手がかり(所在地・地域・国)はあるのに、緯度経度がまだない銘柄
export async function fetchMissingLocations(supabase: SupabaseClient, kind: Kind) {
  const { data, error } = await supabase
    .from("products")
    .select("id, maker_address, region, country")
    .eq("kind", kind)
    .is("lat", null)
    .or("maker_address.not.is.null,region.not.is.null,country.not.is.null");
  if (error) throw error;
  return data as MissingLocation[];
}
