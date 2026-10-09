"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { countDrafts } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/client";

// 一覧の上: タイトルと Drafts・＋ ボタン(下書きがあれば件数バッジ)
export function ListHeader({ kind }: { kind: Kind }) {
  const [drafts, setDrafts] = useState(0);

  useEffect(() => {
    countDrafts(createClient(), kind).then(setDrafts).catch(() => {});
  }, [kind]);

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-[20px] font-medium tracking-tight">List</h1>
      <div className="flex gap-2">
        <Link
          href={`/${kind}/drafts`}
          aria-label={drafts > 0 ? `Drafts (${drafts})` : "Drafts"}
          className="relative flex size-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text-sub)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M5 4h10l4 4v12H5z M15 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {drafts > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-(--color-primary) px-1 text-[10px] font-medium text-(--color-on-primary)">
              {drafts}
            </span>
          )}
        </Link>
        <Link
          href={`/${kind}/new`}
          aria-label="New entry"
          className="flex size-10 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
