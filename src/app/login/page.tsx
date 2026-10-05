import { DrinkIcon } from "@/components/DrinkIcon";
import { LOGIN_ERRORS } from "@/lib/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? LOGIN_ERRORS[error] : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <DrinkIcon type="lager" size={56} />
          <DrinkIcon type="sake" size={56} />
        </div>
        <h1 className="text-2xl font-bold">のみくらべ帳</h1>
        <p className="text-[13px] text-(--color-text-sub)">ビールと日本酒の飲み比べ記録</p>
      </div>

      {message && (
        <p role="alert" className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {message}
        </p>
      )}

      <LoginButton />
    </main>
  );
}
