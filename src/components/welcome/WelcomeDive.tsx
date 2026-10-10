"use client";

import { DrinkIcon } from "@/components/DrinkIcon";
import { KIND_COLORS, type Kind } from "@/lib/kinds";

// ログインした直後の演出: 一番左のお酒のグラスが現れ、ズームして中のお酒の色で画面が満たされ、
// そのまま消えてレポートが見える(約1.3秒)。動きを減らす設定の端末では出さない
export function WelcomeDive({ kind, onEnd }: { kind: Kind; onEnd: () => void }) {
  return (
    <div
      className="welcome-dive fixed inset-0 z-50 flex items-center justify-center bg-(--color-bg)"
      aria-hidden
      onAnimationEnd={(e) => e.target === e.currentTarget && onEnd()}
    >
      <div className="welcome-dive__fill absolute inset-0" style={{ background: KIND_COLORS[kind] }} />
      <div className="welcome-dive__glass relative">
        <DrinkIcon type={kind === "beer" ? "lager" : kind} color={KIND_COLORS[kind]} size={96} />
      </div>
    </div>
  );
}
