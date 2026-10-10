import { Fredoka, Zen_Maru_Gothic } from "next/font/google";
import { LOGIN_ERRORS } from "@/lib/auth";
import { BeerStamp } from "./BeerStamp";
import { LoginButton } from "./LoginButton";

// ログイン画面だけで使う丸みのある文字(スタンプの英字と、アプリ名)
const fredoka = Fredoka({ subsets: ["latin"], weight: ["500"], display: "swap" });
const zenMaru = Zen_Maru_Gothic({ weight: ["400"], display: "swap", preload: false });

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? LOGIN_ERRORS[error] : undefined;

  return (
    <main className="login-dots mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-between px-9 pt-[12vh] pb-[max(env(safe-area-inset-bottom),64px)]">
      <div className="flex flex-col items-center gap-10">
        <BeerStamp fontFamily={fredoka.style.fontFamily} />
        <h1 className={`${zenMaru.className} text-[30px] font-normal tracking-[0.08em]`}>のみくらべノート</h1>
      </div>

      <div className="flex w-full flex-col gap-3">
        {message && (
          <p role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-[13px] text-(--color-danger)">
            {message}
          </p>
        )}
        <LoginButton fontClass={fredoka.className} />
      </div>
    </main>
  );
}
