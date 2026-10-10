// レポートの Your Summary(仕様書 §8.3)。アプリ側で集計した結果だけを渡し、数字の計算は AI にさせない
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import type { Kind } from "@/lib/kinds";

const SYSTEM = `あなたは、お酒の飲み比べ記録アプリのレポート画面の一番上に出す、短い要約を書きます。
渡される数字はアプリが計算済みのものです。その数字だけを使い、新しく計算したり事実を作ったりしないでください。
日本語のです・ます調で2〜3文、全体で120字以内。好みや最近の傾向を、断定しすぎずに伝えてください(「〜がお好きなようです」「最近は〜が多めです」)。
日本酒の特定名称は渡された日本語の名前(純米・特別純米 など)をそのまま使ってください。ビールなどのスタイル名(Stout など)・国名・銘柄名は渡された表記のままで構いません。
last_12_months は1件ずつ記録したものだけの数です。bulk_imported_tastings は過去の記録をまとめて登録した件数なので、「最近の傾向」や「ある月にたくさん飲んだ」とは書かないでください。
あいさつ・箇条書き・マークダウン・絵文字は使わないでください。`;

export async function writeReportComment(kind: Kind, stats: Record<string, unknown>): Promise<string> {
  const response = await anthropic().beta.messages.create({
    ...fallbackOptions(),
    model: aiModel(),
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: `お酒の種類: ${kind}\n集計(JSON):\n${JSON.stringify(stats)}` }],
  });
  if (response.stop_reason === "refusal") throw new AiError("The AI could not write a summary.", 422);
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join(" ")
    .trim();
  if (!text) throw new AiError("The AI returned an empty summary. Please try again.", 502);
  return text;
}
