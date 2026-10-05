// AI の Route Handler で共通に使う、ログイン確認とエラーの返し方
import { NextResponse } from "next/server";
import { AiError, isAiConfigured } from "@/lib/ai/client";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || !isAllowedEmail(claims.email)) throw new AiError("ログインし直してください。", 401);
  if (!isAiConfigured()) throw new AiError("AIの設定(ANTHROPIC_API_KEY)がまだです。", 503);
  return { supabase, userId: claims.sub };
}

export function errorResponse(error: unknown) {
  if (error instanceof AiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  const timeout = error instanceof Error && /timed? ?out|abort/i.test(error.name + error.message);
  return NextResponse.json(
    { error: timeout ? "時間がかかりすぎたため中断しました。もう一度お試しください。" : "AIの呼び出しに失敗しました。もう一度お試しください。" },
    { status: timeout ? 504 : 500 },
  );
}
