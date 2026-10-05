"use client";

import { useRouter } from "next/navigation";
import { useLeaveGuard } from "@/components/UnsavedChanges";

// 左上の戻るボタン。直接URLで開いたときなど戻り先が無ければ fallback へ移る。
// 入力中の変更があれば「下書きに保存 / 破棄 / キャンセル」を聞く
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const { requestLeave } = useLeaveGuard();
  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={() => requestLeave(() => (window.history.length > 1 ? router.back() : router.push(fallback)))}
      className="flex size-11 items-center justify-center rounded-full text-(--color-text) hover:bg-(--color-surface)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
