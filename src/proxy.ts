import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

// ログインしなくても開ける URL
const PUBLIC_PATHS = ["/login", "/auth/callback"];

// すべての画面を開く前に通る。
// ・ログインの期限を更新する
// ・未ログインなら /login へ
// ・許可したメール以外ならログアウトさせて /login?error=not_allowed へ
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!isSupabaseConfigured()) {
    return isPublic ? NextResponse.next() : redirectTo(request, "/login?error=config");
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims はログイン情報(JWT)が本物かを確かめてから中身を返す
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // API は画面ではないので、ログイン画面へ移す代わりに 401 を返す
  const isApi = pathname.startsWith("/api/");

  if (!claims) {
    if (isApi) return NextResponse.json({ error: "ログインし直してください。" }, { status: 401 });
    return isPublic ? response : redirectTo(request, "/login", response);
  }

  if (!isAllowedEmail(claims.email)) {
    await supabase.auth.signOut();
    if (isApi) return NextResponse.json({ error: "このアカウントは使えません。" }, { status: 403 });
    return redirectTo(request, "/login?error=not_allowed", response);
  }

  // ログイン済みでログイン画面を開いたらトップへ
  if (pathname === "/login") {
    return redirectTo(request, "/", response);
  }

  return response;
}

// 更新したログイン情報(cookie)を引き継いだままリダイレクトする
function redirectTo(request: NextRequest, path: string, from?: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // 画像・フォントなどのファイルには通さない
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)"],
};
