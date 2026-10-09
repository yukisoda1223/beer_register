"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DrinkIcon } from "@/components/DrinkIcon";
import { KIND_COLORS, KIND_LABELS, type Kind } from "@/lib/kinds";
import { moveItem, saveKindSettings, type KindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

const ROW_HEIGHT = 60;

// 種類の一覧。チェックで表示/非表示、右の ≡ を上下にドラッグして並び替える(一覧の上 = ヘッダーの左端)。
// 変えたらすぐ保存し、ヘッダーに反映する
export function KindSettingsList({ initial }: { initial: KindSettings }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial.order);
  const [visible, setVisible] = useState(initial.visible);
  const [dragging, setDragging] = useState<Kind | null>(null);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ startY: number; startIndex: number; order: Kind[] } | null>(null);

  async function save(nextOrder: Kind[], nextVisible: Kind[]) {
    setError(null);
    const err = await saveKindSettings(createClient(), {
      order: nextOrder,
      visible: nextOrder.filter((k) => nextVisible.includes(k)),
    });
    if (err) setError("Couldn't save. Check your connection and try again.");
    else router.refresh();
  }

  function toggle(k: Kind) {
    const on = visible.includes(k);
    if (on && visible.length === 1) return; // 少なくとも1つは表示する
    const next = on ? visible.filter((v) => v !== k) : [...visible, k];
    setVisible(next);
    save(order, next);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = moveItem(order, from, to);
    setOrder(next);
    save(next, visible);
  }

  function onPointerDown(e: React.PointerEvent, k: Kind) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startIndex: order.indexOf(k), order };
    setDragging(k);
    setOffset(0);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !dragging) return;
    const dy = e.clientY - d.startY;
    const target = Math.max(0, Math.min(d.order.length - 1, d.startIndex + Math.round(dy / ROW_HEIGHT)));
    setOrder(moveItem(d.order, d.startIndex, target));
    // 動かしている行は指に付いてくるように、入れ替わった分を差し引いてずらす
    setOffset(dy - (target - d.startIndex) * ROW_HEIGHT);
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    setOffset(0);
    if (d && order.join() !== d.order.join()) save(order, visible);
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)" aria-label="Drink types">
        {order.map((k, i) => {
          const checked = visible.includes(k);
          const isDragging = dragging === k;
          return (
            <li
              key={k}
              style={{ height: ROW_HEIGHT, transform: isDragging ? `translateY(${offset}px)` : undefined }}
              className={`relative flex items-center gap-3 border-b border-(--color-border) px-4 last:border-b-0 ${
                isDragging ? "z-10 bg-(--color-surface) shadow-md" : "transition-transform"
              }`}
            >
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(k)}
                  disabled={checked && visible.length === 1}
                  className="size-5 shrink-0 cursor-pointer rounded disabled:cursor-not-allowed"
                  style={{ accentColor: KIND_COLORS[k] }}
                />
                <DrinkIcon type={k === "beer" ? "lager" : k} color={KIND_COLORS[k]} size={28} />
                <span className="text-[15px]">{KIND_LABELS[k]}</span>
              </label>
              <button
                type="button"
                aria-label={`Move ${KIND_LABELS[k]}. Use arrow keys to move up or down`}
                onPointerDown={(e) => onPointerDown(e, k)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => {
                  const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
                  if (!step) return;
                  e.preventDefault();
                  move(i, i + step);
                }}
                className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-(--color-text-sub) active:cursor-grabbing"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
                  <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      {visible.length === 1 && <p className="text-[12px] text-(--color-text-sub)">At least one type stays on.</p>}
      {error && (
        <p role="alert" className="text-[12px] text-(--color-danger)">
          {error}
        </p>
      )}
    </div>
  );
}
