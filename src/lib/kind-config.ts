// お酒の種類ごとの違い(入力項目・見出し・選択肢)を1か所にまとめる
import type { Kind } from "@/lib/kinds";
import {
  BEER_CATEGORIES,
  CASKS,
  CIDER_STYLES,
  PEAT_LEVELS,
  SAKE_CATEGORIES,
  WHISKY_TYPES,
  WINE_TYPES,
} from "@/lib/masters";

// 5段階のスライダー(飲んだ回ごと)
export type ScaleField = "sweet_dry" | "aroma_level" | "body";
export type Scale = { field: ScaleField; label: string; left: string; right: string };

// ★で付ける追加の評価(飲んだ回ごと)
export type StarField = "bitterness" | "smoky";

// 数字で入れる銘柄の情報
export type NumberProductField = "polish_ratio" | "sake_meter" | "acidity" | "age_years" | "vintage";

export type KindConfig = {
  makerLabel: string;
  categoryLabel: string;
  // 絞り込みの「すべて」と、レポートの円グラフの見出し
  categoryAll: string;
  categoryPlural: string;
  categories: string[];
  // 保存するときにスタイルが必須か(ビールだけ)
  categoryRequired: boolean;
  // 原料(日本酒は酒米、ワインはブドウ、シードルはリンゴ・洋梨)
  ingredient?: { label: string; placeholder: string };
  numbers: { field: NumberProductField; label: string; unit?: string; integer?: boolean; placeholder?: string }[];
  // ウイスキーの樽・ピート
  cask?: string[];
  peat?: typeof PEAT_LEVELS;
  scales: Scale[];
  stars: { field: StarField; label: string }[];
  // 飲み方の見出し(選択肢は masters の SERVED_OPTIONS)
  servedLabel?: string;
  sizePlaceholder: string;
  namePlaceholder: string;
};

// 味に関する言葉は日本語(使う人は日本人の想定)
const SWEET_DRY: Scale = { field: "sweet_dry", label: "甘辛", left: "甘口", right: "辛口" };
const BODY: Scale = { field: "body", label: "ボディ", left: "ライト", right: "フル" };

export const KIND_CONFIG: Record<Kind, KindConfig> = {
  beer: {
    makerLabel: "Brewery",
    categoryLabel: "Style",
    categoryAll: "All styles",
    categoryPlural: "Styles",
    categories: BEER_CATEGORIES.map((c) => c.label),
    categoryRequired: true,
    numbers: [],
    scales: [],
    stars: [{ field: "bitterness", label: "苦み" }],
    sizePlaceholder: "350ml缶",
    namePlaceholder: "例: よなよなエール",
  },
  sake: {
    // 日本酒は日本語の表現を多めに
    makerLabel: "酒蔵",
    categoryLabel: "特定名称",
    categoryAll: "特定名称(すべて)",
    categoryPlural: "特定名称",
    categories: SAKE_CATEGORIES,
    categoryRequired: false,
    ingredient: { label: "酒米", placeholder: "Yamada Nishiki" },
    numbers: [
      { field: "polish_ratio", label: "精米歩合", unit: "%", integer: true },
      { field: "sake_meter", label: "日本酒度", placeholder: "+3 / -2" },
      { field: "acidity", label: "酸度" },
    ],
    scales: [SWEET_DRY, { field: "aroma_level", label: "香りの強さ", left: "控えめ", right: "華やか" }],
    stars: [],
    servedLabel: "飲み方",
    sizePlaceholder: "720ml",
    namePlaceholder: "例: 獺祭 純米大吟醸 45",
  },
  whisky: {
    makerLabel: "Distillery",
    categoryLabel: "Type",
    categoryAll: "All types",
    categoryPlural: "Types",
    categories: WHISKY_TYPES,
    categoryRequired: false,
    numbers: [{ field: "age_years", label: "Age", unit: "yrs", integer: true, placeholder: "NAS" }],
    cask: CASKS,
    peat: PEAT_LEVELS,
    scales: [BODY],
    stars: [{ field: "smoky", label: "スモーキー" }],
    servedLabel: "Served",
    sizePlaceholder: "700ml",
    namePlaceholder: "例: 山崎 12年",
  },
  cider: {
    makerLabel: "Cidery",
    categoryLabel: "Style",
    categoryAll: "All styles",
    categoryPlural: "Styles",
    categories: CIDER_STYLES,
    categoryRequired: false,
    ingredient: { label: "Apple / pear", placeholder: "Bramley" },
    numbers: [],
    scales: [SWEET_DRY],
    stars: [],
    sizePlaceholder: "330ml瓶",
    namePlaceholder: "例: ニッカ シードル ドライ",
  },
  wine: {
    makerLabel: "Winery",
    categoryLabel: "Type",
    categoryAll: "All types",
    categoryPlural: "Types",
    categories: WINE_TYPES.map((t) => t.label),
    categoryRequired: false,
    ingredient: { label: "Grapes", placeholder: "Pinot Noir" },
    numbers: [{ field: "vintage", label: "Vintage", integer: true, placeholder: "2019" }],
    scales: [SWEET_DRY, BODY],
    stars: [],
    sizePlaceholder: "750ml",
    namePlaceholder: "例: シャトー・メルシャン 椀子 メルロー",
  },
};

export function categoriesFor(kind: Kind) {
  return KIND_CONFIG[kind].categories;
}
