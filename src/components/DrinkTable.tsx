"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DrinkImage } from "@/components/DrinkImage";
import { formatDateShort, iconTypeOf, originLabel, type Drink } from "@/lib/drink";
import { PAGE_SIZE, errorMessage, fetchDrinkPage, signedImageUrls, type ListQuery } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { BEER_CATEGORIES, SAKE_CATEGORIES } from "@/lib/masters";
import { createClient } from "@/lib/supabase/client";

const MIN_RATINGS = [3, 3.5, 4, 4.5];

// 一覧・下書き一覧の表。検索・絞り込み・並び替えと、下までスクロールしたら続きを読む
export function DrinkTable({ kind, status }: { kind: Kind; status: "draft" | "saved" }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sort, setSort] = useState<ListQuery["sort"]>("date");

  const [items, setItems] = useState<Drink[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // 検索欄は打ち終わってから少し待って探す
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query: ListQuery = useMemo(
    () => ({ kind, status, search: debouncedSearch, category, minRating, sort }),
    [kind, status, debouncedSearch, category, minRating, sort],
  );
  const queryKey = JSON.stringify(query);

  // 条件が変わったら最初から読み直す(ページ番号は表示中の条件ごとに持つ)
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  if (loadedKey !== queryKey) {
    setLoadedKey(queryKey);
    setItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    // ブラウザで動き出してから作る(ビルド時の事前描画では作らない)
    const supabase = createClient();
    fetchDrinkPage(supabase, query, page)
      .then(async (rows) => {
        const urls = await signedImageUrls(supabase, rows.flatMap((r) => (r.image_path ? [r.image_path] : [])));
        if (cancelled) return;
        setItems((prev) => (page === 0 ? rows : [...prev, ...rows]));
        setImageUrls((prev) => ({ ...prev, ...urls }));
        setHasMore(rows.length === PAGE_SIZE);
        setError(null);
      })
      .catch(() => !cancelled && setError(errorMessage("読み込めませんでした。")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, page]);

  // 一番下が見えたら次の20件
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        setPage((p) => p + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const filtered = debouncedSearch !== "" || category !== "" || minRating != null;
  const categories = kind === "beer" ? BEER_CATEGORIES.map((c) => c.label) : SAKE_CATEGORIES;
  const rowHref = (d: Drink) => (status === "draft" ? `/${kind}/${d.id}/edit` : `/${kind}/${d.id}`);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={kind === "beer" ? "商品名・醸造所で探す" : "商品名・酒蔵で探す"}
        aria-label="検索"
        className="min-h-11 w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-3"
      />
      <div className="grid grid-cols-3 gap-2 text-[13px]">
        <select
          aria-label="カテゴリで絞り込み"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-2"
        >
          <option value="">{kind === "beer" ? "全カテゴリ" : "全特定名称"}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="評価で絞り込み"
          value={minRating ?? ""}
          onChange={(e) => setMinRating(e.target.value === "" ? null : Number(e.target.value))}
          className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-2"
        >
          <option value="">★すべて</option>
          {MIN_RATINGS.map((r) => (
            <option key={r} value={r}>
              ★{r}以上
            </option>
          ))}
        </select>
        <select
          aria-label="並び替え"
          value={sort}
          onChange={(e) => setSort(e.target.value as ListQuery["sort"])}
          className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-2"
        >
          <option value="date">新しい順</option>
          <option value="rating">評価が高い順</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 ? (
        <EmptyState kind={kind} status={status} filtered={filtered} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-(--color-surface) shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div role="row" className={`${ROW_GRID} bg-(--color-bg) py-2 text-[13px] text-(--color-text-sub)`}>
            <span role="columnheader">
              <span className="sr-only">画像</span>
            </span>
            <span role="columnheader">日付</span>
            <span role="columnheader">商品名</span>
            <span role="columnheader">産地</span>
            <span role="columnheader">評価</span>
          </div>
          <ul className="divide-y divide-(--color-border)">
            {items.map((d) => (
              <li key={d.id}>
                <Link href={rowHref(d)} className={`${ROW_GRID} min-h-14 py-2 active:bg-(--color-bg)`}>
                  <DrinkImage url={d.image_path ? imageUrls[d.image_path] : null} icon={iconTypeOf(d)} size={36} />
                  <span className="text-[13px] tabular-nums text-(--color-text-sub)">{formatDateShort(d.drunk_on)}</span>
                  <span className="line-clamp-2 leading-snug">{d.name}</span>
                  <span className="line-clamp-2 text-[13px] leading-snug text-(--color-text-sub)">{originLabel(d) ?? "—"}</span>
                  <RatingCompact value={d.rating} />
                </Link>
              </li>
            ))}
          </ul>
          {loading && <p className="py-4 text-center text-[13px] text-(--color-text-sub)">読み込んでいます…</p>}
          <div ref={sentinel} aria-hidden className="h-1" />
        </div>
      )}
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
      <span aria-hidden className="text-(--color-secondary)">
        ★
      </span>
      {value.toFixed(1)}
    </span>
  );
}

function EmptyState({ kind, status, filtered }: { kind: Kind; status: "draft" | "saved"; filtered: boolean }) {
  if (filtered) {
    return <p className="py-10 text-center text-(--color-text-sub)">条件に合う記録がありません。</p>;
  }
  if (status === "draft") {
    return <p className="py-10 text-center text-(--color-text-sub)">下書きはありません。</p>;
  }
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-(--color-text-sub)">まだ記録がありません。＋から記録しましょう</p>
      <Link
        href={`/${kind}/new`}
        aria-label="記録する"
        className="flex size-14 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary) shadow"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
