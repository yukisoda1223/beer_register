import Link from "next/link";
import { Card } from "@/components/Card";
import type { Kind } from "@/lib/kinds";
import { JAPAN_TILES, prefectureCounts, prefectureLevel } from "@/lib/prefectures";
import type { StatRecord } from "@/lib/stats";

// 濃さごとの色(カレンダーと同じく、アクセント色と空のマスの色を混ぜる)
const LEVEL_BG = [
  "var(--color-empty)",
  "color-mix(in srgb, var(--color-primary) 35%, var(--color-empty))",
  "color-mix(in srgb, var(--color-primary) 55%, var(--color-empty))",
  "color-mix(in srgb, var(--color-primary) 80%, var(--color-empty))",
  "var(--color-accent-text)",
];
const LEGEND = ["1", "2", "3–4", "5+"];

// 都道府県の制覇マップ。飲んだ銘柄が多い県ほど濃い。タップでその県の一覧へ
export function PrefectureMap({ kind, records }: { kind: Kind; records: StatRecord[] }) {
  const { counts, covered } = prefectureCounts(records);
  return (
    <Card title="Prefectures">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
        {/* 左上の空いている場所に、制覇した数を出す */}
        <div className="flex flex-col justify-start" style={{ gridColumn: "1 / 10", gridRow: "1 / 5" }}>
          <p className="text-[40px] leading-none font-medium tracking-tight tabular-nums text-(--color-accent-text)">
            {covered}
            <span className="text-[18px] font-light text-(--color-text-sub)"> / 47</span>
          </p>
          <p className="mt-1 text-[11px] text-(--color-text-sub)">{Math.round((covered / 47) * 100)}% of Japan</p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-(--color-text-sub)">
            {LEGEND.map((l, i) => (
              <span key={l} className="flex items-center gap-0.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: LEVEL_BG[i + 1] }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        {JAPAN_TILES.map((t) => {
          const count = counts[t.name] ?? 0;
          const level = prefectureLevel(count);
          const style = { gridColumn: t.c + 1, gridRow: t.r + 1, background: LEVEL_BG[level] };
          const text = level === 4 ? "font-medium text-white" : level > 0 ? "font-medium text-(--color-text)" : "text-(--color-text-sub)/70";
          const className = `flex aspect-square items-center justify-center rounded-[4px] text-[8.5px] leading-none ${text}`;
          const label = `${t.name}: ${count} ${count === 1 ? "drink" : "drinks"}`;
          return count > 0 ? (
            <Link key={t.name} href={`/${kind}/list?region=${t.name}`} aria-label={label} title={label} className={className} style={style}>
              {t.label}
            </Link>
          ) : (
            <span key={t.name} aria-label={label} title={label} className={className} style={style}>
              {t.label}
            </span>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-(--color-text-sub)">Tap a prefecture to see what you drank from there.</p>
    </Card>
  );
}
