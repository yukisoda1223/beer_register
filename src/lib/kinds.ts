// お酒の種類。増やすときはここと theme.css に足す(仕様書 §14)。
export const KINDS = ["beer", "sake"] as const;

export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  beer: "ビール",
  sake: "日本酒",
};

export const DEFAULT_KIND: Kind = "beer";

// 最後に見ていた kind を覚えておく cookie の名前
export const LAST_KIND_COOKIE = "last_kind";

export function isKind(value: unknown): value is Kind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

// kind の後ろに来る画面名(これ以外は記録の id)
const SCREENS = ["report", "list", "drafts", "new", "map"];

// "/beer/list" → "/sake/list" のように、同じ種類の画面のまま kind だけを入れ替える。
// 記録の編集画面(/beer/{id})は相手側に同じ記録が無いので一覧へ移る。
export function switchKindInPath(pathname: string, to: Kind): string {
  const [, kind, screen] = pathname.split("/");
  if (!isKind(kind) || !screen) return `/${to}/report`;
  if (!SCREENS.includes(screen)) return `/${to}/list`;
  return `/${to}/${screen}`;
}
