"use client";

// 5段階スライダー(甘口〜辛口、淡麗〜濃醇)。未入力にも戻せる
export function Slider5({
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
        <span className="w-10 shrink-0 text-[13px]">{left}</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value ?? 3}
          aria-label={label}
          aria-valuetext={value == null ? "未入力" : `${value}`}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => value == null && onChange(3)}
          className={`h-11 flex-1 accent-(--color-primary) ${value == null ? "opacity-40" : ""}`}
        />
        <span className="w-10 shrink-0 text-right text-[13px]">{right}</span>
      </div>
      <div className="flex justify-between px-12 text-[13px] text-(--color-text-sub)">
        <span>{value == null ? "未入力" : `${value} / 5`}</span>
        {value != null && (
          <button type="button" onClick={() => onChange(null)} className="underline">
            未入力に戻す
          </button>
        )}
      </div>
    </div>
  );
}
