"use client";

import { useRef, useState } from "react";
import { DrinkIcon } from "@/components/DrinkIcon";
import { KIND_COLORS, KIND_LABELS, type Kind } from "@/lib/kinds";
import { finishOnboarding, type KindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

const SWIPE = 50;

// 初回の使い方紹介。画面の中央にカードを出し、横にめくっていく。
// 1枚目でよく飲むお酒を選び(ヘッダーに出す種類になる)、2・3枚目でできることを紹介する
export function Onboarding({ initial, onDone }: { initial: KindSettings; onDone: (settings: KindSettings) => void }) {
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState<Kind[]>(initial.visible);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; dx: number; horizontal: boolean | null } | null>(null);
  const [dragX, setDragX] = useState(0);
  const last = SLIDES.length; // 0 = お酒を選ぶ、1〜 = できること

  function toggle(k: Kind) {
    setVisible((v) => (v.includes(k) ? (v.length === 1 ? v : v.filter((x) => x !== k)) : [...v, k]));
  }

  function go(next: number) {
    setPage(Math.max(0, Math.min(last, next)));
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const settings = { order: initial.order, visible: initial.order.filter((k) => visible.includes(k)) };
    const err = await finishOnboarding(createClient(), settings);
    setSaving(false);
    if (err) return setError("保存できませんでした。通信を確認して、もう一度お試しください。");
    onDone(settings);
  }

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, horizontal: null };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.horizontal == null && Math.abs(dx) + Math.abs(dy) > 8) {
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (d.horizontal) e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.horizontal) return;
    d.dx = dx;
    setDragX(dx);
  }
  function onPointerEnd() {
    const dx = drag.current?.dx ?? 0;
    drag.current = null;
    setDragX(0);
    if (dx <= -SWIPE) go(page + 1);
    else if (dx >= SWIPE) go(page - 1);
  }

  const step = `${String(page + 1).padStart(2, "0")} / ${String(last + 1).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="はじめに">
      <div className="onboarding-in w-full max-w-[360px] overflow-hidden rounded-[28px] bg-(--color-surface) shadow-2xl">
        {/* 進み具合: 細い線と 01 / 03 */}
        <div className="flex items-center gap-3 px-7 pt-6">
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: last + 1 }, (_, i) => (
              <span key={i} className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${i <= page ? "bg-(--color-text)" : "bg-(--color-border)"}`} />
            ))}
          </div>
          <span className="text-[10px] tracking-[0.2em] text-(--color-text-sub) tabular-nums">{step}</span>
        </div>

        <div
          className="touch-pan-y overflow-hidden select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div
            className={`flex ${dragX === 0 ? "transition-transform duration-300 ease-out" : ""}`}
            style={{ transform: `translateX(calc(${-page * 100}% + ${dragX}px))` }}
          >
            {/* 1枚目: よく飲むお酒(縦に1列) */}
            <section className="w-full shrink-0 px-7 pt-7 pb-2" aria-hidden={page !== 0}>
              <h2 className="text-[20px] font-light tracking-wide">よく飲むお酒は?</h2>
              <p className="mt-1.5 text-[12px] whitespace-nowrap text-(--color-text-sub)">選んだお酒が上に並びます</p>
              <ul className="mt-5 divide-y divide-(--color-border) border-y border-(--color-border)">
                {initial.order.map((k) => {
                  const on = visible.includes(k);
                  return (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-pressed={on}
                        tabIndex={page === 0 ? 0 : -1}
                        className="flex min-h-13 w-full items-center gap-3 text-left"
                      >
                        <DrinkIcon type={k === "beer" ? "lager" : k} color={KIND_COLORS[k]} size={28} />
                        <span className={`flex-1 text-[15px] tracking-wide transition-colors ${on ? "text-(--color-text)" : "text-(--color-text-sub)"}`}>{KIND_LABELS[k]}</span>
                        <span
                          className="flex size-5 items-center justify-center rounded-full border text-white transition-colors"
                          style={{ borderColor: on ? KIND_COLORS[k] : "var(--color-border)", background: on ? KIND_COLORS[k] : undefined }}
                          aria-hidden
                        >
                          {on && (
                            <svg width="10" height="10" viewBox="0 0 12 12">
                              <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* 2枚目〜: できること */}
            {SLIDES.map((sl, i) => (
              <section key={sl.title} className="flex w-full shrink-0 flex-col px-7 pt-7 pb-2" aria-hidden={page !== i + 1}>
                <h2 className="text-[20px] font-light tracking-wide">{sl.title}</h2>
                <p className="mt-1.5 text-[12px] whitespace-nowrap text-(--color-text-sub)">{sl.text}</p>
                {/* 1枚目(お酒の一覧)と同じ高さいっぱいにイラストを置く */}
                <div className="mt-5 flex flex-1 [&>svg]:h-full [&>svg]:w-full">{sl.art}</div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-7 pt-5 pb-7">
          {error ? (
            <p role="alert" className="text-[11px] text-(--color-danger)">
              {error}
            </p>
          ) : page > 0 ? (
            <button type="button" onClick={() => go(page - 1)} className="min-h-11 text-[13px] tracking-wide text-(--color-text-sub)">
              戻る
            </button>
          ) : (
            <span />
          )}
          {page < last ? (
            <button
              type="button"
              onClick={() => go(page + 1)}
              className="flex min-h-11 items-center gap-2 rounded-full bg-(--color-text) pr-4 pl-5 text-[13px] tracking-wide text-(--color-bg)"
            >
              次へ
              <Arrow />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="flex min-h-11 items-center gap-2 rounded-full bg-(--color-text) pr-4 pl-5 text-[13px] tracking-wide text-(--color-bg) disabled:opacity-60"
            >
              {saving ? "保存中…" : "はじめる"}
              <Arrow />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// できることのイラスト(自作の線画)
const MapArt = (
  <svg viewBox="0 0 296 266" preserveAspectRatio="xMidYMid meet" aria-hidden>
    <rect x=".5" y=".5" width="295" height="265" rx="16" fill="var(--color-bg)" stroke="var(--color-border)" />
    {/* 等高線のような細い線 */}
    {[0, 1, 2].map((i) => (
      <path
        key={i}
        d={`M${30 + i * 8} ${170 - i * 6}c22-46 60-62 98-48s50-30 86-26 40 34 22 60-56 30-92 24-70 8-114-10z`}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1"
      />
    ))}
    {[
      [96, 128, "#E7B447"],
      [168, 110, "#829DA5"],
      [206, 150, "#B95759"],
      [132, 160, "#98633D"],
    ].map(([x, y, c]) => (
      <g key={`${x}`}>
        <circle cx={x} cy={y} r="12" fill={c as string} opacity=".15" />
        <circle cx={x} cy={y} r="4.5" fill={c as string} />
      </g>
    ))}
  </svg>
);

const TasteArt = (
  <svg viewBox="0 0 296 266" preserveAspectRatio="xMidYMid meet" aria-hidden>
    <defs>
      <radialGradient id="onb-blob">
        <stop offset="0" stopColor="var(--color-primary)" stopOpacity=".45" />
        <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x=".5" y=".5" width="295" height="265" rx="16" fill="var(--color-bg)" stroke="var(--color-border)" />
    <ellipse cx="200" cy="92" rx="76" ry="62" fill="url(#onb-blob)" />
    <path d="M148 20v226M20 133h256" stroke="var(--color-border)" strokeWidth="1" />
    {[
      [204, 84, 6.5],
      [228, 106, 5.5],
      [184, 68, 4.5],
      [92, 196, 3.5],
      [114, 104, 3.5],
      [70, 150, 3],
    ].map(([x, y, r]) => (
      <circle key={`${x}`} cx={x} cy={y} r={r} fill="var(--color-accent-text)" />
    ))}
  </svg>
);

const SLIDES = [
  { title: "飲んだお酒を地図に", text: "産地がマップにピンで並びます", art: MapArt },
  { title: "AI が好みを分析", text: "好みの傾向が、マップと文章でわかります", art: TasteArt },
];
