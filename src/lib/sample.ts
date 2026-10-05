// 見た目確認用のダミーデータ(銘柄・醸造所はすべて架空)。
// いまはレポート画面だけで使う。レポートの集計を作ったら(M7)消してよい。
import type { Drink } from "@/lib/drink";
import type { Kind } from "@/lib/kinds";

const EMPTY = {
  status: "saved",
  maker: null,
  maker_address: null,
  country: null,
  prefecture: null,
  abv: null,
  price_yen: null,
  price_note: null,
  rating: null,
  aroma: null,
  comment: null,
  image_path: null,
  category: null,
  beer_family: null,
  bitterness: null,
  polish_ratio: null,
  sake_meter: null,
  acidity: null,
  rice: null,
  sweet_dry: null,
  light_rich: null,
  serving_temp: null,
  lat: null,
  lng: null,
  ai_filled_fields: [] as string[],
  sources: [] as { title: string; url: string }[],
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
} as const;

const beer = (d: Partial<Drink> & Pick<Drink, "id" | "drunk_on" | "name">): Drink => ({ ...EMPTY, kind: "beer", ...d });
const sake = (d: Partial<Drink> & Pick<Drink, "id" | "drunk_on" | "name">): Drink => ({ ...EMPTY, kind: "sake", country: "日本", ...d });

export const SAMPLE_DRINKS: Record<Kind, Drink[]> = {
  beer: [
    beer({ id: "b1", drunk_on: "2026-09-28", name: "こはく坂ペールエール", category: "ペールエール", beer_family: "ale", rating: 4.5, bitterness: 3, aroma: 4, maker: "こはく坂ブルワリー", maker_address: "長野県松本市", country: "日本", prefecture: "長野県", abv: 5.5, price_yen: 380, price_note: "350ml缶", comment: "柑橘っぽい香りで飲みやすい。唐揚げと合う。" }),
    beer({ id: "b2", drunk_on: "2026-09-20", name: "みなと町ピルスナー", category: "ピルスナー", beer_family: "lager", rating: 4, bitterness: 2.5, aroma: 3, maker: "みなと町麦酒", country: "日本", prefecture: "神奈川県", abv: 5, price_yen: 330, price_note: "350ml缶" }),
    beer({ id: "b3", drunk_on: "2026-09-12", name: "ゆうやけヘイジーIPA 限定醸造 ダブルドライホップ仕込み", category: "ヘイジーIPA", beer_family: "ale", rating: 5, bitterness: 3.5, aroma: 5, maker: "Sunset Hill Brewing", country: "アメリカ", abv: 6.8, price_yen: 720, price_note: "473ml缶", comment: "トロピカルな香りがすごい。また飲みたい。" }),
    beer({ id: "b4", drunk_on: "2026-08-30", name: "山ねこスタウト", category: "スタウト", beer_family: "ale", rating: 3.5, bitterness: 4, aroma: 3.5, maker: "山ねこ醸造所", country: "日本", prefecture: "北海道", abv: 7 }),
    beer({ id: "b5", drunk_on: "2026-08-15", name: "なつぞらラガー", category: "ラガー(その他)", beer_family: "lager", rating: 3, bitterness: 2, aroma: 2, maker: "Brouwerij Zomerlucht", country: "ベルギー", abv: 4.5 }),
    beer({ id: "b6", drunk_on: "2026-07-22", name: "ももいろサワー", category: "サワーエール", beer_family: "other", rating: 4, bitterness: 1, aroma: 4, maker: "はなび醸造", country: "日本", prefecture: "福岡県", abv: 4 }),
  ],
  sake: [
    sake({ id: "s1", drunk_on: "2026-09-25", name: "月見川 純米吟醸", category: "純米吟醸", rating: 4.5, aroma: 4, maker: "月見川酒造", maker_address: "新潟県長岡市", prefecture: "新潟県", abv: 15, polish_ratio: 55, sake_meter: 3, acidity: 1.4, rice: "五百万石", sweet_dry: 4, light_rich: 2, serving_temp: "cold", price_yen: 1650, price_note: "720ml", comment: "すっきり辛口。刺身と合わせたい。" }),
    sake({ id: "s2", drunk_on: "2026-09-10", name: "雪あかり 純米大吟醸", category: "純米大吟醸", rating: 5, aroma: 5, maker: "雪あかり酒造", prefecture: "山形県", abv: 16, polish_ratio: 40, rice: "雪女神", sweet_dry: 3, light_rich: 2, serving_temp: "cold", price_yen: 2800, price_note: "720ml" }),
    sake({ id: "s3", drunk_on: "2026-08-28", name: "風待ち 特別純米", category: "特別純米", rating: 3.5, aroma: 3, maker: "風待ち酒造", prefecture: "高知県", polish_ratio: 60, sake_meter: 8, sweet_dry: 5, light_rich: 3, serving_temp: "warm" }),
    sake({ id: "s4", drunk_on: "2026-08-03", name: "里山 本醸造", category: "本醸造", rating: 3, aroma: 2.5, maker: "里山酒造", prefecture: "兵庫県", sweet_dry: 3, light_rich: 4, serving_temp: "hot" }),
  ],
};

export const SAMPLE_SUMMARY: Record<Kind, string> = {
  beer: "エール系が6割で、特にIPAの評価が高めです。夏はラガーが多くなる傾向です。",
  sake: "純米吟醸以上の評価が高く、淡麗辛口がお好きな傾向です。",
};

export const SAMPLE_CATEGORY_COUNTS: Record<Kind, { label: string; count: number }[]> = {
  beer: [
    { label: "IPA", count: 9 },
    { label: "ペールエール", count: 7 },
    { label: "ピルスナー", count: 6 },
    { label: "スタウト", count: 4 },
    { label: "ヴァイツェン", count: 3 },
    { label: "その他", count: 4 },
  ],
  sake: [
    { label: "純米吟醸", count: 6 },
    { label: "純米大吟醸", count: 4 },
    { label: "特別純米", count: 3 },
    { label: "本醸造", count: 2 },
    { label: "普通酒", count: 1 },
    { label: "その他", count: 2 },
  ],
};
