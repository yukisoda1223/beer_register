// マイルストーン1の見た目確認用のダミーデータ(銘柄はすべて架空)。
// データベースができたら(M3以降)使わなくなるので消してよい。
import type { Kind } from "@/lib/kinds";

export type SampleDrink = {
  id: string;
  drunkOn: string;
  name: string;
  category: string;
  rating: number;
  icon: "ale" | "lager" | "other" | "sake";
};

export const SAMPLE_DRINKS: Record<Kind, SampleDrink[]> = {
  beer: [
    { id: "b1", drunkOn: "2026-09-28", name: "こはく坂ペールエール", category: "ペールエール", rating: 4.5, icon: "ale" },
    { id: "b2", drunkOn: "2026-09-20", name: "みなと町ピルスナー", category: "ピルスナー", rating: 4, icon: "lager" },
    { id: "b3", drunkOn: "2026-09-12", name: "ゆうやけヘイジーIPA 限定醸造 ダブルドライホップ仕込み", category: "ヘイジーIPA", rating: 5, icon: "ale" },
    { id: "b4", drunkOn: "2026-08-30", name: "山ねこスタウト", category: "スタウト", rating: 3.5, icon: "ale" },
    { id: "b5", drunkOn: "2026-08-15", name: "なつぞらラガー", category: "ラガー(その他)", rating: 3, icon: "lager" },
    { id: "b6", drunkOn: "2026-07-22", name: "ももいろサワー", category: "サワーエール", rating: 4, icon: "other" },
  ],
  sake: [
    { id: "s1", drunkOn: "2026-09-25", name: "月見川 純米吟醸", category: "純米吟醸", rating: 4.5, icon: "sake" },
    { id: "s2", drunkOn: "2026-09-10", name: "雪あかり 純米大吟醸", category: "純米大吟醸", rating: 5, icon: "sake" },
    { id: "s3", drunkOn: "2026-08-28", name: "風待ち 特別純米", category: "特別純米", rating: 3.5, icon: "sake" },
    { id: "s4", drunkOn: "2026-08-03", name: "里山 本醸造", category: "本醸造", rating: 3, icon: "sake" },
  ],
};

export const SAMPLE_AI_COMMENT: Record<Kind, string> = {
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
