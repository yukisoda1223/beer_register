import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// ログイン中のアカウントとログアウトボタン(レポートの一番下)
export async function AccountFooter() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await (await createClient()).auth.getClaims();
  const email = data?.claims?.email;
  if (!email) return null;

  return (
    <form action="/auth/logout" method="post" className="mt-4 flex flex-col items-center gap-2 text-[13px] text-(--color-text-sub)">
      <p>{email} でログイン中</p>
      <button
        type="submit"
        className="min-h-11 rounded-xl border border-(--color-border) bg-(--color-surface) px-5 text-(--color-text)"
      >
        ログアウト
      </button>
    </form>
  );
}
