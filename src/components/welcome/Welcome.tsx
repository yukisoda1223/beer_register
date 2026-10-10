"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Onboarding } from "@/components/welcome/Onboarding";
import { WelcomeDive } from "@/components/welcome/WelcomeDive";
import { headerKinds, type Kind } from "@/lib/kinds";
import type { KindSettings } from "@/lib/settings";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const m = window.matchMedia(reducedMotionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

// ログイン直後の流れ: 使い方紹介をまだ見ていなければ紹介 → 一番左のお酒へダイブ。
// 見たことがあれば、ログイン直後(?welcome=1)だけダイブする
export function Welcome({ kind, settings, onboarded }: { kind: Kind; settings: KindSettings; onboarded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const welcome = useSearchParams().get("welcome") === "1";
  const [showIntro, setShowIntro] = useState(!onboarded);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

  // アドレスから ?welcome=1 を消す(再読み込みで2回目が出ないように)
  const clearWelcome = () => router.replace(pathname, { scroll: false });

  // 動きを減らす設定なら、ダイブは出さずに印だけ消す
  useEffect(() => {
    if (!showIntro && welcome && reducedMotion) router.replace(pathname, { scroll: false });
  }, [showIntro, welcome, reducedMotion, router, pathname]);

  if (showIntro) {
    return (
      <Onboarding
        initial={settings}
        onDone={(next) => {
          setShowIntro(false);
          const first = headerKinds(next.order, next.visible)[0];
          router.replace(`/${first}/report?welcome=1`);
          router.refresh();
        }}
      />
    );
  }
  if (welcome && !reducedMotion) return <WelcomeDive kind={kind} onEnd={clearWelcome} />;
  return null;
}
