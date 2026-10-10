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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="はじめに">
      <div className="onboarding-in w-full max-w-[360px] overflow-hidden rounded-3xl bg-(--color-surface) shadow-xl">
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
            {/* 1枚目: よく飲むお酒 */}
            <section className="w-full shrink-0 px-6 pt-8 pb-4" aria-hidden={page !== 0}>
              <h2 className="text-center text-[19px] font-medium tracking-tight">よく飲むお酒は何ですか?</h2>
              <p className="mt-1.5 text-center text-[12px] text-(--color-text-sub)">選んだお酒が上に並びます。あとから「+」で変えられます。</p>
              <ul className="mt-5 grid grid-cols-2 gap-2">
                {initial.order.map((k) => {
                  const on = visible.includes(k);
                  return (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-pressed={on}
                        tabIndex={page === 0 ? 0 : -1}
                        className="flex min-h-14 w-full items-center gap-2.5 rounded-2xl border-2 px-3 text-left text-[14px] transition-colors"
                        style={{ borderColor: on ? KIND_COLORS[k] : "var(--color-border)", background: on ? `color-mix(in srgb, ${KIND_COLORS[k]} 10%, transparent)` : undefined }}
                      >
                        <DrinkIcon type={k === "beer" ? "lager" : k} color={KIND_COLORS[k]} size={30} />
                        <span className="flex-1">{KIND_LABELS[k]}</span>
                        <span
                          className="flex size-5 items-center justify-center rounded-md border-2 text-white"
                          style={{ borderColor: on ? KIND_COLORS[k] : "var(--color-border)", background: on ? KIND_COLORS[k] : undefined }}
                          aria-hidden
                        >
                          {on && (
                            <svg width="12" height="12" viewBox="0 0 12 12">
                              <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
              <section key={sl.title} className="w-full shrink-0 px-6 pt-8 pb-4" aria-hidden={page !== i + 1}>
                <div className="flex justify-center">{sl.art}</div>
                <h2 className="mt-5 text-center text-[19px] font-medium tracking-tight">{sl.title}</h2>
                <p className="mt-2 text-center text-[13px] leading-relaxed text-(--color-text-sub)">{sl.text}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-4 flex justify-center gap-1.5" aria-hidden>
            {Array.from({ length: last + 1 }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === page ? "w-5 bg-(--color-text)" : "w-1.5 bg-(--color-border)"}`} />
            ))}
          </div>
          {error && (
            <p role="alert" className="mb-2 text-center text-[12px] text-(--color-danger)">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            {page > 0 && (
              <button type="button" onClick={() => go(page - 1)} className="min-h-12 flex-1 rounded-full border border-(--color-border) text-[14px]">
                戻る
              </button>
            )}
            {page < last ? (
              <button type="button" onClick={() => go(page + 1)} className="min-h-12 flex-[2] rounded-full bg-(--color-text) text-[14px] font-medium text-(--color-bg)">
                次へ
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="min-h-12 flex-[2] rounded-full bg-(--color-text) text-[14px] font-medium text-(--color-bg) disabled:opacity-60"
              >
                {saving ? "保存しています…" : "はじめる"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// できることのイラスト(自作の SVG)
const MapArt = (
  <svg width="200" height="130" viewBox="0 0 200 130" aria-hidden>
    <rect width="200" height="130" rx="18" fill="var(--color-bg)" />
    <path d="M30 95c10-30 30-45 55-40s30-25 55-28 35 20 30 45-30 35-60 30-40 15-60 10-28-2-20-17z" fill="var(--color-empty)" />
    {[
      [70, 62, "#E7B447"],
      [118, 48, "#829DA5"],
      [140, 82, "#B95759"],
      [92, 90, "#98633D"],
    ].map(([x, y, c]) => (
      <g key={`${x}`} transform={`translate(${x} ${y})`}>
        <path d="M0 0c-8-9-12-14-12-20a12 12 0 0 1 24 0c0 6-4 11-12 20z" fill={c as string} />
        <circle cy="-20" r="4.5" fill="#fff" />
      </g>
    ))}
  </svg>
);

const TasteArt = (
  <svg width="200" height="130" viewBox="0 0 200 130" aria-hidden>
    <rect width="200" height="130" rx="18" fill="var(--color-bg)" />
    <defs>
      <radialGradient id="onb-blob">
        <stop offset="0" stopColor="var(--color-primary)" stopOpacity=".55" />
        <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="128" cy="50" rx="58" ry="42" fill="url(#onb-blob)" />
    <path d="M100 12v106M16 65h168" stroke="var(--color-border)" strokeDasharray="3 4" />
    {[
      [132, 44, 7],
      [146, 60, 6],
      [118, 36, 5],
      [60, 90, 4],
      [80, 52, 4],
    ].map(([x, y, r]) => (
      <circle key={`${x}`} cx={x} cy={y} r={r} fill="var(--color-accent-text)" stroke="#fff" strokeWidth="1.5" />
    ))}
    <rect x="22" y="14" width="66" height="26" rx="13" fill="#fff" stroke="var(--color-border)" />
    <path d="M34 27h42" stroke="var(--color-text-sub)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
  </svg>
);

const SLIDES = [
  { title: "飲んだお酒が地図に", text: "産地がマップにピンで並びます。日本酒は都道府県の制覇も。", art: MapArt },
  { title: "AI が好みを分析", text: "味のマップと Your Summary で、あなたの好みの傾向が分かります。", art: TasteArt },
];
