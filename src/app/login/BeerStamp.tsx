// ログイン画面の大きなスタンプ。外周に文字、真ん中にジョッキ。縁はインクがかすれたように揺らす
const INK = "#D9A03A";

export function BeerStamp({ fontFamily }: { fontFamily: string }) {
  return (
    <svg viewBox="0 0 320 320" className="stamp-press w-[280px] max-w-full" role="img" aria-label="Beer stamp">
      <defs>
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" />
        </filter>
        <path id="stamp-ring" d="M160 160 m-118 0 a118 118 0 1 1 236 0 a118 118 0 1 1 -236 0" />
      </defs>
      <g filter="url(#ink)" transform="rotate(-8 160 160)">
        <circle cx="160" cy="160" r="140" fill="none" stroke={INK} strokeWidth="6" />
        <circle cx="160" cy="160" r="128" fill="none" stroke={INK} strokeWidth="1.6" />
        <circle cx="160" cy="160" r="100" fill="none" stroke={INK} strokeWidth="1.6" />
        <text fontFamily={fontFamily} fontWeight="500" fontSize="16" letterSpacing="5.5" fill={INK}>
          <textPath href="#stamp-ring">NOMIKURABE NOTE ★ BEER ★ TASTE · LOG · REPEAT ★</textPath>
        </text>
        <g transform="translate(156 150) scale(2.6)">
          <path d="M18 -6h5a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-6" fill="none" stroke="#2f2f2f" strokeOpacity=".25" strokeWidth="3.2" />
          <path d="M-16 -14h34l-3 33a3 3 0 0 1-3 3h-22a3 3 0 0 1-3-3z" fill="#fff" stroke="#2f2f2f" strokeOpacity=".18" strokeWidth="1.2" />
          <path d="M-15 -8h32l-2.6 26a3 3 0 0 1-3 2.6h-20.8a3 3 0 0 1-3-2.6z" fill="#E9B949" />
          <path
            d="M-18 -12c0-6 5-9 9-7 2-5 10-6 13-1 4-3 11-1 11 5 0 3-2 5-4 5h-25c-2 0-4-1-4-2z"
            fill="#FFFDF7"
            stroke="#2f2f2f"
            strokeOpacity=".18"
            strokeWidth="1.2"
          />
        </g>
        <text x="160" y="240" textAnchor="middle" fontFamily={fontFamily} fontWeight="500" fontSize="13" letterSpacing="4" fill={INK}>
          EST. 2026
        </text>
      </g>
    </svg>
  );
}
