"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DrinkImage } from "@/components/DrinkImage";
import { formatDateShort, iconOf, originLabel, type Drink } from "@/lib/drink";
import { PAGE_SIZE, errorMessage, fetchDrinkPage, signedImageUrls, type ListQuery } from "@/lib/drinks-db";
import { KIND_CONFIG } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/client";

const MIN_RATINGS = [3, 3.5, 4, 4.5];

// 一覧・下書き一覧の表。検索・絞り込み・並び替えと、下までスクロールしたら続きを読む
export function DrinkTable({ kind, status, region }: { kind: Kind; status: "draft" | "saved"; region?: string }) {
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
    () => ({ kind, status, search: debouncedSearch, category, region, minRating, sort }),
    [kind, status, debouncedSearch, category, region, minRating, sort],
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
      .catch(() => !cancelled && setError(errorMessage("Couldn't load your entries.")))
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

  const filtered = debouncedSearch !== "" || category !== "" || !!region || minRating != null;
  const categories = KIND_CONFIG[kind].categories;
  const rowHref = (d: Drink) => (status === "draft" ? `/${kind}/${d.id}/edit` : `/${kind}/${d.id}`);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search name or ${KIND_CONFIG[kind].makerLabel.toLowerCase()}`}
        aria-label="Search"
        className="min-h-10 w-full rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-[14px]"
      />
      {region && (
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-(--color-text-sub)">Region</span>
          <Link
            href={`/${kind}/list`}
            aria-label={`Clear region filter ${region}`}
            className="flex min-h-8 items-center gap-1.5 rounded-full bg-(--color-primary-soft) px-3 text-(--color-accent-text)"
          >
            {region}
            <span aria-hidden>×</span>
          </Link>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <select
          aria-label="Filter by style"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-h-10 rounded-full border border-(--color-border) bg-(--color-surface) px-3"
        >
          <option value="">All {KIND_CONFIG[kind].categoryLabel.toLowerCase()}s</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by rating"
          value={minRating ?? ""}
          onChange={(e) => setMinRating(e.target.value === "" ? null : Number(e.target.value))}
          className="min-h-10 rounded-full border border-(--color-border) bg-(--color-surface) px-3"
        >
          <option value="">Any rating</option>
          {MIN_RATINGS.map((r) => (
            <option key={r} value={r}>
              ★ {r}+
            </option>
          ))}
        </select>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as ListQuery["sort"])}
          className="min-h-10 rounded-full border border-(--color-border) bg-(--color-surface) px-3"
        >
          <option value="date">Newest</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-(--color-danger)">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 ? (
        <EmptyState kind={kind} status={status} filtered={filtered} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
          <div role="row" className={`${ROW_GRID} border-b border-(--color-border) py-2 text-[10px] tracking-[0.1em] text-(--color-text-sub) uppercase`}>
            <span role="columnheader">
              <span className="sr-only">Photo</span>
            </span>
            <span role="columnheader">Date</span>
            <span role="columnheader">Name</span>
            <span role="columnheader">Origin</span>
            <span role="columnheader">Rating</span>
          </div>
          <ul className="divide-y divide-(--color-border)">
            {items.map((d) => (
              <li key={d.id}>
                <Link href={rowHref(d)} className={`${ROW_GRID} min-h-14 py-2 active:bg-(--color-bg)`}>
                  <DrinkImage url={d.image_path ? imageUrls[d.image_path] : null} icon={iconOf(d)} size={36} />
                  <span className="text-[12px] tabular-nums text-(--color-text-sub)">{formatDateShort(d.drunk_on)}</span>
                  <span className="line-clamp-2 text-[14px] leading-snug">{d.name}</span>
                  <span className="line-clamp-2 text-[11px] leading-snug text-(--color-text-sub)">{originLabel(d) ?? "—"}</span>
                  <RatingCompact value={d.rating} />
                </Link>
              </li>
            ))}
          </ul>
          {loading && <p className="py-4 text-center text-[12px] text-(--color-text-sub)">Loading…</p>}
          <div ref={sentinel} aria-hidden className="h-1" />
        </div>
      )}
    </div>
  );
}

// 行の列の幅: 画像・日付・商品名・産地・評価
const ROW_GRID = "grid grid-cols-[36px_34px_minmax(0,1fr)_76px_38px] items-center gap-2 px-3";

// 一覧用の小さな評価表示(★1つ+数字)
function RatingCompact({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[12px] text-(--color-text-sub)">—</span>;
  return (
    <span className="flex items-center gap-0.5 text-[12px] font-medium tabular-nums" aria-label={`${value} out of 5`}>
      <span aria-hidden className="text-(--color-secondary)">
        ★
      </span>
      {value.toFixed(1)}
    </span>
  );
}

function EmptyState({ kind, status, filtered }: { kind: Kind; status: "draft" | "saved"; filtered: boolean }) {
  if (filtered) {
    return <p className="py-10 text-center text-[13px] text-(--color-text-sub)">No matches.</p>;
  }
  if (status === "draft") {
    return <p className="py-10 text-center text-[13px] text-(--color-text-sub)">No drafts.</p>;
  }
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <p className="text-[13px] text-(--color-text-sub)">Nothing here yet. Tap + to add your first.</p>
      <Link
        href={`/${kind}/new`}
        aria-label="New entry"
        className="flex size-12 items-center justify-center rounded-full bg-(--color-primary) text-(--color-on-primary)"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
