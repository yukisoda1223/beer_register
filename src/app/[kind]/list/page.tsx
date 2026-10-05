import Link from "next/link";
import { DrinkIcon } from "@/components/DrinkIcon";
import { SampleNotice } from "@/components/SampleNotice";
import { formatDateShort, iconTypeOf, originLabel } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";
import { SAMPLE_DRINKS } from "@/lib/sample";

// ②一覧。いまはダミー表示(本物は M3 で作る)
export default async function ListPage({ params }: PageProps<"/[kind]/list">) {
  const kind = (await params).kind as Kind;
  const drinks = SAMPLE_DRINKS[kind];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">一覧</h1>
        <div className="flex gap-2">
          <IconButton label="下書き(M3で使えるようになります)" badge={2}>
            <path d="M5 4h10l4 4v12H5z M15 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </IconButton>
          <IconButton label="記録する(M3で使えるようになります)" primary>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </IconButton>
        </div>
      </div>

      <SampleNotice>いまはサンプル表示です。行をタップすると詳細が見られます。＋・下書き・検索はマイルストーン3で使えるようになります。</SampleNotice>

      <div className="overflow-hidden rounded-xl bg-(--color-surface) shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div role="row" className={`${ROW_GRID} bg-(--color-bg) py-2 text-[13px] text-(--color-text-sub)`}>
          <span role="columnheader"><span className="sr-only">画像</span></span>
          <span role="columnheader">日付</span>
          <span role="columnheader">商品名</span>
          <span role="columnheader">産地</span>
          <span role="columnheader">評価</span>
        </div>
        <ul className="divide-y divide-(--color-border)">
          {drinks.map((d) => (
            <li key={d.id}>
              <Link href={`/${kind}/${d.id}`} className={`${ROW_GRID} min-h-14 py-2 active:bg-(--color-bg)`}>
                <DrinkIcon type={iconTypeOf(d)} size={36} />
                <span className="text-[13px] tabular-nums text-(--color-text-sub)">{formatDateShort(d.drunk_on)}</span>
                <span className="line-clamp-2 leading-snug">{d.name}</span>
                <span className="line-clamp-2 text-[13px] leading-snug text-(--color-text-sub)">
                  {originLabel(d) ?? "—"}
                </span>
                <RatingCompact value={d.rating} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// 行の列の幅: 画像・日付・商品名・産地・評価
const ROW_GRID = "grid grid-cols-[36px_36px_minmax(0,1fr)_56px_44px] items-center gap-2 px-3";

// 一覧用の小さな評価表示(★1つ+数字)
function RatingCompact({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[13px] text-(--color-text-sub)">—</span>;
  return (
    <span className="flex items-center gap-0.5 text-[13px] font-bold tabular-nums" aria-label={`5点中${value}点`}>
      <span aria-hidden className="text-(--color-secondary)">★</span>
      {value.toFixed(1)}
    </span>
  );
}

function IconButton({
  label,
  primary,
  badge,
  children,
}: {
  label: string;
  primary?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      title={label}
      className={`relative flex size-11 items-center justify-center rounded-full shadow-sm disabled:cursor-not-allowed ${
        primary ? "bg-(--color-primary) text-(--color-on-primary)" : "bg-(--color-surface) text-(--color-text)"
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>{children}</svg>
      {badge ? (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-(--color-primary) text-[11px] font-bold text-(--color-on-primary)">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
