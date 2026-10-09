"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLeaveGuard } from "@/components/UnsavedChanges";
import { useEffect, useRef } from "react";
import { KIND_LABELS, switchKindInPath, type Kind } from "@/lib/kinds";

// 「Beer | Sake | …」の切替ボタン。切り替えても同じ種類の画面に移る。
// 種類が多いときは横にスクロールする。記録の入力中に切り替えるときは「下書きに保存しますか?」と確認する
export function KindToggle({ kind, kinds }: { kind: Kind; kinds: Kind[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { requestLeave } = useLeaveGuard();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // 選んでいる種類が見えるようにスクロールする
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [kind]);

  return (
    <nav
      aria-label="Drink type"
      className="inline-flex max-w-full [scrollbar-width:none] overflow-x-auto rounded-full border border-(--color-border) bg-(--color-surface) p-0.5 [&::-webkit-scrollbar]:hidden"
    >
      {kinds.map((k) => {
        const active = k === kind;
        const href = switchKindInPath(pathname, k);
        return (
          <Link
            key={k}
            ref={active ? activeRef : undefined}
            href={href}
            onClick={(e) => {
              if (active) return e.preventDefault();
              e.preventDefault();
              requestLeave(() => router.push(href));
            }}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 min-w-18 shrink-0 items-center justify-center rounded-full px-4 text-[14px] tracking-wide transition-colors ${
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
