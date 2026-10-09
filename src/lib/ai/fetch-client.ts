// 画面から AI の API を呼ぶ(ブラウザ側)。失敗したら日本語の文言つきの Error を投げる
export async function postAi<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(100_000),
    });
  } catch {
    throw new Error(navigator.onLine ? "This took too long and was stopped. Please try again." : "You seem to be offline.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "The AI request failed.");
  return data as T;
}
