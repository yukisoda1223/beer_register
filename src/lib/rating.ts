// ★評価(0.5刻み)の計算。部品(StarRating)から使う

// 星の並びの左端からの位置 x(0〜width)を ★の値(0.5〜5)に直す。
// 各星の左半分なら 0.5、右半分なら 1.0 になる
export function ratingFromPosition(x: number, width: number): number {
  if (width <= 0) return 0.5;
  const halves = Math.ceil((x / width) * 10);
  return Math.min(10, Math.max(1, halves)) / 2;
}

// タップしたとき: 今と同じ値をもう一度タップしたら未入力(null)に戻す
export function nextRatingOnTap(current: number | null, tapped: number): number | null {
  return current === tapped ? null : tapped;
}

// キーボードの ← → で 0.5 ずつ動かす
export function stepRating(current: number | null, delta: number): number {
  const base = current ?? 0;
  return Math.min(5, Math.max(0.5, base + delta));
}
