// AI の Route Handler で共通に使う、ログイン確認とエラーの返し方
import { NextResponse } from "next/server";
import { AiError, isAiConfigured } from "@/lib/ai/client";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || !isAllowedEmail(claims.email)) throw new AiError("Please sign in again.", 401);
  if (!isAiConfigured()) throw new AiError("AI is not set up yet (ANTHROPIC_API_KEY).", 503);
  return { supabase, userId: claims.sub };
}

export function errorResponse(error: unknown) {
  if (error instanceof AiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  const timeout = error instanceof Error && /timed? ?out|abort/i.test(error.name + error.message);
  return NextResponse.json(
    { error: timeout ? "This took too long and was stopped. Please try again." : "The AI request failed. Please try again." },
    { status: timeout ? 504 : 500 },
  );
}
