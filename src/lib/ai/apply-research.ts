// AI の調査結果をフォームに入れる。ユーザーが既に入れた欄は上書きしない(空の欄だけ埋める)
import type { ResearchCandidate } from "@/lib/ai/research-schema";
import type { DrinkFormField, DrinkFormValues } from "@/lib/drink-form";
import type { Kind } from "@/lib/kinds";

const TEXT_FIELDS = {
  beer: ["maker", "maker_address", "country", "prefecture", "category", "abv", "price_yen", "price_note"],
  sake: [
    "maker", "maker_address", "country", "prefecture", "category", "abv", "price_yen", "price_note",
    "polish_ratio", "sake_meter", "acidity", "rice",
  ],
} as const satisfies Record<Kind, readonly DrinkFormField[]>;

export function applyCandidate(
  kind: Kind,
  values: DrinkFormValues,
  aiFilled: string[],
  candidate: ResearchCandidate,
): { values: DrinkFormValues; aiFilled: string[] } {
  const next = { ...values };
  const filled = new Set(aiFilled);
  const source = candidate as Record<string, unknown>;

  for (const field of TEXT_FIELDS[kind]) {
    const value = source[field];
    if (value == null || value === "") continue;
    // 日本酒は「国」の初期値が「日本」なので、日本酒の国は空扱いにしない(上書きしない)
    if ((next[field] as string).trim() !== "") continue;
    (next[field] as string) = String(value);
    filled.add(field);
  }
  // 名前が空のときだけ正式名称を入れる
  if (next.name.trim() === "" && candidate.name) {
    next.name = candidate.name;
    filled.add("name");
  }
  return { values: next, aiFilled: [...filled] };
}
