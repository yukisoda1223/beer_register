"use client";

import { useCallback, useEffect, useState } from "react";
import { postAi } from "@/lib/ai/fetch-client";
import type { Kind } from "@/lib/kinds";

type Response = { comment: string | null; needMore?: number };

// Your Summary(AI のひとこと)。開いたときに必要なら自動で作り直す。右上のボタンで手動でも作り直せる
export function YourSummary({ kind }: { kind: Kind }) {
  const [comment, setComment] = useState<string | null>(null);
  const [needMore, setNeedMore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const r = await postAi<Response>("/api/report-comment", { kind, force });
        setComment(r.comment);
        setNeedMore(r.needMore ?? null);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [kind],
  );

  useEffect(() => {
    // 開いたときに一度だけ読む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [load]);

  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[12px] font-medium tracking-[0.08em] text-(--color-text-sub) uppercase">Your Summary</h2>
        {needMore == null && (
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            aria-label="Refresh summary"
            className="flex size-8 items-center justify-center rounded-full text-(--color-text-sub) disabled:opacity-40"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden className={loading ? "animate-spin" : ""}>
              <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      {loading && !comment ? (
        <div className="flex flex-col gap-2" aria-label="Loading">
          <span className="h-3 w-full animate-pulse rounded bg-(--color-empty)" />
          <span className="h-3 w-2/3 animate-pulse rounded bg-(--color-empty)" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-(--color-danger)">{error}</p>
      ) : needMore != null ? (
        <p className="text-[13px] text-(--color-text-sub)">
          Log {needMore} more {needMore === 1 ? "drink" : "drinks"} to get your summary.
        </p>
      ) : (
        <p className="text-[15px] leading-relaxed font-light">{comment}</p>
      )}
    </section>
  );
}
