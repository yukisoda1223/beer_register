// Learn(日本酒): 特定名称のデータ。定義は国税庁「清酒の製法品質表示基準」による
// (どれも麹米の使用割合 15% 以上、3等以上の米。醸造アルコールは白米の重さの 10% 以下)
export type SakeType = "薫酒" | "爽酒" | "醇酒" | "熟酒";
export type SakeGroup = "junmai" | "honjozo" | "futsu";

export const SAKE_GROUPS: Record<SakeGroup, { ja: string; note: string }> = {
  junmai: { ja: "純米系", note: "米・米麹・水だけ" },
  honjozo: { ja: "本醸造系", note: "醸造アルコールを少し加える" },
  futsu: { ja: "普通酒", note: "特定名称の条件に当てはまらないもの" },
};

export type SakeGrade = {
  name: string; // 記録の特定名称(SAKE_CATEGORIES)と同じ英語のキー
  ja: string;
  slug: string;
  group: SakeGroup;
  polish: string; // 精米歩合の条件
  polishFor: number; // イラストに使う精米歩合(%)
  polishIsRule: boolean; // 条件(false = 決まりはなく、よくある値)
  method?: string; // 造り方の条件
  types: SakeType[];
  summary: string;
  description: string;
  aroma: string;
  taste: string;
  temp: string;
  pairing: string;
};

export const SAKE_GRADES: SakeGrade[] = [
  {
    name: "Junmai Daiginjo",
    ja: "純米大吟醸",
    slug: "junmai-daiginjo",
    group: "junmai",
    polish: "50%以下",
    polishFor: 50,
    polishIsRule: true,
    method: "吟醸造り",
    types: ["薫酒"],
    summary: "米を半分以上削り、米だけで醸した最高峰",
    description: "精米歩合50%以下まで磨いた米と米麹・水だけで、低温でじっくり発酵させる「吟醸造り」で造る。りんごやメロンのような華やかな吟醸香と、雑味のないなめらかな口当たりが特徴。",
    aroma: "華やか(りんご・メロン・バナナ)",
    taste: "なめらか・繊細",
    temp: "冷酒(10℃前後)",
    pairing: "白身の刺身、カルパッチョ",
  },
  {
    name: "Junmai Ginjo",
    ja: "純米吟醸",
    slug: "junmai-ginjo",
    group: "junmai",
    polish: "60%以下",
    polishFor: 60,
    polishIsRule: true,
    method: "吟醸造り",
    types: ["薫酒", "醇酒"],
    summary: "華やかな香りと米のうまみのバランス",
    description: "精米歩合60%以下の米を吟醸造りで醸した純米酒。吟醸香の華やかさと、純米らしい米のうまみの両方を楽しめる。銘柄ごとの個性の幅が広く、人気のある名称。",
    aroma: "ほどよく華やか",
    taste: "やわらか・うまみ",
    temp: "冷酒〜常温",
    pairing: "天ぷら、焼き魚",
  },
  {
    name: "Tokubetsu Junmai",
    ja: "特別純米",
    slug: "tokubetsu-junmai",
    group: "junmai",
    polish: "60%以下、または特別な製造方法",
    polishFor: 60,
    polishIsRule: true,
    types: ["醇酒"],
    summary: "純米酒より一歩こだわった造り",
    description: "精米歩合60%以下まで磨くか、特別な製造方法(特別な酒米を使う、など。ラベルに説明が必要)で造った純米酒。香りは穏やかで、米のうまみとすっきりした後味のバランスが良い。",
    aroma: "穏やか",
    taste: "うまみ・すっきり",
    temp: "常温〜ぬる燗",
    pairing: "焼き鳥(塩)、おでん",
  },
  {
    name: "Junmai",
    ja: "純米",
    slug: "junmai",
    group: "junmai",
    polish: "決まりはない(70%前後が多い)",
    polishFor: 70,
    polishIsRule: false,
    types: ["醇酒"],
    summary: "米・米麹・水だけ。米のうまみがしっかり",
    description: "米・米麹・水だけで造った日本酒。精米歩合の決まりはない。米のうまみやコクがしっかり感じられ、燗にすると味がふくらむものが多い。",
    aroma: "控えめ(炊いた米・穀物)",
    taste: "コク・うまみ",
    temp: "常温〜熱燗",
    pairing: "煮物、すき焼き、チーズ",
  },
  {
    name: "Daiginjo",
    ja: "大吟醸",
    slug: "daiginjo",
    group: "honjozo",
    polish: "50%以下",
    polishFor: 50,
    polishIsRule: true,
    method: "吟醸造り・醸造アルコールを少し",
    types: ["薫酒"],
    summary: "香りが立つ、軽やかでキレのある吟醸酒",
    description: "精米歩合50%以下の米を吟醸造りで醸し、醸造アルコールを少し加えたもの。アルコールを加えると吟醸香が引き出され、軽やかでキレのある味わいになる。鑑評会の出品酒にも多い。",
    aroma: "とても華やか",
    taste: "軽やか・キレ",
    temp: "冷酒(10℃前後)",
    pairing: "刺身、酢の物",
  },
  {
    name: "Ginjo",
    ja: "吟醸",
    slug: "ginjo",
    group: "honjozo",
    polish: "60%以下",
    polishFor: 60,
    polishIsRule: true,
    method: "吟醸造り・醸造アルコールを少し",
    types: ["薫酒"],
    summary: "フルーティーで軽快な吟醸酒",
    description: "精米歩合60%以下の米を吟醸造りで醸し、醸造アルコールを少し加えたもの。華やかな香りとすっきりした飲み口で、冷やしてワイングラスで飲むのもおすすめ。",
    aroma: "華やか",
    taste: "軽快・すっきり",
    temp: "冷酒〜涼冷え",
    pairing: "白身魚、山菜の天ぷら",
  },
  {
    name: "Tokubetsu Honjozo",
    ja: "特別本醸造",
    slug: "tokubetsu-honjozo",
    group: "honjozo",
    polish: "60%以下、または特別な製造方法",
    polishFor: 60,
    polishIsRule: true,
    types: ["爽酒"],
    summary: "本醸造より磨いた、すっきり辛口",
    description: "精米歩合60%以下、または特別な製造方法で造った本醸造酒。香りは控えめで、すっきりとしたキレのある味わいのものが多い。冷やでも燗でもおいしい。",
    aroma: "控えめ",
    taste: "すっきり・キレ",
    temp: "冷や〜上燗",
    pairing: "焼き魚、冷奴",
  },
  {
    name: "Honjozo",
    ja: "本醸造",
    slug: "honjozo",
    group: "honjozo",
    polish: "70%以下",
    polishFor: 70,
    polishIsRule: true,
    types: ["爽酒"],
    summary: "軽快で飲み飽きしない晩酌の定番",
    description: "精米歩合70%以下の米に、醸造アルコールを少し加えて造る。軽快ですっきり、飲み飽きしないので普段の晩酌向き。燗にすると香りがふくらむ。",
    aroma: "控えめ",
    taste: "軽快・辛口寄り",
    temp: "常温〜熱燗",
    pairing: "枝豆、もつ煮",
  },
  {
    name: "Futsushu",
    ja: "普通酒",
    slug: "futsushu",
    group: "futsu",
    polish: "決まりはない",
    polishFor: 75,
    polishIsRule: false,
    types: ["爽酒", "醇酒"],
    summary: "特定名称以外の日本酒。毎日の一杯",
    description: "特定名称の条件(精米歩合や醸造アルコールの量など)に当てはまらない日本酒。流通している日本酒の多くを占め、値段が手ごろ。地元で愛される晩酌酒も多く、燗にも向く。",
    aroma: "銘柄によりさまざま",
    taste: "銘柄によりさまざま",
    temp: "常温〜熱燗",
    pairing: "なんでも(おでん、焼き鳥)",
  },
];

export function sakeGradeBySlug(slug: string) {
  return SAKE_GRADES.find((g) => g.slug === slug);
}
export function sakeGradeByName(name: string | null | undefined) {
  return name ? SAKE_GRADES.find((g) => g.name === name) : undefined;
}

// 香りと味の4タイプ(香りの高さ × 味の濃さ)
export const SAKE_TYPES: { type: SakeType; aroma: "high" | "low"; body: "light" | "rich"; note: string; examples: string }[] = [
  { type: "薫酒", aroma: "high", body: "light", note: "香りが高く、軽やか", examples: "大吟醸・吟醸" },
  { type: "熟酒", aroma: "high", body: "rich", note: "香りが高く、濃厚", examples: "古酒・長期熟成酒" },
  { type: "爽酒", aroma: "low", body: "light", note: "香りは控えめ、軽快", examples: "本醸造・生酒" },
  { type: "醇酒", aroma: "low", body: "rich", note: "香りは控えめ、コク", examples: "純米・生酛・山廃" },
];

// 温度による呼び名(冷やして飲む・燗をつける)
// served: 記録で選べる飲み方(冷酒・常温・ぬる燗・熱燗)に近い行。その行に記録した杯数を出す
export const SAKE_TEMPS: { name: string; reading: string; temp: string; served?: "cold" | "room" | "warm" | "hot" }[] = [
  { name: "雪冷え", reading: "ゆきびえ", temp: "5℃" },
  { name: "花冷え", reading: "はなびえ", temp: "10℃", served: "cold" },
  { name: "涼冷え", reading: "すずびえ", temp: "15℃" },
  { name: "冷や", reading: "ひや", temp: "20℃前後(常温)", served: "room" },
  { name: "日向燗", reading: "ひなたかん", temp: "30℃" },
  { name: "人肌燗", reading: "ひとはだかん", temp: "35℃" },
  { name: "ぬる燗", reading: "ぬるかん", temp: "40℃", served: "warm" },
  { name: "上燗", reading: "じょうかん", temp: "45℃" },
  { name: "熱燗", reading: "あつかん", temp: "50℃", served: "hot" },
  { name: "飛び切り燗", reading: "とびきりかん", temp: "55℃以上" },
];
