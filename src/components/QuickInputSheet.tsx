"use client";

import { useEffect, useRef, useState } from "react";
import type { Kind } from "@/lib/kinds";

const EXAMPLES: Record<Kind, string> = {
  beer: "例: ○○ペールエール ★4 苦め、唐揚げと合う",
  sake: "例: ○○ 純米吟醸 ★4.5 すっきり辛口、冷やで刺身と",
};

// 「チャットで入力」(仕様書 §8.4)。下から出るシートに一文を書いて送る
export function QuickInputSheet({
  kind,
  busy,
  onSubmit,
}: {
  kind: Kind;
  busy: "quick" | "research" | null;
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function send() {
    if (!text.trim() || busy) return;
    // 失敗したときも閉じて、フォーム側のエラー表示を見せる(書いた文章は残す)
    if (await onSubmit(text)) setText("");
    setOpen(false);
  }

  const status = busy === "quick" ? "読み取っています…" : busy === "research" ? "名前から調べています…" : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-1.5 rounded-full bg-(--color-surface) px-4 text-[15px] font-bold text-(--color-accent-text) shadow-sm"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        チャットで入力
      </button>

      <dialog
        ref={ref}
        aria-labelledby="quick-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && !busy && setOpen(false)}
        className="mx-auto mt-auto mb-0 w-full max-w-[480px] rounded-t-2xl bg-(--color-surface) p-5 pb-[max(env(safe-area-inset-bottom),20px)] text-(--color-text) shadow-xl backdrop:bg-black/40"
      >
        <h2 id="quick-title" className="text-lg font-bold">
          チャットで入力
        </h2>
        <p className="mt-1 text-[13px] text-(--color-text-sub)">
          飲んだお酒の名前と感想を一文で書くと、AIが項目に分けて入れます(名前から詳しい情報も調べます)。
        </p>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLES[kind]}
          aria-label="感想"
          disabled={busy != null}
          className="mt-3 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-base"
        />
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={busy != null}
            className="min-h-11 flex-1 rounded-xl border border-(--color-border) font-bold disabled:opacity-60"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy != null || !text.trim()}
            className="flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-(--color-primary) font-bold text-(--color-on-primary) disabled:opacity-60"
          >
            {status ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                {status}
              </>
            ) : (
              "送る"
            )}
          </button>
        </div>
      </dialog>
    </>
  );
}
