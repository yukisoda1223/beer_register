"use client";

import { useEffect, useRef, useState } from "react";
import type { Kind } from "@/lib/kinds";

const EXAMPLES: Record<Kind, string> = {
  beer: "e.g. Hazy Morning IPA ★4, quite bitter, great with fried chicken",
  sake: "e.g. Tsukimigawa Junmai Ginjo ★4.5, crisp and dry, chilled with sashimi",
};

// 「Quick note」(チャットで入力、仕様書 §8.4)。下から出るシートに一文を書いて送る
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

  const status = busy === "quick" ? "Reading…" : busy === "research" ? "Looking it up…" : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 text-[13px] font-medium text-(--color-accent-text)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        Quick note
      </button>

      <dialog
        ref={ref}
        aria-labelledby="quick-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && !busy && setOpen(false)}
        className="mx-auto mt-auto mb-0 w-full max-w-[480px] rounded-t-3xl bg-(--color-surface) p-5 pb-[max(env(safe-area-inset-bottom),20px)] text-(--color-text) shadow-lg backdrop:bg-black/30"
      >
        <h2 id="quick-title" className="text-[15px] font-medium">
          Quick note
        </h2>
        <p className="mt-1 text-[13px] text-(--color-text-sub)">Write the name and how it was. AI fills in the form.</p>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLES[kind]}
          aria-label="Note"
          disabled={busy != null}
          className="mt-3 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[15px]"
        />
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={busy != null}
            className="min-h-10 flex-1 rounded-full border border-(--color-border) text-[13px] font-medium disabled:opacity-60"
          >
            Close
          </button>
          <button
            type="button"
            onClick={send}
            disabled={busy != null || !text.trim()}
            className="flex min-h-10 flex-[2] items-center justify-center gap-2 rounded-full bg-(--color-primary) text-[13px] font-medium text-(--color-on-primary) disabled:opacity-60"
          >
            {status ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" aria-hidden />
                {status}
              </>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </dialog>
    </>
  );
}
