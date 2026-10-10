import Link from "next/link";
import { notFound } from "next/navigation";
import { BeerGlass } from "@/components/learn/BeerGlass";
import { RangeBar } from "@/components/learn/RangeBar";
import { BEER_STYLES, GLASS_NAMES, beerStyleBySlug, beerStyleColor, treePathOf, type Range } from "@/lib/learn/beer-styles";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return BEER_STYLES.map((s) => ({ kind: "beer", style: s.slug }));
}

const fmt = (r: Range, unit = "") => (r[0] === r[1] ? `${r[0]}${unit}` : `${r[0]}〜${r[1]}${unit}`);

// スタイルの詳しい説明。グラス・色・度数・苦み・温度・合う料理と、自分の記録
export default async function BeerStylePage({ params }: PageProps<"/[kind]/learn/[style]">) {
  const { kind, style } = await params;
  const st = beerStyleBySlug(style);
  if (kind !== "beer" || !st) notFound();

  const supabase = await createClient();
  const { count } = await supabase
    .from("drink_records")
    .select("id", { count: "exact", head: true })
    .eq("kind", "beer")
    .eq("status", "saved")
    .eq("category", st.name);
  const path = treePathOf(st.name);
  const siblings = path?.group.styles.filter((n) => n !== st.name) ?? [];
  const color = beerStyleColor(st);

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-[24px] border border-(--color-border) bg-(--color-surface)">
        <div className="flex justify-center py-8" style={{ background: `linear-gradient(to bottom, color-mix(in srgb, ${color} 14%, var(--color-surface)), var(--color-surface))` }}>
          <BeerGlass glass={st.glass} color={color} foam={st.foam} size={96} id="detail" />
        </div>
        <div className="px-6 pb-6">
          {path && (
            <p className="text-[10px] tracking-[0.2em] text-(--color-text-sub) uppercase">
              {path.family.label}
              {path.group.label && ` · ${path.group.label}`}
            </p>
          )}
          <h1 className="mt-1 text-[28px] font-light tracking-wide">{st.name}</h1>
          <p className="mt-1 text-[13px] text-(--color-text-sub)">{st.summary}</p>
          <p className="mt-4 text-[14px] leading-relaxed">{st.description}</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-(--color-border) bg-(--color-surface) px-6 py-5">
        <dl className="divide-y divide-(--color-border)">
          <Row label="発祥">{st.origin}</Row>
          {st.srm && (
            <Row label="色" sub={`SRM ${fmt(st.srm)}`}>
              <RangeBar range={st.srm} max={40} srm />
            </Row>
          )}
          {st.abv && (
            <Row label="度数" sub={fmt(st.abv, "%")}>
              <RangeBar range={st.abv} max={12} />
            </Row>
          )}
          {st.ibu && (
            <Row label="苦み" sub={`IBU ${fmt(st.ibu)}`}>
              <RangeBar range={st.ibu} max={100} />
            </Row>
          )}
          {!st.abv && <Row label="度数・苦み">ベースのビールによってさまざま</Row>}
          <Row label="グラス">{GLASS_NAMES[st.glass]}</Row>
          <Row label="温度">{st.temp}</Row>
          <Row label="合う料理">{st.pairing}</Row>
        </dl>
      </section>

      <section className="flex items-center justify-between rounded-[24px] border border-(--color-border) bg-(--color-surface) px-6 py-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-(--color-text-sub)">YOUR LOG</p>
          <p className="mt-0.5 text-[15px] font-light">
            {count ? (
              <>
                <span className="text-[22px] tabular-nums">{count}</span> 杯 記録しています
              </>
            ) : (
              "まだ記録がありません"
            )}
          </p>
        </div>
        {count ? (
          <Link
            href={`/beer/list?style=${encodeURIComponent(st.name)}`}
            className="flex min-h-10 items-center gap-1.5 rounded-full bg-(--color-text) px-4 text-[12px] tracking-wide text-(--color-bg)"
          >
            一覧を見る
          </Link>
        ) : (
          <Link href="/beer/new" className="flex min-h-10 items-center rounded-full border border-(--color-border) px-4 text-[12px] tracking-wide">
            記録する
          </Link>
        )}
      </section>

      {siblings.length > 0 && (
        <section className="px-1">
          <p className="text-[10px] tracking-[0.2em] text-(--color-text-sub)">SAME FAMILY</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {siblings.map((n) => {
              const s = BEER_STYLES.find((x) => x.name === n)!;
              return (
                <li key={n}>
                  <Link href={`/beer/learn/${s.slug}`} className="flex min-h-8 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 text-[12px]">
                    <span className="size-2 rounded-full" style={{ background: beerStyleColor(s) }} aria-hidden />
                    {n}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3 py-3">
      <dt className="text-[11px] tracking-wide text-(--color-text-sub)">
        {label}
        {sub && <span className="mt-0.5 block text-[10px] tabular-nums">{sub}</span>}
      </dt>
      <dd className="text-[13px]">{children}</dd>
    </div>
  );
}
