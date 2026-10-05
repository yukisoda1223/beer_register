import { Suspense } from "react";
import { DrinkTable } from "@/components/DrinkTable";
import { ListHeader } from "@/components/ListHeader";
import { Toast } from "@/components/Toast";
import type { Kind } from "@/lib/kinds";

// ②一覧(保存済みの記録)
export default async function ListPage({ params }: PageProps<"/[kind]/list">) {
  const kind = (await params).kind as Kind;
  return (
    <div className="flex flex-col gap-4">
      <ListHeader kind={kind} />
      <DrinkTable kind={kind} status="saved" />
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
