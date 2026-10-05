// Claude API の呼び出し口(サーバー側でだけ使う。APIキーはブラウザに出さない)
import Anthropic from "@anthropic-ai/sdk";

export const AI_TIMEOUT_MS = 60_000;

export function aiModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
}

export function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
export function anthropic() {
  // 1回の呼び出しは60秒まで。自動の再試行は1回だけにして待ち時間を延ばしすぎない
  client ??= new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  return client;
}

// 安全のための判定で断られたとき、サーバー側で別のモデルが引き継ぐ設定
export function fallbackOptions() {
  return {
    betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[],
    fallbacks: "default" as const,
  };
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
  }
}
