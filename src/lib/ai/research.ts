// 銘柄名から Web 検索で情報を調べる(仕様書 §8.2)
import type Anthropic from "@anthropic-ai/sdk";
import { AiError, fallbackOptions, aiModel, anthropic } from "@/lib/ai/client";
import { categoriesFor, cleanResearchResult, researchToolSchema, type ResearchResult } from "@/lib/ai/research-schema";
import { KIND_LABELS, type Kind } from "@/lib/kinds";

const SUBMIT_TOOL = "submit_research";

function systemPrompt(kind: Kind) {
  const label = KIND_LABELS[kind];
  const items =
    kind === "beer"
      ? "正式な商品名、醸造所、所在地、国、都道府県、カテゴリ(ビアスタイル)、度数、参考価格と容量"
      : "正式な商品名、酒蔵、所在地、国、都道府県、特定名称、度数、精米歩合、日本酒度、酸度、酒米、参考価格と容量";
  return `あなたはお酒の情報を調べるアシスタントです。
ユーザーが入力した${label}の銘柄について、Web検索で次の項目を調べてください。
- ${items}

ルール:
- 学習済みの知識ではなく、必ずWeb検索で確かめた情報を使う。公式サイトやメーカーの情報を優先する。
- 参考価格はメーカー希望小売価格、なければ一般的な販売価格(円)。
- 見つからない項目は null にする。推測で埋めない。
- 同じ名前で別の商品(限定品・別の醸造所など)がある場合は、候補を最大3つ出す。該当する商品が見つからなければ candidates を空にする。
- カテゴリは次の一覧から選ぶ。合うものがなければ「その他」: ${categoriesFor(kind).join("、")}
- 国名・都道府県は日本語で書く(例: 日本、ベルギー、新潟県)。
- 参照したページのタイトルとURLを sources に入れる。
- 調べ終わったら、結果を必ず ${SUBMIT_TOOL} ツールで送る。文章での回答は不要。`;
}

// 1回分の問い合わせ。Web検索が長引いて一時停止(pause_turn)したら続きを頼む
async function askOnce(kind: Kind, name: string): Promise<unknown> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `銘柄名: ${name}` }];

  for (let i = 0; i < 3; i++) {
    const response = await anthropic().beta.messages.create({
      ...fallbackOptions(),
      model: aiModel(),
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: systemPrompt(kind),
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        {
          name: SUBMIT_TOOL,
          description: "調べた結果を送る。調査が終わったら必ず1回だけ呼ぶ。",
          strict: true,
          input_schema: researchToolSchema(kind),
        },
      ],
      tool_choice: { type: "auto" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      throw new AiError("この銘柄はAIで調べられませんでした。手入力でお願いします。", 422);
    }
    const submitted = response.content.find((b) => b.type === "tool_use" && b.name === SUBMIT_TOOL);
    if (submitted && submitted.type === "tool_use") return submitted.input;
    if (response.stop_reason !== "pause_turn") return null;
    messages.push({ role: "assistant", content: response.content });
  }
  return null;
}

// 形が合わなければ1回だけやり直す(仕様書 §8.1)
export async function researchDrink(kind: Kind, name: string): Promise<ResearchResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = cleanResearchResult(kind, await askOnce(kind, name));
    if (result) return result;
  }
  throw new AiError("AIの答えをうまく読み取れませんでした。もう一度お試しください。", 502);
}
