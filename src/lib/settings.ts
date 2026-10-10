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

// 初回の使い方紹介を見たか。行がまだ無ければ未(新しく使い始めた人)。
// 読めないとき(20261012 のマイグレーション前など)は、毎回出てしまわないよう「見た」とみなす
export async function loadOnboarded(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.from("user_settings").select("onboarded_at").maybeSingle();
  if (error) return true;
  return data?.onboarded_at != null;
}

// 使い方紹介を終えたとき: 選んだ種類を保存し、見たことを記録する
export async function finishOnboarding(supabase: SupabaseClient, settings: KindSettings) {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { kind_order: settings.order, visible_kinds: settings.visible, onboarded_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  return error;
}

// 並び替え: from 番目を to 番目へ動かす
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
