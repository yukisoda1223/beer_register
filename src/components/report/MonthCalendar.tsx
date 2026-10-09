import { heatLevel, monthCalendar, type StatRecord } from "@/lib/stats";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// 濃さごとの色(テーマのアクセントと、空のマスの色を混ぜる)
const LEVEL_BG = [
  "var(--color-empty)",
  "color-mix(in srgb, var(--color-primary) 40%, var(--color-empty))",
  "color-mix(in srgb, var(--color-primary) 70%, var(--color-empty))",
  "var(--color-primary)",
];

// 今月のカレンダー(GitHub の草のようなマス)。飲んだ日はアクセント色、回数が多いほど濃い
export function MonthCalendar({ records, year, month, today }: { records: StatRecord[]; year: number; month: number; today: number }) {
  const { offset, days, total } = monthCalendar(records, year, month);
  return (
    <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-medium tracking-tight">{MONTHS[month - 1]}</h2>
        <span className="text-[12px] text-(--color-text-sub)">
          {total} {total === 1 ? "tasting" : "tastings"}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`${MONTHS[month - 1]} ${year}`}>
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
            className={`aspect-square rounded-[5px] ${i + 1 === today ? "ring-1 ring-(--color-text-sub) ring-offset-1" : ""}`}
            style={{ background: LEVEL_BG[heatLevel(count)] }}
          />
        ))}
      </div>
    </section>
  );
}
