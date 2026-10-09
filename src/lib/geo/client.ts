// 画面側から住所 → 緯度経度を調べる。失敗しても保存は止めない(null を返す)
import type { GeocodeInput, LatLng } from "@/lib/geo/geocode";

export function locationKey(input: GeocodeInput) {
  return [input.address, input.prefecture, input.country].map((v) => v?.trim() ?? "").join("|");
}

export async function geocodeOnClient(input: GeocodeInput): Promise<LatLng | null> {
  if (locationKey(input) === "||") return null;
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json();
    return res.ok && data.lat != null ? { lat: data.lat, lng: data.lng } : null;
  } catch {
    return null;
  }
}
