import { Card } from "@/components/Card";
import { DrinkIcon } from "@/components/DrinkIcon";
import { SampleNotice } from "@/components/SampleNotice";
import { StarDisplay } from "@/components/StarDisplay";
import { KIND_LABELS, type Kind } from "@/lib/kinds";
import { SAMPLE_AI_COMMENT, SAMPLE_CATEGORY_COUNTS, SAMPLE_DRINKS } from "@/lib/sample";

// ①レポート。いまはダミー表示(本物の集計は M7・M8 で作る)
export default async function ReportPage({ params }: PageProps<"/[kind]/report">) {
  const kind = (await params).kind as Kind;
  const top5 = [...SAMPLE_DRINKS[kind]].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const categories = SAMPLE_CATEGORY_COUNTS[kind];
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <SampleNotice>いまはサンプル表示です。記録ができるようになると本物の集計に変わります。</SampleNotice>

      <Card title="AIのひとこと">
        <p className="leading-relaxed">{SAMPLE_AI_COMMENT[kind]}</p>
      </Card>

      <Card title="今まで飲んだ銘柄の数">
        <p className="text-center">
          <span className="text-5xl font-bold tabular-nums text-(--color-accent-text)">{total}</span>
          <span className="ml-1 text-lg">銘柄</span>
        </p>
      </Card>

      <Card title="過去6か月の高評価 Top5">
        <ol className="flex flex-col divide-y divide-(--color-border)">
          {top5.map((d, i) => (
            <li key={d.id} className="flex min-h-14 items-center gap-3 py-2">
              <span className="w-5 text-center text-lg font-bold text-(--color-accent-text)">{i + 1}</span>
              <DrinkIcon type={d.icon} size={40} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-bold leading-snug">{d.name}</p>
                <p className="text-[13px] text-(--color-text-sub)">{d.category}</p>
              </div>
              <StarDisplay value={d.rating} size={14} />
            </li>
          ))}
        </ol>
      </Card>

      <Card
        title="マップ"
        action={<span className="text-[13px] text-(--color-text-sub)">タップで全画面(M6で対応)</span>}
      >
        <div className="flex h-[180px] items-center justify-center rounded-lg bg-(--color-bg) text-[13px] text-(--color-text-sub)">
          {KIND_LABELS[kind]}の醸造所の地図がここに出ます
        </div>
      </Card>

      <Card title="カテゴリの内訳">
        <CategoryDonut categories={categories} total={total} />
      </Card>
    </div>
  );
}

// 円グラフ(仮)。本番は Recharts で作り直す
function CategoryDonut({ categories, total }: { categories: { label: string; count: number }[]; total: number }) {
  const stops = categories.map((c, i) => {
    const before = categories.slice(0, i).reduce((sum, x) => sum + x.count, 0);
    const start = (before / total) * 100;
    const end = ((before + c.count) / total) * 100;
    return `var(--chart-${i + 1}) ${start}% ${end}%`;
  });

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-(--color-surface)">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-[13px] text-(--color-text-sub)">件</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1 text-[13px]">
        {categories.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-sm" style={{ background: `var(--chart-${i + 1})` }} />
            <span className="flex-1 truncate">{c.label}</span>
            <span className="tabular-nums text-(--color-text-sub)">
              {c.count}件 {Math.round((c.count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
