import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_KIND_COOKIE, headerKinds, isKind } from "@/lib/kinds";
import { loadKindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

// 最後に見ていた種類のレポートへ移る。その種類を非表示にしていたら、ヘッダーの左端の種類へ
export default async function Home() {
  const last = (await cookies()).get(LAST_KIND_COOKIE)?.value;
  const settings = await loadKindSettings(await createClient());
  const kinds = headerKinds(settings.order, settings.visible);
  redirect(`/${isKind(last) && kinds.includes(last) ? last : kinds[0]}/report`);
}
