"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Kind } from "@/lib/kinds";
import { fetchMapDrinks, type MapDrink } from "@/lib/map-data";
import { createClient } from "@/lib/supabase/client";

const DrinkMap = dynamic(() => import("@/components/map/DrinkMap"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-(--color-border)" />,
});

const NO_IMAGES = {};

// レポートの小さな地図(仕様書 §7.1 1-3)。操作はできず、タップで全画面マップへ
export function MiniMap({ kind }: { kind: Kind }) {
  const [drinks, setDrinks] = useState<MapDrink[] | null>(null);

  useEffect(() => {
    fetchMapDrinks(createClient(), kind)
      .then(setDrinks)
      .catch(() => setDrinks([]));
  }, [kind]);

  return (
    <Link href={`/${kind}/map`} className="relative isolate block h-[180px] overflow-hidden rounded-lg" aria-label="地図を全画面で見る">
      <div className="pointer-events-none size-full">
        {drinks && <DrinkMap drinks={drinks} imageUrls={NO_IMAGES} variant="mini" />}
      </div>
      {drinks?.length === 0 && (
        <span className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 text-[13px] text-(--color-text-sub)">
          場所のわかる記録がまだありません
        </span>
      )}
    </Link>
  );
}
