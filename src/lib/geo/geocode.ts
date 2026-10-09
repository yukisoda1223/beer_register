// 住所 → 緯度経度(仕様書 §8.5)。OpenStreetMap Nominatim を使う(サーバー側でだけ使う)
// 利用規約: 1秒に1回まで・User-Agent を付ける・結果を保存して使い回す
import type { SupabaseClient } from "@supabase/supabase-js";

export type LatLng = { lat: number; lng: number };
export type GeocodeInput = { address: string | null; prefecture: string | null; country: string | null };

const NOMINATIM_URL = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";

// 探す順番: 住所 → (住所で見つからなければ)都道府県 → 国
export function geocodeQueries({ address, prefecture, country }: GeocodeInput): string[] {
  const parts = [
    address?.trim(),
    prefecture?.trim() ? `${prefecture.trim()} 日本` : null,
    country?.trim() && country.trim() !== "日本" ? country.trim() : country?.trim() === "日本" && !prefecture ? "日本" : null,
  ];
  return [...new Set(parts.filter((q): q is string => Boolean(q)))];
}

// 1秒に1回までにそろえる(同じサーバーの中での順番待ち)
let queue: Promise<unknown> = Promise.resolve();
let lastCall = 0;
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastCall + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function searchNominatim(query: string): Promise<LatLng | null> {
  const url = `${NOMINATIM_URL}/search?format=jsonv2&limit=1&accept-language=ja&q=${encodeURIComponent(query)}`;
  const res = await throttled(() =>
    fetch(url, {
      headers: { "User-Agent": process.env.NOMINATIM_USER_AGENT || "beer_register" },
      signal: AbortSignal.timeout(10_000),
    }),
  );
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const rows = (await res.json()) as { lat: string; lon: string }[];
  if (!rows[0]) return null;
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) };
}

// キャッシュ(geocode_cache)を見て、なければ Nominatim に聞く。見つからなかったことも保存する
async function lookup(supabase: SupabaseClient, query: string): Promise<LatLng | null> {
  const { data: cached } = await supabase.from("geocode_cache").select("lat, lng").eq("address", query).maybeSingle();
  if (cached) return cached.lat == null || cached.lng == null ? null : { lat: cached.lat, lng: cached.lng };

  const found = await searchNominatim(query);
  await supabase.from("geocode_cache").insert({ address: query, lat: found?.lat ?? null, lng: found?.lng ?? null });
  return found;
}

export async function geocode(supabase: SupabaseClient, input: GeocodeInput): Promise<LatLng | null> {
  for (const query of geocodeQueries(input)) {
    const found = await lookup(supabase, query);
    if (found) return found;
  }
  return null;
}
