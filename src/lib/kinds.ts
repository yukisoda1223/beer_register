// お酒の種類。増やすときはここ・theme.css・kind-config.ts・データベースの drink_kind に足す
export const KINDS = ["beer", "sake", "whisky", "cider", "wine"] as const;

export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  beer: "Beer",
  sake: "Sake",
  whisky: "Whisky",
  cider: "Cider",
  wine: "Wine",
};

// テーマ色(アクセント)。theme.css の --color-primary と同じ値
export const KIND_COLORS: Record<Kind, string> = {
  beer: "#E7B447",
  sake: "#829DA5",
  whisky: "#98633D",
  cider: "#B95759",
  wine: "#6E2B3F",
};

export const DEFAULT_KIND: Kind = "beer";
export const DEFAULT_KIND_ORDER: Kind[] = [...KINDS];
export const DEFAULT_VISIBLE_KINDS: Kind[] = ["beer", "sake"];

// 最後に見ていた kind を覚えておく cookie の名前
export const LAST_KIND_COOKIE = "last_kind";

export function isKind(value: unknown): value is Kind {
  return typeof value === "string" && (KINDS as readonly string[]).includes(value);
}

// kind の後ろに来る画面名(これ以外は記録の id)
const SCREENS = ["report", "list", "learn", "drafts", "new", "map", "settings"];

// "/beer/list" → "/sake/list" のように、同じ種類の画面のまま kind だけを入れ替える。
// 記録の詳細・編集画面(/beer/{id})は相手側に同じ記録が無いので一覧へ移る。
export function switchKindInPath(pathname: string, to: Kind): string {
  const [, kind, screen] = pathname.split("/");
  if (!isKind(kind) || !screen) return `/${to}/report`;
  if (!SCREENS.includes(screen)) return `/${to}/list`;
  // Learn のスタイル詳細(/beer/learn/ipa)は、相手の種類の Learn のトップへ
  if (screen === "learn") return `/${to}/learn`;
  return `/${to}/${screen}`;
}

// 設定(並び順・表示する種類)から、ヘッダーに出す種類を順に並べる。
// いま見ている種類が非表示でも、迷子にならないよう末尾に出す
export function headerKinds(order: string[], visible: string[], current?: Kind): Kind[] {
  const known = [...order.filter(isKind), ...KINDS.filter((k) => !order.includes(k))];
  const list = known.filter((k) => visible.includes(k));
  if (current && !list.includes(current)) list.push(current);
  return list.length ? list : [DEFAULT_KIND];
}
