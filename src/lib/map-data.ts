// 地図に出す記録の読み込み(ブラウザ側)
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Drink } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

export type MapDrink = Pick<
  Drink,
  "id" | "kind" | "name" | "maker" | "rating" | "image_path" | "beer_family" | "category"
> & { lat: number; lng: number };

export type MissingLocation = Pick<Drink, "id" | "maker_address" | "prefecture" | "country">;

// 保存済みで、緯度経度がある記録
export async function fetchMapDrinks(supabase: SupabaseClient, kind: Kind) {
  const { data, error } = await supabase
    .from("drinks")
    .select("id, kind, name, maker, rating, image_path, beer_family, category, lat, lng")
    .eq("kind", kind)
    .eq("status", "saved")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("drunk_on", { ascending: false });
  if (error) throw error;
  return data as MapDrink[];
}

// 保存済みで、場所の手がかり(所在地・都道府県・国)はあるのに緯度経度がまだない記録
export async function fetchMissingLocations(supabase: SupabaseClient, kind: Kind) {
  const { data, error } = await supabase
    .from("drinks")
    .select("id, maker_address, prefecture, country")
    .eq("kind", kind)
    .eq("status", "saved")
    .is("lat", null)
    .or("maker_address.not.is.null,prefecture.not.is.null,country.not.is.null");
  if (error) throw error;
  return data as MissingLocation[];
}
