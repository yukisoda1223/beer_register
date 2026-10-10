import { Suspense } from "react";
import { DrinkTable } from "@/components/DrinkTable";
import { ListHeader } from "@/components/ListHeader";
import { Toast } from "@/components/Toast";
import type { Kind } from "@/lib/kinds";
import { KIND_CONFIG } from "@/lib/kind-config";
import { PREFECTURES } from "@/lib/masters";

// ②一覧(保存済みの記録)
// ?region=Niigata なら、その地域の記録だけ(レポートの都道府県マップから開いたとき)
export default async function ListPage({ params, searchParams }: PageProps<"/[kind]/list">) {
  const kind = (await params).kind as Kind;
  const sp = await searchParams;
  const region = typeof sp.region === "string" && PREFECTURES.includes(sp.region) ? sp.region : undefined;
  // ?style=IPA なら、そのスタイルで絞り込んだ状態で開く(Learn から来たとき)
  const style = typeof sp.style === "string" && KIND_CONFIG[kind].categories.includes(sp.style) ? sp.style : undefined;
  return (
    <div className="flex flex-col gap-4">
      <ListHeader kind={kind} />
      <DrinkTable key={`${region ?? ""}|${style ?? ""}`} kind={kind} status="saved" region={region} initialCategory={style} />
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
