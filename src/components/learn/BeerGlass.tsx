import type { GlassType } from "@/lib/learn/beer-styles";

// スタイルごとのビールグラス(自作の SVG、viewBox 48×64)。
// bowl = 液体が入る部分(この形で切り抜いて、泡とビールを塗る)、parts = 取っ手・脚など
type Shape = { bowl: string; rim: number; foam: number; bottom: number; parts?: string; partsFill?: boolean };

const SHAPES: Record<GlassType, Shape> = {
  pilsner: { bowl: "M15 4H33L28 54Q24 56 20 54Z", rim: 4, foam: 8, bottom: 56, parts: "M18 55h12v5h-12z", partsFill: true },
  mug: {
    bowl: "M9 12H33V56Q33 59 30 59H12Q9 59 9 56Z",
    rim: 12,
    foam: 8,
    bottom: 59,
    parts: "M33 20h4a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5h-4",
  },
  shaker: { bowl: "M11 8H37L33 59H15Z", rim: 8, foam: 7, bottom: 59 },
  nonic: { bowl: "M11 8H37L36 15Q38.5 18 36.5 21L33 59H15L11.5 21Q9.5 18 12 15Z", rim: 8, foam: 7, bottom: 59 },
  tulip: {
    bowl: "M13 6H35Q36 13 32.5 20Q39 28 35 37Q31 44 24 44Q17 44 13 37Q9 28 15.5 20Q12 13 13 6Z",
    rim: 6,
    foam: 8,
    bottom: 44,
    parts: "M24 44V56M16 58H32",
  },
  weizen: {
    bowl: "M14 3H34Q35 13 32 22Q29.5 31 31.5 41Q33.5 52 31 59H17Q14.5 52 16.5 41Q18.5 31 16 22Q13 13 14 3Z",
    rim: 3,
    foam: 11,
    bottom: 59,
  },
  snifter: { bowl: "M16 14Q9 24 10.5 32Q12 45 24 45Q36 45 37.5 32Q39 24 32 14Z", rim: 14, foam: 6, bottom: 45, parts: "M24 45V55M16 57H32" },
  stange: { bowl: "M17 6H31V59H17Z", rim: 6, foam: 6, bottom: 59 },
  chalice: { bowl: "M8 12H40Q40 34 24 36Q8 34 8 12Z", rim: 12, foam: 6, bottom: 36, parts: "M24 36V50M15 57Q24 50 33 57Z" },
  ipa: {
    bowl: "M14 3H34Q35.5 18 30 28V40Q31.5 42 30 44L31 47Q32.5 49 30.5 51L31 54Q32 58 29 59H19Q16 58 17 54L17.5 51Q15.5 49 17 47L18 44Q16.5 42 18 40V28Q12.5 18 14 3Z",
    rim: 3,
    foam: 8,
    bottom: 59,
  },
  tumbler: { bowl: "M9 18H39L36.5 59H11.5Z", rim: 18, foam: 7, bottom: 59 },
  flute: { bowl: "M18 3H30Q31.5 22 27.5 32Q24 36 20.5 32Q16.5 22 18 3Z", rim: 3, foam: 6, bottom: 35, parts: "M24 35V55M17 57H31" },
};

const EDGE = { stroke: "#2f2f2f", strokeOpacity: 0.22, strokeWidth: 1.1 };

export function BeerGlass({
  glass,
  color,
  foam = "#FFFDF7",
  size = 48,
  id,
}: {
  glass: GlassType;
  color: string;
  foam?: string;
  size?: number;
  id: string; // 切り抜きの id(ページ内で重ならないように)
}) {
  const s = SHAPES[glass];
  const clip = `glass-${id}`;
  const liquidTop = s.rim + s.foam;
  return (
    <svg width={size} height={(size * 64) / 48} viewBox="0 0 48 64" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d={s.bowl} />
        </clipPath>
      </defs>
      <path d={s.bowl} fill="#fff" fillOpacity=".7" />
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={liquidTop} width="48" height={64 - liquidTop} fill={color} />
        <rect x="0" y={s.rim} width="48" height={s.foam} fill={foam} />
        {/* ガラスの映り込み */}
        <rect x="14" y={s.rim} width="3" height={s.bottom - s.rim} fill="#fff" opacity=".28" />
      </g>
      <path d={s.bowl} fill="none" {...EDGE} />
      {s.parts && <path d={s.parts} fill={s.partsFill ? "#fff" : "none"} {...EDGE} strokeWidth={s.partsFill ? 1.1 : 2.2} strokeLinecap="round" />}
    </svg>
  );
}
