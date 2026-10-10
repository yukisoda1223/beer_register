import Link from "next/link";
import { BEER_TREE, beerStyleByName, beerStyleColor } from "@/lib/learn/beer-styles";

// 系統樹: Beer → Lager / Ale / Other → グループ → スタイル。飲んだことのあるスタイルは濃く、杯数を出す
export function StyleTree({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="text-[13px]">
      <p className="text-[11px] tracking-[0.2em] text-(--color-text-sub)">BEER</p>
      <ol className="mt-2 ml-1.5 border-l border-(--color-border)">
        {BEER_TREE.map((f) => (
          <li key={f.key} className="relative pt-3 pl-5">
            <span className="absolute top-[1.45rem] left-0 h-px w-3.5 bg-(--color-border)" />
            <div className="flex items-baseline gap-2">
              <span className="text-[16px] font-light tracking-wide">{f.label}</span>
              <span className="text-[11px] text-(--color-text-sub)">{f.ja}</span>
            </div>
            <p className="text-[11px] text-(--color-text-sub)">{f.note}</p>
            <ol className="mt-1.5 ml-1 border-l border-(--color-border)">
              {f.groups.map((g) => (
                <li key={g.label || f.key} className="relative py-1.5 pl-4">
                  <span className="absolute top-[1.15rem] left-0 h-px w-2.5 bg-(--color-border)" />
                  {g.label && (
                    <p className="mb-1 text-[10px] tracking-[0.16em] text-(--color-text-sub) uppercase">
                      {g.label}
                      {g.note && <span className="ml-1.5 tracking-normal normal-case">· {g.note}</span>}
                    </p>
                  )}
                  <ul className="flex flex-wrap gap-1.5">
                    {g.styles.map((name) => {
                      const st = beerStyleByName(name)!;
                      const n = counts[name] ?? 0;
                      return (
                        <li key={name}>
                          <Link
                            href={`/beer/learn/${st.slug}`}
                            className={`flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] ${
                              n > 0 ? "border-(--color-text)/40 text-(--color-text)" : "border-(--color-border) text-(--color-text-sub)"
                            }`}
                          >
                            <span className="size-2 rounded-full" style={{ background: beerStyleColor(st) }} aria-hidden />
                            {name}
                            {n > 0 && <span className="text-[10px] text-(--color-accent-text) tabular-nums">{n}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-(--color-text-sub)">数字は記録した杯数。タップで詳しく。</p>
    </div>
  );
}
