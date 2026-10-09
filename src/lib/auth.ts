// ログインを許可するのは ALLOWED_EMAIL の1アカウントだけ(サーバー側でのみ使う)
export function isAllowedEmail(email: unknown, allowed = process.env.ALLOWED_EMAIL): boolean {
  if (typeof email !== "string" || !allowed) return false;
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}

// ログイン画面に出すエラーの文言(/login?error=○○)
export const LOGIN_ERRORS: Record<string, string> = {
  not_allowed: "This account can't be used.",
  auth: "Sign-in failed. Please try again.",
  config: "Supabase is not set up yet. Fill in .env.local and restart the server.",
};
