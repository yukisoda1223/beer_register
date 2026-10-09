"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { KindToggle } from "@/components/KindToggle";
import type { Kind } from "@/lib/kinds";

// 下タブのある画面(レポート・一覧)以外では、左上に戻るボタンを出す
const TAB_SCREENS = ["report", "list"];

export function AppHeader({ kind, kinds }: { kind: Kind; kinds: Kind[] }) {
  const screen = usePathname().split("/")[2];
  const showBack = !TAB_SCREENS.includes(screen);

  return (
    <header className="sticky top-0 z-10 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center bg-(--color-bg)/95 px-2 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur">
      <div>{showBack && <BackButton fallback={`/${kind}/list`} />}</div>
      <div className="flex min-w-0 items-center justify-center gap-1">
        <KindToggle kind={kind} kinds={kinds} />
        {screen !== "settings" && (
          <Link
            href={`/${kind}/settings`}
            aria-label="Choose drink types"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-(--color-text-sub) hover:bg-(--color-surface) hover:text-(--color-text)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
