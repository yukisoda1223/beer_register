// AI の調査結果をフォームに入れる。
// - 空の欄は埋める
// - 前に AI が入れた欄(aiFilled)は、新しい調査結果で書き換える(名前を変えて調べ直したとき用)
// - ユーザーが自分で入れた欄は上書きしない
import type { ResearchCandidate } from "@/lib/ai/research-schema";
import type { DrinkFormField, DrinkFormValues } from "@/lib/drink-form";
import type { Kind } from "@/lib/kinds";

const FIELDS = {
  beer: ["maker", "maker_address", "country", "region", "category", "abv", "price_yen", "price_note"],
  sake: [
    "maker", "maker_address", "country", "region", "category", "abv", "price_yen", "price_note",
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

  for (const field of FIELDS[kind]) {
    const value = source[field];
    const current = (next[field] as string).trim();
    const wasAi = filled.has(field);
    if (current !== "" && !wasAi) continue;
    if (value == null || value === "") {
      // 前に AI が入れた値は、新しい結果に無ければ消す(古い銘柄の情報が残らないように)
      if (wasAi) {
        (next[field] as string) = "";
        filled.delete(field);
      }
      continue;
    }
    (next[field] as string) = String(value);
    filled.add(field);
  }
  // 名前が空、または前に AI が入れた名前なら、正式名称にする
  if ((next.name.trim() === "" || filled.has("name")) && candidate.name) {
    next.name = candidate.name;
    filled.add("name");
  }
  return { values: next, aiFilled: [...filled] };
}
