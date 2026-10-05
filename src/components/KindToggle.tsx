"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KINDS, KIND_LABELS, switchKindInPath, type Kind } from "@/lib/kinds";

// 「ビール | 日本酒」の切替ボタン。切り替えても同じ種類の画面に移る。
// TODO(M3): 記録の入力中に切り替えるときは「下書きに保存しますか?」と確認する
export function KindToggle({ kind }: { kind: Kind }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="お酒の種類"
      className="inline-flex rounded-full border border-(--color-border) bg-(--color-surface) p-1 shadow-sm"
    >
      {KINDS.map((k) => {
        const active = k === kind;
        return (
          <Link
            key={k}
            href={switchKindInPath(pathname, k)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 min-w-24 items-center justify-center rounded-full px-5 text-base font-bold transition-colors ${
              active
                ? "bg-(--color-primary) text-(--color-on-primary)"
                : "text-(--color-text-sub) hover:text-(--color-text)"
            }`}
          >
            {KIND_LABELS[k]}
          </Link>
        );
      })}
    </nav>
  );
}
