// 写真がないときのアイコン(仕様書 §6.5)。すべて自作の SVG。
// ale=濃い色のグラス、lager=明るい色のグラス、other=缶、sake=徳利とおちょこ
export type DrinkIconType = "ale" | "lager" | "other" | "sake";

export function DrinkIcon({ type, size = 36 }: { type: DrinkIconType; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={LABELS[type]}>
      <rect width="48" height="48" rx="10" fill="var(--color-bg)" />
      {type === "ale" && <Glass beer="#9a4f16" />}
      {type === "lager" && <Glass beer="#f6c343" />}
      {type === "other" && (
        <g>
          <rect x="15" y="10" width="18" height="29" rx="3" fill="var(--color-primary)" />
          <rect x="16" y="8" width="16" height="4" rx="1.5" fill="#c9c9c9" />
          <rect x="15" y="19" width="18" height="9" fill="var(--color-secondary)" />
        </g>
      )}
      {type === "sake" && (
        <g>
          <path d="M17 9h6v4c5 3 7 9 7 15 0 6-3 10-10 10s-10-4-10-10c0-6 2-12 7-15z" fill="#f4f1ea" stroke="#1f2f55" strokeWidth="2" />
          <path d="M11 27h18" stroke="#1f2f55" strokeWidth="2" />
          <path d="M31 31h10l-1.5 6h-7z" fill="#f4f1ea" stroke="#1f2f55" strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 33h8" stroke="#c9a54c" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}

const LABELS: Record<DrinkIconType, string> = {
  ale: "エール系のビール",
  lager: "ラガー系のビール",
  other: "ビール",
  sake: "日本酒",
};

function Glass({ beer }: { beer: string }) {
  return (
    <g>
      <path d="M14 14h20l-2.5 24a2 2 0 0 1-2 1.8H18.5a2 2 0 0 1-2-1.8z" fill={beer} />
      <path d="M13 10c2-2.5 5-2.5 7-1 2-2 6-2 8 0 2-1.5 6-1 7 2v5H13z" fill="#ffffff" stroke="#e5ddd0" strokeWidth="1" />
      <path d="M14 14h20l-2.5 24a2 2 0 0 1-2 1.8H18.5a2 2 0 0 1-2-1.8z" fill="none" stroke="#2b2b2b" strokeOpacity=".25" strokeWidth="1.2" />
    </g>
  );
}
