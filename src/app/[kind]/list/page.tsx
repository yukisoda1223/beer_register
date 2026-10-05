import { DrinkIcon } from "@/components/DrinkIcon";
import { SampleNotice } from "@/components/SampleNotice";
import { StarDisplay } from "@/components/StarDisplay";
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

      <SampleNotice>いまはサンプル表示です。＋・下書き・検索はマイルストーン3で使えるようになります。</SampleNotice>

      <div className="overflow-hidden rounded-xl bg-(--color-surface) shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <table className="w-full table-fixed text-left">
          <thead className="bg-(--color-bg) text-[13px] text-(--color-text-sub)">
            <tr>
              <th className="w-12 py-2 pl-3 font-normal"><span className="sr-only">画像</span></th>
              <th className="w-16 py-2 font-normal">日付</th>
              <th className="py-2 font-normal">商品名</th>
              <th className="w-28 py-2 pr-3 font-normal">評価</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {drinks.map((d) => (
              <tr key={d.id} className="h-14">
                <td className="py-2 pl-3"><DrinkIcon type={d.icon} size={36} /></td>
                <td className="py-2 text-[13px] tabular-nums text-(--color-text-sub)">{formatDate(d.drunkOn)}</td>
                <td className="py-2 pr-2"><span className="line-clamp-2 leading-snug">{d.name}</span></td>
                <td className="py-2 pr-3"><StarDisplay value={d.rating} size={12} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
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
