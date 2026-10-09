// AI の調査結果をフォームに入れる。
// - 空の欄は埋める
// - 前に AI が入れた欄(aiFilled)は、新しい調査結果で書き換える(名前を変えて調べ直したとき用)
// - ユーザーが自分で入れた欄は上書きしない
import type { ResearchCandidate } from "@/lib/ai/research-schema";
import type { DrinkFormField, DrinkFormValues } from "@/lib/drink-form";
import { KIND_CONFIG } from "@/lib/kind-config";
import type { Kind } from "@/lib/kinds";

const COMMON: DrinkFormField[] = ["maker", "maker_address", "country", "region", "category", "abv", "price_yen", "price_note"];

// その種類で AI が調べる欄
function fieldsFor(kind: Kind): DrinkFormField[] {
  const c = KIND_CONFIG[kind];
  return [
    ...COMMON,
    ...c.numbers.map((n) => n.field),
    ...(c.ingredient ? (["ingredient"] as const) : []),
    ...(c.cask ? (["cask"] as const) : []),
    ...(c.peat ? (["peat"] as const) : []),
  ];
}

export function applyCandidate(
  kind: Kind,
  values: DrinkFormValues,
  aiFilled: string[],
  candidate: ResearchCandidate,
): { values: DrinkFormValues; aiFilled: string[] } {
  const next = { ...values };
  const filled = new Set(aiFilled);
  const source = candidate as Record<string, unknown>;

  for (const field of fieldsFor(kind)) {
    const value = source[field];
    const current = String(next[field] ?? "").trim();
    const wasAi = filled.has(field);
    if (current !== "" && !wasAi) continue;
    if (value == null || value === "") {
      // 前に AI が入れた値は、新しい結果に無ければ消す(古い銘柄の情報が残らないように)
      if (wasAi) {
        (next as Record<string, unknown>)[field] = field === "peat" ? null : "";
        filled.delete(field);
      }
      continue;
    }
    (next as Record<string, unknown>)[field] = field === "peat" ? value : String(value);
    filled.add(field);
  }
  // 名前が空、または前に AI が入れた名前なら、正式名称にする
  if ((next.name.trim() === "" || filled.has("name")) && candidate.name) {
    next.name = candidate.name;
    filled.add("name");
  }
  return { values: next, aiFilled: [...filled] };
}
