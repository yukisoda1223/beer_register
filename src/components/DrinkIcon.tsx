// 写真がないときのアイコン(仕様書 §6.5)。すべて自作の SVG。
// ale・lager はグラス、other は缶、sake は徳利とおちょこ、whisky はロックグラス、
// cider は丸くて背の低いグラス、wine はワイングラス。中身の色は種類・スタイルごと(masters.ts)
export type DrinkIconType = "ale" | "lager" | "other" | "sake" | "whisky" | "cider" | "wine";
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
      {type === "whisky" && (
        <g>
          <path d="M13 17h22l-1.6 18.5a2 2 0 0 1-2 1.8H16.6a2 2 0 0 1-2-1.8z" fill="#ffffff" stroke="#2f2f2f" strokeOpacity=".18" />
          <path d="M14.1 26h19.8l-.8 9.4a2 2 0 0 1-2 1.8H16.9a2 2 0 0 1-2-1.8z" fill={color} />
          <rect x="18" y="21" width="7" height="7" rx="1.2" fill="#ffffff" opacity=".7" stroke="#d8e4e8" strokeWidth=".8" />
        </g>
      )}
      {type === "cider" && (
        <g>
          <path d="M12.5 19h23c0 9.5-4.2 17-11.5 17s-11.5-7.5-11.5-17z" fill="#ffffff" stroke="#2f2f2f" strokeOpacity=".18" />
          <path d="M13.3 24h21.4c-1 7-4.8 12-10.7 12s-9.7-5-10.7-12z" fill={color} />
          <circle cx="20" cy="29" r="1" fill="#ffffff" opacity=".8" />
          <circle cx="26" cy="31" r=".8" fill="#ffffff" opacity=".8" />
          <circle cx="23" cy="27" r=".7" fill="#ffffff" opacity=".8" />
        </g>
      )}
      {type === "wine" && (
        <g>
          <path d="M16 9h16c.6 8.5-2.2 15-8 15s-8.6-6.5-8-15z" fill="#ffffff" stroke="#2f2f2f" strokeOpacity=".18" />
          <path d="M16.3 15h15.4c-.4 5.5-3 9-7.7 9s-7.3-3.5-7.7-9z" fill={color} />
          <path d="M24 24v11M18.5 38h11" stroke="#2f2f2f" strokeOpacity=".3" strokeWidth="1.4" strokeLinecap="round" />
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
  whisky: "Whisky",
  cider: "Cider",
  wine: "Wine",
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
