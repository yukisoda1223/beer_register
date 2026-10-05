// ログインを許可するのは ALLOWED_EMAIL の1アカウントだけ(サーバー側でのみ使う)
export function isAllowedEmail(email: unknown, allowed = process.env.ALLOWED_EMAIL): boolean {
  if (typeof email !== "string" || !allowed) return false;
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}

// ログイン画面に出すエラーの文言(/login?error=○○)
export const LOGIN_ERRORS: Record<string, string> = {
  not_allowed: "このアカウントは使えません。",
  auth: "ログインに失敗しました。もう一度お試しください。",
  config: "Supabase の設定がまだです。.env.local に値を入れて、サーバーを起動し直してください。",
};
