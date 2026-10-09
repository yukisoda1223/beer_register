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
    throw new Error(navigator.onLine ? "時間がかかりすぎたため中断しました。もう一度お試しください。" : "通信できません。");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "AIで処理できませんでした。");
  return data as T;
}
