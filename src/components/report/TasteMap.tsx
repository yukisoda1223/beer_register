import { Card } from "@/components/Card";
import type { Kind } from "@/lib/kinds";
import type { StatRecord } from "@/lib/stats";
import { TASTE_AXES, distribution, preferenceGrid, preferenceSentence, tastePoints, type Axis, type TastePoint } from "@/lib/taste-map";

const SIZE = 300; // マップの一辺(SVG の座標)
const GRID = 30;

// 味の好みマップ(2軸)/ 甘辛の分布(1軸)。種類に軸の設定がなければ何も出さない
export function TasteMap({ kind, records }: { kind: Kind; records: StatRecord[] }) {
  const axes = TASTE_AXES[kind];
  if (!axes) return null;
  const { x, y } = axes;
  const points = tastePoints(records, x, y);
  const title = y ? "Taste Map" : x.label;

  if (points.length === 0) {
    return (
      <Card title={title}>
        <p className="text-[13px] text-(--color-text-sub)">
          Rate {y ? `${x.label} and ${y.label}` : x.label} when you log a drink to see where your favorites sit.
        </p>
      </Card>
    );
  }

  return (
    <Card title={title}>
      <p className="mb-3 text-[14px] leading-relaxed">{preferenceSentence(kind, points, x, y)}</p>
      {y ? <Map2D kind={kind} points={points} x={x} y={y} /> : <Distribution points={points} x={x} />}
    </Card>
  );
}

// 同じ値の銘柄が重ならないよう、銘柄ごとに決まった量だけ少しずらす
function jitter(id: string, axis: number) {
  let h = 2166136261 ^ axis;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.3;
}

// 端の値(1 や 5)の点が枠で切れないよう、表示する範囲は前後に 0.5 ずつ広げる
const padded = (a: Axis): Axis => ({ ...a, min: a.min - 0.5, max: a.max + 0.5 });

function Map2D({ kind, points, x, y }: { kind: Kind; points: TastePoint[]; x: Axis; y: Axis }) {
  const [vx, vy] = [padded(x), padded(y)];
  const grid = preferenceGrid(points, vx, vy, GRID);
  const cell = SIZE / GRID;
  const px = (v: number) => ((v - vx.min) / (vx.max - vx.min)) * SIZE;
  const py = (v: number) => SIZE - ((v - vy.min) / (vy.max - vy.min)) * SIZE;
  const clamp = (v: number, a: Axis) => Math.min(a.max, Math.max(a.min, v));
  const edge = "fill-(--color-text-sub) text-[11px]";

  return (
    <div>
      <svg viewBox={`-6 -6 ${SIZE + 12} ${SIZE + 12}`} className="w-full" role="img" aria-label={`${x.label} by ${y.label}, ${points.length} drinks`}>
        <defs>
          <clipPath id="taste-map-clip">
            <rect x={0} y={0} width={SIZE} height={SIZE} rx={10} />
          </clipPath>
          <filter id="taste-map-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={cell * 0.8} />
          </filter>
        </defs>
        <rect x={0} y={0} width={SIZE} height={SIZE} rx={10} className="fill-(--color-bg)" />
        {/* マス目をぼかして、なめらかな濃淡にする */}
        <g clipPath="url(#taste-map-clip)">
          <g filter="url(#taste-map-blur)" shapeRendering="crispEdges">
            {grid.flatMap((row, r) =>
              row.map((v, c) =>
                v > 0.04 ? (
                  <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} className="fill-(--color-primary)" fillOpacity={v * 0.65} />
                ) : null,
              ),
            )}
          </g>
        </g>
        <path d={`M${SIZE / 2} 0V${SIZE}M0 ${SIZE / 2}H${SIZE}`} className="stroke-(--color-border)" strokeDasharray="3 4" />
        <text x={SIZE / 2} y={16} textAnchor="middle" className={edge}>{y.high.en}</text>
        <text x={SIZE / 2} y={SIZE - 8} textAnchor="middle" className={edge}>{y.low.en}</text>
        <text x={8} y={SIZE / 2 - 6} className={edge}>{x.low.en}</text>
        <text x={SIZE - 8} y={SIZE / 2 - 6} textAnchor="end" className={edge}>{x.high.en}</text>
        {points.map((p) => (
          <a key={p.productId} href={`/${kind}/${p.tastingId}`}>
            <title>{`${p.name} ★${Math.round(p.rating * 10) / 10}`}</title>
            <circle
              cx={px(clamp(p.x + jitter(p.productId, 1), x))}
              cy={py(clamp((p.y ?? 0) + jitter(p.productId, 2), y))}
              r={3 + p.rating * 1.3}
              className="fill-(--color-accent-text) stroke-(--color-surface)"
              strokeWidth={1.5}
              opacity={0.85}
            />
          </a>
        ))}
      </svg>
      <p className="mt-2 text-[11px] text-(--color-text-sub)">Darker = closer to your top-rated drinks · Bigger dot = higher rating</p>
    </div>
  );
}

function Distribution({ points, x }: { points: TastePoint[]; x: Axis }) {
  const bins = distribution(points);
  const top = Math.max(...bins.map((b) => b.count));
  return (
    <div>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={bins.map((b) => `${b.step}: ${b.count}`).join(", ")}>
        {bins.map((b) => (
          <div key={b.step} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] tabular-nums text-(--color-text-sub)">{b.count || ""}</span>
            <div
              className="w-full rounded-md bg-(--color-primary)"
              style={{
                height: b.count ? `${(b.count / top) * 80}%` : 3,
                opacity: b.avgRating == null ? 0.15 : 0.3 + ((b.avgRating - 1) / 4) * 0.7,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-(--color-text-sub)">
        <span>{x.low.en}</span>
        <span>{x.high.en}</span>
      </div>
      <p className="mt-2 text-[11px] text-(--color-text-sub)">Bar height = drinks · Darker = higher average rating</p>
    </div>
  );
}
