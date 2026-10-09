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

const SWEET_DRY: Scale = { field: "sweet_dry", label: "Sweet — Dry", left: "Sweet", right: "Dry" };
const BODY: Scale = { field: "body", label: "Body", left: "Light", right: "Full" };

export const KIND_CONFIG: Record<Kind, KindConfig> = {
  beer: {
    makerLabel: "Brewery",
    categoryLabel: "Style",
    categories: BEER_CATEGORIES.map((c) => c.label),
    categoryRequired: true,
    numbers: [],
    scales: [],
    stars: [{ field: "bitterness", label: "Bitterness" }],
    sizePlaceholder: "350ml缶",
    namePlaceholder: "例: よなよなエール",
  },
  sake: {
    makerLabel: "Brewery",
    categoryLabel: "Grade",
    categories: SAKE_CATEGORIES,
    categoryRequired: false,
    ingredient: { label: "Rice", placeholder: "Yamada Nishiki" },
    numbers: [
      { field: "polish_ratio", label: "Polishing", unit: "%", integer: true },
      { field: "sake_meter", label: "SMV", placeholder: "+3 / -2" },
      { field: "acidity", label: "Acidity" },
    ],
    scales: [SWEET_DRY, { field: "aroma_level", label: "Aroma intensity", left: "Subtle", right: "Fragrant" }],
    stars: [],
    servedLabel: "Served",
    sizePlaceholder: "720ml",
    namePlaceholder: "例: 獺祭 純米大吟醸 45",
  },
  whisky: {
    makerLabel: "Distillery",
    categoryLabel: "Type",
    categories: WHISKY_TYPES,
    categoryRequired: false,
    numbers: [{ field: "age_years", label: "Age", unit: "yrs", integer: true, placeholder: "NAS" }],
    cask: CASKS,
    peat: PEAT_LEVELS,
    scales: [BODY],
    stars: [{ field: "smoky", label: "Smoky" }],
    servedLabel: "Served",
    sizePlaceholder: "700ml",
    namePlaceholder: "例: 山崎 12年",
  },
  cider: {
    makerLabel: "Cidery",
    categoryLabel: "Style",
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
