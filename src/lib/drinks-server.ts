// 記録の読み込み(サーバー側)
import { notFound } from "next/navigation";
import type { Drink } from "@/lib/drink";
import { IMAGE_BUCKET } from "@/lib/drinks-db";
import { isKind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// URL の kind と id から記録を1件読む。見つからなければ 404
export async function loadDrinkOr404(kind: string, id: string) {
  if (!isKind(kind) || !UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("drink_records").select("*").eq("id", id).eq("kind", kind).maybeSingle();
  if (!data) notFound();
  const drink = data as Drink;

  let imageUrl: string | null = null;
  if (drink.image_path) {
    const { data: signed } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(drink.image_path, 60 * 60);
    imageUrl = signed?.signedUrl ?? null;
  }
  // 同じ銘柄の、ほかに飲んだ記録(新しい順)
  const { data: history } = await supabase
    .from("drink_records")
    .select("id, drunk_on, rating, status")
    .eq("product_id", drink.product_id)
    .neq("id", drink.id)
    .order("drunk_on", { ascending: false });

  return { drink, imageUrl, history: (history ?? []) as Pick<Drink, "id" | "drunk_on" | "rating" | "status">[] };
}
