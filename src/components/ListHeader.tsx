"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDrafts } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/client";

// 一覧の上: タイトルと「下書き」「＋」ボタン(下書きがあれば件数バッジ)
export function ListHeader({ kind }: { kind: Kind }) {
  const [drafts, setDrafts] = useState(0);

  useEffect(() => {
    countDrafts(createClient(), kind).then(setDrafts).catch(() => {});
  }, [kind]);

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold">一覧</h1>
      <div className="flex gap-2">
        <Link
          href={`/${kind}/drafts`}
          aria-label={drafts > 0 ? `下書き ${drafts}件` : "下書き"}
          className="relative flex size-11 items-center justify-center rounded-full bg-(--color-surface) text-(--color-text) shadow-sm"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 4h10l4 4v12H5z M15 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          {drafts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[11px] font-bold text-(--color-on-primary)">
              {drafts}
            </span>
          )}
        </Link>
        <Link
          href={`/${kind}/new`}
          aria-label="記録する"
          className="flex size-11 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary) shadow-sm"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
