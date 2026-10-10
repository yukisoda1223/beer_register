import Link from "next/link";
import { SAKE_GRADES } from "@/lib/learn/sake-grades";

// 特定名称の表: 横が「純米系 / 本醸造系」、縦が精米歩合(磨きの度合い)
const ROWS: { label: string; sub: string; junmai: string; honjozo: string }[] = [
  { label: "50%以下", sub: "吟醸造り", junmai: "Junmai Daiginjo", honjozo: "Daiginjo" },
  { label: "60%以下", sub: "吟醸造り", junmai: "Junmai Ginjo", honjozo: "Ginjo" },
  { label: "60%以下", sub: "または特別な製法", junmai: "Tokubetsu Junmai", honjozo: "Tokubetsu Honjozo" },
  { label: "決まりなし / 70%以下", sub: "", junmai: "Junmai", honjozo: "Honjozo" },
];

function Cell({ name, counts }: { name: string; counts: Record<string, number> }) {
  const g = SAKE_GRADES.find((x) => x.name === name)!;
  const n = counts[name] ?? 0;
  return (
    <Link
      href={`/sake/learn/${g.slug}`}
      className={`flex min-h-12 flex-col items-center justify-center rounded-xl border text-center ${
        n > 0 ? "border-(--color-primary) bg-(--color-primary-soft)" : "border-(--color-border)"
      }`}
    >
      <span className="text-[14px] tracking-wide">{g.ja}</span>
      {n > 0 && <span className="text-[10px] text-(--color-accent-text) tabular-nums">{n}杯</span>}
    </Link>
  );
}

export function GradeTable({ counts }: { counts: Record<string, number> }) {
  return (
    <div>
      <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-x-2 text-center">
        <span />
        <div>
          <p className="text-[13px]">純米系</p>
          <p className="text-[10px] text-(--color-text-sub)">米・米麹・水</p>
        </div>
        <div>
          <p className="text-[13px]">本醸造系</p>
          <p className="text-[10px] text-(--color-text-sub)">+ 醸造アルコール</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {ROWS.map((r) => (
          <div key={r.junmai} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-x-2">
            <div>
              <p className="text-[12px] tabular-nums">{r.label}</p>
              {r.sub && <p className="text-[10px] text-(--color-text-sub)">{r.sub}</p>}
            </div>
            <Cell name={r.junmai} counts={counts} />
            <Cell name={r.honjozo} counts={counts} />
          </div>
        ))}
      </div>
      <Link
        href="/sake/learn/futsushu"
        className="mt-2 flex min-h-11 items-center justify-between rounded-xl border border-dashed border-(--color-border) px-4 text-[13px]"
      >
        <span>
          普通酒<span className="ml-2 text-[10px] text-(--color-text-sub)">上のどれにも当てはまらないもの</span>
        </span>
        {(counts.Futsushu ?? 0) > 0 && <span className="text-[10px] text-(--color-accent-text)">{counts.Futsushu}杯</span>}
      </Link>
      <p className="mt-3 text-[12px] leading-relaxed text-(--color-text-sub)">
        この8つが「特定名称酒」。本醸造系の醸造アルコールは白米の重さの10%以下で、香りを引き出しキレを良くするために使う。純米は精米歩合の決まりがなく、本醸造は70%以下。
      </p>
    </div>
  );
}
