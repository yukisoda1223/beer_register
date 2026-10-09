// 銘柄名から Web 検索で情報を調べる(仕様書 §8.2)
import type Anthropic from "@anthropic-ai/sdk";
import { AiError, fallbackOptions, aiModel, anthropic } from "@/lib/ai/client";
import {
  MAX_CANDIDATES,
  categoriesFor,
  cleanResearchResult,
  researchToolSchema,
  type ResearchResult,
} from "@/lib/ai/research-schema";
import type { Kind } from "@/lib/kinds";

const SUBMIT_TOOL = "submit_research";

function systemPrompt(kind: Kind) {
  const label = kind === "beer" ? "beer" : "sake";
  const items =
    kind === "beer"
      ? "official product name, brewery, brewery location, country, region, beer style, ABV, reference price and size"
      : "official product name, brewery, brewery location, country, region (prefecture), grade, ABV, polishing ratio, SMV, acidity, rice variety, reference price and size";
  return `You help a person log the ${label} they drink. Look up the ${label} the user typed, using web search, and find: ${items}.

Rules:
- Use what you confirm with web search, not memory. Prefer the official site or the brewery's own pages.
- Reference price: the suggested retail price in Japanese yen if available, otherwise a typical selling price converted to yen.
- If something cannot be found, use null. Do not guess.
- The input may be a single product, a product line, or just a brewery name. When it is a brewery name or matches several different products
  (for example a brewery that makes both an IPA and a lager, limited editions, or the same name from different breweries),
  return each product as a separate candidate (up to ${MAX_CANDIDATES}), most likely first. If nothing matches, return an empty candidates list.
- Style/grade must be one of: ${categoriesFor(kind).join(", ")}. Use "Other" if none fits.
- Write every text field in English: country names in English (Japan, Canada, Belgium); for Japan, region is the prefecture without "-ken"/"Prefecture" (e.g. Nagano);
  elsewhere region is the state, province or city (e.g. Ontario). Keep the product and brewery names as officially written.
- Put the titles and URLs of the pages you used in sources.
- When you are done, send the result with the ${SUBMIT_TOOL} tool. No prose answer is needed.`;
}

// 1回分の問い合わせ。Web検索が長引いて一時停止(pause_turn)したら続きを頼む
async function askOnce(kind: Kind, name: string): Promise<unknown> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `Name: ${name}` }];

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
          description: "Submit the research result. Call exactly once when the research is done.",
          strict: true,
          input_schema: researchToolSchema(kind),
        },
      ],
      tool_choice: { type: "auto" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      throw new AiError("The AI could not look this up. Please fill it in by hand.", 422);
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
  throw new AiError("Could not read the AI response. Please try again.", 502);
}
