"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DrinkImage } from "@/components/DrinkImage";
import { StarDisplay } from "@/components/StarDisplay";
import { iconTypeOf } from "@/lib/drink";
import { errorMessage, signedImageUrls } from "@/lib/drinks-db";
import { geocodeOnClient } from "@/lib/geo/client";
import type { Kind } from "@/lib/kinds";
import { fetchMapDrinks, fetchMissingLocations, type MapDrink, type MissingLocation } from "@/lib/map-data";
import { createClient } from "@/lib/supabase/client";

const DrinkMap = dynamic(() => import("@/components/map/DrinkMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-(--color-border)" />,
});

// 全画面マップ(仕様書 §7.2)
export function MapScreen({ kind }: { kind: Kind }) {
  const [drinks, setDrinks] = useState<MapDrink[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<MissingLocation[]>([]);
  const [selected, setSelected] = useState<MapDrink | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    try {
      const [rows, lacking] = await Promise.all([fetchMapDrinks(supabase, kind), fetchMissingLocations(supabase, kind)]);
      const urls = await signedImageUrls(supabase, rows.flatMap((r) => (r.image_path ? [r.image_path] : [])));
      setDrinks(rows);
      setImageUrls(urls);
      setMissing(lacking);
      setError(null);
    } catch {
      setError(errorMessage("地図のデータを読み込めませんでした。"));
    }
  }, [kind]);

  useEffect(() => {
    // 画面を開いたときに一度だけ読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // 緯度経度がまだない記録の場所を、1件ずつ調べて保存する(1秒に1回の決まりがあるので少し時間がかかる)
  async function fillMissing() {
    const supabase = createClient();
    setProgress({ done: 0, total: missing.length });
    for (const [i, m] of missing.entries()) {
      const pos = await geocodeOnClient({ address: m.maker_address, prefecture: m.prefecture, country: m.country });
      if (pos) await supabase.from("drinks").update({ lat: pos.lat, lng: pos.lng }).eq("id", m.id);
      setProgress({ done: i + 1, total: missing.length });
    }
    setProgress(null);
    await load();
    setFitSignal((n) => n + 1);
  }

  return (
    // ヘッダーの下を画面いっぱいに使う
    <div className="relative isolate -mx-4 -mt-4 -mb-24 h-[calc(100dvh-76px)]">
      <DrinkMap
        drinks={drinks}
        imageUrls={imageUrls}
        variant="full"
        onSelect={setSelected}
        fitSignal={fitSignal}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex flex-col gap-2">
        {error && (
          <p role="alert" className="pointer-events-auto rounded-xl bg-red-50 px-4 py-3 text-red-800 shadow">
            {error}
          </p>
        )}
        {missing.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-(--color-surface) px-4 py-2 text-[13px] shadow">
            <p className="flex-1">
              {progress
                ? `場所を調べています… ${progress.done} / ${progress.total}`
                : `地図にまだ出ていない記録が ${missing.length} 件あります`}
            </p>
            {!progress && (
              <button
                type="button"
                onClick={fillMissing}
                className="min-h-10 rounded-lg bg-(--color-primary) px-3 font-bold text-(--color-on-primary)"
              >
                位置を取得する
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setFitSignal((n) => n + 1);
        }}
        className="absolute right-3 bottom-[max(env(safe-area-inset-bottom),16px)] z-[1000] min-h-11 rounded-full bg-(--color-surface) px-4 font-bold shadow-lg"
        style={selected ? { bottom: 128 } : undefined}
      >
        全体を表示
      </button>

      {selected && (
        <div className="absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),16px)] z-[1000]">
          <Link
            href={`/${kind}/${selected.id}`}
            className="flex items-center gap-3 rounded-xl bg-(--color-surface) p-3 shadow-lg"
          >
            <DrinkImage
              url={selected.image_path ? imageUrls[selected.image_path] : null}
              icon={iconTypeOf(selected)}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-bold leading-snug">{selected.name}</p>
              {selected.maker && <p className="truncate text-[13px] text-(--color-text-sub)">{selected.maker}</p>}
              {selected.rating != null && <StarDisplay value={selected.rating} size={14} />}
            </div>
            <span aria-hidden className="text-(--color-text-sub)">›</span>
          </Link>
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="閉じる"
            className="absolute -top-3 -right-1 flex size-8 items-center justify-center rounded-full bg-(--color-surface) shadow"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
