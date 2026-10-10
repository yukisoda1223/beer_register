import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Google でログインしたあとに戻ってくる URL。受け取ったコードをログイン情報に交換する
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (!isAllowedEmail(data.user?.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=not_allowed`);
      }
      // ?welcome=1: ログイン直後の使い方紹介・ダイブを出す
      return NextResponse.redirect(`${origin}/?welcome=1`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
