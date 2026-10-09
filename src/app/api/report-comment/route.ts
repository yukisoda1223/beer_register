import { NextResponse, type NextRequest } from "next/server";
import { AiError } from "@/lib/ai/client";
import { writeReportComment } from "@/lib/ai/report-comment";
import { errorResponse, requireUser } from "@/lib/ai/route-helpers";
import { consumeAiQuota } from "@/lib/ai/usage";
import { isKind } from "@/lib/kinds";
import { countDrinks, summaryInput, type StatRecord } from "@/lib/stats";

// 保存済みが何件増えたら作り直すか
const REFRESH_AFTER = 3;
const MIN_RECORDS = 3;

function todayJST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Your Summary(仕様書 §8.3)。force=true なら必ず作り直す。
// それ以外は、前回から保存済みが3件以上増えたときだけ作り直し、そうでなければ保存してあるコメントを返す
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const kind = body?.kind;
    const force = body?.force === true;
    if (!isKind(kind)) throw new AiError("Invalid kind.", 400);

    const { supabase, userId } = await requireUser();
    const { data: records, error } = await supabase
      .from("drink_records")
      .select("id, product_id, status, drunk_on, name, category, beer_family, kind, rating, image_path, region, country, sweet_dry, aroma_level, body, smoky, served, peat, created_at")
      .eq("kind", kind)
      .eq("status", "saved");
    if (error) throw error;
    const rows = (records ?? []) as StatRecord[];
    const count = rows.length;

    if (count < MIN_RECORDS) return NextResponse.json({ comment: null, needMore: MIN_RECORDS - count });

    const { data: stored } = await supabase.from("ai_reports").select("comment, record_count").eq("kind", kind).maybeSingle();
    if (!force && stored && count - stored.record_count < REFRESH_AFTER) {
      return NextResponse.json({ comment: stored.comment, generated: false });
    }

    await consumeAiQuota(supabase, userId, "report");
    const comment = await writeReportComment(kind, summaryInput(kind, rows, todayJST()));
    await supabase
      .from("ai_reports")
      .upsert({ user_id: userId, kind, comment, record_count: count, created_at: new Date().toISOString() }, { onConflict: "user_id,kind" });
    return NextResponse.json({ comment, generated: true, unique: countDrinks(rows).unique });
  } catch (error) {
    return errorResponse(error);
  }
}
