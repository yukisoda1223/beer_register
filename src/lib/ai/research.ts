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
import { KIND_CONFIG } from "@/lib/kind-config";
import { KIND_LABELS, type Kind } from "@/lib/kinds";

const SUBMIT_TOOL = "submit_research";

const ITEMS: Record<Kind, string> = {
  beer: "official product name, brewery, brewery location, country, region, beer style, ABV, reference price and size",
  sake: "official product name, brewery, location, country, region (prefecture), grade, ABV, polishing ratio, SMV, acidity, rice variety, reference price and size",
  whisky: "official product name, distillery, location, country, region (e.g. Islay, Speyside, Kentucky), type, ABV, age statement, main cask type, peat level, reference price and size",
  cider: "official product name, cidery, location, country, region, style, ABV, apple or pear variety, reference price and size",
  wine: "official product name, winery, location, country, region or appellation, type (red, white…), grape varieties, vintage, ABV, reference price and size",
};

function systemPrompt(kind: Kind) {
  const label = KIND_LABELS[kind].toLowerCase();
  return `You help a Japanese person log the ${label} they drink. Look up the ${label} the user typed, using web search, and find: ${ITEMS[kind]}.

Rules:
- Use what you confirm with web search, not memory. Prefer the official site or the producer's own pages.
- Reference price: the suggested retail price in Japanese yen if available, otherwise a typical selling price converted to yen.
- If something cannot be found, use null. Do not guess.
- The input may be a single product, a product line, or just a producer name. When it is a producer name or matches several different products
  (different styles or expressions, limited editions, vintages, or the same name from different producers),
  return each product as a separate candidate (up to ${MAX_CANDIDATES}), most likely first. If nothing matches, return an empty candidates list.
- ${KIND_CONFIG[kind].categoryLabel} must be one of: ${categoriesFor(kind).join(", ")}. Use "Other" if none fits.
- Country and region in English (Japan, Canada, France; for Japan the prefecture without "-ken"/"Prefecture", e.g. Nagano).
  Keep product and producer names as officially written. price_note and note are written in Japanese.
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
