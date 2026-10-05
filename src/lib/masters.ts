// 選択肢マスタ(仕様書 §6)
import type { BeerFamily, ServingTemp } from "@/lib/drink";

// 6.1 ビールのカテゴリと系統
export const BEER_CATEGORIES: { label: string; family: BeerFamily }[] = [
  { label: "ピルスナー", family: "lager" },
  { label: "ラガー(その他)", family: "lager" },
  { label: "ヘレス", family: "lager" },
  { label: "ボック", family: "lager" },
  { label: "ラオホ", family: "lager" },
  { label: "ペールエール", family: "ale" },
  { label: "IPA", family: "ale" },
  { label: "セッションIPA", family: "ale" },
  { label: "ヘイジーIPA", family: "ale" },
  { label: "ダブルIPA", family: "ale" },
  { label: "ヴァイツェン", family: "ale" },
  { label: "ベルジャンホワイト", family: "ale" },
  { label: "セゾン", family: "ale" },
  { label: "アンバーエール", family: "ale" },
  { label: "ブラウンエール", family: "ale" },
  { label: "ポーター", family: "ale" },
  { label: "スタウト", family: "ale" },
  { label: "ケルシュ", family: "ale" },
  { label: "トリペル", family: "ale" },
  { label: "バーレイワイン", family: "ale" },
  { label: "サワーエール", family: "other" },
  { label: "フルーツビール", family: "other" },
  { label: "その他", family: "other" },
];

export const BEER_FAMILY_LABELS: Record<BeerFamily, string> = {
  ale: "エール系",
  lager: "ラガー系",
  other: "その他",
};

export function beerFamilyOf(category: string | null | undefined): BeerFamily | null {
  if (!category) return null;
  return BEER_CATEGORIES.find((c) => c.label === category)?.family ?? "other";
}

// 6.2 日本酒の特定名称
export const SAKE_CATEGORIES = [
  "純米大吟醸",
  "純米吟醸",
  "特別純米",
  "純米",
  "大吟醸",
  "吟醸",
  "特別本醸造",
  "本醸造",
  "普通酒",
  "その他",
];

// 6.3 飲んだ温度(日本酒)
export const SERVING_TEMPS: { value: ServingTemp; label: string }[] = [
  { value: "cold", label: "冷酒" },
  { value: "room", label: "常温" },
  { value: "warm", label: "ぬる燗" },
  { value: "hot", label: "熱燗" },
];

// 6.4 都道府県(北から順)
export const PREFECTURES = [
  "北海道",
  "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県",
  "沖縄県",
];

// 国の入力候補(自由入力もできる)
export const COUNTRY_SUGGESTIONS = [
  "日本", "アメリカ", "ベルギー", "ドイツ", "チェコ", "イギリス", "アイルランド",
  "オランダ", "デンマーク", "カナダ", "オーストラリア", "ニュージーランド", "メキシコ", "中国", "台湾", "韓国",
];
