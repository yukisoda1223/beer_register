"use client";

import { useRef, useState } from "react";
import { nextRatingOnTap, ratingFromPosition, stepRating } from "@/lib/rating";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

// ★5段階(0.5刻み)の入力。左半分で0.5、右半分で1.0。同じ値をもう一度タップで未入力。横にスライドしても選べる
export function StarRating({
  label,
  value,
  onChange,
  invalid,
  size = 36,
  id,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  invalid?: boolean;
  size?: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startValue: number | null; moved: boolean } | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value ?? 0;

  function valueAt(clientX: number) {
    const rect = ref.current!.getBoundingClientRect();
    return ratingFromPosition(clientX - rect.left, rect.width);
  }

  return (
    <div className="flex items-center gap-3">
      <div
        ref={ref}
        id={id}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value == null ? "Not set" : `${value}`}
        aria-invalid={invalid || undefined}
        className={`flex cursor-pointer touch-pan-y rounded-lg outline-offset-2 select-none ${invalid ? "ring-2 ring-red-600" : ""}`}
        onPointerDown={(e) => {
          ref.current?.setPointerCapture(e.pointerId);
          drag.current = { startValue: value, moved: false };
          setPreview(valueAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const v = valueAt(e.clientX);
          if (v !== preview) {
            drag.current.moved = true;
            setPreview(v);
          }
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const v = valueAt(e.clientX);
          onChange(drag.current.moved ? v : nextRatingOnTap(drag.current.startValue, v));
          drag.current = null;
          setPreview(null);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setPreview(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(stepRating(value, 0.5));
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(stepRating(value, -0.5));
          else if (e.key === "Delete" || e.key === "Backspace") onChange(null);
          else return;
          e.preventDefault();
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, shown - (i - 1)));
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden className="pointer-events-none">
              <path d={STAR} fill="var(--color-border)" />
              <path d={STAR} fill="var(--color-secondary)" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
            </svg>
          );
        })}
      </div>
      <span className="w-8 text-right text-[13px] tabular-nums text-(--color-text-sub)">{value == null ? "—" : value.toFixed(1)}</span>
    </div>
  );
}
