// 一文の感想を項目に分ける(仕様書 §8.4)。Web検索はしない
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import { cleanQuickInput, quickInputSchema, type QuickInput } from "@/lib/ai/quick-input-schema";
import { KIND_LABELS, type Kind } from "@/lib/kinds";

function systemPrompt(kind: Kind) {
  const common = `あなたは${KIND_LABELS[kind]}の飲み比べ記録の入力を手伝うアシスタントです。
ユーザーが書いた短い感想文を読み、記録の項目に分けてください。書かれていない項目は null にします。推測で埋めないでください。

言葉から数値への置き換えの目安(★は0.5〜5、0.5刻み):
- 「★4」「4点」「星4つ」→ 4。「★3.5」→ 3.5。「最高」→ 5、「微妙」→ 2.5 程度
- 香り: 「香りが良い」「華やか」→ 4、「香りが強い」「すごく華やか」→ 5、「香りは控えめ」→ 2
- comment には、項目に置き換えなかった感想(料理との相性、場面、飲み口の説明など)を元の言い回しを活かして入れる
- name は銘柄名・商品名の部分だけ(★や感想は含めない)`;
  const beer = `
- 苦み(bitterness): 「苦め」→ 4、「とても苦い」「ガツンと苦い」→ 5、「ほどよい苦み」→ 3、「苦くない」「苦みが弱い」→ 1.5
- sweet_dry・light_rich・serving_temp はビールでは使わないので null`;
  const sake = `
- 甘口〜辛口(sweet_dry, 1〜5の整数): 「甘口」→ 2、「とても甘い」→ 1、「すっきり辛口」「辛口」→ 4、「超辛口」→ 5、「やや辛口」→ 3〜4
- 淡麗〜濃醇(light_rich, 1〜5の整数): 「淡麗」「すっきり」→ 2、「濃醇」「濃い」「コクがある」→ 4、「とても濃厚」→ 5
- 飲んだ温度(serving_temp): 「冷や」「冷酒」「冷やして」→ cold、「常温」→ room、「ぬる燗」「燗」→ warm、「熱燗」→ hot
- bitterness は日本酒では使わないので null`;
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
      throw new AiError("この文章はAIで読み取れませんでした。手入力でお願いします。", 422);
    }
    if (response.parsed_output) return cleanQuickInput(kind, response.parsed_output);
  }
  throw new AiError("AIの答えをうまく読み取れませんでした。もう一度お試しください。", 502);
}
