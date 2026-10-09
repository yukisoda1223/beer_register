import { NextResponse, type NextRequest } from "next/server";
import { AiError } from "@/lib/ai/client";
import { parseQuickInput } from "@/lib/ai/quick-input";
import { errorResponse, requireUser } from "@/lib/ai/route-helpers";
import { consumeAiQuota } from "@/lib/ai/usage";
import { isKind } from "@/lib/kinds";

// チャットで入力(仕様書 §8.4)。文章を項目に分けて返す。名前からの調査は画面側で続けて行う
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const kind = body?.kind;
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!isKind(kind)) throw new AiError("種類が正しくありません。", 400);
    if (!text || text.length > 500) throw new AiError("文章を入れてください(500文字まで)。", 400);

    const { supabase, userId } = await requireUser();
    await consumeAiQuota(supabase, userId, "quick_input");
    return NextResponse.json(await parseQuickInput(kind, text));
  } catch (error) {
    return errorResponse(error);
  }
}
