import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth";
import { geocode } from "@/lib/geo/geocode";
import { createClient } from "@/lib/supabase/server";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);

// 住所 → 緯度経度(仕様書 §8.5)。見つからなければ { lat: null, lng: null }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims || !isAllowedEmail(data.claims.email)) {
    return NextResponse.json({ error: "ログインし直してください。" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  try {
    const found = await geocode(supabase, {
      address: str(body?.address),
      prefecture: str(body?.prefecture),
      country: str(body?.country),
    });
    return NextResponse.json({ lat: found?.lat ?? null, lng: found?.lng ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "場所を調べられませんでした。" }, { status: 502 });
  }
}
