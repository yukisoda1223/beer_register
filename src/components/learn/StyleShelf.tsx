import Link from "next/link";
import { BeerGlass } from "@/components/learn/BeerGlass";
import { BEER_STYLES, beerStyleColor } from "@/lib/learn/beer-styles";

// スタイル図鑑: スタイルに合ったグラスに、そのスタイルの色のビールを入れて棚に並べる
export function StyleShelf() {
  const rows: (typeof BEER_STYLES)[] = [];
  for (let i = 0; i < BEER_STYLES.length; i += 4) rows.push(BEER_STYLES.slice(i, i + 4));
  return (
    <div className="flex flex-col gap-5">
      {rows.map((row, r) => (
        <div key={r}>
          <ul className="grid grid-cols-4 items-end">
            {row.map((st) => (
              <li key={st.slug}>
                <Link href={`/beer/learn/${st.slug}`} className="flex flex-col items-center">
                  <BeerGlass glass={st.glass} color={beerStyleColor(st)} foam={st.foam} size={40} id={`shelf-${st.slug}`} />
                </Link>
              </li>
            ))}
          </ul>
          {/* 棚板 */}
          <div className="h-1 rounded-full bg-(--color-border)" aria-hidden />
          <ul className="mt-1.5 grid grid-cols-4">
            {row.map((st) => (
              <li key={st.slug} className="px-0.5 text-center">
                <Link href={`/beer/learn/${st.slug}`} className="block truncate text-[10px] tracking-wide text-(--color-text-sub)">
                  {st.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
