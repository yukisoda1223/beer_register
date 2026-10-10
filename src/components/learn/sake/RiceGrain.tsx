// お米のイラスト。点線が玄米(100%)の大きさ、白い部分が削ったあとに残るお米。
// 真ん中の少し白い部分は心白(でんぷんが多い芯)。大きさは面積が精米歩合に比例する目安
const GRAIN = "M0 -30C14 -30 20 -14 20 2C20 18 12 30 0 30C-12 30 -20 18 -20 2C-20 -14 -14 -30 0 -30Z";

export function RiceGrain({ ratio, size = 56, showHull = true }: { ratio: number; size?: number; showHull?: boolean }) {
  const scale = Math.sqrt(ratio / 100);
  return (
    <svg width={size} height={size * 1.3} viewBox="-26 -34 52 68" aria-hidden>
      {showHull && <path d={GRAIN} fill="#EFE6D2" fillOpacity=".55" stroke="#CDBE9C" strokeWidth="1" strokeDasharray="2.5 2.5" />}
      <g transform={`scale(${scale})`}>
        <path d={GRAIN} fill="#FFFDF8" stroke="#D9D0BE" strokeWidth={1 / scale} />
        <ellipse cx="0" cy="2" rx="8" ry="11" fill="#E9EEF0" opacity=".9" />
      </g>
    </svg>
  );
}

// 精米歩合の目盛り: 玄米 → 70% → 60% → 50% → 35%
const STEPS: { ratio: number; label: string; sub: string }[] = [
  { ratio: 100, label: "玄米", sub: "100%" },
  { ratio: 70, label: "70%", sub: "本醸造" },
  { ratio: 60, label: "60%", sub: "吟醸" },
  { ratio: 50, label: "50%", sub: "大吟醸" },
  { ratio: 35, label: "35%", sub: "さらに磨く" },
];

export function PolishScale() {
  return (
    <div>
      <ul className="grid grid-cols-5 items-end">
        {STEPS.map((s) => (
          <li key={s.ratio} className="flex flex-col items-center">
            <RiceGrain ratio={s.ratio} size={46} showHull={s.ratio !== 100} />
            <span className="mt-1 text-[13px] tabular-nums">{s.label}</span>
            <span className="text-[10px] text-(--color-text-sub)">{s.sub}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 text-[10px] tracking-wide text-(--color-text-sub)">
        <span>米のうまみ・コク</span>
        <span className="h-px flex-1 bg-(--color-border)" />
        <span>削るほど</span>
        <span className="h-px flex-1 bg-(--color-border)" />
        <span>華やか・軽やか</span>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-(--color-text-sub)">
        精米歩合は、玄米をどれだけ残したか。60%なら外側を40%削っている。外側のたんぱく質や脂質は雑味のもとになるので、削るほどすっきり華やかに、削らないほど米のうまみが濃くなる。
      </p>
    </div>
  );
}
