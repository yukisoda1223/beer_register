// 一文の感想を項目に分ける(仕様書 §8.4)。Web検索はしない
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import { cleanQuickInput, quickInputSchema, type QuickInput } from "@/lib/ai/quick-input-schema";
import { KIND_LABELS, type Kind } from "@/lib/kinds";

function systemPrompt(kind: Kind) {
  const label = KIND_LABELS[kind].toLowerCase();
  const common = `You help a Japanese person log the ${label} they drink. Read the short note they wrote (usually Japanese)
and split it into the record fields. Use null for anything not mentioned. Do not guess.

Guide for turning words into numbers (stars are 0.5-5 in 0.5 steps):
- "★4", "4点", "4 stars" → 4. "★3.5" → 3.5. "最高" → 5, "微妙" → 2.5 or so
- aroma (how good the aroma is): "香りが良い" → 4, "すごく良い香り" → 5
- comment: the rest of the note that did not become a field (food pairing, situation, impressions), in Japanese, close to the original wording
- name: only the product name (no stars or impressions)
- Fields that do not apply to ${label}: null`;
  const byKind: Record<Kind, string> = {
    beer: `
- bitterness: "苦め" → 4, "とても苦い"/"ガツンと苦い" → 5, "ほどよい苦み" → 3, "苦くない" → 1.5`,
    sake: `
- sweet_dry (integer 1-5, 1 = sweet, 5 = dry): "甘口" → 2, "とても甘い" → 1, "すっきり辛口"/"辛口" → 4, "超辛口" → 5
- aroma_level (integer 1-5, how strong the aroma is, 1 = subtle, 5 = fragrant): "香りは控えめ" → 2, "華やか"/"フルーティ" → 4, "とても華やか" → 5
- served: "冷酒"/"冷や"/"冷やして" → cold, "常温" → room, "ぬる燗" → warm, "熱燗" → hot`,
    whisky: `
- body (integer 1-5, 1 = light, 5 = full): "軽い" → 2, "どっしり"/"重厚" → 4-5
- smoky (stars): "スモーキー" → 4, "ピートが強烈" → 5, "スモーキーさは控えめ" → 2
- served: "ストレート" → neat, "ロック" → rocks, "水割り"/"トワイスアップ" → water, "ハイボール" → highball, "カクテル" → cocktail`,
    cider: `
- sweet_dry (integer 1-5, 1 = sweet, 5 = dry): "甘い" → 2, "ドライ"/"辛口" → 4`,
    wine: `
- sweet_dry (integer 1-5, 1 = sweet, 5 = dry): "甘口" → 2, "辛口"/"ドライ" → 4
- body (integer 1-5, 1 = light, 5 = full): "ライトボディ"/"軽い" → 2, "ミディアム" → 3, "フルボディ"/"重い" → 4-5`,
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
