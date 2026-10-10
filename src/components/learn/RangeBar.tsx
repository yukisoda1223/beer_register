import { SRM_MAX, SRM_STOPS, type Range } from "@/lib/learn/beer-styles";

// 目安の範囲を帯で見せる(度数・苦み・色)。色(SRM)は帯をビールの色のグラデーションにする
export function RangeBar({ range, max, srm }: { range: Range; max: number; srm?: boolean }) {
  const left = (range[0] / max) * 100;
  const width = Math.max(2, ((range[1] - range[0]) / max) * 100);
  const gradient = `linear-gradient(to right, ${SRM_STOPS.map(([v, c]) => `${c} ${(v / SRM_MAX) * 100}%`).join(", ")})`;
  return (
    <div className="relative h-2.5 w-full rounded-full bg-(--color-empty)" style={srm ? { background: gradient, opacity: 0.9 } : undefined}>
      {srm ? (
        <>
          {/* 範囲の外を白くかぶせて、範囲だけ見せる */}
          <span className="absolute inset-y-0 left-0 rounded-l-full bg-(--color-surface)/80" style={{ width: `${left}%` }} />
          <span className="absolute inset-y-0 right-0 rounded-r-full bg-(--color-surface)/80" style={{ width: `${100 - left - width}%` }} />
          <span className="absolute -inset-y-0.5 rounded-full border border-(--color-text)/50" style={{ left: `${left}%`, width: `${width}%` }} />
        </>
      ) : (
        <span className="absolute inset-y-0 rounded-full bg-(--color-primary)" style={{ left: `${left}%`, width: `${width}%` }} />
      )}
    </div>
  );
}
