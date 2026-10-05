"use client";

import { useRouter } from "next/navigation";

// 左上の戻るボタン。直接URLで開いたときなど戻り先が無ければ fallback へ移る
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="戻る"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="flex size-11 items-center justify-center rounded-full text-(--color-text) hover:bg-(--color-surface)"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
