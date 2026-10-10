import Link from "next/link";
import { RiceGrain } from "@/components/learn/sake/RiceGrain";
import { SAKE_GRADES, SAKE_GROUPS, type SakeGroup } from "@/lib/learn/sake-grades";

// 図鑑: 特定名称を純米系・本醸造系・普通酒に分けて並べる。お米の絵は精米歩合の目安
export function GradeShelf({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex flex-col gap-5">
      {(Object.keys(SAKE_GROUPS) as SakeGroup[]).map((group) => (
        <div key={group}>
          <p className="text-[10px] tracking-[0.16em] text-(--color-text-sub)">
            {SAKE_GROUPS[group].ja}
            <span className="ml-2 tracking-normal">{SAKE_GROUPS[group].note}</span>
          </p>
          <ul className="mt-1 divide-y divide-(--color-border) border-y border-(--color-border)">
            {SAKE_GRADES.filter((g) => g.group === group).map((g) => (
              <li key={g.slug}>
                <Link href={`/sake/learn/${g.slug}`} className="flex min-h-16 items-center gap-3 py-1">
                  <RiceGrain ratio={g.polishFor} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] tracking-wide">{g.ja}</span>
                    <span className="block truncate text-[11px] text-(--color-text-sub)">{g.summary}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[11px] tabular-nums">{g.polishIsRule ? g.polish.replace("、または特別な製造方法", "") : "—"}</span>
                    <span className="block text-[10px] text-(--color-text-sub)">{g.types.join("・")}</span>
                  </span>
                  {(counts[g.name] ?? 0) > 0 && (
                    <span className="rounded-full bg-(--color-primary-soft) px-2 py-0.5 text-[10px] text-(--color-accent-text) tabular-nums">{counts[g.name]}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
