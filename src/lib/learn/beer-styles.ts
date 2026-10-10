// Learn(ビール): スタイル図鑑のデータ。数値の目安は BJCP(ビアスタイルのガイドライン)を参考にした代表的な範囲
import { beerColorOf } from "@/lib/masters";

export type GlassType =
  | "pilsner" | "mug" | "shaker" | "nonic" | "tulip" | "weizen" | "snifter" | "stange" | "chalice" | "ipa" | "tumbler" | "flute";

export const GLASS_NAMES: Record<GlassType, string> = {
  pilsner: "ピルスナーグラス",
  mug: "ジョッキ",
  shaker: "シェイカーパイント",
  nonic: "ノニックパイント",
  tulip: "チューリップグラス",
  weizen: "ヴァイツェングラス",
  snifter: "スニフター",
  stange: "シュタンゲ",
  chalice: "ゴブレット",
  ipa: "IPA グラス",
  tumbler: "タンブラー",
  flute: "フルートグラス",
};

export type Range = [number, number];

export type BeerStyle = {
  name: string; // 記録のスタイル名(BEER_CATEGORIES)と同じ
  slug: string;
  origin: string; // 発祥
  summary: string; // ひとことで
  description: string;
  abv: Range | null; // 度数(%)
  ibu: Range | null; // 苦み(IBU)
  srm: Range | null; // 色(SRM。数字が大きいほど濃い)
  glass: GlassType;
  temp: string; // おいしく飲める温度の目安
  pairing: string;
  foam?: string; // 泡の色(黒ビールは茶色っぽい)
};

export const BEER_STYLES: BeerStyle[] = [
  {
    name: "Pilsner",
    slug: "pilsner",
    origin: "チェコ・プルゼニ(1842年)",
    summary: "黄金色のラガーの元祖",
    description: "ボヘミアのプルゼニで生まれた、透きとおった黄金色のラガー。ザーツなどのホップの上品な苦みと香り、軽い麦芽の甘みで、後味はすっきり。今の世界のビールの多くがこのスタイルの流れをくむ。",
    abv: [4.2, 5.8],
    ibu: [22, 45],
    srm: [2, 6],
    glass: "pilsner",
    temp: "6〜8℃",
    pairing: "唐揚げ、ソーセージ、枝豆",
  },
  {
    name: "Lager",
    slug: "lager",
    origin: "世界各地(ドイツ・チェコのラガーが元)",
    summary: "世界でいちばん飲まれている軽快なラガー",
    description: "世界中の大手ブランドに多い、淡い色で軽快なラガー。苦みも香りも控えめで、よく冷やしてごくごく飲める。日本の定番ビールの多くもこのタイプ。",
    abv: [4.6, 6.0],
    ibu: [18, 25],
    srm: [2, 6],
    glass: "shaker",
    temp: "4〜7℃",
    pairing: "焼き鳥、餃子、なんでも",
  },
  {
    name: "Helles",
    slug: "helles",
    origin: "ドイツ・ミュンヘン(1894年)",
    summary: "麦の甘みがやさしいミュンヘンのラガー",
    description: "ピルスナーに対抗してミュンヘンで生まれた淡色ラガー。苦みは控えめで、パンのような麦芽の甘みとやわらかさが主役。ビアホールの大きなジョッキでおなじみ。",
    abv: [4.7, 5.4],
    ibu: [16, 22],
    srm: [3, 5],
    glass: "mug",
    temp: "6〜8℃",
    pairing: "白ソーセージ、プレッツェル",
  },
  {
    name: "Bock",
    slug: "bock",
    origin: "ドイツ・アインベック",
    summary: "麦芽のコクが濃い、強めのラガー",
    description: "北ドイツのアインベックで生まれ、ミュンヘンで広まった強めのラガー。トーストやカラメルのような麦芽のコクがあり、苦みは控えめ。より強いドッペルボックもある。",
    abv: [6.3, 7.2],
    ibu: [20, 27],
    srm: [14, 22],
    glass: "tulip",
    temp: "8〜12℃",
    pairing: "ローストポーク、熟成チーズ",
  },
  {
    name: "Rauchbier",
    slug: "rauchbier",
    origin: "ドイツ・バンベルク",
    summary: "燻製の香りがするラガー",
    description: "ブナの木で燻した麦芽を使う、バンベルク名物のラガー。ベーコンやスモークチーズのような香りがあり、最初は驚くが、くせになる人も多い。",
    abv: [4.8, 6.0],
    ibu: [20, 30],
    srm: [12, 22],
    glass: "mug",
    temp: "8〜10℃",
    pairing: "燻製、ハム、バーベキュー",
  },
  {
    name: "Schwarzbier",
    slug: "schwarzbier",
    origin: "ドイツ東部(テューリンゲン・ザクセン)",
    summary: "見た目は黒いが軽快な黒ラガー",
    description: "色は黒に近いが、ロースト香は控えめで口当たりは軽い。ほのかなチョコやコーヒーの香りと、ラガーらしいすっきりした後味が同居する。",
    abv: [4.4, 5.4],
    ibu: [20, 35],
    srm: [19, 30],
    glass: "pilsner",
    temp: "8〜10℃",
    pairing: "照り焼き、すき焼き",
    foam: "#E8D9BF",
  },
  {
    name: "Pale Ale",
    slug: "pale-ale",
    origin: "イギリス(バートン・アポン・トレント)",
    summary: "ホップと麦芽のバランスが良い淡色エール",
    description: "18世紀のイギリスで、それまでの黒いビールより淡い色のエールとして広まった。アメリカでは柑橘系のホップを効かせたアメリカン・ペールエールに発展し、クラフトビールの定番になった。",
    abv: [4.5, 6.2],
    ibu: [30, 50],
    srm: [5, 10],
    glass: "nonic",
    temp: "8〜12℃",
    pairing: "フィッシュ&チップス、ハンバーガー",
  },
  {
    name: "IPA",
    slug: "ipa",
    origin: "イギリス(18〜19世紀)",
    summary: "ホップの香りと苦みをたっぷり効かせたエール",
    description: "インドへの長い船旅に耐えるよう、ホップを多く入れたのが始まりと言われる。今のアメリカンIPAは、グレープフルーツや松のようなホップの香りと、しっかりした苦みが特徴。",
    abv: [5.5, 7.5],
    ibu: [40, 70],
    srm: [6, 14],
    glass: "ipa",
    temp: "8〜12℃",
    pairing: "カレー、スパイシーな料理",
  },
  {
    name: "Session IPA",
    slug: "session-ipa",
    origin: "アメリカ",
    summary: "度数低め、香りはしっかりのIPA",
    description: "IPAのホップの香りはそのままに、度数を下げて軽く飲めるようにしたスタイル。「セッション」は長い時間飲み続けられる、という意味。",
    abv: [3.0, 5.0],
    ibu: [40, 55],
    srm: [3, 12],
    glass: "nonic",
    temp: "6〜10℃",
    pairing: "サラダ、タコス",
  },
  {
    name: "Hazy IPA",
    slug: "hazy-ipa",
    origin: "アメリカ北東部(ニューイングランド)",
    summary: "濁っていてジューシーなIPA",
    description: "ニューイングランドIPAとも呼ばれる。ホップを発酵中や後にたっぷり入れ、トロピカルフルーツのようなジューシーな香りと、やわらかい口当たりが特徴。見た目はジュースのように濁っていて、苦みは控えめ。",
    abv: [6.0, 9.0],
    ibu: [25, 60],
    srm: [3, 7],
    glass: "tulip",
    temp: "6〜10℃",
    pairing: "エスニック料理、フルーツ",
  },
  {
    name: "Double IPA",
    slug: "double-ipa",
    origin: "アメリカ西海岸",
    summary: "IPAをさらに強く、ホップを倍に",
    description: "インペリアルIPAとも呼ばれる。麦芽もホップも増やし、度数も苦みも香りもIPAより一段上。強いが、麦芽の甘みでバランスがとれている。",
    abv: [7.5, 10.0],
    ibu: [60, 100],
    srm: [6, 14],
    glass: "snifter",
    temp: "10〜13℃",
    pairing: "ブルーチーズ、スパイシーな肉料理",
  },
  {
    name: "Weizen",
    slug: "weizen",
    origin: "ドイツ南部(バイエルン)",
    summary: "バナナとクローブの香りの小麦ビール",
    description: "麦芽の半分以上に小麦を使ったバイエルンのエール(ヴァイスビア)。専用の酵母が生むバナナやクローブのような香りと、ふんわりした泡、なめらかな口当たりが特徴。",
    abv: [4.3, 5.6],
    ibu: [8, 15],
    srm: [2, 6],
    glass: "weizen",
    temp: "6〜8℃",
    pairing: "白ソーセージ、サラダ",
  },
  {
    name: "Witbier",
    slug: "witbier",
    origin: "ベルギー(ヘーガルデン)",
    summary: "オレンジとコリアンダーの白ビール",
    description: "小麦を使い、オレンジピールとコリアンダーで香りをつけたベルギーの白ビール。白く濁った見た目で、さわやかな柑橘の香りと軽い酸味がある。",
    abv: [4.5, 5.5],
    ibu: [8, 20],
    srm: [2, 4],
    glass: "tumbler",
    temp: "4〜7℃",
    pairing: "ムール貝、白身魚、サラダ",
  },
  {
    name: "Saison",
    slug: "saison",
    origin: "ベルギー南部(ワロン地方)",
    summary: "農家生まれのドライでスパイシーなエール",
    description: "もとは農家が夏の作業の合間に飲むために冬に仕込んだビール。酵母由来のコショウのようなスパイシーさと、とてもドライな後味で、炭酸も強め。",
    abv: [3.5, 9.5],
    ibu: [20, 35],
    srm: [5, 14],
    glass: "tulip",
    temp: "8〜12℃",
    pairing: "鶏肉のハーブ焼き、チーズ",
  },
  {
    name: "Amber Ale",
    slug: "amber-ale",
    origin: "アメリカ",
    summary: "カラメルの甘みとホップのバランス",
    description: "琥珀色のエール。カラメル麦芽の甘くこうばしい味わいと、アメリカンホップの苦みと香りのバランスが良い。",
    abv: [4.5, 6.2],
    ibu: [25, 40],
    srm: [10, 17],
    glass: "nonic",
    temp: "8〜12℃",
    pairing: "ハンバーガー、ピザ",
  },
  {
    name: "Brown Ale",
    slug: "brown-ale",
    origin: "イギリス北東部",
    summary: "ナッツやチョコのような香ばしいエール",
    description: "茶色いエール。ナッツやトフィー、ミルクチョコのような麦芽の香ばしさがあり、苦みは控えめから中くらい。アメリカ版はホップがやや強め。",
    abv: [4.2, 6.2],
    ibu: [20, 40],
    srm: [12, 22],
    glass: "nonic",
    temp: "10〜13℃",
    pairing: "ローストビーフ、ナッツ",
  },
  {
    name: "Porter",
    slug: "porter",
    origin: "イギリス・ロンドン(18世紀)",
    summary: "荷運び人に愛された黒いエール",
    description: "ロンドンの荷運び人(ポーター)に好まれたことが名前の由来と言われる。チョコやカラメルのような味わいで、スタウトより少し軽やか。",
    abv: [4.0, 5.4],
    ibu: [18, 35],
    srm: [20, 30],
    glass: "nonic",
    temp: "10〜13℃",
    pairing: "牡蠣、煮込み料理",
    foam: "#E8D3B0",
  },
  {
    name: "Stout",
    slug: "stout",
    origin: "イギリス → アイルランド・ダブリン",
    summary: "ローストしたコーヒーのような黒ビール",
    description: "ポーターの強いもの(スタウト=強い)から生まれた黒ビール。ローストした大麦のコーヒーのような香ばしさと、クリーミーな泡が特徴。アイリッシュ・スタウトは度数低めで軽く、インペリアル・スタウトはとても強い。",
    abv: [4.0, 7.0],
    ibu: [25, 45],
    srm: [25, 40],
    glass: "tulip",
    temp: "8〜13℃",
    pairing: "牡蠣、チョコレートケーキ",
    foam: "#E8D3B0",
  },
  {
    name: "Kölsch",
    slug: "kolsch",
    origin: "ドイツ・ケルン",
    summary: "エールなのにラガーのように澄んだビール",
    description: "上面発酵(エールの酵母)で造ったあと、低温で熟成させるケルンのビール。ほのかなフルーティーさと、ラガーのようなすっきりした後味を合わせ持つ。細長い0.2Lのグラス(シュタンゲ)で飲む。",
    abv: [4.4, 5.2],
    ibu: [18, 30],
    srm: [3.5, 5],
    glass: "stange",
    temp: "4〜7℃",
    pairing: "ソーセージ、ポテトサラダ",
  },
  {
    name: "Cream Ale",
    slug: "cream-ale",
    origin: "アメリカ(19世紀)",
    summary: "ラガーに対抗した軽くなめらかなエール",
    description: "人気のラガーに対抗するため、アメリカのエール醸造所が生んだスタイル。淡い色で軽く、なめらかでクリーンな飲み口。クリームは入っていない。",
    abv: [4.2, 5.6],
    ibu: [8, 20],
    srm: [2, 5],
    glass: "shaker",
    temp: "4〜7℃",
    pairing: "ホットドッグ、フライドチキン",
  },
  {
    name: "Tripel",
    slug: "tripel",
    origin: "ベルギー(ウェストマール修道院が広めた)",
    summary: "金色で強い、ベルギーの修道院ビール",
    description: "金色なのに度数は高い、ベルギーの修道院スタイル。洋ナシやバナナのようなフルーティーな香りとスパイシーさ、ドライな後味。強さを感じさせない飲みやすさに注意。",
    abv: [7.5, 9.5],
    ibu: [20, 40],
    srm: [4.5, 7],
    glass: "chalice",
    temp: "8〜12℃",
    pairing: "ローストチキン、ウォッシュチーズ",
  },
  {
    name: "Barleywine",
    slug: "barleywine",
    origin: "イギリス",
    summary: "ワインのように強い、熟成向きのエール",
    description: "ワインに匹敵する度数をもつ、とても強いエール。カラメルやドライフルーツのような濃厚な味わいで、何年も熟成させて楽しむこともある。少しずつゆっくり飲む。",
    abv: [8.0, 12.0],
    ibu: [35, 70],
    srm: [8, 22],
    glass: "snifter",
    temp: "12〜16℃",
    pairing: "ブルーチーズ、ドライフルーツ",
  },
  {
    name: "Sour Ale",
    slug: "sour-ale",
    origin: "ベルギー・ドイツなど",
    summary: "乳酸菌や野生酵母による酸っぱいビール",
    description: "乳酸菌や野生酵母で、ヨーグルトやレモンのような酸味をつけたビールの総称。ベルリナーヴァイセ、ゴーゼ、ベルギーのランビックやフランダース・レッドなど、スタイルによって度数も色も幅広い。",
    abv: [3.0, 7.0],
    ibu: [0, 25],
    srm: [2, 20],
    glass: "tulip",
    temp: "6〜10℃",
    pairing: "生ハム、魚介のマリネ",
  },
  {
    name: "Fruit Beer",
    slug: "fruit-beer",
    origin: "ベルギー(クリーク・フランボワーズ)など",
    summary: "果物を使ったビール",
    description: "サクランボ(クリーク)やラズベリー(フランボワーズ)など、果物を漬け込んだり加えたりしたビール。ベースのスタイルによって甘いものから酸っぱいものまである。",
    abv: null,
    ibu: null,
    srm: null,
    glass: "flute",
    temp: "4〜8℃",
    pairing: "デザート、チーズケーキ",
  },
  {
    name: "Radler",
    slug: "radler",
    origin: "ドイツ・バイエルン",
    summary: "ビールをレモンソーダで割った軽い一杯",
    description: "ビールとレモネード(レモンソーダ)をおよそ半分ずつ混ぜたもの。「ラードラー」はドイツ語で自転車乗りのこと。度数が低く、昼間やスポーツのあとにぴったり。",
    abv: [2.0, 3.0],
    ibu: null,
    srm: [2, 5],
    glass: "mug",
    temp: "4〜6℃",
    pairing: "サラダ、軽食",
  },
];

export function beerStyleBySlug(slug: string) {
  return BEER_STYLES.find((s) => s.slug === slug);
}
export function beerStyleByName(name: string | null | undefined) {
  return name ? BEER_STYLES.find((s) => s.name === name) : undefined;
}
export function beerStyleColor(s: BeerStyle) {
  return beerColorOf(s.name);
}

// 系統樹: ビール → 系統(ラガー / エール / そのほか)→ グループ → スタイル
export type TreeGroup = { label: string; note?: string; styles: string[] };
export type TreeFamily = { key: "lager" | "ale" | "other"; label: string; ja: string; note: string; groups: TreeGroup[] };

export const BEER_TREE: TreeFamily[] = [
  {
    key: "lager",
    label: "Lager",
    ja: "下面発酵",
    note: "低温でじっくり。すっきり・キレ",
    groups: [
      { label: "Pale", styles: ["Pilsner", "Helles", "Lager"] },
      { label: "Dark", styles: ["Bock", "Schwarzbier", "Rauchbier"] },
    ],
  },
  {
    key: "ale",
    label: "Ale",
    ja: "上面発酵",
    note: "常温に近い温度で。香り豊か・コク",
    groups: [
      { label: "Pale & Hoppy", styles: ["Pale Ale", "IPA", "Session IPA", "Hazy IPA", "Double IPA"] },
      { label: "Malty", styles: ["Amber Ale", "Brown Ale", "Barleywine"] },
      { label: "Dark", styles: ["Porter", "Stout"] },
      { label: "Wheat", styles: ["Weizen", "Witbier"] },
      { label: "Belgian", styles: ["Saison", "Tripel"] },
      { label: "Hybrid", note: "エール酵母で低温熟成", styles: ["Kölsch", "Cream Ale"] },
    ],
  },
  {
    key: "other",
    label: "Other",
    ja: "そのほか",
    note: "野生酵母・果物・ミックス",
    groups: [{ label: "", styles: ["Sour Ale", "Fruit Beer", "Radler"] }],
  },
];

// スタイルがどの系統・グループにあるか(詳細ページのパンくず)
export function treePathOf(name: string) {
  for (const f of BEER_TREE) {
    for (const g of f.groups) if (g.styles.includes(name)) return { family: f, group: g };
  }
  return null;
}

// SRM(色の数字)→ 色。グラフの帯に使う目安の色
export const SRM_STOPS: [number, string][] = [
  [2, "#F8F753"],
  [3, "#F6F513"],
  [4, "#ECE61A"],
  [6, "#D5BC26"],
  [8, "#BF923B"],
  [10, "#BC6733"],
  [13, "#A0522D"],
  [17, "#7A3A1C"],
  [20, "#5D341A"],
  [25, "#2E1A10"],
  [30, "#1A100B"],
  [40, "#080707"],
];
export const SRM_MAX = 40;
