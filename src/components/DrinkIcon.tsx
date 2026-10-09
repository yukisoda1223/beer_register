// 写真がないときのアイコン(仕様書 §6.5)。すべて自作の SVG。
// ale・lager はグラス、other は缶、sake は徳利とおちょこ。ビールはスタイルごとの色(masters.ts)で塗る
export type DrinkIconType = "ale" | "lager" | "other" | "sake";
export type IconSpec = { type: DrinkIconType; color: string };

export function DrinkIcon({ type, color, size = 36 }: IconSpec & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={LABELS[type]}>
      <rect width="48" height="48" rx="12" fill="var(--color-bg)" />
      {(type === "ale" || type === "lager") && <Glass beer={color} />}
      {type === "other" && (
        <g>
          <rect x="16" y="11" width="16" height="27" rx="3" fill={color} />
          <rect x="17" y="9" width="14" height="3.5" rx="1.5" fill="#cfcac2" />
          <rect x="16" y="20" width="16" height="7" fill="#ffffff" opacity=".55" />
        </g>
      )}
      {type === "sake" && (
        <g fill="none" stroke="#57747c" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M18 10h5v4c4.6 2.8 6.5 8.4 6.5 14 0 5.6-2.8 9.5-9 9.5s-9-3.9-9-9.5c0-5.6 1.9-11.2 6.5-14z" fill="#f4f1ea" />
          <path d="M12.5 27h16" />
          <path d="M31 31h9.5l-1.4 5.5h-6.7z" fill="#f4f1ea" />
          <path d="M32.2 33h7" stroke="#829da5" />
        </g>
      )}
    </svg>
  );
}

const LABELS: Record<DrinkIconType, string> = {
  ale: "Ale",
  lager: "Lager",
  other: "Beer",
  sake: "Sake",
};

function Glass({ beer }: { beer: string }) {
  return (
    <g>
      <path d="M15 15h18l-2.3 22.2a1.8 1.8 0 0 1-1.8 1.6h-9.8a1.8 1.8 0 0 1-1.8-1.6z" fill={beer} />
      <path d="M14.2 11.5c1.8-2.1 4.4-2.1 6.2-.9 1.9-1.7 5.3-1.7 7.1 0 1.8-1.3 5.2-.9 6.3 1.8v3.8H14.2z" fill="#ffffff" stroke="#e6e1d8" strokeWidth=".8" />
      <path d="M15 15h18l-2.3 22.2a1.8 1.8 0 0 1-1.8 1.6h-9.8a1.8 1.8 0 0 1-1.8-1.6z" fill="none" stroke="#2f2f2f" strokeOpacity=".18" strokeWidth="1" />
    </g>
  );
}
