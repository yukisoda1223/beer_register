"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Onboarding } from "@/components/welcome/Onboarding";
import type { KindSettings } from "@/lib/settings";

// 設定画面の「使い方をもう一度見る」
export function ReplayIntro({ settings }: { settings: KindSettings }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[13px] text-(--color-accent-text) underline underline-offset-2">
        使い方をもう一度見る
      </button>
      {open && (
        <Onboarding
          initial={settings}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
