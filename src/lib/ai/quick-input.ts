// 一文の感想を項目に分ける(仕様書 §8.4)。Web検索はしない
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import { cleanQuickInput, quickInputSchema, type QuickInput } from "@/lib/ai/quick-input-schema";
import type { Kind } from "@/lib/kinds";

function systemPrompt(kind: Kind) {
  const label = kind === "beer" ? "beer" : "sake";
  const common = `You help a person log the ${label} they drink. Read the short note they wrote (Japanese or English)
and split it into the record fields. Use null for anything not mentioned. Do not guess.

Guide for turning words into numbers (stars are 0.5-5 in 0.5 steps):
- "★4", "4点", "4 stars" → 4. "★3.5" → 3.5. "最高"/"amazing" → 5, "微妙"/"meh" → 2.5 or so
- Aroma: "香りが良い"/"華やか"/"aromatic" → 4, very aromatic → 5, "香りは控えめ"/"subtle" → 2
- comment: the rest of the note that did not become a field (food pairing, situation, impressions), kept close to the original wording
- name: only the product name (no stars or impressions)`;
  const beer = `
- Bitterness: "苦め"/"bitter" → 4, "とても苦い"/"very bitter" → 5, "ほどよい苦み"/"moderate" → 3, "苦くない"/"not bitter" → 1.5
- sweet_dry, light_rich and serving_temp are not used for beer: null`;
  const sake = `
- sweet_dry (integer 1-5, 1 = sweet, 5 = dry): "甘口"/"sweet" → 2, very sweet → 1, "すっきり辛口"/"辛口"/"dry" → 4, very dry → 5
- light_rich (integer 1-5, 1 = light, 5 = rich): "淡麗"/"すっきり"/"light" → 2, "濃醇"/"コクがある"/"rich" → 4, very rich → 5
- serving_temp: chilled ("冷や", "冷酒") → cold, room temperature ("常温") → room, "ぬる燗"/"燗"/warm → warm, "熱燗"/hot → hot
- bitterness is not used for sake: null`;
  return common + (kind === "beer" ? beer : sake);
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
