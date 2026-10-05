"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { KindToggle } from "@/components/KindToggle";
import type { Kind } from "@/lib/kinds";

// 下タブのある画面(レポート・一覧)以外では、左上に戻るボタンを出す
const TAB_SCREENS = ["report", "list"];

export function AppHeader({ kind }: { kind: Kind }) {
  const screen = usePathname().split("/")[2];
  const showBack = !TAB_SCREENS.includes(screen);

  return (
    <header className="sticky top-0 z-10 grid grid-cols-[44px_1fr_44px] items-center bg-(--color-bg)/95 px-2 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur">
      <div>{showBack && <BackButton fallback={`/${kind}/list`} />}</div>
      <div className="flex justify-center">
        <KindToggle kind={kind} />
      </div>
    </header>
  );
}
