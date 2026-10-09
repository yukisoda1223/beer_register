import { Suspense } from "react";
import { DrinkTable } from "@/components/DrinkTable";
import { ListHeader } from "@/components/ListHeader";
import { Toast } from "@/components/Toast";
import type { Kind } from "@/lib/kinds";
import { PREFECTURES } from "@/lib/masters";

// ②一覧(保存済みの記録)
// ?region=Niigata なら、その地域の記録だけ(レポートの都道府県マップから開いたとき)
export default async function ListPage({ params, searchParams }: PageProps<"/[kind]/list">) {
  const kind = (await params).kind as Kind;
  const regionParam = (await searchParams).region;
  const region = typeof regionParam === "string" && PREFECTURES.includes(regionParam) ? regionParam : undefined;
  return (
    <div className="flex flex-col gap-4">
      <ListHeader kind={kind} />
      <DrinkTable key={region ?? ""} kind={kind} status="saved" region={region} />
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
