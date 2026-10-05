// 銘柄名の正規化(仕様書 §5.2)。全角→半角、空白を除く、小文字にする
export function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\s　]+/g, "")
    .toLowerCase();
}
