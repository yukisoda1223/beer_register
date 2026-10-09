import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// ログイン中のアカウントとログアウトボタン(レポートの一番下)
export async function AccountFooter() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await (await createClient()).auth.getClaims();
  const email = data?.claims?.email;
  if (!email) return null;

  return (
    <form action="/auth/logout" method="post" className="mt-4 flex flex-col items-center gap-2 text-[12px] text-(--color-text-sub)">
      <p>Signed in as {email}</p>
      <button
        type="submit"
        className="min-h-10 rounded-full border border-(--color-border) bg-(--color-surface) px-5 text-[13px] text-(--color-text)"
      >
        Sign out
      </button>
    </form>
  );
}
