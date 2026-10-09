// 日本酒の都道府県の制覇マップ。47マスを日本地図の形に並べる(列 c・行 r)
import { PREFECTURES } from "@/lib/masters";
import type { StatRecord } from "@/lib/stats";

export const JAPAN_TILES: { name: string; label: string; c: number; r: number }[] = [
  { name: "Hokkaido", label: "北海", c: 13, r: 0 },
  { name: "Aomori", label: "青森", c: 13, r: 2 },
  { name: "Akita", label: "秋田", c: 12, r: 3 },
  { name: "Iwate", label: "岩手", c: 13, r: 3 },
  { name: "Yamagata", label: "山形", c: 12, r: 4 },
  { name: "Miyagi", label: "宮城", c: 13, r: 4 },
  { name: "Ishikawa", label: "石川", c: 9, r: 5 },
  { name: "Toyama", label: "富山", c: 10, r: 5 },
  { name: "Niigata", label: "新潟", c: 11, r: 5 },
  { name: "Fukushima", label: "福島", c: 12, r: 5 },
  { name: "Fukui", label: "福井", c: 8, r: 6 },
  { name: "Gifu", label: "岐阜", c: 9, r: 6 },
  { name: "Nagano", label: "長野", c: 10, r: 6 },
  { name: "Gunma", label: "群馬", c: 11, r: 6 },
  { name: "Tochigi", label: "栃木", c: 12, r: 6 },
  { name: "Ibaraki", label: "茨城", c: 13, r: 6 },
  { name: "Shimane", label: "島根", c: 4, r: 7 },
  { name: "Tottori", label: "鳥取", c: 5, r: 7 },
  { name: "Hyogo", label: "兵庫", c: 6, r: 7 },
  { name: "Kyoto", label: "京都", c: 7, r: 7 },
  { name: "Shiga", label: "滋賀", c: 8, r: 7 },
  { name: "Aichi", label: "愛知", c: 9, r: 7 },
  { name: "Yamanashi", label: "山梨", c: 10, r: 7 },
  { name: "Saitama", label: "埼玉", c: 11, r: 7 },
  { name: "Tokyo", label: "東京", c: 12, r: 7 },
  { name: "Chiba", label: "千葉", c: 13, r: 7 },
  { name: "Yamaguchi", label: "山口", c: 3, r: 8 },
  { name: "Hiroshima", label: "広島", c: 4, r: 8 },
  { name: "Okayama", label: "岡山", c: 5, r: 8 },
  { name: "Osaka", label: "大阪", c: 6, r: 8 },
  { name: "Nara", label: "奈良", c: 7, r: 8 },
  { name: "Mie", label: "三重", c: 8, r: 8 },
  { name: "Shizuoka", label: "静岡", c: 10, r: 8 },
  { name: "Kanagawa", label: "神奈", c: 11, r: 8 },
  { name: "Saga", label: "佐賀", c: 1, r: 9 },
  { name: "Fukuoka", label: "福岡", c: 2, r: 9 },
  { name: "Ehime", label: "愛媛", c: 4, r: 9 },
  { name: "Kagawa", label: "香川", c: 5, r: 9 },
  { name: "Wakayama", label: "和歌", c: 7, r: 9 },
  { name: "Nagasaki", label: "長崎", c: 0, r: 10 },
  { name: "Kumamoto", label: "熊本", c: 1, r: 10 },
  { name: "Oita", label: "大分", c: 2, r: 10 },
  { name: "Kochi", label: "高知", c: 4, r: 10 },
  { name: "Tokushima", label: "徳島", c: 5, r: 10 },
  { name: "Kagoshima", label: "鹿児", c: 1, r: 11 },
  { name: "Miyazaki", label: "宮崎", c: 2, r: 11 },
  { name: "Okinawa", label: "沖縄", c: 0, r: 12 },
];

// 都道府県ごとの、飲んだ銘柄の数(同じ銘柄は1つ)
export function prefectureCounts(records: StatRecord[]) {
  const products = new Map<string, string>();
  for (const r of records) {
    if (r.status !== "saved" || r.country !== "Japan" || !r.region || !PREFECTURES.includes(r.region)) continue;
    products.set(r.product_id, r.region);
  }
  const counts: Record<string, number> = {};
  for (const region of products.values()) counts[region] = (counts[region] ?? 0) + 1;
  return { counts, covered: Object.keys(counts).length };
}

// マスの濃さ(0〜4): 0 / 1銘柄 / 2 / 3〜4 / 5以上
export function prefectureLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  return count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
}
