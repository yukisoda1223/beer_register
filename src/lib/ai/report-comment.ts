// レポートの Your Summary(仕様書 §8.3)。アプリ側で集計した結果だけを渡し、数字の計算は AI にさせない
import { AiError, aiModel, anthropic, fallbackOptions } from "@/lib/ai/client";
import type { Kind } from "@/lib/kinds";

const SYSTEM = `You write a short, friendly summary of someone's drinking log for the top of their report screen.
You are given numbers that were already calculated. Use only those numbers; do not compute new ones or invent facts.
Write 2-3 sentences in English, 45 words at most. Point out a preference or a trend, softly ("you seem to enjoy…", "lately…").
No greetings, no lists, no markdown, no emoji.`;

export async function writeReportComment(kind: Kind, stats: Record<string, unknown>): Promise<string> {
  const response = await anthropic().beta.messages.create({
    ...fallbackOptions(),
    model: aiModel(),
    max_tokens: 2000,
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: `Drink type: ${kind}\nStats (JSON):\n${JSON.stringify(stats)}` }],
  });
  if (response.stop_reason === "refusal") throw new AiError("The AI could not write a summary.", 422);
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join(" ")
    .trim();
  if (!text) throw new AiError("The AI returned an empty summary. Please try again.", 502);
  return text;
}
