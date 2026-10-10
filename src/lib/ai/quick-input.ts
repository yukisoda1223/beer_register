// 一文の感想を項目に分ける(仕様書 §8.4)。Web検索はしない
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import { cleanQuickInput, quickInputSchema, type QuickInput } from "@/lib/ai/quick-input-schema";
import { KIND_LABELS, type Kind } from "@/lib/kinds";

function systemPrompt(kind: Kind) {
  const label = KIND_LABELS[kind].toLowerCase();
  const common = `You help a Japanese person log the ${label} they drink. Read the short note they wrote (usually Japanese)
and split it into the record fields. Use null for anything not mentioned. Do not guess.

Guide for turning words into numbers:
- rating (overall stars, 0.5-5 in 0.5 steps): "★4", "4点", "4 stars" → 4. "★3.5" → 3.5. "最高" → 5, "微妙" → 2.5 or so
- Taste scales are -2.5 to +2.5 in 0.5 steps. 0 = average/normal. Mild wording → ±1, clear → ±1.5 to 2, extreme ("とても", "超", "強烈") → ±2.5
- comment: the rest of the note that did not become a field (food pairing, situation, impressions), in Japanese, close to the original wording
- name: only the product name (no stars or impressions)
- Fields that do not apply to ${label}: null`;
  const byKind: Record<Kind, string> = {
    beer: `
- bitterness (-2.5 weak … +2.5 strong): "苦め" → +1.5, "とても苦い"/"ガツンと苦い" → +2.5, "ほどよい苦み" → 0, "苦くない" → -2
- aroma_level (aroma richness, -2.5 subtle … +2.5 rich): "香りが良い"/"香り豊か" → +1.5, "ホップがすごく香る" → +2.5, "香りは控えめ" → -1`,
    sake: `
- sweet_dry (-2.5 sweet … +2.5 dry): "甘口" → -1.5, "とても甘い" → -2.5, "すっきり辛口"/"辛口" → +1.5, "超辛口" → +2.5
- aroma_level (-2.5 subtle … +2.5 fragrant): "香りは控えめ" → -1, "華やか"/"フルーティ" → +1.5, "とても華やか" → +2.5
- served: "冷酒"/"冷や"/"冷やして" → cold, "常温" → room, "ぬる燗" → warm, "熱燗" → hot`,
    whisky: `
- body (-2.5 light … +2.5 full): "軽い" → -1.5, "どっしり"/"重厚" → +1.5 to +2.5
- smoky (-2.5 gentle … +2.5 strong): "スモーキー" → +1.5, "ピートが強烈" → +2.5, "スモーキーさは控えめ" → -1
- served: "ストレート" → neat, "ロック" → rocks, "水割り"/"トワイスアップ" → water, "ハイボール" → highball, "カクテル" → cocktail`,
    cider: `
- sweet_dry (-2.5 sweet … +2.5 dry): "甘い" → -1.5, "ドライ"/"辛口" → +1.5`,
    wine: `
- sweet_dry (-2.5 sweet … +2.5 dry): "甘口" → -1.5, "辛口"/"ドライ" → +1.5
- body (-2.5 light … +2.5 full): "ライトボディ"/"軽い" → -1.5, "ミディアム" → 0, "フルボディ"/"重い" → +1.5 to +2.5`,
  };
  return common + byKind[kind];
}

export async function parseQuickInput(kind: Kind, input: string): Promise<QuickInput> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await anthropic().beta.messages.parse({
      ...fallbackOptions(),
      model: aiModel(),
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(quickInputSchema) },
      system: systemPrompt(kind),
      messages: [{ role: "user", content: input }],
    });
    if (response.stop_reason === "refusal") {
      throw new AiError("The AI could not read this note. Please fill it in by hand.", 422);
    }
    if (response.parsed_output) return cleanQuickInput(kind, response.parsed_output);
  }
  throw new AiError("Could not read the AI response. Please try again.", 502);
}
