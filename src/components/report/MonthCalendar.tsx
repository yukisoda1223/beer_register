"use client";

import { useRef, useState } from "react";
import { heatLevel, monthCalendar } from "@/lib/stats";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// 濃さごとの色(テーマのアクセントと、空のマスの色を混ぜる)
const LEVEL_BG = [
  "var(--color-empty)",
  "color-mix(in srgb, var(--color-primary) 40%, var(--color-empty))",
  "color-mix(in srgb, var(--color-primary) 70%, var(--color-empty))",
  "var(--color-primary)",
];

// 月を数字1つで表す(年 × 12 + 月 − 1)。前後の月への移動が足し引きでできる
const toIndex = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
const SWIPE = 50; // これ以上横に動かしたら月を切り替える(px)

// 月のカレンダー(GitHub の草のようなマス)。飲んだ日はアクセント色、回数が多いほど濃い。
// < > か左右のスワイプで前後の月へ。最初に記録した月より前・今月より先には進まない
export function MonthCalendar({ dates, today }: { dates: string[]; today: string }) {
  const last = toIndex(today);
  const first = dates.length ? Math.min(last, ...dates.map(toIndex)) : last;
  const [index, setIndex] = useState(last);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);
  const [dragX, setDragX] = useState(0);
  const drag = useRef<{ x: number; y: number; dx: number; horizontal: boolean | null } | null>(null);

  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  const { offset, days, total } = monthCalendar(
    dates.map((d) => ({ status: "saved" as const, drunk_on: d })),
    year,
    month,
  );
  const todayDay = index === last ? Number(today.slice(8, 10)) : null;
  const title = `${MONTHS[month - 1]}${year !== Number(today.slice(0, 4)) ? ` ${year}` : ""}`;
  const canPrev = index > first;
  const canNext = index < last;

  function go(step: -1 | 1) {
    if ((step < 0 && !canPrev) || (step > 0 && !canNext)) return;
    setDirection(step > 0 ? "next" : "prev");
    setIndex((i) => i + step);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, horizontal: null };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // 最初に動いた向きで、横のスワイプか縦のスクロールかを決める
    if (d.horizontal == null && Math.abs(dx) + Math.abs(dy) > 8) d.horizontal = Math.abs(dx) > Math.abs(dy);
    if (!d.horizontal) return;
    d.dx = dx;
    // 端の月では、引っぱっても少ししか動かない
    const blocked = (dx > 0 && !canPrev) || (dx < 0 && !canNext);
    setDragX(blocked ? dx / 4 : dx);
  }
  function onPointerEnd() {
    const dx = drag.current?.dx ?? 0;
    drag.current = null;
    setDragX(0);
    if (dx <= -SWIPE) go(1);
    else if (dx >= SWIPE) go(-1);
  }

  const arrow = "flex size-9 items-center justify-center rounded-full text-(--color-text-sub) hover:bg-(--color-bg) disabled:opacity-25";

  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous month" onClick={() => go(-1)} disabled={!canPrev} className={arrow}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="min-w-28 text-center text-[15px] font-medium tracking-tight" aria-live="polite">
            {title}
          </h2>
          <button type="button" aria-label="Next month" onClick={() => go(1)} disabled={!canNext} className={arrow}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <span className="text-[12px] text-(--color-text-sub)">
          {total} {total === 1 ? "tasting" : "tastings"}
        </span>
      </div>
      <div
        className="touch-pan-y overflow-hidden select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          key={index}
          className={`grid grid-cols-7 gap-1.5 ${dragX === 0 ? "transition-transform duration-200" : ""} ${
            direction === "next" ? "calendar-in-next" : direction === "prev" ? "calendar-in-prev" : ""
          }`}
          style={{ transform: dragX ? `translateX(${dragX}px)` : undefined }}
          role="grid"
          aria-label={`${MONTHS[month - 1]} ${year}`}
        >
          {WEEK.map((w, i) => (
            <span key={i} className="text-center text-[10px] tracking-wide text-(--color-text-sub)" aria-hidden>
              {w}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`blank-${i}`} aria-hidden />
          ))}
          {days.map((count, i) => (
            <span
              key={i}
              role="gridcell"
              aria-label={`${MONTHS[month - 1]} ${i + 1}: ${count} ${count === 1 ? "tasting" : "tastings"}`}
              title={`${i + 1}: ${count}`}
              className={`aspect-square rounded-[5px] ${i + 1 === todayDay ? "ring-1 ring-(--color-text-sub) ring-offset-1" : ""}`}
              style={{ background: LEVEL_BG[heatLevel(count)] }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
