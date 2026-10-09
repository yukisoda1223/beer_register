import Link from "next/link";
import { AccountFooter } from "@/components/AccountFooter";
import { Card } from "@/components/Card";
import { DrinkImage } from "@/components/DrinkImage";
import { StarDisplay } from "@/components/StarDisplay";
import { MiniMap } from "@/components/map/MiniMap";
import { MonthCalendar } from "@/components/report/MonthCalendar";
import { YourSummary } from "@/components/report/YourSummary";
import { iconOf, originLabel } from "@/lib/drink";
import { IMAGE_BUCKET } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { categoryBreakdown, countDrinks, favoritesTop5, type StatRecord } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

// 日本時間の今日
function todayJST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// ①Report(仕様書 §7.1)。保存済みの記録だけを集計する
export default async function ReportPage({ params }: PageProps<"/[kind]/report">) {
  const kind = (await params).kind as Kind;
  const supabase = await createClient();
  const { data } = await supabase
    .from("drink_records")
    .select("id, product_id, status, drunk_on, name, category, beer_family, kind, rating, image_path, region, country, sweet_dry, light_rich, serving_temp, created_at")
    .eq("kind", kind)
    .eq("status", "saved");
  const records = (data ?? []) as StatRecord[];

  const today = todayJST();
  const [year, month, day] = today.split("-").map(Number);
  const { unique, total } = countDrinks(records);
  const favorites = favoritesTop5(records, today);
  const styles = categoryBreakdown(records);

  const paths = favorites.flatMap((f) => (f.image_path ? [f.image_path] : []));
  const signed = paths.length ? (await supabase.storage.from(IMAGE_BUCKET).createSignedUrls(paths, 60 * 60)).data : [];
  const imageUrl = (path: string | null) => (path ? signed?.find((s) => s.path === path)?.signedUrl : null);

  return (
    <div className="flex flex-col gap-4">
      <YourSummary kind={kind} />

      <section className="flex items-end justify-between rounded-2xl border border-(--color-border) bg-(--color-surface) px-5 py-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.1em] text-(--color-text-sub) uppercase">Unique Drinks</p>
          <p className="text-[64px] leading-none font-medium tracking-tight tabular-nums text-(--color-accent-text)">{unique}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-[0.1em] text-(--color-text-sub) uppercase">Total Tastings</p>
          <p className="text-[28px] leading-tight font-light tabular-nums">{total}</p>
        </div>
      </section>

      <MonthCalendar records={records} year={year} month={month} today={day} />

      <Card title="Your Favorites Top 5">
        {favorites.length === 0 ? (
          <p className="text-[13px] text-(--color-text-sub)">No ratings in the last six months yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-(--color-border)">
            {favorites.map((d, i) => (
              <li key={d.id}>
                <Link href={`/${kind}/${d.id}`} className="flex min-h-14 items-center gap-3 py-2">
                  <span className="w-4 text-center text-[13px] font-medium text-(--color-text-sub) tabular-nums">{i + 1}</span>
                  <DrinkImage url={imageUrl(d.image_path)} icon={iconOf(d)} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[14px] leading-snug">{d.name}</p>
                    <p className="truncate text-[11px] text-(--color-text-sub)">
                      {[d.category, originLabel(d)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <StarDisplay value={d.rating ?? 0} size={12} />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Map" action={<span className="text-[11px] text-(--color-text-sub)">Tap to expand</span>}>
        <MiniMap kind={kind} />
      </Card>

      <Card title={kind === "beer" ? "Styles" : "Grades"}>
        {styles.total === 0 ? (
          <p className="text-[13px] text-(--color-text-sub)">Nothing logged yet.</p>
        ) : (
          <CategoryDonut categories={styles.items} total={styles.total} />
        )}
      </Card>

      <AccountFooter />
    </div>
  );
}

// 円グラフ(ドーナツ)。中央に銘柄数
function CategoryDonut({ categories, total }: { categories: { label: string; count: number }[]; total: number }) {
  const stops = categories.map((c, i) => {
    const before = categories.slice(0, i).reduce((sum, x) => sum + x.count, 0);
    const start = (before / total) * 100;
    const end = ((before + c.count) / total) * 100;
    return `var(--chart-${i + 1}) ${start}% ${end}%`;
  });

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative size-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label={categories.map((c) => `${c.label} ${c.count}`).join(", ")}
      >
        <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-(--color-surface)">
          <span className="text-[22px] font-light tabular-nums">{total}</span>
          <span className="text-[10px] tracking-wide text-(--color-text-sub) uppercase">drinks</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1.5 text-[12px]">
        {categories.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--chart-${i + 1})` }} />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="tabular-nums text-(--color-text-sub)">
              {c.count} · {Math.round((c.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
