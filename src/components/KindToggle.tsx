"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLeaveGuard } from "@/components/UnsavedChanges";
import { KINDS, KIND_LABELS, switchKindInPath, type Kind } from "@/lib/kinds";

// 「ビール | 日本酒」の切替ボタン。切り替えても同じ種類の画面に移る。
// 記録の入力中に切り替えるときは「下書きに保存しますか?」と確認する
export function KindToggle({ kind }: { kind: Kind }) {
  const pathname = usePathname();
  const router = useRouter();
  const { requestLeave } = useLeaveGuard();

  return (
    <nav
      aria-label="Drink type"
      className="inline-flex rounded-full border border-(--color-border) bg-(--color-surface) p-0.5"
    >
      {KINDS.map((k) => {
        const active = k === kind;
        const href = switchKindInPath(pathname, k);
        return (
          <Link
            key={k}
            href={href}
            onClick={(e) => {
              if (active) return e.preventDefault();
              e.preventDefault();
              requestLeave(() => router.push(href));
            }}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 min-w-20 items-center justify-center rounded-full px-4 text-[14px] tracking-wide transition-colors ${
              active
                ? "bg-(--color-primary) font-medium text-(--color-on-primary)"
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
