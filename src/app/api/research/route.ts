import { NextResponse, type NextRequest } from "next/server";
import { AiError } from "@/lib/ai/client";
import { researchDrink } from "@/lib/ai/research";
import type { ResearchResult } from "@/lib/ai/research-schema";
import { errorResponse, requireUser } from "@/lib/ai/route-helpers";
import { consumeAiQuota } from "@/lib/ai/usage";
import { isKind } from "@/lib/kinds";
import { normalizeName } from "@/lib/normalize";

// Web検索を含むので長めに待てるようにする
export const maxDuration = 90;

const CACHE_DAYS = 90;

function cacheSince() {
  return new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// 名前からAIで自動入力(仕様書 §8.2)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const kind = body?.kind;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!isKind(kind)) throw new AiError("Invalid kind.", 400);
    if (!name || name.length > 100) throw new AiError("Enter a name (up to 100 characters).", 400);

    const { supabase, userId } = await requireUser();
    const queryKey = normalizeName(name);

    // 1. 90日以内に調べた結果があれば、AIを呼ばずに返す
    const since = cacheSince();
    const { data: cached } = await supabase
      .from("research_cache")
      .select("result")
      .eq("kind", kind)
      .eq("query_key", queryKey)
      .gte("created_at", since)
      .maybeSingle();
    if (cached) return NextResponse.json({ ...(cached.result as ResearchResult), cached: true });

    // 2. 利用回数を確認して、Claude に調べてもらう
    await consumeAiQuota(supabase, userId, "research");
    const result = await researchDrink(kind, name);

    // 3. 結果を保存して返す(見つからなかったときは保存しない)
    if (result.candidates.length > 0) {
      await supabase
        .from("research_cache")
        .upsert(
          { user_id: userId, kind, query_key: queryKey, result, created_at: new Date().toISOString() },
          { onConflict: "user_id,kind,query_key" },
        );
    }
    return NextResponse.json({ ...result, cached: false });
  } catch (error) {
    return errorResponse(error);
  }
}
