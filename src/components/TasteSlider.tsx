"use client";

import { SCALE_MAX, SCALE_MIN, formatScale } from "@/lib/kind-config";

// 味のスライダー。真ん中が 0(ふつう)、−2.5〜+2.5 の 0.5 刻み。
// 触るまでは「未入力」(薄い表示)で、Clear で未入力に戻せる
export function TasteSlider({
  label,
  left,
  right,
  value,
  onChange,
}: {
  label: string;
  left: string;
  right: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="min-w-10 shrink-0 text-[12px] text-(--color-text-sub)">{left}</span>
        <div className="relative flex-1">
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={0.5}
            value={value ?? 0}
            aria-label={label}
            aria-valuetext={value == null ? "未入力" : `${formatScale(value)}(${left} ${SCALE_MIN} 〜 ${right} +${SCALE_MAX})`}
            onChange={(e) => onChange(Number(e.target.value))}
            onPointerDown={() => value == null && onChange(0)}
            className={`h-11 w-full accent-(--color-primary) ${value == null ? "opacity-40" : ""}`}
          />
          {/* 真ん中(0)の目印 */}
          <span className="pointer-events-none absolute top-1/2 left-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-(--color-text-sub)/50" aria-hidden />
        </div>
        <span className="min-w-10 shrink-0 text-right text-[12px] text-(--color-text-sub)">{right}</span>
      </div>
      <div className="flex justify-between px-12 text-[11px] text-(--color-text-sub)">
        <span className="tabular-nums">{value == null ? "未入力" : formatScale(value)}</span>
        {value != null && (
          <button type="button" onClick={() => onChange(null)} className="underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
