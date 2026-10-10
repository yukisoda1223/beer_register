import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_KIND_COOKIE, headerKinds, isKind } from "@/lib/kinds";
import { loadKindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

// 最後に見ていた種類のレポートへ移る。その種類を非表示にしていたら、ヘッダーの左端の種類へ。
// ログインした直後(?welcome=1)は、ヘッダーの左端(一番好きなお酒)へダイブする
export default async function Home({ searchParams }: PageProps<"/">) {
  const welcome = (await searchParams).welcome === "1";
  const last = (await cookies()).get(LAST_KIND_COOKIE)?.value;
  const settings = await loadKindSettings(await createClient());
  const kinds = headerKinds(settings.order, settings.visible);
  if (welcome) redirect(`/${kinds[0]}/report?welcome=1`);
  redirect(`/${isKind(last) && kinds.includes(last) ? last : kinds[0]}/report`);
}
