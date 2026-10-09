// 「チャットで入力」の読み取り結果をフォームに入れる。入力済みの欄は上書きしない(コメントは後ろに足す)
import type { QuickInput } from "@/lib/ai/quick-input-schema";
import type { DrinkFormValues } from "@/lib/drink-form";

const VALUE_FIELDS = ["rating", "bitterness", "aroma", "sweet_dry", "light_rich", "serving_temp"] as const;

export function applyQuickInput(
  values: DrinkFormValues,
  aiFilled: string[],
  input: QuickInput,
): { values: DrinkFormValues; aiFilled: string[] } {
  const next = { ...values };
  const filled = new Set(aiFilled);

  if (input.name && next.name.trim() === "") {
    next.name = input.name;
    filled.add("name");
  }
  for (const field of VALUE_FIELDS) {
    if (input[field] != null && next[field] == null) {
      (next[field] as unknown) = input[field];
      filled.add(field);
    }
  }
  if (input.comment) {
    next.comment = next.comment.trim() ? `${next.comment.trim()}\n${input.comment}` : input.comment;
    filled.add("comment");
  }
  return { values: next, aiFilled: [...filled] };
}
