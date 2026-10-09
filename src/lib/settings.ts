// 表示するお酒の種類の設定(user_settings)。行がまだ無い・読めないときは最初の設定を使う
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_KIND_ORDER, DEFAULT_VISIBLE_KINDS, KINDS, isKind, type Kind } from "@/lib/kinds";

export type KindSettings = { order: Kind[]; visible: Kind[] };

export const DEFAULT_KIND_SETTINGS: KindSettings = { order: DEFAULT_KIND_ORDER, visible: DEFAULT_VISIBLE_KINDS };

// 知らない値を捨て、並び順に足りない種類は末尾に足す
export function normalizeKindSettings(order: unknown, visible: unknown): KindSettings {
  const o = Array.isArray(order) ? order.filter(isKind) : [];
  const fullOrder = [...new Set([...o, ...KINDS])];
  const v = Array.isArray(visible) ? visible.filter(isKind) : [];
  return { order: fullOrder, visible: v.length ? fullOrder.filter((k) => v.includes(k)) : DEFAULT_VISIBLE_KINDS };
}

export async function loadKindSettings(supabase: SupabaseClient): Promise<KindSettings> {
  const { data, error } = await supabase.from("user_settings").select("kind_order, visible_kinds").maybeSingle();
  if (error || !data) return DEFAULT_KIND_SETTINGS;
  return normalizeKindSettings(data.kind_order, data.visible_kinds);
}

export async function saveKindSettings(supabase: SupabaseClient, settings: KindSettings) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ kind_order: settings.order, visible_kinds: settings.visible }, { onConflict: "user_id" });
  return error;
}

// 並び替え: from 番目を to 番目へ動かす
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
