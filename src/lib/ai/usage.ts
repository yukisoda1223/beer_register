// AI の1日の利用回数の確認と記録(仕様書 §5.4)
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiError } from "@/lib/ai/client";

export type AiPurpose = "research" | "report" | "quick_input";

// 日本時間の「今日の0時」
export function startOfTodayJST(now = new Date()): Date {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - 9 * 60 * 60 * 1000);
}

export function dailyLimit() {
  const n = Number(process.env.AI_DAILY_LIMIT ?? 50);
  return Number.isFinite(n) && n >= 0 ? n : 50;
}

// 上限に達していればエラー、まだなら1回分を記録する
export async function consumeAiQuota(supabase: SupabaseClient, userId: string, purpose: AiPurpose) {
  const { count, error } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfTodayJST().toISOString());
  if (error) throw new AiError("利用回数を確認できませんでした。");
  if ((count ?? 0) >= dailyLimit()) throw new AiError("今日のAI利用回数の上限に達しました。", 429);

  const { error: insertError } = await supabase.from("ai_usage").insert({ user_id: userId, purpose });
  if (insertError) throw new AiError("利用回数を記録できませんでした。");
}
