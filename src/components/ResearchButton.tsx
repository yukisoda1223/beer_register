"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ResearchCandidate, ResearchResult } from "@/lib/ai/research-schema";
import type { Kind } from "@/lib/kinds";

// 「名前からAIで自動入力」ボタン(仕様書 §8.2)。候補が複数なら選んでもらう
export function ResearchButton({
  kind,
  name,
  onPick,
  onError,
}: {
  kind: Kind;
  name: string;
  onPick: (candidate: ResearchCandidate) => void;
  onError: (message: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<ResearchResult | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleClick() {
    if (!name.trim()) {
      onError("先に商品名を入れてください。");
      return;
    }
    onError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, name }),
        signal: AbortSignal.timeout(100_000),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        onError(data?.error ?? "AIで調べられませんでした。");
        return;
      }
      const result = data as ResearchResult & { cached: boolean };
      if (result.candidates.length === 0) {
        onError("見つかりませんでした。名前を変えて試すか、手入力でお願いします。");
      } else if (result.candidates.length === 1) {
        onPick(result.candidates[0]);
        setInfo(result.cached ? "前に調べた結果を入れました。" : "AIが調べた値を空いている欄に入れました。");
      } else {
        setChoices(result);
      }
    } catch {
      onError(navigator.onLine ? "時間がかかりすぎたため中断しました。もう一度お試しください。" : "通信できません。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-(--color-primary) bg-(--color-surface) px-3 text-[15px] font-bold text-(--color-accent-text) disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
            調べています…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor" />
            </svg>
            名前からAIで自動入力
          </>
        )}
      </button>
      {info && <p className="text-[13px] text-(--color-text-sub)">{info}</p>}

      <ConfirmDialog
        open={choices != null}
        title="どの商品ですか?"
        message={choices?.note ?? "同じ名前の商品がいくつか見つかりました。"}
        onClose={() => setChoices(null)}
        actions={[
          ...(choices?.candidates ?? []).map((c, i) => ({
            label: `${i + 1}. ${c.name}${c.maker ? `(${c.maker})` : ""}`,
            onClick: () => {
              onPick(c);
              setChoices(null);
              setInfo("AIが調べた値を空いている欄に入れました。");
            },
          })),
          { label: "キャンセル", onClick: () => setChoices(null) },
        ]}
      />
    </>
  );
}
