import { Suspense } from "react";
import { DrinkTable } from "@/components/DrinkTable";
import { Toast } from "@/components/Toast";
import type { Kind } from "@/lib/kinds";

// 下書き一覧。行をタップすると編集画面で続きを入力できる
export default async function DraftsPage({ params }: PageProps<"/[kind]/drafts">) {
  const kind = (await params).kind as Kind;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">下書き</h1>
      <DrinkTable kind={kind} status="draft" />
      <Suspense>
        <Toast />
      </Suspense>
    </div>
  );
}
