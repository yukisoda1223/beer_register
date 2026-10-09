// ★評価の表示だけを行う部品(入力用の部品は M3 で作る)
export function StarDisplay({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, value - (i - 1)));
          return <Star key={i} fill={fill} size={size} />;
        })}
      </span>
      <span className="text-[12px] tabular-nums text-(--color-text-sub)">{value.toFixed(1)}</span>
    </span>
  );
}

function Star({ fill, size }: { fill: number; size: number }) {
  const path = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={path} fill="var(--color-border)" />
      <path d={path} fill="var(--color-secondary)" style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }} />
    </svg>
  );
}
