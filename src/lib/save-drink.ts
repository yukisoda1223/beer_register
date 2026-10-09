// 記録の保存(ブラウザ側)。銘柄(products)と飲んだ記録(tastings)を正しくつなぐ
import type { SupabaseClient } from "@supabase/supabase-js";
import type { drinkPayload } from "@/lib/drink-form";

type Payload = ReturnType<typeof drinkPayload>;
export type ProductFields = Payload["product"] & {
  lat: number | null;
  lng: number | null;
  ai_filled_fields: string[];
  sources: { title: string; url: string }[];
};
export type TastingFields = Payload["tasting"] & { image_path: string | null };

// 空の値は上書きに使わない(既にある銘柄に、新しい記録を足すとき用)
export function onlyFilled<T extends Record<string, unknown>>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0)),
  ) as Partial<T>;
}

async function findProductId(supabase: SupabaseClient, kind: string, nameKey: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("kind", kind)
    .eq("name_key", nameKey)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

async function countTastings(supabase: SupabaseClient, productId: string) {
  const { count, error } = await supabase
    .from("tastings")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw error;
  return count ?? 0;
}

// 銘柄に記録が1件も残っていなければ消す
async function removeProductIfEmpty(supabase: SupabaseClient, productId: string) {
  if ((await countTastings(supabase, productId)) === 0) {
    await supabase.from("products").delete().eq("id", productId);
  }
}

/**
 * 保存する。
 * - 新しい記録: 同じ名前の銘柄があればそこに足し(空の欄は上書きしない)、なければ銘柄を作る
 * - 編集: 名前を変えて別の銘柄と同じ名前になったら、その銘柄に付け替える
 *   (元の銘柄に他の記録が残っていなければ、元の銘柄の名前を変えるだけ)
 */
export async function saveDrink(
  supabase: SupabaseClient,
  args: { tastingId: string; currentProductId: string | null; product: ProductFields; tasting: TastingFields },
): Promise<{ productId: string }> {
  const { tastingId, currentProductId, product, tasting } = args;
  const existingId = await findProductId(supabase, product.kind, product.name_key);

  let productId: string;
  if (currentProductId && (existingId === null || existingId === currentProductId)) {
    // いま付いている銘柄を、そのまま(名前の変更も含めて)更新する。
    // ただし名前を変えたのに、元の銘柄に他の記録もあるなら、新しい銘柄を作って分ける
    const others = existingId === null ? (await countTastings(supabase, currentProductId)) - 1 : 0;
    if (others > 0) {
      productId = await insertProduct(supabase, product);
    } else {
      const { error } = await supabase.from("products").update(product).eq("id", currentProductId);
      if (error) throw error;
      productId = currentProductId;
    }
  } else if (existingId) {
    // 既にある銘柄に足す(空の欄でその銘柄の情報を消さない。名前は元の書き方のまま)
    const { name: _name, name_key: _key, ...rest } = product;
    void _name;
    void _key;
    const { error } = await supabase.from("products").update(onlyFilled(rest)).eq("id", existingId);
    if (error) throw error;
    productId = existingId;
  } else {
    productId = await insertProduct(supabase, product);
  }

  const row = { ...tasting, product_id: productId };
  const { error } = currentProductId
    ? await supabase.from("tastings").update(row).eq("id", tastingId)
    : await supabase.from("tastings").insert({ id: tastingId, ...row });
  if (error) throw error;

  if (currentProductId && currentProductId !== productId) await removeProductIfEmpty(supabase, currentProductId);
  return { productId };
}

async function insertProduct(supabase: SupabaseClient, product: ProductFields) {
  const { data, error } = await supabase.from("products").insert(product).select("id").single();
  if (error) throw error;
  return data.id as string;
}

// 記録を消す(写真も消す。銘柄に記録が残らなければ銘柄も消す)
export async function deleteTasting(
  supabase: SupabaseClient,
  args: { tastingId: string; productId: string; imagePath: string | null },
) {
  const { error } = await supabase.from("tastings").delete().eq("id", args.tastingId);
  if (error) throw error;
  if (args.imagePath) await supabase.storage.from("drink-images").remove([args.imagePath]);
  await removeProductIfEmpty(supabase, args.productId);
}

// 同じ銘柄を前に飲んでいたら、その情報と回数を返す(新しい記録の入力を楽にする)
export async function findKnownProduct(supabase: SupabaseClient, kind: string, nameKey: string) {
  const { data } = await supabase
    .from("products")
    .select("*, tastings(count)")
    .eq("kind", kind)
    .eq("name_key", nameKey)
    .maybeSingle();
  if (!data) return null;
  const count = (data.tastings as { count: number }[] | undefined)?.[0]?.count ?? 0;
  return { product: data as Record<string, unknown>, tastingCount: count };
}
